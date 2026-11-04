const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { handleAdvisorChat, refineAndSubmitPolicy, executeMediaBlitz } = require('../advisorEngine');

// Chat with the Economic Advisor
router.post('/chat', async (req, res) => {
  try {
    const { session_id, message, current_rate } = req.body;
    if (!session_id || !message) {
      return res.status(400).json({ error: 'session_id and message are required' });
    }

    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let state = JSON.parse(session.economic_state);

    // If client provided a verified live interest_rate, ensure state is aligned
    if (typeof current_rate === 'number' && !isNaN(current_rate)) {
      state.interest_rate = Number(current_rate.toFixed(2));
    }

    // Fetch this month's news articles to provide context to the Chief of Staff
    let newsArticles = db.prepare(`
      SELECT publisher, headline, body, tone, urgency, featured_variable, byline, dateline, whisper_quote
      FROM news_articles
      WHERE session_id = ? AND year = ? AND month = ?
    `).all(session_id, session.current_year, session.current_month);

    if (newsArticles.length === 0) {
      newsArticles = db.prepare(`
        SELECT publisher, headline, body, tone, urgency, featured_variable, byline, dateline, whisper_quote
        FROM news_articles
        WHERE session_id = ?
        ORDER BY year DESC, month DESC, created_at DESC
        LIMIT 4
      `).all(session_id);
    }

    // Fetch recent turn history for policy chronology
    const recentTurns = db.prepare(`
      SELECT year, month, quarter, month_in_quarter, action_type, action_value, statement
      FROM turn_history
      WHERE session_id = ?
      ORDER BY year DESC, month DESC, created_at DESC
      LIMIT 3
    `).all(session_id);

    // Fetch recent chat history (most recent 6 messages in chronological order, BEFORE inserting current message)
    const history = db.prepare(`
      SELECT sender, content FROM (
        SELECT sender, content, created_at FROM advisor_messages
        WHERE session_id = ?
        ORDER BY created_at DESC LIMIT 6
      ) ORDER BY created_at ASC
    `).all(session_id);

    // Save user message to database
    db.prepare(`
      INSERT INTO advisor_messages (id, session_id, sender, content)
      VALUES (?, ?, 'user', ?)
    `).run('msg_' + uuidv4().substring(0, 8), session_id, message);

    // Check system setting for API key and model
    const rowKey = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('deepseek_api_key');
    const apiKey = rowKey ? rowKey.value : (process.env.DEEPSEEK_API_KEY || null);

    const rowModel = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('deepseek_model');
    const model = rowModel ? rowModel.value : 'deepseek-v4-pro';

    const sessionMeta = {
      id: session.id,
      current_year: session.current_year,
      current_month: session.current_month,
      month_in_quarter: ((session.current_month - 1) % 3) + 1,
      current_quarter: Math.floor((session.current_month - 1) / 3) + 1,
      total_months_elapsed: session.total_months_elapsed,
      play_mode: session.play_mode,
      difficulty: session.difficulty,
      chair_name: session.chair_name,
      last_action: session.last_action,
      last_action_details: session.last_action_details,
      recentTurns
    };

    // Generate advisor response with full session metadata, live rate, and news context
    const chatResult = await handleAdvisorChat(message, state, history, apiKey, newsArticles, sessionMeta, model);
    const advisorReply = typeof chatResult === 'string' ? chatResult : chatResult.reply;
    const actionTaken = chatResult.action_taken || null;
    let policy = chatResult.policy || null;
    let mediaBlitz = chatResult.media_blitz || null;
    let updatedState = chatResult.updated_state || null;

    if (actionTaken === 'legislation_proposed' && policy) {
      const policyId = 'pol_' + uuidv4().substring(0, 8);
      db.prepare(`
        INSERT INTO policy_proposals (
          id, session_id, title, raw_idea, refined_legislation, target_sector,
          status, parliament_vote_for, parliament_vote_against, enacted_effects, year, month
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        policyId,
        session_id,
        policy.title,
        policy.raw_idea || message,
        policy.refined_legislation,
        policy.target_sector || 'general',
        policy.status,
        policy.parliament_vote_for,
        policy.parliament_vote_against,
        JSON.stringify(policy.effects || {}),
        session.current_year,
        session.current_month
      );
      policy.id = policyId;
      policy.year = session.current_year;
      policy.month = session.current_month;

      if (updatedState) {
        db.prepare('UPDATE game_sessions SET economic_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(JSON.stringify(updatedState), session_id);
      }
    } else if (actionTaken === 'media_blitz_executed' && mediaBlitz) {
      const blitzId = 'blz_' + uuidv4().substring(0, 8);
      db.prepare(`
        INSERT INTO media_blitzes (
          id, session_id, target_audience, strategic_message, public_response, impact_summary, year, month
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        blitzId,
        session_id,
        mediaBlitz.target_audience,
        mediaBlitz.strategic_message,
        mediaBlitz.public_response,
        mediaBlitz.impact_summary,
        session.current_year,
        session.current_month
      );
      mediaBlitz.id = blitzId;
      mediaBlitz.year = session.current_year;
      mediaBlitz.month = session.current_month;

      if (updatedState) {
        db.prepare('UPDATE game_sessions SET economic_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(JSON.stringify(updatedState), session_id);
      }
    }

    // Save advisor response
    db.prepare(`
      INSERT INTO advisor_messages (id, session_id, sender, content)
      VALUES (?, ?, 'advisor', ?)
    `).run('msg_' + uuidv4().substring(0, 8), session_id, advisorReply);

    res.json({
      success: true,
      reply: advisorReply,
      action_taken: actionTaken,
      policy,
      media_blitz: mediaBlitz,
      updated_state: updatedState
    });
  } catch (err) {
    console.error('Advisor chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch historical bills and media campaigns
router.get('/history/:sessionId', (req, res) => {
  try {
    const policies = db.prepare(`
      SELECT id, title, raw_idea, refined_legislation, target_sector, status,
             parliament_vote_for, parliament_vote_against, enacted_effects, year, month, created_at
      FROM policy_proposals
      WHERE session_id = ?
      ORDER BY created_at DESC
    `).all(req.params.sessionId);

    const media_blitzes = db.prepare(`
      SELECT id, target_audience, strategic_message, public_response, impact_summary,
             year, month, created_at
      FROM media_blitzes
      WHERE session_id = ?
      ORDER BY created_at DESC
    `).all(req.params.sessionId);

    res.json({ policies, media_blitzes });
  } catch (err) {
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

    // Retrieve API key and model if configured
    const rowKey = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('deepseek_api_key');
    const apiKey = rowKey ? rowKey.value : (process.env.DEEPSEEK_API_KEY || null);

    const rowModel = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('deepseek_model');
    const model = rowModel ? rowModel.value : 'deepseek-v4-pro';

    // Refine idea and conduct parliamentary vote
    const result = await refineAndSubmitPolicy(raw_idea, target_sector || 'general', state, apiKey, model);

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
    const refinedLeg = result.refined_legislation || result.refinedLegislation || 'Structural policy reform passed by Parliament.';
    const policyTitle = result.title || 'National Monetary & Credit Efficiency Bill';
    const polSector = result.target_sector || target_sector || 'general';

    db.prepare(`
      INSERT INTO policy_proposals (
        id, session_id, title, raw_idea, refined_legislation, target_sector,
        status, parliament_vote_for, parliament_vote_against, enacted_effects, year, month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      policyId,
      session_id,
      policyTitle,
      raw_idea,
      refinedLeg,
      polSector,
      result.status,
      result.parliament_vote_for,
      result.parliament_vote_against,
      JSON.stringify(result.effects || {}),
      session.current_year,
      session.current_month
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
router.post('/media-blitz', async (req, res) => {
  try {
    const { session_id, target_audience, strategic_message } = req.body;
    if (!session_id || !target_audience || !strategic_message) {
      return res.status(400).json({ error: 'session_id, target_audience, and strategic_message are required' });
    }

    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let state = JSON.parse(session.economic_state);

    const blitzResult = await executeMediaBlitz(target_audience, strategic_message, state);

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
      INSERT INTO media_blitzes (id, session_id, target_audience, strategic_message, public_response, impact_summary, year, month)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      blitzId,
      session_id,
      target_audience,
      strategic_message,
      blitzResult.public_response,
      blitzResult.impact_summary,
      session.current_year,
      session.current_month
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
