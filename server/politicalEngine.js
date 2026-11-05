const fs = require('fs');
const path = require('path');
const { evolveEconomy, getInitialEconomicState } = require('./simulationEngine');
const { generateRandomPrepromptEntropy, enforceWordCount } = require('./promptEntropy');

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

// Helper helpers for system types
function isUnicameralSystem(sys) {
  return sys === 'unicameral' || sys === 'parliamentary';
}

function isBicameralSystem(sys) {
  return sys === 'bicameral' || sys === 'congressional';
}

// Track definitions
const PARLIAMENTARY_TRACKS = [
  {
    id: 'backbencher',
    title: 'Member of Parliament',
    chamber: 'House of Commons',
    description: 'Constituency MP tabling parliamentary questions, debating white papers, and building cross-faction alliances.',
    next_stage: 'committee_chair',
    min_seniority: 1,
    promotion_requirements: { seniority: 3, district_approval: 52, bills_passed: 1, party_loyalty: 55 }
  },
  {
    id: 'committee_chair',
    title: 'Chair of Commons Select Committee',
    chamber: 'House of Commons',
    description: 'Influential parliamentary scrutiny chair with inquiry power over ministers and central bank governors.',
    next_stage: 'cabinet_minister',
    min_seniority: 3,
    promotion_requirements: { seniority: 5, national_approval: 55, political_capital: 35, party_loyalty: 65 }
  },
  {
    id: 'cabinet_minister',
    title: 'Cabinet Minister',
    chamber: 'House of Commons / Cabinet',
    description: 'Senior minister directing major national ministries, formulating statutory bills, and steering treasury allocations.',
    next_stage: 'prime_minister',
    min_seniority: 5,
    promotion_requirements: { seniority: 7, national_approval: 60, party_loyalty: 75, political_capital: 60 }
  },
  {
    id: 'prime_minister',
    title: 'Prime Minister',
    chamber: 'House of Commons / Executive',
    description: 'Chief executive leader directing government policy, commanding parliamentary majority, and managing sovereign governance.',
    next_stage: null,
    min_seniority: 7,
    promotion_requirements: null
  }
];

const UNICAMERAL_TRACKS = PARLIAMENTARY_TRACKS;

const CONGRESSIONAL_TRACKS = [
  {
    id: 'representative',
    title: 'Representative',
    chamber: 'Lower House',
    description: 'Lower House Representative fighting for local community funding and district constituent needs in every 2-year election cycle.',
    next_stage: 'committee_chair',
    min_seniority: 1,
    promotion_requirements: { seniority: 3, district_approval: 54, war_chest: 5.0, bills_passed: 1 }
  },
  {
    id: 'committee_chair',
    title: 'Lower House Committee Chair',
    chamber: 'Lower House',
    description: 'Powerful legislative powerbroker orchestrating whip counts, floor amendments, and high-dollar PAC fundraising.',
    next_stage: 'senator',
    min_seniority: 3,
    promotion_requirements: { seniority: 5, national_approval: 56, war_chest: 15.0, political_capital: 40 }
  },
  {
    id: 'senator',
    title: 'Senator',
    chamber: 'Upper House',
    description: 'Upper House Senator with 6-year tenure, filibuster authority, judicial confirmation power, and treaty votes.',
    next_stage: 'president',
    min_seniority: 5,
    promotion_requirements: { seniority: 8, national_approval: 62, war_chest: 45.0, political_capital: 75 }
  },
  {
    id: 'president',
    title: 'President',
    chamber: 'Office of the President',
    description: 'Head of State, Commander-in-Chief, with executive order authority, statutory veto power, and international summit leadership.',
    next_stage: null,
    min_seniority: 8,
    promotion_requirements: null
  }
];

const BICAMERAL_TRACKS = CONGRESSIONAL_TRACKS;

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

function getInitialPoliticalState(systemType = 'bicameral', selectedTrack = null, partyName = 'Democratic Alliance', districtName = 'Metro-Industrial 4th') {
  const isUnicameral = isUnicameralSystem(systemType);
  const tracks = isUnicameral ? PARLIAMENTARY_TRACKS : CONGRESSIONAL_TRACKS;
  const initialTrackId = selectedTrack || (isUnicameral ? 'backbencher' : 'representative');
  const trackObj = tracks.find(t => t.id === initialTrackId) || tracks[0];

  const party = PARTY_ARCHETYPES.find(p => p.name === partyName) || PARTY_ARCHETYPES[0];

  return {
    politician_title: trackObj.title,
    current_stage_id: trackObj.id,
    chamber: trackObj.chamber,
    system_type: systemType,
    legislature_name: isUnicameral ? 'House of Commons' : 'Congress',
    executive_title: isUnicameral ? 'Prime Minister' : 'President',
    party_name: party.name,
    party_ideology: party.ideology,
    party_wings: party.wings,
    district_name: districtName,
    
    // Core Political Metrics (0-100)
    district_approval: 56.5, // Popularity in home constituency
    national_approval: 48.0, // National name recognition & favorability
    party_loyalty: 72.0,    // Whip confidence & party standing
    political_capital: 30,   // Currency spent to whip votes & advance bills (0-100)
    war_chest_millions: isUnicameral ? 1.5 : 4.2, // Campaign fundraising funds ($M)
    ethics_scrutiny: 12.0,   // Scandal / investigative risk (0-100, low is good)
    polling_margin: 3.5,     // Polling margin vs upcoming election challenger (+/- %)
    coalition_stability: 68.0,// Floor stability
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
    
    // Caucus Leadership
    player_caucus_id: null,
    player_caucus_name: null,
    is_caucus_leader: true,
    
    // Committee assignment
    committee_name: isUnicameral ? 'Commons Select Committee on Economic & Treasury Affairs' : 'Lower House Committee on Ways & Means',
    
    // Promotion readiness
    promotion_available: false,
    next_stage_id: trackObj.next_stage,

    // Election cycle
    months_to_election: isUnicameral ? 36 : 24, // 3 years or 2 years cycle
    election_year_span: isUnicameral ? 3 : 2,
    
    // Recent actions & active campaign
    recent_actions: [],
    active_campaigns: []
  };
}

// Congressional & Parliamentary Faction Caucuses for Backroom Negotiations & Logrolling
const CONGRESSIONAL_CAUCUSES = [
  {
    id: 'progressive_caucus',
    name: 'Progressive Working-Class Caucus',
    leader: 'Rep. Alexandria Rivera',
    member_count: 42,
    ideology: 'Progressive Democratic Left',
    priorities: ['healthcare', 'labor', 'climate', 'social_welfare'],
    docket_bills: [
      {
        title: 'Universal Hospital Nurse Staffing & Living Wage Mandate',
        summary: 'Enforces safe nurse-to-patient ratios across federally funded hospital systems and establishes mandatory overtime protections.',
        category: 'healthcare',
        fiscal_impact: 14.5
      },
      {
        title: 'Green Infrastructure Public Apprenticeship Accord',
        summary: 'Mandates prevailing union wages and high-school apprenticeships on all federally subsidized renewable energy transmission grids.',
        category: 'energy',
        fiscal_impact: 22.0
      }
    ]
  },
  {
    id: 'freedom_faction',
    name: 'Conservative Freedom Faction',
    leader: 'Rep. Wyatt Vance',
    member_count: 36,
    ideology: 'Constitutional Fiscal Conservatives',
    priorities: ['fiscal', 'deregulation', 'defense', 'trade'],
    docket_bills: [
      {
        title: 'Statutory Federal Spending Brake & Regulatory Audit Act',
        summary: 'Imposes a mandatory statutory cap on discretionary agency expansions and requires a two-for-one repeal of industrial regulations.',
        category: 'fiscal',
        fiscal_impact: -18.0
      },
      {
        title: 'Domestic Energy Leasing & Pipeline Permitting Acceleration Act',
        summary: 'Eliminates judicial NEPA delays for interstate gas pipeline expansions and domestic mineral refining facilities.',
        category: 'energy',
        fiscal_impact: -4.5
      }
    ]
  },
  {
    id: 'problem_solvers',
    name: 'Problem Solvers Centrist Coalition',
    leader: 'Rep. Evelyn Mercer',
    member_count: 28,
    ideology: 'Bipartisan Pragmatic Moderates',
    priorities: ['infrastructure', 'technology', 'trade', 'fiscal'],
    docket_bills: [
      {
        title: 'Bipartisan Grid Resiliency & Freight Corridor Modernization Act',
        summary: 'Deploys matching federal grants to municipal ports, freight railways, and regional microgrids with public-private financing matches.',
        category: 'infrastructure',
        fiscal_impact: 18.0
      },
      {
        title: 'Rural High-Speed Gigabit & Agricultural Broadband Accord',
        summary: 'Directs universal telecommunications service fees toward unserved rural counties and precision agricultural sensor networks.',
        category: 'technology',
        fiscal_impact: 9.5
      }
    ]
  },
  {
    id: 'rust_belt_alliance',
    name: 'Rust Belt Industrial & Energy Alliance',
    leader: 'Rep. Frank Kowalski',
    member_count: 31,
    ideology: 'Pro-Labor Domestic Manufacturing',
    priorities: ['trade', 'manufacturing', 'infrastructure', 'labor'],
    docket_bills: [
      {
        title: 'Strategic Steel Sourcing & Anti-Dumping Tariff Protection Act',
        summary: 'Imposes punitive reciprocal tariffs on state-subsidized steel and requires 100% domestic iron procurement on federal civil works.',
        category: 'trade',
        fiscal_impact: 6.0
      },
      {
        title: 'Heavy Industry Decarbonization & Clean Hydrogen Grant Act',
        summary: 'Provides direct federal capital co-investments to retrofit legacy blast furnaces and chemical processing plants with clean hydrogen.',
        category: 'infrastructure',
        fiscal_impact: 16.0
      }
    ]
  },
  {
    id: 'main_street_bloc',
    name: 'Main Street Merchants & Small Enterprise Bloc',
    leader: 'Rep. Dwight Caldwell',
    member_count: 22,
    ideology: 'Independent Commercial Reformers',
    priorities: ['taxation', 'banking', 'labor', 'fiscal'],
    docket_bills: [
      {
        title: 'Small Business Credit Transparency & Interchange Fee Relief Act',
        summary: 'Caps commercial credit card transaction processing fees on independent merchants and expands community bank SBA loan guarantees.',
        category: 'banking',
        fiscal_impact: -2.0
      }
    ]
  }
];

const PARLIAMENTARY_CAUCUSES = [
  {
    id: 'socialist_campaign_group',
    name: 'Trade Union & Socialist Campaign Group',
    leader: 'Arthur Pendelton MP',
    member_count: 44,
    ideology: 'Democratic Socialist & Union Benchers',
    priorities: ['healthcare', 'labor', 'housing', 'social_welfare'],
    docket_bills: [
      {
        title: 'National Rail & Municipal Water Re-Nationalization Statute',
        summary: 'Transfers privatized regional passenger rail and wastewater operating franchises into statutory public trusts.',
        category: 'infrastructure',
        fiscal_impact: 28.0
      },
      {
        title: 'Statutory Living Wage & Fair Rent Tenancy Protection Act',
        summary: 'Bans no-fault evictions, caps private residential annual rent adjustments to CPI, and ties minimum wage to median earnings.',
        category: 'housing',
        fiscal_impact: 8.0
      }
    ]
  },
  {
    id: 'one_nation_moderates',
    name: 'One-Nation Moderate Benchers',
    leader: 'Victoria Ashworth MP',
    member_count: 36,
    ideology: 'Centrist Civic Reformers',
    priorities: ['infrastructure', 'healthcare', 'climate', 'fiscal'],
    docket_bills: [
      {
        title: 'Community Hospital & Mental Health Emergency Facility Accord',
        summary: 'Allocates statutory capital funding to construct 25 regional urgent community clinics to alleviate emergency ward bottlenecks.',
        category: 'healthcare',
        fiscal_impact: 15.0
      },
      {
        title: 'Green Belt Clean Energy Permitting & Biodiversity Net-Gain Act',
        summary: 'Authorizes municipal renewable solar arrays and offshore transmission landing stations with strict local conservation offsets.',
        category: 'energy',
        fiscal_impact: 11.0
      }
    ]
  },
  {
    id: 'free_enterprise_group',
    name: 'Fiscal Prudence & Free Enterprise Faction',
    leader: 'Sir Alistair Finch MP',
    member_count: 39,
    ideology: 'Free-Market Conservative Backbenchers',
    priorities: ['fiscal', 'deregulation', 'taxation', 'trade'],
    docket_bills: [
      {
        title: 'Corporate Investment Expensing & Planning Deregulation Act',
        summary: 'Establishes permanent 100% capital expensing for corporate machinery and curtails local planning vetoes for commercial industrial parks.',
        category: 'fiscal',
        fiscal_impact: -14.0
      },
      {
        title: 'Statutory Fiscal Deficit Rule & Public Sector Headcount Cap',
        summary: 'Requires government departments to achieve a cyclically adjusted current budget surplus within three financial years.',
        category: 'fiscal',
        fiscal_impact: -12.0
      }
    ]
  },
  {
    id: 'regional_devolution_bloc',
    name: 'Northern & Regional Devolution Faction',
    leader: 'Sean Gallagher MP',
    member_count: 27,
    ideology: 'Regional Economic Champions',
    priorities: ['infrastructure', 'manufacturing', 'trade'],
    docket_bills: [
      {
        title: 'Trans-Pennine High-Speed Electrification & Freight Corridor Act',
        summary: 'Directs statutory capital guarantees to complete regional high-speed rail electrification connecting peripheral industrial hubs.',
        category: 'infrastructure',
        fiscal_impact: 24.0
      }
    ]
  },
  {
    id: 'green_reform_caucus',
    name: 'Green Horizon & Civic Reform Benchers',
    leader: 'Dr. Helena Zhang MP',
    member_count: 24,
    ideology: 'Eco-Modernist & Transparency Champions',
    priorities: ['climate', 'technology', 'ethics', 'housing'],
    docket_bills: [
      {
        title: 'Clean Urban Transit & Low-Emission Zone Mandate',
        summary: 'Directs statutory funding to convert municipal bus fleets to zero emissions and empowers councils to enact clean-air zones.',
        category: 'energy',
        fiscal_impact: 12.0
      },
      {
        title: 'Statutory Anti-Graft & Ministerial Revolving-Door Prohibition Act',
        summary: 'Imposes a mandatory 5-year lobbying ban on former cabinet ministers and enforces strict public transparency on procurement contracts.',
        category: 'ethics',
        fiscal_impact: 0.5
      }
    ]
  }
];

