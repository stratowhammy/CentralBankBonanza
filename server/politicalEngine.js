const fs = require('fs');
const path = require('path');
const { evolveEconomy, getInitialEconomicState } = require('./simulationEngine');

// Load political event web
let politicalEventWeb = null;
try {
  const pPath = path.join(__dirname, 'political_event_web.json');
  if (fs.existsSync(pPath)) {
    politicalEventWeb = JSON.parse(fs.readFileSync(pPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load political_event_web.json:', e.message);
}

// Track definitions
const PARLIAMENTARY_TRACKS = [
  {
    id: 'backbencher',
    title: 'Member of Parliament (Backbencher)',
    chamber: 'House of Commons',
    description: 'Freshly elected constituency MP representing local interests, tabling parliamentary questions and building faction alliances.',
    next_stage: 'committee_chair',
    min_seniority: 1,
    promotion_requirements: { seniority: 3, district_approval: 52, bills_passed: 1, party_loyalty: 55 }
  },
  {
    id: 'committee_chair',
    title: 'Chair of Select Committee',
    chamber: 'Select Committee on Economic & Treasury Affairs',
    description: 'Influential committee leader with subpoena and inquiry power over ministries and central bank governors.',
    next_stage: 'cabinet_minister',
    min_seniority: 3,
    promotion_requirements: { seniority: 5, national_approval: 55, political_capital: 35, party_loyalty: 65 }
  },
  {
    id: 'cabinet_minister',
    title: 'Cabinet Minister of State',
    chamber: 'Cabinet / HM Government',
    description: 'Senior minister directing a major national department, shaping legislative agendas and leading party messaging.',
    next_stage: 'prime_minister',
    min_seniority: 5,
    promotion_requirements: { seniority: 7, national_approval: 60, party_loyalty: 75, political_capital: 60 }
  },
  {
    id: 'prime_minister',
    title: 'Prime Minister & Head of Government',
    chamber: '10 Downing / Executive Suite',
    description: 'Chief executive leader directing government policy, commanding parliamentary majority, and managing national crises.',
    next_stage: null,
    min_seniority: 7,
    promotion_requirements: null
  }
];

const CONGRESSIONAL_TRACKS = [
  {
    id: 'representative',
    title: 'United States Representative',
    chamber: 'House of Representatives',
    description: 'District Congressperson fighting for local community funding, serving on subcommittees and fighting every 2-year election cycle.',
    next_stage: 'committee_chair',
    min_seniority: 1,
    promotion_requirements: { seniority: 3, district_approval: 54, war_chest: 5.0, bills_passed: 1 }
  },
  {
    id: 'committee_chair',
    title: 'Ranking Committee Chair / House Whip',
    chamber: 'Ways & Means / Energy & Commerce',
    description: 'Powerful legislative powerbroker orchestrating whip counts, floor amendments, and high-dollar PAC fundraising.',
    next_stage: 'senator',
    min_seniority: 3,
    promotion_requirements: { seniority: 5, national_approval: 56, war_chest: 15.0, political_capital: 40 }
  },
  {
    id: 'senator',
    title: 'United States Senator',
    chamber: 'United States Senate',
    description: 'Statewide statesman with 6-year term security, filibuster authority, judicial confirmation power, and treaty votes.',
    next_stage: 'president',
    min_seniority: 5,
    promotion_requirements: { seniority: 8, national_approval: 62, war_chest: 45.0, political_capital: 75 }
  },
  {
    id: 'president',
    title: 'President of the United States',
    chamber: 'The Oval Office',
    description: 'Head of State, Commander-in-Chief, with executive order authority, veto power, and international summit leadership.',
    next_stage: null,
    min_seniority: 8,
    promotion_requirements: null
  }
];

// District and party archetypes
const PARTY_ARCHETYPES = [
  {
    name: 'Democratic Alliance',
    ideology: 'Center-Left Progressive',
    primary_focus: 'Social programs, green infrastructure, healthcare access, public education',
    wings: [
      { name: 'Progressive Caucus', share: 35, base_loyalty: 60, priority: 'public_welfare' },
      { name: 'Moderate Centrists', share: 45, base_loyalty: 80, priority: 'fiscal_pragmatism' },
      { name: 'Frontline Swing-Districts', share: 20, base_loyalty: 50, priority: 're_election' }
    ]
  },
  {
    name: 'Conservative Union',
    ideology: 'Center-Right Free Enterprise',
    primary_focus: 'Tax competitiveness, deregulation, sovereign defense, balanced fiscal budgets',
    wings: [
      { name: 'Supply-Side Enterprise Club', share: 40, base_loyalty: 75, priority: 'tax_relief' },
      { name: 'Fiscal Deficit Hawks', share: 35, base_loyalty: 65, priority: 'spending_caps' },
      { name: 'Border & Defense Hawks', share: 25, base_loyalty: 85, priority: 'security' }
    ]
  },
  {
    name: 'Independent Reform Alliance',
    ideology: 'Trans-partisan Pragmatic',
    primary_focus: 'Government accountability, debt reduction, infrastructure, electoral reform',
    wings: [
      { name: 'Technocrats & Reformers', share: 50, base_loyalty: 70, priority: 'efficiency' },
      { name: 'Civic Moderates', share: 50, base_loyalty: 75, priority: 'consensus' }
    ]
  }
];

function getInitialPoliticalState(systemType = 'parliamentary', selectedTrack = null, partyName = 'Democratic Alliance', districtName = 'Metro-Industrial 4th') {
  const isParliamentary = systemType === 'parliamentary';
  const tracks = isParliamentary ? PARLIAMENTARY_TRACKS : CONGRESSIONAL_TRACKS;
  const initialTrackId = selectedTrack || (isParliamentary ? 'backbencher' : 'representative');
  const trackObj = tracks.find(t => t.id === initialTrackId) || tracks[0];

  const party = PARTY_ARCHETYPES.find(p => p.name === partyName) || PARTY_ARCHETYPES[0];

  return {
    politician_title: trackObj.title,
    current_stage_id: trackObj.id,
    chamber: trackObj.chamber,
    system_type: systemType,
    party_name: party.name,
    party_ideology: party.ideology,
    party_wings: party.wings,
    district_name: districtName,
    
    // Core Political Metrics (0-100)
    district_approval: 56.5, // Popularity in home constituency
    national_approval: 48.0, // National name recognition & favorability
    party_loyalty: 72.0,    // Whip confidence & party standing
    political_capital: 30,   // Currency spent to whip votes & advance bills (0-100)
    war_chest_millions: isParliamentary ? 1.5 : 4.2, // Campaign fundraising funds ($M)
    ethics_scrutiny: 12.0,   // Scandal / investigative risk (0-100, low is good)
    polling_margin: 3.5,     // Polling margin vs upcoming election challenger (+/- %)
    coalition_stability: 68.0,// Parliamentary/congressional floor stability
    media_sentiment: 15.0,   // -100 to +100 press tone
    
    // Legislative Stats & Pedigree
    legislative_seniority: 1, // Years in legislature
    terms_in_office: 1,       // Terms completed in office
    aggregate_achievement_score: 0, // Sum of 1-20 achievement magnitude for bills passed
    last_election_vote_share: 53.8, // Baseline benchmark for election model
    bills_sponsored: 0,
    bills_passed: 0,
    hearings_held: 0,
    townhalls_conducted: 0,
    fundraisers_held: 0,
    declared_campaign: null, // Active higher office bid & donor gauntlet state
    
    // Committee assignment
    committee_name: isParliamentary ? 'Select Committee on Finance & Public Accounts' : 'House Committee on Ways & Means',
    
    // Promotion readiness
    promotion_available: false,
    next_stage_id: trackObj.next_stage,

    // Election cycle
    months_to_election: isParliamentary ? 36 : 24, // 3 years or 2 years cycle
    election_year_span: isParliamentary ? 3 : 2,
    
    // Recent actions & active campaign
    recent_actions: [],
    active_campaigns: []
  };
}

// Calculate floor whip counts based on party wings, capital spent, and bill attributes
function calculateWhipVoteCount(bill, politicalState, capitalSpent = 0) {
  const isParliamentary = politicalState.system_type === 'parliamentary';
  const totalSeats = isParliamentary ? 650 : (politicalState.current_stage_id === 'senator' ? 100 : 435);
  const majorityThreshold = Math.floor(totalSeats / 2) + 1;

  // Ruling party seats vs opposition seats
  const partySharePct = 0.54; // 54% majority
  const partySeats = Math.round(totalSeats * partySharePct);
  const oppositionSeats = totalSeats - partySeats;

  // Base faction alignment
  const loyaltyFactor = (politicalState.party_loyalty || 60) / 100;
  const capitalBonus = Math.min(25, capitalSpent * 1.5); // extra persuasion
  const publicSupportBonus = ((bill.public_support || 50) - 50) * 0.4;

  let partyAyes = 0;
  let partyNays = 0;
  let partyUndecided = 0;

  for (const wing of (politicalState.party_wings || [])) {
    const wingSeats = Math.round(partySeats * (wing.share / 100));
    let wingSupportChance = (wing.base_loyalty / 100) * 0.7 + (loyaltyFactor * 0.2) + (capitalBonus / 100) + (publicSupportBonus / 100);
    
    // Fiscal impact friction
    if (bill.fiscal_impact_billions > 30 && wing.priority === 'fiscal_pragmatism') {
      wingSupportChance -= 0.18;
    }
    if (bill.category === 'social_welfare' && wing.priority === 'public_welfare') {
      wingSupportChance += 0.25;
    }

    wingSupportChance = Math.max(0.05, Math.min(0.98, wingSupportChance));

    const ayes = Math.round(wingSeats * wingSupportChance);
    const nays = Math.round(wingSeats * (1 - wingSupportChance) * 0.75);
    const undecided = wingSeats - ayes - nays;

    partyAyes += ayes;
    partyNays += nays;
    partyUndecided += undecided;
  }

  // Opposition crossover votes (usually 10-25% on bipartisan bills)
  const isBipartisanCategory = ['infrastructure', 'national_security', 'veterans', 'technology'].includes(bill.category);
  const oppositionCrossoverRate = isBipartisanCategory ? 0.28 : 0.08;
  const oppAyes = Math.round(oppositionSeats * oppositionCrossoverRate + (publicSupportBonus > 5 ? oppositionSeats * 0.05 : 0));
  const oppNays = oppositionSeats - oppAyes;

  const totalAyes = partyAyes + oppAyes;
  const totalNays = partyNays + oppNays;
  const passed = totalAyes >= majorityThreshold;

  return {
    total_seats: totalSeats,
    majority_threshold: majorityThreshold,
    passed,
    total_ayes: totalAyes,
    total_nays: totalNays,
    undecided: partyUndecided,
    breakdown: {
      party_ayes: partyAyes,
      party_nays: partyNays,
      party_undecided: partyUndecided,
      opposition_ayes: oppAyes,
      opposition_nays: oppNays
    },
    whip_assessment: passed 
      ? `Clear floor majority of ${totalAyes} to ${totalNays}. Measure is primed for passage.` 
      : `Deficit of ${majorityThreshold - totalAyes} votes. Additional capital spending or committee concessions required.`
  };
}

// Evolve the political state when a month advances
function evolvePoliticalState(politicalState, economicState, primaryAction = null, chosenEventOption = null) {
  const pState = JSON.parse(JSON.stringify(politicalState));
  const eState = JSON.parse(JSON.stringify(economicState));

  // 1. Decrement months to election
  pState.months_to_election = Math.max(0, pState.months_to_election - 1);

  // 2. Macroeconomic Drag / Boost on Polling & Approval
  // High inflation voter penalty
  if (eState.inflation_cpi > 4.5) {
    pState.district_approval = Math.max(15, pState.district_approval - 1.2);
    pState.national_approval = Math.max(15, pState.national_approval - 1.5);
    pState.polling_margin = Number((pState.polling_margin - 0.8).toFixed(1));
  } else if (eState.inflation_cpi < 2.5) {
    pState.district_approval = Math.min(95, pState.district_approval + 0.4);
    pState.national_approval = Math.min(95, pState.national_approval + 0.5);
    pState.polling_margin = Number((pState.polling_margin + 0.3).toFixed(1));
  }

  // High unemployment penalty
  if (eState.unemployment_rate > 5.2) {
    pState.district_approval = Math.max(15, pState.district_approval - 1.0);
    pState.polling_margin = Number((pState.polling_margin - 0.6).toFixed(1));
  } else if (eState.unemployment_rate < 3.8) {
    pState.district_approval = Math.min(95, pState.district_approval + 0.5);
    pState.polling_margin = Number((pState.polling_margin + 0.4).toFixed(1));
  }

  // GDP growth effect
  if (eState.gdp_growth > 2.5) {
    pState.national_approval = Math.min(95, pState.national_approval + 0.6);
    pState.district_approval = Math.min(95, pState.district_approval + 0.5);
  } else if (eState.gdp_growth < 0.5) {
    pState.national_approval = Math.max(15, pState.national_approval - 1.2);
  }

  // Interest rate anger (mortgages & business borrowing)
  if (eState.interest_rate > 4.5) {
    pState.district_approval = Math.max(15, pState.district_approval - 0.5);
    pState.media_sentiment = Math.max(-100, pState.media_sentiment - 3);
  }

  // 3. Process Player Primary Action
  if (primaryAction) {
    switch (primaryAction.type) {
      case 'constituent_townhall':
        pState.district_approval = Math.min(98, pState.district_approval + 3.5);
        pState.polling_margin = Number((pState.polling_margin + 1.2).toFixed(1));
        pState.political_capital = Math.min(100, pState.political_capital + 5);
        pState.townhalls_conducted = (pState.townhalls_conducted || 0) + 1;
        break;

      case 'campaign_fundraiser':
        const raised = Number((1.5 + Math.random() * 2.5).toFixed(2));
        pState.war_chest_millions = Number((pState.war_chest_millions + raised).toFixed(2));
        pState.party_loyalty = Math.min(100, pState.party_loyalty + 2);
        pState.fundraisers_held = (pState.fundraisers_held || 0) + 1;
        break;

      case 'media_press_conference':
        const toneScore = Math.random() > 0.3 ? 8 : -4;
        pState.media_sentiment = Math.max(-100, Math.min(100, pState.media_sentiment + toneScore));
        pState.national_approval = Math.max(15, Math.min(95, pState.national_approval + (toneScore > 0 ? 2.5 : -1.5)));
        pState.political_capital = Math.min(100, pState.political_capital + 4);
        break;

      case 'committee_hearing':
        pState.hearings_held = (pState.hearings_held || 0) + 1;
        pState.political_capital = Math.min(100, pState.political_capital + 8);
        pState.national_approval = Math.min(95, pState.national_approval + 1.5);
        pState.party_loyalty = Math.min(100, pState.party_loyalty + 3);
        break;

      case 'party_whip_bargain':
        pState.party_loyalty = Math.min(100, pState.party_loyalty + 7);
        pState.political_capital = Math.min(100, pState.political_capital + 6);
        pState.coalition_stability = Math.min(100, pState.coalition_stability + 4);
        break;

      case 'pork_barrel_appropriation':
        pState.district_approval = Math.min(98, pState.district_approval + 4.0);
        pState.polling_margin = Number((pState.polling_margin + 1.5).toFixed(1));
        pState.political_capital = Math.max(0, pState.political_capital - 8);
        eState.fiscal_deficit = Number((eState.fiscal_deficit + 0.15).toFixed(2));
        break;
    }
  }

  // 4. Process Event Choice Consequences
  if (chosenEventOption && chosenEventOption.political_effects) {
    const pe = chosenEventOption.political_effects;
    if (pe.district_approval) pState.district_approval = Math.max(10, Math.min(99, pState.district_approval + pe.district_approval));
    if (pe.national_approval) pState.national_approval = Math.max(10, Math.min(99, pState.national_approval + pe.national_approval));
    if (pe.party_loyalty) pState.party_loyalty = Math.max(10, Math.min(100, pState.party_loyalty + pe.party_loyalty));
    if (pe.war_chest) pState.war_chest_millions = Number(Math.max(0, pState.war_chest_millions + pe.war_chest).toFixed(2));
    if (pe.political_capital) pState.political_capital = Math.max(0, Math.min(100, pState.political_capital + pe.political_capital));
  }

  // 5. Evaluate Promotion Eligibility
  const tracks = pState.system_type === 'parliamentary' ? PARLIAMENTARY_TRACKS : CONGRESSIONAL_TRACKS;
  const currentStage = tracks.find(t => t.id === pState.current_stage_id);
  
  if (currentStage && currentStage.promotion_requirements) {
    const req = currentStage.promotion_requirements;
    const meetsSeniority = (pState.legislative_seniority || 1) >= (req.seniority || 1);
    const meetsDistApproval = !req.district_approval || pState.district_approval >= req.district_approval;
    const meetsNatApproval = !req.national_approval || pState.national_approval >= req.national_approval;
    const meetsLoyalty = !req.party_loyalty || pState.party_loyalty >= req.party_loyalty;
    const meetsCapital = !req.political_capital || pState.political_capital >= req.political_capital;
    const meetsWarChest = !req.war_chest || pState.war_chest_millions >= req.war_chest;
    const meetsBills = !req.bills_passed || pState.bills_passed >= req.bills_passed;

    pState.promotion_available = meetsSeniority && meetsDistApproval && meetsNatApproval && meetsLoyalty && meetsCapital && meetsWarChest && meetsBills;
  } else {
    pState.promotion_available = false;
  }

  // 6. Round and Sanitize Numbers
  pState.district_approval = Number(pState.district_approval.toFixed(1));
  pState.national_approval = Number(pState.national_approval.toFixed(1));
  pState.party_loyalty = Number(pState.party_loyalty.toFixed(1));
  pState.polling_margin = Number(pState.polling_margin.toFixed(1));
  pState.coalition_stability = Number(pState.coalition_stability.toFixed(1));
  pState.ethics_scrutiny = Number(pState.ethics_scrutiny.toFixed(1));

  return { politicalState: pState, economicState: eState };
}

// Generate monthly political news dispatches
function generatePoliticalNews(pState, eState, year, month) {
  const articles = [];

  // Publisher 1: The Capital Gazette (Beltway / Westminster elite political insider)
  const isHighInflation = eState.inflation_cpi > 4.0;
  const approval = pState.district_approval;

  let gazetteHeadline = `Lawmakers Return as Economic Telemetry Shifts`;
  let gazetteBody = `Legislative leaders reconvened this week amid intense committee negotiations over the national budget and regulatory priorities.`;
  if (isHighInflation) {
    gazetteHeadline = `Inflation Anger Dominates Town Halls as Voters Demand Relief`;
    gazetteBody = `Backbenchers and district representatives report fierce constituent backlash over grocery and power utility rates, complicating upcoming floor votes.`;
  } else if (pState.bills_passed > 0) {
    gazetteHeadline = `${pState.politician_title} ${pState.politician_name} Consolidates Committee Influence After Legislative Wins`;
    gazetteBody = `Senior party whips note growing momentum around ${pState.politician_name}'s policy docket, positioning the office for senior leadership consideration.`;
  }

  articles.push({
    publisher: 'capital_gazette',
    publisher_name: 'The Capital Gazette',
    headline: gazetteHeadline,
    body: gazetteBody,
    tone: isHighInflation ? 'alarmist' : 'analytical',
    urgency: isHighInflation ? 'high' : 'medium',
    featured_issue: isHighInflation ? 'Inflation & Cost of Living' : 'Legislative Docket',
    year,
    month
  });

  // Publisher 2: Daily Tribune (Populist / Main Street daily)
  let tribuneHeadline = `Constituents Demand Action on Mortgages and Job Security`;
  let tribuneBody = `Working families across ${pState.district_name} are watching parliament closely as living expenses and housing pressures mount.`;
  if (approval >= 65) {
    tribuneHeadline = `District Poll Shows Surging Approval for ${pState.politician_name}`;
    tribuneBody = `Local voters cite constituent responsiveness and infrastructure advocacy as key factors behind strong polling margins.`;
  } else if (approval < 45) {
    tribuneHeadline = `Challenger Launches Early Ad Blitz Targeting Incumbent Record`;
    tribuneBody = `Opposition campaigns have begun buying local airtime, highlighting economic anxieties and legislative gridlock.`;
  }

  articles.push({
    publisher: 'daily_tribune',
    publisher_name: 'The Daily Tribune',
    headline: tribuneHeadline,
    body: tribuneBody,
    tone: approval < 45 ? 'critical' : 'favorable',
    urgency: 'medium',
    featured_issue: 'Constituent Mood',
    year,
    month
  });

  // Publisher 3: Westminster Wire / Beltway Insider
  articles.push({
    publisher: 'westminster_wire',
    publisher_name: pState.system_type === 'parliamentary' ? 'Westminster Wire' : 'Beltway Insider',
    headline: `Whip Operations Gauge Floor Margins Ahead of Key Divisions`,
    body: `Party whips are keeping a close tally on moderate and frontline members as leadership prepares the legislative calendar. Factional discipline remains tight.`,
    tone: 'insider',
    urgency: 'low',
    featured_issue: 'Whip Operations',
    year,
    month
  });

  return articles;
}

// Check for and trigger political events based on live economic and political state
function checkForPoliticalEvent(pState, eState) {
  if (!politicalEventWeb || !politicalEventWeb.events) return null;

  // Decide polarity based on general mood
  const isNegative = eState.inflation_cpi > 4.2 || eState.unemployment_rate > 5.2 || pState.district_approval < 48 || Math.random() < 0.45;
  const candidates = politicalEventWeb.events.filter(e => isNegative ? e.polarity === 'Negative' : e.polarity === 'Positive');

  if (candidates.length === 0) return null;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  return picked;
}

// Calculate achievement magnitude score for a bill (1 to 20)
function calculateBillAchievementScore(bill) {
  let score = 4; // Base score

  // 1. Fiscal impact magnitude (up to +6)
  const fiscal = Math.abs(Number(bill.fiscal_impact_billions) || 0);
  if (fiscal >= 150) score += 6;
  else if (fiscal >= 75) score += 5;
  else if (fiscal >= 40) score += 4;
  else if (fiscal >= 20) score += 3;
  else if (fiscal >= 8) score += 2;
  else if (fiscal >= 2) score += 1;

  // 2. Policy category significance (up to +4)
  const cat = (bill.category || '').toLowerCase();
  if (['healthcare', 'entitlements', 'taxation', 'defense', 'constitutional'].includes(cat)) {
    score += 4;
  } else if (['infrastructure', 'climate', 'energy', 'budget', 'education'].includes(cat)) {
    score += 3;
  } else if (['regulation', 'labor', 'technology', 'trade'].includes(cat)) {
    score += 2;
  } else {
    score += 1;
  }

  // 3. Public support breadth (up to +3)
  const support = Number(bill.public_support) || 50;
  if (support >= 75) score += 3;
  else if (support >= 65) score += 2;
  else if (support >= 55) score += 1;

  // 4. Floor vote consensus / bipartisan margin (up to +3)
  if (bill.floor_vote_aye && bill.floor_vote_nay) {
    const total = bill.floor_vote_aye + bill.floor_vote_nay;
    const ayeShare = total > 0 ? (bill.floor_vote_aye / total) : 0.5;
    if (ayeShare >= 0.68) score += 3;
    else if (ayeShare >= 0.58) score += 2;
    else if (ayeShare >= 0.52) score += 1;
  } else {
    score += 1;
  }

  return Math.max(1, Math.min(20, Math.round(score)));
}

// Offices available for election campaigns
const CAMPAIGN_OFFICE_DEFINITIONS = {
  // Congressional System
  representative: {
    id: 'representative',
    title: 'United States Representative',
    chamber: 'House of Representatives',
    system_type: 'congressional',
    target_war_chest: 6.0,
    target_achievement: 18,
    min_terms: 1,
    term_months: 24,
    description: 'District Congressperson fighting for local community funding and district constituent needs in every 2-year election cycle.',
    powers_summary: 'Originate revenue legislation, table amendments, vote on federal appropriations.'
  },
  senator: {
    id: 'senator',
    title: 'United States Senator',
    chamber: 'United States Senate',
    system_type: 'congressional',
    target_war_chest: 32.0,
    target_achievement: 48,
    min_terms: 2,
    term_months: 72,
    description: 'Statewide statesman with 6-year tenure, filibuster authority, judicial confirmation power, and treaty ratification votes.',
    powers_summary: 'Advise and consent on cabinet secretaries & judges, ratify treaties, command statewide media attention.'
  },
  president: {
    id: 'president',
    title: 'President of the United States',
    chamber: 'The Oval Office / Executive Branch',
    system_type: 'congressional',
    target_war_chest: 125.0,
    target_achievement: 90,
    min_terms: 3,
    term_months: 48,
    description: 'Head of State and Commander-in-Chief with executive orders, statutory veto authority, and international summit leadership.',
    powers_summary: 'Executive order decrees, absolute veto over congressional bills, appoint federal reserve governors.'
  },

  // Parliamentary System
  backbencher: {
    id: 'backbencher',
    title: 'Member of Parliament (Backbencher)',
    chamber: 'House of Commons',
    system_type: 'parliamentary',
    target_war_chest: 2.5,
    target_achievement: 14,
    min_terms: 1,
    term_months: 36,
    description: 'Constituency MP tabling parliamentary questions, debating white papers, and building cross-faction alliances.',
    powers_summary: 'Table motions, vote on government supply, represent constituency cases.'
  },
  committee_chair: {
    id: 'committee_chair',
    title: 'Chair of Select Committee',
    chamber: 'Select Committee on Finance & Public Accounts',
    system_type: 'parliamentary',
    target_war_chest: 7.0,
    target_achievement: 30,
    min_terms: 2,
    term_months: 36,
    description: 'Influential parliamentary scrutiny chair with subpoena power over ministers and central bank governors.',
    powers_summary: 'Summon ministers, question central bankers, publish binding investigative reports.'
  },
  cabinet_minister: {
    id: 'cabinet_minister',
    title: 'Cabinet Minister of State',
    chamber: 'Cabinet / HM Government',
    system_type: 'parliamentary',
    target_war_chest: 20.0,
    target_achievement: 55,
    min_terms: 3,
    term_months: 36,
    description: 'Senior minister directing major national ministry departments, formulating statutory bills, and steering treasury allocations.',
    powers_summary: 'Direct civil service ministries, sponsor official government legislation, shape fiscal envelopes.'
  },
  prime_minister: {
    id: 'prime_minister',
    title: 'Prime Minister & Head of Government',
    chamber: '10 Downing / Executive Suite',
    system_type: 'parliamentary',
    target_war_chest: 70.0,
    target_achievement: 85,
    min_terms: 4,
    term_months: 36,
    description: 'Chief Executive leading the parliamentary majority, appointing the Cabinet, and managing sovereign governance.',
    powers_summary: 'Recommend dissolution of parliament, command legislative majority, appoint all government ministers.'
  }
};

// Calculate election odds based on popularity, terms in office, and legislative achievement score
function calculateElectionOdds(targetOfficeId, pState, eState) {
  const office = CAMPAIGN_OFFICE_DEFINITIONS[targetOfficeId] || CAMPAIGN_OFFICE_DEFINITIONS.representative;

  // 1. Popularity & Polling
  const pollingMargin = Number(pState.polling_margin) || 0;
  const pollingScore = pollingMargin * 1.6;

  const lastElection = Number(pState.last_election_vote_share) || 52.0;
  const lastElectionScore = (lastElection - 50.0) * 0.7;

  let approvalScore = 0;
  const isNational = ['senator', 'president', 'cabinet_minister', 'prime_minister'].includes(office.id);
  if (office.id === 'president' || office.id === 'prime_minister') {
    const blended = ((pState.national_approval || 50) * 0.75) + ((pState.district_approval || 50) * 0.25);
    approvalScore = (blended - 50.0) * 0.6;
  } else if (isNational) {
    const blended = ((pState.national_approval || 50) * 0.5) + ((pState.district_approval || 50) * 0.5);
    approvalScore = (blended - 50.0) * 0.55;
  } else {
    approvalScore = ((pState.district_approval || 55) - 50.0) * 0.5;
  }

  // 2. Terms in Office & Seniority
  const terms = Number(pState.terms_in_office) || 1;
  const minTerms = office.min_terms || 1;
  let termsScore = 0;
  if (terms >= minTerms) {
    termsScore = Math.min(22, (terms - minTerms + 1) * 4.5);
  } else {
    termsScore = -1 * (minTerms - terms) * 8.0;
  }

  // 3. Legislative Achievement Score (Bills Authored & Passed)
  const aggregateScore = Number(pState.aggregate_achievement_score) || 0;
  const targetAchieve = office.target_achievement || 25;
  const achievementRatio = aggregateScore / targetAchieve;
  let achievementScore = 0;
  if (achievementRatio >= 1.0) {
    achievementScore = Math.min(25, 12 + (achievementRatio - 1.0) * 8);
  } else {
    achievementScore = -1 * Math.round((1.0 - achievementRatio) * 16);
  }

  // 4. War Chest & Campaign Funding
  const currentFunds = Number(pState.war_chest_millions) || 0;
  const targetFunds = office.target_war_chest || 10;
  const fundRatio = currentFunds / targetFunds;
  let fundScore = 0;
  if (fundRatio >= 1.0) {
    fundScore = Math.min(12, 6 + (fundRatio - 1.0) * 4);
  } else {
    fundScore = -1 * Math.round((1.0 - fundRatio) * 14);
  }

  // 5. Macroeconomic Climate
  let macroScore = 0;
  if (eState) {
    if (eState.inflation_cpi > 4.5) macroScore -= 5.5;
    else if (eState.inflation_cpi < 2.8) macroScore += 2.5;

    if (eState.unemployment_rate > 5.5) macroScore -= 6.0;
    else if (eState.unemployment_rate < 4.2) macroScore += 3.0;

    if (eState.gdp_growth > 2.5) macroScore += 3.5;
    else if (eState.gdp_growth < 1.0) macroScore -= 4.0;
  }

  // 6. Ethics Scrutiny
  const ethics = Number(pState.ethics_scrutiny) || 0;
  const ethicsScore = ethics > 35 ? -1 * (ethics - 35) * 0.35 : 0;

  // Composite Expected Vote Share
  const expectedVoteShare = Number((
    50.0 +
    pollingScore +
    lastElectionScore +
    approvalScore +
    termsScore +
    achievementScore +
    fundScore +
    macroScore +
    ethicsScore
  ).toFixed(1));

  let winProbability = Math.round(50 + (expectedVoteShare - 50.0) * 2.2);
  winProbability = Math.max(5, Math.min(98, winProbability));

  return {
    target_office: office,
    expected_vote_share: expectedVoteShare,
    win_probability: winProbability,
    breakdown: {
      polling_score: Number(pollingScore.toFixed(1)),
      last_election_score: Number(lastElectionScore.toFixed(1)),
      approval_score: Number(approvalScore.toFixed(1)),
      terms_score: Number(termsScore.toFixed(1)),
      achievement_score: Number(achievementScore.toFixed(1)),
      fund_score: Number(fundScore.toFixed(1)),
      macro_score: Number(macroScore.toFixed(1)),
      ethics_score: Number(ethicsScore.toFixed(1))
    },
    metrics: {
      terms_served: terms,
      min_terms_recommended: minTerms,
      aggregate_achievement_score: aggregateScore,
      target_achievement_score: targetAchieve,
      war_chest_millions: currentFunds,
      target_war_chest: targetFunds,
      deficit: Math.max(0, Number((targetFunds - currentFunds).toFixed(2)))
    }
  };
}

// Comprehensive Donor Interrogation Question Bank (24 Special Interest Dilemmas)
const DONOR_QUESTION_BANK = [
  {
    id: 'wall_street_capital_gains',
    donor_group: 'Wall Street Investment Banks PAC',
    donor_category: 'Financial Services',
    title: 'Carried Interest & Capital Gains Tax Enforcement',
    prompt: 'Senior managing directors and hedge fund partners at our annual Manhattan dinner are demanding an explicit public pledge: will you oppose attempts to raise the long-term capital gains tax or eliminate the carried interest loophole?',
    choices: [
      {
        option_id: 'A',
        label: 'Pledge Capital Market Protection',
        description: 'Assure the partners that capital formation is the lifeblood of economic liquidity and oppose capital gains tax hikes.',
        base_funds_multiplier: 1.35,
        political_effects: { polling_margin: -1.2, party_loyalty: -3, ethics_scrutiny: 4, national_approval: -1 }
      },
      {
        option_id: 'B',
        label: 'Stand with Working Families & Fair Taxation',
        description: 'Vow to close tax loopholes that favor Wall Street over payroll workers, accepting an icy response from the dinner.',
        base_funds_multiplier: 0.45,
        political_effects: { polling_margin: 2.1, party_loyalty: 6, ethics_scrutiny: -2, national_approval: 2 }
      },
      {
        option_id: 'C',
        label: 'Propose Targeted Venture Reinvestment Exemption',
        description: 'Offer a compromise: preserve preferential rates strictly for long-term domestic manufacturing and high-tech startups.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.5, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'clean_energy_mandate',
    donor_group: 'National Clean Energy & Climate Super-PAC',
    donor_category: 'Renewable Energy & Climate',
    title: 'Zero-Emission Grid Acceleration & Fossil Moratorium',
    prompt: 'Our climate donor network will bundle millions into your independent expenditure committee, but we require a firm commitment: will you sponsor legislation mandating a 100% clean power grid within 8 years and banning new export pipelines?',
    choices: [
      {
        option_id: 'A',
        label: 'Sign the Aggressive Climate Compact',
        description: 'Fully endorse the 8-year zero-emission mandate and moratorium, unleashing maximum climate bundling.',
        base_funds_multiplier: 1.30,
        political_effects: { polling_margin: -1.0, party_loyalty: 4, ethics_scrutiny: 2, national_approval: 0 }
      },
      {
        option_id: 'B',
        label: 'Emphasize Grid Reliability & Consumer Energy Costs',
        description: 'Refuse arbitrary deadlines, insisting that working-class utility bills and baseload natural gas must be safeguarded.',
        base_funds_multiplier: 0.40,
        political_effects: { polling_margin: 1.8, party_loyalty: -4, ethics_scrutiny: -1, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Back Technology-Neutral Clean Energy Tax Credits',
        description: 'Promote an all-of-the-above transition encompassing nuclear, hydrogen, and carbon-capture alongside wind and solar.',
        base_funds_multiplier: 0.90,
        political_effects: { polling_margin: 0.8, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'labor_tariffs_card_check',
    donor_group: 'United Industrial & Manufacturing Labor Federation',
    donor_category: 'Labor Unions & Trade',
    title: 'Protective Import Tariffs & Union Organizing Rights',
    prompt: 'Union brass at the state convention want your word: will you enact strong tariffs on imported steel and green-light statutory card-check rules to facilitate union organizing at industrial plants?',
    choices: [
      {
        option_id: 'A',
        label: 'Sign the Complete Industrial Labor Charter',
        description: 'Promise 25% protective tariffs and total support for card-check, winning full union treasury backing.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: 1.6, party_loyalty: 5, ethics_scrutiny: 1, national_approval: 1 }
      },
      {
        option_id: 'B',
        label: 'Defend Global Supply Chains & Low Consumer Prices',
        description: 'Explain that broad tariffs trigger retaliatory export bans and drive up consumer inflation across households.',
        base_funds_multiplier: 0.45,
        political_effects: { polling_margin: -1.5, party_loyalty: -6, ethics_scrutiny: 0, national_approval: 0 }
      },
      {
        option_id: 'C',
        label: 'Propose Domestic Content Subsidies Over Tariffs',
        description: 'Offer direct tax credits for manufacturing goods built with domestic union labor while avoiding retaliatory trade wars.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.7, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'ai_compute_deregulation',
    donor_group: 'Silicon Valley Tech & AI Venture Coalition',
    donor_category: 'Technology & AI',
    title: 'Artificial Intelligence Compute & Open Source Governance',
    prompt: 'Our tech PAC is preparing massive digital ad expenditures. We need you to push back against federal regulatory overreach on frontier AI training clusters and algorithmic liability.',
    choices: [
      {
        option_id: 'A',
        label: 'Pledge Preemption of Restrictive AI Regulations',
        description: 'Guarantee that national competitiveness and AI model innovation will not be stifled by burdensome safety audits.',
        base_funds_multiplier: 1.40,
        political_effects: { polling_margin: -1.4, party_loyalty: -2, ethics_scrutiny: 4, national_approval: -1 }
      },
      {
        option_id: 'B',
        label: 'Demand Strict AI Safety Standards & Labor Protections',
        description: 'Assert that algorithmic bias, job displacement, and catastrophic safety risks require independent federal audits.',
        base_funds_multiplier: 0.40,
        political_effects: { polling_margin: 2.2, party_loyalty: 4, ethics_scrutiny: -2, national_approval: 2 }
      },
      {
        option_id: 'C',
        label: 'Propose National AI Infrastructure & Public Compute',
        description: 'Create a federal open compute cloud for universities while establishing clear liability for malicious misuse.',
        base_funds_multiplier: 0.90,
        political_effects: { polling_margin: 0.9, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'defense_procurement_modernization',
    donor_group: 'Defense Aerospace & National Security Roundtable',
    donor_category: 'Military & Defense',
    title: 'Sovereign Defense Appropriations & Naval Shipbuilding',
    prompt: 'Defense sector executives ask: in an era of escalating geopolitical competition, will you vote to guarantee a minimum 4% annual real increase in the defense procurement budget?',
    choices: [
      {
        option_id: 'A',
        label: 'Pledge Ironclad Defense Budget Expansion',
        description: 'Assure defense contractors that deterrence requires uninterrupted funding for next-generation systems.',
        base_funds_multiplier: 1.30,
        political_effects: { polling_margin: -0.8, party_loyalty: 1, ethics_scrutiny: 3, national_approval: 1 }
      },
      {
        option_id: 'B',
        label: 'Demand Pentagon Financial Audits & Procurement Caps',
        description: 'Insist that defense spending cannot rise until the Pentagon passes a clean financial audit and reins in cost overruns.',
        base_funds_multiplier: 0.50,
        political_effects: { polling_margin: 1.5, party_loyalty: -2, ethics_scrutiny: -2, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Reallocate Legacy Weapons to Drone & Cyber Capabilities',
        description: 'Shift appropriations from legacy heavy armor to autonomous uncrewed drones, space resilience, and cyber defense.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.6, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'drug_price_negotiation',
    donor_group: 'Pharmaceutical Research & Biotech Consortium',
    donor_category: 'Healthcare & Biotech',
    title: 'Prescription Drug Price Caps & Intellectual Property',
    prompt: 'Biotech investors are alarmed by proposals to impose federal price controls on patented medications. Will you protect research incentives and oppose mandatory price ceilings?',
    choices: [
      {
        option_id: 'A',
        label: 'Defend Biopharmaceutical Patents & Market Pricing',
        description: 'Argue that price controls destroy capital investment in breakthrough rare disease and oncology cures.',
        base_funds_multiplier: 1.35,
        political_effects: { polling_margin: -1.8, party_loyalty: -3, ethics_scrutiny: 4, national_approval: -2 }
      },
      {
        option_id: 'B',
        label: 'Champion Direct Price Negotiations for All Prescriptions',
        description: 'Vow that no constituent will ever be forced to ration insulin or lifesaving medications due to corporate profiteering.',
        base_funds_multiplier: 0.40,
        political_effects: { polling_margin: 2.8, party_loyalty: 6, ethics_scrutiny: -2, national_approval: 2 }
      },
      {
        option_id: 'C',
        label: 'Cap Out-of-Pocket Co-Pays While Subsidizing R&D',
        description: 'Cap patient prescription co-pays at $35/month while offering research tax credits to sustain biotech pipelines.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 1.0, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'housing_zoning_tax_credits',
    donor_group: 'National Association of Homebuilders & Realtors',
    donor_category: 'Housing & Real Estate',
    title: 'Affordable Housing Production & Rent Control Preemption',
    prompt: 'Real estate developers and mortgage financiers demand federal action against local municipal rent control ordinances in exchange for maximum PAC support.',
    choices: [
      {
        option_id: 'A',
        label: 'Preempt Rent Control & Deregulate Construction',
        description: 'Condemn rent caps as supply-destroying and tie federal transit grants to aggressive local zoning deregulation.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: -0.9, party_loyalty: -1, ethics_scrutiny: 2, national_approval: 0 }
      },
      {
        option_id: 'B',
        label: 'Enact National Tenant Protections & Eviction Limits',
        description: 'Stand with tenant advocacy groups against predatory corporate landlords and back emergency rent caps.',
        base_funds_multiplier: 0.45,
        political_effects: { polling_margin: 2.0, party_loyalty: 5, ethics_scrutiny: -1, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Low-Income Housing Tax Credit Expansion with Density Incentives',
        description: 'Double the federal affordable housing tax credit while offering bonuses for transit-oriented high-density building.',
        base_funds_multiplier: 0.90,
        political_effects: { polling_margin: 0.9, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'grassroots_wealth_tax',
    donor_group: 'Independent Small-Dollar Grassroots Alliance',
    donor_category: 'Populist Grassroots',
    title: 'Ultra-Millionaire Wealth Tax & Corporate PAC Ban',
    prompt: 'Our network of two million small-dollar recurring donors wants to know: will you reject all corporate PAC contributions and co-sponsor an annual 2% surtax on fortunes exceeding $50 million?',
    choices: [
      {
        option_id: 'A',
        label: 'Reject Corporate PACs & Back the Wealth Surtax',
        description: 'Ignite grassroots fundraising excitement and small-dollar recurring contributions across the nation.',
        base_funds_multiplier: 0.90,
        political_effects: { polling_margin: 2.5, party_loyalty: 7, ethics_scrutiny: -4, national_approval: 2 }
      },
      {
        option_id: 'B',
        label: 'Reject Unconstitutional Wealth Asset Levies',
        description: 'Argue that taxing unrealized paper net worth causes capital flight and violates foundational property rights.',
        base_funds_multiplier: 0.40,
        political_effects: { polling_margin: -1.6, party_loyalty: -5, ethics_scrutiny: 2, national_approval: -1 }
      },
      {
        option_id: 'C',
        label: 'Close Stepped-Up Basis & Strengthen Corporate Minimum Taxes',
        description: 'Focus on taxing realized capital gains at death and ensuring profitable multinational conglomerates pay at least 15%.',
        base_funds_multiplier: 0.75,
        political_effects: { polling_margin: 1.1, party_loyalty: 3, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'agri_crop_insurance',
    donor_group: 'American Farm Bureau & Agricultural Co-ops',
    donor_category: 'Agriculture & Biofuels',
    title: 'Federal Crop Insurance Subsidies & Biofuel Mandates',
    prompt: 'Heartland agricultural donors ask: will you protect 100% of federal crop insurance premium subsidies and preserve statutory ethanol blending mandates?',
    choices: [
      {
        option_id: 'A',
        label: 'Guarantee Farm Bill Subsidies & Biofuel Quotas',
        description: 'Solidify rural agricultural backing by pledging that farm supports and ethanol mandates will remain untouched.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: 1.2, party_loyalty: 1, ethics_scrutiny: 1, national_approval: 1 }
      },
      {
        option_id: 'B',
        label: 'Cap Subsidies for Mega-Farms & Prioritize Soil Conservation',
        description: 'Redirect crop insurance subsidies away from billionaire agribusiness conglomerates toward small organic family farmers.',
        base_funds_multiplier: 0.50,
        political_effects: { polling_margin: 0.5, party_loyalty: 2, ethics_scrutiny: -1, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Expand Precision Agriculture & Drought Resilience Grants',
        description: 'Modernize the farm safety net with high-tech water conservation grants and climate-smart insurance discounts.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.8, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'corporate_tax_rate',
    donor_group: 'National Retailers & Commercial Chamber of Commerce',
    donor_category: 'Commerce & Retail',
    title: 'Statutory Corporate Tax Rate & Small Business Expensing',
    prompt: 'Commercial chain executives and chamber leaders ask: will you promise never to raise the statutory corporate tax rate above 21%?',
    choices: [
      {
        option_id: 'A',
        label: 'Guarantee No Corporate Tax Increases',
        description: 'Pledge competitive tax certainty to unleash capital expenditure and corporate treasury bundling.',
        base_funds_multiplier: 1.30,
        political_effects: { polling_margin: -1.2, party_loyalty: -2, ethics_scrutiny: 3, national_approval: -1 }
      },
      {
        option_id: 'B',
        label: 'Raise the Corporate Rate to 28% for Social Investments',
        description: 'Insist that highly profitable corporations must fund public infrastructure, childcare, and healthcare.',
        base_funds_multiplier: 0.45,
        political_effects: { polling_margin: 1.9, party_loyalty: 5, ethics_scrutiny: -2, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Maintain Current Rate While Permitting 100% Capital Expensing',
        description: 'Keep the headline rate stable but allow immediate write-offs for companies building domestic factories.',
        base_funds_multiplier: 0.90,
        political_effects: { polling_margin: 0.7, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'crypto_digital_assets',
    donor_group: 'Digital Asset & Blockchain Innovation Fund',
    donor_category: 'Fintech & Cryptocurrency',
    title: 'Regulatory Clarity for Digital Assets & Stablecoins',
    prompt: 'Crypto founders and venture funds will assemble a massive war chest if you commit to establishing clear commodity classification for stablecoins and blocking punitive SEC enforcement.',
    choices: [
      {
        option_id: 'A',
        label: 'Embrace Digital Assets as Financial Frontier',
        description: 'Champion the crypto industry, pledge light-touch rules, and stop regulatory crackdowns.',
        base_funds_multiplier: 1.40,
        political_effects: { polling_margin: -1.5, party_loyalty: -2, ethics_scrutiny: 5, national_approval: -1 }
      },
      {
        option_id: 'B',
        label: 'Demand Strict Bank-Like Capital Reserves & Consumer Audits',
        description: 'Warn that unregulated crypto exposes retail consumers to predatory scams and systemic contagion.',
        base_funds_multiplier: 0.40,
        political_effects: { polling_margin: 1.4, party_loyalty: 3, ethics_scrutiny: -3, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Enact Statutory Stablecoin Guardrails Under Treasury Oversight',
        description: 'Permit stablecoin innovation provided tokens are 100% backed by short-term sovereign treasuries with audited reserves.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.4, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'supply_chain_ports',
    donor_group: 'Maritime Shipping & Port Logistics Guild',
    donor_category: 'Transportation & Logistics',
    title: 'Port Automation & Maritime Cabotage Standards',
    prompt: 'Logistics and freight shipping donors ask: will you support federal funding for container port automation while maintaining national maritime cabotage standards?',
    choices: [
      {
        option_id: 'A',
        label: 'Fully Fund Automated Port Terminals',
        description: 'Prioritize automated cranes and terminal optimization to reduce supply chain bottlenecks and shipping costs.',
        base_funds_multiplier: 1.20,
        political_effects: { polling_margin: -0.5, party_loyalty: 0, ethics_scrutiny: 1, national_approval: 1 }
      },
      {
        option_id: 'B',
        label: 'Protect Longshore Worker Jobs Against Rapid Automation',
        description: 'Condition federal port grants on longshore worker job guarantees and worker retraining agreements.',
        base_funds_multiplier: 0.50,
        political_effects: { polling_margin: 1.2, party_loyalty: 4, ethics_scrutiny: -1, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Hybrid Workforce Transition with Automated Night Shifts',
        description: 'Phase in automation during off-peak hours while providing union pension protection guarantees.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.6, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'higher_ed_endowments',
    donor_group: 'Higher Education & Academic Research Endowment Alliance',
    donor_category: 'Education & Science',
    title: 'University Endowment Taxes & Federal Science Grants',
    prompt: 'University chancellors and academic philanthropists want a commitment: will you oppose punitive federal excise taxes on university endowments and increase basic science research grants?',
    choices: [
      {
        option_id: 'A',
        label: 'Exempt Endowments & Maximize Scientific Grants',
        description: 'Protect elite university research funds from federal taxation to maintain sovereign technological preeminence.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: -0.6, party_loyalty: 2, ethics_scrutiny: 1, national_approval: 0 }
      },
      {
        option_id: 'B',
        label: 'Tax Billion-Dollar Endowments to Fund Community Colleges',
        description: 'Demand that wealthy private university endowments pay taxes to eliminate tuition at community colleges and trade apprenticeships.',
        base_funds_multiplier: 0.45,
        political_effects: { polling_margin: 1.7, party_loyalty: 4, ethics_scrutiny: -1, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Condition Endowment Exemptions on Tuition Freezes',
        description: 'Permit tax-free endowment growth only for universities that freeze undergraduate tuition and expand debt-free financial aid.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.8, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'critical_minerals_mining',
    donor_group: 'Domestic Critical Minerals & Rare Earths Syndicate',
    donor_category: 'Mining & Strategic Materials',
    title: 'Fast-Track Permitting for Lithium, Copper & Rare Earths',
    prompt: 'Mining industry leaders assert that clean energy and defense manufacturing cannot survive without domestic extraction. Will you bypass multi-year environmental reviews for critical mineral mines?',
    choices: [
      {
        option_id: 'A',
        label: 'Establish Emergency Fast-Track Mining Approvals',
        description: 'Designate critical minerals as vital national security assets and streamline environmental reviews to 90 days.',
        base_funds_multiplier: 1.30,
        political_effects: { polling_margin: -1.0, party_loyalty: -2, ethics_scrutiny: 3, national_approval: 0 }
      },
      {
        option_id: 'B',
        label: 'Strict Tribal Consultation & Ecological Protections',
        description: 'Refuse to compromise groundwater standards or indigenous sovereignty for corporate mining extraction.',
        base_funds_multiplier: 0.40,
        political_effects: { polling_margin: 1.5, party_loyalty: 4, ethics_scrutiny: -2, national_approval: 1 }
      },
      {
        option_id: 'C',
        label: 'Prioritize Battery Recycling & Brownfield Site Redevelopment',
        description: 'Provide generous tax credits for recycling e-waste minerals while permitting new extraction strictly on disturbed industrial lands.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.7, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'hospital_medicare_margins',
    donor_group: 'Hospital Systems & Emergency Healthcare Network',
    donor_category: 'Hospital Healthcare',
    title: 'Hospital Facility Fees & Medicare Reimbursement Floor',
    prompt: 'Hospital network CEOs warn that eliminating outpatient facility fees or lowering public insurance reimbursement will force rural emergency rooms to shutter.',
    choices: [
      {
        option_id: 'A',
        label: 'Protect Hospital Reimbursements & Outpatient Facility Fees',
        description: 'Pledge that federal health payments will keep pace with inflation to safeguard healthcare provider solvency.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: -0.7, party_loyalty: 0, ethics_scrutiny: 2, national_approval: 0 }
      },
      {
        option_id: 'B',
        label: 'Ban Surprise Facility Fees & Enforce Site-Neutral Pricing',
        description: 'Insist that patients must not be gouged with separate facility fees for routine doctor visits and imaging tests.',
        base_funds_multiplier: 0.50,
        political_effects: { polling_margin: 2.1, party_loyalty: 4, ethics_scrutiny: -1, national_approval: 2 }
      },
      {
        option_id: 'C',
        label: 'Direct Subsidies Solely for Rural Trauma & Safety-Net Centers',
        description: 'Eliminate fees at wealthy urban health conglomerates while establishing dedicated emergency grants for underserved rural clinics.',
        base_funds_multiplier: 0.85,
        political_effects: { polling_margin: 0.9, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  },
  {
    id: 'energy_nuclear_grid',
    donor_group: 'Advanced Nuclear & Baseload Energy Council',
    donor_category: 'Nuclear Energy',
    title: 'Small Modular Reactor Licensing & Federal Loan Guarantees',
    prompt: 'Clean baseload power advocates and nuclear engineers ask: will you support $20B in federal loan guarantees and expedited NRC licensing for Small Modular Reactors (SMRs)?',
    choices: [
      {
        option_id: 'A',
        label: 'Champion Commercial Nuclear Renaissance',
        description: 'Back major loan guarantees and streamlined nuclear commissioning to power domestic data centers and industry.',
        base_funds_multiplier: 1.30,
        political_effects: { polling_margin: 0.4, party_loyalty: 1, ethics_scrutiny: 1, national_approval: 1 }
      },
      {
        option_id: 'B',
        label: 'Focus Resources Purely on Solar, Wind & Storage',
        description: 'Argue that nuclear reactors are too expensive, suffer massive delays, and present unresolved radioactive waste challenges.',
        base_funds_multiplier: 0.45,
        political_effects: { polling_margin: 0.2, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 0 }
      },
      {
        option_id: 'C',
        label: 'Public-Private Demonstration Sites at Retired Coal Plants',
        description: 'Deploy advanced modular reactors specifically at retiring coal power plants to utilize existing electrical switchyards and transition coal workers.',
        base_funds_multiplier: 0.90,
        political_effects: { polling_margin: 1.1, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 }
      }
    ]
  }
];

// Generate donor vetting questions proportional to the funding deficit
function generateDonorQuestions(targetOfficeId, currentWarChest = 0) {
  const office = CAMPAIGN_OFFICE_DEFINITIONS[targetOfficeId] || CAMPAIGN_OFFICE_DEFINITIONS.representative;
  const targetWarChest = office.target_war_chest;
  const deficit = Math.max(0, targetWarChest - currentWarChest);

  // Number of questions proportional to funding needed
  // Min 3 questions, max 16 questions
  const questionCount = Math.max(3, Math.min(16, Math.round(deficit / 7.0) + 2));

  // Shuffle and pick questions
  const shuffled = [...DONOR_QUESTION_BANK].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, questionCount);

  // Dollar scale factor so answering allows closing the gap
  const baseDollarPerQuestion = Math.max(0.75, (deficit / questionCount) * 1.12);

  return selected.map((q, idx) => {
    return {
      ...q,
      question_number: idx + 1,
      total_questions: questionCount,
      choices: q.choices.map(c => {
        const scaledFunds = Number((c.base_funds_multiplier * baseDollarPerQuestion).toFixed(2));
        return {
          ...c,
          funds_raised_millions: scaledFunds
        };
      })
    };
  });
}

module.exports = {
  PARLIAMENTARY_TRACKS,
  CONGRESSIONAL_TRACKS,
  PARTY_ARCHETYPES,
  CAMPAIGN_OFFICE_DEFINITIONS,
  getInitialPoliticalState,
  calculateBillAchievementScore,
  calculateWhipVoteCount,
  evolvePoliticalState,
  generatePoliticalNews,
  checkForPoliticalEvent,
  calculateElectionOdds,
  generateDonorQuestions,
  DONOR_QUESTION_BANK,
  politicalEventWeb
};
