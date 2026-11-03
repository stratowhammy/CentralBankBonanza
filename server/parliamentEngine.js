/**
 * Central Bank Bonanza - Parliamentary Hearing Engine
 * Generates rich, varied, contextually-grounded questions from lawmakers
 * across political parties, committees, policy trajectories (hiking, cutting, neutral),
 * and macroeconomic distress scenarios.
 */

/**
 * Derives policy rate trajectory from turn history and current economic state.
 */
function getRateTrajectory(state, session) {
  const history = session?.history || [];
  let startRate = state.interest_rate;
  let prevRate = state.interest_rate;

  if (history.length > 0) {
    const firstEcon = history[0]?.economic_state;
    if (firstEcon && typeof firstEcon.interest_rate === 'number') {
      startRate = firstEcon.interest_rate;
    }
    // Find the most recent distinct policy rate in history
    for (let i = history.length - 1; i >= 0; i--) {
      const econ = history[i]?.economic_state;
      if (econ && typeof econ.interest_rate === 'number' && Math.abs(econ.interest_rate - state.interest_rate) > 0.05) {
        prevRate = econ.interest_rate;
        break;
      }
    }
  }

  const deltaFromStart = Number((state.interest_rate - startRate).toFixed(2));
  const deltaFromPrev = Number((state.interest_rate - prevRate).toFixed(2));
  
  // Rate easing / cutting regime:
  // - Dropped significantly since session start, or recently cut, or low absolute rate (<= 3.25%) without hikes
  const isCutting = deltaFromStart <= -0.25 || deltaFromPrev <= -0.1 || (state.interest_rate <= 3.25 && deltaFromStart <= 0);
  // Rate tightening / hiking regime:
  const isHiking = deltaFromStart >= 0.25 || deltaFromPrev >= 0.1 || (state.interest_rate >= 5.0 && deltaFromStart >= 0);
  const isHolding = !isCutting && !isHiking;

  // Absolute rate level
  const isLow = state.interest_rate <= 3.25;
  const isHigh = state.interest_rate >= 4.75;
  const isNeutral = !isLow && !isHigh;

  return {
    startRate,
    prevRate,
    deltaFromStart,
    deltaFromPrev,
    isCutting,
    isHiking,
    isHolding,
    isLow,
    isHigh,
    isNeutral
  };
}