// Generate dynamic backroom caucus deal trade proposals
function generateCaucusDealOffers(session, currentBill = null) {
  const isUnicameral = isUnicameralSystem(session.system_type);
  const caucuses = isUnicameral ? PARLIAMENTARY_CAUCUSES : CONGRESSIONAL_CAUCUSES;
  const playerCaucusId = session.political_state?.player_caucus_id;
  
  // Filter out the player's own caucus (their own caucus already votes with their chair)
  const availableCaucuses = playerCaucusId ? caucuses.filter(c => c.id !== playerCaucusId) : caucuses;
  
  // Pick 2-3 distinct caucuses
  const shuffled = [...availableCaucuses].sort(() => 0.5 - Math.random());
  const selectedCaucuses = shuffled.slice(0, 3);

  const targetBillId = currentBill ? currentBill.id : null;
  const targetBillTitle = currentBill ? currentBill.title : 'Pending Priority Statute';

  return selectedCaucuses.map(caucus => {
    const docketBill = caucus.docket_bills[Math.floor(Math.random() * caucus.docket_bills.length)];
    // Pledged votes: between 75% and 95% of their caucus members
    const pledged = Math.round(caucus.member_count * (0.75 + Math.random() * 0.20));

    return {
      id: 'cd_' + Math.random().toString(36).substring(2, 10),
      session_id: session.id,
      caucus_id: caucus.id,
      caucus_name: caucus.name,
      caucus_leader: caucus.leader,
      member_count: caucus.member_count,
      ideology: caucus.ideology,
      docket_bill_title: docketBill.title,
      docket_bill_summary: docketBill.summary,
      docket_bill_category: docketBill.category,
      docket_bill_impact: docketBill.fiscal_impact,
      user_target_bill_id: targetBillId,
      user_target_bill_title: targetBillTitle,
      pledged_votes: pledged,
      demands_description: `Pledge your vote to pass '${docketBill.title}' on the floor. In exchange, our caucus will deliver ${pledged} locked votes for '${targetBillTitle}'.`,
      status: 'pending',
      year_proposed: session.current_year,
      month_proposed: session.current_month
    };
  });
}

// Calculate floor whip counts based on party wings, capital spent, committee sway, caucus deals, and bill attributes
function calculateWhipVoteCount(bill, politicalState, capitalSpent = 0) {
  const isParliamentary = politicalState.system_type === 'parliamentary';
  const totalSeats = isParliamentary ? 650 : (politicalState.current_stage_id === 'senator' ? 100 : 435);
  const majorityThreshold = Math.floor(totalSeats / 2) + 1;

  // Ruling party seats vs opposition seats (rebalanced realistic tight majorities)
  const condition = politicalState.starting_condition || 'normal';
  const partySharePct = condition === 'easy' ? 0.528 : (condition === 'hard' ? 0.505 : 0.516);
  const partySeats = Math.round(totalSeats * partySharePct);
  const oppositionSeats = totalSeats - partySeats;

  // Base faction alignment (substantially tighter loyalty baseline: passage is difficult without deals)
  const loyaltyFactor = (politicalState.party_loyalty || 55) / 100;
  const publicSupportBonus = ((bill.public_support || 50) - 50) * 0.25;

  let partyAyes = 0;
  let partyNays = 0;
  let partyUndecided = 0;

  for (const wing of (politicalState.party_wings || [])) {
    const wingSeats = Math.round(partySeats * (wing.share / 100));
    // Balanced base party loyalty: ~68% - 78% of party seats without deals (yields ~155-175 party ayes out of 226)
    let wingSupportChance = (wing.base_loyalty / 100) * 0.66 + (loyaltyFactor * 0.20) + (publicSupportBonus / 100);
    
    // Faction policy tensions & ideological friction
    if (bill.fiscal_impact_billions > 25 && (wing.priority === 'spending_caps' || wing.priority === 'tax_relief' || wing.priority === 'fiscal_pragmatism' || wing.priority === 'free_market')) {
      wingSupportChance -= 0.18; // Deficit hawk defection on big spending bills!
    }
    if (bill.category === 'social_welfare' && (wing.priority === 'public_welfare' || wing.priority === 'social_solidarity')) {
      wingSupportChance += 0.16;
    }
    if (['climate', 'energy'].includes(bill.category) && (wing.priority === 'green_transition' || wing.priority === 'efficiency')) {
      wingSupportChance += 0.16;
    }
    if (bill.fiscal_impact_billions < 0 && (wing.priority === 'public_welfare' || wing.priority === 'social_solidarity')) {
      wingSupportChance -= 0.16; // Social wing opposes austerity cuts
    }

    wingSupportChance = Math.max(0.15, Math.min(0.92, wingSupportChance));

    const ayes = Math.round(wingSeats * wingSupportChance);
    const nays = Math.round(wingSeats * (1 - wingSupportChance) * 0.90);
    const undecided = Math.max(0, wingSeats - ayes - nays);

    partyAyes += ayes;
    partyNays += nays;
    partyUndecided += undecided;
  }

  // Opposition crossover votes: polarized gridlock defaults to 2-4%, or 6-9% on bipartisan categories
  const isBipartisanCategory = ['infrastructure', 'defense', 'national_security', 'veterans', 'technology'].includes(bill.category);
  const oppositionCrossoverRate = isBipartisanCategory ? 0.07 : 0.03;
  const oppAyes = Math.round(oppositionSeats * oppositionCrossoverRate + (publicSupportBonus > 8 ? oppositionSeats * 0.03 : 0));
  const oppNays = oppositionSeats - oppAyes;

  // Committee Momentum Bonus (earned while in committee through member sway & markup amendments)
  const swayLevel = Number(bill.committee_sway_level) || 0;
  const amendmentsCount = Number(bill.committee_amendments_count) || 0;
  const committeeMomentumVotes = Math.round(swayLevel * 3.5 + amendmentsCount * 6);

  // Backroom Caucus Logrolling Pledged Votes
  const pledgedCaucusVotes = Number(bill.pledged_caucus_votes) || 0;

  // Floor Whip Capital Bonus (direct arm-twisting on the floor)
  const capitalBonusVotes = Math.min(22, Math.round(capitalSpent * 1.25));

  // Player's Own Caucus Loyalty Votes (As Caucus Chair, your members rally behind your agenda)
  let playerCaucusVotes = 0;
  if (politicalState.player_caucus_id) {
    const isUnicameral = isUnicameralSystem(politicalState.system_type);
    const caucusList = isUnicameral ? PARLIAMENTARY_CAUCUSES : CONGRESSIONAL_CAUCUSES;
    const playerCaucus = caucusList.find(c => c.id === politicalState.player_caucus_id);
    if (playerCaucus) {
      playerCaucusVotes = Math.round(playerCaucus.member_count * 0.85);
    }
  }

  // Total floor vote calculation
  const totalAyes = Math.min(totalSeats, partyAyes + oppAyes + committeeMomentumVotes + pledgedCaucusVotes + capitalBonusVotes + playerCaucusVotes);
  const totalNays = Math.max(0, totalSeats - totalAyes);
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
      opposition_nays: oppNays,
      committee_momentum_votes: committeeMomentumVotes,
      pledged_caucus_votes: pledgedCaucusVotes,
      capital_bonus_votes: capitalBonusVotes,
      player_caucus_votes: playerCaucusVotes
    },
    whip_assessment: passed 
      ? `Floor division secured with ${totalAyes} Ayes to ${totalNays} Nays (Threshold: ${majorityThreshold}). Prime for passage.` 
      : `Deficit of ${majorityThreshold - totalAyes} floor votes. Engage caucuses in the backroom or sway committee members to cross the finish line.`
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

