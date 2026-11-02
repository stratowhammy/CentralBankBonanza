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

// Default initial state
function getInitialEconomicState(difficulty = 'normal') {
  return {
    // Core Macro Variables (Easy, Normal, Hard)
    interest_rate: 4.25,        // Central bank policy rate (%)
    inflation_cpi: 3.40,        // Headline CPI inflation (%) - Target is 2.0%
    core_inflation: 3.10,       // Core CPI inflation (%)
    unemployment_rate: 4.10,    // Unemployment rate (%) - NAIRU is ~4.2%
    gdp_growth: 2.30,           // Real GDP growth annualized (%) - Potential is ~2.0%
    stock_market_index: 5240.0, // Doll Street Index (points)
    bond_yield_10y: 4.40,       // 10-Year Benchmark Treasury Yield (%)
    bond_yield_2y: 4.55,        // 2-Year Benchmark Treasury Yield (%)
    currency_index: 102.4,      // Trade-weighted FX index (100 = parity baseline)
    bank_lending_rate: 6.85,    // Average commercial business loan rate (%)

    // Social & Household Variables (Normal, Hard - reported by Gotham News Tribune)
    real_wage_growth: -0.30,    // Nominal wage growth minus inflation (%)
    housing_cost_index: 148.5,  // Shelter & rental price index (baseline 100)
    consumer_confidence: 54.0,  // Consumer Sentiment (0..100, neutral = 50)
    poverty_discontent: 46.0,   // Social discontent & strike susceptibility (0..100)
    wealth_inequality_gini: 43.0, // Wealth concentration metric (0..100)

    // Political & Governance Variables (Hard - reported by Cashington Post)
    parliamentary_approval: 62.0, // Parliament / congressional approval of Chair (0..100)
    public_approval: 55.0,        // General public sentiment (0..100)
    fiscal_deficit: -4.10,        // National budget deficit as % of GDP
    debt_to_gdp: 106.5,           // Public debt to GDP (%)
    central_bank_autonomy: 90.0,  // Degree of central bank independence (0..100)
    months_to_election: 28,       // Months remaining before parliamentary election

    // First Person Job Security metric
    job_security: 68.0,           // Overall job retention safety (0..100)
    warning_count: 0,             // Number of formal parliamentary reprimands

    // Active economic shocks/events
    active_events: []
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

// Calculate the theoretical Taylor Rule rate as an analytical anchor
function calculateTaylorRule(state) {
  const rStar = 1.5; // Equilibrium neutral real rate
  const targetInflation = 2.0;
  const potentialGdpGrowth = 2.1;
  
  const inflationGap = state.inflation_cpi - targetInflation;
  const outputGap = state.gdp_growth - potentialGdpGrowth;
  
  // Standard Taylor Rule: i = r* + pi + 0.5(pi - pi*) + 0.5(y - y*)
  const taylorRate = rStar + state.inflation_cpi + 0.5 * inflationGap + 0.5 * outputGap;
  return Number(Math.max(0, taylorRate).toFixed(2));
}

// Core simulation step: Advances the economy by exactly 1 month
function evolveEconomy(prevState, action, playMode, difficulty, chairState) {
  const state = JSON.parse(JSON.stringify(prevState));
  
  // 1. Determine Chair Trust & Public Reaction Multiplier
  let reactionMultiplier = 1.0;
  let chairTrust = 50;
  if (playMode === 'god_mode' && chairState && chairState.active_chair) {
    chairTrust = chairState.active_chair.starting_trust;
    // Longer tenure in God Mode dampens public overreactions (Anchoring effect)
    reactionMultiplier = Math.max(0.40, 1.0 - 0.50 * (chairTrust / 100));
  } else if (playMode === 'first_person') {
    // In first person, reaction multiplier depends slightly on public approval
    reactionMultiplier = Math.max(0.65, 1.15 - 0.40 * (state.public_approval / 100));
  }

  // 2. Process Monthly Policy Action
  let guidanceImpulse = 0; // -1 (dovish) to +1 (hawkish)
  let rateChangeBps = 0;   // In basis points (Month 3)

  if (action.action_type === 'guidance') {
    const stance = action.action_value || 'neutral';
    if (stance === 'hawkish') {
      guidanceImpulse = 0.45;
      // Markets price in future rate hikes
      state.bond_yield_2y += 0.08 * reactionMultiplier;
      state.bond_yield_10y += 0.04 * reactionMultiplier;
      state.stock_market_index -= (25 + Math.random() * 20) * reactionMultiplier;
      state.currency_index += 0.35 * reactionMultiplier;
    } else if (stance === 'dovish') {
      guidanceImpulse = -0.45;
      // Markets price in rate cuts/easing
      state.bond_yield_2y -= 0.08 * reactionMultiplier;
      state.bond_yield_10y -= 0.04 * reactionMultiplier;
      state.stock_market_index += (35 + Math.random() * 25) * reactionMultiplier;
      state.currency_index -= 0.35 * reactionMultiplier;
    } else {
      // Neutral or silence
      guidanceImpulse = 0;
    }
  } else if (action.action_type === 'mpc_rate_decision') {
    // Quarter-percent choices: -100, -75, -50, -25, 0, +25, +50, +75, +100
    rateChangeBps = parseInt(action.action_value, 10) || 0;
    const rateChangePct = rateChangeBps / 100.0;
    
    state.interest_rate = Number(Math.max(0, state.interest_rate + rateChangePct).toFixed(2));
    
    // Immediate financial market transmission
    state.bank_lending_rate = Number((state.interest_rate + 2.50 + (rateChangePct > 0 ? 0.1 : -0.05)).toFixed(2));
    state.bond_yield_2y = Number((state.interest_rate + 0.25 + (Math.random() * 0.1 - 0.05)).toFixed(2));
    state.bond_yield_10y = Number((state.bond_yield_10y + rateChangePct * 0.45 * reactionMultiplier).toFixed(2));
    
    // Stock market response: rate hike lowers P/E multiples, rate cut lifts them
    const equityShock = (-rateChangeBps * 3.5) * reactionMultiplier;
    state.stock_market_index = Math.max(1500, state.stock_market_index + equityShock + (Math.random() * 20 - 10));
    
    // Currency response
    state.currency_index += (rateChangePct * 1.8) * reactionMultiplier;
  }

  // 3. Natural Macroeconomic Inertia & Feedback Loops (IS-Phillips-Okun dynamics)
  const neutralRate = 3.50; // Estimated neutral nominal rate
  const policyStance = state.interest_rate - neutralRate; // >0 is restrictive, <0 is accommodative

  // Aggregate Demand (IS Curve): Restrictive rates slow GDP growth; accommodative rates boost it
  const gdpMomentum = (2.1 - state.gdp_growth) * 0.15; // Mean reversion toward 2.1%
  const rateDragOnGdp = -0.22 * policyStance * 0.33; // Monthly drag
  state.gdp_growth = Number((state.gdp_growth + gdpMomentum + rateDragOnGdp + (Math.random() * 0.16 - 0.08)).toFixed(2));
  state.gdp_growth = Math.max(-5.0, Math.min(8.0, state.gdp_growth));

  // Inflation Dynamics (Phillips Curve): Higher GDP / lower unemployment push inflation up; high rates pull it down
  const outputGap = state.gdp_growth - 2.1;
  const demandPull = 0.08 * outputGap * 0.33;
  const monetaryRestraint = -0.15 * policyStance * 0.33;
  const inflationInertia = (2.0 - state.inflation_cpi) * 0.05; // Anchored target pull
  
  state.inflation_cpi = Number((state.inflation_cpi + demandPull + monetaryRestraint + inflationInertia + (Math.random() * 0.12 - 0.06)).toFixed(2));
  state.inflation_cpi = Math.max(-2.0, Math.min(25.0, state.inflation_cpi));
  
  // Core inflation moves more slowly
  state.core_inflation = Number((state.core_inflation * 0.85 + state.inflation_cpi * 0.15).toFixed(2));

  // Unemployment (Okun's Law): When GDP is below potential, unemployment rises
  const okunImpulse = -0.15 * (state.gdp_growth - 2.0) * 0.33;
  state.unemployment_rate = Number((state.unemployment_rate + okunImpulse + (Math.random() * 0.08 - 0.04)).toFixed(2));
  state.unemployment_rate = Math.max(2.5, Math.min(15.0, state.unemployment_rate));

  // 4. Social & Living Standards Dynamics (Normal and Hard mode)
  // Real wage growth: nominal wage growth (~3.2%) minus current inflation
  const nominalWageTrend = 3.2 + (4.0 - state.unemployment_rate) * 0.2;
  state.real_wage_growth = Number((nominalWageTrend - state.inflation_cpi).toFixed(2));

  // Housing cost: responds to interest rate (mortgage cost) and consumer purchasing power
  const mortgagePressure = policyStance > 0 ? -0.4 : 0.6;
  state.housing_cost_index = Number((state.housing_cost_index + mortgagePressure * 0.5 + (Math.random() * 0.4 - 0.2)).toFixed(1));

  // Consumer Confidence: lifted by real wage growth & low unemployment, hurt by high inflation
  const confDelta = (state.real_wage_growth * 1.5) - ((state.inflation_cpi - 2.0) * 1.2) - ((state.unemployment_rate - 4.0) * 1.8);
  state.consumer_confidence = Number(Math.max(10, Math.min(95, state.consumer_confidence + confDelta * 0.33)).toFixed(1));

  // Social discontent: rises with inflation, unemployment, and housing costs
  const discontentTarget = Math.max(10, Math.min(90, 
    30 + (state.inflation_cpi - 2.0) * 4.0 + (state.unemployment_rate - 4.0) * 5.0 - (state.real_wage_growth * 3.0)
  ));
  state.poverty_discontent = Number((state.poverty_discontent * 0.80 + discontentTarget * 0.20).toFixed(1));

  // 5. Political & Governance Layer (Hard mode)
  // Parliament election countdown
  state.months_to_election = state.months_to_election > 1 ? state.months_to_election - 1 : 48;

  // Parliamentary Approval: Lawmakers hate high inflation and high unemployment, especially near elections
  const electionSensitivity = state.months_to_election <= 12 ? 1.5 : 1.0;
  const parlTarget = Math.max(5, Math.min(98, 
    75 - ((state.inflation_cpi - 2.0) * 6.0 * electionSensitivity) 
       - ((state.unemployment_rate - 4.0) * 7.0 * electionSensitivity)
       - (state.interest_rate > 6.0 ? 10 : 0)
  ));
  state.parliamentary_approval = Number((state.parliamentary_approval * 0.80 + parlTarget * 0.20).toFixed(1));

  // Public Approval: Tracks consumer confidence and purchasing power
  state.public_approval = Number(Math.max(5, Math.min(95, 
    (state.consumer_confidence * 0.6 + (100 - state.poverty_discontent) * 0.4)
  )).toFixed(1));

  // Fiscal Deficit: Higher interest rates raise sovereign debt service
  const debtServiceDrain = (state.interest_rate - 2.0) * 0.15;
  state.fiscal_deficit = Number((-3.2 - debtServiceDrain + (state.gdp_growth < 1.0 ? -1.0 : 0.2)).toFixed(2));
  state.debt_to_gdp = Number((state.debt_to_gdp + (Math.abs(state.fiscal_deficit) / 12) * 0.5 - (state.gdp_growth / 12) * 0.3).toFixed(1));

  // 6. First Person Job Security Assessment
  state.job_security = Number(Math.max(0, Math.min(100, 
    state.parliamentary_approval * 0.50 + state.public_approval * 0.30 + (100 - Math.abs(state.inflation_cpi - 2.0) * 10) * 0.20
  )).toFixed(1));

  if (state.job_security < 25.0) {
    state.warning_count += 1;
  } else if (state.job_security > 50.0 && state.warning_count > 0) {
    state.warning_count = Math.max(0, state.warning_count - 1);
  }

  // 7. Active Events Processing & Spontaneous Shocks
  if (state.active_events && state.active_events.length > 0) {
    state.active_events = state.active_events.map(ev => {
      ev.duration_remaining -= 1;
      // Apply monthly shock force
      if (ev.polarity === 'Negative') {
        state.inflation_cpi += (ev.impact / 100) * 0.15;
        state.gdp_growth -= (ev.impact / 100) * 0.20;
        state.stock_market_index -= (ev.impact * 2.5);
      } else {
        state.gdp_growth += (ev.impact / 100) * 0.18;
        state.stock_market_index += (ev.impact * 3.0);
        state.inflation_cpi -= (ev.impact / 100) * 0.08;
      }
      return ev;
    }).filter(ev => ev.duration_remaining > 0);
  } else {
    // 15% monthly chance of spontaneous event from 50-event web
    if (Math.random() < 0.15 && eventWebData && eventWebData.events) {
      const isNegative = state.inflation_cpi > 4.5 || state.unemployment_rate > 5.5 || Math.random() < 0.45;
      const pool = eventWebData.events.filter(e => isNegative ? e.polarity === 'Negative' : e.polarity === 'Positive');
      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        const avgImpact = (picked.impact_min + picked.impact_max) / 2;
        state.active_events.push({
          id: picked.id,
          name: picked.name,
          category: picked.category,
          polarity: picked.polarity,
          impact: avgImpact,
          tier: picked.impact_tier,
          summary: picked.summary,
          duration_remaining: 3 + Math.floor(Math.random() * 4) // 3-6 months
        });
      }
    }
  }

  // Round key floats cleanly
  state.stock_market_index = Number(state.stock_market_index.toFixed(1));
  state.currency_index = Number(state.currency_index.toFixed(1));
  state.bank_lending_rate = Number(state.bank_lending_rate.toFixed(2));
  state.bond_yield_10y = Number(state.bond_yield_10y.toFixed(2));
  state.bond_yield_2y = Number(state.bond_yield_2y.toFixed(2));

  return state;
}

// Injects an explicit event from the 50-event catalog (used by Admin or game triggers)
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
    impact: avgImpact,
    tier: found.impact_tier,
    summary: found.summary,
    duration_remaining: 4
  });
  
  return newState;
}

module.exports = {
  getInitialEconomicState,
  getInitialChairState,
  calculateTaylorRule,
  evolveEconomy,
  injectEvent,
  GOD_MODE_CHAIRS
};
