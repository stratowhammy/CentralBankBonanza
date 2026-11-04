/**
 * Central Bank Bonanza - Parliamentary Hearing Engine
 * Generates rich, varied, indicator-faithful questions from lawmakers
 * across political parties, committees, policy trajectories (hiking, cutting, neutral),
 * soft-landing / on-target regimes, open-economy pressures, and distress scenarios.
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

  const isCutting = deltaFromStart <= -0.25 || deltaFromPrev <= -0.1 || (state.interest_rate <= 3.25 && deltaFromStart < 0);
  const isHiking = deltaFromStart >= 0.25 || deltaFromPrev >= 0.1 || (state.interest_rate >= 5.0 && deltaFromStart >= 0);
  const isHolding = !isCutting && !isHiking;

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

function pickVariant(variants, seed = 0) {
  if (!Array.isArray(variants) || variants.length === 0) return '';
  const idx = Math.floor(Math.random() * variants.length + seed) % variants.length;
  return variants[idx];
}

const QUESTION_ARCHETYPES = [
  // =========================================================================
  // A. DISTRESS & IMBALANCE ARCHETYPES (Strictly gated on real indicator pain)
  // =========================================================================

  // 1. Elevated Headline / Sticky Inflation (ONLY when inflation is genuinely above target!)
  {
    id: 'q_headline_inflation',
    committee: 'Treasury Select Committee',
    interrogator: 'MP Sir Alistair Sterling (Shadow Chancellor of the Exchequer, Opposition)',
    party: 'Opposition',
    weight: (state) => {
      const sticky = state.sticky_cpi ?? state.core_inflation ?? state.inflation_cpi;
      if (state.inflation_cpi < 2.65 && sticky < 2.75) return 0; // Never accuse of high inflation at ~2%!
      return Math.min(9.5, 4.0 + Math.max(state.inflation_cpi - 2.5, sticky - 2.6) * 2.2);
    },
    generate: (state) => {
      const sticky = state.sticky_cpi ?? state.core_inflation ?? state.inflation_cpi;
      const question = pickVariant([
        `Governor, headline CPI stands at ${state.inflation_cpi}%—well above our statutory 2.0% mandate—while sticky core services sit at ${sticky}%. Households see prices compounding faster than promised. Have inflation expectations slipped out of your control?`,
        `Inflation remains stubbornly elevated at ${state.inflation_cpi}% (with core services at ${sticky}%), yet your policy rate sits at ${state.interest_rate}%. Why has the Committee failed to bring inflation back to the 2.0% target on schedule?`
      ]);

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Defend Data-Dependent Restraint & Transmission Lags',
            dialogue: 'Monetary policy acts with documented 12-to-18 month transmission lags. Our pipeline is actively draining excess nominal demand, and the Committee will maintain resolute discipline until inflation returns sustainably to 2.0%.',
            parl_approval_delta: -3,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: -2
          },
          {
            key: 'empathetic_disinflation',
            label: 'Acknowledge Price Strain & Outline Disinflation Path',
            dialogue: 'Every basis point above 2% hurts family budgets. Supply bottlenecks are beginning to ease, and our calibration is designed to squeeze out sticky price pressures without triggering mass layoffs.',
            parl_approval_delta: 6,
            autonomy_delta: 0,
            market_credibility_delta: 3,
            public_approval_delta: 7
          },
          {
            key: 'deflect_fiscal',
            label: 'Call for Parliamentary Fiscal Deficit Restraint',
            dialogue: `Monetary restraint cannot carry the burden alone while fiscal deficits run at ${state.fiscal_deficit}% of GDP. Fiscal discipline from Parliament would significantly accelerate disinflation.`,
            parl_approval_delta: 3,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 2
          }
        ]
      };
    }
  },

  // 2. Below-Target Disinflation / Overtightening Risk
  {
    id: 'q_disinflation_overtightening',
    committee: 'Monetary Mandate Subcommittee',
    interrogator: 'MP Dr. Evelyn Shaw (Macroeconomic Policy Panel, Coalition)',
    party: 'Coalition',
    weight: (state) => {
      if (state.inflation_cpi < 1.65) return Math.min(9.0, 5.5 + (1.7 - state.inflation_cpi) * 4);
      if (state.inflation_cpi <= 2.25 && state.interest_rate >= 3.85) {
        return Math.min(8.5, 4.5 + (state.interest_rate - 3.5) * 2.5);
      }
      return 0;
    },
    generate: (state) => {
      const isUndershoot = state.inflation_cpi < 1.65;
      const question = isUndershoot
        ? `Governor, headline inflation has cooled all the way down to ${state.inflation_cpi}%—undershooting our symmetric 2.0% target—while the policy rate sits at ${state.interest_rate}%. Are you fighting yesterday’s inflation war and risking a Japanese-style deflationary trap?`
        : `Governor, inflation has returned to ${state.inflation_cpi}%—right near our 2.0% goal—yet you are keeping the benchmark policy rate up at ${state.interest_rate}% (real rates of +${(state.interest_rate - state.inflation_cpi).toFixed(2)}%). Why keep your foot on the monetary brake when price stability is already achieved?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Guard Against Premature Easing & Inflation Rebound',
            dialogue: 'History warns against premature victory laps—declaring victory too early in the 1970s reignited a far worse second wave. We will ease methodically only as medium-term forecasts warrant.',
            parl_approval_delta: -2,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: -1
          },
          {
            key: 'empathetic_disinflation',
            label: 'Affirm Symmetric 2% Mandate & Readiness to Normalize',
            dialogue: 'Our 2.0% mandate is strictly symmetric—undershooting is no more acceptable than overshooting. With disinflation secured, the Committee has ample space to normalize rates if demand softens.',
            parl_approval_delta: 7,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 6
          },
          {
            key: 'deflect_fiscal',
            label: 'Point to Structural Productivity & Fiscal Demand Drivers',
            dialogue: 'Real equilibrium interest rates also depend on public investment and sovereign borrowing demand. We calibrate nominal rates alongside Parliament’s broader growth framework.',
            parl_approval_delta: 4,
            autonomy_delta: 2,
            market_credibility_delta: 4,
            public_approval_delta: 2
          }
        ]
      };
    }
  },

  // 3. Housing & Mortgage Affordability (Gated & normalized so it doesn't dominate every hearing)
  {
    id: 'q_housing_and_mortgage_crisis',
    committee: 'Suburban Working Families Caucus',
    interrogator: 'MP Margaret Vance (Suburban Working Families Caucus, Government Bench)',
    party: 'Coalition',
    weight: (state) => {
      const highRates = state.bank_lending_rate >= 6.2;
      const highHousing = (state.housing_cost_index || 125) >= 146;
      if (!highRates && !highHousing) return 0;
      const lendingScore = Math.max(0, (state.bank_lending_rate - 5.5) * 1.8);
      const housingScore = Math.max(0, ((state.housing_cost_index || 125) - 140) * 0.18);
      return Math.min(8.2, 3.5 + lendingScore + housingScore);
    },
    generate: (state, traj) => {
      let question;
      if (traj.isLow || state.interest_rate <= 3.5) {
        question = pickVariant([
          `Governor, even with the benchmark rate at a moderate ${state.interest_rate}% and headline CPI at ${state.inflation_cpi}%, commercial mortgage rates sit at ${state.bank_lending_rate}% and the metropolitan Housing Cost Index remains up at ${state.housing_cost_index}. Why haven't moderate policy rates translated into affordable starter homes for young families?`,
          `Constituents in suburban ridings welcome ${state.inflation_cpi}% overall inflation, yet the Housing Cost Index is stuck at ${state.housing_cost_index} with banks charging ${state.bank_lending_rate}% on mortgages. Are commercial lenders pocketing wider spreads instead of passing your ${state.interest_rate}% base rate through to buyers?`
        ]);
      } else {
        question = `Commercial mortgage rates have climbed to ${state.bank_lending_rate}% on the back of your ${state.interest_rate}% policy rate, while our Housing Cost Index sits at ${state.housing_cost_index}. Young families face punishing monthly renewals while banks book wide interest margins. How long must homebuyers shoulder this burden?`;
      }

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Maintain Macro Mandate Over Sectoral Housing Subsidies',
            dialogue: 'Interest rates cannot be set solely to subsidize real estate valuations; artificially cheap credit inflates house prices even faster, pricing first-time buyers out through higher down payments.',
            parl_approval_delta: -3,
            autonomy_delta: 6,
            market_credibility_delta: 7,
            public_approval_delta: -4
          },
          {
            key: 'empathetic_disinflation',
            label: 'Pledge Scrutiny of Bank Mortgage Spread Pass-Through',
            dialogue: 'We share your concern for first-time buyers. Our banking supervisors are actively reviewing mortgage spread competition so that stable central bank funding costs reach household borrowers promptly.',
            parl_approval_delta: 7,
            autonomy_delta: 1,
            market_credibility_delta: 3,
            public_approval_delta: 8
          },
          {
            key: 'deflect_fiscal',
            label: 'Highlight Municipal Zoning & Housing Construction Supply',
            dialogue: `Central banks cannot lay bricks or reform municipal zoning laws. A ${state.housing_cost_index} Housing Cost Index reflects a chronic shortage of physical homes that requires legislative planning reform.`,
            parl_approval_delta: 4,
            autonomy_delta: 1,
            market_credibility_delta: 5,
            public_approval_delta: 3
          }
        ]
      };
    }
  },

  // 4. Recession & Industrial Slump (ONLY when GDP growth actually slows < 1.45%!)
  {
    id: 'q_recession_and_industrial_slump',
    committee: 'Manufacturing & Industrial Affairs Committee',
    interrogator: 'MP Liam O’Connor (Northern Industrial Caucus, Opposition)',
    party: 'Opposition',
    weight: (state) => {
      if (state.gdp_growth >= 1.45) return 0; // Never call healthy 2%+ GDP "stalled"!
      return Math.min(9.5, 4.5 + (1.5 - state.gdp_growth) * 3.0);
    },
    generate: (state, traj) => {
      const isContracting = state.gdp_growth <= 0.2;
      const question = (traj.isCutting || traj.isLow)
        ? `Annualized real GDP growth has ${isContracting ? `contracted to ${state.gdp_growth}%` : `slowed to just ${state.gdp_growth}%`}. Even with rates at ${state.interest_rate}%, factory order books in industrial constituencies remain weak. Will the Committee accelerate monetary support before temporary slack becomes permanent deindustrialization?`
        : `Annualized real GDP growth has ${isContracting ? `contracted to ${state.gdp_growth}%` : `decelerated to ${state.gdp_growth}%`}, with commercial borrowing at ${state.bank_lending_rate}% freezing plant investment. Are you engineering an industrial downturn by keeping rates too restrictive?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Stress Long-Term Stability Over Short-Term Credit Boosts',
            dialogue: 'Sustainable industrial investment requires durable price and currency stability. Flooding the system with premature liquidity before structural balances clear risks cyclical boom-bust volatility.',
            parl_approval_delta: -3,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: -3
          },
          {
            key: 'empathetic_disinflation',
            label: 'Pledge Proactive Dual-Mandate Support for Growth & Jobs',
            dialogue: 'We are watching regional manufacturing surveys and capacity utilization intently. Supporting sustainable employment and output alongside price stability sits at the core of our policy reaction function.',
            parl_approval_delta: 6,
            autonomy_delta: 1,
            market_credibility_delta: 3,
            public_approval_delta: 6
          },
          {
            key: 'deflect_fiscal',
            label: 'Recommend Targeted Parliamentary CapEx & Export Incentives',
            dialogue: 'Broad interest rate cuts are a blunt tool for industrial policy. Targeted parliamentary capital-expensing tax credits and infrastructure procurement deliver far faster support to domestic factories.',
            parl_approval_delta: 4,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 2
          }
        ]
      };
    }
  },

  // 5. Real Wage Erosion & Labor Hardship (STRICTLY gated on negative real wages or high unemployment!)
  {
    id: 'q_real_wages_and_worker_hardship',
    committee: 'Labor & Employment Select Committee',
    interrogator: 'MP Chloe Morales (Labor & Industrial Select Committee, Socialist Bench)',
    party: 'Labor',
    weight: (state) => {
      if (state.real_wage_growth >= 0 && state.unemployment_rate < 4.9 && (state.poverty_discontent || 30) < 48) {
        return 0; // Never claim real wages contracted when they are positive!
      }
      const wagePain = Math.max(0, -state.real_wage_growth * 2.8);
      const jobPain = Math.max(0, (state.unemployment_rate - 4.6) * 2.2);
      return Math.min(9.0, 4.0 + wagePain + jobPain);
    },
    generate: (state) => {
      const wageClause = state.real_wage_growth < 0
        ? `Real wages are contracting at ${state.real_wage_growth}%`
        : `Household discontent stands at ${state.poverty_discontent}/100 with unemployment up at ${state.unemployment_rate}%`;
      return {
        question: `${wageClause}, while the Doll Street equity index trades at ${state.stock_market_index} points. Working households feel they absorb every macroeconomic shock while asset holders stay insulated. How do you answer workers who question who this Central Bank truly serves?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Defend Operational Independence as Currency Safeguard',
            dialogue: 'Politicizing central bank operations destroys currency value—which hurts wage earners holding cash far more than wealthy owners of hard assets. Our independence protects every paycheck.',
            parl_approval_delta: -3,
            autonomy_delta: 8,
            market_credibility_delta: 8,
            public_approval_delta: -3
          },
          {
            key: 'empathetic_disinflation',
            label: 'Commit to Restoring Real Purchasing Power & Full Employment',
            dialogue: 'Our foremost goal is an economy where nominal paychecks outpace living costs at full employment. Everything we are calibrating is aimed at restoring durable real wage growth.',
            parl_approval_delta: 7,
            autonomy_delta: 1,
            market_credibility_delta: 3,
            public_approval_delta: 8
          },
          {
            key: 'deflect_fiscal',
            label: 'Point to Parliamentary Tax, Wage & Transfer Powers',
            dialogue: 'Distributional fairness, progressive taxation, and statutory wage floors belong constitutionally to Parliament—interest rates cannot substitute for legislative social policy.',
            parl_approval_delta: 4,
            autonomy_delta: 3,
            market_credibility_delta: 4,
            public_approval_delta: 2
          }
        ]
      };
    }
  },

  // 6. Yield Curve Inversion (Strictly requires true inversion: 2Y > 10Y)
  {
    id: 'q_yield_curve_inversion_and_bond_panic',
    committee: 'Financial Services & Bond Markets Subcommittee',
    interrogator: 'MP Kenneth Davenport (Doll Street & Financial Markets Subcommittee, Conservative)',
    party: 'Conservative',
    weight: (state) => {
      const spread = (state.bond_yield_10y || 4.4) - (state.bond_yield_2y || 3.6);
      if (spread >= -0.05) return 0;
      return Math.min(9.0, 5.0 + Math.abs(spread) * 4.5);
    },
    generate: (state) => {
      const spread = ((state.bond_yield_10y || 4.4) - (state.bond_yield_2y || 3.6)).toFixed(2);
      return {
        question: `Governor, the sovereign yield curve is inverted: 2-year notes yield ${state.bond_yield_2y}% against ${state.bond_yield_10y}% on the 10-year benchmark (spread: ${spread}%). Fixed-income desks view prolonged inversions as a classic recessionary warning. Are bond markets pricing in a policy error?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Caution Against Over-Reading Compressed Term Premia',
            dialogue: 'Modern yield curves reflect global institutional duration demand and compressed term premia. We set policy on domestic output and inflation fundamentals, not mechanical spread rules.',
            parl_approval_delta: -2,
            autonomy_delta: 5,
            market_credibility_delta: 7,
            public_approval_delta: 0
          },
          {
            key: 'empathetic_disinflation',
            label: 'Treat Curve Signal as Confirmation of Expected Normalization',
            dialogue: 'Lower 10-year yields reflect market confidence that inflation will remain anchored over the decade, allowing short-term rates to normalize gradually over coming quarters.',
            parl_approval_delta: 5,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 3
          },
          {
            key: 'deflect_fiscal',
            label: 'Note Treasury Maturity Issuance Mix Effects',
            dialogue: 'Treasury’s decision to weight issuance toward short-dated bills rather than long bonds mechanically elevates 2-year yields independent of central bank policy.',
            parl_approval_delta: 2,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 1
          }
        ]
      };
    }
  },

  // 7. Sovereign Debt & Fiscal Deficit Interplay (Balanced weight cap so it doesn't crowd out other topics!)
  {
    id: 'q_sovereign_debt_and_fiscal_cliff',
    committee: 'Public Accounts & National Debt Committee',
    interrogator: 'MP Julian Hastings (Fiscal Responsibility & Public Accounts Committee, Independent)',
    party: 'Independent',
    weight: (state) => {
      if ((state.debt_to_gdp || 80) < 95 && (state.fiscal_deficit || -2.5) > -4.0) return 0;
      const debtScore = Math.max(0, ((state.debt_to_gdp || 95) - 95) * 0.14);
      const defScore = Math.max(0, (Math.abs(state.fiscal_deficit || -3.0) - 3.0) * 0.8);
      return Math.min(7.2, 3.2 + debtScore + defScore);
    },
    generate: (state, traj) => {
      let question;
      if (traj.isLow || state.interest_rate <= 3.35) {
        question = pickVariant([
          `National debt-to-GDP stands at ${state.debt_to_gdp}% with a ${state.fiscal_deficit}% deficit. With your policy rate at ${state.interest_rate}%, bond hawks ask whether low central bank rates are removing pressure on Parliament to balance the budget—or worse, drifting toward ‘fiscal dominance’. How do you safeguard monetary discipline when public debt is this high?`,
          `Even with policy rates down at ${state.interest_rate}% and inflation near ${state.inflation_cpi}%, long-term 10-year sovereign yields sit at ${state.bond_yield_10y}% as investors digest our ${state.debt_to_gdp}% debt-to-GDP burden. What happens to debt sustainability if an external shock forces rates higher again?`
        ]);
      } else if (state.interest_rate >= 4.75) {
        question = `With debt-to-GDP at ${state.debt_to_gdp}% and the deficit at ${state.fiscal_deficit}%, your ${state.interest_rate}% policy rate is driving sovereign debt-service costs sharply higher, crowding out hospital and infrastructure budgets. Are restrictive rates pushing public finances toward a fiscal cliff?`;
      } else {
        question = `National debt sits at ${state.debt_to_gdp}% of GDP with an annual deficit of ${state.fiscal_deficit}%. At a ${state.interest_rate}% policy rate and ${state.bond_yield_10y}% 10-year yield, rollover costs are rising steadily as old low-coupon bonds mature. How is the Bank coordinating with the Treasury to avoid bond-market indigestion?`;
      }

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Draw a Hard Constitutional Line Against Fiscal Dominance',
            dialogue: 'The Central Bank sets interest rates strictly to fulfill our macroeconomic mandate—never to cheapen government borrowing. Credible independence is what keeps sovereign risk premia contained.',
            parl_approval_delta: -3,
            autonomy_delta: 8,
            market_credibility_delta: 9,
            public_approval_delta: -1
          },
          {
            key: 'empathetic_disinflation',
            label: 'Emphasize How Anchored Inflation Lowers Long-End Term Premia',
            dialogue: 'Keeping inflation anchored near 2% is the single biggest contribution monetary policy can make to fiscal sustainability, because it spares taxpayers from permanent inflation risk premia on 10-year debt.',
            parl_approval_delta: 6,
            autonomy_delta: 2,
            market_credibility_delta: 4,
            public_approval_delta: 4
          },
          {
            key: 'deflect_fiscal',
            label: 'Urge a Credible Medium-Term Parliamentary Fiscal Anchor',
            dialogue: `At ${state.debt_to_gdp}% debt-to-GDP, primary budget balance is a legislative choice. A credible multi-year fiscal consolidation roadmap from Parliament would immediately compress long-term bond yields.`,
            parl_approval_delta: 4,
            autonomy_delta: 3,
            market_credibility_delta: 6,
            public_approval_delta: 3
          }
        ]
      };
    }
  },

  // 8. Savers & Pensioners in Low / Negative Real Rate Regimes
  {
    id: 'q_savers_and_pensioners_penalized',
    committee: 'Senior Citizens & Pensions Oversight Envoy',
    interrogator: 'MP Sir Reginald Thorne (Senior Citizens & Savers Alliance, Conservative)',
    party: 'Conservative',
    weight: (state) => {
      const realRate = state.interest_rate - state.inflation_cpi;
      if (state.interest_rate > 2.85 && realRate >= 0.25) return 0;
      return Math.min(8.0, 4.0 + Math.max(0, 2.75 - state.interest_rate) * 2.5 + (realRate < 0 ? 2.5 : 0));
    },
    generate: (state) => ({
      question: `Governor, with the policy rate at ${state.interest_rate}% and inflation at ${state.inflation_cpi}%, retirees and thrifty savers holding bank deposits earn ${state.interest_rate < state.inflation_cpi ? 'negative real returns' : 'razor-thin real interest'} on their life savings. Why should prudent savers see their nest eggs compressed to keep credit cheap for borrowers?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Defend Full-Economy Equilibrium Over Deposit Subsidies',
          dialogue: 'A thriving real economy with stable prices and solvent employers protects pension funds and annuities far better than artificially elevated cash rates that choke off growth.',
          parl_approval_delta: -2,
          autonomy_delta: 5,
          market_credibility_delta: 6,
          public_approval_delta: -2
        },
        {
          key: 'empathetic_disinflation',
          label: 'Commit to Positive Long-Run Real Returns via Price Stability',
          dialogue: 'Protecting the purchasing power of lifetime savings is why our 2% inflation target exists. As growth remains firm, savers benefit from stable real returns without inflation erosion.',
          parl_approval_delta: 7,
          autonomy_delta: 1,
          market_credibility_delta: 3,
          public_approval_delta: 7
        },
        {
          key: 'deflect_fiscal',
          label: 'Suggest Tax-Free Senior Savings Allowances in Parliament',
          dialogue: 'Parliament can directly boost after-tax returns for retirees by expanding tax-exempt savings accounts and retail sovereign savings bonds.',
          parl_approval_delta: 4,
          autonomy_delta: 2,
          market_credibility_delta: 4,
          public_approval_delta: 3
        }
      ]
    })
  },

  // 9. Asset Bubbles & Equity Froth (ONLY when Doll Street is genuinely surging >= 5480!)
  {
    id: 'q_asset_bubbles_and_speculation',
    committee: 'Financial Stability & Systemic Risk Panel',
    interrogator: 'MP Kenneth Davenport (Doll Street & Financial Markets Subcommittee, Conservative)',
    party: 'Conservative',
    weight: (state) => {
      if (state.stock_market_index < 5480) return 0; // Baseline starts ~5240-5450; don't call 5037 a "surge"!
      return Math.min(8.0, 4.0 + ((state.stock_market_index - 5450) / 150) * 1.5);
    },
    generate: (state) => ({
      question: `Doll Street equities have climbed to an elevated ${state.stock_market_index} points under your ${state.interest_rate}% rate regime, while corporate credit spreads have compressed to cyclical lows. Are we watching speculative financial froth build up that could destabilize banks when valuations eventually snap back?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Use Macroprudential Supervision Rather Than Rate Hikes to Police Leverage',
          dialogue: 'Monetary policy targets inflation and employment, not stock indices. We police financial leverage through bank capital stress tests and margin requirements rather than blunt rate hikes.',
          parl_approval_delta: -1,
          autonomy_delta: 6,
          market_credibility_delta: 7,
          public_approval_delta: 1
        },
        {
          key: 'empathetic_disinflation',
          label: 'Pledge Heightened Systemic Leverage & Underwriting Audits',
          dialogue: 'Complacency during calm markets is how crises germinate. Our Financial Stability Directorate has stepped up audits of margin debt and leveraged loan covenants across Tier-1 banks.',
          parl_approval_delta: 6,
          autonomy_delta: 1,
          market_credibility_delta: 4,
          public_approval_delta: 5
        },
        {
          key: 'deflect_fiscal',
          label: 'Point to Parliamentary Securities & Capital Gains Rules',
          dialogue: 'If lawmakers wish to lean against speculative trading turnover, securities margin statutes and capital-gains tax treatment sit squarely with Parliament.',
          parl_approval_delta: 3,
          autonomy_delta: 3,
          market_credibility_delta: 4,
          public_approval_delta: 2
        }
      ]
    })
  },

  // 10. MPC Split Vote (ONLY when a real >=2-dissent split occurred within the last 2 months!)
  {
    id: 'q_mpc_dissent_and_credibility_fracture',
    committee: 'Treasury Committee Oversight Panel',
    interrogator: 'MP Dr. Aris Thorne (Treasury Committee Chair, Senior Statesman)',
    party: 'Crossbench',
    weight: (state) => {
      const v = state.last_mpc_vote;
      if (!v || v.dissents < 2 || (v.months_ago || 0) > 2) return 0;
      return Math.min(8.5, 4.5 + v.dissents * 0.9);
    },
    generate: (state) => {
      const v = state.last_mpc_vote;
      return {
        question: `Governor, the Monetary Policy Committee’s recent ${v.tally_label} (${v.hawkish_dissents} hawkish, ${v.dovish_dissents} dovish dissents) has prompted market chatter over divisions at the top table. How can bond desks rely on your forward guidance when ${v.dissents} of your colleagues voted against your proposal?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Defend Open Intellectual Debate Over Artificial Unanimity',
            dialogue: 'Nine independent experts weighing complex inflection points should debate vigorously rather than rubber-stamp groupthink. Transparent voting records give markets honest visibility into our reaction function.',
            parl_approval_delta: -1,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: 2
          },
          {
            key: 'empathetic_disinflation',
            label: 'Emphasize Unanimous Commitment to the 2.0% Mandate',
            dialogue: 'Tactical differences of 25 basis points reflect healthy nuance on timing—every single member of the Committee remains 100% united around our 2.0% price-stability anchor.',
            parl_approval_delta: 6,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 5
          },
          {
            key: 'deflect_fiscal',
            label: 'Note That External Appointees Were Confirmed by Parliament',
            dialogue: 'Parliament deliberately designed a nine-member individual-accountability committee so diverse economic perspectives would be represented on the public record.',
            parl_approval_delta: 3,
            autonomy_delta: 3,
            market_credibility_delta: 4,
            public_approval_delta: 1
          }
        ]
      };
    }
  },

  // 11. Small Business Overdraft & Credit Squeeze (ONLY when commercial lending >= 5.9%)
  {
    id: 'q_small_business_credit_squeeze',
    committee: 'Enterprise & Small Business Subcommittee',
    interrogator: 'MP Priya Sharma (Small Business & Enterprise Envoy, Government Bench)',
    party: 'Coalition',
    weight: (state) => {
      if (state.bank_lending_rate < 5.9) return 0;
      return Math.min(8.5, 4.0 + (state.bank_lending_rate - 5.8) * 2.2);
    },
    generate: (state) => ({
      question: `Commercial bank lending rates sit at ${state.bank_lending_rate}% on top of your ${state.interest_rate}% base rate. Independent contractors, family bakeries, and regional manufacturers tell our committee that working-capital credit lines have become prohibitively expensive. How will Main Street enterprises survive this cost of capital?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Maintain Market-Based Risk Pricing Discipline',
          dialogue: 'Commercial lending spreads price credit risk and keep inflation anchored; subsidizing unviable borrowing ultimately drives up input prices for every small shopkeeper.',
          parl_approval_delta: -3,
          autonomy_delta: 5,
          market_credibility_delta: 6,
          public_approval_delta: -3
        },
        {
          key: 'empathetic_disinflation',
          label: 'Review SME Credit Risk Weights & Liquidity Facilities',
          dialogue: 'Healthy small enterprises are the backbone of local employment. We are examining prudential risk-weights on small-business working-capital loans to ensure creditworthy firms aren’t Rationed out.',
          parl_approval_delta: 6,
          autonomy_delta: 1,
          market_credibility_delta: 3,
          public_approval_delta: 7
        },
        {
          key: 'deflect_fiscal',
          label: 'Recommend Targeted Parliamentary SME Loan Guarantees',
          dialogue: 'Targeted state development-bank credit guarantees enacted by Parliament can lower SME borrowing spreads immediately without stoking economy-wide inflation.',
          parl_approval_delta: 4,
          autonomy_delta: 2,
          market_credibility_delta: 4,
          public_approval_delta: 3
        }
      ]
    })
  },

  // 12. Public Trust & Alienation (ONLY when public approval < 48% or confidence < 48!)
  {
    id: 'q_loss_of_public_trust',
    committee: 'Civic Accountability & Democratic Governance Committee',
    interrogator: 'MP Tobias Vance (Civic Accountability Caucus, Populist)',
    party: 'Populist',
    weight: (state) => {
      if ((state.public_approval ?? 55) >= 48 && (state.consumer_confidence ?? 55) >= 48) return 0;
      return Math.min(9.0, 4.5 + (50 - Math.min(state.public_approval ?? 50, state.consumer_confidence ?? 50)) * 0.22);
    },
    generate: (state) => ({
      question: `Public approval of your stewardship stands at just ${state.public_approval}% while consumer confidence sits at ${state.consumer_confidence}. Ordinary citizens feel central bank technocrats speak in opaque jargon detached from everyday life. How do you intend to rebuild public legitimacy?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Prioritize Long-Term Mandate Over Short-Term Polling',
          dialogue: 'Central bank statutes insulate monetary policy from monthly opinion polls precisely because sound medicine is rarely popular in the short run—results will earn back trust.',
          parl_approval_delta: -3,
          autonomy_delta: 6,
          market_credibility_delta: 6,
          public_approval_delta: -4
        },
        {
          key: 'empathetic_disinflation',
          label: 'Launch Plain-Language Town Halls & Regional Citizen Panels',
          dialogue: 'Public trust is essential to anchoring expectations. We are expanding regional town halls with small businesses, unions, and households and publishing plain-language policy summaries.',
          parl_approval_delta: 7,
          autonomy_delta: 0,
          market_credibility_delta: 3,
          public_approval_delta: 8
        },
        {
          key: 'deflect_fiscal',
          label: 'Push Back Against Partisan Scapegoating of Institutions',
          dialogue: 'Institutional trust suffers when elected partisans blame monetary technocrats for global supply shocks and unresolved fiscal trade-offs.',
          parl_approval_delta: 2,
          autonomy_delta: 4,
          market_credibility_delta: 5,
          public_approval_delta: 2
        }
      ]
    })
  },

  // 13. Commodity & Flexible Goods Inflation Shock (ONLY when flexible_cpi >= 3.0%)
  {
    id: 'q_energy_shock_and_blunt_tools',
    committee: 'Energy Security & Regional Cost-of-Living Envoy',
    interrogator: 'MP Donald MacLean (Energy & Regional Cost-of-Living Envoy, Regional Bench)',
    party: 'Regional',
    weight: (state) => {
      const flex = state.flexible_cpi ?? state.inflation_cpi;
      if (flex < 3.0) return 0;
      return Math.min(8.5, 4.0 + (flex - 2.8) * 2.0);
    },
    generate: (state) => ({
      question: `Flexible commodity and goods inflation is running at ${state.flexible_cpi ?? state.inflation_cpi}%, squeezing rural transport and home-heating budgets. Interest rates cannot drill gas wells or unsnarl freight ports—how do you avoid punishing domestic workers for external supply shocks?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Prevent Supply Spikes From Embedding Into Wage-Price Spirals',
          dialogue: 'While monetary policy cannot pump oil, firm expectations anchoring prevents one-off commodity spikes from cascading into permanent service-sector inflation.',
          parl_approval_delta: -2,
          autonomy_delta: 5,
          market_credibility_delta: 7,
          public_approval_delta: -1
        },
        {
          key: 'empathetic_disinflation',
          label: 'Look Through First-Round Supply Volatility Carefully',
          dialogue: 'Standard monetary doctrine looks through temporary first-round commodity shocks provided medium-term expectations remain moored—avoiding unnecessary economic damage.',
          parl_approval_delta: 6,
          autonomy_delta: 1,
          market_credibility_delta: 3,
          public_approval_delta: 6
        },
        {
          key: 'deflect_fiscal',
          label: 'Call for Strategic Energy Reserves & Grid Investment',
          dialogue: 'Insulating households from imported commodity volatility requires strategic reserves and domestic energy infrastructure legislated by this Parliament.',
          parl_approval_delta: 4,
          autonomy_delta: 2,
          market_credibility_delta: 4,
          public_approval_delta: 3
        }
      ]
    })
  },

  // =========================================================================
  // B. BALANCED / SOFT-LANDING / ON-TARGET (~2% CPI) & OPEN-ECONOMY OVERSIGHT
  // =========================================================================

  // 14. Soft-Landing Durability & Neutral Rate (r*) Calibration (Shines when CPI ~2% and GDP healthy!)
  {
    id: 'q_soft_landing_and_neutral_rate',
    committee: 'Treasury Select Committee',
    interrogator: 'MP Sir Alistair Sterling (Shadow Chancellor of the Exchequer, Opposition)',
    party: 'Opposition',
    weight: (state) => {
      const onTarget = state.inflation_cpi >= 1.5 && state.inflation_cpi <= 2.55;
      const healthyGdp = state.gdp_growth >= 1.5;
      if (!onTarget || !healthyGdp) return 0;
      return 7.4;
    },
    generate: (state) => {
      const question = pickVariant([
        `Governor, credit where due: headline CPI sits at ${state.inflation_cpi}% (with sticky core at ${state.sticky_cpi || state.core_inflation}%), GDP is expanding at ${state.gdp_growth}%, and unemployment is ${state.unemployment_rate}%. Now that price stability has been restored with the policy rate at ${state.interest_rate}%, where does the Bank estimate our long-run neutral rate (‘r-star’), and what threat could knock this soft landing off course?`,
        `With inflation anchored at ${state.inflation_cpi}% and real growth running at ${state.gdp_growth}%, markets are pricing a textbook soft landing around your ${state.interest_rate}% policy rate. Yet history shows calm regimes breed policy complacency—what specific leading indicators would prompt the MPC to move next?`
      ]);
      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Emphasize Data-Dependent Vigilance & Asymmetric Shock Readiness',
            dialogue: `Achieving ${state.inflation_cpi}% inflation alongside ${state.gdp_growth}% growth is encouraging, not an excuse for autopilot. We estimate nominal neutral near 3.0%–3.25% and stand ready to act swiftly if service wages or supply chains shift.`,
            parl_approval_delta: 3,
            autonomy_delta: 5,
            market_credibility_delta: 7,
            public_approval_delta: 3
          },
          {
            key: 'empathetic_disinflation',
            label: 'Credit Household & Workforce Resilience for the Soft Landing',
            dialogue: 'Anchored expectations allowed inflation to normalize without a recession—preserving jobs and paychecks. Our priority now is sustaining predictable, boring stability so families and businesses can plan confidently.',
            parl_approval_delta: 7,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 7
          },
          {
            key: 'deflect_fiscal',
            label: 'Urge Parliament to Lock In Stability With Supply-Side Reforms',
            dialogue: 'Monetary policy has delivered cyclical stability; converting this soft landing into a decade of higher non-inflationary growth now depends on parliamentary investment in skills, housing, and energy.',
            parl_approval_delta: 5,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 4
          }
        ]
      };
    }
  },

  // 15. Balance Sheet & Quantitative Tightening End-Game
  {
    id: 'q_balance_sheet_and_qt_losses',
    committee: 'Select Committee on Central Bank Operations',
    interrogator: 'MP Marcus Vance (Public Audit Subcommittee, Fiscal Hawk)',
    party: 'Conservative',
    weight: (state) => {
      if (state.balance_sheet_size === undefined || state.balance_sheet_size <= 0.4) return 0;
      const qtPace = Math.abs(state.qt_monthly_pace || 0);
      if (qtPace === 0 && state.balance_sheet_size < 3.0) return 0;
      return Math.min(7.0, 4.2 + (qtPace > 15 ? 1.5 : 0.5));
    },
    generate: (state) => {
      const isCalm = state.inflation_cpi <= 2.5;
      const qtAbs = Math.abs(state.qt_monthly_pace || 25);
      const question = isCalm
        ? `Governor, the Bank’s balance sheet stands at $${state.balance_sheet_size}T with Quantitative Tightening draining -$${qtAbs}B per month even though CPI has already settled at ${state.inflation_cpi}%. At what reserve threshold will you taper QT before overnight money-market liquidity suddenly seizes up?`
        : `The Central Bank’s balance sheet sits at $${state.balance_sheet_size}T while Quantitative Tightening runs at -$${qtAbs}B per month, generating mark-to-market accounting remittances with the Treasury. How do you justify the scale and pace of balance-sheet runoff to taxpayers?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Defend Ample-Reserves Framework & Gradual Balance Sheet Normalization',
            dialogue: 'Shrinking legacy bond holdings restores market price discovery along the yield curve and rebuilds balance-sheet capacity for future emergencies while monitoring repo spreads daily.',
            parl_approval_delta: -1,
            autonomy_delta: 6,
            market_credibility_delta: 7,
            public_approval_delta: 0
          },
          {
            key: 'empathetic_disinflation',
            label: 'Pledge Smooth QT Tapering Well Above Scarce-Reserve Levels',
            dialogue: 'We learned the lessons of past repo spikes. We monitor commercial bank reserve balances closely and will taper runoff smoothly well before money-market liquidity turns scarce, while noting past QE remitted vast cumulative surpluses to taxpayers.',
            parl_approval_delta: 6,
            autonomy_delta: 1,
            market_credibility_delta: 5,
            public_approval_delta: 4
          },
          {
            key: 'deflect_fiscal',
            label: 'Cite Statutory Treasury Indemnity & Debt-Management Coordination',
            dialogue: 'Our balance-sheet indemnity framework operates strictly under Parliamentary statute in full operational transparency with the Treasury debt office.',
            parl_approval_delta: 3,
            autonomy_delta: 3,
            market_credibility_delta: 5,
            public_approval_delta: 1
          }
        ]
      };
    }
  },

  // 16. Real Wage Recovery & Productivity (Positive Labor Angle when wages > 0 and CPI ~2%!)
  {
    id: 'q_wage_gains_and_productivity',
    committee: 'Labor & Employment Select Committee',
    interrogator: 'MP Chloe Morales (Labor & Industrial Select Committee, Socialist Bench)',
    party: 'Labor',
    weight: (state) => {
      if (state.real_wage_growth < 0.35 || state.inflation_cpi > 2.75) return 0;
      return Math.min(7.5, 4.8 + state.real_wage_growth * 1.4);
    },
    generate: (state) => ({
      question: `Governor, working households are finally seeing real wages grow by +${state.real_wage_growth}% while headline inflation remains tame at ${state.inflation_cpi}% and unemployment sits at ${state.unemployment_rate}%. Yet orthodox hawks always panic whenever workers get ahead. Will you pledge today not to hike interest rates simply to suppress healthy real wage gains?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Clarify That Productivity-Backed Wage Growth Is Non-Inflationary',
          dialogue: `The Central Bank never targets wages—we target ${state.inflation_cpi}% consumer inflation. So long as real wage gains are matched by productivity and unit labor costs stay aligned with 2% CPI, we welcome rising living standards.`,
          parl_approval_delta: 3,
          autonomy_delta: 6,
          market_credibility_delta: 7,
          public_approval_delta: 4
        },
        {
          key: 'empathetic_disinflation',
          label: 'Celebrate Rising Real Paychecks as the Fruit of Price Stability',
          dialogue: `Positive +${state.real_wage_growth}% real wage growth at ${state.inflation_cpi}% inflation proves why price stability helps workers most: raises finally buy more groceries rather than being eaten by inflation.`,
          parl_approval_delta: 7,
          autonomy_delta: 1,
          market_credibility_delta: 4,
          public_approval_delta: 8
        },
        {
          key: 'deflect_fiscal',
          label: 'Encourage Parliamentary Vocational & Productivity Investment',
          dialogue: 'The surest way to sustain +1% to +2% real wage growth indefinitely without inflationary bottlenecks is parliamentary investment in workforce skills and industrial automation.',
          parl_approval_delta: 5,
          autonomy_delta: 2,
          market_credibility_delta: 5,
          public_approval_delta: 4
        }
      ]
    })
  },

  // 17. Commercial Bank Net Interest Margins & Retail Competition
  {
    id: 'q_bank_margins_and_competition',
    committee: 'Banking Standards & Consumer Finance Panel',
    interrogator: 'MP Priya Sharma (Small Business & Consumer Finance Envoy, Coalition)',
    party: 'Coalition',
    weight: (state) => {
      const spread = (state.bank_lending_rate || 5.5) - state.interest_rate;
      if (spread < 2.0 || state.interest_rate > 4.75) return 0;
      return 6.3;
    },
    generate: (state) => {
      const spread = ((state.bank_lending_rate || 5.5) - state.interest_rate).toFixed(2);
      return {
        question: `Your official policy rate sits at ${state.interest_rate}%, yet major commercial banks charge ${state.bank_lending_rate}% on loans—a ${spread}% spread—while paying far less on instant-access household savings accounts. Is lack of competition in retail banking blunting your monetary transmission?`,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Explain Capital Buffer, Liquidity & Credit-Risk Spreads',
            dialogue: 'A ~225–250 bps spread over base rates reflects regulatory capital buffers, term funding costs, and credit-loss provisioning necessary to keep depositories resilient across cycles.',
            parl_approval_delta: -1,
            autonomy_delta: 5,
            market_credibility_delta: 6,
            public_approval_delta: -1
          },
          {
            key: 'empathetic_disinflation',
            label: 'Launch Prudential Transparency Review on Pass-Through Speed',
            dialogue: 'Asymmetric pass-through—hiking loan rates in an elevator and cutting them down the stairs—frustrates monetary policy. We are publishing bank-by-bank rate pass-through scorecards to sharpen competition.',
            parl_approval_delta: 7,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 7
          },
          {
            key: 'deflect_fiscal',
            label: 'Invite Competition Authority & Open-Banking Legislation',
            dialogue: 'Lowering switching friction through statutory Open Banking portability and challenger-bank licensing lies within Parliament’s competition jurisdiction.',
            parl_approval_delta: 4,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 4
          }
        ]
      };
    }
  },

  // 18. Election Clock & Institutional Impartiality (Capped weight, adapts to high vs low approval!)
  {
    id: 'q_election_clock_and_political_bias',
    committee: 'Parliamentary Committee on Democratic Oversight',
    interrogator: 'MP Eleanor Rigby (Campaign Ethics & Parliamentary Oversight Envoy, Opposition Whip)',
    party: 'Opposition',
    weight: (state) => {
      const months = state.months_to_election ?? 28;
      if (months > 20) return 0; // Only ask when an election is actually on the horizon!
      return Math.min(7.2, 3.8 + (20 - months) * 0.2);
    },
    generate: (state) => {
      const isGoodEconomy = state.inflation_cpi <= 2.5 && state.gdp_growth >= 1.8;
      const question = isGoodEconomy
        ? `With ${state.months_to_election} months until the general election, ministers are openly campaigning on ${state.inflation_cpi}% inflation and ${state.gdp_growth}% growth, while opposition critics warn you may delay necessary rate adjustments during campaign season. How do you guarantee strict political neutrality as polling day nears?`
        : `With just ${state.months_to_election} months until the general election, every move from your Committee carries electoral consequences in marginal constituencies. What institutional guardrails ensure your rate decisions at ${state.interest_rate}% are completely insulated from partisan pressure?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Reaffirm Total Blindness to the Electoral Calendar',
            dialogue: 'The Monetary Policy Committee never consults polling calendars—if the data require a rate move the week before an election, we will act without hesitation.',
            parl_approval_delta: -1,
            autonomy_delta: 7,
            market_credibility_delta: 7,
            public_approval_delta: 2
          },
          {
            key: 'empathetic_disinflation',
            label: 'Commit to Full Forecast, Dot-Plot & Transcript Transparency',
            dialogue: 'Every vote, staff econometric forecast, and dot-plot assumption is published in full so all parties and citizens can verify our decisions rest strictly on empirical evidence.',
            parl_approval_delta: 6,
            autonomy_delta: 2,
            market_credibility_delta: 4,
            public_approval_delta: 6
          },
          {
            key: 'deflect_fiscal',
            label: 'Urge All Parties to Maintain the Non-Partisan Charter Consensus',
            dialogue: 'Cross-party respect for central bank operational independence keeps borrowing costs lower for whichever party forms the next government.',
            parl_approval_delta: 4,
            autonomy_delta: 4,
            market_credibility_delta: 5,
            public_approval_delta: 3
          }
        ]
      };
    }
  },

  // 19. Currency Valuation, Trade & Export Competitiveness
  {
    id: 'q_currency_and_export_competitiveness',
    committee: 'International Trade & Export Competitiveness Committee',
    interrogator: 'MP Henrik Lindqvist (Export & Maritime Trade Caucus, Crossbench)',
    party: 'Crossbench',
    weight: (state) => {
      if (state.economy_type && state.economy_type !== 'large_hegemon') return 6.8;
      if ((state.currency_index || 100) >= 102.0 || (state.currency_index || 100) <= 96.5) return 6.2;
      return 3.8;
    },
    generate: (state) => {
      const curr = state.currency_index || 100;
      const isStrong = curr >= 100.5;
      const question = isStrong
        ? `Governor, our trade-weighted currency index stands at ${curr} alongside a ${state.interest_rate}% policy rate. Export manufacturers warn a firm currency squeezes overseas order margins even as it keeps imported goods inflation down at ${state.flexible_cpi ?? state.inflation_cpi}%. How does the MPC weigh export competitiveness against imported price stability?`
        : `Our domestic currency index trades at ${curr} against global peers with foreign benchmark rates near ${state.foreign_benchmark_rate || 4.5}%. While exporters enjoy cheaper pricing abroad, importers worry currency softness could feed into retail prices. How closely is the currency guiding your rate path?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Maintain Free-Floating Inflation Target Without FX Pegging',
            dialogue: 'We target domestic inflation, not a specific exchange rate level. Allowing the currency to float freely acts as an automatic shock absorber so domestic rates can serve domestic conditions.',
            parl_approval_delta: 1,
            autonomy_delta: 6,
            market_credibility_delta: 7,
            public_approval_delta: 1
          },
          {
            key: 'empathetic_disinflation',
            label: 'Monitor FX Pass-Through & Exporter Credit Conditions Closely',
            dialogue: 'We carefully model exchange-rate pass-through into tradable goods and export order books at every forecast round, ensuring rate differentials avoid destabilizing currency swings.',
            parl_approval_delta: 6,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 5
          },
          {
            key: 'deflect_fiscal',
            label: 'Highlight Trade Agreements, Port Logistics & Export Credit',
            dialogue: 'Long-term export market share is won through productivity, port infrastructure, and trade treaties negotiated by Parliament—never through competitive currency depreciation.',
            parl_approval_delta: 4,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 3
          }
        ]
      };
    }
  },

  // 20. FX Reserves & Sovereign Risk Spreads (Tailored for Small & Middle Open Economies)
  {
    id: 'q_fx_reserves_and_external_spreads',
    committee: 'External Balances & Sovereign Credit Panel',
    interrogator: 'MP Mateo Silva (Sovereign Finance & External Balances Committee, Coalition)',
    party: 'Coalition',
    weight: (state) => {
      if (!state.economy_type || state.economy_type === 'large_hegemon') return 0;
      const lowReserves = (state.fx_reserves_billions || 100) < 55 ? 2.5 : 0;
      const wideSpread = (state.sovereign_risk_spread || 65) > 140 ? 2.0 : 0;
      return Math.min(9.0, 5.5 + lowReserves + wideSpread);
    },
    generate: (state) => ({
      question: `As an open economy facing a ${state.foreign_benchmark_rate || 4.5}% global reserve rate, our sovereign risk spread stands at ${state.sovereign_risk_spread || 65} bps and FX reserves sit at $${state.fx_reserves_billions}B. How adequate is our reserve war-chest against sudden global capital-flow reversals, and when should the Bank intervene in FX markets?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Preserve FX Reserves Strictly for Disorderly Market Conditions',
          dialogue: 'FX reserves are national insurance, not a tool to fight fundamental rate differentials. Credible domestic monetary policy and institutional autonomy keep sovereign spreads narrow.',
          parl_approval_delta: 1,
          autonomy_delta: 6,
          market_credibility_delta: 8,
          public_approval_delta: 1
        },
        {
          key: 'empathetic_disinflation',
          label: 'Commit to Opportunistic Reserve Rebuilding & Smooth FX Buffering',
          dialogue: 'We actively manage our reserve buffer—accumulating foreign currency during inflow windows and deploying targeted liquidity whenever speculative spikes threaten imported family living costs.',
          parl_approval_delta: 7,
          autonomy_delta: 1,
          market_credibility_delta: 4,
          public_approval_delta: 6
        },
        {
          key: 'deflect_fiscal',
          label: 'Link Sovereign Risk Spreads to Fiscal & External Current-Account Discipline',
          dialogue: `International bond investors price our ${state.sovereign_risk_spread || 65} bps sovereign spread directly off fiscal deficits (${state.fiscal_deficit}%) and debt ratios (${state.debt_to_gdp}%). Fiscal prudence lowers spreads fastest.`,
          parl_approval_delta: 4,
          autonomy_delta: 3,
          market_credibility_delta: 6,
          public_approval_delta: 2
        }
      ]
    })
  },

  // 21. Full Employment, Skills & AI Productivity Boom
  {
    id: 'q_labor_tightness_and_automation',
    committee: 'Productivity, Innovation & Skills Committee',
    interrogator: 'MP Dr. Hannah Chen (Science, Innovation & Productivity Committee, Coalition)',
    party: 'Coalition',
    weight: (state) => {
      if (state.unemployment_rate > 4.55 || state.gdp_growth < 1.7) return 0;
      return 6.4;
    },
    generate: (state) => ({
      question: `Unemployment sits near full employment at ${state.unemployment_rate}% with GDP growing at ${state.gdp_growth}% and inflation at ${state.inflation_cpi}%. Businesses are investing heavily in AI and industrial automation to overcome skill shortages. Does rising technology productivity lift our economy’s speed limit without stoking inflation?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Require Hard Productivity Data Before Assuming Higher Speed Limits',
          dialogue: 'Central bankers have been burned before by assuming productivity miracles prematurely. We welcome supply-side gains, but will verify them in realized unit-labor-cost data before shifting neutral estimates.',
          parl_approval_delta: 1,
          autonomy_delta: 5,
          market_credibility_delta: 7,
          public_approval_delta: 1
        },
        {
          key: 'empathetic_disinflation',
          label: 'Give the Economy Room to Test Higher Non-Inflationary Capacity',
          dialogue: `Like the late-1990s productivity expansion, ${state.gdp_growth}% growth alongside ${state.inflation_cpi}% CPI suggests supply capacity is expanding—giving us room to let employment flourish without knee-jerk tightening.`,
          parl_approval_delta: 7,
          autonomy_delta: 1,
          market_credibility_delta: 4,
          public_approval_delta: 6
        },
        {
          key: 'deflect_fiscal',
          label: 'Urge Parliamentary Retraining & STEM Workforce Expansion',
          dialogue: 'Ensuring automation raises output rather than displacing mid-career workers requires parliamentary STEM apprenticeships and labor-mobility reforms.',
          parl_approval_delta: 5,
          autonomy_delta: 2,
          market_credibility_delta: 5,
          public_approval_delta: 4
        }
      ]
    })
  },

  // 22. Shadow Banking, Private Credit & Prudential Capital Rules
  {
    id: 'q_shadow_banking_and_private_credit',
    committee: 'Financial Stability & Systemic Risk Panel',
    interrogator: 'MP Lord Geoffrey Sterling (Prudential Supervision Subcommittee, Crossbench)',
    party: 'Crossbench',
    weight: (state) => {
      if (state.inflation_cpi > 4.0 || state.gdp_growth < 0.8) return 0;
      return 5.9;
    },
    generate: (state) => ({
      question: `With commercial bank lending priced at ${state.bank_lending_rate}% and Doll Street at ${state.stock_market_index} points, hundreds of billions in corporate borrowing have migrated from regulated Tier-1 banks into opaque private-credit and non-bank funds. Does the Central Bank have visibility into shadow-banking systemic risk?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Enforce Strict Bank Counterparty & Credit-Line Guardrails',
          dialogue: 'Private credit funds rely on credit lines from regulated banks. By stress-testing bank exposures to non-bank financial intermediaries, we ring-fence core depositories from shadow-fund losses.',
          parl_approval_delta: 2,
          autonomy_delta: 6,
          market_credibility_delta: 7,
          public_approval_delta: 2
        },
        {
          key: 'empathetic_disinflation',
          label: 'Expand System-Wide Non-Bank Stress Testing & Data Reporting',
          dialogue: 'Financial innovation must not create blind spots. We are launching joint system-wide liquidity stress exercises covering pension funds, insurers, and private credit vehicles.',
          parl_approval_delta: 6,
          autonomy_delta: 2,
          market_credibility_delta: 5,
          public_approval_delta: 4
        },
        {
          key: 'deflect_fiscal',
          label: 'Request Statutory Perimeter Expansion From Parliament',
          dialogue: 'The Bank can only supervise institutions within the statutory perimeter Parliament grants us; bringing non-bank lenders under formal reporting requires primary legislation.',
          parl_approval_delta: 4,
          autonomy_delta: 3,
          market_credibility_delta: 5,
          public_approval_delta: 2
        }
      ]
    })
  },

  // 23. Green Transition, Grid Modernization & Mandate Boundaries
  {
    id: 'q_green_transition_and_grid_credit',
    committee: 'Energy Transition & Infrastructure Finance Committee',
    interrogator: 'MP Freya Lindholm (Green Economy & Infrastructure Caucus, Progressive)',
    party: 'Progressive',
    weight: (state) => {
      if (state.inflation_cpi > 4.2 || state.gdp_growth < 0.5) return 0;
      return 5.4;
    },
    generate: (state) => ({
      question: `Grid electrification and energy resilience require massive long-term capital at current ${state.bond_yield_10y}% 10-year yields and ${state.bank_lending_rate}% commercial loan rates. Should the Central Bank offer preferential green collateral haircuts at its facilities, or stick strictly to ‘market neutrality’?`,
      strategies: [
        {
          key: 'defiant_independence',
          label: 'Defend Strict Market Neutrality & Mandate Discipline',
          dialogue: 'Mission creep corrodes central bank legitimacy. Allocating preferential credit across industries is industrial policy for elected lawmakers—our collateral rules price financial risk alone.',
          parl_approval_delta: 0,
          autonomy_delta: 7,
          market_credibility_delta: 7,
          public_approval_delta: 0
        },
        {
          key: 'empathetic_disinflation',
          label: 'Incorporate Physical & Transition Climate Risks Into Bank Stress Tests',
          dialogue: 'Extreme weather and energy bottlenecks directly impact flexible CPI (${state.flexible_cpi ?? state.inflation_cpi}%) and collateral values. Integrating climate risk scenarios into bank supervision is sound prudential risk management.',
          parl_approval_delta: 6,
          autonomy_delta: 1,
          market_credibility_delta: 4,
          public_approval_delta: 6
        },
        {
          key: 'deflect_fiscal',
          label: 'Point to Parliamentary Green Infrastructure Bonds & Subsidies',
          dialogue: 'If Parliament wants lower borrowing costs for grid projects, a capitalized National Infrastructure Bank or carbon-pricing statute is the democratically accountable instrument.',
          parl_approval_delta: 5,
          autonomy_delta: 3,
          market_credibility_delta: 5,
          public_approval_delta: 3
        }
      ]
    })
  },

  // 24. Active Macroeconomic Event Cross-Examination (Fires dynamically when an event is active!)
  {
    id: 'q_active_macro_event_oversight',
    committee: 'Joint Economic Emergency & Horizon Committee',
    interrogator: 'MP Dr. Aris Thorne (Joint Economic Horizon Committee, Crossbench)',
    party: 'Crossbench',
    weight: (state) => {
      if (!state.active_events || state.active_events.length === 0) return 0;
      return 8.6;
    },
    generate: (state) => {
      const ev = state.active_events[0];
      const isNeg = ev.polarity === 'Negative';
      const question = isNeg
        ? `Governor, the economy is currently grappling with ${ev.name} (${ev.summary}), with headline CPI at ${state.inflation_cpi}% and GDP growth at ${state.gdp_growth}%. How is the Committee calibrating your ${state.interest_rate}% policy rate so this shock doesn't derail macroeconomic stability?`
        : `Governor, the economy is experiencing a major tailwind from ${ev.name} (${ev.summary}), alongside ${state.gdp_growth}% GDP growth and ${state.inflation_cpi}% inflation. Will you allow this positive shock to expand employment and investment, or lean against it with tighter rates?`;

      return {
        question,
        strategies: [
          {
            key: 'defiant_independence',
            label: 'Anchor Medium-Term Expectations Beyond Temporary Shock Noise',
            dialogue: `Whether facing headwinds or tailwinds from ${ev.name}, our lodestar is medium-term inflation at 2.0%. We distinguish transitory impulses from persistent demand shifts.`,
            parl_approval_delta: 1,
            autonomy_delta: 6,
            market_credibility_delta: 7,
            public_approval_delta: 2
          },
          {
            key: 'empathetic_disinflation',
            label: 'Cushion Real-Economy Transmission With Agile Forward Guidance',
            dialogue: `We have updated our staff forecasting models specifically for ${ev.name}, using transparent forward guidance to keep credit flowing smoothly while safeguarding household purchasing power.`,
            parl_approval_delta: 7,
            autonomy_delta: 1,
            market_credibility_delta: 4,
            public_approval_delta: 7
          },
          {
            key: 'deflect_fiscal',
            label: 'Coordinate Sectoral Response With Parliamentary Ministries',
            dialogue: `Sector-specific impacts from ${ev.name} are best addressed through targeted ministerial supply policy alongside our steady macroeconomic anchor.`,
            parl_approval_delta: 4,
            autonomy_delta: 2,
            market_credibility_delta: 5,
            public_approval_delta: 3
          }
        ]
      };
    }
  }
];

/**
 * Generates 3 varied, indicator-faithful questions tailored to the live economic state,
 * rate trajectory, and anti-repetition cooldown history.
 */