// Generate monthly political news dispatches (strictly 100-120 words per story)
function generatePoliticalNews(pState, eState, year, month) {
  const articles = [];

  // Publisher 1: The Capital Gazette (Beltway / Westminster elite political insider)
  const isHighInflation = Number(eState.inflation_cpi || 0) > 4.0;
  const approval = Number(pState.district_approval || 50);

  let gazetteHeadline = `Lawmakers Return as Macro Indicators Press Floor Calendar`;
  let gazetteBody = `Legislative leaders reconvened this week amid intense committee negotiations over the national budget and regulatory priorities. Senior committee chairs across both chambers are evaluating whether benchmark borrowing rates of ${Number(eState.interest_rate || 3.25).toFixed(2)}% and consumer price inflation of ${Number(eState.inflation_cpi || 2.0).toFixed(2)}% necessitate emergency fiscal appropriations. With backbench factions demanding targeted relief for their constituencies, party leadership is working around the clock to prevent floor revolts. Analysts note that fiscal commitments must balance macroeconomic stability against growing voter anxiety in frontline districts. Both party caucuses have dispatched regional whips to tally swing votes ahead of crucial floor roll-calls, warning that misjudging the economic telemetry could endanger fragile legislative majorities well into the next fiscal quarter.`;

  if (isHighInflation) {
    gazetteHeadline = `Inflation Anger Dominates Town Halls as Voters Demand Immediate Relief`;
    gazetteBody = `Backbenchers and frontline district representatives report fierce constituent backlash over grocery and power utility rates, severely complicating upcoming floor votes on fiscal appropriations. With headline inflation standing at ${Number(eState.inflation_cpi).toFixed(2)}%, caucus leaders spent the weekend attempting to reconcile divergent demands from deficit hawks and public investment champions. Backbench factions from competitive swing districts warned party whips that voting for unadjusted spending measures without direct household tax offsets could prove politically fatal in the upcoming election cycle. Leadership has convened emergency committee hearings to craft compromise statutory amendments before the legislative recess, acknowledging that consumer price pressures now represent the single greatest liability to their parliamentary agenda.`;
  } else if ((pState.bills_passed || 0) > 0) {
    gazetteHeadline = `${pState.politician_title} ${pState.politician_name} Consolidates Committee Influence After Legislative Wins`;
    gazetteBody = `Senior party whips note growing institutional momentum around ${pState.politician_name}'s policy docket, positioning the office for senior leadership consideration and plum committee assignments. Having shepherded ${pState.bills_passed} substantive statutory measure${pState.bills_passed > 1 ? 's' : ''} through arduous committee divisions and floor votes, ${pState.politician_name} has emerged as an indispensable legislative operator capable of bridging ideological divides. Capitol insiders report that both frontline colleagues and parliamentary leadership are increasingly seeking the member's backing on pivotal fiscal compromises. With public approval holding steady and campaign war chest reserves continuing to accumulate, rival caucuses concede that the office's strategic stature and policy influence have reached a formidable new high water mark.`;
  }

  articles.push({
    publisher: 'capital_gazette',
    publisher_name: 'The Capital Gazette',
    headline: gazetteHeadline,
    body: enforceWordCount(gazetteBody, 100, 120),
    tone: isHighInflation ? 'alarmist' : 'analytical',
    urgency: isHighInflation ? 'high' : 'medium',
    featured_issue: isHighInflation ? 'Inflation & Cost of Living' : 'Legislative Docket',
    year,
    month
  });

  // Publisher 2: Daily Tribune (Populist / Main Street daily)
  let tribuneHeadline = `Constituents Demand Action on Mortgages, Groceries, and Job Security`;
  let tribuneBody = `Working families across ${pState.district_name} are watching the capital with mounting impatience as household living expenses, mortgage borrowing costs, and utility pressures pinch monthly kitchen-table budgets. With unemployment registered at ${Number(eState.unemployment_rate || 4.2).toFixed(1)}% and bank lending rates averaging ${Number(eState.bank_lending_rate || 5.75).toFixed(2)}%, local civic associations and small business owners held coordinated town halls this week to demand immediate legislative relief. Union representatives and civic advocates voiced acute frustration over congressional gridlock, urging ${pState.politician_name} to champion tangible regional investments rather than partisan posturing. Community organizers warned that voters across the district are keeping detailed score of who delivers real results and who merely recites talking points.`;

  if (approval >= 65) {
    tribuneHeadline = `District Poll Shows Surging Approval for ${pState.politician_name}`;
    tribuneBody = `Local voters across ${pState.district_name} continue to voice robust confidence in ${pState.politician_title} ${pState.politician_name}, with the latest comprehensive regional polling showing an impressive ${approval}% favorable rating. Constituents at local town halls repeatedly cited responsive casework, visible municipal infrastructure advocacy, and consistent engagement with civic leaders as the cornerstone of the office's enduring popularity. Even registered opposition voters acknowledged that the member has maintained an authentic presence in district communities while navigating contentious national policy debates. As campaign season approaches, local political analysts note that this commanding approval margin provides substantial political capital to advance ambitious statutory priorities without fearing imminent primary or general election headwinds.`;
  } else if (approval < 45) {
    tribuneHeadline = `Challenger Launches Early Ad Blitz Targeting Incumbent District Record`;
    tribuneBody = `Opposition campaigns have begun buying heavy television airtime across ${pState.district_name}, capitalizing on voter dissatisfaction and flagging approval ratings that have slumped to ${approval}%. Challenger commercials aggressively highlight rising grocery receipts, unresolved infrastructure bottlenecks, and legislative stalemates in the capital, portraying ${pState.politician_title} ${pState.politician_name} as disconnected from the daily economic realities of working-class households. In response, campaign surrogates emphasize upcoming community grants and bipartisan committee efforts, but local ward chairs acknowledge that voter fatigue is real and immediate course correction is imperative. With polling margins narrowing rapidly, district strategists concede that the campaign must demonstrate decisive leadership before the primary filing window closes.`;
  }

  articles.push({
    publisher: 'daily_tribune',
    publisher_name: 'The Daily Tribune',
    headline: tribuneHeadline,
    body: enforceWordCount(tribuneBody, 100, 120),
    tone: approval < 45 ? 'critical' : 'favorable',
    urgency: 'medium',
    featured_issue: 'Constituent Mood',
    year,
    month
  });

  // Publisher 3: Westminster Wire / Beltway Insider
  let wireHeadline = `Whip Operations Gauge Floor Margins Ahead of Decisive Divisions`;
  let wireBody = `Party whips are keeping an exhaustive roll-call tally on moderate and frontline members as legislative leadership prepares the contentious upcoming calendar. With crossbench factions threatening procedural delay and floor amendments on key economic measures, party whips have established round-the-clock monitoring of committee corridors to guarantee quorum and enforce caucus discipline. Private whipping memoranda circulated this morning indicate that several vulnerable backbenchers are demanding substantial district carve-outs in exchange for supporting the executive's broader legislative package. Leadership aides concede that managing these divergent factional demands requires delicate political brinkmanship, especially with macro indicators generating renewed volatility. Every prospective vote is being calibrated to prevent embarrassing floor defections that could shake government confidence.`;

  articles.push({
    publisher: 'westminster_wire',
    publisher_name: pState.system_type === 'parliamentary' ? 'Westminster Wire' : 'Beltway Insider',
    headline: wireHeadline,
    body: enforceWordCount(wireBody, 100, 120),
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

  // Rapidity of events (volatility) threshold
  const rapidity = pState.volatility || eState.volatility || 'normal';
  const rapidityChances = {
    low: 0.20,
    normal: 0.40,
    high: 0.65,
    extreme: 0.85
  };
  const eventChance = rapidityChances[rapidity] ?? 0.40;
  if (Math.random() > eventChance) {
    return null;
  }

  // Starting condition / Political climate affects negative vs positive polarity
  const condition = pState.starting_condition || eState.starting_condition || 'normal';
  let baseNegativeChance = 0.45;
  if (condition === 'easy') baseNegativeChance = 0.30;
  if (condition === 'hard') baseNegativeChance = 0.60;

  // Decide polarity based on general mood and economic stress
  const isHighStress = (Number(eState.inflation_cpi || 0) > 4.2) || (Number(eState.unemployment_rate || 0) > 5.2) || (Number(pState.district_approval || 50) < 48);
  const isNegative = isHighStress ? (Math.random() < 0.75) : (Math.random() < baseNegativeChance);
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
  // Bicameral System Offices
  representative: {
    id: 'representative',
    title: 'Representative',
    chamber: 'Lower House',
    system_type: 'bicameral',
    target_war_chest: 6.0,
    target_achievement: 18,
    min_terms: 1,
    term_months: 24,
    description: 'Lower House Representative fighting for local community funding and district constituent needs in every 2-year election cycle.',
    powers_summary: 'Originate revenue legislation, table amendments, vote on federal appropriations.'
  },
  senator: {
    id: 'senator',
    title: 'Senator',
    chamber: 'Upper House',
    system_type: 'bicameral',
    target_war_chest: 32.0,
    target_achievement: 48,
    min_terms: 2,
    term_months: 72,
    description: 'Upper House Senator with 6-year tenure, filibuster authority, judicial confirmation power, and treaty ratification votes.',
    powers_summary: 'Advise and consent on cabinet secretaries & judges, ratify treaties, command statewide media attention.'
  },
  president: {
    id: 'president',
    title: 'President',
    chamber: 'Office of the President',
    system_type: 'bicameral',
    target_war_chest: 125.0,
    target_achievement: 90,
    min_terms: 3,
    term_months: 48,
    description: 'Head of State and Commander-in-Chief with executive orders, statutory veto authority, and international summit leadership.',
    powers_summary: 'Executive order decrees, absolute veto over congressional bills, appoint federal reserve governors.'
  },

  // Unicameral System (House of Commons) Offices
  backbencher: {
    id: 'backbencher',
    title: 'Member of Parliament',
    chamber: 'House of Commons',
    system_type: 'unicameral',
    target_war_chest: 2.5,
    target_achievement: 14,
    min_terms: 1,
    term_months: 36,
    description: 'Constituency MP tabling parliamentary questions, debating white papers, and building cross-faction alliances in the House of Commons.',
    powers_summary: 'Table motions, vote on government supply, represent constituency cases.'
  },
  committee_chair: {
    id: 'committee_chair',
    title: 'Commons Committee Chair',
    chamber: 'House of Commons',
    system_type: 'unicameral',
    target_war_chest: 7.0,
    target_achievement: 30,
    min_terms: 2,
    term_months: 36,
    description: 'Influential parliamentary scrutiny chair with subpoena power over ministers and central bank governors.',
    powers_summary: 'Summon ministers, question central bankers, publish binding investigative reports.'
  },
  cabinet_minister: {
    id: 'cabinet_minister',
    title: 'Cabinet Minister',
    chamber: 'House of Commons / Cabinet',
    system_type: 'unicameral',
    target_war_chest: 20.0,
    target_achievement: 55,
    min_terms: 3,
    term_months: 36,
    description: 'Senior minister directing major national ministry departments, formulating statutory bills, and steering treasury allocations.',
    powers_summary: 'Direct civil service ministries, sponsor official government legislation, shape fiscal envelopes.'
  },
  prime_minister: {
    id: 'prime_minister',
    title: 'Prime Minister',
    chamber: 'House of Commons / Executive',
    system_type: 'unicameral',
    target_war_chest: 70.0,
    target_achievement: 85,
    min_terms: 4,
    term_months: 36,
    description: 'Chief Executive leading the parliamentary majority in the House of Commons, appointing the Cabinet, and managing sovereign governance.',
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

// Comprehensive Donor Interrogation Question Bank (16 Special Interest Dilemmas with Divisive vs Ethical Payouts)
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
        base_funds_multiplier: 4.20,
        political_effects: { polling_margin: -2.8, party_loyalty: -3, ethics_scrutiny: 10, national_approval: -2 },
        donor_promise: {
          promise_key: 'wall_street_carried_interest',
          promise_title: 'Protect Private Equity Carried Interest Exemption & Cap Capital Gains',
          donor_group: 'Wall Street Investment Banks PAC',
          donor_category: 'Financial Services',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Capital Formation & Investment Liquidity Safeguard Act',
          suggested_summary: 'Enacts permanent statutory protections for carried interest and caps long-term capital gains tax rates to foster private market liquidity.',
          suggested_fiscal_impact: -18,
          public_support: 31,
          war_chest_reward_millions: 8.5,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Stand with Working Families & Fair Taxation',
        description: 'Vow to close tax loopholes that favor Wall Street over payroll workers, accepting an icy response from the dinner.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 2.8, party_loyalty: 6, ethics_scrutiny: -4, national_approval: 3 },
        donor_promise: {
          promise_key: 'close_carried_interest_loophole',
          promise_title: 'Close Wall Street Carried Interest Tax Loophole',
          donor_group: 'Working Families & Fair Tax Coalition',
          donor_category: 'Taxpayer Advocacy & Labor',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Fair Payroll Investment & Corporate Loophole Repeal Act',
          suggested_summary: 'Closes offshore private equity exemptions and applies standard payroll taxes to multi-million-dollar fund manager bonuses, redirecting revenue to trade apprenticeships.',
          suggested_fiscal_impact: -32,
          public_support: 76,
          war_chest_reward_millions: 1.8,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Propose Targeted Venture Reinvestment Exemption',
        description: 'Offer a compromise: preserve preferential rates strictly for long-term domestic manufacturing and high-tech startups.',
        base_funds_multiplier: 1.15,
        political_effects: { polling_margin: 0.8, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'venture_reinvestment_exemption',
          promise_title: 'Domestic High-Tech Startup R&D Reinvestment Safe Harbor',
          donor_group: 'Venture Capital & Innovation Council',
          donor_category: 'Technology & Finance',
          statutory_category: 'technology',
          suggested_bill_title: 'High-Tech Startup & Domestic Advanced Manufacturing R&D Act',
          suggested_summary: 'Preserves preferential capital gains rates specifically for venture investments poured into domestic clean energy, robotics, and semiconductor manufacturing.',
          suggested_fiscal_impact: 14,
          public_support: 62,
          war_chest_reward_millions: 3.5,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 3.80,
        political_effects: { polling_margin: -2.0, party_loyalty: 5, ethics_scrutiny: 6, national_approval: 0 },
        donor_promise: {
          promise_key: 'zero_emission_fossil_moratorium',
          promise_title: 'Enact Mandatory 8-Year Zero-Emission Grid & Ban Export Pipelines',
          donor_group: 'National Clean Energy & Climate Super-PAC',
          donor_category: 'Renewable Energy & Climate',
          statutory_category: 'energy',
          suggested_bill_title: 'Emergency Climate Mobilization & Clean Grid Transition Act',
          suggested_summary: 'Imposes binding federal deadlines phasing out unabated fossil electricity generation by Year 8 and halts all federal approvals for cross-border petroleum pipelines.',
          suggested_fiscal_impact: 48,
          public_support: 39,
          war_chest_reward_millions: 7.5,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Emphasize Grid Reliability & Consumer Energy Costs',
        description: 'Refuse arbitrary deadlines, insisting that working-class utility bills and baseload natural gas must be safeguarded.',
        base_funds_multiplier: 0.30,
        political_effects: { polling_margin: 2.2, party_loyalty: -4, ethics_scrutiny: -2, national_approval: 2 },
        donor_promise: {
          promise_key: 'utility_ratepayer_protection',
          promise_title: 'Protect Working-Class Household Electric Utility Affordability',
          donor_group: 'Consumer Energy Affordability Watchdog',
          donor_category: 'Consumer Protection',
          statutory_category: 'energy',
          suggested_bill_title: 'Household Electric Utility Reliability & Ratepayer Protection Act',
          suggested_summary: 'Caps retail electricity rate hikes and guarantees federal backup capacity payments for dispatchable baseload natural gas generators during peak winter freezes.',
          suggested_fiscal_impact: 18,
          public_support: 72,
          war_chest_reward_millions: 1.6,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Back Technology-Neutral Clean Energy Tax Credits',
        description: 'Promote an all-of-the-above transition encompassing nuclear, hydrogen, and carbon-capture alongside wind and solar.',
        base_funds_multiplier: 1.20,
        political_effects: { polling_margin: 1.1, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'tech_neutral_clean_incentives',
          promise_title: 'Bipartisan All-of-the-Above Clean Energy Investment Incentives',
          donor_group: 'Bipartisan Energy Security Coalition',
          donor_category: 'Energy Infrastructure',
          statutory_category: 'energy',
          suggested_bill_title: 'Advanced Clean Baseload & Hydrogen Infrastructure Act',
          suggested_summary: 'Provides technology-neutral investment tax credits for next-generation nuclear, green hydrogen, and carbon-capture retrofits to ensure zero-emission grid reliability.',
          suggested_fiscal_impact: 28,
          public_support: 65,
          war_chest_reward_millions: 3.8,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 3.90,
        political_effects: { polling_margin: 1.2, party_loyalty: 6, ethics_scrutiny: 6, national_approval: 0 },
        donor_promise: {
          promise_key: 'industrial_tariffs_card_check',
          promise_title: 'Mandate 25% Steel Import Tariffs & Statutory Card-Check Rights',
          donor_group: 'United Industrial & Manufacturing Labor Federation',
          donor_category: 'Labor Unions & Trade',
          statutory_category: 'justice',
          suggested_bill_title: 'National Manufacturing Renaissance & Worker Organizing Rights Act',
          suggested_summary: 'Establishes a mandatory 25% ad valorem tariff on imported steel and aluminum while recognizing union bargaining units through majority card-check certification.',
          suggested_fiscal_impact: -8,
          public_support: 44,
          war_chest_reward_millions: 7.8,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Defend Global Supply Chains & Low Consumer Prices',
        description: 'Explain that broad tariffs trigger retaliatory export bans and drive up consumer inflation across households.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 1.8, party_loyalty: -6, ethics_scrutiny: -2, national_approval: 1 },
        donor_promise: {
          promise_key: 'fair_trade_consumer_pricing',
          promise_title: 'Safeguard Consumer Affordability Against Inflated Import Duties',
          donor_group: 'Consumer Alliance for Open Trade',
          donor_category: 'Consumer Advocacy',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Consumer Cost of Living & Open Supply Chain Protection Act',
          suggested_summary: 'Exempts consumer household goods from retaliatory tariff schedules and establishes an independent commission to audit tariff-driven retail price inflation.',
          suggested_fiscal_impact: -12,
          public_support: 70,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Propose Domestic Content Subsidies Over Tariffs',
        description: 'Offer direct tax credits for manufacturing goods built with domestic union labor while avoiding retaliatory trade wars.',
        base_funds_multiplier: 1.15,
        political_effects: { polling_margin: 1.0, party_loyalty: 3, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'domestic_content_tax_credits',
          promise_title: 'Domestic Union Manufacturing Production Tax Incentives',
          donor_group: 'Bipartisan Industrial Competitiveness Alliance',
          donor_category: 'Commerce & Industry',
          statutory_category: 'infrastructure',
          suggested_bill_title: 'Domestic Supply Chain & Union Apprenticeship Incentive Act',
          suggested_summary: 'Creates direct bonus tax credits for equipment assembled with domestic components and registered union apprentices without imposing retaliatory import duties.',
          suggested_fiscal_impact: 22,
          public_support: 64,
          war_chest_reward_millions: 3.6,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 4.50,
        political_effects: { polling_margin: -3.2, party_loyalty: -3, ethics_scrutiny: 12, national_approval: -2 },
        donor_promise: {
          promise_key: 'ai_liability_preemption',
          promise_title: 'Preempt State AI Safety Audits & Shield Frontier Model Training',
          donor_group: 'Silicon Valley Tech & AI Venture Coalition',
          donor_category: 'Technology & AI',
          statutory_category: 'technology',
          suggested_bill_title: 'Frontier AI Innovation & Global Technology Leadership Act',
          suggested_summary: 'Federally preempts state-level AI safety auditing laws, provides liability protection for open-source model releases, and bans mandatory kill-switch regulations.',
          suggested_fiscal_impact: 10,
          public_support: 28,
          war_chest_reward_millions: 9.5,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Demand Strict AI Safety Standards & Labor Protections',
        description: 'Assert that algorithmic bias, job displacement, and catastrophic safety risks require independent federal audits.',
        base_funds_multiplier: 0.20,
        political_effects: { polling_margin: 3.2, party_loyalty: 4, ethics_scrutiny: -4, national_approval: 3 },
        donor_promise: {
          promise_key: 'ai_safety_worker_protection',
          promise_title: 'Mandate Independent Frontier AI Safety Audits & Worker Retraining',
          donor_group: 'Citizens for Ethical AI & Worker Rights',
          donor_category: 'Consumer & Digital Rights',
          statutory_category: 'technology',
          suggested_bill_title: 'Artificial Intelligence Transparency, Safety & Worker Protection Act',
          suggested_summary: 'Mandates third-party pre-deployment safety evaluations for frontier models, bans algorithmic employment discrimination, and creates an automated displacement transition fund.',
          suggested_fiscal_impact: 16,
          public_support: 78,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Propose National AI Infrastructure & Public Compute',
        description: 'Create a federal open compute cloud for universities while establishing clear liability for malicious misuse.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: 1.2, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'national_ai_research_cloud',
          promise_title: 'National AI Research Cloud for Public Universities & Sovereign Datacenters',
          donor_group: 'National Science & Academic Supercomputing Consortium',
          donor_category: 'Education & Science',
          statutory_category: 'technology',
          suggested_bill_title: 'National Sovereign AI Research Infrastructure & Public Compute Act',
          suggested_summary: 'Establishes a federally operated high-performance GPU compute cluster for academic researchers and sets clear criminal liability strictly for malicious cyber exploits.',
          suggested_fiscal_impact: 24,
          public_support: 66,
          war_chest_reward_millions: 3.9,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 4.10,
        political_effects: { polling_margin: -1.8, party_loyalty: 2, ethics_scrutiny: 9, national_approval: 0 },
        donor_promise: {
          promise_key: 'defense_sole_source_expansion',
          promise_title: 'Guarantee Multi-Year Sole-Source Procurement for Naval & Aerospace Systems',
          donor_group: 'Defense Aerospace & National Security Roundtable',
          donor_category: 'Military & Defense',
          statutory_category: 'defense',
          suggested_bill_title: 'Sovereign Deterrence & Fleet Modernization Appropriations Act',
          suggested_summary: 'Locks in multi-year block-buy contracts for next-generation attack submarines, sixth-generation fighters, and satellite constellations with guaranteed profit margins.',
          suggested_fiscal_impact: 65,
          public_support: 34,
          war_chest_reward_millions: 9.0,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Demand Pentagon Financial Audits & Procurement Caps',
        description: 'Insist that defense spending cannot rise until the Pentagon passes a clean financial audit and reins in cost overruns.',
        base_funds_multiplier: 0.30,
        political_effects: { polling_margin: 2.6, party_loyalty: -2, ethics_scrutiny: -4, national_approval: 2 },
        donor_promise: {
          promise_key: 'pentagon_clean_audit_mandate',
          promise_title: 'Condition Defense Appropriations on Clean Financial Audits',
          donor_group: 'Taxpayers for Government Accountability & Defense Oversight',
          donor_category: 'Government Integrity',
          statutory_category: 'defense',
          suggested_bill_title: 'Pentagon Financial Accountability & Sole-Source Procurement Reform Act',
          suggested_summary: 'Penalizes military service branches that fail independent financial audits and caps executive compensation at contractors experiencing cost overruns.',
          suggested_fiscal_impact: -20,
          public_support: 82,
          war_chest_reward_millions: 1.4,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Reallocate Legacy Weapons to Drone & Cyber Capabilities',
        description: 'Shift appropriations from legacy heavy armor to autonomous uncrewed drones, space resilience, and cyber defense.',
        base_funds_multiplier: 1.20,
        political_effects: { polling_margin: 1.0, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'autonomous_drone_cyber_pivot',
          promise_title: 'Procurement Shift Toward Low-Cost Autonomous Uncrewed Systems',
          donor_group: 'Defense Tech Startups & Uncrewed Systems Alliance',
          donor_category: 'Military Technology',
          statutory_category: 'defense',
          suggested_bill_title: 'Asymmetric Autonomous Defense & Sovereign Cyber Shield Act',
          suggested_summary: 'Decommissions outdated heavy mechanized formations and reallocates $25B directly into attritable autonomous maritime drones, swarm munitions, and cyber hardening.',
          suggested_fiscal_impact: 20,
          public_support: 63,
          war_chest_reward_millions: 3.7,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 4.60,
        political_effects: { polling_margin: -3.8, party_loyalty: -4, ethics_scrutiny: 14, national_approval: -3 },
        donor_promise: {
          promise_key: 'pharma_patent_evergreening_shield',
          promise_title: 'Block Medicare Price Negotiations & Extend Biologic Patent Exclusivity',
          donor_group: 'Pharmaceutical Research & Biotech Consortium',
          donor_category: 'Healthcare & Biotech',
          statutory_category: 'healthcare',
          suggested_bill_title: 'Biopharmaceutical Innovation & Intellectual Property Protection Act',
          suggested_summary: 'Prohibits federal government drug price setting and extends market exclusivity for biologic therapies by an additional 5 years against generic biosimilars.',
          suggested_fiscal_impact: 35,
          public_support: 24,
          war_chest_reward_millions: 11.0,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Champion Direct Price Negotiations for All Prescriptions',
        description: 'Vow that no constituent will ever be forced to ration insulin or lifesaving medications due to corporate profiteering.',
        base_funds_multiplier: 0.20,
        political_effects: { polling_margin: 3.6, party_loyalty: 7, ethics_scrutiny: -5, national_approval: 4 },
        donor_promise: {
          promise_key: 'universal_drug_price_negotiation',
          promise_title: 'Mandate Direct Federal Price Negotiation for All Top 250 Prescriptions',
          donor_group: 'Affordable Medication for All Citizens Coalition',
          donor_category: 'Healthcare & Senior Advocacy',
          statutory_category: 'healthcare',
          suggested_bill_title: 'Universal Prescription Drug Price Negotiation & Insulin Cap Act',
          suggested_summary: 'Empowers public health agencies to negotiate manufacturer prices on all major patented medications and caps out-of-pocket insulin at $25/month for all citizens.',
          suggested_fiscal_impact: -42,
          public_support: 86,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Cap Out-of-Pocket Co-Pays While Subsidizing R&D',
        description: 'Cap patient prescription co-pays at $35/month while offering research tax credits to sustain biotech pipelines.',
        base_funds_multiplier: 1.15,
        political_effects: { polling_margin: 1.4, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 2 },
        donor_promise: {
          promise_key: 'copay_cap_biotech_tax_credit',
          promise_title: 'Cap Monthly Patient Co-Pays with Targeted Rare Disease Tax Credits',
          donor_group: 'Patient Access & Biotech Innovation Bridge',
          donor_category: 'Healthcare Reform',
          statutory_category: 'healthcare',
          suggested_bill_title: 'Patient Co-Pay Ceiling & Rare Disease Research Credit Act',
          suggested_summary: 'Caps commercial insurance patient prescription co-pays at $35 per 30-day supply while reimbursing domestic biotech labs through clinical trial R&D tax credits.',
          suggested_fiscal_impact: 18,
          public_support: 68,
          war_chest_reward_millions: 3.6,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 3.75,
        political_effects: { polling_margin: -2.2, party_loyalty: -2, ethics_scrutiny: 7, national_approval: -1 },
        donor_promise: {
          promise_key: 'preempt_rent_control_zoning',
          promise_title: 'Federally Preempt Municipal Rent Control & Environmental Building Reviews',
          donor_group: 'National Association of Homebuilders & Realtors',
          donor_category: 'Housing & Real Estate',
          statutory_category: 'housing',
          suggested_bill_title: 'National Housing Construction & Local Rent Control Preemption Act',
          suggested_summary: 'Withholds federal infrastructure grants from any municipality that enacts rent caps or restrictive historic preservation ordinances blocking private multi-family construction.',
          suggested_fiscal_impact: 15,
          public_support: 33,
          war_chest_reward_millions: 7.6,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Enact National Tenant Protections & Eviction Limits',
        description: 'Stand with tenant advocacy groups against predatory corporate landlords and back emergency rent caps.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 2.6, party_loyalty: 5, ethics_scrutiny: -3, national_approval: 2 },
        donor_promise: {
          promise_key: 'tenant_bill_of_rights',
          promise_title: 'Enact National Tenant Bill of Rights & Corporate Landlord Tax Penalty',
          donor_group: 'National Tenants Union & Housing Equity Alliance',
          donor_category: 'Tenant Advocacy',
          statutory_category: 'housing',
          suggested_bill_title: 'National Tenant Bill of Rights & Anti-Price-Gouging Housing Act',
          suggested_summary: 'Bans institutional private equity algorithmic rent price-fixing, caps annual rent increases at inflation + 3%, and establishes federal legal aid for unlawful evictions.',
          suggested_fiscal_impact: 8,
          public_support: 79,
          war_chest_reward_millions: 1.4,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Low-Income Housing Tax Credit Expansion with Density Incentives',
        description: 'Double the federal affordable housing tax credit while offering bonuses for transit-oriented high-density building.',
        base_funds_multiplier: 1.20,
        political_effects: { polling_margin: 1.2, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'lihtc_transit_density_expansion',
          promise_title: 'Double Low-Income Housing Tax Credits for Transit-Oriented Density',
          donor_group: 'Affordable Housing Coalition & Smart Growth Alliance',
          donor_category: 'Urban Planning & Housing',
          statutory_category: 'housing',
          suggested_bill_title: 'Transit-Oriented Affordable Housing & LIHTC Expansion Act',
          suggested_summary: 'Doubles the annual allocation of Low-Income Housing Tax Credits with targeted 30% basis boosts for projects built within half a mile of passenger rail stations.',
          suggested_fiscal_impact: 26,
          public_support: 67,
          war_chest_reward_millions: 3.8,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 1.80,
        political_effects: { polling_margin: 3.2, party_loyalty: 7, ethics_scrutiny: -5, national_approval: 3 },
        donor_promise: {
          promise_key: 'ultra_millionaire_wealth_tax',
          promise_title: 'Enact 2% Annual Surtax on Net Worth Exceeding $50 Million',
          donor_group: 'Independent Small-Dollar Grassroots Alliance',
          donor_category: 'Populist Grassroots',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Ultra-Millionaire Wealth Tax & Clean Election Financing Act',
          suggested_summary: 'Imposes an annual 2% tax on worldwide wealth over $50 million (3% over $1 billion) and uses revenue to provide small-dollar 6-to-1 public matching funds for clean campaigns.',
          suggested_fiscal_impact: -55,
          public_support: 71,
          war_chest_reward_millions: 2.8,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'B',
        label: 'Reject Unconstitutional Wealth Asset Levies',
        description: 'Argue that taxing unrealized paper net worth causes capital flight and violates foundational property rights.',
        base_funds_multiplier: 3.90,
        political_effects: { polling_margin: -2.4, party_loyalty: -6, ethics_scrutiny: 8, national_approval: -2 },
        donor_promise: {
          promise_key: 'wealth_tax_statutory_ban',
          promise_title: 'Statutory Prohibition on Federal Unrealized Wealth & Asset Levies',
          donor_group: 'Patriots for Sovereign Property Rights & Family Foundations',
          donor_category: 'Wealth Management & Foundations',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Constitutional Property Rights & Unrealized Asset Protection Act',
          suggested_summary: 'Statutorily prohibits the Treasury Department from assessing or collecting direct federal taxes on unrealized capital gains or cumulative net wealth assets.',
          suggested_fiscal_impact: 0,
          public_support: 36,
          war_chest_reward_millions: 8.2,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'C',
        label: 'Close Stepped-Up Basis & Strengthen Corporate Minimum Taxes',
        description: 'Focus on taxing realized capital gains at death and ensuring profitable multinational conglomerates pay at least 15%.',
        base_funds_multiplier: 1.10,
        political_effects: { polling_margin: 1.2, party_loyalty: 3, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'stepped_up_basis_repeal',
          promise_title: 'Repeal Stepped-Up Basis on Inherited Capital Assets Over $5 Million',
          donor_group: 'Fiscal Responsibility & Tax Reform Caucus',
          donor_category: 'Tax Policy',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Inherited Capital Gains Fairness & Corporate Minimum Tax Act',
          suggested_summary: 'Eliminates the stepped-up basis loophole for inherited investment portfolios exceeding $5 million and imposes a strict 15% domestic book income corporate minimum tax.',
          suggested_fiscal_impact: -25,
          public_support: 62,
          war_chest_reward_millions: 3.4,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 3.70,
        political_effects: { polling_margin: 1.0, party_loyalty: 2, ethics_scrutiny: 6, national_approval: 0 },
        donor_promise: {
          promise_key: 'permanent_crop_insurance_subsidy',
          promise_title: 'Shield 100% Federal Crop Insurance Premium Subsidies for Mega-Farms',
          donor_group: 'American Farm Bureau & Agricultural Co-ops',
          donor_category: 'Agriculture & Biofuels',
          statutory_category: 'infrastructure',
          suggested_bill_title: 'Heartland Farm Safety Net & Biofuel Blending Mandate Act',
          suggested_summary: 'Permanently reauthorizes uncapped federal crop insurance premium subsidies without means-testing and mandates a 15% commercial ethanol fuel blend standard.',
          suggested_fiscal_impact: 38,
          public_support: 38,
          war_chest_reward_millions: 7.2,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Cap Subsidies for Mega-Farms & Prioritize Soil Conservation',
        description: 'Redirect crop insurance subsidies away from billionaire agribusiness conglomerates toward small organic family farmers.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 2.2, party_loyalty: 2, ethics_scrutiny: -3, national_approval: 2 },
        donor_promise: {
          promise_key: 'cap_mega_farm_subsidies',
          promise_title: 'Means-Test Farm Subsidies at $250k & Expand Regenerative Soil Grants',
          donor_group: 'Family Farmers Alliance for Conservation',
          donor_category: 'Sustainable Agriculture',
          statutory_category: 'infrastructure',
          suggested_bill_title: 'Family Farm Soil Conservation & Agribusiness Means-Testing Act',
          suggested_summary: 'Caps annual taxpayer crop insurance subsidies at $250,000 per farming operation and redirects $8B into regenerative cover-crop soil conservation grants.',
          suggested_fiscal_impact: -14,
          public_support: 81,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Expand Precision Agriculture & Drought Resilience Grants',
        description: 'Modernize the farm safety net with high-tech water conservation grants and climate-smart insurance discounts.',
        base_funds_multiplier: 1.20,
        political_effects: { polling_margin: 0.9, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'precision_ag_drought_resilience',
          promise_title: 'Precision Agriculture Satellite Technology & Water Conservation Grants',
          donor_group: 'AgTech & Precision Farming Coalition',
          donor_category: 'Agricultural Technology',
          statutory_category: 'technology',
          suggested_bill_title: 'Drought Resilience & High-Tech Precision Farming Act',
          suggested_summary: 'Provides low-interest equipment loans for automated drip irrigation and precision GPS fertilizer mapping to cut agricultural runoff by 40%.',
          suggested_fiscal_impact: 16,
          public_support: 65,
          war_chest_reward_millions: 3.5,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 4.10,
        political_effects: { polling_margin: -2.6, party_loyalty: -3, ethics_scrutiny: 8, national_approval: -2 },
        donor_promise: {
          promise_key: 'cap_corporate_tax_21',
          promise_title: 'Statutory Ceiling Capping Corporate Income Tax at 21%',
          donor_group: 'National Retailers & Commercial Chamber of Commerce',
          donor_category: 'Commerce & Retail',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Commercial Competitiveness & Corporate Tax Certainty Act',
          suggested_summary: 'Statutorily locks the federal corporate income tax rate at 21% and creates an expedited arbitration mechanism against state corporate franchise taxes.',
          suggested_fiscal_impact: -22,
          public_support: 30,
          war_chest_reward_millions: 8.8,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Raise the Corporate Rate to 28% for Social Investments',
        description: 'Insist that highly profitable corporations must fund public infrastructure, childcare, and healthcare.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 2.8, party_loyalty: 6, ethics_scrutiny: -3, national_approval: 2 },
        donor_promise: {
          promise_key: 'corporate_tax_28_childcare',
          promise_title: 'Raise Corporate Tax Rate to 28% to Fund Universal Childcare',
          donor_group: 'Fair Share for Working Families Coalition',
          donor_category: 'Labor & Social Advocacy',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Corporate Fair Share & Universal Early Childcare Act',
          suggested_summary: 'Adjusts the statutory corporate tax rate to 28% on profits over $100M and dedicates proceeds directly to universal pre-K childcare subsidies for working parents.',
          suggested_fiscal_impact: -45,
          public_support: 75,
          war_chest_reward_millions: 1.6,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Maintain Current Rate While Permitting 100% Capital Expensing',
        description: 'Keep the headline rate stable but allow immediate write-offs for companies building domestic factories.',
        base_funds_multiplier: 1.20,
        political_effects: { polling_margin: 0.8, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'permanent_100_percent_expensing',
          promise_title: 'Permanent 100% Full Capital Expensing for Domestic Factory Machinery',
          donor_group: 'Domestic Manufacturers Council',
          donor_category: 'Manufacturing & Commerce',
          statutory_category: 'infrastructure',
          suggested_bill_title: 'Domestic Factory Modernization & Accelerated Expensing Act',
          suggested_summary: 'Allows commercial enterprises to immediately deduct the full cost of domestic industrial machinery and semiconductor fabrication equipment in the year acquired.',
          suggested_fiscal_impact: -15,
          public_support: 61,
          war_chest_reward_millions: 3.6,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 4.80,
        political_effects: { polling_margin: -3.0, party_loyalty: -3, ethics_scrutiny: 12, national_approval: -2 },
        donor_promise: {
          promise_key: 'crypto_sec_enforcement_shield',
          promise_title: 'Preempt SEC Jurisdiction Over Digital Assets & Classify as Commodities',
          donor_group: 'Digital Asset & Blockchain Innovation Fund',
          donor_category: 'Fintech & Cryptocurrency',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Digital Asset Market Structure & Blockchain Innovation Act',
          suggested_summary: 'Transfers primary federal regulatory authority over cryptocurrency exchanges from the SEC to the CFTC and shields decentralized protocols from securities registration.',
          suggested_fiscal_impact: 5,
          public_support: 27,
          war_chest_reward_millions: 10.5,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Demand Strict Bank-Like Capital Reserves & Consumer Audits',
        description: 'Warn that unregulated crypto exposes retail consumers to predatory scams and systemic contagion.',
        base_funds_multiplier: 0.20,
        political_effects: { polling_margin: 2.4, party_loyalty: 4, ethics_scrutiny: -4, national_approval: 2 },
        donor_promise: {
          promise_key: 'crypto_consumer_protection_reserve',
          promise_title: 'Mandate 1-to-1 Federal Cash Reserves for All Stablecoin Issuers',
          donor_group: 'Americans Against Financial Predation & Fraud',
          donor_category: 'Consumer Protection',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Stablecoin Consumer Solvency & Exchange Fraud Prevention Act',
          suggested_summary: 'Requires digital token issuers to maintain 100% liquid cash reserves at insured commercial banks and subjects offshore crypto executives to domestic anti-fraud jurisdiction.',
          suggested_fiscal_impact: -5,
          public_support: 80,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Enact Statutory Stablecoin Guardrails Under Treasury Oversight',
        description: 'Permit stablecoin innovation provided tokens are 100% backed by short-term sovereign treasuries with audited reserves.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: 0.8, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'statutory_stablecoin_treasury_framework',
          promise_title: 'Regulated Sovereign Treasury-Backed Stablecoin Framework',
          donor_group: 'Fintech Regulatory Compliance Council',
          donor_category: 'Fintech & Banking',
          statutory_category: 'fiscal',
          suggested_bill_title: 'Sovereign Digital Asset Modernization & Payment Reserve Act',
          suggested_summary: 'Authorizes licensed financial institutions to issue programmable dollar stablecoins backed exclusively by short-term sovereign Treasury bills with monthly public audit attestations.',
          suggested_fiscal_impact: 10,
          public_support: 59,
          war_chest_reward_millions: 3.8,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 3.60,
        political_effects: { polling_margin: -1.5, party_loyalty: 0, ethics_scrutiny: 5, national_approval: 0 },
        donor_promise: {
          promise_key: 'fully_automate_container_ports',
          promise_title: 'Subsidize Rapid Port Automation Cranes & AI Terminal Logistics',
          donor_group: 'Maritime Shipping & Port Logistics Guild',
          donor_category: 'Transportation & Logistics',
          statutory_category: 'infrastructure',
          suggested_bill_title: 'Port Logistics Modernization & Automated Crane Subsidies Act',
          suggested_summary: 'Provides $18B in federal matching grants for major maritime container ports to deploy uncrewed automated gantry cranes and AI logistics systems to expedite freight offloading.',
          suggested_fiscal_impact: 22,
          public_support: 36,
          war_chest_reward_millions: 7.2,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Protect Longshore Worker Jobs Against Rapid Automation',
        description: 'Condition federal port grants on longshore worker job guarantees and worker retraining agreements.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 2.0, party_loyalty: 5, ethics_scrutiny: -2, national_approval: 1 },
        donor_promise: {
          promise_key: 'longshore_worker_job_guarantee',
          promise_title: 'Condition Federal Port Grants on Union Longshore Worker Job Guarantees',
          donor_group: 'International Longshore & Dockworkers Solidarity Union',
          donor_category: 'Labor & Maritime Transport',
          statutory_category: 'infrastructure',
          suggested_bill_title: 'Dockworker Livelihood & Maritime Port Infrastructure Protection Act',
          suggested_summary: 'Prohibits the deployment of automated container machinery that displaces dockworkers without prior collective bargaining agreement ratification and lifetime wage security.',
          suggested_fiscal_impact: 12,
          public_support: 73,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Hybrid Workforce Transition with Automated Night Shifts',
        description: 'Phase in automation during off-peak hours while providing union pension protection guarantees.',
        base_funds_multiplier: 1.20,
        political_effects: { polling_margin: 0.8, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'hybrid_port_automation_pension',
          promise_title: 'Hybrid Port Automation Transition with Guaranteed Worker Pension Solvency',
          donor_group: 'Maritime Logistics & Labor Accord Council',
          donor_category: 'Infrastructure & Labor',
          statutory_category: 'infrastructure',
          suggested_bill_title: '24-Hour Port Operations & Dockworker Pension Security Act',
          suggested_summary: 'Expands 24-hour freight terminal operations with off-peak automated staging while funding dockworker union pension funds through a dedicated automated container tariff.',
          suggested_fiscal_impact: 15,
          public_support: 64,
          war_chest_reward_millions: 3.5,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 3.50,
        political_effects: { polling_margin: -1.4, party_loyalty: 2, ethics_scrutiny: 6, national_approval: 0 },
        donor_promise: {
          promise_key: 'exempt_university_endowments',
          promise_title: 'Permanently Repeal Federal Excise Taxes on University Endowments',
          donor_group: 'Higher Education & Academic Research Endowment Alliance',
          donor_category: 'Education & Science',
          statutory_category: 'technology',
          suggested_bill_title: 'Academic Research Endowment Freedom & Science Preeminence Act',
          suggested_summary: 'Repeals the federal net investment income tax on private university endowments and increases National Science Foundation quantum research grants by $10B.',
          suggested_fiscal_impact: 14,
          public_support: 35,
          war_chest_reward_millions: 6.8,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Tax Billion-Dollar Endowments to Fund Community Colleges',
        description: 'Demand that wealthy private university endowments pay taxes to eliminate tuition at community colleges and trade apprenticeships.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 2.6, party_loyalty: 5, ethics_scrutiny: -3, national_approval: 2 },
        donor_promise: {
          promise_key: 'tax_endowments_free_community_college',
          promise_title: 'Tax Endowments Over $2B to Provide Tuition-Free Community College',
          donor_group: 'Working Students & Vocational Apprenticeship Coalition',
          donor_category: 'Education & Labor',
          statutory_category: 'justice',
          suggested_bill_title: 'Endowment Equity & Tuition-Free Community College Act',
          suggested_summary: 'Levies a 3% annual tax on private university endowments exceeding $2 billion and reallocates the proceeds to guarantee tuition-free public vocational and community college.',
          suggested_fiscal_impact: -18,
          public_support: 80,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Condition Endowment Exemptions on Tuition Freezes',
        description: 'Permit tax-free endowment growth only for universities that freeze undergraduate tuition and expand debt-free financial aid.',
        base_funds_multiplier: 1.15,
        political_effects: { polling_margin: 1.1, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'tuition_freeze_endowment_accord',
          promise_title: 'Tie Tax-Free Endowment Status to Guaranteed Undergraduate Tuition Freezes',
          donor_group: 'College Affordability & Higher Education Bridge',
          donor_category: 'Education Policy',
          statutory_category: 'justice',
          suggested_bill_title: 'Higher Education Tuition Stabilization & Endowment Accountability Act',
          suggested_summary: 'Maintains federal tax exemptions for university endowments strictly on the condition that institutions freeze undergraduate tuition for 5 years and spend at least 5% on need-based aid.',
          suggested_fiscal_impact: 8,
          public_support: 69,
          war_chest_reward_millions: 3.5,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 4.20,
        political_effects: { polling_margin: -2.4, party_loyalty: -3, ethics_scrutiny: 9, national_approval: -1 },
        donor_promise: {
          promise_key: 'bypass_environmental_reviews_mining',
          promise_title: '90-Day Permitting Shot-Clock for Domestic Lithium & Copper Mines',
          donor_group: 'Domestic Critical Minerals & Rare Earths Syndicate',
          donor_category: 'Mining & Strategic Materials',
          statutory_category: 'energy',
          suggested_bill_title: 'Sovereign Critical Minerals Emergency Extraction & Fast-Track Act',
          suggested_summary: 'Designates lithium, nickel, cobalt, and rare earth deposits as emergency defense assets, limiting NEPA judicial injunctions and mandating permit issuance within 90 days.',
          suggested_fiscal_impact: 18,
          public_support: 30,
          war_chest_reward_millions: 8.4,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Strict Tribal Consultation & Ecological Protections',
        description: 'Refuse to compromise groundwater standards or indigenous sovereignty for corporate mining extraction.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 2.5, party_loyalty: 4, ethics_scrutiny: -3, national_approval: 2 },
        donor_promise: {
          promise_key: 'tribal_consent_groundwater_protection',
          promise_title: 'Mandate Informed Tribal Consent & Strict Groundwater Baseline Testing',
          donor_group: 'Indigenous Environmental Sovereignty Coalition',
          donor_category: 'Environmental & Civil Rights',
          statutory_category: 'energy',
          suggested_bill_title: 'Clean Water & Indigenous Sacred Lands Protection Act',
          suggested_summary: 'Requires free, prior, and informed consent from sovereign tribal nations before any federal mining lease is granted and enforces strict criminal penalties for aquifer contamination.',
          suggested_fiscal_impact: 6,
          public_support: 78,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Prioritize Battery Recycling & Brownfield Site Redevelopment',
        description: 'Provide generous tax credits for recycling e-waste minerals while permitting new extraction strictly on disturbed industrial lands.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: 1.0, party_loyalty: 1, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'battery_recycling_brownfield_mining',
          promise_title: 'National Battery Mineral Recycling Mandate & Brownfield Mine Subsidies',
          donor_group: 'Circular Economy & Battery Materials Council',
          donor_category: 'Clean Technology',
          statutory_category: 'technology',
          suggested_bill_title: 'Circular Battery Materials Recycling & Brownfield Extraction Act',
          suggested_summary: 'Mandates 80% recycling recovery for retired EV lithium-ion batteries by Year 5 and grants accelerated depreciation for mineral recovery on abandoned historical industrial sites.',
          suggested_fiscal_impact: 22,
          public_support: 66,
          war_chest_reward_millions: 3.7,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 3.90,
        political_effects: { polling_margin: -2.0, party_loyalty: 0, ethics_scrutiny: 8, national_approval: -1 },
        donor_promise: {
          promise_key: 'protect_hospital_facility_fees',
          promise_title: 'Lock In Outpatient Hospital Facility Fees & Ban Site-Neutral Billing Cuts',
          donor_group: 'Hospital Systems & Emergency Healthcare Network',
          donor_category: 'Hospital Healthcare',
          statutory_category: 'healthcare',
          suggested_bill_title: 'Healthcare System Solvency & Outpatient Billing Safeguard Act',
          suggested_summary: 'Bars the Department of Health and Human Services from enacting site-neutral payment reductions for hospital-owned outpatient clinics and locks in annual inflation reimbursement adjustments.',
          suggested_fiscal_impact: 32,
          public_support: 31,
          war_chest_reward_millions: 8.0,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Ban Surprise Facility Fees & Enforce Site-Neutral Pricing',
        description: 'Insist that patients must not be gouged with separate facility fees for routine doctor visits and imaging tests.',
        base_funds_multiplier: 0.25,
        political_effects: { polling_margin: 3.2, party_loyalty: 5, ethics_scrutiny: -4, national_approval: 3 },
        donor_promise: {
          promise_key: 'ban_surprise_hospital_facility_fees',
          promise_title: 'Ban Outpatient Facility Fees & Enforce Transparent Site-Neutral Billing',
          donor_group: 'Patients Against Medical Debt & Surprise Bills',
          donor_category: 'Patient Advocacy',
          statutory_category: 'healthcare',
          suggested_bill_title: 'Medical Billing Transparency & Surprise Facility Fee Ban Act',
          suggested_summary: 'Outlaws hospital outpatient facility fees for routine clinical evaluations and enforces equal Medicare reimbursement rates regardless of whether care is delivered in an office or hospital.',
          suggested_fiscal_impact: -28,
          public_support: 84,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Direct Subsidies Solely for Rural Trauma & Safety-Net Centers',
        description: 'Eliminate fees at wealthy urban health conglomerates while establishing dedicated emergency grants for underserved rural clinics.',
        base_funds_multiplier: 1.20,
        political_effects: { polling_margin: 1.2, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 1 },
        donor_promise: {
          promise_key: 'rural_emergency_clinic_grant',
          promise_title: 'Targeted Federal Operating Grants for Vulnerable Rural Emergency Rooms',
          donor_group: 'Rural Health Association & Critical Access Hospitals',
          donor_category: 'Rural Healthcare',
          statutory_category: 'healthcare',
          suggested_bill_title: 'Rural Healthcare Solvency & Critical Access Emergency Clinic Act',
          suggested_summary: 'Eliminates facility billing abuses at urban mega-systems while establishing an emergency $12B federal stabilization fund directly for rural non-profit critical access hospitals.',
          suggested_fiscal_impact: 16,
          public_support: 70,
          war_chest_reward_millions: 3.6,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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
        base_funds_multiplier: 3.80,
        political_effects: { polling_margin: 0.5, party_loyalty: 1, ethics_scrutiny: 5, national_approval: 1 },
        donor_promise: {
          promise_key: 'smr_loan_guarantees_expedited_nrc',
          promise_title: '$25B Federal Loan Guarantees & Expedited 1-Year NRC SMR Licensing',
          donor_group: 'Advanced Nuclear & Baseload Energy Council',
          donor_category: 'Nuclear Energy',
          statutory_category: 'energy',
          suggested_bill_title: 'Advanced Nuclear Energy Renaissance & SMR Deployment Act',
          suggested_summary: 'Authorizes $25B in federal clean energy loan guarantees for Gen-IV small modular nuclear reactors and establishes an expedited one-year design certification pathway at the NRC.',
          suggested_fiscal_impact: 30,
          public_support: 48,
          war_chest_reward_millions: 7.5,
          is_controversial: true,
          controversy_level: 'divisive'
        }
      },
      {
        option_id: 'B',
        label: 'Focus Resources Purely on Solar, Wind & Storage',
        description: 'Argue that nuclear reactors are too expensive, suffer massive delays, and present unresolved radioactive waste challenges.',
        base_funds_multiplier: 0.30,
        political_effects: { polling_margin: 1.4, party_loyalty: 3, ethics_scrutiny: -2, national_approval: 1 },
        donor_promise: {
          promise_key: 'solar_wind_storage_priority',
          promise_title: 'Direct 100% of Clean Tech Loan Guarantees to Grid Batteries & Solar',
          donor_group: 'Renewable Power & Battery Storage Alliance',
          donor_category: 'Renewables',
          statutory_category: 'energy',
          suggested_bill_title: 'Renewable Storage Acceleration & Clean Battery Deployment Act',
          suggested_summary: 'Directs all federal clean energy loan funding into utility-scale lithium-iron-phosphate battery storage installations, rooftop community solar, and offshore wind arrays.',
          suggested_fiscal_impact: 22,
          public_support: 74,
          war_chest_reward_millions: 1.5,
          is_controversial: false,
          controversy_level: 'ethical'
        }
      },
      {
        option_id: 'C',
        label: 'Public-Private Demonstration Sites at Retired Coal Plants',
        description: 'Deploy advanced modular reactors specifically at retiring coal power plants to utilize existing electrical switchyards and transition coal workers.',
        base_funds_multiplier: 1.25,
        political_effects: { polling_margin: 1.3, party_loyalty: 2, ethics_scrutiny: 0, national_approval: 2 },
        donor_promise: {
          promise_key: 'coal_to_nuclear_transition_demonstration',
          promise_title: 'Deploy Advanced Modular SMR Reactors at Retired Coal Plant Switchyards',
          donor_group: 'Coal Community Economic Transition & Nuclear Coalition',
          donor_category: 'Energy & Regional Development',
          statutory_category: 'energy',
          suggested_bill_title: 'Coal Community Repurposing & Advanced SMR Nuclear Transition Act',
          suggested_summary: 'Funds public-private pilot projects repurposing retiring coal power plant electrical interconnections with molten-salt small modular reactors, guaranteeing jobs for former coal plant staff.',
          suggested_fiscal_impact: 25,
          public_support: 68,
          war_chest_reward_millions: 3.8,
          is_controversial: false,
          controversy_level: 'moderate'
        }
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

  // Office tier scale for bounties & funding scale
  const officeMultiplier = targetOfficeId === 'president' ? 8.0 : (targetOfficeId === 'senator' ? 3.0 : 1.0);
  const baseDollarPerQuestion = Math.max(0.60, (deficit / questionCount) * 0.95);

  // Shuffle and pick questions
  const shuffled = [...DONOR_QUESTION_BANK].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, questionCount);

  return selected.map((q, idx) => {
    return {
      ...q,
      question_number: idx + 1,
      total_questions: questionCount,
      choices: q.choices.map(c => {
        // High variance jitter (0.85 to 1.30) to create wide, non-uniform donation amounts
        const jitter = 0.85 + Math.random() * 0.45;
        const scaledFunds = Number((c.base_funds_multiplier * baseDollarPerQuestion * jitter).toFixed(2));
        
        let scaledPromise = null;
        if (c.donor_promise) {
          const rewardBase = c.donor_promise.war_chest_reward_millions || 2.0;
          scaledPromise = {
            ...c.donor_promise,
            war_chest_reward_millions: Number((rewardBase * officeMultiplier * (c.donor_promise.is_controversial ? 2.0 : 1.0)).toFixed(2))
          };
        }

        return {
          ...c,
          funds_raised_millions: scaledFunds,
          donor_promise: scaledPromise
        };
      })
    };
  });
}

// ============================================================================
// MAJOR NATIONAL ISSUES (Social, Geopolitical, Economic, National Political)
// ============================================================================
const MAJOR_NATIONAL_ISSUES = [
  // --- SOCIAL ISSUES ---
  {
    id: 'issue_universal_healthcare',
    category: 'social',
    title: 'Universal Healthcare & Prescription Cost Caps',
    description: 'National debate over federal prescription drug price caps, hospital staffing mandates, and universal health insurance coverage.',
    salience: 86,
    trend: 'surging',
    attribute_type: 'standard',
    public_sentiment: 'reformist',
    caucus_stances: {
      progressive_caucus: 'champion',
      socialist_campaign_group: 'champion',
      green_reform_caucus: 'champion',
      one_nation_moderates: 'compromise',
      problem_solvers: 'compromise',
      freedom_faction: 'oppose',
      free_enterprise_group: 'oppose'
    }
  },
  {
    id: 'issue_housing_affordability',
    category: 'social',
    title: 'Housing Supply, Rent Caps & Zoning Deregulation',
    description: 'Severe urban housing shortages, escalating rent burdens, municipal NIMBY zoning preemption, and tenant eviction protections.',
    salience: 82,
    trend: 'surging',
    attribute_type: 'standard',
    public_sentiment: 'divided',
    caucus_stances: {
      progressive_caucus: 'champion',
      socialist_campaign_group: 'champion',
      main_street_bloc: 'compromise',
      problem_solvers: 'compromise',
      freedom_faction: 'oppose',
      free_enterprise_group: 'oppose'
    }
  },
  {
    id: 'issue_civil_liberties_privacy',
    category: 'social',
    title: 'Digital Privacy, Biometrics & AI Surveillance Limits',
    description: 'Federal standards protecting citizen biometric data, limiting commercial algorithm surveillance, and shielding end-to-end encryption.',
    salience: 72,
    trend: 'stable',
    attribute_type: 'standard',
    public_sentiment: 'reformist',
    caucus_stances: {
      green_reform_caucus: 'champion',
      progressive_caucus: 'champion',
      freedom_faction: 'champion',
      problem_solvers: 'compromise'
    }
  },
  {
    id: 'issue_education_student_debt',
    category: 'social',
    title: 'Higher Education Affordability & Technical Apprenticeships',
    description: 'Reforming federal student loan interest, subsidizing community college tuition, and expanding union trade apprenticeship pipelines.',
    salience: 68,
    trend: 'stable',
    attribute_type: 'standard',
    public_sentiment: 'divided',
    caucus_stances: {
      progressive_caucus: 'champion',
      socialist_campaign_group: 'champion',
      rust_belt_alliance: 'compromise',
      regional_devolution_bloc: 'champion',
      freedom_faction: 'oppose'
    }
  },

  // --- GEOPOLITICAL ISSUES ---
  {
    id: 'issue_strategic_trade_tariffs',
    category: 'geopolitical',
    title: 'Strategic Import Tariffs & Supply-Chain Independence',
    description: 'Defending sovereign manufacturing with reciprocal steel/semiconductor tariffs against foreign state dumping vs consumer price risks.',
    salience: 84,
    trend: 'surging',
    attribute_type: 'standard',
    public_sentiment: 'divided',
    caucus_stances: {
      rust_belt_alliance: 'champion',
      regional_devolution_bloc: 'champion',
      freedom_faction: 'compromise',
      problem_solvers: 'compromise',
      free_enterprise_group: 'oppose'
    }
  },
  {
    id: 'issue_mutual_defense_alliances',
    category: 'geopolitical',
    title: 'Sovereign Mutual Defense Treaties & Military Aid',
    description: 'Appropriating resources for foreign democratic defense pacts, strategic deterrence, and overseas military replenishment.',
    salience: 77,
    trend: 'stable',
    attribute_type: 'standard',
    public_sentiment: 'conservative',
    caucus_stances: {
      one_nation_moderates: 'champion',
      problem_solvers: 'champion',
      freedom_faction: 'divided',
      progressive_caucus: 'oppose',
      socialist_campaign_group: 'oppose'
    }
  },
  {
    id: 'issue_carbon_border_accords',
    category: 'geopolitical',
    title: 'International Climate Accords & Carbon Border Taxes',
    description: 'Levying cross-border carbon border tariffs on high-emissions imports while subsidizing domestic clean manufacturing exports.',
    salience: 74,
    trend: 'cooling',
    attribute_type: 'standard',
    public_sentiment: 'reformist',
    caucus_stances: {
      green_reform_caucus: 'champion',
      progressive_caucus: 'champion',
      one_nation_moderates: 'compromise',
      freedom_faction: 'oppose',
      free_enterprise_group: 'oppose'
    }
  },
  {
    id: 'issue_cyber_defense_intelligence',
    category: 'geopolitical',
    title: 'Critical Infrastructure Cyber Defense & Surveillance Warrants',
    description: 'Hardening electrical grids and banking networks against foreign hostile cyber incursions while mandating judicial oversight on surveillance.',
    salience: 69,
    trend: 'stable',
    attribute_type: 'standard',
    public_sentiment: 'reformist',
    caucus_stances: {
      problem_solvers: 'champion',
      one_nation_moderates: 'champion',
      green_reform_caucus: 'compromise'
    }
  },

  // --- ECONOMIC ISSUES ---
  {
    id: 'issue_central_bank_autonomy',
    category: 'economic',
    title: 'Central Bank Autonomy & Interest Rate Pressure',
    description: 'Political friction between monetary tightening by the Central Bank to crush inflation versus parliamentary demands for borrowing relief.',
    salience: 89,
    trend: 'surging',
    attribute_type: 'standard',
    public_sentiment: 'divided',
    caucus_stances: {
      free_enterprise_group: 'champion',
      one_nation_moderates: 'champion',
      problem_solvers: 'champion',
      progressive_caucus: 'oppose',
      freedom_faction: 'oppose'
    }
  },
  {
    id: 'issue_corporate_tax_wealth',
    category: 'economic',
    title: 'Corporate Minimum Taxes & Progressive Wealth Levies',
    description: 'Closing offshore corporate profit shelters, enacting a billionaire minimum tax, versus competitive corporate tax relief.',
    salience: 81,
    trend: 'surging',
    attribute_type: 'standard',
    public_sentiment: 'reformist',
    caucus_stances: {
      progressive_caucus: 'champion',
      socialist_campaign_group: 'champion',
      freedom_faction: 'oppose',
      free_enterprise_group: 'oppose',
      problem_solvers: 'compromise'
    }
  },
  {
    id: 'issue_energy_grid_nuclear',
    category: 'economic',
    title: 'Energy Grid Modernization, Pipeline & Nuclear Permitting',
    description: 'Fast-tracking environmental approvals for next-generation nuclear reactors, interstate transmission lines, and domestic energy terminals.',
    salience: 79,
    trend: 'surging',
    attribute_type: 'standard',
    public_sentiment: 'divided',
    caucus_stances: {
      freedom_faction: 'champion',
      problem_solvers: 'champion',
      rust_belt_alliance: 'champion',
      green_reform_caucus: 'compromise',
      progressive_caucus: 'oppose'
    }
  },
  {
    id: 'issue_small_business_banking',
    category: 'economic',
    title: 'Community Banking Lending & Anti-Monopoly Enforcement',
    description: 'Protecting regional credit unions and independent businesses from mega-bank consolidation and predatory interchange processing fees.',
    salience: 66,
    trend: 'stable',
    attribute_type: 'standard',
    public_sentiment: 'reformist',
    caucus_stances: {
      main_street_bloc: 'champion',
      rust_belt_alliance: 'champion',
      progressive_caucus: 'champion',
      free_enterprise_group: 'compromise'
    }
  },

  // --- NATIONAL POLITICAL ISSUES (Corruptions, Scandals & Positive Virtues) ---
  {
    id: 'issue_dark_money_campaign_finance',
    category: 'national_political',
    title: 'Dark Money PACs & Campaign Finance Integrity',
    description: 'Public outcry over hundreds of millions in untraceable special-interest donations distorting elections and legislative floor votes.',
    salience: 85,
    trend: 'surging',
    attribute_type: 'corruption_concern',
    public_sentiment: 'reformist',
    caucus_stances: {
      progressive_caucus: 'champion',
      green_reform_caucus: 'champion',
      main_street_bloc: 'compromise',
      problem_solvers: 'compromise',
      freedom_faction: 'oppose'
    }
  },
  {
    id: 'issue_revolving_door_lobbying',
    category: 'national_political',
    title: 'Revolving-Door K-Street Lobbying Bans & Ethics Audits',
    description: 'Scandals over former legislative committee chairs taking lucrative multi-million-dollar lobbying posts for industries they previously regulated.',
    salience: 80,
    trend: 'surging',
    attribute_type: 'scandal_risk',
    public_sentiment: 'reformist',
    caucus_stances: {
      green_reform_caucus: 'champion',
      socialist_campaign_group: 'champion',
      progressive_caucus: 'champion',
      one_nation_moderates: 'compromise',
      freedom_faction: 'compromise'
    }
  },
  {
    id: 'issue_insider_trading_legislators',
    category: 'national_political',
    title: 'Lawmaker Stock Trading Scandals & Blind Trust Mandates',
    description: 'Investigation into congressional leaders trading single-company equities directly impacted by closed-door committee briefings.',
    salience: 76,
    trend: 'surging',
    attribute_type: 'scandal_risk',
    public_sentiment: 'reformist',
    caucus_stances: {
      progressive_caucus: 'champion',
      green_reform_caucus: 'champion',
      problem_solvers: 'champion',
      freedom_faction: 'compromise'
    }
  },
  {
    id: 'issue_civic_trust_election_integrity',
    category: 'national_political',
    title: 'Civic Trust, Transparent Audits & Whistleblower Shields',
    description: 'Preserving independent electoral commissions, transparent paper-trail verifications, and strong civil service protections against political retaliation.',
    salience: 75,
    trend: 'stable',
    attribute_type: 'civic_strength',
    public_sentiment: 'conservative',
    caucus_stances: {
      one_nation_moderates: 'champion',
      problem_solvers: 'champion',
      green_reform_caucus: 'champion',
      socialist_campaign_group: 'champion',
      freedom_faction: 'compromise'
    }
  }
];

// ============================================================================
// 7-QUESTION POLITICAL ALIGNMENT QUIZ (Categorical & Colored Indicators Only)
// ============================================================================
const POLITICAL_ALIGNMENT_QUIZ = [
  {
    id: 'q1_fiscal_taxation',
    number: 1,
    category: 'Fiscal & Taxation',
    title: 'National Revenue & Budget Priorities',
    prompt: 'With federal budget obligations and sovereign debt commanding floor debates, how should statutory tax and spending policy be structured?',
    options: [
      {
        id: 'opt_prog',
        label: 'Progressive Wealth Levies & Universal Public Services',
        description: 'Impose targeted surcharges on ultra-wealthy individuals and corporations to fully fund national infrastructure, public healthcare, and free college tuition.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'National App', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'favorable' },
          { category: 'Donor PACs', direction: 'unfavorable' }
        ],
        caucus_scores: {
          progressive_caucus: 5,
          socialist_campaign_group: 5,
          green_reform_caucus: 3,
          rust_belt_alliance: 2
        }
      },
      {
        id: 'opt_conserv',
        label: 'Statutory Deficit Cap & Corporate Deregulation',
        description: 'Enact an enforceable constitutional spending brake, lower corporate tax rates to stimulate business hiring, and repeal capital gains surtaxes.',
        indicators: [
          { category: 'District App', direction: 'neutral' },
          { category: 'National App', direction: 'neutral' },
          { category: 'War Chest', direction: 'favorable' },
          { category: 'Ethics Scrutiny', direction: 'neutral' }
        ],
        caucus_scores: {
          freedom_faction: 5,
          free_enterprise_group: 5,
          main_street_bloc: 2
        }
      },
      {
        id: 'opt_centrist',
        label: 'Bipartisan Deficit Stabilization & Infrastructure Bonds',
        description: 'Close corporate tax loopholes, preserve social safety net solvency with means-tested adjustments, and co-finance regional infrastructure projects.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'favorable' },
          { category: 'Coalition', direction: 'favorable' },
          { category: 'Ethics Scrutiny', direction: 'favorable' }
        ],
        caucus_scores: {
          problem_solvers: 5,
          one_nation_moderates: 5,
          main_street_bloc: 2
        }
      },
      {
        id: 'opt_industrial',
        label: 'Strategic Import Tariffs & Domestic Factory Credits',
        description: 'Impose aggressive reciprocal tariffs on foreign subsidized imports to directly fund tax credits for domestic manufacturing factories and worker pay.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'National App', direction: 'neutral' },
          { category: 'Whip Loyalty', direction: 'neutral' }
        ],
        caucus_scores: {
          rust_belt_alliance: 5,
          regional_devolution_bloc: 5,
          main_street_bloc: 2
        }
      }
    ]
  },
  {
    id: 'q2_healthcare_safety',
    number: 2,
    category: 'Healthcare & Social Safety Net',
    title: 'Healthcare Architecture & Drug Pricing',
    prompt: 'Rising healthcare premiums and prescription costs strain household budgets. What is your fundamental vision for national healthcare delivery?',
    options: [
      {
        id: 'opt_single_payer',
        label: 'Universal Public Healthcare & Government Drug Negotiations',
        description: 'Establish a universal public health insurance guarantee, cap prescription drug costs at manufacturing parity, and mandate hospital nurse staffing minimums.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'National App', direction: 'favorable' },
          { category: 'Donor PACs', direction: 'unfavorable' }
        ],
        caucus_scores: {
          progressive_caucus: 5,
          socialist_campaign_group: 5,
          green_reform_caucus: 3
        }
      },
      {
        id: 'opt_market_health',
        label: 'Health Savings Accounts & Interstate Insurance Markets',
        description: 'Promote consumer choice by deregulating interstate insurance sales, expanding tax-free health savings accounts, and protecting pharmaceutical patent exclusivity.',
        indicators: [
          { category: 'War Chest', direction: 'favorable' },
          { category: 'District App', direction: 'neutral' },
          { category: 'National App', direction: 'neutral' }
        ],
        caucus_scores: {
          freedom_faction: 5,
          free_enterprise_group: 5
        }
      },
      {
        id: 'opt_public_private',
        label: 'Strengthen Public Clinics & Private Reinsurance Subsidies',
        description: 'Fund 25 regional community care clinics to reduce emergency room wait times, while subsidizing private insurer reinsurance pools to contain monthly premiums.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'favorable' },
          { category: 'Coalition', direction: 'favorable' }
        ],
        caucus_scores: {
          problem_solvers: 5,
          one_nation_moderates: 5,
          main_street_bloc: 2
        }
      },
      {
        id: 'opt_community_health',
        label: 'Small Enterprise Health Purchasing Alliances',
        description: 'Allow independent small businesses and agricultural cooperatives to band together across county lines to negotiate group healthcare rates without Wall Street fees.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'National App', direction: 'neutral' }
        ],
        caucus_scores: {
          main_street_bloc: 5,
          regional_devolution_bloc: 4,
          rust_belt_alliance: 2
        }
      }
    ]
  },
  {
    id: 'q3_energy_climate',
    number: 3,
    category: 'Energy & Climate Transition',
    title: 'Energy Independence & Climate Policy',
    prompt: 'How should statutory policy navigate the balance between fossil fuel domestic supplies, nuclear power, and green renewable transitions?',
    options: [
      {
        id: 'opt_green_transition',
        label: 'Rapid Renewable Shift & Strict Emissions Caps',
        description: 'Mandate zero-emission power grid standards by statutory timeline, end all oil and gas leasing subsidies, and levy carbon fees on major polluters.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Ethics Scrutiny', direction: 'favorable' },
          { category: 'Donor PACs', direction: 'unfavorable' }
        ],
        caucus_scores: {
          green_reform_caucus: 5,
          progressive_caucus: 5,
          socialist_campaign_group: 3
        }
      },
      {
        id: 'opt_energy_drilling',
        label: 'Expedited Fossil Extraction & NEPA Deregulation',
        description: 'Unleash domestic energy drilling on sovereign lands, curtail judicial environmental review delays for interstate pipelines, and export liquefied natural gas.',
        indicators: [
          { category: 'War Chest', direction: 'favorable' },
          { category: 'District App', direction: 'neutral' },
          { category: 'Ethics Scrutiny', direction: 'alert' }
        ],
        caucus_scores: {
          freedom_faction: 5,
          free_enterprise_group: 5
        }
      },
      {
        id: 'opt_all_above_nuclear',
        label: 'All-of-the-Above: Advanced Nuclear & Hydrogen Co-Investment',
        description: 'Deploy federal loan guarantees to construct small modular nuclear reactors, expand regional clean hydrogen hubs, and modernize grid transmission reliability.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'favorable' },
          { category: 'Coalition', direction: 'favorable' }
        ],
        caucus_scores: {
          problem_solvers: 5,
          one_nation_moderates: 5,
          rust_belt_alliance: 3
        }
      },
      {
        id: 'opt_industrial_baseload',
        label: 'Protect Energy Worker Wages & Heavy Metallurgy Grants',
        description: 'Safeguard union baseload coal/gas power plants with federal carbon-capture retrofit grants, preventing industrial factory shutdowns and blackouts.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'National App', direction: 'neutral' }
        ],
        caucus_scores: {
          rust_belt_alliance: 5,
          regional_devolution_bloc: 4
        }
      }
    ]
  },
  {
    id: 'q4_labor_wages',
    number: 4,
    category: 'Labor & Economic Rights',
    title: 'Workplace Protections & Minimum Wage',
    prompt: 'What stance should national legislation take on union collective bargaining rights, corporate wage boards, and statutory minimum earnings?',
    options: [
      {
        id: 'opt_union_rights',
        label: 'National Living Wage Mandate & Worker Board Seats',
        description: 'Index the federal minimum wage directly to real living costs, ban anti-union captive audience meetings, and guarantee worker representation on corporate boards.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'National App', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'favorable' }
        ],
        caucus_scores: {
          progressive_caucus: 5,
          socialist_campaign_group: 5,
          rust_belt_alliance: 3
        }
      },
      {
        id: 'opt_right_to_work',
        label: 'Right-to-Work Protections & Flexible Employment Contracts',
        description: 'Protect employee choice by shielding voluntary union membership laws, reducing employer overtime litigation, and supporting independent gig contractor freedom.',
        indicators: [
          { category: 'War Chest', direction: 'favorable' },
          { category: 'District App', direction: 'neutral' }
        ],
        caucus_scores: {
          freedom_faction: 5,
          free_enterprise_group: 5
        }
      },
      {
        id: 'opt_regional_wages',
        label: 'Regional Cost-of-Living Pegs & Skilled Apprenticeships',
        description: 'Establish regional minimum wage tiers that reflect rural vs metropolitan living costs, paired with federal matching tax credits for technical apprenticeships.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Coalition', direction: 'favorable' }
        ],
        caucus_scores: {
          problem_solvers: 5,
          one_nation_moderates: 5,
          main_street_bloc: 3
        }
      },
      {
        id: 'opt_domestic_labor',
        label: 'Buy-Domestic Labor Enforcement & Strike Protections',
        description: 'Disqualify companies that offshore manufacturing from receiving federal contracts, while protecting union strike funds and prevailing wage mandates.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'favorable' }
        ],
        caucus_scores: {
          rust_belt_alliance: 5,
          regional_devolution_bloc: 5
        }
      }
    ]
  },
  {
    id: 'q5_trade_globalization',
    number: 5,
    category: 'Trade & Foreign Commerce',
    title: 'International Trade Pacts & Tariff Policy',
    prompt: 'How should the sovereign government approach multilateral trade treaties, foreign manufacturing competition, and protective import duties?',
    options: [
      {
        id: 'opt_fair_trade',
        label: 'Fair Trade Accords with Binding Labor & Climate Standards',
        description: 'Condition all bilateral trade access on strict compliance with international human rights, collective bargaining rights, and binding carbon reductions.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Ethics Scrutiny', direction: 'favorable' }
        ],
        caucus_scores: {
          green_reform_caucus: 5,
          progressive_caucus: 4,
          socialist_campaign_group: 4
        }
      },
      {
        id: 'opt_free_markets',
        label: 'Unilateral Free Trade & Elimination of Protective Duties',
        description: 'Eliminate punitive import tariffs and agricultural quotas to reduce consumer prices and open overseas markets for high-value sovereign exports.',
        indicators: [
          { category: 'War Chest', direction: 'favorable' },
          { category: 'District App', direction: 'neutral' }
        ],
        caucus_scores: {
          free_enterprise_group: 5,
          freedom_faction: 4
        }
      },
      {
        id: 'opt_friend_shoring',
        label: 'Allied Supply-Chain Rebalancing & Semiconductor Security',
        description: 'Negotiate high-standard trade compacts with allied democratic nations while subsidizing critical semiconductor fabrication and pharmaceutical raw materials.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Coalition', direction: 'favorable' }
        ],
        caucus_scores: {
          problem_solvers: 5,
          one_nation_moderates: 5
        }
      },
      {
        id: 'opt_protectionism',
        label: 'Punitive Reciprocal Tariffs & Industrial Sourcing Mandates',
        description: 'Impose steep 25%+ tariffs on imported steel, vehicles, and manufactured goods to revive sovereign factories and halt industrial de-industrialization.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'National App', direction: 'neutral' }
        ],
        caucus_scores: {
          rust_belt_alliance: 5,
          regional_devolution_bloc: 5
        }
      }
    ]
  },
  {
    id: 'q6_ethics_campaign_finance',
    number: 6,
    category: 'Ethics & Anti-Corruption',
    title: 'Campaign Finance, Lobbying Bans & Institutional Integrity',
    prompt: 'Special-interest lobbying and campaign contributions dominate national politics. How aggressively should ethics and lobbying laws be enforced?',
    options: [
      {
        id: 'opt_ban_pacs',
        label: 'Ban Corporate Super PACs & Create Anti-Graft Commission',
        description: 'Outlaw dark money campaign donations, enact a lifetime lobbying ban for former lawmakers, and empower a non-partisan investigative anti-graft commission.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'National App', direction: 'favorable' },
          { category: 'Ethics Scrutiny', direction: 'favorable' },
          { category: 'Donor PACs', direction: 'unfavorable' }
        ],
        caucus_scores: {
          green_reform_caucus: 5,
          progressive_caucus: 5,
          socialist_campaign_group: 4
        }
      },
      {
        id: 'opt_free_speech',
        label: 'Protect Donor Speech & Eliminate Campaign Expenditure Caps',
        description: 'Defend political donations as constitutionally protected speech, oppose federal speech bureaucracies, and allow grassroots donors and businesses to advocate freely.',
        indicators: [
          { category: 'War Chest', direction: 'favorable' },
          { category: 'Ethics Scrutiny', direction: 'neutral' }
        ],
        caucus_scores: {
          freedom_faction: 5,
          free_enterprise_group: 5
        }
      },
      {
        id: 'opt_realtime_transparency',
        label: 'Real-Time Digital Disclosure & Strict Conflict Audits',
        description: 'Require instant 48-hour online disclosure of all campaign gifts, mandate independent blind trusts for lawmakers, and strengthen parliamentary ethics committees.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Coalition', direction: 'favorable' }
        ],
        caucus_scores: {
          problem_solvers: 5,
          one_nation_moderates: 5
        }
      },
      {
        id: 'opt_main_street_integrity',
        label: 'Level the Playing Field Against Wall Street Mega-Lobbies',
        description: 'Place strict caps on high-dollar corporate K-Street lobbying expenses so community merchants, farmers, and regional civic groups cannot be silenced.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'Ethics Scrutiny', direction: 'favorable' }
        ],
        caucus_scores: {
          main_street_bloc: 5,
          regional_devolution_bloc: 4
        }
      }
    ]
  },
  {
    id: 'q7_governing_philosophy',
    number: 7,
    category: 'Legislative Philosophy',
    title: 'Governing Strategy & Floor Coalition Building',
    prompt: 'When deciding how to navigate committee markups, contentious floor votes, and backroom negotiations, what is your core operational approach?',
    options: [
      {
        id: 'opt_disruptor',
        label: 'Uncompromising Advocacy for Working Families',
        description: 'Stand resolute against backroom corporate compromises, using committee microphones and public town halls to mobilize popular pressure on party leadership.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'neutral' },
          { category: 'National App', direction: 'favorable' }
        ],
        caucus_scores: {
          progressive_caucus: 5,
          socialist_campaign_group: 5
        }
      },
      {
        id: 'opt_constitutionalist',
        label: 'Strict Constitutional Restraint & Individual Freedom',
        description: 'Hold the line against federal overreach, voting against omnibus spending measures and administrative expansions regardless of party whip pressure.',
        indicators: [
          { category: 'Whip Loyalty', direction: 'neutral' },
          { category: 'War Chest', direction: 'favorable' }
        ],
        caucus_scores: {
          freedom_faction: 5,
          free_enterprise_group: 5
        }
      },
      {
        id: 'opt_pragmatist',
        label: 'Bipartisan Coalition Builder & Pragmatic Dealmaker',
        description: 'Engage constructively across the aisle to assemble durable 60% floor majorities, believing that partial progress is vastly superior to perpetual partisan gridlock.',
        indicators: [
          { category: 'National App', direction: 'favorable' },
          { category: 'Coalition', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'favorable' }
        ],
        caucus_scores: {
          problem_solvers: 5,
          one_nation_moderates: 5
        }
      },
      {
        id: 'opt_local_champion',
        label: 'Constituency-First Industrial Realist',
        description: 'Judge every statute solely by how many dollars, jobs, and infrastructure assets it secures for your home frontline district and its industrial workforce.',
        indicators: [
          { category: 'District App', direction: 'favorable' },
          { category: 'Whip Loyalty', direction: 'favorable' }
        ],
        caucus_scores: {
          rust_belt_alliance: 5,
          regional_devolution_bloc: 5,
          main_street_bloc: 3
        }
      }
    ]
  }
];

// Evaluate alignment quiz and determine which caucus the player should lead
function evaluateQuizAlignment(answers = {}, systemType = 'bicameral') {
  const isUnicameral = isUnicameralSystem(systemType);
  const caucuses = isUnicameral ? PARLIAMENTARY_CAUCUSES : CONGRESSIONAL_CAUCUSES;
  
  // Initialize tally
  const tally = {};
  caucuses.forEach(c => { tally[c.id] = 0; });

  POLITICAL_ALIGNMENT_QUIZ.forEach(q => {
    const selectedOptId = answers[q.id];
    if (selectedOptId) {
      const opt = q.options.find(o => o.id === selectedOptId);
      if (opt && opt.caucus_scores) {
        Object.entries(opt.caucus_scores).forEach(([caucusId, pts]) => {
          if (tally[caucusId] !== undefined) {
            tally[caucusId] += pts;
          }
        });
      }
    }
  });

  // Find winning caucus
  let bestCaucus = caucuses[0];
  let maxScore = -1;

  caucuses.forEach(c => {
    const score = tally[c.id] || 0;
    if (score > maxScore) {
      maxScore = score;
      bestCaucus = c;
    }
  });

  return {
    assigned_caucus_id: bestCaucus.id,
    assigned_caucus_name: bestCaucus.name,
    assigned_caucus_ideology: bestCaucus.ideology,
    assigned_caucus_member_count: bestCaucus.member_count,
    original_leader: bestCaucus.leader,
    player_title: isUnicameral ? 'Parliamentary Faction Chair' : 'Caucus Chair',
    scores: tally,
    alignment_summary: `Your policy answers align most closely with the ${bestCaucus.name} (${bestCaucus.ideology}). As its newly elected leader, you command the locked floor votes of its ${bestCaucus.member_count} lawmakers.`
  };
}

// ============================================================================
// ROBUST LOBBYING INDUSTRY OF TRADE GROUPS (Contributions for Legislative Favors)
// ============================================================================
const TRADE_LOBBYING_GROUPS = [
  {
    id: 'lobby_banking_markets',
    trade_group: 'Aurelian Financial Markets & Banking League',
    sector: 'Banking, Wall Street & FinTech',
    chief_lobbyist: 'Harrison Sterling',
    favor_title: 'Exempt Regional Banks from Federal Liquidity Stress Tests',
    favor_description: 'Insert a statutory amendment into the upcoming banking code exempting mid-tier community and regional lenders from stringent Tier-1 capital stress tests and liquidity reserves.',
    statutory_category: 'banking',
    suggested_bill_title: 'Regional Banking Liquidity & Capital Growth Act',
    suggested_bill_summary: 'Raises the asset threshold for federal bank stress testing and broadens municipal bond eligibility for statutory liquidity reserves.',
    suggested_fiscal_impact: 4.5,
    base_contribution: 3.5,
    base_bounty: 18.0,
    ethics_risk_level: 'medium',
    indicators: [
      { category: 'Campaign War Chest', direction: 'favorable' },
      { category: 'Ethics Scrutiny', direction: 'alert' },
      { category: 'District App', direction: 'unfavorable' },
      { category: 'National App', direction: 'unfavorable' }
    ]
  },
  {
    id: 'lobby_manufacturers_metallurgy',
    trade_group: 'National Association of Manufacturers & Heavy Metallurgy Guild',
    sector: 'Manufacturing, Steel & Heavy Industry',
    chief_lobbyist: 'Col. Bradley Stone (Ret.)',
    favor_title: 'Mandate 100% Domestic Steel on Civil Infrastructure Works',
    favor_description: 'Legislate a strict "Buy Sovereign" procurement mandate requiring all federally subsidized bridges, rails, and pipelines to utilize domestically smelted steel and aluminum.',
    statutory_category: 'trade',
    suggested_bill_title: 'National Strategic Metallurgy & Domestic Procurement Act',
    suggested_bill_summary: 'Enforces 100% domestic iron, steel, and aluminum sourcing on all federal civil construction works and establishes capital expensing for blast furnace retrofits.',
    suggested_fiscal_impact: 8.0,
    base_contribution: 2.8,
    base_bounty: 14.0,
    ethics_risk_level: 'low',
    indicators: [
      { category: 'Campaign War Chest', direction: 'favorable' },
      { category: 'District App', direction: 'favorable' },
      { category: 'National App', direction: 'favorable' },
      { category: 'Ethics Scrutiny', direction: 'neutral' }
    ]
  },
  {
    id: 'lobby_pharma_biotech',
    trade_group: 'Biomedical Innovation & Pharmaceutical Research Alliance (PhRMA)',
    sector: 'Pharmaceuticals & Biotechnology',
    chief_lobbyist: 'Dr. Genevieve Vance-Caine',
    favor_title: 'Block Government Price Negotiation on Biologic Therapies',
    favor_description: 'Sponsor a statutory rider preserving 12-year patent exclusivity periods for biologic therapies and prohibiting state health ministries from establishing reference-based price ceilings.',
    statutory_category: 'healthcare',
    suggested_bill_title: 'Biomedical Discovery Preservation & Patent Certainty Act',
    suggested_bill_summary: 'Shields advanced biologic and gene therapies from government price controls while establishing federal research tax credits for rare disease clinical trials.',
    suggested_fiscal_impact: 6.2,
    base_contribution: 4.8,
    base_bounty: 24.0,
    ethics_risk_level: 'toxic',
    indicators: [
      { category: 'Campaign War Chest', direction: 'favorable' },
      { category: 'Ethics Scrutiny', direction: 'alert' },
      { category: 'District App', direction: 'unfavorable' },
      { category: 'National App', direction: 'unfavorable' }
    ]
  },
  {
    id: 'lobby_clean_energy',
    trade_group: 'Clean Tech Transition & Solar Developers League',
    sector: 'Clean Energy & Power Infrastructure',
    chief_lobbyist: 'Maya Chen',
    favor_title: 'Expand Federal Solar Tax Credits & Expedite Grid Corridors',
    favor_description: 'Authorize a permanent 30% investment tax credit for commercial battery storage and designate priority federal transmission corridors to connect remote solar arrays to major metropolitan grids.',
    statutory_category: 'energy',
    suggested_bill_title: 'Interstate Clean Energy Transmission & Grid Resiliency Act',
    suggested_bill_summary: 'Directs federal matching grants for regional battery storage microgrids and streamlines environmental permits for interstate high-voltage transmission lines.',
    suggested_fiscal_impact: 13.5,
    base_contribution: 2.2,
    base_bounty: 11.0,
    ethics_risk_level: 'low',
    indicators: [
      { category: 'Campaign War Chest', direction: 'favorable' },
      { category: 'National App', direction: 'favorable' },
      { category: 'District App', direction: 'favorable' },
      { category: 'Ethics Scrutiny', direction: 'favorable' }
    ]
  },
  {
    id: 'lobby_agribusiness_grain',
    trade_group: 'American Agribusiness & Crop Shippers Federation',
    sector: 'Agriculture, Livestock & Biofuels',
    chief_lobbyist: 'Garrison Holt',
    favor_title: 'Increase Biofuel Blending Mandates & Federal Crop Reinsurance',
    favor_description: 'Mandate a 15% minimum ethanol blending requirement across commercial motor fuels and expand taxpayer-funded premium subsidies for catastrophic crop reinsurance programs.',
    statutory_category: 'agriculture',
    suggested_bill_title: 'National Farm Resiliency & Biofuel Energy Security Act',
    suggested_bill_summary: 'Enhances federal crop reinsurance coverage thresholds for drought losses and raises commercial renewable fuel standard blending requirements.',
    suggested_fiscal_impact: 5.5,
    base_contribution: 2.4,
    base_bounty: 12.0,
    ethics_risk_level: 'medium',
    indicators: [
      { category: 'Campaign War Chest', direction: 'favorable' },
      { category: 'District App', direction: 'favorable' },
      { category: 'Ethics Scrutiny', direction: 'alert' }
    ]
  },
  {
    id: 'lobby_big_tech_ai',
    trade_group: 'Frontier Artificial Intelligence & Cloud Consortium',
    sector: 'Technology, Silicon Valley & AI Compute',
    chief_lobbyist: 'Julian Croft',
    favor_title: 'Federal Preemption of State AI Audits & Supercomputer Credits',
    favor_description: 'Preempt a patchwork of state-level artificial intelligence algorithmic auditing laws in favor of a uniform voluntary federal disclosure framework, paired with tax credits for data center energy purchases.',
    statutory_category: 'technology',
    suggested_bill_title: 'National AI Innovation & Federal Regulatory Uniformity Act',
    suggested_bill_summary: 'Establishes a uniform federal standards framework for advanced frontier AI models, preempting divergent state statutes, and grants energy expensing for data centers.',
    suggested_fiscal_impact: 7.0,
    base_contribution: 4.5,
    base_bounty: 22.0,
    ethics_risk_level: 'high',
    indicators: [
      { category: 'Campaign War Chest', direction: 'favorable' },
      { category: 'Ethics Scrutiny', direction: 'alert' },
      { category: 'National App', direction: 'unfavorable' }
    ]
  },
  {
    id: 'lobby_commercial_realtors',
    trade_group: 'Commercial Realtors & Land Developers Coalition',
    sector: 'Real Estate, Construction & Housing Finance',
    chief_lobbyist: 'Devon Brooks',
    favor_title: 'Withhold Federal Transit Funds from Restrictive Zoning Cities',
    favor_description: 'Tie municipal federal highway and transit capital grants directly to the elimination of local single-family zoning restrictions, while permanently shielding commercial like-kind property exchange tax deferrals.',
    statutory_category: 'housing',
    suggested_bill_title: 'Federal Housing Supply Expansion & Municipal Zoning Reform Act',
    suggested_bill_summary: 'Withholds federal transit discretionary funds from municipalities with exclusionary density caps and extends capital gains deferrals on commercial housing redevelopments.',
    suggested_fiscal_impact: 9.0,
    base_contribution: 3.2,
    base_bounty: 15.0,
    ethics_risk_level: 'medium',
    indicators: [
      { category: 'Campaign War Chest', direction: 'favorable' },
      { category: 'Ethics Scrutiny', direction: 'alert' },
      { category: 'District App', direction: 'neutral' },
      { category: 'National App', direction: 'favorable' }
    ]
  },
  {
    id: 'lobby_public_unions',
    trade_group: 'United Federation of Healthcare & Public Labor Unions',
    sector: 'Public Sector Labor, Nursing & Education',
    chief_lobbyist: 'Maria Santos',
    favor_title: 'Legislate Federal Nurse Ratios & Protect Public Pension Solvency',
    favor_description: 'Enact binding patient-to-nurse staffing ratios for all federally subsidized hospitals, prohibit federal procurement from contracting with anti-union employers, and guarantee public pension insolvency backstops.',
    statutory_category: 'labor',
    suggested_bill_title: 'Fair Healthcare Staffing & Public Service Protection Accord',
    suggested_bill_summary: 'Establishes mandatory nurse-to-patient staffing maximums in federally reimbursed hospital networks and bolsters civil service pension insurance guarantees.',
    suggested_fiscal_impact: 11.0,
    base_contribution: 2.0,
    base_bounty: 9.5,
    ethics_risk_level: 'low',
    indicators: [
      { category: 'Campaign War Chest', direction: 'favorable' },
      { category: 'District App', direction: 'favorable' },
      { category: 'National App', direction: 'favorable' },
      { category: 'Whip Loyalty', direction: 'favorable' }
    ]
  }
];

// Generate active lobbying pitches for a session
function generateLobbyingOffers(session) {
  const pState = session.political_state || {};
  const currentStage = pState.current_stage_id || 'representative';
  
  // Office tier multiplier for lobbying money
  const officeMultiplier = (currentStage === 'president' || currentStage === 'prime_minister') 
    ? 4.5 
    : ((currentStage === 'senator' || currentStage === 'cabinet_minister') ? 2.2 : 1.0);

  // Shuffle and pick 4 trade groups
  const shuffled = [...TRADE_LOBBYING_GROUPS].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 4);

  return selected.map(tg => {
    const jitter = 0.88 + Math.random() * 0.28;
    const contribution = Number((tg.base_contribution * officeMultiplier * jitter).toFixed(2));
    const bounty = Number((tg.base_bounty * officeMultiplier * jitter).toFixed(2));

    return {
      id: 'lob_' + Math.random().toString(36).substring(2, 10),
      session_id: session.id,
      trade_group: tg.trade_group,
      sector: tg.sector,
      chief_lobbyist: tg.chief_lobbyist,
      favor_title: tg.favor_title,
      favor_description: tg.favor_description,
      statutory_category: tg.statutory_category,
      campaign_contribution_millions: contribution,
      completion_bounty_millions: bounty,
      ethics_risk_level: tg.ethics_risk_level,
      suggested_bill_title: tg.suggested_bill_title,
      suggested_bill_summary: tg.suggested_bill_summary,
      suggested_fiscal_impact: tg.suggested_fiscal_impact,
      indicators: tg.indicators,
      status: 'pending',
      created_year: session.current_year || 1,
      created_month: session.current_month || 1
    };
  });
}

module.exports = {
  PARLIAMENTARY_TRACKS,
  CONGRESSIONAL_TRACKS,
  UNICAMERAL_TRACKS,
  BICAMERAL_TRACKS,
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
  CONGRESSIONAL_CAUCUSES,
  PARLIAMENTARY_CAUCUSES,
  generateCaucusDealOffers,
  politicalEventWeb,
  MAJOR_NATIONAL_ISSUES,
  POLITICAL_ALIGNMENT_QUIZ,
  evaluateQuizAlignment,
  TRADE_LOBBYING_GROUPS,
  generateLobbyingOffers,
  isUnicameralSystem,
  isBicameralSystem
};