const QUESTION_ARCHETYPES = [
  // 1. Headline CPI Inflation (Triggered by high or target inflation)
  {
    id: 'q_headline_inflation',
    committee: 'Treasury Select Committee',
    interrogator: 'MP Sir Alistair Sterling (Shadow Chancellor of the Exchequer, Opposition)',
    party: 'Opposition',
    weight: (state, traj) => {
      if (state.inflation_cpi <= 2.3) return 0.5; // low priority if inflation is on target
      return Math.max(1, (state.inflation_cpi - 2.0) * 3.5);
    },
    generate: (state, traj) => {
      const isElevated = state.inflation_cpi > 2.8;
      const question = isElevated
        ? `Governor, headline CPI is at ${state.inflation_cpi}%, well above our statutory 2.0% target, while sticky core services sit at ${state.sticky_cpi || state.core_inflation || state.inflation_cpi}%. Your theoretical Taylor Rule benchmark suggests policy is out of alignment. Are you losing your grip on wage-price spirals, or are you sleepwalking our economy into a stagflationary quagmire?`
        : `Governor, headline CPI has moderated to ${state.inflation_cpi}%, approaching our statutory 2.0% target. But with policy rates currently at ${state.interest_rate}%, are you now at risk of overtightening and pushing the nation into a deflationary spiral, or will you commit to declaring victory and normalizing policy?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Defend Data-Dependent Resolution & Transmission Lags',
            dialogue: 'Our monetary transmission pipeline operates with Milton Friedman’s documented 12-to-18 month lags. Policy is steadily draining aggregate excess demand, and the Committee will not hesitate to maintain firm guidance until disinflation is fully secure.',
            parl_approval_delta: -3,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: -2
          },
          {
            key: 'empathetic_disinflation',
            label: 'Highlight Flexible Disinflation & Consumer Relief Horizon',
            dialogue: 'We are closely monitoring the divergence between volatile flexible goods and sticky core services. Global supply friction is normalizing, and long-term household inflation expectations remain solidly anchored around our statutory target.',
            parl_approval_delta: 6,
            autonomy_delta: 0,
            market_credibility_delta: 3,
            public_approval_delta: 7
          },
          {
            key: 'deflect_fiscal',
            label: 'Demand Parliamentary Fiscal Deficit Discipline',
            dialogue: `Monetary policy cannot fight inflation single-handedly while Parliament continues expanding sovereign debt to ${state.debt_to_gdp}% of GDP. If lawmakers genuinely want lower inflation, you must assist us with responsible fiscal consolidation.`,
            parl_approval_delta: 3,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 2
          }
        ]
      };
    }
  },

  // 2. Housing & Commercial Mortgages (Contextually adapts to rate cuts vs rate hikes)
  {
    id: 'q_housing_and_mortgage_crisis',
    committee: 'Suburban Working Families Caucus',
    interrogator: 'MP Margaret Vance (Suburban Working Families Caucus, Government Bench)',
    party: 'Coalition',
    weight: (state, traj) => {
      const lendingStress = Math.max(0, (state.bank_lending_rate - 4.8) * 2.5);
      const housingStress = Math.max(0, ((state.housing_cost_index || 100) - 100) * 0.5);
      return Math.max(1, lendingStress + housingStress);
    },
    generate: (state, traj) => {
      const question = (traj.isCutting || traj.isLow)
        ? `Governor, while benchmark rates have eased to ${state.interest_rate}%, commercial bank mortgage rates remain sticky at ${state.bank_lending_rate}%, and our Housing Cost Index sits at ${state.housing_cost_index || 105}. Commercial banks appear to be pocketing your rate reductions rather than passing them on to young homeowners. Why hasn't your easing brought immediate relief to working families?`
        : `Governor, commercial mortgage rates have climbed to ${state.bank_lending_rate}%, and our Housing Cost Index sits at an alarming ${state.housing_cost_index || 105}. Working families in swing constituencies are facing monthly payment spikes while commercial banks post windfall net interest margins. How do you justify squeezing young families who had zero role in creating global inflation?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Defend Price Stability as the Bedrock of Family Wealth',
            dialogue: 'The Central Bank’s statutory duty is to price stability. Allowing high inflation to become permanent would inflict far more devastating long-term destruction on household wealth than transitory mortgage rate adjustments.',
            parl_approval_delta: -4,
            autonomy_delta: 6,
            market_credibility_delta: 7,
            public_approval_delta: -5
          },
          {
            key: 'empathetic_disinflation',
            label: 'Acknowledge Mortgage Pain with Normalization Horizon',
            dialogue: 'We acutely recognize the severe burden facing mortgage holders. Our monetary actions are explicitly designed to stabilize borrowing costs sustainably so that banks can pass through lower mortgage rates without rekindling inflation.',
            parl_approval_delta: 7,
            autonomy_delta: 1,
            market_credibility_delta: 2,
            public_approval_delta: 8
          },
          {
            key: 'deflect_fiscal',
            label: 'Cite Housing Supply Bottlenecks & Planning Zoning Restrictions',
            dialogue: `Shelter inflation is fundamentally driven by structural zoning chokepoints and an acute housing shortage. Higher rates cool bidding frenzies, but only Parliament can pass legislation to build new homes.`,
            parl_approval_delta: 4,
            autonomy_delta: -1,
            market_credibility_delta: 4,
            public_approval_delta: 3
          }
        ]
      };
    }
  },

  // 3. Recession & Industrial Slump (Tailored to GDP slowing and factory demand)
  {
    id: 'q_recession_and_industrial_slump',
    committee: 'Manufacturing & Industrial Affairs Committee',
    interrogator: 'MP Liam O’Connor (Northern Industrial Caucus, Opposition)',
    party: 'Opposition',
    weight: (state, traj) => {
      if (state.gdp_growth >= 2.5) return 0.2;
      return Math.max(1, (2.5 - state.gdp_growth) * 4.5);
    },
    generate: (state, traj) => {
      const question = (traj.isCutting || traj.isLow)
        ? `Annualized real GDP growth has stalled at ${state.gdp_growth}%. While you have cut rates to ${state.interest_rate}%, industrial order books in the rustbelt are still freezing. Why are your rate cuts moving so slowly, and will you cut more aggressively before our industrial base permanently collapses?`
        : `Annualized real GDP growth has decelerated to ${state.gdp_growth}%. Factory managers across the industrial rustbelt tell us that bank borrowing rates of ${state.bank_lending_rate}% have completely halted capital investment and new hires. Are you deliberately engineering a domestic recession to hit your theoretical 2% inflation target?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Acknowledge Growth Sacrifices to Prevent Stagflation',
            dialogue: 'A temporary period of below-potential economic growth is the unavoidable price of eradicating inflation. The historical alternative—stagflation and structural de-anchoring—would destroy ten times as many manufacturing facilities over the coming decade.',
            parl_approval_delta: -3,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: -3
          },
          {
            key: 'empathetic_disinflation',
            label: 'Pledge Balanced Dual-Mandate Vigilance',
            dialogue: 'Our statutory mandate is twofold: sustainable price stability alongside maximum employment. We are constantly monitoring real-time activity indicators to ensure policy calibration actively supports productive domestic industry.',
            parl_approval_delta: 6,
            autonomy_delta: 1,
            market_credibility_delta: 3,
            public_approval_delta: 6
          },
          {
            key: 'deflect_fiscal',
            label: 'Urge Pro-Growth Industrial Modernization Legislation',
            dialogue: 'Monetary policy adjusts nominal credit demand; it cannot build automated factories or train specialized machinists. If Parliament desires higher long-term GDP, you should enact pro-growth capital expensing tax credits.',
            parl_approval_delta: 4,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 2
          }
        ]
      };
    }
  },

  // 4. Real Wages & Worker Purchasing Power
  {
    id: 'q_real_wages_and_worker_hardship',
    committee: 'Labor & Employment Select Committee',
    interrogator: 'MP Chloe Morales (Labor & Industrial Select Committee, Socialist Bench)',
    party: 'Labor',
    weight: (state, traj) => Math.max(1, (0.5 - state.real_wage_growth) * 3 + (state.unemployment_rate - 3.8) * 2),
    generate: (state, traj) => ({
      question: `Real wages have contracted by ${state.real_wage_growth}%, while unemployment stands at ${state.unemployment_rate}%. At the exact same time, the Doll Street equity index sits at ${state.stock_market_index} points and executive compensation is breaking records. Why should Parliament not repeal your operational independence if ordinary workers bear all the pain while capital owners profit?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Stern Warning Against Compromising Statutory Independence',
          dialogue: 'Subordinating central bank independence to short-term political pressures is the fastest, most historically proven path to sovereign currency debasement and hyperinflation. Our independence guarantees the currency in every worker’s wallet.',
          parl_approval_delta: -3,
          autonomy_delta: 8,
          market_credibility_delta: 8,
          public_approval_delta: -3
        },
        {
          key: 'empathetic_disinflation',
          label: 'Commit to Restoring Worker Purchasing Power',
          dialogue: 'The single most regressive tax on low-wage workers is inflation. When milk, bread, and gasoline jump 10%, wealthy families shrug while wage earners suffer. Breaking inflation is the greatest service we can deliver to working families.',
          parl_approval_delta: 7,
          autonomy_delta: 1,
          market_credibility_delta: 3,
          public_approval_delta: 8
        },
        {
          key: 'deflect_fiscal',
          label: 'Reiterate Separation of Powers on Wealth Redistribution',
          dialogue: 'Taxation of corporate profits, executive pay caps, and minimum wage legislation are the exclusive constitutional prerogative of elected lawmakers in this chamber, not unelected central bank technocrats.',
          parl_approval_delta: 4,
          autonomy_delta: 3,
          market_credibility_delta: 4,
          public_approval_delta: 2
        }
      ]
    })
  },

  // 5. Yield Curve Inversion (Only valid if yield spread is genuinely inverted)
  {
    id: 'q_yield_curve_inversion_and_bond_panic',
    committee: 'Financial Services & Bond Markets Subcommittee',
    interrogator: 'MP Kenneth Davenport (Doll Street & Financial Markets Subcommittee, Conservative)',
    party: 'Conservative',
    weight: (state, traj) => {
      const spread = (state.bond_yield_10y || 4.5) - (state.bond_yield_2y || 4.2);
      // Strictly require true inversion
      return spread < -0.05 ? Math.abs(spread) * 8 + 3 : 0.05;
    },
    generate: (state, traj) => {
      const spread = ((state.bond_yield_10y || 4.5) - (state.bond_yield_2y || 4.2)).toFixed(2);
      return {
        question: `Governor, the sovereign bond yield curve is deeply inverted: the 2-year yield is at ${state.bond_yield_2y}%, trading well above the 10-year yield at ${state.bond_yield_10y}% (Spread: ${spread}%). Fixed-income desks on Doll Street view this as an unequivocal harbinger of central bank policy error. Are bond markets right to bet you will be forced to reverse course?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Dismiss Curve Inversion as Flight-to-Quality Distortion',
            dialogue: 'Yield curve inversions in a globalized sovereign debt environment are heavily distorted by foreign flight-to-safety flows and compressed term premia. The Committee sets policy based on domestic price pressures, not short-term bond trader bets.',
            parl_approval_delta: -2,
            autonomy_delta: 5,
            market_credibility_delta: 7,
            public_approval_delta: 0
          },
          {
            key: 'empathetic_disinflation',
            label: 'Welcome Market Signals While Stressing Structural Balance',
            dialogue: 'We respect the bond market’s predictive depth and incorporate sovereign yield spreads into our forecasting models. The inversion reflects an expectation that inflation will fall rapidly, which is precisely our intended objective.',
            parl_approval_delta: 5,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 3
          },
          {
            key: 'deflect_fiscal',
            label: 'Attribute Curve Distortion to Heavy Treasury Debt Auctions',
            dialogue: `Heavy front-end Treasury debt issuance and government cash balance fluctuations have created artificial technical supply pressures on the curve that monetary policy does not control.`,
            parl_approval_delta: 2,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 1
          }
        ]
      };
    }
  },

  // 6. Sovereign Debt & Fiscal Cliff (CRITICAL FIX: Fully contextualized to rate levels & trajectory)
  {
    id: 'q_sovereign_debt_and_fiscal_cliff',
    committee: 'Public Accounts & National Debt Committee',
    interrogator: 'MP Julian Hastings (Fiscal Responsibility & Public Accounts Committee, Independent)',
    party: 'Independent',
    weight: (state, traj) => {
      const debtWeight = Math.max(0, ((state.debt_to_gdp || 90) - 85) * 1.5);
      const rateWeight = state.interest_rate >= 4.5 ? (state.interest_rate - 4.0) * 3 : 1;
      return Math.max(1, debtWeight + rateWeight);
    },
    generate: (state, traj) => {
      let question;

      if (traj.isLow || (traj.isCutting && state.interest_rate <= 3.5)) {
        // When rates are 3.00% or being cut: question focuses on fiscal dominance or calls for faster debt relief
        question = `Our national debt-to-GDP has reached ${state.debt_to_gdp}%, with the fiscal deficit at ${state.fiscal_deficit || -3.1}% of GDP. While you have lowered policy rates down to ${state.interest_rate}%, critics allege you are practicing ‘fiscal dominance’—subordinating inflation discipline to keep government borrowing cheap. Are your rate cuts designed to bail out reckless parliamentary deficit spending?`;
      } else if (state.interest_rate >= 4.75) {
        // High rates regime: legitimate complaint about crushing borrowing costs
        question = `Our national debt-to-GDP has reached ${state.debt_to_gdp}%, with the fiscal deficit at ${state.fiscal_deficit || -4.1}% of GDP. Every 100 basis point rate increase at this elevated ${state.interest_rate}% policy rate adds tens of billions to sovereign debt servicing costs, crowding out hospital construction and military procurement. Are your high interest rates threatening national insolvency?`;
      } else {
        // Neutral / balanced rate regime (3.50% - 4.50%)
        question = `Our national debt-to-GDP has reached ${state.debt_to_gdp}%, with the fiscal deficit at ${state.fiscal_deficit || -3.5}% of GDP. With benchmark rates at ${state.interest_rate}%, sovereign borrowing costs are consuming an ever-larger portion of the national budget. Can our public finances withstand this rate environment, or will the Central Bank be forced into debt monetization?`;
      }

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Firmly Reject Fiscal Dominance and Debt Monetization',
            dialogue: 'The Central Bank will never compromise monetary stability to cheapen government debt financing. Setting policy based on fiscal deficit convenience is fiscal dominance, which inevitably triggers currency devaluation and bond market revulsion.',
            parl_approval_delta: -3,
            autonomy_delta: 8,
            market_credibility_delta: 9,
            public_approval_delta: -1
          },
          {
            key: 'empathetic_disinflation',
            label: 'Explain That Price Stability Reduces Long-Term Borrowing Costs',
            dialogue: 'Tolerating persistent inflation would force sovereign bond investors to demand far higher permanent risk premia for decades. By anchoring inflation, our policy path ensures sovereign borrowing costs remain sustainable over the long cycle.',
            parl_approval_delta: 6,
            autonomy_delta: 2,
            market_credibility_delta: 4,
            public_approval_delta: 4
          },
          {
            key: 'deflect_fiscal',
            label: 'Call on Parliament to Restore Primary Fiscal Balance',
            dialogue: `Sovereign debt trajectory is governed by Parliament’s spending and taxation choices. If lawmakers are alarmed by debt servicing costs, the constitutional remedy is to legislate a credible medium-term deficit reduction plan.`,
            parl_approval_delta: 4,
            autonomy_delta: 3,
            market_credibility_delta: 6,
            public_approval_delta: 3
          }
        ]
      };
    }
  },

  // 7. NEW ARCHETYPE: Savers, Retirees & Pensioners Penalized by Low Rates
  {
    id: 'q_savers_and_pensioners_penalized',
    committee: 'Senior Citizens & Pensions Oversight Envoy',
    interrogator: 'MP Sir Reginald Thorne (Senior Citizens & Savers Alliance, Conservative)',
    party: 'Conservative',
    weight: (state, traj) => {
      // High relevance when rates are low (<= 3.25%) or being aggressively cut
      if (state.interest_rate > 3.75) return 0.05;
      return Math.max(1, (3.5 - state.interest_rate) * 5 + (state.inflation_cpi > 2.2 ? 3 : 0));
    },
    generate: (state, traj) => ({
      question: `Governor, you have brought the policy rate down to ${state.interest_rate}%, while inflation still sits at ${state.inflation_cpi}%. Millions of prudent pensioners, retirees, and thrifty families who rely on bank deposit interest are earning negative real returns on lifetime savings. Why are you punishing responsible savers to subsidize speculative, debt-laden borrowers?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Defend Aggregate Macroeconomic Equilibrium',
          dialogue: 'Monetary policy is calibrated to balance aggregate demand for the entire economy. A severe economic stagnation or deflationary slump would destroy far more household pension wealth than temporary deposit rate compression.',
          parl_approval_delta: -2,
          autonomy_delta: 5,
          market_credibility_delta: 6,
          public_approval_delta: -2
        },
        {
          key: 'empathetic_disinflation',
          label: 'Acknowledge Savers’ Sacrifices as Path to Normalization',
          dialogue: 'We deeply respect the sacrifices of savers. As price stability solidifies and economic growth firms up, policy rates will settle at a sustainable, positive real equilibrium that rewards thrifty households.',
          parl_approval_delta: 7,
          autonomy_delta: 1,
          market_credibility_delta: 3,
          public_approval_delta: 7
        },
        {
          key: 'deflect_fiscal',
          label: 'Point to Parliamentary Savings Tax Incentive Relief',
          dialogue: 'Tax exemptions on savings income and pension indexation thresholds are statutory fiscal tools in Parliament’s hands. Lawmakers can provide direct targeted relief to senior savers without distorting credit markets.',
          parl_approval_delta: 4,
          autonomy_delta: 2,
          market_credibility_delta: 4,
          public_approval_delta: 3
        }
      ]
    })
  },

  // 8. NEW ARCHETYPE: Asset Bubbles & Speculation on Doll Street
  {
    id: 'q_asset_bubbles_and_speculation',
    committee: 'Financial Stability & Systemic Risk Panel',
    interrogator: 'MP Kenneth Davenport (Doll Street & Financial Markets Subcommittee, Conservative)',
    party: 'Conservative',
    weight: (state, traj) => {
      if (state.interest_rate > 3.5 || state.stock_market_index < 4100) return 0.05;
      return Math.max(1, ((state.stock_market_index - 4000) / 100) * 1.5);
    },
    generate: (state, traj) => ({
      question: `With your policy rate lowered to ${state.interest_rate}%, Doll Street equities have surged to ${state.stock_market_index} points and commercial credit spreads are pricing out all risk. Are your accommodative interest rates inflating dangerous asset bubbles that will inevitably burst and destabilize the financial sector?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Assert Macroprudential Guardrails Over Rate Tightening',
          dialogue: 'The Central Bank does not target equity market multiples. We monitor banking capitalization, liquidity buffers, and leverage ratios through macroprudential supervision, leaving monetary policy to target core inflation.',
          parl_approval_delta: -1,
          autonomy_delta: 6,
          market_credibility_delta: 7,
          public_approval_delta: 1
        },
        {
          key: 'empathetic_disinflation',
          label: 'Assure Heightened Vigilance Against Froth & Over-leverage',
          dialogue: 'We are closely scrutinizing financial asset valuations and credit underwriting standards. If speculative excesses begin threatening financial stability, the Committee will not hesitate to adjust operational liquidity.',
          parl_approval_delta: 6,
          autonomy_delta: 1,
          market_credibility_delta: 4,
          public_approval_delta: 5
        },
        {
          key: 'deflect_fiscal',
          label: 'Recommend Capital Gains Tax and Margin Regulation Legislation',
          dialogue: 'If lawmakers believe financial markets are speculative, Parliament holds direct constitutional authority to adjust capital gains taxation and securities transaction duties.',
          parl_approval_delta: 3,
          autonomy_delta: 3,
          market_credibility_delta: 4,
          public_approval_delta: 2
        }
      ]
    })
  },

  // 9. Election Clock & Political Impartiality
  {
    id: 'q_election_clock_and_political_bias',
    committee: 'Parliamentary Committee on Democratic Oversight',
    interrogator: 'MP Eleanor Rigby (Campaign Ethics & Parliamentary Oversight Envoy, Opposition Whip)',
    party: 'Opposition',
    weight: (state, traj) => Math.max(1, (28 - (state.months_to_election || 24)) * 1.8),
    generate: (state, traj) => ({
      question: `There are now only ${state.months_to_election || 20} months remaining before the general election. Pundits on Doll Street and Cashington suggest that your recent interest rate moves are strategically calibrated to benefit the incumbent administration. What guarantees can you provide to voters that the Central Bank is not playing partisan politics?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Affirm Absolute Political Agnosticism',
          dialogue: 'The Monetary Policy Committee operates completely blind to the electoral calendar. Our deliberations are governed exclusively by economic data, econometric models, and our statutory inflation target—nothing more, nothing less.',
          parl_approval_delta: -2,
          autonomy_delta: 7,
          market_credibility_delta: 7,
          public_approval_delta: 2
        },
        {
          key: 'empathetic_disinflation',
          label: 'Publish Full Voting Transcripts and Modeling Assumptions',
          dialogue: 'We welcome intense scrutiny. We publish complete MPC meeting minutes, voting tallies, and econometric forecast distributions precisely so that parliamentarians and voters can verify that decisions are strictly evidence-based.',
          parl_approval_delta: 6,
          autonomy_delta: 2,
          market_credibility_delta: 4,
          public_approval_delta: 6
        },
        {
          key: 'deflect_fiscal',
          label: 'Urge Lawmakers Not to Weaponize Central Bank Decisions',
          dialogue: 'Partisan insinuations undermine public confidence in our country’s institutions. We urge all political parties to respect the statutory non-partisan consensus that has anchored monetary stability for a generation.',
          parl_approval_delta: 3,
          autonomy_delta: 4,
          market_credibility_delta: 5,
          public_approval_delta: 3
        }
      ]
    })
  },

  // 10. MPC Dissent & Committee Fractures
  {
    id: 'q_mpc_dissent_and_credibility_fracture',
    committee: 'Treasury Committee Oversight Panel',
    interrogator: 'MP Dr. Aris Thorne (Treasury Committee Chair, Senior Statesman)',
    party: 'Crossbench',
    weight: (state, traj) => {
      if (state.last_mpc_vote && (state.last_mpc_vote.dissents > 0 || state.last_mpc_vote.tally_label?.includes('Split'))) {
        return 7;
      }
      return 1.2;
    },
    generate: (state, traj) => {
      const voteInfo = state.last_mpc_vote ? `the recent ${state.last_mpc_vote.tally_label}` : 'persistent divisions among committee members';
      return {
        question: `Governor, following ${voteInfo}, financial media are reporting an institutional ‘civil war’ inside your boardroom. Outside committee members have voiced deep public reservations about your guidance strategy. How can markets take your interest rate forward guidance seriously when your own committee is openly rebelling against your leadership?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Champion Democratic Dissent Over Groupthink',
            dialogue: 'The Monetary Policy Committee is an expert committee of nine independent economic minds, not a rubber-stamp politburo. Dissent is a sign of intellectual rigor and empirical vitality that enhances rather than weakens decision quality.',
            parl_approval_delta: -1,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: 2
          },
          {
            key: 'empathetic_disinflation',
            label: 'Reiterate Shared Consensus on Price Stability Target',
            dialogue: 'While individual members may disagree on tactical month-to-month calibrations, every member of our board is completely united on our statutory mandate to bring inflation back to 2.0%.',
            parl_approval_delta: 6,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 5
          },
          {
            key: 'deflect_fiscal',
            label: 'Contrast Committee Civility with Parliamentary Rancor',
            dialogue: 'Our deliberations remain civil, analytical, and grounded in econometric data—a standard of collegial governance that stands up well under any constitutional comparison.',
            parl_approval_delta: 2,
            autonomy_delta: 3,
            market_credibility_delta: 4,
            public_approval_delta: 1
          }
        ]
      };
    }
  },

  // 11. Small Business Overdraft & Working Capital Squeeze
  {
    id: 'q_small_business_credit_squeeze',
    committee: 'Enterprise & Small Business Subcommittee',
    interrogator: 'MP Priya Sharma (Small Business & Enterprise Envoy, Government Bench)',
    party: 'Coalition',
    weight: (state, traj) => Math.max(1, (state.bank_lending_rate - 5.5) * 2.8),
    generate: (state, traj) => {
      const question = (traj.isCutting || traj.isLow)
        ? `Governor, even with the policy rate reduced to ${state.interest_rate}%, small commercial business borrowing rates sit stubborn at ${state.bank_lending_rate}%. Thousands of family-owned contractors and retailers report that commercial banks are refusing to pass on rate cuts to overdraft facilities. Why is monetary easing failing to reach Main Street commerce?`
        : `Small commercial enterprise borrowing rates have jumped to ${state.bank_lending_rate}%. Thousands of family-owned bakeries, contractors, and retail shops that survived the pandemic cannot refinance overdraft credit lines and face imminent insolvency. Are you blind to the destruction of Main Street commerce?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Explain That Credit Margins Reflect Banking Risk Assessment',
            dialogue: 'Commercial bank lending spreads reflect credit risk, not central bank hostility. Returning capital allocation to market realities is necessary to prevent non-viable zombie enterprises from draining capital.',
            parl_approval_delta: -4,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: -4
          },
          {
            key: 'empathetic_disinflation',
            label: 'Highlight Future Transmission Lag Normalization',
            dialogue: 'We are closely monitoring bank credit pass-through. Transmission through commercial banks carries a 6-to-9 month lag, and we expect small business borrowing spreads to compress as liquidity stabilizes.',
            parl_approval_delta: 6,
            autonomy_delta: 1,
            market_credibility_delta: 3,
            public_approval_delta: 7
          },
          {
            key: 'deflect_fiscal',
            label: 'Propose Targeted Parliamentary Working Capital Guarantees',
            dialogue: 'If Parliament wishes to protect specific small business sectors, lawmakers have statutory power to create targeted fiscal loan guarantees, which are far more precise than broad monetary policy.',
            parl_approval_delta: 4,
            autonomy_delta: 2,
            market_credibility_delta: 4,
            public_approval_delta: 3
          }
        ]
      };
    }
  },

  // 12. Balance Sheet & Quantitative Tightening Losses (Large reserve economies)
  {
    id: 'q_balance_sheet_and_qt_losses',
    committee: 'Select Committee on Central Bank Operations',
    interrogator: 'MP Marcus Vance (Public Audit Subcommittee, Fiscal Hawk)',
    party: 'Conservative',
    weight: (state, traj) => {
      if (state.balance_sheet_size === undefined || state.balance_sheet_size <= 2.0) return 0.1;
      return Math.max(1, ((state.balance_sheet_size || 7.0) - 5.0) * 1.5 + Math.abs(state.qt_monthly_pace || 25) * 0.1);
    },
    generate: (state, traj) => ({
      question: `The Central Bank’s balance sheet sits at $${state.balance_sheet_size || 7.2} Trillion while Quantitative Tightening runs at -$${Math.abs(state.qt_monthly_pace || 25)}B per month. As policy rates fluctuate, the Treasury is transferring billions of taxpayer funds to indemnify central bank bond portfolio losses. Why should ordinary taxpayers bail out your speculative bond holdings?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Affirm QT as Crucial for Disinflation & Reserve Drainage',
          dialogue: 'Quantitative Tightening is an essential complement to interest rate policy, draining excess banking liquidity. The indemnity structure was established by Parliament, and retreating now would re-inject inflationary liquidity into financial markets.',
          parl_approval_delta: -3,
          autonomy_delta: 6,
          market_credibility_delta: 7,
          public_approval_delta: -2
        },
        {
          key: 'empathetic_disinflation',
          label: 'Remind Committee of Past Cumulative Profit Remittances',
          dialogue: 'Over the entire Quantitative Easing lifecycle, the Central Bank remitted more than $150 Billion in cumulative surplus cash profits directly to the Treasury. Current accounting losses are the mirror image of those historical surpluses.',
          parl_approval_delta: 6,
          autonomy_delta: 1,
          market_credibility_delta: 4,
          public_approval_delta: 4
        },
        {
          key: 'deflect_fiscal',
          label: 'Clarify Indemnity Contract Established Under Parliamentary Act',
          dialogue: 'The indemnity terms were debated and passed by this exact legislative chamber in statute. The Bank executes the operational policy mandated by law.',
          parl_approval_delta: 3,
          autonomy_delta: 3,
          market_credibility_delta: 5,
          public_approval_delta: 1
        }
      ]
    })
  },

  // 13. Public Trust & Technocratic Alienation
  {
    id: 'q_loss_of_public_trust',
    committee: 'Civic Accountability & Democratic Governance Committee',
    interrogator: 'MP Tobias Vance (Civic Accountability Caucus, Populist)',
    party: 'Populist',
    weight: (state, traj) => Math.max(1, (55 - (state.public_approval || 50)) * 2),
    generate: (state, traj) => ({
      question: `Public approval of your central bank stewardship has slid to ${state.public_approval}%, with consumer confidence stagnant at ${state.consumer_confidence || 65}. Working citizens feel completely alienated by central bank technocrats speaking in indecipherable academic jargon. Why should the public trust an institution that seems entirely detached from their everyday struggles?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Insist That Duty Trumps Ephemeral Public Popularity',
          dialogue: 'Monetary policy cannot be run like a popularity contest. Central bank independence was explicitly constructed so technocrats could make difficult, necessary decisions that protect the future value of the currency, even when unpopular.',
          parl_approval_delta: -3,
          autonomy_delta: 6,
          market_credibility_delta: 6,
          public_approval_delta: -4
        },
        {
          key: 'empathetic_disinflation',
          label: 'Pledge Plain-Language Communication & Regional Outreach',
          dialogue: 'We take public alienation deeply to heart. We are overhauling our communication strategy to speak in transparent, plain language, and will hold direct regional citizen forums across the nation.',
          parl_approval_delta: 7,
          autonomy_delta: 0,
          market_credibility_delta: 3,
          public_approval_delta: 8
        },
        {
          key: 'deflect_fiscal',
          label: 'Warn of Populist Scapegoating of Independent Institutions',
          dialogue: 'Erosion of public trust is actively fueled when politicians cynically scapegoat independent statutory institutions for global macroeconomic shocks beyond domestic control.',
          parl_approval_delta: 2,
          autonomy_delta: 4,
          market_credibility_delta: 5,
          public_approval_delta: 2
        }
      ]
    })
  },

  // 14. Supply Shocks & Commodity Pressures
  {
    id: 'q_energy_shock_and_blunt_tools',
    committee: 'Energy Security & Regional Cost-of-Living Envoy',
    interrogator: 'MP Donald MacLean (Energy & Regional Cost-of-Living Envoy, Scottish Bench)',
    party: 'Regional',
    weight: (state, traj) => Math.max(1, ((state.flexible_cpi || state.inflation_cpi) - 2.5) * 2),
    generate: (state, traj) => {
      const question = (traj.isCutting || traj.isLow)
        ? `Energy and grocery bills remain painfully elevated for ordinary households. While you have lowered policy rates down to ${state.interest_rate}%, small businesses ask: why was the Central Bank so slow to recognize that raising interest rates cannot drill oil or clear shipping ports?`
        : `Energy and utility bills remain painfully elevated. Yet an interest rate hike cannot drill a single barrel of crude oil, build a wind turbine, or unblock an international shipping choke point. Why are you using a sledgehammer that crushes domestic borrowers to fight international commodity shocks?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Explain Second-Round Contagion Prevention',
            dialogue: 'While rates cannot pump crude oil, unrestricted price hikes inevitably trigger second-round wage-price spirals across services and retail. Restrictive policy stops temporary commodity price surges from becoming embedded permanent inflation.',
            parl_approval_delta: -2,
            autonomy_delta: 5,
            market_credibility_delta: 7,
            public_approval_delta: -1
          },
          {
            key: 'empathetic_disinflation',
            label: 'Look Through Transitory Shocks While Anchoring Expectations',
            dialogue: 'We distinguish supply shocks from demand excess. We look through temporary commodity spikes, but must act when consumer price expectations begin anticipating permanently higher inflation.',
            parl_approval_delta: 6,
            autonomy_delta: 1,
            market_credibility_delta: 3,
            public_approval_delta: 6
          },
          {
            key: 'deflect_fiscal',
            label: 'Urge Sovereign Strategic Energy Reserve Expansion',
            dialogue: 'Protecting the nation against international energy shocks requires domestic energy infrastructure investment and sovereign fuel reserves—decisions under the authority of Parliament.',
            parl_approval_delta: 4,
            autonomy_delta: 2,
            market_credibility_delta: 4,
            public_approval_delta: 3
          }
        ]
      };
    }
  }
];

