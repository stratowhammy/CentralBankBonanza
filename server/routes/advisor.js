const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { handleAdvisorChat, refineAndSubmitPolicy, executeMediaBlitz } = require('../advisorEngine');

// Chat with the Economic Advisor
router.post('/chat', async (req, res) => {
  try {
    const { session_id, message } = req.body;
    if (!session_id || !message) {
      return res.status(400).json({ error: 'session_id and message are required' });
    }

    const session = db.prepare('SELECT current_year, current_month, economic_state FROM game_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const state = JSON.parse(session.economic_state);

    // Fetch this month's news articles to provide context to the Chief of Staff
    const newsArticles = db.prepare(`
      SELECT publisher, headline, body, tone, urgency, featured_variable, byline, dateline, whisper_quote
      FROM news_articles
      WHERE session_id = ? AND year = ? AND month = ?
    `).all(session_id, session.current_year, session.current_month);

    // Save user message
    db.prepare(`
      INSERT INTO advisor_messages (id, session_id, sender, content)
      VALUES (?, ?, 'user', ?)
    `).run('msg_' + uuidv4().substring(0, 8), session_id, message);

    // Fetch recent history
    const history = db.prepare(`
      SELECT sender, content FROM advisor_messages
      WHERE session_id = ?
      ORDER BY created_at ASC LIMIT 10
    `).all(session_id);

    // Check system setting for API key
    const rowKey = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('deepseek_api_key');
    const apiKey = rowKey ? rowKey.value : (process.env.DEEPSEEK_API_KEY || null);

    // Generate advisor response with full news article context
    const advisorReply = await handleAdvisorChat(message, state, history, apiKey, newsArticles);

    // Save advisor response
    db.prepare(`
      INSERT INTO advisor_messages (id, session_id, sender, content)
      VALUES (?, ?, 'advisor', ?)
    `).run('msg_' + uuidv4().substring(0, 8), session_id, advisorReply);

    res.json({ success: true, reply: advisorReply });
  } catch (err) {
    console.error('Advisor chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch chat history
router.get('/messages/:sessionId', (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT id, sender, content, created_at
      FROM advisor_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).all(req.params.sessionId);

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a policy idea to Parliament
router.post('/submit-policy', async (req, res) => {
  try {
    const { session_id, raw_idea, target_sector } = req.body;
    if (!session_id || !raw_idea) {
      return res.status(400).json({ error: 'session_id and raw_idea are required' });
    }

    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let state = JSON.parse(session.economic_state);

    // Refine idea and conduct parliamentary vote
    const result = await refineAndSubmitPolicy(raw_idea, target_sector || 'general', state);

    // Apply effects if passed
    if (result.status === 'passed' && result.effects) {
      for (const [key, val] of Object.entries(result.effects)) {
        if (state[key] !== undefined) {
          state[key] = Number((state[key] + val).toFixed(2));
        }
      }
    }

    // Save policy record
    const policyId = 'pol_' + uuidv4().substring(0, 8);
    db.prepare(`
      INSERT INTO policy_proposals (
        id, session_id, title, raw_idea, refined_legislation, target_sector,
        status, parliament_vote_for, parliament_vote_against, enacted_effects
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      policyId,
      session_id,
      result.title,
      raw_idea,
      result.refined_legislation,
      result.target_sector,
      result.status,
      result.parliament_vote_for,
      result.parliament_vote_against,
      JSON.stringify(result.effects)
    );

    // Update session economic state
    db.prepare('UPDATE game_sessions SET economic_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(state), session_id);

    res.json({
      success: true,
      policy: {
        id: policyId,
        ...result
      },
      updated_state: state
    });
  } catch (err) {
    console.error('Policy submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Launch Media Blitz
router.post('/media-blitz', (req, res) => {
  try {
    const { session_id, target_audience, strategic_message } = req.body;
    if (!session_id || !target_audience || !strategic_message) {
      return res.status(400).json({ error: 'session_id, target_audience, and strategic_message are required' });
    }

    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let state = JSON.parse(session.economic_state);

    const blitzResult = executeMediaBlitz(target_audience, strategic_message, state);

    // Apply blitz effects to state
    if (blitzResult.effects) {
      for (const [key, val] of Object.entries(blitzResult.effects)) {
        if (state[key] !== undefined) {
          state[key] = Number((state[key] + val).toFixed(2));
        }
      }
    }

    // Save record
    const blitzId = 'blz_' + uuidv4().substring(0, 8);
    db.prepare(`
      INSERT INTO media_blitzes (id, session_id, target_audience, strategic_message, public_response, impact_summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      blitzId,
      session_id,
      target_audience,
      strategic_message,
      blitzResult.public_response,
      blitzResult.impact_summary
    );

    db.prepare('UPDATE game_sessions SET economic_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(state), session_id);

    res.json({
      success: true,
      media_blitz: {
        id: blitzId,
        ...blitzResult
      },
      updated_state: state
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
