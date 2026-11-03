const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { 
  getInitialEconomicState, 
  getInitialChairState, 
  evolveEconomy, 
  calculateTaylorRule,
  generateDotPlot,
  calculateMpcVote,
  GOD_MODE_CHAIRS 
} = require('../simulationEngine');
const { generateMonthlyNews, generateWithLocalMacroEngine } = require('../newsEngine');
const { generateParliamentaryQuestions } = require('../parliamentEngine');

// Create a new game session
router.post('/new', async (req, res) => {
  try {
    const { 
      user_id, 
      chair_name, 
      play_mode, 
      difficulty, 
      economy_type, 
      starting_condition, 
      volatility, 
      skip_news 
    } = req.body;
    
    const effectiveDifficulty = difficulty || starting_condition || 'normal';
    const effectiveCondition = starting_condition || difficulty || 'normal';
    const effectiveEconomyType = economy_type || 'large_hegemon';
    const effectiveVolatility = volatility || 'normal';

    if (!user_id || !play_mode) {
      return res.status(400).json({ error: 'user_id and play_mode are required' });
    }

    const sessionId = 'ses_' + uuidv4().substring(0, 8);
    const economicState = getInitialEconomicState(effectiveDifficulty, effectiveEconomyType, effectiveCondition, effectiveVolatility);
    const chairState = getInitialChairState(play_mode, chair_name);

    // Generate Month 1 news stories (use instant local macro engine if skip_news or automated batch)
    let newsArticles;
    if (skip_news) {
      const publishers = ['gloomberg', 'doll_street'];
      if (effectiveDifficulty === 'normal' || effectiveDifficulty === 'hard') publishers.push('gotham');
      if (effectiveDifficulty === 'hard') publishers.push('cashington');
      newsArticles = publishers.map(pub => generateWithLocalMacroEngine(pub, economicState, 1, 1));
    } else {
      newsArticles = await generateMonthlyNews(economicState, effectiveDifficulty, 1, 1);
    }

    // Persist session, news, and inaugural turn in a single atomic transaction
    const createSessionTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO game_sessions (
          id, user_id, chair_name, play_mode, difficulty, economy_type, starting_condition, volatility, status,
          current_year, current_month, total_months_elapsed,
          economic_state, chair_state, last_action, last_action_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, 1, 0, ?, ?, 'initial_appointment', 'Appointed to office')
      `).run(
        sessionId,
        user_id,
        chairState.active_chair.name,
        play_mode,
        effectiveDifficulty,
        effectiveEconomyType,
        effectiveCondition,
        effectiveVolatility,
        JSON.stringify(economicState),
        JSON.stringify(chairState)
      );

      const insertNews = db.prepare(`
        INSERT INTO news_articles (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_variable, byline, dateline, whisper_quote)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          art.featured_variable,
          art.byline || '',
          art.dateline || '',
          art.whisper_quote || ''
        );
      }

      db.prepare(`
        INSERT INTO turn_history (id, session_id, year, month, quarter, month_in_quarter, action_type, action_value, statement, economic_snapshot, active_events)
        VALUES (?, ?, 1, 1, 1, 1, 'inaugural', '0', 'Sworn into office as Central Bank Chair', ?, ?)
      `).run(
        'trn_' + uuidv4().substring(0, 8),
        sessionId,
        JSON.stringify(economicState),
        JSON.stringify(economicState.active_events || [])
      );
    });

    createSessionTx();

    res.json({
      success: true,
      session: {
        id: sessionId,
        user_id,
        chair_name: chairState.active_chair.name,
        play_mode,
        difficulty: effectiveDifficulty,
        economy_type: effectiveEconomyType,
        starting_condition: effectiveCondition,
        volatility: effectiveVolatility,
        status: 'active',
        current_year: 1,
        current_month: 1,
        month_in_quarter: 1,
        current_quarter: 1,
        total_months_elapsed: 0,
        economic_state: economicState,
        chair_state: chairState,
        taylor_rule: calculateTaylorRule(economicState),
        dot_plot: generateDotPlot(economicState),
        news_articles: newsArticles
      }
    });
  } catch (err) {
    console.error('Error starting game:', err);
    res.status(500).json({ error: err.message });
  }
});

