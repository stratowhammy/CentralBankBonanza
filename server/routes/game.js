const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { 
  getInitialEconomicState, 
  getInitialChairState, 
  evolveEconomy, 
  calculateTaylorRule,
  GOD_MODE_CHAIRS 
} = require('../simulationEngine');
const { generateMonthlyNews } = require('../newsEngine');

// Create a new game session
router.post('/new', async (req, res) => {
  try {
    const { user_id, chair_name, play_mode, difficulty } = req.body;
    
    if (!user_id || !play_mode || !difficulty) {
      return res.status(400).json({ error: 'user_id, play_mode, and difficulty are required' });
    }

    const sessionId = 'ses_' + uuidv4().substring(0, 8);
    const economicState = getInitialEconomicState(difficulty);
    const chairState = getInitialChairState(play_mode, chair_name);

    // Initial save of the session
    db.prepare(`
      INSERT INTO game_sessions (
        id, user_id, chair_name, play_mode, difficulty, status,
        current_year, current_month, total_months_elapsed,
        economic_state, chair_state, last_action, last_action_details
      ) VALUES (?, ?, ?, ?, ?, 'active', 1, 1, 0, ?, ?, 'initial_appointment', 'Appointed to office')
    `).run(
      sessionId,
      user_id,
      chairState.active_chair.name,
      play_mode,
      difficulty,
      JSON.stringify(economicState),
      JSON.stringify(chairState)
    );

    // Generate Month 1 news stories
    const newsArticles = await generateMonthlyNews(economicState, difficulty, 1, 1);
    
    const insertNews = db.prepare(`
      INSERT INTO news_articles (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_variable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const art of newsArticles) {
      insertNews.run(
        'art_' + uuidv4().substring(0, 8),
        sessionId,
        1,
        1,
        art.publisher,
        art.headline,
        art.body,
        art.tone,
        art.urgency,
        art.featured_variable
      );
    }

    // Save initial turn snapshot
    db.prepare(`
      INSERT INTO turn_history (id, session_id, year, month, quarter, month_in_quarter, action_type, action_value, statement, economic_snapshot, active_events)
      VALUES (?, ?, 1, 1, 1, 1, 'inaugural', '0', 'Sworn into office as Central Bank Chair', ?, ?)
    `).run(
      'trn_' + uuidv4().substring(0, 8),
      sessionId,
      JSON.stringify(economicState),
      JSON.stringify(economicState.active_events || [])
    );

    res.json({
      success: true,
      session: {
        id: sessionId,
        user_id,
        chair_name: chairState.active_chair.name,
        play_mode,
        difficulty,
        status: 'active',
        current_year: 1,
        current_month: 1,
        month_in_quarter: 1,
        current_quarter: 1,
        total_months_elapsed: 0,
        economic_state: economicState,
        chair_state: chairState,
        taylor_rule: calculateTaylorRule(economicState),
        news_articles: newsArticles
      }
    });
  } catch (err) {
    console.error('Error starting game:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get current game session state
router.get('/:sessionId', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Game session not found' });
    }

    const economicState = JSON.parse(session.economic_state);
    const chairState = JSON.parse(session.chair_state);
    
    const monthInQuarter = ((session.current_month - 1) % 3) + 1;
    const currentQuarter = Math.floor((session.current_month - 1) / 3) + 1;

    // Fetch news for the current month
    const newsArticles = db.prepare(`
      SELECT publisher, headline, body, tone, urgency, featured_variable
      FROM news_articles
      WHERE session_id = ? AND year = ? AND month = ?
    `).all(session.id, session.current_year, session.current_month);

    // Fetch history
    const history = db.prepare(`
      SELECT year, month, quarter, month_in_quarter, action_type, action_value, statement, economic_snapshot
      FROM turn_history
      WHERE session_id = ?
      ORDER BY year ASC, month ASC
    `).all(session.id);

    // Fetch policy proposals
    const policies = db.prepare(`
      SELECT id, title, raw_idea, refined_legislation, target_sector, status, parliament_vote_for, parliament_vote_against, created_at
      FROM policy_proposals
      WHERE session_id = ?
      ORDER BY created_at DESC
    `).all(session.id);

    // Fetch media blitzes
    const mediaBlitzes = db.prepare(`
      SELECT id, target_audience, strategic_message, public_response, impact_summary, created_at
      FROM media_blitzes
      WHERE session_id = ?
      ORDER BY created_at DESC
    `).all(session.id);

    res.json({
      session: {
        id: session.id,
        user_id: session.user_id,
        chair_name: session.chair_name,
        play_mode: session.play_mode,
        difficulty: session.difficulty,
        status: session.status,
        current_year: session.current_year,
        current_month: session.current_month,
        month_in_quarter: monthInQuarter,
        current_quarter: currentQuarter,
        total_months_elapsed: session.total_months_elapsed,
        economic_state: economicState,
        chair_state: chairState,
        taylor_rule: calculateTaylorRule(economicState),
        news_articles: newsArticles,
        history,
        policies,
        media_blitzes
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Take turn action (Month 1/2 guidance vs Month 3 MPC decision)
router.post('/:sessionId/action', async (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Game session not found' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'This game session is no longer active' });
    }

    const { action_type, action_value, statement } = req.body;
    const monthInQuarter = ((session.current_month - 1) % 3) + 1;

    // Validate turn rules:
    // Months 1 & 2: say_nothing or guidance
    // Month 3: mpc_rate_decision
    if (monthInQuarter === 3 && action_type !== 'mpc_rate_decision') {
      return res.status(400).json({ error: 'Month 3 is the Monetary Policy Committee meeting. You must make an interest rate decision.' });
    }
    if (monthInQuarter !== 3 && action_type === 'mpc_rate_decision') {
      return res.status(400).json({ error: 'Interest rate decisions can only be made in Month 3 of the quarter.' });
    }

    let economicState = JSON.parse(session.economic_state);
    let chairState = JSON.parse(session.chair_state);

    // Evolve the economy
    const newEconomicState = evolveEconomy(
      economicState,
      { action_type, action_value, statement },
      session.play_mode,
      session.difficulty,
      chairState
    );

    // Advance Chair State
    if (session.play_mode === 'god_mode') {
      const activeChair = chairState.active_chair;
      activeChair.tenure_months += 1;
      
      // Gain trust the longer they stay, boosted if inflation is near 2.0%
      const inflationPerformance = Math.abs(newEconomicState.inflation_cpi - 2.0);
      const trustGain = inflationPerformance < 0.8 ? 1.4 : (inflationPerformance < 2.0 ? 0.8 : -0.3);
      activeChair.starting_trust = Math.max(15, Math.min(100, activeChair.starting_trust + trustGain));
      chairState.cumulative_years_managed = Math.floor((session.total_months_elapsed + 1) / 12);
    } else {
      // First Person Mode
      chairState.active_chair.tenure_months += 1;
      
      // Check for dismissal conditions
      if (newEconomicState.job_security < 18.0 && newEconomicState.warning_count >= 3) {
        session.status = 'dismissed';
      }
    }

    // Advance Calendar: Month 1..12, Year increments after Month 12
    let nextMonth = session.current_month + 1;
    let nextYear = session.current_year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const nextTotalMonths = session.total_months_elapsed + 1;

    // Generate news stories for the NEW month
    const newArticles = await generateMonthlyNews(newEconomicState, session.difficulty, nextYear, nextMonth);

    // Save action and turn history
    const currentQuarter = Math.floor((session.current_month - 1) / 3) + 1;
    db.prepare(`
      INSERT INTO turn_history (id, session_id, year, month, quarter, month_in_quarter, action_type, action_value, statement, economic_snapshot, active_events)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'trn_' + uuidv4().substring(0, 8),
      session.id,
      session.current_year,
      session.current_month,
      currentQuarter,
      monthInQuarter,
      action_type,
      String(action_value || ''),
      statement || '',
      JSON.stringify(newEconomicState),
      JSON.stringify(newEconomicState.active_events || [])
    );

    // Save new articles
    const insertNews = db.prepare(`
      INSERT INTO news_articles (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_variable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const art of newArticles) {
      insertNews.run(
        'art_' + uuidv4().substring(0, 8),
        session.id,
        nextYear,
        nextMonth,
        art.publisher,
        art.headline,
        art.body,
        art.tone,
        art.urgency,
        art.featured_variable
      );
    }

    // Update game session
    db.prepare(`
      UPDATE game_sessions
      SET current_year = ?, current_month = ?, total_months_elapsed = ?,
          economic_state = ?, chair_state = ?, status = ?,
          last_action = ?, last_action_details = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      nextYear,
      nextMonth,
      nextTotalMonths,
      JSON.stringify(newEconomicState),
      JSON.stringify(chairState),
      session.status,
      action_type,
      statement || `${action_type}: ${action_value}`,
      session.id
    );

    const nextMonthInQuarter = ((nextMonth - 1) % 3) + 1;
    const nextQuarter = Math.floor((nextMonth - 1) / 3) + 1;

    res.json({
      success: true,
      current_year: nextYear,
      current_month: nextMonth,
      month_in_quarter: nextMonthInQuarter,
      current_quarter: nextQuarter,
      total_months_elapsed: nextTotalMonths,
      status: session.status,
      economic_state: newEconomicState,
      chair_state: chairState,
      taylor_rule: calculateTaylorRule(newEconomicState),
      news_articles: newArticles
    });
  } catch (err) {
    console.error('Error executing action:', err);
    res.status(500).json({ error: err.message });
  }
});

// Switch chair in God Mode
router.post('/:sessionId/switch-chair', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.play_mode !== 'god_mode') {
      return res.status(400).json({ error: 'Chair switching is only available in God Mode' });
    }

    const { next_chair_id } = req.body;
    let chairState = JSON.parse(session.chair_state);
    
    // Archive current chair
    if (chairState.active_chair) {
      chairState.chair_history.push({
        ...chairState.active_chair,
        tenure_end_year: session.current_year,
        tenure_end_month: session.current_month
      });
    }

    // Find and appoint new chair
    const selectedTemplate = GOD_MODE_CHAIRS.find(c => c.id === next_chair_id) || GOD_MODE_CHAIRS[0];
    chairState.active_chair = { ...selectedTemplate, tenure_months: 0 };

    db.prepare(`
      UPDATE game_sessions
      SET chair_name = ?, chair_state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(selectedTemplate.name, JSON.stringify(chairState), session.id);

    res.json({ success: true, chair_state: chairState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
