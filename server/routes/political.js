const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { 
  getInitialPoliticalState, 
  evolvePoliticalState, 
  generatePoliticalNews, 
  checkForPoliticalEvent,
  calculateWhipVoteCount,
  PARLIAMENTARY_TRACKS,
  CONGRESSIONAL_TRACKS
} = require('../politicalEngine');
const { getInitialEconomicState, evolveEconomy } = require('../simulationEngine');
const { handlePoliticalAdvisorChat, draftStatutoryBill } = require('../politicalAdvisorEngine');

// Get full political events catalog
router.get('/events-catalog', (req, res) => {
  try {
    const web = require('../political_event_web.json');
    res.json(web);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load political events catalog' });
  }
});

// Create a new political simulation session
router.post('/new', async (req, res) => {
  try {
    const { 
      user_id, 
      politician_name, 
      system_type, 
      selected_track, 
      party_name, 
      district_name,
      linked_cbs_session_id 
    } = req.body;

    if (!user_id || !politician_name) {
      return res.status(400).json({ error: 'user_id and politician_name are required' });
    }

    const effectiveSystem = system_type || 'parliamentary';
    const effectiveParty = party_name || (effectiveSystem === 'parliamentary' ? 'Democratic Alliance' : 'Conservative Union');
    const effectiveDistrict = district_name || (effectiveSystem === 'parliamentary' ? 'Highland Greenshire' : 'Industrial 4th Congressional District');

    const sessionId = 'ps_' + uuidv4().substring(0, 8);
    
    // Initialize Political State
    const politicalState = getInitialPoliticalState(effectiveSystem, selected_track, effectiveParty, effectiveDistrict);
    politicalState.politician_name = politician_name;

    // Initialize Shared Economic State (or link from CBS session if provided)
    let economicState;
    if (linked_cbs_session_id) {
      const cbsRow = db.prepare('SELECT economic_state FROM game_sessions WHERE id = ?').get(linked_cbs_session_id);
      if (cbsRow) {
        economicState = JSON.parse(cbsRow.economic_state);
      }
    }
    if (!economicState) {
      economicState = getInitialEconomicState('normal', 'large_hegemon', 'normal', 'normal');
    }

    // Initial starter bill
    const initialBillId = 'pb_' + uuidv4().substring(0, 8);
    const starterBillTitle = effectiveSystem === 'parliamentary' 
      ? 'Regional Energy & Transit Infrastructure Accord' 
      : 'District Manufacturing & Clean Grid Investment Act';

    const starterStatute = draftStatutoryBill(starterBillTitle, 'infrastructure', 22, politicalState);

    // Initial news dispatches
    const initialNews = generatePoliticalNews(politicalState, economicState, 1, 1);

    // Persist in atomic transaction
    const createTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO political_sessions (
          id, user_id, politician_name, system_type, political_track, party_name, party_ideology, district_name,
          status, current_year, current_month, total_months_elapsed, months_to_election, linked_cbs_session_id,
          political_state, economic_state, active_events
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, 1, 0, ?, ?, ?, ?, ?)
      `).run(
        sessionId,
        user_id,
        politician_name,
        effectiveSystem,
        politicalState.current_stage_id,
        effectiveParty,
        politicalState.party_ideology,
        effectiveDistrict,
        politicalState.months_to_election,
        linked_cbs_session_id || null,
        JSON.stringify(politicalState),
        JSON.stringify(economicState),
        JSON.stringify([])
      );

      // Insert starter bill
      db.prepare(`
        INSERT INTO political_bills (
          id, session_id, title, summary, statutory_text, category, fiscal_impact_billions, status, committee_name, public_support, year_introduced, month_introduced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_committee', ?, 64, 1, 1)
      `).run(
        initialBillId,
        sessionId,
        starterBillTitle,
        'Key inaugural legislative initiative funding district transportation and regional utility resilience.',
        starterStatute,
        'infrastructure',
        22,
        politicalState.committee_name
      );

      // Insert initial news dispatches
      const insertNews = db.prepare(`
        INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const n of initialNews) {
        insertNews.run(
          'pn_' + uuidv4().substring(0, 8),
          sessionId,
          1,
          1,
          n.publisher,
          n.headline,
          n.body,
          n.tone,
          n.urgency,
          n.featured_issue
        );
      }

      // Initial Chief of Staff greeting message
      const initialGreeting = `<think>
[INAUGURAL BRIEFING]
- Welcome ${politician_name} as the newly appointed ${politicalState.politician_title} for ${politicalState.district_name}.
- Current mandate: Maintain district support, advance legislative priority bills, and navigate macroeconomic headwinds.
</think>

Welcome to your office, ${politicalState.politician_title} ${politician_name}.

As your Chief of Staff, my team and I are at your complete disposal. We have already prepared our inaugural legislative docket and referred the **${starterBillTitle}** to our committee for markup.

You can instruct me anytime to:
* **Draft legislation** on any policy issue.
* **Run a floor whip count** to assess our party votes.
* **Organize town halls, fundraisers, or press blitzes**.

Let us make your tenure a landmark success. What are your immediate directives for this month?`;

      db.prepare(`
        INSERT INTO political_advisor_messages (id, session_id, sender, content)
        VALUES (?, ?, 'advisor', ?)
      `).run('pam_' + uuidv4().substring(0, 8), sessionId, initialGreeting);

      // Inaugural turn history
      db.prepare(`
        INSERT INTO political_turn_history (id, session_id, year, month, action_type, action_details, political_snapshot, economic_snapshot, active_events)
        VALUES (?, ?, 1, 1, 'inaugural', 'Inauguration & Assumption of Office', ?, ?, '[]')
      `).run(
        'pth_' + uuidv4().substring(0, 8),
        sessionId,
        JSON.stringify(politicalState),
        JSON.stringify(economicState)
      );
    });

    createTx();

    const created = await getSessionFull(sessionId);
    res.json({ session: created });
  } catch (err) {
    console.error('Error creating political session:', err);
    res.status(500).json({ error: err.message || 'Failed to create political session' });
  }
});

