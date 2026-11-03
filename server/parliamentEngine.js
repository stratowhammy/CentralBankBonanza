/**
 * Central Bank Bonanza - Parliamentary Hearing Engine
 * Generates rich, varied, contextually-grounded questions from lawmakers
 * across political parties, committees, and economic distress scenarios.
 */

const QUESTION_ARCHETYPES = [
  {
    id: 'q_headline_inflation',
    committee: 'Treasury Select Committee',
    interrogator: 'MP Sir Alistair Sterling (Shadow Chancellor of the Exchequer, Opposition)',
    party: 'Opposition',
    minInflation: 2.8,
    weight: (state) => Math.max(1, (state.inflation_cpi - 2.0) * 3),
    generate: (state) => ({
      question: `Governor, headline CPI is at ${state.inflation_cpi}%, well above our statutory 2.0% target, while sticky core services sit at ${state.sticky_cpi || state.core_inflation || state.inflation_cpi}%. Your theoretical Taylor Rule model benchmark suggests policy is out of alignment. Are you losing your grip on wage-price spirals, or are you sleepwalking our economy into a stagflationary quagmire?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Defend Data-Dependent Resolution & Transmission Lags',
          dialogue: 'Our monetary transmission pipeline operates with Milton Friedman’s documented 12-to-18 month lags. Restrictive policy is steadily draining aggregate excess demand, and the Committee will not hesitate to maintain restrictive rates if second-round wage effects persist.',
          parl_approval_delta: -3,
          autonomy_delta: 5,
          market_credibility_delta: 6,
          public_approval_delta: -2
        },
        {
          key: 'empathetic_disinflation',
          label: 'Highlight Flexible Disinflation & Consumer Relief Horizon',
          dialogue: 'We are closely monitoring the divergence between volatile flexible goods and sticky core services. Global supply chain friction is normalizing, and long-term household inflation expectations remain solidly anchored around our institutional commitment.',
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
    })
  },
  {
    id: 'q_housing_and_mortgage_crisis',
    committee: 'Suburban Working Families Caucus',
    interrogator: 'MP Margaret Vance (Suburban Working Families Caucus, Government Bench)',
    party: 'Coalition',
    minLendingRate: 5.5,
    weight: (state) => Math.max(1, (state.bank_lending_rate - 5.0) * 2.5 + ((state.housing_cost_index || 100) - 100) * 0.5),
    generate: (state) => ({
      question: `Governor, commercial mortgage rates have climbed to ${state.bank_lending_rate}%, and our Housing Cost Index sits at an alarming ${state.housing_cost_index || 105}. Working families in swing constituencies are facing monthly payment spikes of $600 while commercial banks post windfall net interest margins. How do you justify squeezing young families who had zero role in creating global inflation?`,
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
          dialogue: 'We acutely recognize the severe burden facing mortgage holders. Our resolute action is explicitly designed to crush underlying price pressures swiftly so that benchmark rates can sustainably normalize without triggering a housing collapse.',
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
    })
  },
  {
    id: 'q_recession_and_industrial_slump',
    committee: 'Manufacturing & Industrial Affairs Committee',
    interrogator: 'MP Liam O’Connor (Northern Industrial Caucus, Opposition)',
    party: 'Opposition',
    maxGdp: 2.0,
    weight: (state) => Math.max(1, (2.5 - state.gdp_growth) * 4),
    generate: (state) => ({
      question: `Annualized real GDP growth has decelerated to ${state.gdp_growth}%. Factory managers across the industrial rustbelt tell us that bank borrowing rates of ${state.bank_lending_rate}% have completely halted capital investment and new hires. Are you deliberately engineering a domestic recession to hit your theoretical 2% inflation target?`,
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
          dialogue: 'Our statutory mandate is twofold: sustainable price stability alongside maximum employment. We are constantly monitoring real-time activity indicators to ensure we do not over-tighten and crush productive domestic industry.',
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
    })
  },
  {
    id: 'q_real_wages_and_worker_hardship',
    committee: 'Labor & Employment Select Committee',
    interrogator: 'MP Chloe Morales (Labor & Industrial Select Committee, Socialist Bench)',
    party: 'Labor',
    weight: (state) => Math.max(1, (0 - state.real_wage_growth) * 3 + (state.unemployment_rate - 3.8) * 2),
    generate: (state) => ({
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
  {
    id: 'q_yield_curve_inversion_and_bond_panic',
    committee: 'Financial Services & Bond Markets Subcommittee',
    interrogator: 'MP Kenneth Davenport (Doll Street & Financial Markets Subcommittee, Conservative)',
    party: 'Conservative',
    weight: (state) => {
      const spread = (state.bond_yield_10y || 4.5) - (state.bond_yield_2y || 4.2);
      return spread < 0 ? Math.abs(spread) * 8 + 2 : 1;
    },
    generate: (state) => {
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
  {
    id: 'q_sovereign_debt_and_fiscal_cliff',
    committee: 'Public Accounts & National Debt Committee',
    interrogator: 'MP Julian Hastings (Fiscal Responsibility & Public Accounts Committee, Independent)',
    party: 'Independent',
    weight: (state) => Math.max(1, ((state.debt_to_gdp || 90) - 85) * 1.5 + (state.bond_yield_10y - 3.5) * 2),
    generate: (state) => ({
      question: `Our national debt-to-GDP has reached ${state.debt_to_gdp}%, with the fiscal deficit at ${state.fiscal_deficit || -4.1}% of GDP. Every 100 basis point rate increase adds tens of billions to sovereign debt servicing costs, crowding out hospital construction and military procurement. Are your high interest rates threatening national insolvency?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Firmly Reject Fiscal Dominance and Debt Monetization',
          dialogue: 'The Central Bank will never compromise monetary stability to cheapen government debt financing. Attempting to suppress bond yields artificially is fiscal dominance, which inevitably triggers currency devaluation and bond market revulsion.',
          parl_approval_delta: -3,
          autonomy_delta: 8,
          market_credibility_delta: 9,
          public_approval_delta: -1
        },
        {
          key: 'empathetic_disinflation',
          label: 'Explain That Price Stability Reduces Long-Term Borrowing Costs',
          dialogue: 'Tolerating persistent inflation would force sovereign bond investors to demand far higher permanent risk premia for decades. By subduing inflation today, we ensure long-term sovereign borrowing costs remain affordable for future generations.',
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
    })
  },
  {
    id: 'q_election_clock_and_political_bias',
    committee: 'Parliamentary Committee on Democratic Oversight',
    interrogator: 'MP Eleanor Rigby (Campaign Ethics & Parliamentary Oversight Envoy, Opposition Whip)',
    party: 'Opposition',
    weight: (state) => Math.max(1, (30 - (state.months_to_election || 24)) * 1.8),
    generate: (state) => ({
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
  {
    id: 'q_mpc_dissent_and_credibility_fracture',
    committee: 'Treasury Committee Oversight Panel',
    interrogator: 'MP Dr. Aris Thorne (Treasury Committee Chair, Senior Statesman)',
    party: 'Crossbench',
    weight: (state) => {
      if (state.last_mpc_vote && (state.last_mpc_vote.dissents > 0 || state.last_mpc_vote.tally_label?.includes('Split'))) {
        return 7;
      }
      return 1.5;
    },
    generate: (state) => {
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
  {
    id: 'q_small_business_credit_squeeze',
    committee: 'Enterprise & Small Business Subcommittee',
    interrogator: 'MP Priya Sharma (Small Business & Enterprise Envoy, Government Bench)',
    party: 'Coalition',
    weight: (state) => Math.max(1, (state.bank_lending_rate - 5.8) * 3),
    generate: (state) => ({
      question: `Small commercial enterprise borrowing rates have jumped to ${state.bank_lending_rate}%. Thousands of family-owned bakeries, contractors, and retail shops that survived the pandemic cannot refinance overdraft credit lines and face imminent insolvency. Are you blind to the destruction of Main Street commerce?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Explain That Subsidizing Credit Fuelled Inflationary Excess',
          dialogue: 'Prolonged negative real rates created artificial debt dependencies. Returning capital costs to economic reality is painful, but allowing persistent inflation to erode small business operating margins would be terminal.',
          parl_approval_delta: -4,
          autonomy_delta: 5,
          market_credibility_delta: 6,
          public_approval_delta: -4
        },
        {
          key: 'empathetic_disinflation',
          label: 'Highlight Future Rate Normalization for Viable Borrowers',
          dialogue: 'We are acutely conscious of small business credit friction. Disinflation is progressing, and as soon as core price stability is secured, commercial borrowing costs will ease naturally without administrative distortion.',
          parl_approval_delta: 6,
          autonomy_delta: 1,
          market_credibility_delta: 3,
          public_approval_delta: 7
        },
        {
          key: 'deflect_fiscal',
          label: 'Propose Targeted Parliamentary Working Capital Guarantees',
          dialogue: 'If Parliament wishes to protect specific small business sectors, lawmakers have statutory power to create targeted fiscal loan guarantees, which are far more precise than monetary policy.',
          parl_approval_delta: 4,
          autonomy_delta: 2,
          market_credibility_delta: 4,
          public_approval_delta: 3
        }
      ]
    })
  },
  {
    id: 'q_balance_sheet_and_qt_losses',
    committee: 'Select Committee on Central Bank Operations',
    interrogator: 'MP Marcus Vance (Public Audit Subcommittee, Fiscal Hawk)',
    party: 'Conservative',
    weight: (state) => Math.max(1, ((state.balance_sheet_size || 7.0) - 5.0) * 1.5 + Math.abs(state.qt_monthly_pace || 25) * 0.1),
    generate: (state) => ({
      question: `The Central Bank’s balance sheet sits at $${state.balance_sheet_size || 7.2} Trillion while Quantitative Tightening runs at -$${Math.abs(state.qt_monthly_pace || 25)}B per month. As policy rates rise, the Treasury is transferring tens of billions of taxpayer funds to indemnify central bank bond portfolio losses. Why should ordinary taxpayers bail out your speculative bond holdings?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Affirm QT as Crucial for Disinflation & Reserve Drainage',
          dialogue: 'Quantitative Tightening is an essential complement to rate hikes, draining excess banking liquidity. The indemnity structure was established by Parliament, and retreating now would re-inject inflationary liquidity into financial markets.',
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
  {
    id: 'q_loss_of_public_trust',
    committee: 'Civic Accountability & Democratic Governance Committee',
    interrogator: 'MP Tobias Vance (Civic Accountability Caucus, Populist)',
    party: 'Populist',
    weight: (state) => Math.max(1, (55 - (state.public_approval || 50)) * 2),
    generate: (state) => ({
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
  {
    id: 'q_energy_shock_and_blunt_tools',
    committee: 'Energy Security & Regional Cost-of-Living Envoy',
    interrogator: 'MP Donald MacLean (Energy & Regional Cost-of-Living Envoy, Scottish Bench)',
    party: 'Regional',
    weight: (state) => Math.max(1, ((state.flexible_cpi || state.inflation_cpi) - 2.5) * 2),
    generate: (state) => ({
      question: `Energy and utility bills remain painfully elevated. Yet an interest rate hike cannot drill a single barrel of crude oil, build a wind turbine, or unblock an international shipping choke point. Why are you using a sledgehammer that crushes domestic borrowers to fight international commodity shocks?`,
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
    })
  }
];

/**
 * Generate 2 to 3 varied questions tailored to the live economic state.
 */
function generateParliamentaryQuestions(state, session) {
  // Score and weigh all archetypes according to current state
  const scored = QUESTION_ARCHETYPES.map(arch => {
    let score = arch.weight ? arch.weight(state) : 1;
    // Add small random jitter so ties break differently
    score *= (0.8 + Math.random() * 0.4);
    return { arch, score };
  });

  // Sort descending by calculated relevance score
  scored.sort((a, b) => b.score - a.score);

  // Pick top 3 diverse questions (distinct committee / topic)
  const selected = [];
  const pickedCommittees = new Set();

  for (const item of scored) {
    if (selected.length >= 3) break;
    if (!pickedCommittees.has(item.arch.committee)) {
      pickedCommittees.add(item.arch.committee);
      const generated = item.arch.generate(state);
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
        const gen = item.arch.generate(state);
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
  QUESTION_ARCHETYPES
};