/**
 * Generate 2 to 3 varied questions tailored to the live economic state and rate trajectory.
 */
function generateParliamentaryQuestions(state, session) {
  const trajectory = getRateTrajectory(state, session);

  // Score and weigh all archetypes according to current state & trajectory
  const scored = QUESTION_ARCHETYPES.map(arch => {
    let score = arch.weight ? arch.weight(state, trajectory) : 1;
    // Add small random jitter so ties break differently
    score *= (0.85 + Math.random() * 0.3);
    return { arch, score };
  });

  // Sort descending by calculated relevance score
  scored.sort((a, b) => b.score - a.score);

  // Pick top 3 diverse questions (distinct committee / topic)
  const selected = [];
  const pickedCommittees = new Set();

  for (const item of scored) {
    if (selected.length >= 3) break;
    if (!pickedCommittees.has(item.arch.committee) && item.score > 0.2) {
      pickedCommittees.add(item.arch.committee);
      const generated = item.arch.generate(state, trajectory);
      selected.push({
        id: item.arch.id,
        interrogator: item.arch.interrogator,
        party: item.arch.party,
        question: generated.question,
        strategies: generated.strategies
      });
    }
  }

  // Fallback if less than 2
  if (selected.length < 2) {
    for (const item of scored) {
      if (selected.length >= 2) break;
      if (!selected.some(s => s.id === item.arch.id)) {
        const gen = item.arch.generate(state, trajectory);
        selected.push({
          id: item.arch.id,
          interrogator: item.arch.interrogator,
          party: item.arch.party,
          question: gen.question,
          strategies: gen.strategies
        });
      }
    }
  }

  return selected;
}

module.exports = {
  generateParliamentaryQuestions,
  QUESTION_ARCHETYPES,
  getRateTrajectory
};
