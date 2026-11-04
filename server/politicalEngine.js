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
    
    // Legislative Stats
    legislative_seniority: 1, // Terms completed
    bills_sponsored: 0,
    bills_passed: 0,
    hearings_held: 0,
    townhalls_conducted: 0,
    fundraisers_held: 0,
    
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

module.exports = {
  PARLIAMENTARY_TRACKS,
  CONGRESSIONAL_TRACKS,
  PARTY_ARCHETYPES,
  getInitialPoliticalState,
  calculateWhipVoteCount,
  evolvePoliticalState,
  generatePoliticalNews,
  checkForPoliticalEvent,
  politicalEventWeb
};
