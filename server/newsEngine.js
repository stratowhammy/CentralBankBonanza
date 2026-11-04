const db = require('./db');

/**
 * Classifies the objective macroeconomic regime from live indicators so both
 * LLM prompts and the local editorial engine reflect actual economic reality.
 */
function classifyEconomicReality(state) {
  const cpi = Number(state.inflation_cpi ?? 2.0);
  const flexCpi = Number(state.flexible_cpi ?? cpi);
  const stickyCpi = Number(state.sticky_cpi ?? state.core_inflation ?? cpi);
  const rate = Number(state.interest_rate ?? 3.25);
  const lending = Number(state.bank_lending_rate ?? Number((rate + 2.5).toFixed(2)));
  const gdp = Number(state.gdp_growth ?? 2.1);
  const unemp = Number(state.unemployment_rate ?? 4.2);
  const realWage = Number(state.real_wage_growth ?? 0.2);
  const housing = Number(state.housing_cost_index ?? 130);
  const discontent = Number(state.poverty_discontent ?? 32);
  const confidence = Number(state.consumer_confidence ?? 62);
  const yield10y = Number(state.bond_yield_10y ?? 4.2);
  const yield2y = Number(state.bond_yield_2y ?? 3.6);
  const spread2s10s = Number((yield10y - yield2y).toFixed(2));
  const stocks = Number(state.stock_market_index ?? 5100);
  const parlApproval = Number(state.parliamentary_approval ?? 62);
  const pubApproval = Number(state.public_approval ?? 58);
  const debtToGdp = Number(state.debt_to_gdp ?? 95);
  const deficit = Number(state.fiscal_deficit ?? -3.2);
  const currency = Number(state.currency_index ?? 100);
  const econType = state.economy_type || 'large_hegemon';

  let inflationRegime = 'on_target';
  if (cpi < 1.35) {
    inflationRegime = 'deflation_risk';
  } else if (cpi <= 2.45 && stickyCpi <= 2.55) {
    inflationRegime = 'on_target';
  } else if (cpi <= 2.55 && stickyCpi > 2.55) {
    inflationRegime = 'sticky_divergence';
  } else if (cpi <= 3.35) {
    inflationRegime = 'moderately_above_target';
  } else if (cpi <= 5.0) {
    inflationRegime = 'elevated_inflation';
  } else {
    inflationRegime = 'severe_inflation';
  }

  let rateRegime = 'neutral_moderate';
  if (rate <= 2.5) rateRegime = 'accommodative';
  else if (rate <= 3.85) rateRegime = 'neutral_moderate';
  else if (rate <= 5.1) rateRegime = 'restrictive';
  else rateRegime = 'tight_punitive';

  let growthRegime = 'healthy_expansion';
  if (gdp < 0.25 || unemp >= 5.9) growthRegime = 'recession';
  else if (gdp < 1.45 || unemp >= 4.9) growthRegime = 'slowdown';
  else if (gdp <= 3.1 && unemp < 4.9) growthRegime = 'healthy_expansion';
  else growthRegime = 'boom_overheating';

  let wageRegime = 'flat_purchasing_power';
  if (realWage >= 0.4) wageRegime = 'rising_purchasing_power';
  else if (realWage <= -0.25) wageRegime = 'eroding_purchasing_power';

  let curveRegime = 'upward_normal';
  if (spread2s10s < -0.05) curveRegime = 'inverted';
  else if (spread2s10s <= 0.22) curveRegime = 'flat';

  let politicsRegime = 'pragmatic_scrutiny';
  if (parlApproval >= 68) politicsRegime = 'strong_bipartisan_support';
  else if (parlApproval < 45) politicsRegime = 'hostile_oversight';

  const isGoldilocks =
    inflationRegime === 'on_target' &&
    (growthRegime === 'healthy_expansion' || growthRegime === 'boom_overheating') &&
    unemp <= 4.75;

  const freshMpcSplit = Boolean(
    state.last_mpc_vote &&
    state.last_mpc_vote.just_voted === true &&
    state.last_mpc_vote.dissents >= 2
  );

  return {
    cpi,
    flexCpi,
    stickyCpi,
    rate,
    lending,
    gdp,
    unemp,
    realWage,
    housing,
    discontent,
    confidence,
    yield10y,
    yield2y,
    spread2s10s,
    stocks,
    parlApproval,
    pubApproval,
    debtToGdp,
    deficit,
    currency,
    econType,
    inflationRegime,
    rateRegime,
    growthRegime,
    wageRegime,
    curveRegime,
    politicsRegime,
    isGoldilocks,
    freshMpcSplit
  };
}

// Publisher editorial personas with distinct voices that adapt honestly to good, mixed, or bad data
const PUBLISHER_PROFILES = {
  gloomberg: {
    name: 'Gloomberg News',
    tagline: 'The Global Macro & Fixed Income Authority',
    dateline: 'NEW YORK / FINANCIAL CAPITAL',
    bylines: [
      'By Alistair Finch, Chief Economics Correspondent',
      'By Elena Rostova, Senior Sovereign Debt Strategist',
      'By Julian Sterling, Fixed Income & Macro Editor'
    ],
    editorialGuidance: `You are the Senior Fixed Income & Macro Correspondent at GLOOMBERG NEWS.
VOICE: Sharp, institutional, precise, speaking directly to sovereign bond desks, FX strategists, and central bank watchers.
ANTI-FORMULA & REALISM RULES:
- NEVER open with calendar cliches like "In Month X of Year Y..." or "The macroeconomic landscape entered Month X...".
- Open in media res on a trading desk, bond auction, repo screen, or macro research briefing.
- CALIBRATE YOUR TONE TO THE NUMBERS: When inflation is anchored near 2% and the yield curve is upward-sloping, write about soft-landing pricing, carry trades, term-premium stability, neutral-rate (r*) debates, or QT liquidity calibration—DO NOT invent fake market panics, fake sticky inflation, or fake curve inversions! Reserve alarmist urgency strictly for real dislocations.`
  },
  doll_street: {
    name: 'The Doll Street Journal',
    tagline: 'The Voice of Free Enterprise & Capital Markets',
    dateline: 'NEW YORK - DOLL STREET',
    bylines: [
      'By Victoria Vance, Wall Street Capital Markets Editor',
      'By Harrison Cole, Corporate Finance & Earnings Specialist',
      'By Arthur Pendelton, Doll Street Equities Columnist'
    ],
    editorialGuidance: `You are a Lead Capital Markets Columnist at THE DOLL STREET JOURNAL.
VOICE: Pro-enterprise, boardroom-plugged-in, fluent in M&A, CapEx, private credit, and equity multiples.
ANTI-FORMULA & REALISM RULES:
- NEVER open with dry summaries like "During Month X, the market saw...".
- Open inside a corporate boardroom, investment-bank deal pitch, earnings call, or asset-allocation committee.
- CALIBRATE YOUR TONE TO THE NUMBERS: When rates are moderate (~2.5-3.75%), inflation is near 2%, and GDP is expanding, executives are reviving M&A, greenlighting CapEx, expanding margins, or debating equity valuations—DO NOT falsely claim 3% base rates are freezing corporate finance! Reserve refinancing-cliff angst for genuinely restrictive credit (>6.5% lending) or recessions.`
  },
  gotham: {
    name: 'Gotham News Tribune',
    tagline: 'The People\'s Voice • Living Costs • Labor • Metro Realities',
    dateline: 'GOTHAM METRO',
    bylines: [
      'By Rosa Morales, Metro Living Standards & Labor Reporter',
      'By Terrell Jenkins, Urban Housing & Economy Desk',
      'By Clara Vance, Consumer Watchdog Columnist'
    ],
    editorialGuidance: `You are a Metro Labor, Housing & Living Standards Reporter at the GOTHAM NEWS TRIBUNE.
VOICE: Ground-level, human-centered, vivid street-level reporting with ordinary workers, small shopkeepers, commuters, and renters.
ANTI-FORMULA & REALISM RULES:
- NEVER open with econometric declarations like "Economic telemetry indicates...".
- Open at human scale: a neighborhood bakery, an apprentice hiring hall, a commuter platform, a lease-signing table, or a family kitchen.
- CALIBRATE YOUR TONE TO THE NUMBERS: If Headline CPI is near 2% and real wages are positive, DO NOT invent soaring supermarket receipts or claim inflation is devouring paychecks! Instead, report honestly that grocery prices have steadied and paychecks are finally stretching further—or, if the Housing Cost Index is elevated, specifically contrast steadier grocery bills against structural urban housing shortages without blaming non-existent food inflation.`
  },
  cashington: {
    name: 'The Cashington Post',
    tagline: 'Inside the Halls of Power & Parliament',
    dateline: 'PARLIAMENT HILL / CAPITOL',
    bylines: [
      'By Eleanor Sterling, Parliamentary & Treasury Bureau Chief',
      'By Thomas Croft, Senior Political Analyst',
      'By David Holloway, Congressional Affairs Correspondent'
    ],
    editorialGuidance: `You are the Parliamentary & Treasury Bureau Chief at THE CASHINGTON POST.
VOICE: Savvy political journalism, legislative strategy, coalition dynamics, and fiscal-monetary power plays.
ANTI-FORMULA & REALISM RULES:
- NEVER open with passive fiscal recitations like "The parliamentary environment in Month X was...".
- Open in committee corridors, Treasury ministerial briefings, party whip offices, or campaign war rooms.
- CALIBRATE YOUR TONE TO THE NUMBERS: When Parliamentary Approval is high (>68%) and inflation is near 2%, the Governor has formidable political capital—cover lawmakers vying to claim credit for the soft landing, partisan clashes over Treasury tax-and-spending priorities, or quiet debates over bank regulation. DO NOT fabricate parliamentary revolts against a popular Governor!`
  }
};