// List previous simulations for regular users with summary results
router.get('/simulations/list', (req, res) => {
  try {
    const userId = req.query.user_id;
    let query = 'SELECT * FROM game_sessions';
    let params = [];
    if (userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY updated_at DESC LIMIT 60';

    const rows = db.prepare(query).all(...params);
    const simulations = rows.map(r => {
      let econ = {};
      let chair = {};
      try { econ = JSON.parse(r.economic_state); } catch (e) {}
      try { chair = JSON.parse(r.chair_state); } catch (e) {}

      return {
        id: r.id,
        user_id: r.user_id,
        chair_name: r.chair_name,
        play_mode: r.play_mode,
        difficulty: r.difficulty,
        economy_type: r.economy_type || econ.economy_type || 'large_hegemon',
        starting_condition: r.starting_condition || econ.starting_condition || r.difficulty || 'normal',
        volatility: r.volatility || econ.volatility || 'normal',
        status: r.status,
        current_year: r.current_year,
        current_month: r.current_month,
        total_months_elapsed: r.total_months_elapsed,
        created_at: r.created_at,
        updated_at: r.updated_at,
        results: {
          interest_rate: econ.interest_rate ?? 4.25,
          inflation_cpi: econ.inflation_cpi ?? 2.0,
          parliamentary_approval: econ.parliamentary_approval ?? 60.0,
          public_approval: econ.public_approval ?? 55.0,
          job_security: econ.job_security ?? 65.0,
          warning_count: econ.warning_count ?? 0,
          reappointment_count: econ.reappointment_count ?? 0,
          market_credibility: econ.market_credibility ?? 75.0,
          last_action_details: r.last_action_details || 'In progress'
        }
      };
    });

    res.json({ simulations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to determine if a Parliamentary Hearing is currently due
function checkHearingEligible(session, economicState) {
  if (session.status !== 'active') return false;
  // Don't trigger during the inaugural quarter (first 3 months of game)
  if ((session.total_months_elapsed || 0) < 3) return false;

  // If already attended or declined in this specific round, not eligible again this month
  if (economicState.last_hearing_completed_month === session.total_months_elapsed) return false;
  if (economicState.last_hearing_skipped_month === session.total_months_elapsed) return false;

  // Enforce spacing: at least 3 months between hearings unless explicitly flagged as emergency summons
  const lastHearingRound = Math.max(
    economicState.last_hearing_completed_month ?? -99,
    economicState.last_hearing_skipped_month ?? -99
  );
  const monthsSinceHearing = session.total_months_elapsed - lastHearingRound;
  if (monthsSinceHearing < 3 && !economicState.hearing_pending) {
    return false;
  }

  // Statutory hearings:
  // - Hard mode: Quadmester oversight (every 4 months: Month 4, 8, 12...)
  // - Normal / Easy: Semi-annual oversight (Month 6, Month 12...)
  const isStatutoryMonth = session.difficulty === 'hard'
    ? (session.current_month % 4 === 0 || session.total_months_elapsed % 4 === 0)
    : (session.current_month === 6 || session.current_month === 12 || session.total_months_elapsed % 6 === 0);

  // Emergency summons:
  // - Explicitly flagged emergency summons
  // - Or formal warning issued and spacing met
  const isEmergency = (
    economicState.hearing_pending === true ||
    ((economicState.warning_count || 0) > 0 && monthsSinceHearing >= 3)
  );

  return Boolean(isStatutoryMonth || isEmergency);
}

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

    // Fetch news for current month
    const newsArticles = db.prepare(`
      SELECT publisher, headline, body, tone, urgency, featured_variable, byline, dateline, whisper_quote
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
    const media_blitzes = db.prepare(`
      SELECT id, target_audience, strategic_message, public_response, impact_summary, created_at
      FROM media_blitzes
      WHERE session_id = ?
      ORDER BY created_at DESC
    `).all(session.id);

    // Check if Parliamentary Hearing is eligible
    const hearingEligible = checkHearingEligible(session, economicState);

    // Check if 4-Year Term Review is eligible (Month 48)
    const termReviewEligible = (economicState.term_months_completed >= 48);

    res.json({
      session: {
        id: session.id,
        user_id: session.user_id,
        chair_name: session.chair_name,
        play_mode: session.play_mode,
        difficulty: session.difficulty,
        economy_type: session.economy_type || economicState.economy_type || 'large_hegemon',
        starting_condition: session.starting_condition || economicState.starting_condition || session.difficulty || 'normal',
        volatility: session.volatility || economicState.volatility || 'normal',
        status: session.status,
        current_year: session.current_year,
        current_month: session.current_month,
        month_in_quarter: monthInQuarter,
        current_quarter: currentQuarter,
        total_months_elapsed: session.total_months_elapsed,
        economic_state: economicState,
        chair_state: chairState,
        taylor_rule: calculateTaylorRule(economicState),
        dot_plot: generateDotPlot(economicState),
        news_articles: newsArticles,
        history,
        policies,
        media_blitzes,
        hearing_eligible: hearingEligible,
        term_review_eligible: termReviewEligible
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

    const { action_type, action_value, statement, decline_hearing } = req.body;
    const monthInQuarter = ((session.current_month - 1) % 3) + 1;

    let economicState = JSON.parse(session.economic_state);
    let chairState = JSON.parse(session.chair_state);

    // Enforce attendance at statutory Parliamentary Hearings in this round
    const hearingDue = checkHearingEligible(session, economicState);
    if (hearingDue) {
      if (decline_hearing) {
        // Apply decline penalties before advancing
        economicState.warning_count = Math.min(3, (economicState.warning_count || 0) + 1);
        economicState.parliamentary_approval = Number(Math.max(5, economicState.parliamentary_approval - 18.0).toFixed(1));
        economicState.public_approval = Number(Math.max(5, economicState.public_approval - 12.0).toFixed(1));
        economicState.market_credibility = Number(Math.max(10, (economicState.market_credibility || 75) - 6.0).toFixed(1));
        economicState.last_hearing_skipped_month = session.total_months_elapsed;
        economicState.hearing_pending = false;
        economicState.job_security = Number(Math.max(0, Math.min(100,
          economicState.parliamentary_approval * 0.45 + economicState.public_approval * 0.25 + economicState.market_credibility * 0.15 + (100 - Math.abs(economicState.inflation_cpi - 2.0) * 10) * 0.15 - (economicState.warning_count * 15)
        )).toFixed(1));
        if (economicState.warning_count >= 3 || economicState.job_security <= 5) {
          session.status = 'dismissed';
        }
      } else {
        return res.status(400).json({
          error: 'parliament_hearing_required',
          message: 'Statutory Parliamentary Summons: The Treasury Select Committee requires your testimony this month. You must attend the hearing or decline before advancing.',
          hearing_required: true
        });
      }
    }

    // Validate turn rules:
    // Months 1 & 2: say_nothing or guidance
    // Month 3: mpc_rate_decision
    if (monthInQuarter === 3 && action_type !== 'mpc_rate_decision') {
      return res.status(400).json({ error: 'Month 3 is the Monetary Policy Committee meeting. You must make an interest rate decision.' });
    }
    if (monthInQuarter !== 3 && action_type === 'mpc_rate_decision') {
      return res.status(400).json({ error: 'Interest rate decisions can only be made in Month 3 of the quarter.' });
    }

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

    // Generate news stories for the NEW month concurrently
    const newArticles = await generateMonthlyNews(newEconomicState, session.difficulty, nextYear, nextMonth);

    // Save action, turn history, news articles, and session state in a single atomic transaction
    const currentQuarter = Math.floor((session.current_month - 1) / 3) + 1;
    const saveTurnTx = db.transaction(() => {
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

      const insertNews = db.prepare(`
        INSERT INTO news_articles (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_variable, byline, dateline, whisper_quote)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          art.featured_variable,
          art.byline || '',
          art.dateline || '',
          art.whisper_quote || ''
        );
      }

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
    });

    saveTurnTx();

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
      dot_plot: generateDotPlot(newEconomicState),
      last_mpc_vote: newEconomicState.last_mpc_vote,
      news_articles: newArticles
    });
  } catch (err) {
    console.error('Error executing action:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Balance Sheet QT pace and Discount Window toggle (Pillar E)
router.post('/:sessionId/balance-sheet', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { qt_monthly_pace, discount_window_active } = req.body;
    let economicState = JSON.parse(session.economic_state);

    if (qt_monthly_pace !== undefined) {
      economicState.qt_monthly_pace = Math.max(-100, Math.min(100, parseFloat(qt_monthly_pace)));
    }
    if (discount_window_active !== undefined) {
      economicState.discount_window_active = Boolean(discount_window_active);
    }

    db.prepare(`
      UPDATE game_sessions
      SET economic_state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(economicState), session.id);

    res.json({
      success: true,
      economic_state: economicState
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FX Reserve Market Intervention Desk (for Middle and Small Open Economies)
router.post('/:sessionId/fx-intervention', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { action_type, amount_billions } = req.body; // 'defend_currency' or 'accumulate_reserves'
    let state = JSON.parse(session.economic_state);

    const amount = parseFloat(amount_billions) || (state.economy_type === 'small_emerging' ? 5.0 : 10.0);

    if (action_type === 'defend_currency' || action_type === 'sell_reserves') {
      const actualSpend = Math.min(state.fx_reserves_billions || 0, amount);
      state.fx_reserves_billions = Number(Math.max(0, (state.fx_reserves_billions || 0) - actualSpend).toFixed(1));
      state.currency_index = Number((state.currency_index + actualSpend * 0.45).toFixed(1));
      state.market_credibility = Number(Math.min(95, (state.market_credibility || 75) + 2.0).toFixed(1));
    } else {
      // Accumulate reserves
      state.fx_reserves_billions = Number(((state.fx_reserves_billions || 0) + amount).toFixed(1));
      state.currency_index = Number((state.currency_index - amount * 0.20).toFixed(1));
    }

    db.prepare(`
      UPDATE game_sessions
      SET economic_state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(state), session.id);

    res.json({
      success: true,
      action_type,
      amount_billions: amount,
      fx_reserves_billions: state.fx_reserves_billions,
      currency_index: state.currency_index,
      economic_state: state
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Dot-Plot projections (Pillar E)
router.get('/:sessionId/dot-plot', (req, res) => {
  try {
    const session = db.prepare('SELECT economic_state FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const economicState = JSON.parse(session.economic_state);
    res.json({
      dot_plot: generateDotPlot(economicState)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parliamentary Question Time Generator (Pillar D)
router.get('/:sessionId/parliament-hearing', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const state = JSON.parse(session.economic_state);

    // If hearing already completed in this round, questions are no longer visible
    if (state.last_hearing_completed_month === session.total_months_elapsed) {
      return res.json({
        hearing: {
          session_id: session.id,
          current_year: session.current_year,
          current_month: session.current_month,
          parliamentary_approval: state.parliamentary_approval,
          public_approval: state.public_approval,
          completed: true,
          completed_summary: state.last_hearing_summary || 'Your testimony has been concluded and entered into the Parliamentary Record for this legislative session.',
          questions: []
        }
      });
    }

    // If hearing was declined in this round, questions are no longer visible
    if (state.last_hearing_skipped_month === session.total_months_elapsed) {
      return res.json({
        hearing: {
          session_id: session.id,
          current_year: session.current_year,
          current_month: session.current_month,
          parliamentary_approval: state.parliamentary_approval,
          public_approval: state.public_approval,
          declined: true,
          completed_summary: state.last_hearing_declined_summary || 'The Governor declined this summons. Contempt penalties were applied.',
          questions: []
        }
      });
    }

    // Generate dynamic varied questions tailored to the current economic situation
    const questions = generateParliamentaryQuestions(state, session);

    res.json({
      hearing: {
        session_id: session.id,
        current_year: session.current_year,
        current_month: session.current_month,
        parliamentary_approval: state.parliamentary_approval,
        public_approval: state.public_approval,
        completed: false,
        questions
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Parliamentary Question Time Responses (Pillar D)
router.post('/:sessionId/parliament-hearing/testify', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { choices } = req.body; // e.g. { q_mortgage_cost: 'empathetic_disinflation', ... }
    let state = JSON.parse(session.economic_state);

    let netParlDelta = 0;
    let netPublicDelta = 0;
    let netAutonomyDelta = 0;
    let netCredibilityDelta = 0;

    // Compute deltas from choices
    for (const [qId, stratKey] of Object.entries(choices || {})) {
      if (stratKey === 'empathetic_disinflation') {
        netParlDelta += 6;
        netPublicDelta += 5;
        netCredibilityDelta += 2;
      } else if (stratKey === 'defiant_independence') {
        netParlDelta -= 2;
        netAutonomyDelta += 5;
        netCredibilityDelta += 6;
        netPublicDelta -= 2;
      } else if (stratKey === 'deflect_fiscal') {
        netParlDelta += 3;
        netCredibilityDelta += 4;
        netPublicDelta += 2;
      }
    }

    // Apply adjustments
    state.parliamentary_approval = Number(Math.max(5, Math.min(95, state.parliamentary_approval + netParlDelta)).toFixed(1));
    state.public_approval = Number(Math.max(5, Math.min(95, state.public_approval + netPublicDelta)).toFixed(1));
    state.central_bank_autonomy = Number(Math.max(40, Math.min(100, state.central_bank_autonomy + netAutonomyDelta)).toFixed(1));
    state.market_credibility = Number(Math.max(10, Math.min(98, (state.market_credibility || 75) + netCredibilityDelta)).toFixed(1));

    // Update job security
    state.job_security = Number(Math.max(0, Math.min(100, 
      state.parliamentary_approval * 0.45 + state.public_approval * 0.25 + state.market_credibility * 0.15 + (100 - Math.abs(state.inflation_cpi - 2.0) * 10) * 0.15 - ((state.warning_count || 0) * 15)
    )).toFixed(1));

    // Record that hearing has been completed for this round
    const summary = `Testimony concluded before Parliamentary Select Committee. Parliamentary Approval changed by ${netParlDelta >= 0 ? '+' : ''}${netParlDelta}%, Public Approval changed by ${netPublicDelta >= 0 ? '+' : ''}${netPublicDelta}%, Market Credibility +${netCredibilityDelta}%.`;
    state.last_hearing_completed_month = session.total_months_elapsed;
    state.last_hearing_summary = summary;
    state.hearing_pending = false;

    // Save updated state and increment hearings_completed
    db.prepare(`
      UPDATE game_sessions
      SET economic_state = ?, hearings_completed = COALESCE(hearings_completed, 0) + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(state), session.id);

    res.json({
      success: true,
      summary,
      parliamentary_approval: state.parliamentary_approval,
      public_approval: state.public_approval,
      central_bank_autonomy: state.central_bank_autonomy,
      market_credibility: state.market_credibility,
      job_security: state.job_security,
      economic_state: state
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Decline Parliamentary Hearing with Institutional Sanctions & Penalties
router.post('/:sessionId/parliament-hearing/decline', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let state = JSON.parse(session.economic_state);

    // Severe penalties for refusing statutory parliamentary summons
    const netParlDelta = -18.0;
    const netPublicDelta = -12.0;
    const netCredibilityDelta = -6.0;

    state.warning_count = Math.min(3, (state.warning_count || 0) + 1);
    state.parliamentary_approval = Number(Math.max(5, state.parliamentary_approval + netParlDelta).toFixed(1));
    state.public_approval = Number(Math.max(5, state.public_approval + netPublicDelta).toFixed(1));
    state.market_credibility = Number(Math.max(10, (state.market_credibility || 75) + netCredibilityDelta).toFixed(1));
    state.last_hearing_skipped_month = session.total_months_elapsed;
    state.hearing_pending = false;

    state.job_security = Number(Math.max(0, Math.min(100,
      state.parliamentary_approval * 0.45 + state.public_approval * 0.25 + state.market_credibility * 0.15 + (100 - Math.abs(state.inflation_cpi - 2.0) * 10) * 0.15 - (state.warning_count * 15)
    )).toFixed(1));

    let status = session.status;
    if (state.warning_count >= 3 || state.job_security <= 5) {
      status = 'dismissed';
    }

    const summary = `Governor declined to appear before the Parliamentary Select Committee. Lawmakers cited the Governor for contempt of Parliament, issuing a formal reprimand (+1 Warning, now ${state.warning_count}/3). Parliamentary Approval fell by ${Math.abs(netParlDelta)}%, Public Approval fell by ${Math.abs(netPublicDelta)}%, and Market Credibility fell by ${Math.abs(netCredibilityDelta)}%.`;
    state.last_hearing_declined_summary = summary;

    db.prepare(`
      UPDATE game_sessions
      SET economic_state = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(state), status, session.id);

    res.json({
      success: true,
      declined: true,
      summary,
      status,
      penalties: {
        parliamentary_approval_delta: netParlDelta,
        public_approval_delta: netPublicDelta,
        market_credibility_delta: netCredibilityDelta,
        warning_issued: true,
        new_warning_count: state.warning_count
      },
      parliamentary_approval: state.parliamentary_approval,
      public_approval: state.public_approval,
      market_credibility: state.market_credibility,
      job_security: state.job_security,
      economic_state: state
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4-Year Term (Month 48) Reappointment Review (Pillar D)
router.get('/:sessionId/term-review', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const state = JSON.parse(session.economic_state);
    const history = db.prepare('SELECT economic_snapshot FROM turn_history WHERE session_id = ?').all(session.id);

    // Compute metrics
    let totalInflationAbsDev = 0;
    let totalGdp = 0;
    let totalUnemp = 0;
    let count = 0;

    for (const h of history) {
      try {
        const snap = JSON.parse(h.economic_snapshot);
        totalInflationAbsDev += Math.abs((snap.inflation_cpi || 2.0) - 2.0);
        totalGdp += (snap.gdp_growth || 2.0);
        totalUnemp += (snap.unemployment_rate || 4.2);
        count++;
      } catch (e) {}
    }

    const avgInflationDev = count > 0 ? (totalInflationAbsDev / count).toFixed(2) : 1.2;
    const avgGdp = count > 0 ? (totalGdp / count).toFixed(2) : 2.1;
    const avgUnemployment = count > 0 ? (totalUnemp / count).toFixed(2) : 4.2;

    // Passing criteria:
    // Avg inflation deviation < 2.5%, Parliamentary approval > 40%, Job security > 35%
    const isApproved = (parseFloat(avgInflationDev) <= 2.8 && state.parliamentary_approval >= 40.0 && state.job_security >= 35.0);

    const scorecard = {
      chair_name: session.chair_name,
      months_in_office: state.term_months_completed || session.total_months_elapsed,
      avg_inflation_deviation: avgInflationDev,
      avg_gdp_growth: avgGdp,
      avg_unemployment: avgUnemployment,
      current_inflation: state.inflation_cpi,
      parliamentary_approval: state.parliamentary_approval,
      market_credibility: state.market_credibility || 75.0,
      verdict: isApproved ? 'REAPPOINTED' : 'NOT_REAPPOINTED',
      verdict_title: isApproved ? 'Confirmed for Second 4-Year Mandate' : 'Term Expired — Replaced by Parliamentary Council',
      citation: isApproved
        ? 'Having maintained institutional stability, anchored medium-term price expectations, and preserved the integrity of the currency, the President and Parliamentary Council hereby renew your appointment as Governor and Board Chair.'
        : 'While thanking you for your patriotic service during tumultuous economic cycles, Parliament has determined that persistent macroeconomic friction and public discontent require fresh leadership at the helm of the Central Bank.'
    };

    res.json({ scorecard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept Reappointment to Second Term (Pillar D)
router.post('/:sessionId/term-review/reappoint', (req, res) => {
  try {
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let state = JSON.parse(session.economic_state);
    let chairState = JSON.parse(session.chair_state);

    state.term_months_completed = 0; // reset for term 2
    state.reappointment_count = (state.reappointment_count || 0) + 1;
    state.central_bank_autonomy = Math.min(100, state.central_bank_autonomy + 5);
    state.market_credibility = Math.min(99, (state.market_credibility || 75) + 8);
    state.warning_count = 0; // clear warnings upon reappointment

    if (chairState.active_chair) {
      chairState.active_chair.title = 'Senior Governor & Reappointed Board Chair';
      chairState.active_chair.starting_trust = Math.min(100, chairState.active_chair.starting_trust + 15);
    }

    db.prepare(`
      UPDATE game_sessions
      SET economic_state = ?, chair_state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(state), JSON.stringify(chairState), session.id);

    res.json({
      success: true,
      message: 'Congratulations! You have been formally reappointed to a second 4-year mandate.',
      economic_state: state,
      chair_state: chairState
    });
  } catch (err) {
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

// Run automated simulation batch for regular users (e.g. 12, 24, 48 months)
router.post('/:sessionId/simulate-months', async (req, res) => {
  try {
    const { months } = req.body;
    const numMonths = Math.min(48, Math.max(1, parseInt(months, 10) || 12));
    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let econ = JSON.parse(session.economic_state);
    let chair = JSON.parse(session.chair_state);
    let currentYear = session.current_year;
    let currentMonth = session.current_month;
    let totalElapsed = session.total_months_elapsed;
    let status = session.status;

    const insertHistoryStmt = db.prepare(`
      INSERT INTO turn_history (id, session_id, year, month, quarter, month_in_quarter, action_type, action_value, statement, economic_snapshot, active_events)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Execute simulation loop and all history snapshot inserts in a single high-speed transaction
    const batchSimulationTx = db.transaction(() => {
      for (let i = 0; i < numMonths; i++) {
        if (status === 'dismissed') break;
        const monthInQ = ((currentMonth - 1) % 3) + 1;
        const currentQ = Math.floor((currentMonth - 1) / 3) + 1;
        let actionType = 'silence';
        let actionValue = '0';

        if (monthInQ === 3) {
          actionType = 'mpc_rate_decision';
          const taylor = calculateTaylorRule(econ);
          const diff = taylor - econ.interest_rate;
          const deltaBps = Math.round(diff * 4) * 25;
          actionValue = String(Math.max(-50, Math.min(50, deltaBps)));
        } else {
          actionType = 'guidance';
          actionValue = econ.inflation_cpi > 3.0 ? 'hawkish' : (econ.inflation_cpi < 1.8 ? 'dovish' : 'neutral');
        }

        econ = evolveEconomy(econ, { action_type: actionType, action_value: actionValue }, session.play_mode, session.difficulty, chair);

        // Record history snapshot so variable graphs have complete data points
        insertHistoryStmt.run(
          'trn_' + uuidv4().substring(0, 8),
          session.id,
          currentYear,
          currentMonth,
          currentQ,
          monthInQ,
          actionType,
          actionValue,
          `Automated ${actionType}: ${actionValue}`,
          JSON.stringify(econ),
          JSON.stringify(econ.active_events || [])
        );

        currentMonth += 1;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear += 1;
        }
        totalElapsed += 1;

        if (session.play_mode === 'first_person' && econ.job_security < 18.0 && econ.warning_count >= 3) {
          status = 'dismissed';
        }
        if (econ.term_months_completed >= 48 && status !== 'dismissed') {
          status = 'term_completed';
        }
      }

      db.prepare(`
        UPDATE game_sessions
        SET current_year = ?, current_month = ?, total_months_elapsed = ?,
            economic_state = ?, chair_state = ?, status = ?,
            last_action = 'automated_simulation', last_action_details = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        currentYear, 
        currentMonth, 
        totalElapsed, 
        JSON.stringify(econ), 
        JSON.stringify(chair), 
        status, 
        `Simulated ${numMonths} months (Year ${currentYear}, M${currentMonth})`, 
        session.id
      );
    });

    batchSimulationTx();

    res.json({
      success: true,
      current_year: currentYear,
      current_month: currentMonth,
      total_months_elapsed: totalElapsed,
      status,
      economic_state: econ
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete previous simulation
router.delete('/:sessionId', (req, res) => {
  try {
    db.prepare('DELETE FROM game_sessions WHERE id = ?').run(req.params.sessionId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