function generateParliamentaryQuestions(state, session) {
  const trajectory = getRateTrajectory(state, session);
  const recentIds = new Set(Array.isArray(state.recent_hearing_question_ids) ? state.recent_hearing_question_ids : []);

  // Score only archetypes whose indicator preconditions are genuinely satisfied (weight > 0)
  const candidates = [];
  for (const arch of QUESTION_ARCHETYPES) {
    const rawWeight = arch.weight ? arch.weight(state, trajectory) : 0;
    if (rawWeight <= 0) continue;

    // Strong anti-repetition penalty for recently asked questions in prior hearings
    const recencyMultiplier = recentIds.has(arch.id) ? 0.08 : 1.0;
    // Healthy stochastic spread so top relevant questions rotate naturally
    const jitter = 0.72 + Math.random() * 0.56;
    const score = rawWeight * recencyMultiplier * jitter;
    candidates.push({ arch, score, rawWeight });
  }

  // Weighted sampling without replacement across distinct committees
  const selected = [];
  const pickedCommittees = new Set();
  const pickedInterrogators = new Set();

  let pool = [...candidates];
  while (selected.length < 3 && pool.length > 0) {
    // Filter out duplicate committees/interrogators first
    const distinctPool = pool.filter(
      c => !pickedCommittees.has(c.arch.committee) && !pickedInterrogators.has(c.arch.interrogator)
    );
    const activePool = distinctPool.length > 0 ? distinctPool : pool;

    // Sample proportionally to score^1.6 (favors top-relevance issues while preserving real variety)
    const weights = activePool.map(c => Math.pow(Math.max(0.05, c.score), 1.6));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let r = Math.random() * totalWeight;
    let chosenIdx = 0;
    for (let i = 0; i < activePool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosenIdx = i;
        break;
      }
    }

    const chosen = activePool[chosenIdx];
    pickedCommittees.add(chosen.arch.committee);
    pickedInterrogators.add(chosen.arch.interrogator);

    const generated = chosen.arch.generate(state, trajectory);
    selected.push({
      id: chosen.arch.id,
      interrogator: chosen.arch.interrogator,
      party: chosen.arch.party,
      question: generated.question,
      strategies: generated.strategies
    });

    pool = pool.filter(c => c.arch.id !== chosen.arch.id);
  }

  return selected;
}

module.exports = {
  generateParliamentaryQuestions,
  QUESTION_ARCHETYPES,
  getRateTrajectory
};