/**
 * Selects distinct, reality-grounded economic drivers for a specific publisher,
 * rotating angles across months so papers neither contradict the indicators nor repeat themselves.
 */
function selectPrimaryEconomicDrivers(state, publisherKey, year = 1, month = 1, context = {}) {
  const r = classifyEconomicReality(state);
  const turnIdx = (year - 1) * 12 + month;
  const activeEvent = state.active_events && state.active_events.length > 0 ? state.active_events[0] : null;
  const lastAction = context.lastAction || null;
  const candidates = [];

  // 1. Genuine Taper Tantrum / Guidance Flip-Flop (only happens in the exact month of flip-flop)
  if (state.credibility_warning && (publisherKey === 'gloomberg' || publisherKey === 'cashington')) {
    candidates.push({
      metric: 'Forward Guidance Credibility Shock',
      detail: state.credibility_warning,
      urgency: 'critical',
      suggestedTone: 'alarmist',
      priority: 100
    });
  }

  // 2. Fresh MPC Split — ONLY on the month the MPC actually voted, and primarily for Gloomberg
  if (r.freshMpcSplit && publisherKey === 'gloomberg') {
    candidates.push({
      metric: 'Monetary Policy Committee Division',
      detail: `Fresh MPC vote ended ${state.last_mpc_vote.tally_label} (${state.last_mpc_vote.hawkish_dissents} hawkish, ${state.last_mpc_vote.dovish_dissents} dovish dissents) at a ${r.rate}% policy rate with CPI at ${r.cpi}%`,
      urgency: state.last_mpc_vote.dissents >= 3 ? 'high' : 'medium',
      suggestedTone: state.last_mpc_vote.hawkish_dissents > state.last_mpc_vote.dovish_dissents ? 'hawkish' : 'dovish',
      priority: 88
    });
  }

  // 3. Active Macroeconomic Shock / Boom Event (give one relevant angle per paper)
  if (activeEvent) {
    const isNeg = activeEvent.polarity === 'Negative';
    if (publisherKey === 'gloomberg' && turnIdx % 2 === 0) {
      candidates.push({
        metric: `Macro Shock Pricing: ${activeEvent.name}`,
        detail: `${activeEvent.name} (${activeEvent.summary}) reshaping sovereign yield and inflation-swap pricing while headline CPI sits at ${r.cpi}%`,
        urgency: isNeg ? 'high' : 'medium',
        suggestedTone: isNeg ? 'hawkish' : 'bullish',
        priority: 76
      });
    } else if (publisherKey === 'doll_street' && turnIdx % 2 === 1) {
      candidates.push({
        metric: `Corporate Impact: ${activeEvent.name}`,
        detail: `Executives recalibrate earnings guidance around ${activeEvent.name} (${activeEvent.summary}) with Doll Street at ${r.stocks} pts`,
        urgency: isNeg ? 'high' : 'medium',
        suggestedTone: isNeg ? 'critical' : 'bullish',
        priority: 76
      });
    }
  }

  // 4. Publisher-Specific Reality-Checked Beats
  if (publisherKey === 'gloomberg') {
    // Open-economy FX / Spread angle when relevant
    if (r.econType !== 'large_hegemon' && (state.sovereign_risk_spread > 150 || r.currency < 95)) {
      candidates.push({
        metric: 'Sovereign Risk Spread & FX Defense',
        detail: `Domestic currency at ${r.currency} with sovereign risk spread at ${state.sovereign_risk_spread} bps over global benchmarks and FX reserves at $${state.fx_reserves_billions}B`,
        urgency: 'high',
        suggestedTone: 'hawkish',
        priority: 84
      });
    }

    if (r.curveRegime === 'inverted') {
      candidates.push({
        metric: 'Sovereign Yield Curve Inversion',
        detail: `2Y yield (${r.yield2y}%) trades ${Math.abs(r.spread2s10s).toFixed(2)}% ABOVE 10Y yield (${r.yield10y}%), signaling bond market recession bets`,
        urgency: 'high',
        suggestedTone: 'hawkish',
        priority: 82
      });
    }

    if (r.inflationRegime === 'elevated_inflation' || r.inflationRegime === 'severe_inflation') {
      candidates.push({
        metric: 'Above-Target Inflation Persistence',
        detail: `Headline CPI running hot at ${r.cpi}% (Sticky services: ${r.stickyCpi}%, Flexible goods: ${r.flexCpi}%) well above the 2.0% target`,
        urgency: r.cpi > 5.0 ? 'critical' : 'high',
        suggestedTone: 'hawkish',
        priority: 85
      });
    } else if (r.inflationRegime === 'moderately_above_target' || r.inflationRegime === 'sticky_divergence') {
      candidates.push({
        metric: 'Last-Mile Disinflation Calibration',
        detail: `Headline CPI at ${r.cpi}% with sticky core at ${r.stickyCpi}%—traders debate the final stretch back to 2.0%`,
        urgency: 'medium',
        suggestedTone: 'neutral',
        priority: 68
      });
    } else if (r.inflationRegime === 'deflation_risk') {
      candidates.push({
        metric: 'Below-Target Disinflation & Undershoot Risk',
        detail: `Headline CPI has cooled to ${r.cpi}%, below the 2.0% mandate, prompting bond desks to price rate cuts`,
        urgency: 'medium',
        suggestedTone: 'dovish',
        priority: 74
      });
    }

    if (r.growthRegime === 'recession' || r.growthRegime === 'slowdown') {
      candidates.push({
        metric: 'Macroeconomic Growth Deceleration',
        detail: `Annualized real GDP growth slowing at ${r.gdp}% with unemployment at ${r.unemp}%, driving demand for duration`,
        urgency: r.growthRegime === 'recession' ? 'high' : 'medium',
        suggestedTone: 'dovish',
        priority: 75
      });
    }

    // Healthy / Goldilocks / Anchored angles (varied rotation!)
    if (r.inflationRegime === 'on_target') {
      const calmAngles = [
        {
          metric: 'Soft-Landing Equilibrium & Term Premium',
          detail: `Inflation anchored on target at ${r.cpi}% (sticky core ${r.stickyCpi}%) alongside ${r.gdp}% GDP growth and a normal +${r.spread2s10s}% upward-sloping 2s10s curve (${r.yield2y}% vs ${r.yield10y}%)`,
          urgency: 'low',
          suggestedTone: 'neutral',
          priority: 65
        },
        {
          metric: 'Balance Sheet Runoff & Neutral Rate Debate',
          detail: `With CPI steady at ${r.cpi}% and the policy rate at ${r.rate}%, fixed-income strategists debate the long-run neutral rate and -$${Math.abs(state.qt_monthly_pace || 25)}B/mo QT runoff`,
          urgency: 'low',
          suggestedTone: 'neutral',
          priority: 64
        },
        {
          metric: 'Sovereign Bond Demand & Carry Stability',
          detail: `Orderly sovereign auctions clear smoothly at ${r.yield10y}% 10Y yields as ${r.cpi}% inflation anchors institutional duration demand`,
          urgency: 'low',
          suggestedTone: 'bullish',
          priority: 63
        }
      ];
      candidates.push(calmAngles[turnIdx % calmAngles.length]);
    }
  } else if (publisherKey === 'doll_street') {
    if (r.lending >= 6.8) {
      candidates.push({
        metric: 'High Commercial Borrowing Costs & Refinancing Squeeze',
        detail: `Prime commercial loan rates at ${r.lending}% (policy rate ${r.rate}%) pressuring leveraged corporate balance sheets`,
        urgency: 'high',
        suggestedTone: 'critical',
        priority: 82
      });
    }

    if (r.growthRegime === 'recession') {
      candidates.push({
        metric: 'Earnings Downgrades & Demand Contraction',
        detail: `GDP growth down to ${r.gdp}% with equities at ${r.stocks} pts as industrial order books contract`,
        urgency: 'high',
        suggestedTone: 'dovish',
        priority: 84
      });
    }

    if (r.isGoldilocks || (r.rateRegime !== 'tight_punitive' && r.growthRegime === 'healthy_expansion')) {
      const corpAngles = [
        {
          metric: 'Corporate CapEx & Dealmaking Revival',
          detail: `Moderate ${r.rate}% policy rates (${r.lending}% commercial credit), ${r.cpi}% tame inflation, and ${r.gdp}% GDP growth unlock M&A pipelines with Doll Street at ${r.stocks} pts`,
          urgency: 'low',
          suggestedTone: 'bullish',
          priority: 70
        },
        {
          metric: 'Operating Margins & Productivity Expansion',
          detail: `With input price inflation cooled to ${r.flexCpi}% and real consumer demand expanding ${r.gdp}%, CFOs report healthier operating margins as Doll Street trades at ${r.stocks} pts`,
          urgency: 'low',
          suggestedTone: r.stocks >= 5100 ? 'bullish' : 'neutral',
          priority: 69
        },
        {
          metric: 'Equity Valuations & Mid-Cap Credit Access',
          detail: `Asset managers weigh ${r.stocks}-point equity multiples against ${r.yield10y}% 10-year Treasury yields in a stable ${r.rate}% base-rate regime`,
          urgency: 'low',
          suggestedTone: 'neutral',
          priority: 68
        }
      ];
      candidates.push(corpAngles[turnIdx % corpAngles.length]);
    } else if (r.stocks > 5450) {
      candidates.push({
        metric: 'Doll Street Equity Rally',
        detail: `Doll Street Index climbs to ${r.stocks} pts as large-cap earnings outperform expectations`,
        urgency: 'low',
        suggestedTone: 'bullish',
        priority: 66
      });
    } else {
      candidates.push({
        metric: 'Corporate Capital Allocation & Credit Spreads',
        detail: `Doll Street at ${r.stocks} pts as CFOs balance ${r.lending}% commercial borrowing costs against ${r.gdp}% GDP demand`,
        urgency: 'medium',
        suggestedTone: 'neutral',
        priority: 60
      });
    }
  } else if (publisherKey === 'gotham') {
    if (r.inflationRegime === 'elevated_inflation' || r.inflationRegime === 'severe_inflation') {
      candidates.push({
        metric: 'Neighborhood Cost-of-Living Squeeze',
        detail: `Headline CPI at ${r.cpi}% (flexible goods ${r.flexCpi}%) straining household grocery and utility budgets, with real wage growth at ${r.realWage}%`,
        urgency: r.cpi > 5.0 ? 'critical' : 'high',
        suggestedTone: 'critical',
        priority: 86
      });
    } else if (r.unemp >= 5.0) {
      candidates.push({
        metric: 'Municipal Layoffs & Hiring Slowdown',
        detail: `Unemployment elevated at ${r.unemp}% as working-class neighborhoods feel slower shift hours and hiring freezes`,
        urgency: 'high',
        suggestedTone: 'dovish',
        priority: 84
      });
    } else if (r.wageRegime === 'eroding_purchasing_power') {
      candidates.push({
        metric: 'Paycheck Purchasing Power Lag',
        detail: `Real wages slipping ${r.realWage}% behind living costs even as unemployment sits at ${r.unemp}%`,
        urgency: 'medium',
        suggestedTone: 'critical',
        priority: 76
      });
    } else if (r.inflationRegime === 'on_target' && r.wageRegime === 'rising_purchasing_power') {
      // Inflation is ~2% AND real wages are rising! Reflect reality honestly!
      if (r.housing > 144 && turnIdx % 3 === 0) {
        candidates.push({
          metric: 'Steady Grocery Aisles vs. Urban Housing Supply Bottleneck',
          detail: `Everyday grocery and utility inflation has cooled to ${r.cpi}% and real wages are UP +${r.realWage}%, yet structural metro housing shortages keep the Housing Cost Index at ${r.housing}`,
          urgency: 'medium',
          suggestedTone: 'neutral',
          priority: 71
        });
      } else {
        const mainStreetGoodAngles = [
          {
            metric: 'Real Paycheck Recovery & Main Street Relief',
            detail: `With CPI anchored at ${r.cpi}% and real wages growing +${r.realWage}%, working families see paychecks outpace prices and consumer confidence climb to ${r.confidence}`,
            urgency: 'low',
            suggestedTone: 'bullish',
            priority: 72
          },
          {
            metric: 'Neighborhood Small Business & Hiring Steadiness',
            detail: `Unemployment steady at ${r.unemp}%, social discontent low at ${r.discontent}/100, and ${r.cpi}% price stability revive local diner and retail foot traffic`,
            urgency: 'low',
            suggestedTone: 'neutral',
            priority: 70
          }
        ];
        candidates.push(mainStreetGoodAngles[turnIdx % mainStreetGoodAngles.length]);
      }
    } else if (r.housing > 150) {
      candidates.push({
        metric: 'Metropolitan Housing & Mortgage Affordability',
        detail: `Housing Cost Index at ${r.housing} with ${r.lending}% mortgage rates testing first-time buyers despite ${r.cpi}% headline CPI`,
        urgency: 'medium',
        suggestedTone: 'critical',
        priority: 68
      });
    } else {
      candidates.push({
        metric: 'Household Budgets & Local Labor Conditions',
        detail: `Headline CPI at ${r.cpi}%, unemployment at ${r.unemp}%, real wage growth ${r.realWage}%, and consumer confidence at ${r.confidence}`,
        urgency: 'low',
        suggestedTone: 'neutral',
        priority: 60
      });
    }
  } else if (publisherKey === 'cashington') {
    if (r.politicsRegime === 'hostile_oversight') {
      candidates.push({
        metric: 'Parliamentary Select Committee Hostility',
        detail: `Governor's parliamentary approval down to ${r.parlApproval}% (warnings: ${state.warning_count || 0}/3), fueling hostile oversight threats`,
        urgency: r.parlApproval < 32 ? 'critical' : 'high',
        suggestedTone: 'critical',
        priority: 88
      });
    } else if (r.politicsRegime === 'strong_bipartisan_support' && r.inflationRegime === 'on_target') {
      const capitolCalmAngles = [
        {
          metric: 'Governor\'s High Parliamentary Standing & Soft-Landing Credit',
          detail: `With parliamentary approval strong at ${r.parlApproval}% and inflation on target at ${r.cpi}%, coalition and opposition MPs jostle to claim credit ${state.months_to_election} months before elections`,
          urgency: 'low',
          suggestedTone: 'neutral',
          priority: 73
        },
        {
          metric: 'Parliamentary Fiscal Debate Shifts to Budget Priorities',
          detail: `Price stability (${r.cpi}% CPI) and moderate ${r.rate}% policy rates ease central bank heat (${r.parlApproval}% approval), shifting Capitol clashes toward the ${r.deficit}% fiscal deficit and ${r.debtToGdp}% debt-to-GDP`,
          urgency: 'low',
          suggestedTone: 'neutral',
          priority: 72
        },
        {
          metric: 'Banking Supervision & Legislative Reform Agenda',
          detail: `Enjoying ${r.parlApproval}% parliamentary confidence and ${r.pubApproval}% public support, the Central Bank navigates bipartisan talks on credit competition and industrial growth (${r.gdp}% GDP)`,
          urgency: 'low',
          suggestedTone: 'bullish',
          priority: 71
        }
      ];
      candidates.push(capitolCalmAngles[turnIdx % capitolCalmAngles.length]);
    } else if (state.months_to_election <= 16) {
      candidates.push({
        metric: 'Pre-Election Monetary Scrutiny',
        detail: `With ${state.months_to_election} months until parliamentary elections and approval at ${r.parlApproval}%, lawmakers scrutinize how ${r.rate}% rates affect swing-seat voters`,
        urgency: 'medium',
        suggestedTone: 'neutral',
        priority: 69
      });
    } else {
      candidates.push({
        metric: 'Treasury-Central Bank Fiscal Coordination Debate',
        detail: `Parliamentary approval stands at ${r.parlApproval}% as MPs weigh the ${r.deficit}% fiscal deficit, ${r.debtToGdp}% debt-to-GDP, and ${r.rate}% policy rate`,
        urgency: 'medium',
        suggestedTone: 'neutral',
        priority: 64
      });
    }
  }

  // Incorporate forward-guidance / rate action context when significant
  if (lastAction && lastAction.action_type === 'mpc_rate_decision' && parseInt(lastAction.action_value, 10) !== 0 && publisherKey === 'doll_street') {
    const bps = parseInt(lastAction.action_value, 10);
    candidates.unshift({
      metric: bps > 0 ? `Central Bank +${bps} bps Rate Hike` : `Central Bank ${bps} bps Rate Cut`,
      detail: `MPC moved the policy rate by ${bps > 0 ? '+' : ''}${bps} bps to ${r.rate}% (CPI at ${r.cpi}%, GDP at ${r.gdp}%)`,
      urgency: Math.abs(bps) >= 50 ? 'high' : 'medium',
      suggestedTone: bps > 0 ? 'hawkish' : 'bullish',
      priority: 83
    });
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.length > 0
    ? candidates.slice(0, 2)
    : [{
        metric: 'Macroeconomic Equilibrium',
        detail: `Policy rate ${r.rate}%, Headline CPI ${r.cpi}%, GDP Growth ${r.gdp}%`,
        urgency: 'low',
        suggestedTone: 'neutral',
        priority: 50
      }];
}

function buildFactCheckGuardrails(state, r) {
  const rules = [
    `- Ground all narrative claims strictly in the live numbers below (do not meta-reference these editorial checks in quotes).`
  ];

  if (r.inflationRegime === 'on_target') {
    rules.push(`- Inflation is anchored at target (${r.cpi}% headline, ${r.flexCpi}% flexible goods, ${r.stickyCpi}% sticky core vs 2.0% goal): portray consumer and wholesale prices as steady and well-behaved, never surging.`);
  } else if (r.inflationRegime === 'deflation_risk') {
    rules.push(`- Inflation is below the 2.0% mandate (${r.cpi}%): portray prices as cool/disinflationary, never overheating.`);
  } else if (r.inflationRegime === 'moderately_above_target' || r.inflationRegime === 'sticky_divergence') {
    rules.push(`- Inflation is mildly warm (${r.cpi}% headline, ${r.stickyCpi}% sticky): frame it as nuanced last-mile calibration rather than runaway inflation.`);
  }

  if (r.curveRegime === 'upward_normal') {
    rules.push(`- The 2s10s yield curve slopes upward normally (+${r.spread2s10s}%, with 10Y at ${r.yield10y}% above 2Y at ${r.yield2y}%): never describe the curve as inverted.`);
  } else if (r.curveRegime === 'inverted') {
    rules.push(`- The 2s10s yield curve is genuinely inverted (2Y at ${r.yield2y}% exceeds 10Y at ${r.yield10y}%).`);
  }

  if (r.wageRegime === 'rising_purchasing_power') {
    rules.push(`- Real wages are expanding (+${r.realWage}%): workers' paychecks are outpacing inflation.`);
  }

  if (r.rateRegime === 'accommodative' || r.rateRegime === 'neutral_moderate') {
    rules.push(`- Borrowing conditions are moderate (${r.rate}% policy rate, ${r.lending}% commercial lending): avoid calling rates punitive or crushing.`);
  }

  if (r.politicsRegime === 'strong_bipartisan_support') {
    rules.push(`- The Governor enjoys broad political confidence (${r.parlApproval}% parliamentary approval, ${r.pubApproval}% public approval): avoid inventing parliamentary mutinies against the Chair.`);
  }

  if (!r.freshMpcSplit) {
    rules.push(`- This is an inter-meeting month with no new MPC rate vote: focus on market, household, or fiscal developments rather than inventing a fresh committee vote.`);
  }

  return rules.join('\n');
}

// Helper to get system settings
function getSystemSetting(key) {
  try {
    const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
    return row ? row.value : null;
  } catch (err) {
    return null;
  }
}

// Generate articles for the active month based on difficulty concurrently in parallel
async function generateMonthlyNews(economicState, difficulty, year, month, context = {}) {
  const publishers = ['gloomberg', 'doll_street'];
  if (difficulty === 'normal' || difficulty === 'hard') {
    publishers.push('gotham');
  }
  if (difficulty === 'hard') {
    publishers.push('cashington');
  }

  const provider = getSystemSetting('llm_provider') || 'deepseek_flash';
  const apiKey = getSystemSetting('deepseek_api_key') || process.env.DEEPSEEK_API_KEY;

  if (!apiKey || apiKey.trim().length <= 5 || provider === 'local_only') {
    return publishers.map(pub => generateWithLocalMacroEngine(pub, economicState, year, month, context));
  }

  const articlePromises = publishers.map(async (pub) => {
    try {
      return await generateWithDeepSeek(pub, economicState, year, month, apiKey, context);
    } catch (err) {
      console.warn(`DeepSeek generation failed for ${pub}, falling back to local macro engine:`, err.message);
      return generateWithLocalMacroEngine(pub, economicState, year, month, context);
    }
  });

  const results = await Promise.allSettled(articlePromises);
  return results.map((res, idx) => {
    if (res.status === 'fulfilled' && res.value) {
      return res.value;
    }
    return generateWithLocalMacroEngine(publishers[idx], economicState, year, month, context);
  });
}

// DeepSeek API integration with strict reality guardrails, varied styles, and anti-repetition
async function generateWithDeepSeek(publisherKey, state, year, month, apiKey, context = {}) {
  const profile = PUBLISHER_PROFILES[publisherKey];
  const customNewsModel = getSystemSetting('news_model');
  const model = customNewsModel || 'deepseek-chat';

  const reality = classifyEconomicReality(state);
  const drivers = selectPrimaryEconomicDrivers(state, publisherKey, year, month, context);
  const primaryDriver = drivers[0];
  const factChecks = buildFactCheckGuardrails(state, reality);

  const pubRecentHeadlines = (context.recentHeadlines || [])
    .filter(h => h.publisher === publisherKey)
    .slice(0, 3)
    .map(h => `"${h.headline}"`);

  const antiRepeatNote = pubRecentHeadlines.length > 0
    ? `\nRECENT HEADLINES FROM THIS PAPER (DO NOT REPEAT THESE ANGLES, PHRASES, OR CHARACTERS):\n- ${pubRecentHeadlines.join('\n- ')}`
    : '';

  const systemPrompt = `${profile.editorialGuidance}
You write rigorous, varied, non-formulaic financial journalism between 230 and 380 words.
CRITICAL EDITORIAL STANDARDS:
1. NEVER reproduce formulaic boilerplate or robotic opening sentences.
2. Focus on the selected primary economic driver AND strictly obey every item in MANDATORY FACTUAL GUARDRAILS. Your article's mood, ire, optimism, or calm MUST match the actual numbers!
3. NEVER cite internal event codes (e.g. do not write "POS-12" or "NEG-05"); refer to events only by their natural real-world names.
4. Provide authentic stakeholder voices and fresh, non-recycled character names.
5. Format your output strictly as a JSON object with keys:
  - "headline": string (punchy, accurate headline reflecting actual indicator reality)
  - "body": string (multi-paragraph news story separated by \\n\\n)
  - "tone": ("hawkish"|"dovish"|"alarmist"|"bullish"|"critical"|"neutral") — suggested for current data: "${primaryDriver.suggestedTone || 'neutral'}"
  - "urgency": ("low"|"medium"|"high"|"critical") — suggested for current data: "${primaryDriver.urgency || 'low'}"
  - "featured_variable": string
  - "byline": string
  - "dateline": string
  - "whisper_quote": string (a short, pungent market/street/hallway quote that matches current data)`;

  const activeEventsClean = (state.active_events && state.active_events.length > 0)
    ? state.active_events.map(e => `${e.name} (${e.summary})`).join('; ')
    : 'None';

  const userPrompt = `EDITION: Year ${year}, Month ${month}.
PUBLISHER: ${profile.name}
PRIMARY STORY ASSIGNMENT:
${drivers.map(d => `- [URGENCY: ${d.urgency.toUpperCase()}] ${d.metric}: ${d.detail}`).join('\n')}

MANDATORY FACTUAL GUARDRAILS (DO NOT VIOLATE):
${factChecks}${antiRepeatNote}

LIVE MACROECONOMIC SNAPSHOT:
- Policy Rate: ${reality.rate}% | Commercial Bank Lending: ${reality.lending}%
- Inflation: Headline CPI ${reality.cpi}% (2.0% Target) | Flexible Goods: ${reality.flexCpi}% | Sticky Core: ${reality.stickyCpi}%
- Real Economy: GDP Growth ${reality.gdp}% | Unemployment: ${reality.unemp}% | Real Wage Growth: ${reality.realWage > 0 ? '+' : ''}${reality.realWage}%
- Markets: Doll Street ${reality.stocks} pts | 10Y Yield: ${reality.yield10y}% | 2Y Yield: ${reality.yield2y}% (2s10s Spread: ${reality.spread2s10s > 0 ? '+' : ''}${reality.spread2s10s}%)
- Household & Politics: Housing Index ${reality.housing} | Consumer Confidence ${reality.confidence} | Parliamentary Approval ${reality.parlApproval}% | Public Approval ${reality.pubApproval}%
- Fiscal: Deficit ${reality.deficit}% of GDP | Debt-to-GDP ${reality.debtToGdp}% | Months to Election: ${state.months_to_election}
- Active Macro Events: ${activeEventsClean}

Write an engaging, accurate story for ${profile.name} whose tone and urgency honestly reflect these numbers.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.72,
      max_tokens: 1100
    }),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error('DeepSeek returned empty content');
  }

  const parsed = JSON.parse(rawContent);

  // Enforce urgency sanity: never mark a calm Goldilocks story as critical unless there's an actual credibility shock
  let safeUrgency = parsed.urgency || primaryDriver.urgency || 'medium';
  if (reality.isGoldilocks && !state.credibility_warning && !reality.freshMpcSplit && (safeUrgency === 'critical' || safeUrgency === 'high')) {
    safeUrgency = 'low';
  }

  return {
    publisher: publisherKey,
    headline: parsed.headline || 'Economic Horizon Shifts',
    body: parsed.body || 'Financial markets digest incoming economic data.',
    tone: parsed.tone || primaryDriver.suggestedTone || 'neutral',
    urgency: safeUrgency,
    featured_variable: parsed.featured_variable || primaryDriver.metric,
    byline: parsed.byline || profile.bylines[(year + month) % profile.bylines.length],
    dateline: parsed.dateline || profile.dateline,
    whisper_quote: parsed.whisper_quote || 'Market desks weigh incoming telemetry.'
  };
}

// Built-in Macroeconomic Editorial Engine (Varied, indicator-faithful multi-regime journalism)
function generateWithLocalMacroEngine(publisherKey, state, year, month, context = {}) {
  const profile = PUBLISHER_PROFILES[publisherKey];
  const r = classifyEconomicReality(state);
  const activeEvent = state.active_events && state.active_events.length > 0 ? state.active_events[0] : null;
  const mpcVote = state.last_mpc_vote;
  const turnIdx = (year - 1) * 12 + month;
  const byline = profile.bylines[turnIdx % profile.bylines.length];
  const dateline = profile.dateline;

  let headline = '';
  let body = '';
  let tone = 'neutral';
  let urgency = 'low';
  let featuredVar = 'inflation_cpi';
  let whisperQuote = '';

  // =========================================================================
  // 1. GLOOMBERG NEWS (Macro, Sovereign Curves, Rates & Liquidity)
  // =========================================================================
  if (publisherKey === 'gloomberg') {
    featuredVar = 'bond_yield_10y';

    if (state.credibility_warning) {
      headline = `Front-End Bond Desks Reel as Guidance Reversal Whipsaws Two-Year Paper`;
      tone = 'alarmist';
      urgency = 'critical';
      whisperQuote = `"The tape went dark for ninety seconds. When forward guidance points one way and policy moves the other, liquidity evaporates."`;
      body = `Proprietary rates desks widened bid-ask spreads across short-dated sovereign notes this morning after an unexpected central bank policy pivot caught leveraged swaps traders wrong-footed. Two-year yields jumped sharply to ${r.yield2y}%, triggering margin calls across relative-value macro funds.

"Market makers price inventory off central bank forward guidance," said Marcus Vance, head of sovereign rates trading. "When the signalling framework breaks, dealers pull balance sheet capacity until volatility settles."

Benchmark 10-year paper closed at ${r.yield10y}% as institutional asset managers trimmed duration risk and awaited fresh communications from the Governor's office.`;

    } else if (r.freshMpcSplit) {
      headline = `MPC Votes ${mpcVote.tally_label} on ${r.rate}% Rate as Members Debate Next Phase`;
      tone = mpcVote.hawkish_dissents >= mpcVote.dovish_dissents ? 'hawkish' : 'dovish';
      urgency = mpcVote.dissents >= 3 ? 'high' : 'medium';
      whisperQuote = `"A ${mpcVote.tally_label} print tells the swaps desk that every upcoming data release is live."`;
      body = `Minutes from this month's Monetary Policy Committee decision revealed a ${mpcVote.tally_label} split as policymakers set the benchmark rate at ${r.rate}% amid ${r.cpi}% headline inflation and ${r.gdp}% annualized GDP growth.

${mpcVote.hawkish_dissents > 0 ? `The ${mpcVote.hawkish_dissents} hawkish dissenter(s) argued for firmer rates given ${r.gdp}% output momentum and ${r.stickyCpi}% core services inflation.` : ''} ${mpcVote.dovish_dissents > 0 ? `Meanwhile, ${mpcVote.dovish_dissents} dovish member(s) favored faster accommodation to cushion credit-sensitive sectors.` : ''}

Overnight index swaps adjusted modestly following the release, with 2-year sovereign yields settling at ${r.yield2y}% against ${r.yield10y}% on the 10-year benchmark.`;

    } else if (r.econType !== 'large_hegemon' && (state.sovereign_risk_spread > 150 || r.currency < 95)) {
      featuredVar = 'currency_index';
      headline = `FX Desks Test Domestic Currency at ${r.currency} as Sovereign Spread Hits ${state.sovereign_risk_spread} bps`;
      tone = 'hawkish';
      urgency = 'high';
      whisperQuote = `"Open economies don't set rates in a vacuum—cross-border carry desks watch reserve adequacy every afternoon."`;
      body = `Foreign exchange dealers pressed the domestic currency index to ${r.currency} this week as sovereign risk spreads widened to ${state.sovereign_risk_spread} basis points over global reserve benchmarks.

With foreign exchange reserves standing at $${state.fx_reserves_billions}B and domestic policy rates at ${r.rate}%, emerging and open-economy portfolio managers weighed imported price pass-through against external yields.

"Maintaining rate credibility and reserve buffers is paramount when global capital flows turn selective," noted Elena Rostova, senior sovereign strategist.`;

    } else if (r.curveRegime === 'inverted') {
      headline = `Yield Curve Inversion Reaches ${Math.abs(r.spread2s10s).toFixed(2)}% as Bond Desks Price Cyclical Cooling`;
      tone = 'hawkish';
      urgency = 'high';
      whisperQuote = `"Short bills out-yielding ten-year bonds is the bond market's classic warning flare on late-cycle tightness."`;
      body = `Two-year sovereign notes closed at ${r.yield2y}%, trading ${Math.abs(r.spread2s10s).toFixed(2)} percentage points above the ${r.yield10y}% 10-year benchmark as fixed-income portfolios locked in long-duration yields ahead of projected growth moderation.

Historically, sustained inversions compress net interest margins for regional lenders and signal expectations that policy rates—currently ${r.rate}%—will eventually ease once cyclical headwinds mature.

Primary dealers reported brisk pension-fund demand at the long end of the curve even as money-market funds absorbed short-dated Treasury bills.`;

    } else if (r.inflationRegime === 'elevated_inflation' || r.inflationRegime === 'severe_inflation') {
      featuredVar = 'inflation_cpi';
      headline = `Inflation Breakevens Climb as ${r.cpi}% CPI Tests Central Bank Resolve`;
      tone = 'hawkish';
      urgency = r.cpi > 5.0 ? 'critical' : 'high';
      whisperQuote = `"Until sticky services break decisively toward 2%, real-money bond buyers will demand extra inflation protection."`;
      body = `Inflation-linked swap rates pushed higher across sovereign trading floors after headline CPI registered ${r.cpi}%, with sticky services at ${r.stickyCpi}% and flexible goods at ${r.flexCpi}%.

With the policy rate at ${r.rate}%, fixed-income strategists warned that real policy restraint remains under scrutiny. Ten-year sovereign yields traded at ${r.yield10y}% as auction participants demanded firmer compensation for inflation uncertainty.

"Bond vigilantes aren't panicked, but they are unforgiving when headline prints stay north of three percent," said Alistair Finch, chief economics correspondent.`;

    } else if (r.growthRegime === 'recession' || r.growthRegime === 'slowdown') {
      featuredVar = 'gdp_growth';
      headline = `Duration Rally Gains Steam as ${r.gdp}% GDP Growth Tilts Odds Toward Easing`;
      tone = 'dovish';
      urgency = 'medium';
      whisperQuote = `"Macro funds are rotating out of cyclicals and buying the belly of the bond curve as growth cools."`;
      body = `Sovereign bond prices firmed across intermediate maturities as annualized real GDP growth moderated to ${r.gdp}% and unemployment registered ${r.unemp}%.

With headline inflation at ${r.cpi}% and the benchmark rate at ${r.rate}%, rate-futures traders increased bets that policymakers will prioritize buffering domestic demand over coming quarters.

Ten-year yields stood at ${r.yield10y}% against ${r.yield2y}% on two-year notes, reflecting orderly safe-haven flows into government debt.`;

    } else {
      // On-target / Balanced / Goldilocks rotation (3 distinct stories!)
      const variant = turnIdx % 3;
      if (variant === 0) {
        headline = `Soft-Landing Pricing Holds Firm as ${r.cpi}% Inflation Anchors Yield Curve`;
        tone = 'neutral';
        urgency = 'low';
        whisperQuote = `"Inflation at ${r.cpi}%, growth at ${r.gdp}%, and an upward-sloping +${r.spread2s10s}% curve—macro desks call this carry nirvana."`;
        body = `Sovereign debt markets traded with remarkably low implied volatility this week as headline CPI settled at ${r.cpi}%—squarely aligned with the central bank's 2.0% mandate—while sticky core services held at ${r.stickyCpi}%.

The benchmark yield curve maintained a healthy positive slope of +${r.spread2s10s} percentage points, with two-year notes at ${r.yield2y}% and ten-year bonds at ${r.yield10y}%. Institutional bond buyers absorbed Treasury supply at tight auction tails without dealer indigestion.

"For the first time in several quarters, neither runaway inflation nor imminent recession dominates client calls," noted Julian Sterling, fixed-income editor. "With the policy rate at ${r.rate}% and GDP expanding ${r.gdp}%, traders see policy sitting comfortably near neutral."`;
      } else if (variant === 1) {
        headline = `With Price Stability Secured at ${r.cpi}%, Bond Strategists Debate Long-Run Neutral Rate`;
        tone = 'neutral';
        urgency = 'low';
        whisperQuote = `"The inflation battle is won for now; the intellectual debate on the street is whether r-star sits at one percent or higher."`;
        body = `As consumer price growth tracks quietly at ${r.cpi}% and flexible goods inflation sits at ${r.flexCpi}%, research desks across the financial district have shifted focus from inflation firefighting to estimating the economy's equilibrium interest rate.

The central bank's ${r.rate}% policy rate and -$${Math.abs(state.qt_monthly_pace || 25)}B monthly balance-sheet runoff have coincided with steady ${r.gdp}% real GDP growth and ${r.unemp}% unemployment, suggesting monetary settings are neither choking credit nor overheating demand.

Repo market plumbing remained smooth throughout month-end settlement, giving policymakers ample breathing room ahead of the next quarterly assessment.`;
      } else {
        headline = `Foreign Real-Money Funds Add Domestic Bonds on ${r.cpi}% CPI Credibility`;
        tone = 'bullish';
        urgency = 'low';
        whisperQuote = `"Predictable central banking attracts patient capital—pension funds love a boring two-percent inflation print."`;
        body = `Custodial flow data from major clearing banks showed steady institutional inflows into domestic sovereign debt this month, underpinned by central bank market credibility of ${state.market_credibility || 78}/100 and on-target ${r.cpi}% inflation.

Ten-year yields at ${r.yield10y}% continue to offer attractive positive real returns above ${r.cpi}% inflation, while two-year notes anchored at ${r.yield2y}% reflect calm forward rate expectations around the ${r.rate}% policy benchmark.

${activeEvent ? `Analysts are also tracking ${activeEvent.name}, though core price expectations remain firmly moored.` : `Strategists expect cross-border bond allocations to remain supportive so long as core inflation stays near two percent.`}`;
      }
    }

  // =========================================================================
  // 2. THE DOLL STREET JOURNAL (Capital Markets, CFOs, Equities & Credit)
  // =========================================================================
  } else if (publisherKey === 'doll_street') {
    featuredVar = 'stock_market_index';

    if (r.lending >= 6.8) {
      headline = `CFOs Shelve Leveraged Buyouts as ${r.lending}% Commercial Credit Bites`;
      tone = 'critical';
      urgency = 'high';
      whisperQuote = `"Private equity debt math breaks down near seven percent. Sponsors are parking capital until credit thaws."`;
      body = `Corporate finance committees are deferring debt-funded acquisitions as prime commercial borrowing rates of ${r.lending}%—anchored off a ${r.rate}% central bank rate—force treasurers to prioritize interest coverage over expansion.

Mid-market industrial borrowers report tighter bank syndicate covenants, with Doll Street equities trading at ${r.stocks} points as analysts trim earnings multiples on capital-intensive manufacturers.

"High hurdle rates separate cash-rich incumbents from leveraged challengers," said Harrison Cole, corporate finance specialist.`;

    } else if (r.growthRegime === 'recession') {
      headline = `Boardrooms Trim Guidance as ${r.gdp}% GDP Contraction Weighs on Doll Street`;
      tone = 'dovish';
      urgency = 'high';
      whisperQuote = `"Top-line volume is stalling; CEOs want rate relief before inventory cuts turn into plant closures."`;
      body = `Quarterly earnings calls turned defensive this week as annualized GDP growth of ${r.gdp}% and ${r.unemp}% unemployment weighed on freight, retail, and industrial capital-goods orders, leaving the Doll Street Index at ${r.stocks}.

Executives urged policymakers to lean against cyclical slack, noting that commercial credit at ${r.lending}% remains restrictive relative to softening corporate pricing power.`;

    } else if (r.isGoldilocks || (r.rateRegime !== 'tight_punitive' && r.inflationRegime === 'on_target')) {
      const variant = turnIdx % 3;
      if (variant === 0) {
        headline = `Dealmaking Thaws on Doll Street as ${r.rate}% Base Rates and ${r.cpi}% CPI Calm CFOs`;
        tone = 'bullish';
        urgency = 'low';
        whisperQuote = `"Predictable borrowing costs and two-percent inflation are reopening the M&A playbook across mid-cap industrials."`;
        body = `Investment-banking advisory desks on Doll Street reported their busiest pitch calendar in quarters as the combination of a ${r.rate}% policy rate, ${r.cpi}% headline inflation, and ${r.gdp}% GDP growth restored boardroom confidence.

With commercial bank lending rates at ${r.lending}% and the Doll Street Index trading at ${r.stocks} points, chief financial officers say predictable input costs—flexible goods inflation is just ${r.flexCpi}%—allow multi-year factory and technology capital budgets to pencil out cleanly.

"Executives don't need zero-percent free money to invest; they need visibility," said Victoria Vance, capital markets editor. "A soft landing with steady real demand is the healthiest backdrop for corporate earnings."`;
      } else if (variant === 1) {
        headline = `Corporate Margins Firm Up as Input Inflation Cools to ${r.flexCpi}% and Demand Holds`;
        tone = 'bullish';
        urgency = 'low';
        whisperQuote = `"Supply-chain surcharges have vanished from earnings transcripts while consumer unit volumes are growing."`;
        body = `Industrial and consumer-facing corporations posted resilient operating margins this month as stabilized wholesale costs (${r.flexCpi}% flexible CPI) paired with ${r.gdp}% annualized economic growth lifted the Doll Street Index to ${r.stocks}.

Equity strategists note that positive real wage growth of +${r.realWage}% is supporting household unit volumes without reigniting destructive cost spirals. Meanwhile, corporate bond issuance cleared smoothly against a ${r.yield10y}% 10-year Treasury benchmark.

"Quality earnings growth—driven by volume and productivity rather than price hikes—is back in the driver's seat," wrote columnist Arthur Pendelton.`;
      } else {
        headline = `At ${r.stocks} Points, Institutional Portfolios Rotate Toward Domestic Cyclicals`;
        tone = 'neutral';
        urgency = 'low';
        whisperQuote = `"With recession tail-risk fading and rates anchored at ${r.rate}%, asset allocators are broadening beyond mega-caps."`;
        body = `Portfolio managers on Doll Street broadened equity exposure into domestic industrials, logistics, and regional financials this week, keeping the benchmark index at ${r.stocks} points amid ${r.unemp}% unemployment and ${r.cpi}% inflation.

Commercial credit facilities priced near ${r.lending}% saw steady drawdowns for equipment upgrades and automation software, reflecting constructive business sentiment across mid-sized enterprises.`;
      }

    } else {
      headline = `Doll Street Trades at ${r.stocks} as Boardrooms Weigh ${r.lending}% Credit Against ${r.gdp}% Growth`;
      tone = 'neutral';
      urgency = 'medium';
      whisperQuote = `"Earnings are holding up, though CFOs remain selective on leveraged expansion until borrowing spreads narrow."`;
      body = `Equity trading proceeded at a measured pace with the Doll Street Index at ${r.stocks} points as corporate treasurers balanced ${r.lending}% commercial loan rates against ${r.gdp}% real GDP expansion and ${r.cpi}% inflation.

Analysts reported solid cash-flow generation among large-cap issuers while smaller firms maintained disciplined inventory and hiring plans.`;
    }

  // =========================================================================
  // 3. GOTHAM NEWS TRIBUNE (Metro Labor, Paychecks, Housing & Main Street)
  // =========================================================================
  } else if (publisherKey === 'gotham') {
    featuredVar = 'real_wage_growth';

    if (r.inflationRegime === 'elevated_inflation' || r.inflationRegime === 'severe_inflation') {
      featuredVar = 'inflation_cpi';
      headline = `Grocery Aisles Sting Working Budgets as Inflation Runs at ${r.cpi}%`;
      tone = 'critical';
      urgency = r.cpi > 5.0 ? 'critical' : 'high';
      whisperQuote = `"Two bags of essentials eat half an overtime shift when inflation stays up at ${r.cpi}%."`;
      body = `Along neighborhood shopping corridors in outer Gotham, households are trimming weekly lists as ${r.cpi}% consumer price inflation—including ${r.flexCpi}% in flexible goods—presses family budgets and keeps real wage growth at ${r.realWage}%.

Local grocers and diner owners report shoppers trading down to store brands while utility bills strain fixed-income retirees, pushing the social discontent gauge to ${r.discontent}/100.`;

    } else if (r.unemp >= 5.0 || r.growthRegime === 'recession') {
      featuredVar = 'unemployment_rate';
      headline = `Longer Lines at Union Hiring Halls as Unemployment Reaches ${r.unemp}%`;
      tone = 'dovish';
      urgency = 'high';
      whisperQuote = `"Overtime dried up first; now warehouse shifts are getting cut across the industrial district."`;
      body = `Outside municipal workforce centers and trade halls in Gotham, job seekers reported stiffer competition for steady shifts this month as national unemployment stood at ${r.unemp}% alongside ${r.gdp}% GDP growth.

Labor advocates urged central bank policymakers to prioritize job preservation, warning that prolonged hiring freezes erode working-class savings faster than modest fluctuations in credit markets.`;

    } else if (r.inflationRegime === 'on_target' && r.wageRegime === 'rising_purchasing_power') {
      const variant = turnIdx % 3;
      if (variant === 0 && r.housing > 144) {
        featuredVar = 'housing_cost_index';
        headline = `Grocery Prices Steady at ${r.cpi}%, Allowing Paychecks to Breathe—Though Metro Rents Stay Tight`;
        tone = 'neutral';
        urgency = 'low';
        whisperQuote = `"Checkout receipts finally stopped jumping every month, and wages are beating inflation—now the city just needs to build more apartments."`;
        body = `In neighborhood markets across Gotham, shoppers say the weekly sticker shock that once dominated kitchen-table talk has noticeably faded: headline inflation sits at ${r.cpi}% while real wages are growing +${r.realWage}% faster than prices.

"Milk, eggs, and transit fares aren't eating every raise anymore," said Mateo Alvarez, an electrician in Queensborough whose union contract delivered real purchasing-power gains this quarter as consumer confidence rose to ${r.confidence}.

Still, housing advocates note that while monetary policy has tamed everyday inflation, municipal zoning bottlenecks keep the metropolitan Housing Cost Index at ${r.housing}—a structural supply challenge tenant groups say City Hall and Parliament, rather than interest rates alone, must solve.`;
      } else if (variant === 1) {
        headline = `Paychecks Outpace ${r.cpi}% Inflation as Real Wages Climb +${r.realWage}% Across Metro`;
        tone = 'bullish';
        urgency = 'low';
        whisperQuote = `"For the first time in years, a cost-of-living raise actually feels like a real raise at the end of the month."`;
        body = `Working households across Gotham are seeing tangible breathing room in monthly budgets as headline inflation holds quietly at ${r.cpi}% and real wage growth registers +${r.realWage}%, lifting consumer confidence to ${r.confidence}.

With unemployment steady at ${r.unemp}% and social discontent down to ${r.discontent}/100, neighborhood restaurants, hardware stores, and weekend markets reported brisker family foot traffic than a year ago.

"Predictable prices let working people plan—whether that's replacing a delivery van or saving for community college," said Rosa Morales, metro labor reporter.`;
      } else {
        headline = `Steady ${r.unemp}% Employment and Tame ${r.cpi}% Prices Bolster Neighborhood Shops`;
        tone = 'neutral';
        urgency = 'low';
        whisperQuote = `"Suppliers aren't hiking wholesale invoices every thirty days anymore, and regular customers are back."`;
        body = `Small storefront owners from South Gotham to the harbor district described a welcome return to normalcy this month as flexible goods inflation cooled to ${r.flexCpi}% and overall CPI anchored at ${r.cpi}%.

Trade apprenticeship programs reported steady placement rates under ${r.gdp}% economic growth, while real paycheck gains of +${r.realWage}% helped working renters absorb ${r.lending}% commercial credit conditions without rising delinquency.`;
      }

    } else {
      headline = `Metro Households Navigate ${r.cpi}% Inflation and ${r.lending}% Borrowing Rates`;
      tone = r.realWage < 0 ? 'critical' : 'neutral';
      urgency = r.realWage < 0 ? 'medium' : 'low';
      whisperQuote = `"Jobs are holding at ${r.unemp}%, though first-time homebuyers are watching mortgage spreads closely."`;
      body = `Across Gotham's commuter neighborhoods, household ledgers reflect a mixed but manageable picture: headline inflation stands at ${r.cpi}%, unemployment is ${r.unemp}%, and real wage growth sits at ${r.realWage}%.

While consumer confidence registers ${r.confidence}, housing counselors note the metropolitan Housing Cost Index of ${r.housing} and ${r.lending}% bank lending rates continue to keep young buyers price-conscious.`;
    }

  // =========================================================================
  // 4. THE CASHINGTON POST (Parliament, Coalition Politics & Fiscal Policy)
  // =========================================================================
  } else if (publisherKey === 'cashington') {
    featuredVar = 'parliamentary_approval';

    if (r.politicsRegime === 'hostile_oversight') {
      headline = `Backbenchers Sharpen Knives as Governor's Parliamentary Approval Drops to ${r.parlApproval}%`;
      tone = 'critical';
      urgency = r.parlApproval < 32 ? 'critical' : 'high';
      whisperQuote = `"Swing-seat MPs are getting earfuls at constituency clinics—and they want the Central Bank in the witness chair."`;
      body = `Senior whips in Parliament Hill warned of turbulent committee sessions ahead as legislative confidence in the central bank leadership stood at ${r.parlApproval}%, with ${state.months_to_election} months remaining before voters head to the polls.

Opposition lawmakers pointed to constituent frustration, floating draft amendments to tighten statutory reporting requirements if economic indicators fail to improve.`;

    } else if (r.politicsRegime === 'strong_bipartisan_support' && r.inflationRegime === 'on_target') {
      const variant = turnIdx % 3;
      if (variant === 0) {
        headline = `Riding ${r.parlApproval}% Approval and ${r.cpi}% Inflation, Governor Enjoys Rare Capitol Detente`;
        tone = 'neutral';
        urgency = 'low';
        whisperQuote = `"Nobody on the Treasury Committee wants to pick a television fight with a Governor delivering 2% inflation and ${r.gdp}% growth."`;
        body = `A rare bipartisan calm has settled over central bank oversight on Parliament Hill: with headline inflation anchored at ${r.cpi}%, GDP expanding at ${r.gdp}%, and legislative confidence at an enviable ${r.parlApproval}%, both coalition ministers and opposition spokespeople spent the week praising price stability.

Behind closed doors, party strategists preparing for elections in ${state.months_to_election} months are already vying to claim political credit for the +${r.realWage}% rise in real wages and ${r.pubApproval}% public sentiment.

"When grocery inflation is tame and policy rates sit at a moderate ${r.rate}%, lawmakers turn their fire on each other's tax plans rather than the central bank charter," observed bureau chief Eleanor Sterling.`;
      } else if (variant === 1) {
        headline = `With Inflation Tamed at ${r.cpi}%, Parliament Pivots to ${r.deficit}% Fiscal Deficit Debate`;
        tone = 'neutral';
        urgency = 'low';
        whisperQuote = `"The Central Bank did its job getting rates to ${r.rate}% and CPI to two percent—now the Treasury bench owns the budget math."`;
        body = `Freed from emergency inflation hearings as CPI rests at ${r.cpi}% and central bank approval stands at ${r.parlApproval}%, lawmakers on the Public Accounts Committee turned their focus squarely onto the Treasury's ${r.deficit}% fiscal deficit and ${r.debtToGdp}% debt-to-GDP ratio.

Fiscal conservatives argued that a healthy ${r.gdp}% expansion and ${r.unemp}% unemployment represent the textbook moment to trim structural deficits, while coalition MPs lobbied for housing-supply and grid-modernization grants.`;
      } else {
        headline = `Bipartisan Lawmakers Eye Housing Supply & Banking Competition as Macro Waters Calm`;
        tone = 'bullish';
        urgency = 'low';
        whisperQuote = `"High institutional trust (${r.parlApproval}% in Parliament) gives the Governor real sway when technical reform bills hit the floor."`;
        body = `With monetary policy steady at ${r.rate}%, inflation near target at ${r.cpi}%, and public approval of economic stewardship at ${r.pubApproval}%, senior committee chairs signaled openness to structural legislation on mortgage competition and industrial productivity.

Political analysts note that ${state.months_to_election} months out from general elections, maintaining non-partisan discipline remains the Governor's strongest shield as campaign rhetoric gradually warms.`;
      }

    } else {
      headline = `Lawmakers Weigh ${r.deficit}% Deficit and ${r.rate}% Rates With ${state.months_to_election} Months to Election`;
      tone = 'neutral';
      urgency = 'medium';
      whisperQuote = `"Every committee question between now and election day is written with suburban swing voters in mind."`;
      body = `On Parliament Hill, where the central bank chair holds a ${r.parlApproval}% confidence rating, budget and Treasury committees spent the week debating the interplay between ${r.rate}% benchmark interest rates, ${r.cpi}% inflation, and sovereign debt at ${r.debtToGdp}% of GDP.

With ${state.months_to_election} months on the electoral clock, party whips from both benches are closely tracking consumer confidence (${r.confidence}) and mortgage spreads (${r.lending}%).`;
    }
  }

  return {
    publisher: publisherKey,
    headline,
    body,
    tone,
    urgency,
    featured_variable: featuredVar,
    byline,
    dateline,
    whisper_quote: whisperQuote
  };
}

module.exports = {
  generateMonthlyNews,
  generateWithLocalMacroEngine,
  PUBLISHER_PROFILES,
  selectPrimaryEconomicDrivers,
  classifyEconomicReality
};
