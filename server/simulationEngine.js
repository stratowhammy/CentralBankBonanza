const fs = require('fs');
const path = require('path');

// Load the 50-event web from economic_event_web.json
let eventWebData = null;
try {
  const eventWebPath = path.join(__dirname, '..', 'economic_event_web.json');
  if (fs.existsSync(eventWebPath)) {
    eventWebData = JSON.parse(fs.readFileSync(eventWebPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not load economic_event_web.json:', err.message);
}

// 9-Member Monetary Policy Committee (MPC)
const MPC_MEMBERS = [
  {
    id: 'mpc_chair',
    name: 'Helena Vance (Chair)',
    title: 'Chair of the Monetary Policy Committee',
    role: 'Chair',
    hawkishness: 50, // 0 = hyper-dove, 100 = hyper-hawk
    beta_inflation: 1.5,
    beta_output: 0.5,
    r_star: 1.15,
    bio: 'Committee Chair committed to data dependency and institutional consensus.'
  },
  {
    id: 'mpc_hawk_1',
    name: 'Dr. Sarah Jenkins',
    title: 'Deputy Governor for Monetary Analysis',
    role: 'Hawk',
    hawkishness: 82,
    beta_inflation: 2.0,
    beta_output: 0.25,
    r_star: 1.45,
    bio: 'Staunch monetary conservative who argues inflation expectations unanchor if policy is too loose.'
  },
  {
    id: 'mpc_hawk_2',
    name: 'Marcus Vance',
    title: 'External Member (Financial Markets)',
    role: 'Hawk',
    hawkishness: 75,
    beta_inflation: 1.8,
    beta_output: 0.30,
    r_star: 1.35,
    bio: 'Former chief fixed income strategist worried about sovereign bond vigilantes and wage spirals.'
  },
  {
    id: 'mpc_centrist_1',
    name: 'Arthur Finch',
    title: 'Deputy Governor for Financial Stability',
    role: 'Centrist',
    hawkishness: 55,
    beta_inflation: 1.5,
    beta_output: 0.5,
    r_star: 1.15,
    bio: 'Balances price stability against systemic debt burdens and credit liquidity.'
  },
  {
    id: 'mpc_centrist_2',
    name: 'David O\'Connor',
    title: 'External Member (Macroeconometrics)',
    role: 'Centrist',
    hawkishness: 48,
    beta_inflation: 1.4,
    beta_output: 0.6,
    r_star: 1.10,
    bio: 'Strict follower of empirical Taylor-rule models and neutral interest rate calculations.'
  },
  {
    id: 'mpc_centrist_3',
    name: 'Amara Patel',
    title: 'Chief Economist of the Central Bank',
    role: 'Centrist',
    hawkishness: 50,
    beta_inflation: 1.5,
    beta_output: 0.5,
    r_star: 1.15,
    bio: 'Author of the quarterly macroeconomic staff forecast; seeks pragmatic compromise.'
  },
  {
    id: 'mpc_dove_1',
    name: 'Olivia Vance',
    title: 'External Member (Labor Economics)',
    role: 'Dove',
    hawkishness: 25,
    beta_inflation: 0.85,
    beta_output: 1.3,
    r_star: 0.80,
    bio: 'Focuses on employment hysteresis and living wages; skeptical of Phillips-curve trade-offs.'
  },
  {
    id: 'mpc_dove_2',
    name: 'Noah Ramirez',
    title: 'Deputy Governor for Markets & Banking',
    role: 'Dove',
    hawkishness: 32,
    beta_inflation: 0.95,
    beta_output: 1.15,
    r_star: 0.90,
    bio: 'Vigilant against credit crunch risks and small business insolvency from elevated borrowing costs.'
  },
  {
    id: 'mpc_dove_3',
    name: 'Chloe Bennett',
    title: 'External Member (Industrial Strategy)',
    role: 'Dove',
    hawkishness: 28,
    beta_inflation: 0.90,
    beta_output: 1.25,
    r_star: 0.85,
    bio: 'Passionate about capital investment in green and manufacturing infrastructure.'
  }
];

// Calculate 9-member MPC vote given proposed rate change in basis points (-100..+100)
function calculateMpcVote(state, proposedRateBps) {
  const currentRate = state.interest_rate;
  const proposedRate = Number((currentRate + (proposedRateBps / 100.0)).toFixed(2));
  const inflationGap = state.inflation_cpi - 2.0;
  const outputGap = state.gdp_growth - 2.1;
  const inflationNearTarget = Math.abs(inflationGap) <= 0.35 && Math.abs((state.sticky_cpi || state.inflation_cpi) - 2.0) <= 0.45;
  // Collegial central bank norm: when credibility is solid and inflation is near target, members give modest deference to the Chair
  const collegialBandBps = inflationNearTarget && (state.market_credibility || 75) >= 55 ? 35 : 25;

  const votes = MPC_MEMBERS.map(member => {
    // If it's the chair (first member), they propose the rate so they vote AYE
    if (member.id === 'mpc_chair') {
      return {
        member_id: member.id,
        name: member.name,
        role: member.role,
        hawkishness: member.hawkishness,
        preferred_rate: proposedRate,
        preferred_delta_bps: proposedRateBps,
        vote: 'AYE',
        rationale: proposedRateBps === 0 
          ? (inflationNearTarget
              ? 'Policy is appropriately calibrated with inflation anchored near the 2.0% statutory target.'
              : 'Rates remain appropriate to anchor expectations while monitoring lagging transmission.')
          : proposedRateBps > 0
          ? `A ${proposedRateBps} bps tightening is warranted to lean against price and demand pressures.`
          : `A ${Math.abs(proposedRateBps)} bps easing recalibrates policy toward neutral to sustain balanced growth.`
      };
    }

    // Member's individual desired Taylor rule rate
    const memberTaylorRate = member.r_star + state.inflation_cpi + 
      (member.beta_inflation * 0.5 * inflationGap) + 
      (member.beta_output * 0.5 * outputGap);
    
    // Nearest quarter-percent step
    const rawDeltaBps = (memberTaylorRate - currentRate) * 100;
    const preferredDeltaBps = Math.round(rawDeltaBps / 25) * 25;
    const boundedDeltaBps = Math.max(-100, Math.min(100, preferredDeltaBps));
    const preferredRate = Number((currentRate + boundedDeltaBps / 100.0).toFixed(2));

    // Determine vote: AYE if member's preference is within collegial band of proposed rate, else DISSENT
    const diff = Math.abs(rawDeltaBps - proposedRateBps);
    let vote = 'AYE';
    let rationale = '';

    if (diff <= collegialBandBps || Math.abs(boundedDeltaBps - proposedRateBps) <= 25) {
      vote = 'AYE';
      rationale = `Concurs with the Chair's ${proposedRateBps >= 0 ? '+' : ''}${proposedRateBps} bps stance based on balanced medium-term risk weighting.`;
    } else if (boundedDeltaBps > proposedRateBps) {
      vote = 'DISSENT_HAWK';
      rationale = state.inflation_cpi > 2.5
        ? `Dissents in favor of firmer policy (${boundedDeltaBps >= 0 ? '+' : ''}${boundedDeltaBps} bps) to curb above-target ${state.inflation_cpi}% inflation.`
        : `Dissents in favor of a higher neutral rate (${boundedDeltaBps >= 0 ? '+' : ''}${boundedDeltaBps} bps) given ${state.gdp_growth}% GDP expansion.`;
    } else {
      vote = 'DISSENT_DOVE';
      rationale = state.gdp_growth < 1.5 || state.unemployment_rate > 4.6
        ? `Dissents in favor of greater accommodation (${boundedDeltaBps >= 0 ? '+' : ''}${boundedDeltaBps} bps) to shield employment and domestic growth.`
        : `Dissents in favor of faster normalization (${boundedDeltaBps >= 0 ? '+' : ''}${boundedDeltaBps} bps) now that inflation sits at ${state.inflation_cpi}%.`;
    }

    return {
      member_id: member.id,
      name: member.name,
      role: member.role,
      hawkishness: member.hawkishness,
      preferred_rate: preferredRate,
      preferred_delta_bps: boundedDeltaBps,
      vote,
      rationale
    };
  });

  const ayes = votes.filter(v => v.vote === 'AYE').length;
  const dissents = 9 - ayes;
  const hawkishDissents = votes.filter(v => v.vote === 'DISSENT_HAWK').length;
  const dovishDissents = votes.filter(v => v.vote === 'DISSENT_DOVE').length;

  return {
    proposed_rate: proposedRate,
    proposed_delta_bps: proposedRateBps,
    ayes,
    dissents,
    hawkish_dissents: hawkishDissents,
    dovish_dissents: dovishDissents,
    passed: ayes >= 5,
    just_voted: true,
    months_ago: 0,
    tally_label: `${ayes}-${dissents} Decision`,
    member_votes: votes,
    consensus_summary: dissents === 0 
      ? 'Unanimous 9-0 Consensus' 
      : `${ayes}-${dissents} Split Vote (${hawkishDissents} Hawkish Dissents, ${dovishDissents} Dovish Dissents)`
  };
}

// Generate FOMC-style Dot-Plot Projections
function generateDotPlot(state) {
  const currentRate = state.interest_rate;
  const targetInflation = 2.0;
  const inflationGap = state.inflation_cpi - targetInflation;
  const outputGap = state.gdp_growth - 2.1;

  const dots = MPC_MEMBERS.map(member => {
    // 1-Year Forward projection
    const yr1Rate = Math.max(0, currentRate + (member.beta_inflation * 0.4 * inflationGap) + (member.beta_output * 0.3 * outputGap) + (member.hawkishness > 60 ? 0.25 : member.hawkishness < 40 ? -0.25 : 0));
    // 2-Year Forward projection (drifting closer to r* + 2.0%)
    const neutralNominal = member.r_star + targetInflation;
    const yr2Rate = Math.max(0, (yr1Rate * 0.5) + (neutralNominal * 0.5) + (member.hawkishness - 50) * 0.01);
    // Long-Run Neutral Rate (r* + target 2.0%)
    const longRunRate = Number((member.r_star + targetInflation).toFixed(2));

    return {
      member_id: member.id,
      name: member.name,
      role: member.role,
      year_1: Number(Math.round(yr1Rate * 4) / 4).toFixed(2),
      year_2: Number(Math.round(yr2Rate * 4) / 4).toFixed(2),
      long_run: Number(longRunRate).toFixed(2)
    };
  });

  // Calculate medians
  const sortNums = arr => [...arr].sort((a, b) => a - b);
  const yr1Med = sortNums(dots.map(d => parseFloat(d.year_1)))[4];
  const yr2Med = sortNums(dots.map(d => parseFloat(d.year_2)))[4];
  const lrMed = sortNums(dots.map(d => parseFloat(d.long_run)))[4];

  return {
    current_rate: currentRate,
    median_projections: {
      year_1: yr1Med,
      year_2: yr2Med,
      long_run: lrMed
    },
    dots
  };
}

// Volatility Scalers (Low, Normal, High, Extreme)
const VOLATILITY_SCALERS = {
  low: {
    key: 'low',
    name: 'Calm Macro Environment',
    monthly_shock_chance: 0.06,
    noise_multiplier: 0.50,
    shock_impact_multiplier: 0.70,
    max_duration: 3
  },
  normal: {
    key: 'normal',
    name: 'Standard Cyclical Volatility',
    monthly_shock_chance: 0.15,
    noise_multiplier: 1.00,
    shock_impact_multiplier: 1.00,
    max_duration: 6
  },
  high: {
    key: 'high',
    name: 'Choppy Geopolitical Strains',
    monthly_shock_chance: 0.30,
    noise_multiplier: 1.75,
    shock_impact_multiplier: 1.40,
    max_duration: 8
  },
  extreme: {
    key: 'extreme',
    name: 'Geopolitical & Commodity Chaos',
    monthly_shock_chance: 0.50,
    noise_multiplier: 2.60,
    shock_impact_multiplier: 2.00,
    max_duration: 10
  }
};

// Economy Type Profiles (Large Hegemon vs Middle Advanced vs Small Open Economy)
const ECONOMY_TYPE_PROFILES = {
  large_hegemon: {
    key: 'large_hegemon',
    name: 'Large Reserve Currency Hegemon',
    subtitle: 'Autonomous Monetary Superpower (US / Eurozone / UK parallel)',
    description: 'Deep domestic bond market, trillion-dollar balance sheet QE/QT, minimal imported inflation pass-through, reserve currency status.',
    fx_passthrough: 0.03,
    sovereign_spread_base: 0,
    default_foreign_benchmark: 4.50,
    fx_reserves_default: 480.0, // $B
    import_share: 0.15,
    balance_sheet_trillions: 7.20,
    financial_center: 'Doll Street'
  },
  middle_advanced: {
    key: 'middle_advanced',
    name: 'Middle Advanced Open Economy',
    subtitle: 'Open Industrial Economy (Canada / Australia / Sweden / South Korea parallel)',
    description: 'Constrained by global rate differentials, moderate imported CPI pass-through, sensitive to terms of trade, housing mortgage debt, and capital flows.',
    fx_passthrough: 0.18,
    sovereign_spread_base: 65, // 65 bps spread over global benchmark
    default_foreign_benchmark: 4.50,
    fx_reserves_default: 185.0, // $B
    import_share: 0.35,
    balance_sheet_trillions: 0.85,
    financial_center: 'Metropolitan Exchange'
  },
  small_emerging: {
    key: 'small_emerging',
    name: 'Small Open Economy',
    subtitle: 'Vulnerable Price-Taking Economy (Chile / Czechia / Poland / Singapore / South Africa parallel)',
    description: 'Hypersensitive to capital flight and sudden stops, high imported inflation pass-through, sovereign risk spreads, requires active FX reserve market defense.',
    fx_passthrough: 0.38,
    sovereign_spread_base: 220, // 220 bps spread over global benchmark
    default_foreign_benchmark: 4.50,
    fx_reserves_default: 65.0, // $B
    import_share: 0.55,
    balance_sheet_trillions: 0.18,
    financial_center: 'National Bourse'
  }
};

// Initial Economic State with full Section 5 variables & configurable economy types / conditions / volatility
function getInitialEconomicState(difficulty = 'normal', economyType = 'large_hegemon', startingCondition = null, volatility = 'normal') {
  const condition = startingCondition || difficulty || 'normal';
  const econType = economyType || 'large_hegemon';
  const vol = volatility || 'normal';
  const profile = ECONOMY_TYPE_PROFILES[econType] || ECONOMY_TYPE_PROFILES.large_hegemon;

  // Base values per Starting Condition
  let baseRate = 4.25;
  let baseCpi = 3.40;
  let baseFlexCpi = 3.90;
  let baseStickyCpi = 3.05;
  let baseUnemployment = 4.10;
  let baseGdp = 2.30;
  let baseStock = 5240.0;
  let baseCredibility = 78.0;
  let baseParlApproval = 62.0;
  let basePublicApproval = 55.0;
  let baseJobSecurity = 68.0;
  let baseDebt = 106.5;
  let baseDeficit = -4.10;
  let baseCurrency = 102.4;
  let baseSpread = profile.sovereign_spread_base;
  let baseReserves = profile.fx_reserves_default;
  let initialWarnings = 0;

  if (condition === 'easy') {
    // Goldilocks inheritance
    baseRate = 3.00;
    baseCpi = 2.10;
    baseFlexCpi = 2.20;
    baseStickyCpi = 2.05;
    baseUnemployment = 3.90;
    baseGdp = 2.60;
    baseStock = 5450.0;
    baseCredibility = 85.0;
    baseParlApproval = 74.0;
    basePublicApproval = 68.0;
    baseJobSecurity = 78.0;
    baseDebt = 58.0;
    baseDeficit = -1.80;
    baseCurrency = 103.5;
    baseSpread = Math.max(15, profile.sovereign_spread_base - 30);
    baseReserves = profile.fx_reserves_default * 1.35;
  } else if (condition === 'hard') {
    // Crisis inheritance
    if (econType === 'small_emerging') {
      baseRate = 7.50;
      baseCpi = 9.20;
      baseFlexCpi = 11.40;
      baseStickyCpi = 7.80;
    } else if (econType === 'middle_advanced') {
      baseRate = 6.00;
      baseCpi = 7.20;
      baseFlexCpi = 8.60;
      baseStickyCpi = 6.20;
    } else {
      baseRate = 5.50;
      baseCpi = 6.80;
      baseFlexCpi = 7.90;
      baseStickyCpi = 6.05;
    }
    baseUnemployment = 5.40;
    baseGdp = 0.60;
    baseStock = 4420.0;
    baseCredibility = 52.0;
    baseParlApproval = 38.0;
    basePublicApproval = 34.0;
    baseJobSecurity = 44.0;
    baseDebt = 124.0;
    baseDeficit = -6.50;
    baseCurrency = 91.5;
    baseSpread = profile.sovereign_spread_base + 160;
    baseReserves = profile.fx_reserves_default * 0.50; // Heavily depleted
    initialWarnings = 1; // Starts with 1 formal reprimand
  }

  // Calculate bond yields
  const foreignBench = profile.default_foreign_benchmark;
  let yield10y = 4.40;
  let yield2y = 4.55;

  if (econType !== 'large_hegemon') {
    yield10y = Number((foreignBench + (baseSpread / 100) + (baseRate - 3.5) * 0.35).toFixed(2));
    yield2y = Number((baseRate + 0.35 + (baseSpread / 220)).toFixed(2));
  } else {
    yield10y = condition === 'easy' ? 3.65 : (condition === 'hard' ? 5.20 : 4.40);
    yield2y = condition === 'easy' ? 3.30 : (condition === 'hard' ? 5.55 : 4.55);
  }

  return {
    // Meta configuration attributes
    economy_type: econType,
    starting_condition: condition,
    volatility: vol,

    // Core Macro Variables
    interest_rate: baseRate,
    inflation_cpi: baseCpi,
    flexible_cpi: baseFlexCpi,
    sticky_cpi: baseStickyCpi,
    core_inflation: baseStickyCpi,
    unemployment_rate: baseUnemployment,
    gdp_growth: baseGdp,
    stock_market_index: baseStock,
    bond_yield_10y: yield10y,
    bond_yield_2y: yield2y,
    currency_index: baseCurrency,
    bank_lending_rate: Number((baseRate + 2.60).toFixed(2)),

    // Small / Middle Nation Telemetry & Facilities
    foreign_benchmark_rate: foreignBench,
    sovereign_risk_spread: baseSpread, // bps over global benchmark
    fx_reserves_billions: Number(baseReserves.toFixed(1)),
    import_share_of_cpi: profile.import_share,
    capital_flow_momentum: 0.0, // $B net flow/mo

    // Pillar E: Balance Sheet & Emergency Tools
    balance_sheet_size: profile.balance_sheet_trillions,
    qt_monthly_pace: econType === 'large_hegemon' ? -25.0 : -4.0,
    discount_window_active: false,
    discount_window_rate: Number((baseRate + 1.00).toFixed(2)),

    // Pillar C: Forward Guidance Credibility & Taper Tantrum tracker
    market_credibility: baseCredibility,
    recent_guidance: [],
    credibility_warning: null,

    // Pillar A: Milton Friedman's Lagged Transmission Pipeline
    transmission_pipeline: [],

    // Social & Household Variables
    real_wage_growth: condition === 'easy' ? 0.80 : (condition === 'hard' ? -1.80 : -0.30),
    housing_cost_index: condition === 'easy' ? 122.0 : (condition === 'hard' ? 168.0 : 148.5),
    consumer_confidence: condition === 'easy' ? 72.0 : (condition === 'hard' ? 38.0 : 54.0),
    poverty_discontent: condition === 'easy' ? 26.0 : (condition === 'hard' ? 62.0 : 46.0),
    wealth_inequality_gini: 43.0,

    // Political & Governance Variables
    parliamentary_approval: baseParlApproval,
    public_approval: basePublicApproval,
    fiscal_deficit: baseDeficit,
    debt_to_gdp: baseDebt,
    central_bank_autonomy: condition === 'hard' ? 72.0 : 90.0,
    months_to_election: 28,

    // First Person Job Security metric
    job_security: baseJobSecurity,
    warning_count: initialWarnings,
    term_months_completed: 0,
    reappointment_count: 0,

    // Active economic shocks/events
    active_events: [],
    last_mpc_vote: null
  };
}

// God Mode Archetypes for succession
const GOD_MODE_CHAIRS = [
  {
    id: 'chair_arthur_finch',
    name: 'Arthur Finch',
    title: 'The Pragmatic Technocrat',
    description: 'Former chief economist at an investment bank. Believes in gradualism and data dependence.',
    avatar_color: '#3B82F6',
    starting_trust: 35,
    tenure_months: 0,
    hawkishness: 50
  },
  {
    id: 'chair_evelyn_cross',
    name: 'Evelyn Cross',
    title: 'The Uncompromising Inflation Hawk',
    description: 'Renowned monetary theorist. Will raise rates without hesitation to crush inflation expectations.',
    avatar_color: '#EF4444',
    starting_trust: 40,
    tenure_months: 0,
    hawkishness: 80
  },
  {
    id: 'chair_marcus_sterling',
    name: 'Marcus Sterling',
    title: 'The Wall Street Whisperer',
    description: 'Deep ties to commercial banking and capital markets. Highly protective of liquidity and asset valuations.',
    avatar_color: '#10B981',
    starting_trust: 45,
    tenure_months: 0,
    hawkishness: 35
  },
  {
    id: 'chair_olivia_vance',
    name: 'Olivia Vance',
    title: 'The Labor & Welfare Champion',
    description: 'Former labor union advisor and academic. Prioritizes maximum employment and wage growth above all.',
    avatar_color: '#8B5CF6',
    starting_trust: 30,
    tenure_months: 0,
    hawkishness: 25
  }
];

function getInitialChairState(playMode, customChairName = 'Helena Vance') {
  if (playMode === 'god_mode') {
    return {
      active_chair_index: 0,
      active_chair: { ...GOD_MODE_CHAIRS[0] },
      chair_history: [],
      cumulative_years_managed: 0,
      crises_resolved: 0,
      prestige_rank: 'Junior Governor'
    };
  } else {
    return {
      active_chair: {
        id: 'chair_first_person',
        name: customChairName || 'Helena Vance',
        title: 'Chair of the Central Bank Board',
        description: 'Appointed to safeguard the currency, maximize employment, and preserve institutional stability.',
        avatar_color: '#4F46E5',
        starting_trust: 50,
        tenure_months: 0,
        hawkishness: 50
      },
      chair_history: []
    };
  }
}

// Calculate theoretical Taylor Rule benchmark
function calculateTaylorRule(state) {
  const rStar = 1.15; // Equilibrium neutral real rate (consistent with MPC median r*)
  const targetInflation = 2.0;
  const potentialGdpGrowth = 2.1;
  
  const inflationGap = state.inflation_cpi - targetInflation;
  const outputGap = state.gdp_growth - potentialGdpGrowth;
  
  const taylorRate = rStar + state.inflation_cpi + 0.5 * inflationGap + 0.5 * outputGap;
  return Number(Math.max(0, taylorRate).toFixed(2));
}

// Core simulation step: Advances the economy by exactly 1 month
function evolveEconomy(prevState, action, playMode, difficulty, chairState) {
  const state = JSON.parse(JSON.stringify(prevState));
  state.term_months_completed = (state.term_months_completed || 0) + 1;
  state.credibility_warning = null;

  // Age previous MPC vote in inter-meeting months so press/parliament know whether a vote just happened
  if (state.last_mpc_vote && action.action_type !== 'mpc_rate_decision') {
    state.last_mpc_vote = {
      ...state.last_mpc_vote,
      just_voted: false,
      months_ago: (state.last_mpc_vote.months_ago || 0) + 1
    };
  }

  // Ensure arrays exist
  if (!Array.isArray(state.transmission_pipeline)) state.transmission_pipeline = [];
  if (!Array.isArray(state.recent_guidance)) state.recent_guidance = [];
  if (state.flexible_cpi === undefined) state.flexible_cpi = state.inflation_cpi;
  if (state.sticky_cpi === undefined) state.sticky_cpi = state.core_inflation;
  if (state.balance_sheet_size === undefined) state.balance_sheet_size = 7.20;
  if (state.qt_monthly_pace === undefined) state.qt_monthly_pace = -25.0;
  if (state.market_credibility === undefined) state.market_credibility = 75.0;

  // 1. Determine Chair Trust & Public Reaction Multiplier
  let reactionMultiplier = 1.0;
  let chairTrust = 50;
  if (playMode === 'god_mode' && chairState && chairState.active_chair) {
    chairTrust = chairState.active_chair.starting_trust;
    reactionMultiplier = Math.max(0.40, 1.0 - 0.50 * (chairTrust / 100));
  } else if (playMode === 'first_person') {
    reactionMultiplier = Math.max(0.65, 1.15 - 0.40 * (state.public_approval / 100));
  }

  // 2. Process Monthly Policy Action
  let rateChangeBps = 0;

  if (action.action_type === 'guidance') {
    const stance = action.action_value || 'neutral';
    state.recent_guidance.push({ month: state.term_months_completed, stance });
    // Keep only last 2 guidance stances for the active cycle
    if (state.recent_guidance.length > 2) {
      state.recent_guidance = state.recent_guidance.slice(-2);
    }

    if (stance === 'hawkish') {
      state.bond_yield_2y = Number((state.bond_yield_2y + 0.08 * reactionMultiplier).toFixed(2));
      state.bond_yield_10y = Number((state.bond_yield_10y + 0.04 * reactionMultiplier).toFixed(2));
      state.stock_market_index = Number((state.stock_market_index - (25 + Math.random() * 15) * reactionMultiplier).toFixed(1));
      state.currency_index = Number((state.currency_index + 0.35 * reactionMultiplier).toFixed(1));
    } else if (stance === 'dovish') {
      state.bond_yield_2y = Number((state.bond_yield_2y - 0.08 * reactionMultiplier).toFixed(2));
      state.bond_yield_10y = Number((state.bond_yield_10y - 0.04 * reactionMultiplier).toFixed(2));
      state.stock_market_index = Number((state.stock_market_index + (35 + Math.random() * 20) * reactionMultiplier).toFixed(1));
      state.currency_index = Number((state.currency_index - 0.35 * reactionMultiplier).toFixed(1));
    }
  } else if (action.action_type === 'mpc_rate_decision') {
    rateChangeBps = parseInt(action.action_value, 10) || 0;
    const rateChangePct = rateChangeBps / 100.0;

    // Calculate full 9-member MPC vote
    const mpcResult = calculateMpcVote(state, rateChangeBps);
    state.last_mpc_vote = mpcResult;

    // Pillar C: Check for Guidance Flip-Flop (Taper Tantrum Credibility Shock)
    const hasDovishGuidance = state.recent_guidance.some(g => g.stance === 'dovish');
    const hasHawkishGuidance = state.recent_guidance.some(g => g.stance === 'hawkish');

    let isFlipFlop = false;
    let tantrumMessage = '';

    if (hasDovishGuidance && rateChangeBps > 0) {
      isFlipFlop = true;
      tantrumMessage = 'TAPER TANTRUM: Central Bank abruptly hiked rates despite recent dovish forward guidance!';
    } else if (hasHawkishGuidance && rateChangeBps < 0) {
      isFlipFlop = true;
      tantrumMessage = 'CREDIBILITY SHOCK: Central Bank cut rates unexpectedly after signaling tightening bias!';
    }

    if (isFlipFlop) {
      state.market_credibility = Number(Math.max(10, state.market_credibility - 18.0).toFixed(1));
      state.bond_yield_2y = Number((state.bond_yield_2y + 0.28).toFixed(2)); // Volatility dislocation
      state.stock_market_index = Number((state.stock_market_index - 120.0).toFixed(1));
      state.credibility_warning = tantrumMessage;
    } else {
      // Normal alignment maintains or builds credibility
      state.market_credibility = Number(Math.min(95, state.market_credibility + 1.5).toFixed(1));
    }

    // Reset recent guidance after rate decision month
    state.recent_guidance = [];

    // Apply Rate Change
    state.interest_rate = Number(Math.max(0, state.interest_rate + rateChangePct).toFixed(2));
    state.discount_window_rate = Number((state.interest_rate + 1.00).toFixed(2));

    // Immediate financial market transmission
    state.bank_lending_rate = Number((state.interest_rate + 2.50 + (rateChangePct > 0 ? 0.10 : -0.05)).toFixed(2));
    state.bond_yield_2y = Number((state.interest_rate + 0.25 + (Math.random() * 0.08 - 0.04)).toFixed(2));
    state.bond_yield_10y = Number((state.bond_yield_10y + rateChangePct * 0.40 * reactionMultiplier).toFixed(2));

    const equityShock = (-rateChangeBps * 3.2) * reactionMultiplier;
    state.stock_market_index = Number(Math.max(1500, state.stock_market_index + equityShock + (Math.random() * 16 - 8)).toFixed(1));
    state.currency_index = Number((state.currency_index + (rateChangePct * 1.6) * reactionMultiplier).toFixed(1));

    // Pillar A: Milton Friedman's Long & Variable Lag Pipeline
    // Rate changes queue impulses over 12 months rather than instantly nuking the real economy
    if (rateChangeBps !== 0) {
      const gdpTotalDrag = -0.004 * rateChangeBps;     // e.g. +50 bps -> -0.20% real GDP drag total
      const inflTotalDrag = -0.003 * rateChangeBps;    // e.g. +50 bps -> -0.15% CPI drag total

      // Quarter 1 (Month +2): 20% impact
      state.transmission_pipeline.push({ months_remaining: 2, gdp_drag: Number((gdpTotalDrag * 0.20).toFixed(4)), inflation_drag: Number((inflTotalDrag * 0.20).toFixed(4)) });
      // Quarter 2 (Month +5): 35% impact
      state.transmission_pipeline.push({ months_remaining: 5, gdp_drag: Number((gdpTotalDrag * 0.35).toFixed(4)), inflation_drag: Number((inflTotalDrag * 0.35).toFixed(4)) });
      // Quarter 3 (Month +8): 30% impact
      state.transmission_pipeline.push({ months_remaining: 8, gdp_drag: Number((gdpTotalDrag * 0.30).toFixed(4)), inflation_drag: Number((inflTotalDrag * 0.30).toFixed(4)) });
      // Quarter 4 (Month +11): 15% impact
      state.transmission_pipeline.push({ months_remaining: 11, gdp_drag: Number((gdpTotalDrag * 0.15).toFixed(4)), inflation_drag: Number((inflTotalDrag * 0.15).toFixed(4)) });
    }
  }

  // 3. Process Balance Sheet & Emergency Discount Window Operations (Pillar E)
  if (action.action_type === 'balance_sheet_adjustment') {
    const pace = parseFloat(action.action_value) || 0;
    state.qt_monthly_pace = Math.max(-100, Math.min(100, pace));
  } else if (action.action_type === 'toggle_discount_window') {
    state.discount_window_active = !!action.action_value;
  } else if (action.action_type === 'fx_intervention') {
    // FX Market Intervention for Small & Middle Nations
    const mode = action.action_value || 'defend_currency';
    if (mode === 'defend_currency' || mode === 'sell_reserves') {
      const spend = Math.min(state.fx_reserves_billions || 0, state.economy_type === 'small_emerging' ? 5.0 : 10.0);
      state.fx_reserves_billions = Number(Math.max(0, (state.fx_reserves_billions || 0) - spend).toFixed(1));
      state.currency_index = Number((state.currency_index + spend * 0.45).toFixed(1));
      state.market_credibility = Number(Math.min(95, state.market_credibility + 2.0).toFixed(1));
    } else if (mode === 'accumulate_reserves' || mode === 'buy_reserves') {
      state.fx_reserves_billions = Number(((state.fx_reserves_billions || 0) + 5.0).toFixed(1));
      state.currency_index = Number((state.currency_index - 1.2).toFixed(1));
    }
  }

  // Monthly Balance Sheet Evolution ($T)
  const balanceSheetDelta = (state.qt_monthly_pace / 1000.0); // e.g. -$25B = -0.025T
  state.balance_sheet_size = Number(Math.max(0.1, state.balance_sheet_size + balanceSheetDelta).toFixed(3));
  // QT puts modest upward pressure on 10Y sovereign yields (term premium)
  if (state.qt_monthly_pace < 0) {
    state.bond_yield_10y = Number((state.bond_yield_10y + Math.abs(state.qt_monthly_pace) * 0.0008).toFixed(2));
  } else if (state.qt_monthly_pace > 0) {
    state.bond_yield_10y = Number((state.bond_yield_10y - state.qt_monthly_pace * 0.0008).toFixed(2));
  }

  // Emergency Discount Window effect during crisis
  if (state.discount_window_active) {
    state.bank_lending_rate = Number(Math.max(state.interest_rate + 1.25, state.bank_lending_rate - 0.10).toFixed(2));
    state.parliamentary_approval = Number(Math.max(10, state.parliamentary_approval - 0.4).toFixed(1));
  }

  // 4. Volatility Scaling & Open Economy Dynamics
  const volConfig = VOLATILITY_SCALERS[state.volatility || 'normal'] || VOLATILITY_SCALERS.normal;
  const noiseScale = volConfig.noise_multiplier;
  const econType = state.economy_type || 'large_hegemon';
  const profile = ECONOMY_TYPE_PROFILES[econType] || ECONOMY_TYPE_PROFILES.large_hegemon;

  // Open Economy Capital Flows & Rate Differential (Mundell-Fleming Trilemma)
  const foreignBench = state.foreign_benchmark_rate || profile.default_foreign_benchmark;
  const rateDiff = state.interest_rate - foreignBench;

  if (econType !== 'large_hegemon') {
    const flowSens = econType === 'small_emerging' ? 3.5 : 2.0;
    const credBoost = ((state.market_credibility || 75) - 70) * 0.08;
    state.capital_flow_momentum = Number((rateDiff * flowSens + credBoost + (Math.random() * 0.4 - 0.2) * noiseScale).toFixed(1));
    
    // Capital flight weakens domestic currency, inflows strengthen
    state.currency_index = Number((state.currency_index + state.capital_flow_momentum * 0.18).toFixed(1));

    // Sovereign Risk Spread (EMBI): increases if debt high, currency devalued, or reserves dangerously low
    let spreadDelta = (state.debt_to_gdp > 95 ? (state.debt_to_gdp - 95) * 0.6 : -1.5)
      + (state.currency_index < 96 ? (96 - state.currency_index) * 2.5 : 0)
      + (state.market_credibility < 60 ? (60 - state.market_credibility) * 1.2 : -1.0)
      + (state.fx_reserves_billions < 30 ? (30 - state.fx_reserves_billions) * 1.5 : 0);

    state.sovereign_risk_spread = Number(Math.max(20, Math.min(950, (state.sovereign_risk_spread || profile.sovereign_spread_base) + spreadDelta * 0.15 * noiseScale)).toFixed(0));

    // 10Y Yield tracks foreign benchmark + sovereign risk spread + domestic term premia
    state.bond_yield_10y = Number((foreignBench + (state.sovereign_risk_spread / 100) + (state.interest_rate - 3.5) * 0.35).toFixed(2));

    // FX Reserves warning condition
    if (state.fx_reserves_billions !== undefined && state.fx_reserves_billions < 15.0) {
      state.currency_index = Number((state.currency_index - 3.5 * noiseScale).toFixed(1));
      state.credibility_warning = 'BALANCE OF PAYMENTS DISTRESS: Foreign exchange reserves critically low! Speculators attacking domestic currency.';
      state.market_credibility = Math.max(10, state.market_credibility - 15);
      state.parliamentary_approval = Math.max(5, state.parliamentary_approval - 8);
    }
  } else {
    state.capital_flow_momentum = Number(((state.interest_rate - 3.5) * 0.8).toFixed(1));
  }

  // 5. Natural Macroeconomic Dynamics & Friedman Pipeline Impulse Execution
  let pipelineGdpDrag = 0;
  let pipelineInflDrag = 0;

  state.transmission_pipeline = state.transmission_pipeline.map(item => {
    item.months_remaining -= 1;
    if (item.months_remaining === 0) {
      pipelineGdpDrag += item.gdp_drag;
      pipelineInflDrag += item.inflation_drag;
    }
    return item;
  }).filter(item => item.months_remaining > 0);

  const neutralRate = 3.15;
  const policyStance = state.interest_rate - neutralRate;

  // Aggregate Demand (IS Curve): Mean reversion + Friedman lagged impulse
  const gdpMomentum = (2.1 - state.gdp_growth) * 0.12;
  const directRateDrag = -0.05 * policyStance * 0.33;
  state.gdp_growth = Number((state.gdp_growth + gdpMomentum + directRateDrag + pipelineGdpDrag + (Math.random() * 0.10 - 0.05) * noiseScale).toFixed(2));
  state.gdp_growth = Math.max(-6.0, Math.min(9.0, state.gdp_growth));

  // Decoupled Dual CPI (Flexible Goods CPI vs Sticky Core Services CPI)
  // FX pass-through is determined by economy type profile (0.03 for hegemon, 0.18 for middle, 0.38 for small)
  const fxShock = (100.0 - state.currency_index) * profile.fx_passthrough;
  state.flexible_cpi = Number((state.flexible_cpi * 0.85 + (2.0 + fxShock) * 0.15 + (Math.random() * 0.14 - 0.07) * noiseScale).toFixed(2));

  // Sticky CPI reacts slowly to labor market slack, housing, and pipeline drag
  const laborPressure = (4.2 - state.unemployment_rate) * 0.10;
  state.sticky_cpi = Number((state.sticky_cpi * 0.92 + (2.0 + laborPressure + pipelineInflDrag) * 0.08).toFixed(2));

  // Headline CPI is a weighted composite based on import share
  const flexWeight = Math.min(0.60, 0.25 + profile.import_share * 0.5);
  const stickyWeight = 1.0 - flexWeight;
  state.inflation_cpi = Number((state.flexible_cpi * flexWeight + state.sticky_cpi * stickyWeight).toFixed(2));
  state.core_inflation = Number(state.sticky_cpi.toFixed(2));

  // Unemployment (Okun's Law)
  const okunImpulse = -0.12 * (state.gdp_growth - 2.0) * 0.33;
  state.unemployment_rate = Number((state.unemployment_rate + okunImpulse + (Math.random() * 0.06 - 0.03) * noiseScale).toFixed(2));
  state.unemployment_rate = Math.max(2.5, Math.min(18.0, state.unemployment_rate));

  // 6. Social & Living Standards Dynamics
  const nominalWageTrend = 3.2 + (4.0 - state.unemployment_rate) * 0.2;
  state.real_wage_growth = Number((nominalWageTrend - state.inflation_cpi).toFixed(2));

  const mortgagePressure = policyStance > 0 ? -0.3 : 0.4;
  state.housing_cost_index = Number((state.housing_cost_index + mortgagePressure * 0.4 + (Math.random() * 0.3 - 0.15) * noiseScale).toFixed(1));

  const confDelta = (state.real_wage_growth * 1.5) - ((state.inflation_cpi - 2.0) * 1.2) - ((state.unemployment_rate - 4.0) * 1.8);
  state.consumer_confidence = Number(Math.max(10, Math.min(95, state.consumer_confidence + confDelta * 0.33)).toFixed(1));

  const discontentTarget = Math.max(10, Math.min(90, 
    30 + (state.inflation_cpi - 2.0) * 4.0 + (state.unemployment_rate - 4.0) * 5.0 - (state.real_wage_growth * 3.0)
  ));
  state.poverty_discontent = Number((state.poverty_discontent * 0.80 + discontentTarget * 0.20).toFixed(1));

  // 7. Political & Governance Layer
  state.months_to_election = state.months_to_election > 1 ? state.months_to_election - 1 : 48;
  const electionSensitivity = state.months_to_election <= 12 ? 1.5 : 1.0;

  const parlTarget = Math.max(5, Math.min(98, 
    75 - ((state.inflation_cpi - 2.0) * 6.0 * electionSensitivity) 
       - ((state.unemployment_rate - 4.0) * 7.0 * electionSensitivity)
       - (state.interest_rate > 6.0 ? 10 : 0)
  ));
  state.parliamentary_approval = Number((state.parliamentary_approval * 0.85 + parlTarget * 0.15).toFixed(1));

  state.public_approval = Number(Math.max(5, Math.min(95, 
    (state.consumer_confidence * 0.6 + (100 - state.poverty_discontent) * 0.4)
  )).toFixed(1));

  const debtServiceDrain = (state.interest_rate - 2.0) * 0.12;
  state.fiscal_deficit = Number((-3.2 - debtServiceDrain + (state.gdp_growth < 1.0 ? -0.8 : 0.2)).toFixed(2));
  state.debt_to_gdp = Number((state.debt_to_gdp + (Math.abs(state.fiscal_deficit) / 12) * 0.5 - (state.gdp_growth / 12) * 0.3).toFixed(1));

  // 8. First Person Job Security Assessment
  state.job_security = Number(Math.max(0, Math.min(100, 
    state.parliamentary_approval * 0.45 + state.public_approval * 0.25 + state.market_credibility * 0.15 + (100 - Math.abs(state.inflation_cpi - 2.0) * 10) * 0.15 - ((state.warning_count || 0) * 15)
  )).toFixed(1));

  if (state.job_security < 25.0) {
    state.warning_count = (state.warning_count || 0) + 1;
  } else if (state.job_security > 55.0 && (state.warning_count || 0) > 0) {
    state.warning_count = Math.max(0, state.warning_count - 1);
  }

  // 9. Active Events Processing & Volatility-Scaled Spontaneous Shocks
  if (state.active_events && state.active_events.length > 0) {
    state.active_events = state.active_events.map(ev => {
      ev.duration_remaining -= 1;
      const normalizedImpact = Number((ev.impact / 100.0).toFixed(2));
      if (ev.polarity === 'Negative') {
        state.flexible_cpi = Number((state.flexible_cpi + normalizedImpact * 0.25 * volConfig.shock_impact_multiplier).toFixed(2));
        state.gdp_growth = Number((state.gdp_growth - normalizedImpact * 0.20 * volConfig.shock_impact_multiplier).toFixed(2));
        state.stock_market_index = Number((state.stock_market_index - ev.impact * 2.2 * volConfig.shock_impact_multiplier).toFixed(1));
      } else {
        state.gdp_growth = Number((state.gdp_growth + normalizedImpact * 0.18 * volConfig.shock_impact_multiplier).toFixed(2));
        state.stock_market_index = Number((state.stock_market_index + ev.impact * 2.5 * volConfig.shock_impact_multiplier).toFixed(1));
        state.flexible_cpi = Number((state.flexible_cpi - normalizedImpact * 0.10 * volConfig.shock_impact_multiplier).toFixed(2));
      }
      return ev;
    }).filter(ev => ev.duration_remaining > 0);
  } else {
    if (Math.random() < volConfig.monthly_shock_chance && eventWebData && eventWebData.events) {
      const isNegative = state.inflation_cpi > 4.5 || state.unemployment_rate > 5.5 || Math.random() < 0.45;
      const pool = eventWebData.events.filter(e => isNegative ? e.polarity === 'Negative' : e.polarity === 'Positive');
      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        const avgImpact = ((picked.impact_min + picked.impact_max) / 2) * volConfig.shock_impact_multiplier;
        state.active_events.push({
          id: picked.id,
          name: picked.name,
          category: picked.category,
          polarity: picked.polarity,
          impact: Number(avgImpact.toFixed(1)),
          tier: picked.impact_tier,
          summary: picked.summary,
          duration_remaining: Math.min(volConfig.max_duration, 2 + Math.floor(Math.random() * 4))
        });
      }
    }
  }

  // Recalculate composite CPI after shocks
  state.inflation_cpi = Number((state.flexible_cpi * flexWeight + state.sticky_cpi * stickyWeight).toFixed(2));
  state.core_inflation = Number(state.sticky_cpi.toFixed(2));

  // Strict sanitation of all floating-point numbers
  state.interest_rate = Number(state.interest_rate.toFixed(2));
  state.gdp_growth = Number(state.gdp_growth.toFixed(2));
  state.unemployment_rate = Number(state.unemployment_rate.toFixed(2));
  state.stock_market_index = Number(state.stock_market_index.toFixed(1));
  state.currency_index = Number(state.currency_index.toFixed(1));
  state.bank_lending_rate = Number(state.bank_lending_rate.toFixed(2));
  state.bond_yield_10y = Number(state.bond_yield_10y.toFixed(2));
  state.bond_yield_2y = Number(state.bond_yield_2y.toFixed(2));
  if (state.fx_reserves_billions !== undefined) {
    state.fx_reserves_billions = Number(state.fx_reserves_billions.toFixed(1));
  }

  return state;
}

// Injects an explicit event from the 50-event catalog
function injectEvent(state, eventId) {
  if (!eventWebData || !eventWebData.events) return state;
  const found = eventWebData.events.find(e => e.id === eventId);
  if (!found) return state;
  
  const newState = JSON.parse(JSON.stringify(state));
  if (!newState.active_events) newState.active_events = [];
  
  const avgImpact = (found.impact_min + found.impact_max) / 2;
  newState.active_events.push({
    id: found.id,
    name: found.name,
    category: found.category,
    polarity: found.polarity,
    impact: Number(avgImpact.toFixed(1)),
    tier: found.impact_tier,
    summary: found.summary,
    duration_remaining: 4
  });
  
  return newState;
}

module.exports = {
  MPC_MEMBERS,
  calculateMpcVote,
  generateDotPlot,
  getInitialEconomicState,
  getInitialChairState,
  calculateTaylorRule,
  evolveEconomy,
  injectEvent,
  GOD_MODE_CHAIRS,
  VOLATILITY_SCALERS,
  ECONOMY_TYPE_PROFILES
};
