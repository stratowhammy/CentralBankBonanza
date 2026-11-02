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
    const hearingEligible = (
      session.current_month === 12 || 
      session.total_months_elapsed % 12 === 0 || 
      economicState.parliamentary_approval < 35.0
    );

    // Check if 4-Year Term Review is eligible (Month 48)
    const termReviewEligible = (economicState.term_months_completed >= 48);

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

    // Save new articles with bylines, datelines, and whisper quotes
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

    // 3 Contextual Parliamentary questions
    const questions = [
      {
        id: 'q_mortgage_cost',
        interrogator: 'MP Margaret Vance (Suburban Working Families Caucus)',
        question: `Chair, commercial mortgage rates have climbed to ${state.bank_lending_rate}%, and our Housing Cost Index sits at an alarming ${state.housing_cost_index}. Young couples are facing monthly payment spikes of $600 while corporate banks enjoy record net interest income. How do you justify squeezing working families who had zero role in creating global inflation?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Defiant Defense of Monetary Mandate',
            dialogue: 'The Central Bank\'s statutory duty is to price stability. Allowing high inflation to become embedded would inflict far worse long-term devastation on working families than transitory mortgage tightening.',
            parl_approval_delta: -3,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: -4
          },
          {
            key: 'empathetic_disinflation',
            label: 'Empathetic Acknowledgment with Disinflation Horizon',
            dialogue: 'We acutely recognize the severe pain facing mortgage holders. Our aggressive action is explicitly designed to crush underlying price pressures swiftly so that rates can normalize on a sustainable trajectory.',
            parl_approval_delta: 6,
            autonomy_delta: 0,
            market_credibility_delta: 2,
            public_approval_delta: 7
          },
          {
            key: 'deflect_fiscal',
            label: 'Deflect to Zoning & Fiscal Deficit Subsidies',
            dialogue: 'Shelter inflation is primarily driven by local housing supply bottlenecks and unchecked fiscal deficit spending ($' + Math.abs(state.fiscal_deficit) + '% of GDP), which monetary policy cannot construct houses to solve.',
            parl_approval_delta: 4,
            autonomy_delta: -2,
            market_credibility_delta: 4,
            public_approval_delta: 1
          }
        ]
      },
      {
        id: 'q_inflation_target',
        interrogator: 'MP Alistair Sterling (Shadow Treasury Spokesperson)',
        question: `Your headline inflation rate is ${state.inflation_cpi}%, with sticky services at ${state.sticky_cpi}%. Your theoretical Taylor Rule benchmark suggests policy is out of alignment. Are you losing your grip on wage-price spirals, or are you sleepwalking our economy into a stagflationary quagmire?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Reiterate Data-Dependent Resolution',
            dialogue: 'Our monetary transmission pipeline is operating with Friedman\'s known 12-month lags. Restrictive policy will bring inflation back to 2.0%, and the Committee will not hesitate to hike further if second-round wage effects persist.',
            parl_approval_delta: 2,
            autonomy_delta: 4,
            market_credibility_delta: 5,
            public_approval_delta: 0
          },
          {
            key: 'empathetic_disinflation',
            label: 'Highlight Flexible vs. Sticky Divergence',
            dialogue: 'We are closely dissecting volatile flexible goods from sticky core services. Global supply shocks are abating, and consumer price expectations remain well-anchored around our institutional commitment.',
            parl_approval_delta: 5,
            autonomy_delta: 1,
            market_credibility_delta: 3,
            public_approval_delta: 4
          },
          {
            key: 'deflect_fiscal',
            label: 'Demand Parliamentary Fiscal Discipline',
            dialogue: 'Monetary policy cannot act alone when Parliament continues expanding debt-to-GDP to ' + state.debt_to_gdp + '%. If lawmakers want lower inflation, you must assist us with responsible fiscal consolidation.',
            parl_approval_delta: -4,
            autonomy_delta: 2,
            market_credibility_delta: 7,
            public_approval_delta: 2
          }
        ]
      },
      {
        id: 'q_corporate_profits',
        interrogator: 'MP Chloe Morales (Labor & Industrial Select Committee)',
        question: `While real wages contracted by ${state.real_wage_growth}%, the Doll Street equity index sits at ${state.stock_market_index} and sovereign debt service costs continue to devour public budgets. Why should Parliament not revoke your statutory operational autonomy if you cannot preserve broad public prosperity?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Stern Warning Against Compromising Independence',
            dialogue: 'Tampering with central bank statutory independence is the fastest route to currency collapse, bond market capital flight, and hyperinflation. Our independence is the bedrock of the nation\'s financial credibility.',
            parl_approval_delta: -2,
            autonomy_delta: 8,
            market_credibility_delta: 8,
            public_approval_delta: -2
          },
          {
            key: 'empathetic_disinflation',
            label: 'Pledge Balanced Dual Mandate Stewardship',
            dialogue: 'Our mandate serves every citizen. We do not target stock market wealth, and we monitor unemployment hysteresis constantly to ensure rate hikes do not needlessly destroy jobs.',
            parl_approval_delta: 7,
            autonomy_delta: 1,
            market_credibility_delta: 2,
            public_approval_delta: 6
          },
          {
            key: 'deflect_fiscal',
            label: 'Clarify Statutory Separation of Powers',
            dialogue: 'Taxation of corporate profits and income redistribution are the exclusive domain of elected Parliament. The central bank manages aggregate nominal demand—nothing more, nothing less.',
            parl_approval_delta: 3,
            autonomy_delta: 3,
            market_credibility_delta: 4,
            public_approval_delta: 1
          }
        ]
      }
    ];

    res.json({
      hearing: {
        session_id: session.id,
        current_year: session.current_year,
        current_month: session.current_month,
        parliamentary_approval: state.parliamentary_approval,
        public_approval: state.public_approval,
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
        netParlDelta += 1;
        netCredibilityDelta += 4;
        netPublicDelta += 1;
      }
    }

    // Apply adjustments
    state.parliamentary_approval = Number(Math.max(5, Math.min(95, state.parliamentary_approval + netParlDelta)).toFixed(1));
    state.public_approval = Number(Math.max(5, Math.min(95, state.public_approval + netPublicDelta)).toFixed(1));
    state.central_bank_autonomy = Number(Math.max(40, Math.min(100, state.central_bank_autonomy + netAutonomyDelta)).toFixed(1));
    state.market_credibility = Number(Math.max(10, Math.min(98, (state.market_credibility || 75) + netCredibilityDelta)).toFixed(1));

    // Update job security
    state.job_security = Number(Math.max(0, Math.min(100, 
      state.parliamentary_approval * 0.45 + state.public_approval * 0.25 + state.market_credibility * 0.15 + (100 - Math.abs(state.inflation_cpi - 2.0) * 10) * 0.15
    )).toFixed(1));

    // Save updated state
    db.prepare(`
      UPDATE game_sessions
      SET economic_state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(state), session.id);

    res.json({
      success: true,
      summary: `Testimony concluded before Parliamentary Select Committee. Parliamentary Approval changed by ${netParlDelta >= 0 ? '+' : ''}${netParlDelta}%, Public Approval changed by ${netPublicDelta >= 0 ? '+' : ''}${netPublicDelta}%, Market Credibility +${netCredibilityDelta}%.`,
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

    for (let i = 0; i < numMonths; i++) {
      if (status === 'dismissed') break;
      const monthInQ = ((currentMonth - 1) % 3) + 1;
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