// Helper to fetch full session state with related entities
async function getSessionFull(sessionId) {
  const sessionRow = db.prepare('SELECT * FROM political_sessions WHERE id = ?').get(sessionId);
  if (!sessionRow) return null;

  const bills = db.prepare('SELECT * FROM political_bills WHERE session_id = ? ORDER BY created_at DESC').all(sessionId);
  const news = db.prepare('SELECT * FROM political_news_dispatches WHERE session_id = ? ORDER BY year DESC, month DESC LIMIT 15').all(sessionId);
  const history = db.prepare('SELECT * FROM political_turn_history WHERE session_id = ? ORDER BY year ASC, month ASC').all(sessionId);
  const messages = db.prepare('SELECT * FROM political_advisor_messages WHERE session_id = ? ORDER BY created_at ASC').all(sessionId);

  return {
    ...sessionRow,
    political_state: JSON.parse(sessionRow.political_state),
    economic_state: JSON.parse(sessionRow.economic_state),
    active_events: JSON.parse(sessionRow.active_events || '[]'),
    bills,
    news,
    history,
    messages
  };
}

// Get single political session
router.get('/session/:id', async (req, res) => {
  try {
    const full = await getSessionFull(req.params.id);
    if (!full) return res.status(404).json({ error: 'Political session not found' });
    res.json({ session: full });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all political sessions for a user
router.get('/sessions', (req, res) => {
  try {
    const userId = req.query.user_id || 'user_guest_default';
    const rows = db.prepare('SELECT * FROM political_sessions WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
    const sessions = rows.map(r => ({
      ...r,
      political_state: JSON.parse(r.political_state),
      economic_state: JSON.parse(r.economic_state),
      active_events: JSON.parse(r.active_events || '[]')
    }));
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit monthly primary action & advance turn
router.post('/session/:id/action', async (req, res) => {
  try {
    const { action_type, action_details, event_choice } = req.body;
    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let currentYear = session.current_year;
    let currentMonth = session.current_month + 1;
    let elapsed = session.total_months_elapsed + 1;

    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }

    let pState = session.political_state;
    let eState = session.economic_state;

    // If linked to an active Central Bank simulation, refresh economic state from CBS
    if (session.linked_cbs_session_id) {
      const cbsRow = db.prepare('SELECT economic_state FROM game_sessions WHERE id = ?').get(session.linked_cbs_session_id);
      if (cbsRow) {
        eState = JSON.parse(cbsRow.economic_state);
      }
    } else {
      // Advance economic state using shared simulation engine
      eState = evolveEconomy(eState, { action_type: 'silence', action_value: '' }, 'normal', 'normal');
    }

    // Evolve Political State
    const primaryAction = { type: action_type || 'routine_session', details: action_details || '' };
    const evolved = evolvePoliticalState(pState, eState, primaryAction, event_choice);
    pState = evolved.politicalState;
    eState = evolved.economicState;

    // Check for Election Day resolution
    let electionResult = null;
    if (pState.months_to_election === 0) {
      // Election Day!
      const voterBase = pState.district_approval;
      const campaignBonus = Math.min(10, (pState.war_chest_millions || 1) * 0.8);
      const econPenalty = eState.inflation_cpi > 4.5 ? -6 : (eState.gdp_growth > 2.0 ? 4 : 0);
      const finalVotePct = Number((voterBase * 0.85 + campaignBonus + econPenalty + (Math.random() * 6 - 3)).toFixed(1));
      
      const won = finalVotePct >= 50.0;
      electionResult = {
        is_election_turn: true,
        won,
        vote_share_pct: finalVotePct,
        opponent_vote_share: Number((100 - finalVotePct).toFixed(1)),
        message: won 
          ? `VICTORY! You have won re-election with ${finalVotePct}% of the vote in ${pState.district_name}. Your mandate is renewed!` 
          : `DEFEAT. You received ${finalVotePct}% of the vote and have lost your seat to the challenger.`
      };

      if (won) {
        pState.months_to_election = pState.system_type === 'parliamentary' ? 36 : 24;
        pState.legislative_seniority = (pState.legislative_seniority || 1) + 1;
        pState.political_capital = Math.min(100, pState.political_capital + 20);
      } else {
        session.status = 'defeated';
      }
    }

    // Check for random political event if no active choice
    let newEvent = null;
    let activeEvents = session.active_events || [];
    
    // Decrement existing active events
    activeEvents = activeEvents.map(ev => {
      ev.duration_remaining = (ev.duration_remaining || 2) - 1;
      return ev;
    }).filter(ev => ev.duration_remaining > 0);

    if (activeEvents.length === 0 && Math.random() < 0.40) {
      const triggered = checkForPoliticalEvent(pState, eState);
      if (triggered) {
        newEvent = {
          ...triggered,
          duration_remaining: 3
        };
        activeEvents.push(newEvent);
      }
    }

    // Generate monthly political news dispatches
    const newArticles = generatePoliticalNews(pState, eState, currentYear, currentMonth);

    // Save turn and updates
    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE political_sessions SET
          current_year = ?,
          current_month = ?,
          total_months_elapsed = ?,
          months_to_election = ?,
          status = ?,
          political_state = ?,
          economic_state = ?,
          active_events = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        currentYear,
        currentMonth,
        elapsed,
        pState.months_to_election,
        session.status,
        JSON.stringify(pState),
        JSON.stringify(eState),
        JSON.stringify(activeEvents),
        session.id
      );

      // Record Turn History
      db.prepare(`
        INSERT INTO political_turn_history (id, session_id, year, month, action_type, action_details, political_snapshot, economic_snapshot, active_events)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'pth_' + uuidv4().substring(0, 8),
        session.id,
        currentYear,
        currentMonth,
        primaryAction.type,
        primaryAction.details,
        JSON.stringify(pState),
        JSON.stringify(eState),
        JSON.stringify(activeEvents)
      );

      // Insert News
      const insertNews = db.prepare(`
        INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const n of newArticles) {
        insertNews.run(
          'pn_' + uuidv4().substring(0, 8),
          session.id,
          currentYear,
          currentMonth,
          n.publisher,
          n.headline,
          n.body,
          n.tone,
          n.urgency,
          n.featured_issue
        );
      }
    });

    updateTx();

    const updated = await getSessionFull(session.id);
    res.json({ 
      session: updated, 
      election_result: electionResult,
      triggered_event: newEvent 
    });
  } catch (err) {
    console.error('Error executing monthly political action:', err);
    res.status(500).json({ error: err.message });
  }
});

// Draft new bill manually
router.post('/session/:id/bill/draft', async (req, res) => {
  try {
    const { title, category, fiscal_impact_billions, summary } = req.body;
    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const billId = 'pb_' + uuidv4().substring(0, 8);
    const statutoryText = draftStatutoryBill(title, category || 'general', fiscal_impact_billions || 15, session.political_state);

    db.prepare(`
      INSERT INTO political_bills (
        id, session_id, title, summary, statutory_text, category, fiscal_impact_billions, status, committee_name, public_support, year_introduced, month_introduced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_committee', ?, 60, ?, ?)
    `).run(
      billId,
      session.id,
      title,
      summary || `Statutory measure addressing ${category}.`,
      statutoryText,
      category || 'general',
      fiscal_impact_billions || 15,
      session.political_state.committee_name || 'Standing Committee',
      session.current_year,
      session.current_month
    );

    const updated = await getSessionFull(session.id);
    res.json({ session: updated, bill_id: billId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit bill to committee / vote out of committee
router.post('/session/:id/bill/:billId/committee', async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = db.prepare('SELECT * FROM political_bills WHERE id = ?').get(billId);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    // Committee markup vote
    const ayes = 14 + Math.floor(Math.random() * 8);
    const nays = 6 + Math.floor(Math.random() * 6);
    const passed = ayes > nays;

    db.prepare(`
      UPDATE political_bills SET
        status = ?,
        committee_vote_aye = ?,
        committee_vote_nay = ?
      WHERE id = ?
    `).run(
      passed ? 'floor_debate' : 'in_committee',
      ayes,
      nays,
      billId
    );

    const updated = await getSessionFull(req.params.id);
    res.json({ 
      session: updated, 
      committee_result: { passed, ayes, nays, message: passed ? 'Voted out of committee with favorable recommendation!' : 'Failed in committee markup.' } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate whip count
router.post('/session/:id/bill/:billId/whip', async (req, res) => {
  try {
    const session = await getSessionFull(req.params.id);
    const bill = db.prepare('SELECT * FROM political_bills WHERE id = ?').get(req.params.billId);
    if (!session || !bill) return res.status(404).json({ error: 'Session or bill not found' });

    const capitalSpent = req.body.capital_spent || 0;
    const whip = calculateWhipVoteCount(bill, session.political_state, capitalSpent);

    db.prepare('UPDATE political_bills SET whip_count = ? WHERE id = ?').run(JSON.stringify(whip), bill.id);

    res.json({ whip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Floor Division / Floor Vote
router.post('/session/:id/bill/:billId/floor', async (req, res) => {
  try {
    const session = await getSessionFull(req.params.id);
    const bill = db.prepare('SELECT * FROM political_bills WHERE id = ?').get(req.params.billId);
    if (!session || !bill) return res.status(404).json({ error: 'Session or bill not found' });

    const capitalSpent = req.body.capital_spent || 0;
    const whip = calculateWhipVoteCount(bill, session.political_state, capitalSpent);

    const passed = whip.passed;
    const pState = session.political_state;
    const eState = session.economic_state;

    if (passed) {
      pState.bills_passed = (pState.bills_passed || 0) + 1;
      pState.district_approval = Math.min(99, pState.district_approval + 6);
      pState.national_approval = Math.min(99, pState.national_approval + 5);
      pState.political_capital = Math.max(0, pState.political_capital - capitalSpent + 15);
      pState.polling_margin = Number((pState.polling_margin + 2.5).toFixed(1));

      // Fiscal consequence on economic state
      if (bill.fiscal_impact_billions) {
        eState.fiscal_deficit = Number((eState.fiscal_deficit + (bill.fiscal_impact_billions / 150.0)).toFixed(2));
      }
    } else {
      pState.political_capital = Math.max(0, pState.political_capital - capitalSpent);
      pState.national_approval = Math.max(15, pState.national_approval - 3);
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE political_bills SET
          status = ?,
          floor_vote_aye = ?,
          floor_vote_nay = ?,
          year_resolved = ?,
          month_resolved = ?
        WHERE id = ?
      `).run(
        passed ? 'passed' : 'failed',
        whip.total_ayes,
        whip.total_nays,
        session.current_year,
        session.current_month,
        bill.id
      );

      db.prepare(`
        UPDATE political_sessions SET
          political_state = ?,
          economic_state = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(JSON.stringify(pState), JSON.stringify(eState), session.id);
    })();

    const updated = await getSessionFull(session.id);
    res.json({ 
      session: updated, 
      passed, 
      total_ayes: whip.total_ayes, 
      total_nays: whip.total_nays,
      message: passed ? `🎉 THE BILL PASSES! Enacted into law with ${whip.total_ayes} Ayes to ${whip.total_nays} Nays.` : `BILL DEFEATED on the floor (${whip.total_ayes} Ayes to ${whip.total_nays} Nays).` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Promotion to Next Office
router.post('/session/:id/promote', async (req, res) => {
  try {
    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const pState = session.political_state;
    const tracks = pState.system_type === 'parliamentary' ? PARLIAMENTARY_TRACKS : CONGRESSIONAL_TRACKS;
    const currentIdx = tracks.findIndex(t => t.id === pState.current_stage_id);

    if (currentIdx === -1 || currentIdx >= tracks.length - 1) {
      return res.status(400).json({ error: 'No higher office available in this track' });
    }

    const nextStage = tracks[currentIdx + 1];
    pState.current_stage_id = nextStage.id;
    pState.politician_title = nextStage.title;
    pState.chamber = nextStage.chamber;
    pState.promotion_available = false;
    pState.political_capital = Math.min(100, pState.political_capital + 25);
    pState.national_approval = Math.min(99, pState.national_approval + 8);

    db.prepare(`
      UPDATE political_sessions SET
        political_track = ?,
        political_state = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextStage.id, JSON.stringify(pState), session.id);

    // Add news celebration
    db.prepare(`
      INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
      VALUES (?, ?, ?, ?, 'capital_gazette', ?, ?, 'bullish', 'high', 'Leadership Elevation')
    `).run(
      'pn_' + uuidv4().substring(0, 8),
      session.id,
      session.current_year,
      session.current_month,
      `POLITICAL ELEVATION: ${pState.politician_name} Ascends to ${nextStage.title}`,
      `In a major shift within party leadership, ${pState.politician_name} has officially assumed the office of ${nextStage.title}, taking command of ${nextStage.chamber}.`
    );

    const updated = await getSessionFull(session.id);
    res.json({ session: updated, new_office: nextStage.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat with Political Chief of Staff
router.post('/session/:id/advisor/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Save user message
    db.prepare('INSERT INTO political_advisor_messages (id, session_id, sender, content) VALUES (?, ?, ?, ?)').run(
      'pam_' + uuidv4().substring(0, 8),
      session.id,
      'user',
      message
    );

    // Generate advisor response
    const advice = await handlePoliticalAdvisorChat(
      message,
      session.political_state,
      session.economic_state,
      session.messages || [],
      session.bills || []
    );

    // Save advisor response
    db.prepare('INSERT INTO political_advisor_messages (id, session_id, sender, content) VALUES (?, ?, ?, ?)').run(
      'pam_' + uuidv4().substring(0, 8),
      session.id,
      'advisor',
      advice.content
    );

    // If a bill was drafted via Chief of Staff directive, insert into DB
    let newBillId = null;
    if (advice.draftedBill) {
      newBillId = 'pb_' + uuidv4().substring(0, 8);
      db.prepare(`
        INSERT INTO political_bills (
          id, session_id, title, summary, statutory_text, category, fiscal_impact_billions, status, committee_name, public_support, year_introduced, month_introduced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_committee', ?, ?, ?, ?)
      `).run(
        newBillId,
        session.id,
        advice.draftedBill.title,
        advice.draftedBill.summary,
        advice.draftedBill.statutory_text,
        advice.draftedBill.category,
        advice.draftedBill.fiscal_impact_billions,
        advice.draftedBill.committee_name,
        advice.draftedBill.public_support,
        session.current_year,
        session.current_month
      );

      // Increment bills sponsored count
      const pState = session.political_state;
      pState.bills_sponsored = (pState.bills_sponsored || 0) + 1;
      pState.political_capital = Math.min(100, pState.political_capital + 5);
      db.prepare('UPDATE political_sessions SET political_state = ? WHERE id = ?').run(JSON.stringify(pState), session.id);
    }

    const updated = await getSessionFull(session.id);
    res.json({
      response: advice.content,
      drafted_bill_id: newBillId,
      session: updated
    });
  } catch (err) {
    console.error('Error in political advisor chat:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
