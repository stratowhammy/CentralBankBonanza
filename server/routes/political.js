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
  calculateBillAchievementScore,
  CAMPAIGN_OFFICE_DEFINITIONS,
  calculateElectionOdds,
  generateDonorQuestions,
  PARLIAMENTARY_TRACKS,
  CONGRESSIONAL_TRACKS,
  UNICAMERAL_TRACKS,
  BICAMERAL_TRACKS,
  generateCaucusDealOffers,
  CONGRESSIONAL_CAUCUSES,
  PARLIAMENTARY_CAUCUSES,
  MAJOR_NATIONAL_ISSUES,
  POLITICAL_ALIGNMENT_QUIZ,
  evaluateQuizAlignment,
  TRADE_LOBBYING_GROUPS,
  generateLobbyingOffers,
  isUnicameralSystem,
  isBicameralSystem
} = require('../politicalEngine');
const { getInitialEconomicState, evolveEconomy } = require('../simulationEngine');
const { handlePoliticalAdvisorChat, draftStatutoryBill } = require('../politicalAdvisorEngine');
const { generateCaucusLeaderAIResponse, CAUCUS_LEADER_PROFILES } = require('../caucusLeaderEngine');

// Get 7-question political alignment quiz
router.get('/quiz', (req, res) => {
  try {
    // Deliver quiz questions with options & categorical indicator signals (no internal raw scores exposed)
    const clientQuiz = POLITICAL_ALIGNMENT_QUIZ.map(q => ({
      id: q.id,
      number: q.number,
      category: q.category,
      title: q.title,
      prompt: q.prompt,
      options: q.options.map(o => ({
        id: o.id,
        label: o.label,
        description: o.description,
        indicators: o.indicators
      }))
    }));
    res.json({ questions: clientQuiz });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve political alignment quiz' });
  }
});

// Evaluate quiz answers and preview assigned caucus
router.post('/quiz/evaluate', (req, res) => {
  try {
    const { answers, system_type } = req.body;
    const result = evaluateQuizAlignment(answers || {}, system_type || 'bicameral');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to evaluate political alignment' });
  }
});

// Get major national issues definitions & current status
router.get('/major-issues', (req, res) => {
  res.json({ issues: MAJOR_NATIONAL_ISSUES });
});

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
      linked_cbs_session_id,
      economy_type,
      starting_condition,
      volatility,
      quiz_answers
    } = req.body;

    if (!user_id || !politician_name) {
      return res.status(400).json({ error: 'user_id and politician_name are required' });
    }

    // Enforce user registration guardrail - simulations require a registered account
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(user_id);
    if (!user || user.username === 'guest') {
      return res.status(403).json({ 
        error: 'Registration required. You must create an account or sign in to run a political simulation.' 
      });
    }

    const effectiveSystem = system_type || 'bicameral';
    const isUnicameral = isUnicameralSystem(effectiveSystem);
    const effectiveParty = party_name || (isUnicameral ? 'Democratic Alliance' : 'Conservative Union');
    const effectiveDistrict = district_name || (isUnicameral ? 'Highland Greenshire' : 'Industrial 4th Congressional District');
    const effectiveEconomyType = economy_type || 'large_hegemon';
    const effectiveCondition = starting_condition || 'normal';
    const effectiveVolatility = volatility || 'normal';

    const sessionId = 'ps_' + uuidv4().substring(0, 8);
    
    // Initialize Political State
    const politicalState = getInitialPoliticalState(effectiveSystem, selected_track, effectiveParty, effectiveDistrict);
    politicalState.politician_name = politician_name;
    politicalState.economy_type = effectiveEconomyType;
    politicalState.starting_condition = effectiveCondition;
    politicalState.volatility = effectiveVolatility;

    // Evaluate 7-Question Political Alignment Quiz to determine Player's Caucus Leadership
    let quizResult = null;
    if (quiz_answers && Object.keys(quiz_answers).length > 0) {
      quizResult = evaluateQuizAlignment(quiz_answers, effectiveSystem);
      politicalState.player_caucus_id = quizResult.assigned_caucus_id;
      politicalState.player_caucus_name = quizResult.assigned_caucus_name;
      politicalState.is_caucus_leader = true;
      politicalState.quiz_alignment = JSON.stringify(quizResult);
    } else {
      const defaultCaucusId = isUnicameral
        ? (effectiveParty.includes('Conservative') ? 'free_enterprise_group' : (effectiveParty.includes('Independent') ? 'one_nation_moderates' : 'socialist_campaign_group'))
        : (effectiveParty.includes('Conservative') ? 'freedom_faction' : (effectiveParty.includes('Independent') ? 'problem_solvers' : 'progressive_caucus'));
      const caucusList = isUnicameral ? PARLIAMENTARY_CAUCUSES : CONGRESSIONAL_CAUCUSES;
      const foundC = caucusList.find(c => c.id === defaultCaucusId) || caucusList[0];
      politicalState.player_caucus_id = foundC.id;
      politicalState.player_caucus_name = foundC.name;
      politicalState.is_caucus_leader = true;
    }

    // Attach initial major national issues landscape
    politicalState.major_issues = MAJOR_NATIONAL_ISSUES;

    // Starting climate adjustments
    if (effectiveCondition === 'easy') {
      politicalState.district_approval = Math.min(100, (politicalState.district_approval || 55) + 10);
      politicalState.national_approval = Math.min(100, (politicalState.national_approval || 52) + 10);
      politicalState.whip_reputation = Math.min(100, (politicalState.whip_reputation || 50) + 8);
    } else if (effectiveCondition === 'hard') {
      politicalState.district_approval = Math.max(25, (politicalState.district_approval || 55) - 10);
      politicalState.national_approval = Math.max(25, (politicalState.national_approval || 52) - 10);
      politicalState.whip_reputation = Math.max(25, (politicalState.whip_reputation || 50) - 8);
    }

    // Initialize Shared Economic State (or link from CBS session if provided)
    let economicState;
    if (linked_cbs_session_id) {
      const cbsRow = db.prepare('SELECT economic_state FROM game_sessions WHERE id = ?').get(linked_cbs_session_id);
      if (cbsRow) {
        economicState = JSON.parse(cbsRow.economic_state);
      }
    }
    if (!economicState) {
      economicState = getInitialEconomicState(effectiveCondition, effectiveEconomyType, effectiveCondition, effectiveVolatility);
    }

    // Initial starter bill
    const initialBillId = 'pb_' + uuidv4().substring(0, 8);
    const starterBillTitle = isUnicameral 
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
          economy_type, starting_condition, volatility, player_caucus_id, player_caucus_name, quiz_alignment,
          political_state, economic_state, active_events
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        effectiveEconomyType,
        effectiveCondition,
        effectiveVolatility,
        politicalState.player_caucus_id,
        politicalState.player_caucus_name,
        politicalState.quiz_alignment || null,
        JSON.stringify(politicalState),
        JSON.stringify(economicState),
        JSON.stringify([])
      );

      // Insert starter bill
      const starterScore = calculateBillAchievementScore({
        category: 'infrastructure',
        fiscal_impact_billions: 22,
        public_support: 64
      });

      db.prepare(`
        INSERT INTO political_bills (
          id, session_id, title, summary, statutory_text, category, fiscal_impact_billions, status, committee_name, public_support, year_introduced, month_introduced, achievement_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_committee', ?, 64, 1, 1, ?)
      `).run(
        initialBillId,
        sessionId,
        starterBillTitle,
        'Key inaugural legislative initiative funding district transportation and regional utility resilience.',
        starterStatute,
        'infrastructure',
        22,
        politicalState.committee_name,
        starterScore
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
- Caucus Chair: ${politicalState.player_caucus_name}.
- Current mandate: Maintain district support, advance legislative priority bills, and navigate macroeconomic headwinds.
</think>

Welcome to your office, ${politicalState.politician_title} ${politician_name}.

Congratulations on your election as Chair of the **${politicalState.player_caucus_name}**! Your caucus colleagues stand ready to support your floor agenda.

As your Chief of Staff, my team and I are at your complete disposal. We have already prepared our inaugural legislative docket and referred the **${starterBillTitle}** to our committee for markup.

You can instruct me anytime to:
* **Draft legislation** on any policy issue.
* **Run a floor whip count** to assess our party and caucus votes.
* **Negotiate vote trades** with rival caucus leaders.
* **Manage lobbying trade group overtures** in K-Street for campaign funds.
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

      // Seed initial caucus delegation trade offers for the starter bill
      const initialDeals = generateCaucusDealOffers(
        { id: sessionId, system_type: effectiveSystem, current_year: 1, current_month: 1, political_state: politicalState },
        { id: initialBillId, title: starterBillTitle }
      );
      const insertDeal = db.prepare(`
        INSERT INTO political_caucus_deals (
          id, session_id, caucus_id, caucus_name, caucus_leader, member_count, ideology,
          docket_bill_title, docket_bill_summary, docket_bill_category, docket_bill_impact,
          user_target_bill_id, user_target_bill_title, pledged_votes, demands_description, status,
          year_proposed, month_proposed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1, 1)
      `);
      for (const d of initialDeals) {
        insertDeal.run(
          d.id,
          sessionId,
          d.caucus_id,
          d.caucus_name,
          d.caucus_leader,
          d.member_count,
          d.ideology,
          d.docket_bill_title,
          d.docket_bill_summary,
          d.docket_bill_category,
          d.docket_bill_impact,
          d.user_target_bill_id,
          d.user_target_bill_title,
          d.pledged_votes,
          d.demands_description
        );
      }

      // Seed initial lobbying industry offers from trade groups
      const initialLobbying = generateLobbyingOffers({
        id: sessionId,
        current_year: 1,
        current_month: 1,
        political_state: politicalState
      });
      const insertLobbying = db.prepare(`
        INSERT INTO political_lobbying_contracts (
          id, session_id, trade_group, sector, chief_lobbyist, favor_title, favor_description,
          statutory_category, campaign_contribution_millions, completion_bounty_millions,
          ethics_risk_level, suggested_bill_title, suggested_bill_summary, suggested_fiscal_impact,
          status, created_year, created_month
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1, 1)
      `);
      for (const lob of initialLobbying) {
        insertLobbying.run(
          lob.id,
          sessionId,
          lob.trade_group,
          lob.sector,
          lob.chief_lobbyist,
          lob.favor_title,
          lob.favor_description,
          lob.statutory_category,
          lob.campaign_contribution_millions,
          lob.completion_bounty_millions,
          lob.ethics_risk_level,
          lob.suggested_bill_title,
          lob.suggested_bill_summary,
          lob.suggested_fiscal_impact
        );
      }
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
  const caucusDeals = db.prepare('SELECT * FROM political_caucus_deals WHERE session_id = ? ORDER BY created_at DESC').all(sessionId);
  const donorPromises = db.prepare('SELECT * FROM political_donor_promises WHERE session_id = ? ORDER BY created_at DESC').all(sessionId);
  const lobbyingContracts = db.prepare('SELECT * FROM political_lobbying_contracts WHERE session_id = ? ORDER BY created_at DESC').all(sessionId);
  const caucusDms = db.prepare('SELECT * FROM political_caucus_dms WHERE session_id = ? ORDER BY created_at ASC').all(sessionId);

  const isUnicameral = isUnicameralSystem(sessionRow.system_type);
  const baseCaucuses = isUnicameral ? PARLIAMENTARY_CAUCUSES : CONGRESSIONAL_CAUCUSES;
  const pState = JSON.parse(sessionRow.political_state);

  // Mark player's caucus and ensure each caucus has its defined leader (AI vs Human Player)
  const caucuses = baseCaucuses.map(c => {
    const isPlayer = c.id === pState.player_caucus_id;
    const leaderMessages = caucusDms.filter(d => d.caucus_id === c.id);
    const lastMsg = leaderMessages[leaderMessages.length - 1];
    const pendingDemand = lastMsg && lastMsg.requires_personal_response === 1 && !lastMsg.personal_response_submitted;

    if (isPlayer) {
      return {
        ...c,
        leader: `${pState.politician_title} ${sessionRow.politician_name}`,
        is_player_led: true,
        is_ai: false,
        pending_personal_demand: false
      };
    }
    return {
      ...c,
      is_player_led: false,
      is_ai: true, // Default other caucus leaders as AIs using v4-pro thinking
      pending_personal_demand: !!pendingDemand,
      personal_prompt: pendingDemand ? lastMsg.personal_prompt : null
    };
  });

  return {
    ...sessionRow,
    political_state: pState,
    economic_state: JSON.parse(sessionRow.economic_state),
    active_events: JSON.parse(sessionRow.active_events || '[]'),
    bills,
    news,
    history,
    messages,
    caucus_deals: caucusDeals,
    donor_promises: donorPromises,
    lobbying_contracts: lobbyingContracts,
    caucuses,
    caucus_dms: caucusDms,
    player_caucus: caucuses.find(c => c.is_player_led) || null,
    major_issues: pState.major_issues || MAJOR_NATIONAL_ISSUES
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

// Delete a political simulation session
router.delete('/session/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM political_sessions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:sessionId', (req, res) => {
  try {
    db.prepare('DELETE FROM political_sessions WHERE id = ?').run(req.params.sessionId);
    res.json({ success: true });
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
      // Determine what office is being contested (declared higher office campaign vs standard re-election)
      const isHigherOfficeBid = !!(pState.declared_campaign && pState.declared_campaign.target_office_id && pState.declared_campaign.completed);
      const targetOfficeId = isHigherOfficeBid ? pState.declared_campaign.target_office_id : pState.current_stage_id;
      const targetOffice = CAMPAIGN_OFFICE_DEFINITIONS[targetOfficeId] || CAMPAIGN_OFFICE_DEFINITIONS.representative;

      const odds = calculateElectionOdds(targetOfficeId, pState, eState);
      const randomJitter = Number(((Math.random() * 5.0) - 2.5).toFixed(1));
      const finalVotePct = Math.min(88.0, Math.max(12.0, Number((odds.expected_vote_share + randomJitter).toFixed(1))));
      const won = finalVotePct >= 50.0;

      electionResult = {
        is_election_turn: true,
        won,
        vote_share_pct: finalVotePct,
        opponent_vote_share: Number((100 - finalVotePct).toFixed(1)),
        target_office_id: targetOfficeId,
        target_title: targetOffice.title,
        is_higher_office: isHigherOfficeBid && targetOfficeId !== pState.current_stage_id,
        breakdown: odds.breakdown,
        metrics: odds.metrics,
        message: won 
          ? (isHigherOfficeBid && targetOfficeId !== pState.current_stage_id
              ? `LANDSLIDE VICTORY! You have won election to the office of ${targetOffice.title} with ${finalVotePct}% of the vote! A historic elevation in your political career.`
              : `VICTORY! You have won re-election with ${finalVotePct}% of the vote in ${pState.district_name}. Your mandate is renewed!`)
          : (isHigherOfficeBid && targetOfficeId !== pState.current_stage_id
              ? `ELECTION NIGHT LOSS. Your bid for ${targetOffice.title} garnered ${finalVotePct}% of the vote, falling short of victory.`
              : `DEFEAT. You received ${finalVotePct}% of the vote and have lost your seat to the challenger.`)
      };

      pState.last_election_vote_share = finalVotePct;

      if (won) {
        if (isHigherOfficeBid && targetOfficeId !== pState.current_stage_id) {
          // Elevate to higher office!
          pState.current_stage_id = targetOffice.id;
          pState.politician_title = targetOffice.title;
          pState.chamber = targetOffice.chamber;
          pState.terms_in_office = (pState.terms_in_office || 1) + 1;
          pState.months_to_election = targetOffice.term_months || (pState.system_type === 'parliamentary' ? 36 : 24);
          pState.political_capital = Math.min(100, pState.political_capital + 35);
          pState.national_approval = Math.min(99, pState.national_approval + 10);
        } else {
          // Standard re-election
          pState.terms_in_office = (pState.terms_in_office || 1) + 1;
          pState.legislative_seniority = (pState.legislative_seniority || 1) + 1;
          pState.months_to_election = targetOffice.term_months || (pState.system_type === 'parliamentary' ? 36 : 24);
          pState.political_capital = Math.min(100, pState.political_capital + 20);
        }
        pState.declared_campaign = null; // Reset campaign
      } else {
        if (isHigherOfficeBid) {
          const wasSenatorRunningForPres = pState.declared_campaign?.is_senator_running_for_president;
          const prevSenateClock = pState.declared_campaign?.previous_senate_months_to_election;
          pState.declared_campaign = null;
          pState.political_capital = Math.max(5, pState.political_capital - 20);
          pState.polling_margin = Number((pState.polling_margin - 3.5).toFixed(1));
          
          if (wasSenatorRunningForPres && prevSenateClock) {
            // Sitting Senator returns to Senate seat with remaining tenure clock
            pState.months_to_election = Math.max(12, prevSenateClock - 12);
          } else {
            pState.months_to_election = 12; // Snap or midterm realignment
          }
        } else {
          session.status = 'defeated';
        }
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
    const { title, category, fiscal_impact_billions, summary, donor_promise_id, lobbying_contract_id } = req.body;
    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let publicSupport = 60;
    if (donor_promise_id) {
      const promiseRow = db.prepare('SELECT * FROM political_donor_promises WHERE id = ?').get(donor_promise_id);
      if (promiseRow && promiseRow.public_support) {
        publicSupport = promiseRow.public_support;
      }
    } else if (lobbying_contract_id) {
      const lobRow = db.prepare('SELECT * FROM political_lobbying_contracts WHERE id = ?').get(lobbying_contract_id);
      if (lobRow) {
        publicSupport = lobRow.ethics_risk_level === 'toxic' ? 32 : (lobRow.ethics_risk_level === 'low' ? 64 : 48);
      }
    }

    const billId = 'pb_' + uuidv4().substring(0, 8);
    const statutoryText = draftStatutoryBill(title, category || 'general', fiscal_impact_billions || 15, session.political_state);

    const achievementScore = calculateBillAchievementScore({
      category: category || 'general',
      fiscal_impact_billions: fiscal_impact_billions || 15,
      public_support: publicSupport
    });

    db.prepare(`
      INSERT INTO political_bills (
        id, session_id, title, summary, statutory_text, category, fiscal_impact_billions, status, committee_name, public_support, year_introduced, month_introduced, achievement_score, donor_promise_id, lobbying_contract_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_committee', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      billId,
      session.id,
      title,
      summary || `Statutory measure addressing ${category}.`,
      statutoryText,
      category || 'general',
      fiscal_impact_billions || 15,
      session.political_state.committee_name || 'Standing Committee',
      publicSupport,
      session.current_year,
      session.current_month,
      achievementScore,
      donor_promise_id || null,
      lobbying_contract_id || null
    );

    // Generate caucus trade offers for this newly drafted bill
    const freshOffers = generateCaucusDealOffers(session, { id: billId, title });
    const insertDeal = db.prepare(`
      INSERT INTO political_caucus_deals (
        id, session_id, caucus_id, caucus_name, caucus_leader, member_count, ideology,
        docket_bill_title, docket_bill_summary, docket_bill_category, docket_bill_impact,
        user_target_bill_id, user_target_bill_title, pledged_votes, demands_description, status,
        year_proposed, month_proposed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `);
    for (const d of freshOffers) {
      insertDeal.run(
        d.id, session.id, d.caucus_id, d.caucus_name, d.caucus_leader, d.member_count, d.ideology,
        d.docket_bill_title, d.docket_bill_summary, d.docket_bill_category, d.docket_bill_impact,
        d.user_target_bill_id, d.user_target_bill_title, d.pledged_votes, d.demands_description,
        session.current_year, session.current_month
      );
    }

    const updated = await getSessionFull(session.id);
    res.json({ session: updated, bill_id: billId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Committee markup: sway members with political capital OR hold markup vote
router.post('/session/:id/bill/:billId/committee', async (req, res) => {
  try {
    const { action, sway_type, capital_spent } = req.body;
    const session = await getSessionFull(req.params.id);
    const bill = db.prepare('SELECT * FROM political_bills WHERE id = ?').get(req.params.billId);
    if (!session || !bill) return res.status(404).json({ error: 'Session or bill not found' });

    const pState = session.political_state;

    // 1. ACTION: SWAY COMMITTEE MEMBERS WITH POLITICAL CAPITAL
    if (action === 'sway') {
      const isAmendment = sway_type === 'amendment';
      const cost = isAmendment ? 10 : 5;

      if ((pState.political_capital || 0) < cost) {
        return res.status(400).json({ 
          error: `Insufficient political capital. You need at least ${cost} capital (you have ${pState.political_capital || 0}).` 
        });
      }

      // Deduct political capital
      pState.political_capital = Math.max(0, (pState.political_capital || 0) - cost);

      // Increment bill sway metrics
      const newCapitalSpent = (bill.committee_capital_spent || 0) + cost;
      const swayIncrement = isAmendment ? 2 : 1;
      const newSwayLevel = (bill.committee_sway_level || 0) + swayIncrement;
      const newAmendmentsCount = (bill.committee_amendments_count || 0) + (isAmendment ? 1 : 0);
      const newPublicSupport = Math.min(95, (bill.public_support || 55) + (isAmendment ? 4 : 2));

      db.transaction(() => {
        db.prepare(`
          UPDATE political_bills SET
            committee_capital_spent = ?,
            committee_sway_level = ?,
            committee_amendments_count = ?,
            public_support = ?
          WHERE id = ?
        `).run(
          newCapitalSpent,
          newSwayLevel,
          newAmendmentsCount,
          newPublicSupport,
          bill.id
        );

        db.prepare('UPDATE political_sessions SET political_state = ? WHERE id = ?')
          .run(JSON.stringify(pState), session.id);
      })();

      const updated = await getSessionFull(req.params.id);
      const floorBonus = Math.round(newSwayLevel * 3.5 + newAmendmentsCount * 6);
      const message = isAmendment
        ? `Adopted bipartisan committee markup amendment (-10 Capital). Committee sway level is now ${newSwayLevel} with ${newAmendmentsCount} compromise amendments adopted. Primed +${floorBonus} floor momentum votes!`
        : `Swayed key moderate committee member (-5 Capital). Committee sway level is now ${newSwayLevel}. Primed +${floorBonus} floor momentum votes!`;

      return res.json({
        session: updated,
        sway_result: {
          cost,
          sway_level: newSwayLevel,
          amendments_count: newAmendmentsCount,
          floor_momentum_votes: floorBonus,
          message
        }
      });
    }

    // 2. ACTION: HOLD COMMITTEE MARKUP VOTE (Vote out to floor)
    // Total committee seats = 24. Majority threshold = 13 votes.
    const baselineMajorityAyes = 8;
    const baselineOppCrossover = 1;
    const swayBonus = Math.round((bill.committee_sway_level || 0) * 1.8 + (bill.committee_amendments_count || 0) * 2.5);
    const randomFriction = Math.floor(Math.random() * 3); // 0, 1, or 2

    const ayes = Math.min(24, Math.max(4, baselineMajorityAyes + baselineOppCrossover + swayBonus + randomFriction));
    const nays = 24 - ayes;
    const passed = ayes >= 13;

    db.transaction(() => {
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
        bill.id
      );
    })();

    const updated = await getSessionFull(req.params.id);
    const floorBonus = Math.round((bill.committee_sway_level || 0) * 3.5 + (bill.committee_amendments_count || 0) * 6);
    const message = passed
      ? `Voted out of committee with favorable recommendation (${ayes} Ayes to ${nays} Nays)! Bill cleared for floor debate carrying +${floorBonus} floor momentum votes.`
      : `Failed in committee markup (${ayes} Ayes to ${nays} Nays — needed 13 to report out). Spend political capital to sway more members before calling another vote.`;

    res.json({ 
      session: updated, 
      committee_result: { passed, ayes, nays, message } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all caucus deal offers
router.get('/session/:id/caucus-deals', async (req, res) => {
  try {
    const deals = db.prepare('SELECT * FROM political_caucus_deals WHERE session_id = ? ORDER BY created_at DESC').all(req.params.id);
    
    // If fewer than 2 pending deals, generate fresh offers
    const pending = deals.filter(d => d.status === 'pending');
    if (pending.length < 2) {
      const session = await getSessionFull(req.params.id);
      if (session) {
        const activeBill = session.bills.find(b => b.status === 'in_committee' || b.status === 'floor_debate') || session.bills[0];
        const newDeals = generateCaucusDealOffers(session, activeBill);
        const insertDeal = db.prepare(`
          INSERT INTO political_caucus_deals (
            id, session_id, caucus_id, caucus_name, caucus_leader, member_count, ideology,
            docket_bill_title, docket_bill_summary, docket_bill_category, docket_bill_impact,
            user_target_bill_id, user_target_bill_title, pledged_votes, demands_description, status,
            year_proposed, month_proposed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        `);
        for (const d of newDeals) {
          insertDeal.run(
            d.id, session.id, d.caucus_id, d.caucus_name, d.caucus_leader, d.member_count, d.ideology,
            d.docket_bill_title, d.docket_bill_summary, d.docket_bill_category, d.docket_bill_impact,
            d.user_target_bill_id, d.user_target_bill_title, d.pledged_votes, d.demands_description,
            session.current_year, session.current_month
          );
        }
        const fresh = db.prepare('SELECT * FROM political_caucus_deals WHERE session_id = ? ORDER BY created_at DESC').all(req.params.id);
        return res.json({ deals: fresh });
      }
    }
    
    res.json({ deals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Negotiate caucus deal (accept, counter, or reject)
router.post('/session/:id/caucus-deals/:dealId/negotiate', async (req, res) => {
  try {
    const { action } = req.body; // 'accept', 'counter', 'reject'
    const session = await getSessionFull(req.params.id);
    const deal = db.prepare('SELECT * FROM political_caucus_deals WHERE id = ? AND session_id = ?').get(req.params.dealId, req.params.id);
    if (!session || !deal) return res.status(404).json({ error: 'Session or deal not found' });

    const pState = session.political_state;

    if (action === 'reject') {
      db.prepare("UPDATE political_caucus_deals SET status = 'rejected' WHERE id = ?").run(deal.id);
      const updated = await getSessionFull(session.id);
      return res.json({
        session: updated,
        message: `Declined deal with ${deal.caucus_leader}. ${deal.caucus_name} will vote their ideological baseline.`
      });
    }

    if (action === 'counter') {
      // Counter-offer: spend 8 capital to insert carve-out and secure +5 extra votes
      if ((pState.political_capital || 0) < 8) {
        return res.status(400).json({ error: 'You need at least 8 political capital to negotiate an amendment counter-offer.' });
      }
      pState.political_capital = Math.max(0, (pState.political_capital || 0) - 8);
      const updatedPledged = deal.pledged_votes + 5;

      // Apply pledged votes to the user target bill
      if (deal.user_target_bill_id) {
        db.prepare('UPDATE political_bills SET pledged_caucus_votes = pledged_caucus_votes + ? WHERE id = ?')
          .run(updatedPledged, deal.user_target_bill_id);
      }

      db.prepare("UPDATE political_caucus_deals SET status = 'accepted', pledged_votes = ? WHERE id = ?").run(updatedPledged, deal.id);
      db.prepare('UPDATE political_sessions SET political_state = ? WHERE id = ?').run(JSON.stringify(pState), session.id);

      const updated = await getSessionFull(session.id);
      return res.json({
        session: updated,
        message: `Backroom Counter-Offer Accepted! (-8 Capital). ${deal.caucus_leader} conceded district carve-outs and committed ${updatedPledged} locked floor votes for '${deal.user_target_bill_title}'!`
      });
    }

    // Default action: 'accept'
    if (deal.user_target_bill_id) {
      db.prepare('UPDATE political_bills SET pledged_caucus_votes = pledged_caucus_votes + ? WHERE id = ?')
        .run(deal.pledged_votes, deal.user_target_bill_id);
    }

    // Slight party loyalty / approval trade-off for logrolling
    pState.party_loyalty = Math.min(100, (pState.party_loyalty || 60) + 1);

    db.prepare("UPDATE political_caucus_deals SET status = 'accepted' WHERE id = ?").run(deal.id);
    db.prepare('UPDATE political_sessions SET political_state = ? WHERE id = ?').run(JSON.stringify(pState), session.id);

    const updated = await getSessionFull(session.id);
    return res.json({
      session: updated,
      message: `Logrolling Accord Sealed! ${deal.caucus_leader} and ${deal.caucus_name} officially committed ${deal.pledged_votes} locked floor votes for '${deal.user_target_bill_title}' in exchange for your support on '${deal.docket_bill_title}'!`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get lobbying contracts / trade group pitches for a session
router.get('/session/:id/lobbying', (req, res) => {
  try {
    const contracts = db.prepare('SELECT * FROM political_lobbying_contracts WHERE session_id = ? ORDER BY created_at DESC').all(req.params.id);
    res.json({ contracts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Respond to a lobbying offer (accept or reject)
router.post('/session/:id/lobbying/:contractId/respond', async (req, res) => {
  try {
    const { id, contractId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const session = await getSessionFull(id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const contract = db.prepare('SELECT * FROM political_lobbying_contracts WHERE id = ? AND session_id = ?').get(contractId, id);
    if (!contract) return res.status(404).json({ error: 'Lobbying offer not found' });
    if (contract.status !== 'pending') return res.status(400).json({ error: 'This lobbying offer is already resolved' });

    const pState = session.political_state;

    if (action === 'accept') {
      const contribution = Number(contract.campaign_contribution_millions) || 2.0;
      pState.war_chest_millions = Number(((pState.war_chest_millions || 0) + contribution).toFixed(2));

      // Ethics scrutiny penalty based on risk tier
      const riskScores = { low: 3, medium: 7, high: 14, toxic: 22 };
      const penalty = riskScores[contract.ethics_risk_level] || 7;
      pState.ethics_scrutiny = Math.min(100, (pState.ethics_scrutiny || 10) + penalty);

      // Public approval fallout / boost
      if (contract.ethics_risk_level === 'toxic' || contract.ethics_risk_level === 'high') {
        pState.district_approval = Math.max(10, (pState.district_approval || 50) - 2.5);
        pState.national_approval = Math.max(10, (pState.national_approval || 50) - 3.0);
        pState.polling_margin = Number(((pState.polling_margin || 0) - 1.5).toFixed(1));
      } else if (contract.ethics_risk_level === 'low') {
        pState.district_approval = Math.min(99, (pState.district_approval || 50) + 1.5);
        pState.polling_margin = Number(((pState.polling_margin || 0) + 0.8).toFixed(1));
      }

      // Mark contract accepted
      db.prepare("UPDATE political_lobbying_contracts SET status = 'accepted', resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(contractId);

      // Automatically introduce model statute onto the legislative docket
      const modelBillId = 'pb_' + uuidv4().substring(0, 8);
      const achievement = calculateBillAchievementScore({
        category: contract.statutory_category,
        fiscal_impact_billions: contract.suggested_fiscal_impact,
        public_support: contract.ethics_risk_level === 'toxic' ? 32 : (contract.ethics_risk_level === 'low' ? 62 : 48)
      });

      db.prepare(`
        INSERT INTO political_bills (
          id, session_id, title, summary, statutory_text, category, fiscal_impact_billions, status,
          committee_name, public_support, year_introduced, month_introduced, achievement_score, lobbying_contract_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'drafting', ?, ?, ?, ?, ?, ?)
      `).run(
        modelBillId,
        id,
        contract.suggested_bill_title,
        contract.suggested_bill_summary,
        `Statutory model legislation introduced on behalf of ${contract.trade_group}: ${contract.favor_description}`,
        contract.statutory_category,
        contract.suggested_fiscal_impact || 5,
        pState.committee_name,
        contract.ethics_risk_level === 'toxic' ? 32 : 52,
        session.current_year,
        session.current_month,
        achievement,
        contractId
      );

      // Publish breaking news dispatch
      db.prepare(`
        INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
        VALUES (?, ?, ?, ?, 'capital_gazette', ?, ?, 'critical', 'high', ?)
      `).run(
        'pn_' + uuidv4().substring(0, 8),
        id,
        session.current_year,
        session.current_month,
        `K-STREET EXPEDITION: ${contract.trade_group} Delivers $${contribution}M Contribution to ${session.politician_name}`,
        `K-Street insiders confirmed today that ${contract.chief_lobbyist} of the ${contract.trade_group} finalized a major campaign pact with ${session.politician_name}'s war chest, providing $${contribution}M immediately as the lawmaker introduced the '${contract.suggested_bill_title}'. Watchdog groups sounded the alarm on special-interest influence.`,
        contract.statutory_category
      );

      db.prepare('UPDATE political_sessions SET political_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(pState), id);

      const updated = await getSessionFull(id);
      return res.json({
        session: updated,
        message: `🤝 LOBBYING ACCORD SEALED! ${contract.trade_group} deposited +$${contribution}M into your campaign war chest. Model bill "${contract.suggested_bill_title}" has been introduced into your legislative docket!`
      });
    } else {
      // Rejecting special-interest money
      pState.ethics_scrutiny = Math.max(0, (pState.ethics_scrutiny || 10) - 6);
      pState.district_approval = Math.min(99, (pState.district_approval || 50) + 2.5);
      pState.national_approval = Math.min(99, (pState.national_approval || 50) + 2.0);
      pState.polling_margin = Number(((pState.polling_margin || 0) + 1.2).toFixed(1));

      db.prepare("UPDATE political_lobbying_contracts SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP WHERE id = ?").run(contractId);

      // Publish praise news dispatch
      db.prepare(`
        INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
        VALUES (?, ?, ?, ?, 'daily_tribune', ?, ?, 'celebratory', 'normal', ?)
      `).run(
        'pn_' + uuidv4().substring(0, 8),
        id,
        session.current_year,
        session.current_month,
        `${session.politician_name} Rebuffs Special-Interest Overtures from ${contract.trade_group}`,
        `In an unexpected show of legislative independence, ${pState.politician_title} ${session.politician_name} publicly declined a multi-million-dollar campaign donation and policy request from ${contract.trade_group}. Civic watchdog alliances praised the lawmaker for putting integrity ahead of political cash.`,
        contract.statutory_category
      );

      db.prepare('UPDATE political_sessions SET political_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(pState), id);

      const updated = await getSessionFull(id);
      return res.json({
        session: updated,
        message: `🛡️ INFLUENCE REJECTED! You rejected the lobbying offer from ${contract.trade_group}. Your ethics scrutiny dropped (-6 pts) and public approval rose!`
      });
    }
  } catch (err) {
    console.error('Error responding to lobbying contract:', err);
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

    let finalAchievement = Number(bill.achievement_score) || 5;
    let donorPromiseMsg = '';
    let fulfilledPromise = null;

    if (passed) {
      finalAchievement = calculateBillAchievementScore({
        ...bill,
        floor_vote_aye: whip.total_ayes,
        floor_vote_nay: whip.total_nays
      });
      pState.aggregate_achievement_score = (pState.aggregate_achievement_score || 0) + finalAchievement;
      pState.bills_passed = (pState.bills_passed || 0) + 1;
      pState.district_approval = Math.min(99, pState.district_approval + 6);
      pState.national_approval = Math.min(99, pState.national_approval + 5);
      pState.political_capital = Math.max(0, pState.political_capital - capitalSpent + 15);
      pState.polling_margin = Number((pState.polling_margin + 2.5).toFixed(1));

      // Check if this legislated statute fulfills a pending donor promise
      if (bill.donor_promise_id) {
        fulfilledPromise = db.prepare("SELECT * FROM political_donor_promises WHERE id = ? AND status = 'pending'").get(bill.donor_promise_id);
      }
      if (!fulfilledPromise) {
        fulfilledPromise = db.prepare(`
          SELECT * FROM political_donor_promises 
          WHERE session_id = ? AND status = 'pending' AND (suggested_bill_title = ? OR statutory_category = ?)
          ORDER BY (suggested_bill_title = ?) DESC
          LIMIT 1
        `).get(session.id, bill.title, bill.category, bill.title);
      }

      if (fulfilledPromise) {
        const bounty = Number(fulfilledPromise.war_chest_reward_millions) || 2.0;
        pState.war_chest_millions = Number(((pState.war_chest_millions || 0) + bounty).toFixed(2));

        db.prepare(`
          UPDATE political_donor_promises SET
            status = 'legislated',
            legislated_bill_id = ?,
            legislated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(bill.id, fulfilledPromise.id);

        if (fulfilledPromise.is_controversial) {
          pState.ethics_scrutiny = Math.min(100, (pState.ethics_scrutiny || 10) + 8);
          pState.polling_margin = Number(((pState.polling_margin || 0) - 1.4).toFixed(1));
          donorPromiseMsg = ` 💰 DONOR PLEDGE FULFILLED! ${fulfilledPromise.donor_group} delivered +$${bounty}M to your campaign war chest for enacting their priority! (Controversial special-interest measure sparked +8 ethics scrutiny).`;
        } else {
          pState.national_approval = Math.min(99, (pState.national_approval || 50) + 3);
          pState.polling_margin = Number(((pState.polling_margin || 0) + 1.2).toFixed(1));
          donorPromiseMsg = ` 💰 DONOR ACCORD FULFILLED! ${fulfilledPromise.donor_group} rewarded your campaign with +$${bounty}M in bundled contributions for enacting '${bill.title}'!`;
        }

        db.prepare(`
          INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
          VALUES (?, ?, ?, ?, 'beltway_insider', ?, ?, 'bullish', 'high', 'Campaign Finance')
        `).run(
          'pn_' + uuidv4().substring(0, 8),
          session.id,
          session.current_year,
          session.current_month,
          `DONOR PAYOUT: ${fulfilledPromise.donor_group} Rewards Passage of '${bill.title}' with +$${bounty}M`,
          `Following the landmark floor passage of '${bill.title}', ${fulfilledPromise.donor_group} has delivered on its fundraising commitment, bundling $${bounty}M into ${pState.politician_name}'s campaign accounts.`
        );
      }

      // Check if this legislated statute fulfills an accepted lobbying contract
      let fulfilledLobbying = null;
      if (bill.lobbying_contract_id) {
        fulfilledLobbying = db.prepare("SELECT * FROM political_lobbying_contracts WHERE id = ? AND status = 'accepted'").get(bill.lobbying_contract_id);
      }
      if (!fulfilledLobbying) {
        fulfilledLobbying = db.prepare(`
          SELECT * FROM political_lobbying_contracts 
          WHERE session_id = ? AND status = 'accepted' AND (suggested_bill_title = ? OR statutory_category = ?)
          LIMIT 1
        `).get(session.id, bill.title, bill.category);
      }

      if (fulfilledLobbying) {
        const lobBounty = Number(fulfilledLobbying.completion_bounty_millions) || 12.0;
        pState.war_chest_millions = Number(((pState.war_chest_millions || 0) + lobBounty).toFixed(2));

        db.prepare(`
          UPDATE political_lobbying_contracts SET
            status = 'fulfilled',
            legislated_bill_id = ?,
            resolved_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(bill.id, fulfilledLobbying.id);

        donorPromiseMsg += ` 🏛️ LOBBYING BOUNTY DELIVERED: ${fulfilledLobbying.trade_group} released +$${lobBounty}M in victory contributions to your Campaign War Chest!`;

        db.prepare(`
          INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
          VALUES (?, ?, ?, ?, 'capital_gazette', ?, ?, 'bullish', 'high', ?)
        `).run(
          'pn_' + uuidv4().substring(0, 8),
          session.id,
          session.current_year,
          session.current_month,
          `K-STREET VICTORY: ${fulfilledLobbying.trade_group} Delivers +$${lobBounty}M Following Passage of '${bill.title}'`,
          `With '${bill.title}' successfully enacted into sovereign law, chief lobbyist ${fulfilledLobbying.chief_lobbyist} commended the legislative leadership of ${pState.politician_name}, finalizing a major victory contribution for their re-election war chest.`,
          fulfilledLobbying.statutory_category
        );
      }

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
          month_resolved = ?,
          achievement_score = ?
        WHERE id = ?
      `).run(
        passed ? 'passed' : 'failed',
        whip.total_ayes,
        whip.total_nays,
        session.current_year,
        session.current_month,
        finalAchievement,
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
      achievement_score: finalAchievement,
      aggregate_achievement_score: pState.aggregate_achievement_score,
      donor_promise_fulfilled: fulfilledPromise,
      message: passed 
        ? `🎉 THE BILL PASSES! Enacted into law with ${whip.total_ayes} Ayes to ${whip.total_nays} Nays. (Legislative Achievement Score: +${finalAchievement}/20 pts).${donorPromiseMsg}` 
        : `BILL DEFEATED on the floor (${whip.total_ayes} Ayes to ${whip.total_nays} Nays).` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Campaign & Higher Office Options
router.get('/session/:id/campaign/options', async (req, res) => {
  try {
    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const pState = session.political_state;
    const eState = session.economic_state;
    const isCongressional = pState.system_type === 'congressional';

    const officeKeys = isCongressional 
      ? ['representative', 'senator', 'president']
      : ['backbencher', 'committee_chair', 'cabinet_minister', 'prime_minister'];

    const options = officeKeys.map(k => {
      const odds = calculateElectionOdds(k, pState, eState);
      const office = CAMPAIGN_OFFICE_DEFINITIONS[k];
      const deficit = Math.max(0, Number((office.target_war_chest - (pState.war_chest_millions || 0)).toFixed(2)));
      const questionsCount = Math.max(3, Math.min(16, Math.round(deficit / 7.0) + 2));

      return {
        ...odds,
        questions_required: questionsCount,
        is_current_office: k === pState.current_stage_id
      };
    });

    res.json({
      current_office: pState.current_stage_id,
      current_title: pState.politician_title,
      system_type: pState.system_type,
      declared_campaign: pState.declared_campaign || null,
      aggregate_achievement_score: pState.aggregate_achievement_score || 0,
      terms_in_office: pState.terms_in_office || 1,
      war_chest_millions: pState.war_chest_millions || 0,
      polling_margin: pState.polling_margin || 0,
      options
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Launch Campaign for Target Office & Initiate Donor Vetting Gauntlet
router.post('/session/:id/campaign/start', async (req, res) => {
  try {
    const { target_office_id } = req.body;
    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const pState = session.political_state;
    const targetOffice = CAMPAIGN_OFFICE_DEFINITIONS[target_office_id];
    if (!targetOffice) {
      return res.status(400).json({ error: 'Invalid target office selected' });
    }

    const currentWarChest = pState.war_chest_millions || 0;
    const questions = generateDonorQuestions(target_office_id, currentWarChest);

    pState.declared_campaign = {
      target_office_id,
      target_title: targetOffice.title,
      chamber: targetOffice.chamber,
      target_war_chest: targetOffice.target_war_chest,
      starting_war_chest: currentWarChest,
      war_chest_raised: 0,
      questions_total: questions.length,
      questions_answered: 0,
      completed: false,
      questions,
      donor_log: []
    };

    // If a sitting Senator is running for President, synchronize the election countdown to the next Presidential election!
    let electionAdjustmentNews = '';
    if (pState.current_stage_id === 'senator' && target_office_id === 'president') {
      const totalMonthsElapsed = (session.current_year - 1) * 12 + session.current_month;
      const presidentialCycle = 48; // 4 years (48 months)
      const cycleRemainder = totalMonthsElapsed % presidentialCycle;
      let monthsUntilPresElection = presidentialCycle - cycleRemainder;
      if (monthsUntilPresElection === 0) {
        monthsUntilPresElection = presidentialCycle;
      }

      // Preserve previous Senate clock so sitting Senator resumes seat if defeated
      pState.declared_campaign.previous_senate_months_to_election = pState.months_to_election;
      pState.declared_campaign.is_senator_running_for_president = true;
      pState.months_to_election = monthsUntilPresElection;

      electionAdjustmentNews = ` As a sitting Senator entering the presidential race, ${pState.politician_name}'s election countdown has been aligned with the national Presidential Election Day (in ${monthsUntilPresElection} months).`;
    }

    db.prepare(`
      UPDATE political_sessions SET
        months_to_election = ?,
        political_state = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(pState.months_to_election, JSON.stringify(pState), session.id);

    // Headline news dispatch
    db.prepare(`
      INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
      VALUES (?, ?, ?, ?, 'capital_gazette', ?, ?, 'bullish', 'high', 'Electoral Campaign')
    `).run(
      'pn_' + uuidv4().substring(0, 8),
      session.id,
      session.current_year,
      session.current_month,
      `CAMPAIGN ANNOUNCEMENT: ${pState.politician_name} Enters Race for ${targetOffice.title}`,
      `${pState.politician_name} has officially filed declaration papers to run for ${targetOffice.title}. High-dollar donor salons and finance committee vetting interrogations are now underway to amass the necessary war chest.${electionAdjustmentNews}`
    );

    const updated = await getSessionFull(session.id);
    res.json({
      session: updated,
      campaign: pState.declared_campaign,
      active_question: questions[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Answer a Question in the Donor Fundraising Gauntlet
router.post('/session/:id/campaign/answer-question', async (req, res) => {
  try {
    const { question_id, option_id } = req.body;
    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const pState = session.political_state;
    const campaign = pState.declared_campaign;
    if (!campaign || !campaign.questions) {
      return res.status(400).json({ error: 'No active campaign donor gauntlet found' });
    }

    const currentQIdx = campaign.questions_answered || 0;
    const question = campaign.questions[currentQIdx];
    if (!question || question.id !== question_id) {
      return res.status(400).json({ error: 'Question out of sync or already answered' });
    }

    const choice = question.choices.find(c => c.option_id === option_id);
    if (!choice) {
      return res.status(400).json({ error: 'Invalid choice option' });
    }

    // Apply funds raised to war chest
    const fundsRaised = Number(choice.funds_raised_millions) || 0;
    pState.war_chest_millions = Number(((pState.war_chest_millions || 0) + fundsRaised).toFixed(2));
    campaign.war_chest_raised = Number(((campaign.war_chest_raised || 0) + fundsRaised).toFixed(2));

    // Apply political side-effects
    const eff = choice.political_effects || {};
    pState.polling_margin = Number(((pState.polling_margin || 0) + (eff.polling_margin || 0)).toFixed(1));
    pState.party_loyalty = Math.max(10, Math.min(100, (pState.party_loyalty || 70) + (eff.party_loyalty || 0)));
    pState.ethics_scrutiny = Math.max(0, Math.min(100, (pState.ethics_scrutiny || 10) + (eff.ethics_scrutiny || 0)));
    pState.national_approval = Math.max(10, Math.min(99, (pState.national_approval || 50) + (eff.national_approval || 0)));

    // When a promise has been made to a donor, put it on the persistent donor promises list!
    let loggedPromise = null;
    if (choice.donor_promise) {
      const promiseId = 'pdp_' + uuidv4().substring(0, 8);
      const dp = choice.donor_promise;
      db.prepare(`
        INSERT INTO political_donor_promises (
          id, session_id, promise_key, donor_group, donor_category,
          promise_title, promise_description, statutory_category,
          suggested_bill_title, suggested_summary, suggested_fiscal_impact,
          public_support, war_chest_reward_millions, initial_funds_raised,
          controversy_level, is_controversial, status,
          created_year, created_month
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(
        promiseId,
        session.id,
        dp.promise_key || question.id,
        dp.donor_group || question.donor_group,
        dp.donor_category || question.donor_category,
        dp.promise_title,
        dp.promise_description || choice.description,
        dp.statutory_category || 'general',
        dp.suggested_bill_title || dp.promise_title,
        dp.suggested_summary || choice.description,
        dp.suggested_fiscal_impact || 0,
        dp.public_support || 50,
        dp.war_chest_reward_millions || 2.0,
        fundsRaised,
        dp.controversy_level || 'moderate',
        dp.is_controversial ? 1 : 0,
        session.current_year,
        session.current_month
      );

      loggedPromise = {
        id: promiseId,
        promise_title: dp.promise_title,
        donor_group: dp.donor_group || question.donor_group,
        war_chest_reward_millions: dp.war_chest_reward_millions || 2.0,
        controversy_level: dp.controversy_level || 'moderate',
        is_controversial: dp.is_controversial
      };
    }

    campaign.donor_log.push({
      question_id: question.id,
      donor_group: question.donor_group,
      choice_id: option_id,
      choice_label: choice.label,
      funds_raised: fundsRaised,
      logged_promise: loggedPromise,
      effects: eff
    });

    campaign.questions_answered = currentQIdx + 1;
    if (campaign.questions_answered >= campaign.questions_total) {
      campaign.completed = true;

      // Celebrate full qualification
      db.prepare(`
        INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
        VALUES (?, ?, ?, ?, 'beltway_insider', ?, ?, 'favorable', 'medium', 'Campaign Fundraising')
      `).run(
        'pn_' + uuidv4().substring(0, 8),
        session.id,
        session.current_year,
        session.current_month,
        `FINANCIAL QUALIFICATION: ${pState.politician_name} Clears War Chest Goal for ${campaign.target_title}`,
        `Following ${campaign.questions_total} rounds of intense donor interrogation and grassroots outreach, ${pState.politician_name} has raised a total of $${campaign.war_chest_raised}M, positioning the campaign on strong financial footing ahead of the vote.`
      );
    }

    db.prepare(`
      UPDATE political_sessions SET
        political_state = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(pState), session.id);

    const nextQ = campaign.completed ? null : campaign.questions[campaign.questions_answered];
    const updated = await getSessionFull(session.id);

    res.json({
      session: updated,
      campaign,
      funds_raised_this_round: fundsRaised,
      logged_promise: loggedPromise,
      completed: campaign.completed,
      next_question: nextQ
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
      session.bills || [],
      session
    );

    // Save advisor response
    db.prepare('INSERT INTO political_advisor_messages (id, session_id, sender, content) VALUES (?, ?, ?, ?)').run(
      'pam_' + uuidv4().substring(0, 8),
      session.id,
      'advisor',
      advice.content
    );

    // If an outreach to another caucus leader was conducted by the advisor on behalf of the office
    if (advice.caucusOutreach) {
      const co = advice.caucusOutreach;
      db.prepare(`
        INSERT INTO political_caucus_dms (
          id, session_id, caucus_id, caucus_leader_name, sender, channel, content, created_year, created_month
        ) VALUES (?, ?, ?, ?, 'advisor', 'aide_channel', ?, ?, ?)
      `).run(
        'cdm_' + uuidv4().substring(0, 8),
        session.id,
        co.targetCaucus.id,
        co.targetCaucus.leader,
        `[Office Dispatch from Chief of Staff]: ${message}`,
        session.current_year,
        session.current_month
      );

      db.prepare(`
        INSERT INTO political_caucus_dms (
          id, session_id, caucus_id, caucus_leader_name, sender, channel, content, requires_personal_response, personal_prompt, created_year, created_month
        ) VALUES (?, ?, ?, ?, 'caucus_leader', 'aide_channel', ?, ?, ?, ?, ?)
      `).run(
        'cdm_' + uuidv4().substring(0, 8),
        session.id,
        co.targetCaucus.id,
        co.targetCaucus.leader,
        co.leaderResponseText,
        co.requiresPersonalResponse ? 1 : 0,
        co.personalPrompt || null,
        session.current_year,
        session.current_month
      );
    }

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

// Get Caucus DMs
router.get('/session/:id/caucus-dms', async (req, res) => {
  try {
    const dms = db.prepare('SELECT * FROM political_caucus_dms WHERE session_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ dms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a Direct Message to an AI Caucus Leader (User direct or personal prompt response)
router.post('/session/:id/caucus-dms/:caucusId', async (req, res) => {
  try {
    const { message, is_personal_response, active_personal_prompt } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const session = await getSessionFull(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const targetCaucus = session.caucuses.find(c => c.id === req.params.caucusId);
    if (!targetCaucus) {
      return res.status(404).json({ error: 'Caucus not found' });
    }

    const pState = session.political_state;
    const eState = session.economic_state;
    const dmHistory = session.caucus_dms?.filter(d => d.caucus_id === targetCaucus.id) || [];

    // If answering a personal challenge, mark previous demand as submitted
    if (is_personal_response) {
      db.prepare(`
        UPDATE political_caucus_dms 
        SET personal_response_submitted = 1 
        WHERE session_id = ? AND caucus_id = ? AND requires_personal_response = 1
      `).run(session.id, targetCaucus.id);
    }

    // Save user's direct personal message
    const userMsgId = 'cdm_' + uuidv4().substring(0, 8);
    db.prepare(`
      INSERT INTO political_caucus_dms (
        id, session_id, caucus_id, caucus_leader_name, sender, channel, content, personal_response_submitted, created_year, created_month
      ) VALUES (?, ?, ?, ?, 'user', 'direct_dm', ?, ?, ?, ?)
    `).run(
      userMsgId,
      session.id,
      targetCaucus.id,
      targetCaucus.leader,
      message.trim(),
      is_personal_response ? 1 : 0,
      session.current_year,
      session.current_month
    );

    // Generate Caucus Leader AI Response using v4-pro thinking
    const aiRes = await generateCaucusLeaderAIResponse({
      caucusId: targetCaucus.id,
      senderType: 'user',
      incomingMessage: message.trim(),
      isRespondingToPersonalPrompt: !!is_personal_response,
      activePersonalPrompt: active_personal_prompt || null,
      pState,
      eState,
      bills: session.bills || [],
      dmHistory,
      session
    });

    // Save Caucus Leader's reply
    const leaderMsgId = 'cdm_' + uuidv4().substring(0, 8);
    db.prepare(`
      INSERT INTO political_caucus_dms (
        id, session_id, caucus_id, caucus_leader_name, sender, channel, content, requires_personal_response, personal_prompt, created_year, created_month
      ) VALUES (?, ?, ?, ?, 'caucus_leader', 'direct_dm', ?, ?, ?, ?, ?)
    `).run(
      leaderMsgId,
      session.id,
      targetCaucus.id,
      targetCaucus.leader,
      aiRes.content,
      aiRes.requiresPersonalResponse ? 1 : 0,
      aiRes.personalPrompt || null,
      session.current_year,
      session.current_month
    );

    let dealNotification = null;

    // If deal was struck and votes pledged
    if (aiRes.dealAgreed && aiRes.pledgedVotes > 0) {
      // Find active bill to pledge votes to
      const targetBill = session.bills?.find(b => b.status === 'in_committee' || b.status === 'floor_debate') || session.bills?.[0];
      const targetBillId = targetBill ? targetBill.id : null;
      const targetBillTitle = targetBill ? targetBill.title : 'Active Statutory Docket';

      const dealId = 'cd_' + uuidv4().substring(0, 8);
      db.prepare(`
        INSERT INTO political_caucus_deals (
          id, session_id, caucus_id, caucus_name, caucus_leader, member_count, ideology, docket_bill_title, docket_bill_summary, docket_bill_category, docket_bill_impact, user_target_bill_id, user_target_bill_title, pledged_votes, demands_description, status, year_proposed, month_proposed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'bipartisan', 0, ?, ?, ?, ?, 'accepted', ?, ?)
      `).run(
        dealId,
        session.id,
        targetCaucus.id,
        targetCaucus.name,
        targetCaucus.leader,
        targetCaucus.member_count,
        targetCaucus.ideology,
        `${targetCaucus.name} Policy Accord`,
        `Formal legislative agreement personally negotiated between ${pState.politician_name} and ${targetCaucus.leader}.`,
        targetBillId,
        targetBillTitle,
        aiRes.pledgedVotes,
        `Direct Cloakroom Compact: ${targetCaucus.leader} pledged ${aiRes.pledgedVotes} locked votes.`,
        session.current_year,
        session.current_month
      );

      // Add pledged votes to the bill if exists
      if (targetBill) {
        const newPledged = (targetBill.pledged_caucus_votes || 0) + aiRes.pledgedVotes;
        db.prepare('UPDATE political_bills SET pledged_caucus_votes = ? WHERE id = ?').run(newPledged, targetBill.id);
      }

      // Boost political capital and party loyalty
      pState.political_capital = Math.min(100, (pState.political_capital || 0) + 8);
      pState.party_loyalty = Math.min(100, (pState.party_loyalty || 50) + 4);
      db.prepare('UPDATE political_sessions SET political_state = ? WHERE id = ?').run(JSON.stringify(pState), session.id);

      // Publish dispatch
      db.prepare(`
        INSERT INTO political_news_dispatches (id, session_id, year, month, publisher, headline, body, tone, urgency, featured_issue)
        VALUES (?, ?, ?, ?, 'capital_gazette', ?, ?, 'bullish', 'high', 'Cloakroom Diplomacy')
      `).run(
        'pn_' + uuidv4().substring(0, 8),
        session.id,
        session.current_year,
        session.current_month,
        `HISTORIC ACCORD: ${pState.politician_name} & ${targetCaucus.leader} Seal Floor Alliance`,
        `Following intense personal cloakroom negotiations without staff intermediaries, ${targetCaucus.leader} announced that the ${targetCaucus.name} has pledged ${aiRes.pledgedVotes} locked votes in support of ${pState.politician_name}'s legislative priorities, dramatically shifting the chamber's balance of power.`
      );

      dealNotification = `🎉 COMPACT SEALED: ${targetCaucus.leader} has pledged ${aiRes.pledgedVotes} locked caucus votes for your legislation! (+8 Political Capital)`;
    }

    const updated = await getSessionFull(session.id);
    res.json({
      leader_response: aiRes.content,
      deal_notification: dealNotification,
      requires_personal_response: aiRes.requiresPersonalResponse,
      personal_prompt: aiRes.personalPrompt,
      session: updated
    });
  } catch (err) {
    console.error('Error in caucus DM:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
