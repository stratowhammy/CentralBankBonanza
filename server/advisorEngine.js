const { calculateTaylorRule } = require('./simulationEngine');

// Advisor chat response generator
async function handleAdvisorChat(userMessage, state, chatHistory = [], apiKey = null, newsArticles = [], sessionMeta = {}, model = 'deepseek-v4-pro') {
  const taylorRate = calculateTaylorRule(state);
  const currentRate = Number(state.interest_rate).toFixed(2);
  const cpiRate = Number(state.inflation_cpi).toFixed(2);

  const rowProvider = require('./db').prepare("SELECT value FROM system_settings WHERE key = 'llm_provider'").get();
  const provider = rowProvider ? rowProvider.value : 'deepseek_flash';

  const effectiveKey = apiKey || process.env.DEEPSEEK_API_KEY;

  if (effectiveKey && effectiveKey.trim().length > 5 && provider !== 'local_only') {
    try {
      return await generateChatWithDeepSeek(userMessage, state, chatHistory, effectiveKey, taylorRate, newsArticles, sessionMeta, model);
    } catch (err) {
      console.warn('DeepSeek advisor chat failed, falling back to local advisor:', err.message);
    }
  }

  // High-fidelity local economic advisor reasoning engine (synthesizes live macro data AND news context)
  const msgLower = userMessage.toLowerCase();
  let reply = '';

  const gloombergArt = newsArticles.find(a => a.publisher === 'gloomberg');
  const dollStreetArt = newsArticles.find(a => a.publisher === 'doll_street');
  const gothamArt = newsArticles.find(a => a.publisher === 'gotham');
  const cashingtonArt = newsArticles.find(a => a.publisher === 'cashington');

  const monthInQ = sessionMeta.month_in_quarter || 1;
  const isMpcMonth = monthInQ === 3;
  const currentQ = sessionMeta.current_quarter || 1;
  const currentYr = sessionMeta.current_year || 1;

  // 1. STRATEGIC ADVICE / "WHAT SHOULD WE DO?" / NEXT MOVES
  if (
    msgLower.includes('advice') || msgLower.includes('advise') || msgLower.includes('recommend') ||
    msgLower.includes('what should') || msgLower.includes('how should') || msgLower.includes('strategy') ||
    msgLower.includes('next move') || msgLower.includes('next step') || msgLower.includes('suggest') ||
    msgLower.includes('plan') || msgLower.includes('option') || msgLower.includes('priorit')
  ) {
    const taylorGap = (taylorRate - currentRate).toFixed(2);
    const inflationGap = (cpiRate - 2.0).toFixed(2);

    if (isMpcMonth) {
      reply = `Governor, this is Month 3 of Quarter ${currentQ}—our formal **Monetary Policy Committee (MPC) Decision Month**. A vote is required.

**Current Macroeconomic Posture:**
• **Benchmark Policy Rate:** **${currentRate}%** (Taylor Rule Model: **${taylorRate}%**)
• **Headline CPI Inflation:** **${cpiRate}%** (Target: **2.00%**)
• **Real GDP Growth:** **${state.gdp_growth}%** | **Unemployment:** **${state.unemployment_rate}%** (NAIRU: 4.2%)

**Recommended Tactical Courses of Action:**
1. **${Number(currentRate) < Number(taylorRate) && Number(cpiRate) > 2.5 ? 'Raise Rates by +25 bps' : 'Hold Rates Steady at ' + currentRate + '%'}**: ${
        Number(currentRate) < Number(taylorRate) && Number(cpiRate) > 2.5
          ? `Our policy rate remains accommodative relative to Taylor guidance. A modest 25 bps hike reinforces inflation expectations without shocking corporate credit.`
          : `With inflation near target and unemployment at ${state.unemployment_rate}%, a patient hold preserves credit stability and accommodates real GDP growth.`
      }

2. **Communicate Forward Guidance:** Accompany your rate decision with clear telegraphing. If inflation fears linger, emphasize data-dependence; if growth is soft, signal that rates have peaked.

3. **Parliamentary Engagement:** Parliamentary approval stands at **${state.parliamentary_approval}%**. Before elections draw closer (${state.months_to_election} months remaining), consider tabling a targeted credit policy to build cross-party goodwill.`;
    } else {
      reply = `Governor, we are in **Month ${monthInQ} of Quarter ${currentQ}**—an inter-meeting period. The benchmark policy rate is fixed at **${currentRate}%** until the Month 3 committee session.

**Recommended Strategy for this Interim Month:**

1. **Deploy Forward Guidance:** Use your public platform to steer bond markets and Doll Street. If you foresee tightening in Month 3, hint at persistent core stickiness; if leaning toward a pause or cut, highlight supply normalization.

2. **Launch a Strategic Media Blitz:** Target **Main Street** to reassure consumers on grocery price stability, or address **Doll Street** to calm commercial lending jitters (${state.bank_lending_rate}% prime lending).

3. **Sponsor Parliamentary Reform:** With parliamentary confidence at **${state.parliamentary_approval}%**, submit a legislative initiative in the **Parliament Reform** tab (e.g. Housing Liquidity or Banking Buffers) to secure political capital before Question Time.

${gloombergArt ? `*Fixed-Income Desk Intelligence:* Gloomberg leads with *"${gloombergArt.headline}"*, reporting dealer whispers: ${gloombergArt.whisper_quote || '"Watching the curve closely."'}` : ''}`;
    }

  // 2. RATES / TAYLOR RULE / MONETARY POLICY STANCE
  } else if (
    msgLower.includes('rate') || msgLower.includes('hike') || msgLower.includes('cut') ||
    msgLower.includes('interest') || msgLower.includes('taylor') || msgLower.includes('neutral') ||
    msgLower.includes('basis point') || msgLower.includes('bps') || msgLower.includes('tighten') ||
    msgLower.includes('ease') || msgLower.includes('stance')
  ) {
    const isAccommodative = Number(currentRate) < Number(taylorRate);
    const gap = Math.abs(taylorRate - currentRate).toFixed(2);

    reply = `Governor, our official benchmark policy rate is currently **${currentRate}%**, while headline inflation stands at **${cpiRate}%** against our 2.0% objective.

**Taylor Rule Benchmark Analysis:**
• **Estimated Neutral Policy Rate:** **${taylorRate}%**
• **Policy Stance:** **${isAccommodative ? 'Accommodative' : 'Restrictive'}** (Taylor Gap: **${gap}%**)
• **Prime Commercial Lending Rate:** **${state.bank_lending_rate}%**

${isAccommodative
  ? `Because the policy rate sits below the Taylor target, monetary conditions are providing net stimulus. If consumer inflation expectations drift upward, we risk wage-price friction.`
  : `Operating at or above neutral exerts downward pressure on demand. While effective at choking off inflation, further tightening will compress commercial credit and slow annualized GDP growth (currently ${state.gdp_growth}%).`}

${isMpcMonth 
  ? `**Decision Timing:** This is Month 3—the formal MPC voting session. You must calibrate whether to adjust rates or hold.` 
  : `**Decision Timing:** We are in Month ${monthInQ} of 3. The rate remains steady at **${currentRate}%**. Our lever today is **Forward Guidance** to prepare markets for the upcoming quarter.`}`;

  // 3. INFLATION / CPI / PRICES / COST OF LIVING
  } else if (
    msgLower.includes('inflation') || msgLower.includes('cpi') || msgLower.includes('price') ||
    msgLower.includes('cost of living') || msgLower.includes('sticky') || msgLower.includes('goods') ||
    msgLower.includes('services') || msgLower.includes('purchasing power')
  ) {
    const activeEvent = state.active_events && state.active_events.length > 0 ? state.active_events[0] : null;

    reply = `Governor, here is our deep-dive analysis on price pressures across the domestic economy:

**Price Telemetry Breakdown:**
• **Headline CPI Inflation:** **${cpiRate}%** (Central Bank Target: **2.00%**)
• **Sticky Core Services CPI:** **${state.sticky_cpi || state.core_inflation}%**
• **Flexible Goods CPI:** **${state.flexible_cpi || state.inflation_cpi}%**
• **Real Wage Growth:** **${state.real_wage_growth}%** (${state.real_wage_growth < 0 ? 'eroding worker purchasing power' : 'supporting positive real earnings'})

${activeEvent ? `**Exogenous Factor:** The active event **${activeEvent.name}** is creating upward cost pressures.\n` : ''}
${Number(currentRate) >= Number(cpiRate) 
  ? `Our benchmark rate of **${currentRate}%** provides a positive real policy rate buffer (+${(currentRate - cpiRate).toFixed(2)}%), exerting downward traction on price-setting behavior.` 
  : `Our benchmark rate of **${currentRate}%** is currently below headline inflation, resulting in negative real rates (-${(cpiRate - currentRate).toFixed(2)}%). This risks unanchoring long-term inflation expectations if maintained indefinitely.`}

${gothamArt ? `*Public Mood:* The Gotham Tribune writes: *"${gothamArt.headline}"*. Lawmakers are tracking grocery sentiment closely.` : ''}`;

  // 4. ECONOMIC GROWTH / GDP / RECESSION / OUTPUT
  } else if (
    msgLower.includes('growth') || msgLower.includes('gdp') || msgLower.includes('recession') ||
    msgLower.includes('slowdown') || msgLower.includes('output') || msgLower.includes('productivity') ||
    msgLower.includes('expansion') || msgLower.includes('depression')
  ) {
    const gdpVal = Number(state.gdp_growth);
    const growthStatus = gdpVal > 2.5 ? 'Robust Expansion' : gdpVal > 1.2 ? 'Moderate Growth' : gdpVal > 0 ? 'Sluggish / Stagnant' : 'Contractionary / Recessionary';

    reply = `Governor, annualized Real GDP Growth is currently registering at **${state.gdp_growth}%**, reflecting a **${growthStatus}** regime.

**Macroeconomic Output Telemetry:**
• **Real GDP Growth:** **${state.gdp_growth}%** (Long-Run Potential: ~2.2%)
• **Prime Commercial Borrowing Rate:** **${state.bank_lending_rate}%**
• **Corporate Equity Index (Doll Street):** **${state.stock_market_index} pts**

${gdpVal < 1.5 
  ? `Growth is lagging potential. Heightened borrowing costs are cooling business capital expenditures. If our policy rate remains at **${currentRate}%** without forward guidance reassurance, private payroll investment may decelerate.` 
  : `The real economy continues to demonstrate resilient capacity absorption. Corporate earnings are holding up, providing adequate runway to maintain price discipline.`}

To support productive capital formation without fueling inflation, you can propose an **Infrastructure & Grid Resilience Bill** through the Parliament Reform desk.`;

  // 5. LABOR / JOBS / UNEMPLOYMENT / WAGES
  } else if (
    msgLower.includes('job') || msgLower.includes('unemploy') || msgLower.includes('labor') ||
    msgLower.includes('labour') || msgLower.includes('worker') || msgLower.includes('wage') ||
    msgLower.includes('hiring') || msgLower.includes('nairu') || msgLower.includes('payroll')
  ) {
    const unempVal = Number(state.unemployment_rate);
    const nairuDiff = (unempVal - 4.2).toFixed(2);

    reply = `Governor, the national unemployment rate is currently **${state.unemployment_rate}%**, compared to our estimated Non-Accelerating Inflation Rate of Unemployment (NAIRU) of **4.20%**.

**Labor Market Telemetry:**
• **Unemployment Rate:** **${state.unemployment_rate}%** (Labor Gap vs NAIRU: **${nairuDiff > 0 ? '+' : ''}${nairuDiff}%**)
• **Real Wage Growth:** **${state.real_wage_growth}%**
• **Headline CPI:** **${cpiRate}%**

${unempVal > 4.5 
  ? `The labor market is showing slack. While this helps abate wage-push inflation, prolonged unemployment above 4.5% risks parliamentary blowback and voter discontent before the general election.` 
  : `The labor market remains exceptionally tight. When unemployment sits near or below 4.2%, employers compete for talent, creating wage-spiral risks if productivity fails to keep pace.`}

If labor discontent is rising, deploying a **Media Blitz** targeted at Main Street or drafting a **Labor Productivity Compact** in Parliament can bolster public sentiment.`;

  // 6. HOUSING / MORTGAGES / REAL ESTATE / SHELTER
  } else if (
    msgLower.includes('hous') || msgLower.includes('mortgage') || msgLower.includes('shelter') ||
    msgLower.includes('rent') || msgLower.includes('property') || msgLower.includes('real estate') ||
    msgLower.includes('homeowner')
  ) {
    reply = `Governor, housing and mortgage affordability remain the most politically acute transmission channel of our monetary policy:

**Housing & Credit Indicators:**
• **Commercial Bank Lending Rate:** **${state.bank_lending_rate}%**
• **Sticky Core Services (includes Shelter):** **${state.sticky_cpi || state.core_inflation}%**
• **Official Benchmark Rate:** **${currentRate}%**

With mortgage rates anchored to commercial lending spreads, high borrowing costs squeeze first-time buyers and suppress housing turnover. Lawmakers routinely raise this during Question Time.

**Strategic Option:** I strongly advise utilizing the **Parliament Reform** tab to submit the **Residential Mortgage Liquidity & Housing Act**. Passing this bill directly moderates shelter inflation and earns significant cross-party approval.`;

  // 7. YIELD CURVE / SOVEREIGN DEBT / 10Y / 2Y / TREASURIES
  } else if (
    msgLower.includes('yield') || msgLower.includes('bond') || msgLower.includes('treasur') ||
    msgLower.includes('curve') || msgLower.includes('inversion') || msgLower.includes('10y') ||
    msgLower.includes('2y') || msgLower.includes('spread') || msgLower.includes('sovereign debt') ||
    msgLower.includes('deficit')
  ) {
    const yield10 = Number(state.bond_yield_10y);
    const yield2 = Number(state.bond_yield_2y);
    const curveSpread = (yield10 - yield2).toFixed(2);
    const isInverted = yield2 > yield10;
    const bsPace = state.qt_monthly_pace ?? -25;
    const bsPaceDesc = bsPace > 0 ? `QE: +$${bsPace}B/mo injection` : bsPace < 0 ? `QT: -$${Math.abs(bsPace)}B/mo runoff` : 'Neutral: $0B/mo';

    reply = `Governor, here is the state of the sovereign debt markets and government curve:

**Fixed Income & Curve Telemetry:**
• **10-Year Benchmark Yield:** **${yield10}%**
• **2-Year Treasury Yield:** **${yield2}%**
• **2s10s Curve Spread:** **${curveSpread > 0 ? '+' : ''}${curveSpread}%** (${isInverted ? 'Inverted Curve Warning' : 'Normal Upward Slope'})
• **Central Bank Balance Sheet:** **$${Number(state.balance_sheet_size || 7.2).toFixed(2)}T** (${bsPaceDesc}${state.discount_window_active ? ' | Discount Window: OPEN' : ''})

${isInverted 
  ? `⚠️ **Yield Curve Inversion:** The 2-year yield exceeds the 10-year yield. Historical models view prolonged inversion as a leading indicator of an impending recession.` 
  : `The yield curve exhibits a constructive positive slope, preserving net interest margins for regional depositories and signaling stable long-term growth expectations.`}

${gloombergArt ? `*Gloomberg Market Wire:* *"${gloombergArt.headline}"* — traders note: ${gloombergArt.whisper_quote || '"Watching sovereign debt issuance."'} ` : ''}`;

  // 7b. BALANCE SHEET / QE / QT / ASSET PURCHASES / DISCOUNT WINDOW
  } else if (
    msgLower.includes('balance sheet') || msgLower.includes('qe') || msgLower.includes('qt') ||
    msgLower.includes('quantitative easing') || msgLower.includes('quantitative tightening') ||
    msgLower.includes('asset purchase') || msgLower.includes('discount window') ||
    msgLower.includes('runoff') || msgLower.includes('injection') || msgLower.includes('liquidity facility')
  ) {
    const bsSize = Number(state.balance_sheet_size ?? 7.2).toFixed(2);
    const bsPace = state.qt_monthly_pace ?? -25;
    const isQe = bsPace > 0;
    const isQt = bsPace < 0;
    const isNeutral = bsPace === 0;
    const discountRate = (state.discount_window_rate ?? (Number(currentRate) + 1.0)).toFixed(2);

    reply = `Governor, here is the active operational status of the Central Bank Balance Sheet & Liquidity Desk:

**Balance Sheet & Liquidity Telemetry:**
• **Total Asset Portfolio:** **$${bsSize}T** (Sovereign Bonds & MBS)
• **Monthly Operational Pace:** **${isQe ? `Quantitative Easing (QE: +$${bsPace}B/mo injection)` : isQt ? `Quantitative Tightening (QT: -$${Math.abs(bsPace)}B/mo runoff)` : 'Neutral ($0B/mo reinvestment)'}**
• **Emergency Discount Window:** **${state.discount_window_active ? `FACILITY OPEN (Standing liquidity at penalty rate: ${discountRate}%)` : 'FACILITY CLOSED (Normal interbank channels)'}**
• **Policy Benchmark Rate:** **${currentRate}%** | **10-Year Yield:** **${state.bond_yield_10y}%**

**Operational Assessment:**
${isQe
  ? `We are currently conducting active **Quantitative Easing (QE)** at a rate of **+$${bsPace}B per month**. We are purchasing sovereign debt and mortgage-backed securities to inject reserves, expand commercial bank liquidity, and suppress long-term term premia.`
  : isQt
  ? `We are currently executing **Quantitative Tightening (QT)** at a rate of **-$${Math.abs(bsPace)}B per month**. Maturing sovereign paper is rolled off without reinvestment, absorbing excess banking reserves and lifting term premia.`
  : `The balance sheet is operating in **Neutral Reinvestment ($0B/mo)**—we are reinvesting maturing principal to keep total assets steady at $${bsSize}T.`}

${state.discount_window_active
  ? `⚠️ **Discount Window Alert:** The Emergency Discount Window is **OPEN** under Walter Bagehot’s classic rule. While this arrests interbank liquidity runs and narrows bank lending spreads, Parliamentary Select Committee lawmakers scrutinize standing emergency facilities closely.`
  : `The Emergency Discount Window is currently closed. Interbank borrowing is functioning smoothly through market-based facilities.`}

You can adjust the QE/QT monthly pace or toggle the Emergency Discount Window at any time via the **Central Bank Portfolio** tile on your dashboard.`;

  // 8. BANKING / CREDIT / FINANCIAL STABILITY / LIQUIDITY
  } else if (
    msgLower.includes('bank') || msgLower.includes('credit') || msgLower.includes('lend') ||
    msgLower.includes('liquidity') || msgLower.includes('solvency') || msgLower.includes('tier-1') ||
    msgLower.includes('stress') || msgLower.includes('capital buffer')
  ) {
    reply = `Governor, our assessment of the commercial banking system and credit stability:

**Banking Sector Metrics:**
• **Prime Commercial Lending Rate:** **${state.bank_lending_rate}%**
• **Central Bank Policy Benchmark:** **${currentRate}%**
• **Doll Street Financial Index:** **${state.stock_market_index} pts**

Banks are maintaining healthy regulatory capital ratios, but elevated lending rates are dampening commercial credit creation and small business revolver facilities. 

**Recommendation:** We can sponsor the **Prudential Banking Capital Buffer & Lending Stability Act** to expand discount window collateral eligibility and lower commercial spreads without reducing our headline inflation-fighting posture.`;

  // 9. FOREIGN EXCHANGE / CURRENCY / DOLLAR / RESERVES
  } else if (
    msgLower.includes('currency') || msgLower.includes('exchange rate') || msgLower.includes('dollar') ||
    msgLower.includes('forex') || msgLower.includes('fx') || msgLower.includes('import') ||
    msgLower.includes('export') || msgLower.includes('reserves') || msgLower.includes('capital flow')
  ) {
    reply = `Governor, here is our international currency and external trade telemetry:

**External Stance:**
• **Policy Rate:** **${currentRate}%**
• **Market Credibility:** **${state.market_credibility || 75}/100**
• **Headline CPI:** **${cpiRate}%**

Our current interest rate differentials against major foreign central banks dictate capital inflows and sovereign bond demand. When our rates provide an attractive risk-adjusted yield, foreign reserve accumulation accelerates and import costs decline.

To reinforce foreign institutional confidence, consider deploying a **Foreign FX & Sovereign Funds Media Blitz** to highlight our fiscal resilience and institutional independence.`;

  // 10. PARLIAMENT / POLITICS / APPROVAL / JOB SECURITY / HEARINGS
  } else if (
    msgLower.includes('parliament') || msgLower.includes('politic') || msgLower.includes('hear') ||
    msgLower.includes('question time') || msgLower.includes('select committee') || msgLower.includes('lawmaker') ||
    msgLower.includes('mp') || msgLower.includes('senat') || msgLower.includes('election') ||
    msgLower.includes('approval') || msgLower.includes('job security') || msgLower.includes('fire') ||
    msgLower.includes('resignation') || msgLower.includes('confidence')
  ) {
    const isSummonsRisk = state.parliamentary_approval < 35;

    reply = `Governor, here is your executive political standing in the capital:

**Legislative & Public Standing:**
• **Parliamentary Confidence:** **${state.parliamentary_approval}%** (Threshold to avoid summons: 35%)
• **Public Approval:** **${state.public_approval}%**
• **Governor Job Security:** **${state.job_security}%** (Formal Warnings: ${state.warning_count || 0}/3)
• **Time to General Election:** **${state.months_to_election} months**

${isSummonsRisk 
  ? `⚠️ **Elevated Political Risk:** Parliamentary confidence has fallen below 35%. Lawmakers from the Select Committee may issue a formal summons if dissatisfied at the next hearing.` 
  : `Your parliamentary standing remains firm above the 50% threshold required to pass statutory monetary legislation.`}

${cashingtonArt ? `*Cashington Post Coverage:* *"${cashingtonArt.headline}"*. Lawmakers are watching our rate trajectory closely.` : ''}

**Recommended Action:** Submit a collaborative legislative reform bill or execute a **Parliamentary Division Blitz** to insulate your tenure.`;

  // 11. STOCK MARKET / DOLL STREET / EQUITIES
  } else if (
    msgLower.includes('stock') || msgLower.includes('market') || msgLower.includes('doll street') ||
    msgLower.includes('wall street') || msgLower.includes('equity') || msgLower.includes('equities')
  ) {
    const yieldInversion = state.bond_yield_2y > state.bond_yield_10y;

    reply = `Governor, the Doll Street Index is trading at **${state.stock_market_index} points**.

**Market Telemetry:**
• **Doll Street Index:** **${state.stock_market_index} pts**
• **10-Year Sovereign Yield:** **${state.bond_yield_10y}%**
• **Policy Benchmark Rate:** **${currentRate}%**
• **Commercial Lending Rate:** **${state.bank_lending_rate}%**

${dollStreetArt ? `*Doll Street Journal:* *"${dollStreetArt.headline}"*. Traders are pricing in future rate trajectory.` : ''}
${yieldInversion 
  ? `Equity trading desks are cautious due to the 2s10s yield curve inversion (${state.bond_yield_2y}% vs ${state.bond_yield_10y}%).` 
  : `Financial conditions remain orderly. Equity multiples are supported by steady liquidity.`}

Surprise rate adjustments in Month 3 will trigger market volatility unless properly prepared via forward guidance.`;

  // 12. PRESS / NEWS / MEDIA WIRES
  } else if (
    msgLower.includes('news') || msgLower.includes('media') || msgLower.includes('press') ||
    msgLower.includes('report') || msgLower.includes('story') || msgLower.includes('gloomberg') ||
    msgLower.includes('whisper')
  ) {
    reply = `Governor, here is our intelligence briefing on the active media dispatches for Year ${currentYr}, Month ${sessionMeta.current_month || 1}:

${newsArticles.length > 0 
  ? newsArticles.map(a => `• **${a.publisher.toUpperCase()}** (${a.byline || 'Staff'}): *"${a.headline}"*\n  *Desk Whisper:* ${a.whisper_quote || 'Monitoring central bank communications.'}`).join('\n\n') 
  : 'No major press dispatches have cleared the editorial wires yet this month.'}

The prevailing press sentiment is **${gloombergArt?.tone || 'analytical'}**. Forward guidance remains your strongest tool to counteract negative editorial spins before markets price them in.`;

  // 13. DYNAMIC FALLBACK EXECUTIVE BRIEFING (Never repetitive or static)
  } else {
    // Determine top tension dynamically
    let topTension = '';
    if (Number(cpiRate) > 3.0) {
      topTension = `Elevated inflation at **${cpiRate}%** remains our most pressing vulnerability. Core service stickiness requires resolute policy credibility.`;
    } else if (Number(state.unemployment_rate) > 4.8) {
      topTension = `Labor market softening (unemployment at **${state.unemployment_rate}%**) threatens household income and risks legislative pushback.`;
    } else if (state.bond_yield_2y > state.bond_yield_10y) {
      topTension = `A **2s10s yield curve inversion** is flashing recessionary signals, making commercial credit markets cautious.`;
    } else if (state.parliamentary_approval < 40) {
      topTension = `Parliamentary confidence is depressed at **${state.parliamentary_approval}%**, requiring diplomatic outreach before upcoming hearings.`;
    } else {
      topTension = `The macroeconomic framework is in equilibrium, with GDP growth at **${state.gdp_growth}%** and inflation at **${cpiRate}%**.`;
    }

    reply = `Governor, as your Chief of Staff and Economic Advisor, I am tracking both live telemetry and newsroom sentiment.

**Current Executive Telemetry (Year ${currentYr}, Month ${sessionMeta.current_month || 1}):**
• **Official Benchmark Rate:** **${currentRate}%** (Taylor Rule Estimate: **${taylorRate}%**)
• **Inflation Pressures:** Headline CPI **${cpiRate}%** | Core Services **${state.sticky_cpi || state.core_inflation}%**
• **Real Economy:** GDP Growth **${state.gdp_growth}%** | Unemployment **${state.unemployment_rate}%**
• **Financial Desks:** Doll Street **${state.stock_market_index} pts** | 10Y Yield **${state.bond_yield_10y}%**
• **Balance Sheet & Liquidity:** **$${Number(state.balance_sheet_size || 7.2).toFixed(2)}T** (${(state.qt_monthly_pace ?? -25) > 0 ? `QE: +$${state.qt_monthly_pace}B/mo injection` : (state.qt_monthly_pace ?? -25) < 0 ? `QT: -$${Math.abs(state.qt_monthly_pace ?? -25)}B/mo runoff` : 'Neutral: $0B/mo'}${state.discount_window_active ? ' | Discount Window: OPEN' : ''})
• **Political Standing:** Parliamentary Approval **${state.parliamentary_approval}%** | Job Security **${state.job_security}%**

**Executive Assessment:**
${topTension}

${newsArticles.length > 0 ? `*Lead Media Headline:* ${newsArticles[0].publisher.toUpperCase()} reports *"${newsArticles[0].headline}"*.` : ''}

You can direct me to analyze **interest rate scenarios**, assess **labor and inflation dynamics**, review **parliamentary strategy**, or execute a **Media Blitz**. How shall we proceed?`;
  }

  return reply;
}

// DeepSeek integration for Chief of Staff & Senior Economic Advisor (powered by deepseek-v4-pro)
async function generateChatWithDeepSeek(userMessage, state, history, apiKey, taylorRate, newsArticles = [], sessionMeta = {}, model = 'deepseek-v4-pro') {
  const currentRate = Number(state.interest_rate).toFixed(2);
  const cpiRate = Number(state.inflation_cpi).toFixed(2);

  // Format press articles context for the Chief of Staff
  const pressBriefing = (newsArticles && newsArticles.length > 0)
    ? newsArticles.map(a => `• [${a.publisher.toUpperCase()}] "${a.headline}" (Byline: ${a.byline || 'Staff'}). Stance: ${a.tone}. Hallway Whisper: "${a.whisper_quote || 'None'}". Excerpt: "${a.body.substring(0, 180)}..."`).join('\n')
    : 'No press dispatches published yet for this month.';

  // Format active events cleanly without internal IDs
  const activeEventsClean = (state.active_events && state.active_events.length > 0)
    ? state.active_events.map(e => `${e.name} (${e.summary})`).join('; ')
    : 'None';

  // Format recent policy turns if available
  const recentTurnsSummary = (sessionMeta.recentTurns && sessionMeta.recentTurns.length > 0)
    ? `\nRECENT CENTRAL BANK POLICY ACTIONS:\n` + sessionMeta.recentTurns.map(t => `• Year ${t.year}, Month ${t.month} (Q${t.quarter} M${t.month_in_quarter}): ${t.action_type === 'mpc_rate_decision' ? `MPC Rate Decision: ${t.action_value > 0 ? '+' : ''}${t.action_value} bps` : `${t.action_type} - ${t.statement || 'No statement'}`}`).join('\n')
    : '';

  const systemPrompt = `You are the Chief of Staff and Senior Economic Advisor to the Governor / Chair of the Central Bank.
You are an elite macroeconomic strategist, master of monetary theory, bond market micro-structure, and legislative parliamentary politics.
You speak candidly, strategically, and loyally to the Governor, addressing them respectfully as "Governor".

AUTHORITATIVE CURRENT MACROECONOMIC TELEMETRY (LIVE GROUND TRUTH):
- Calendar Date: Year ${sessionMeta.current_year || 1}, Month ${sessionMeta.current_month || 1} (Quarter ${sessionMeta.current_quarter || 1}, Month ${sessionMeta.month_in_quarter || 1} of 3)
- Current Cycle Phase: ${sessionMeta.month_in_quarter === 3 ? 'MONETARY POLICY COMMITTEE (MPC) MEETING MONTH — A formal interest rate decision is required this month!' : `INTER-MEETING PERIOD (Month ${sessionMeta.month_in_quarter} of Quarter ${sessionMeta.current_quarter}) — The policy rate is steady at ${currentRate}%; Governor may issue forward guidance or remain silent.`}
- OFFICIAL CENTRAL BANK POLICY BENCHMARK RATE: EXACTLY ${currentRate}%
  ⚠️ MANDATORY RULE: The Central Bank policy rate is currently ${currentRate}%. Any past messages in conversation history referencing an older rate were from earlier months; you MUST state the current policy rate as ${currentRate}%. Do NOT confuse this with the Taylor Rule model target (${taylorRate}%) or prime commercial lending rate (${state.bank_lending_rate}%).
- Headline CPI Inflation: ${cpiRate}% (Target 2.0%) [Flexible Goods: ${state.flexible_cpi || state.inflation_cpi}%, Sticky Core Services: ${state.sticky_cpi || state.core_inflation}%]
- Theoretical Taylor Rule Target: ${taylorRate}% (Model indicates current policy is ${Number(currentRate) < Number(taylorRate) ? 'accommodative by ' + (taylorRate - currentRate).toFixed(2) + '%' : 'restrictive by ' + (currentRate - taylorRate).toFixed(2) + '%'})
- Real GDP Growth: ${state.gdp_growth}% annualized
- Unemployment Rate: ${state.unemployment_rate}% (NAIRU: 4.2%)
- Doll Street Equity Index: ${state.stock_market_index} pts | Prime Commercial Lending: ${state.bank_lending_rate}%
- Sovereign Yields: 10Y Treasury: ${state.bond_yield_10y}%, 2Y Treasury: ${state.bond_yield_2y}% (Spread: ${(state.bond_yield_10y - state.bond_yield_2y).toFixed(2)}%)
- Central Bank Balance Sheet Size: $${Number(state.balance_sheet_size || 7.2).toFixed(2)}T
- Balance Sheet Operational Mode: ${(state.qt_monthly_pace ?? -25) > 0 ? `QUANTITATIVE EASING (QE) — Actively expanding the balance sheet by purchasing sovereign debt and MBS at +$${state.qt_monthly_pace}B per month to inject banking liquidity and compress yields.` : (state.qt_monthly_pace ?? -25) < 0 ? `QUANTITATIVE TIGHTENING (QT) — Actively shrinking the balance sheet by letting maturing debt roll off at -$${Math.abs(state.qt_monthly_pace ?? -25)}B per month to absorb excess reserves.` : `NEUTRAL REINVESTMENT ($0B/mo) — Maturing principal is reinvested to keep total assets stable.`}
- Emergency Discount Window Standing Liquidity Facility: ${state.discount_window_active ? `OPEN (Standing liquidity facility is actively lending reserves to commercial banks at penalty rate of ${(state.discount_window_rate ?? (Number(currentRate) + 1.0)).toFixed(2)}% under Bagehot's rule to halt liquidity panics)` : 'CLOSED (Commercial banks borrow solely through interbank repo market)'}
- Market Credibility: ${state.market_credibility || 75}/100 | Credibility Warning: ${state.credibility_warning || 'None'}
- Parliamentary Approval: ${state.parliamentary_approval}% | Public Sentiment: ${state.public_approval}%
- Governor Job Security: ${state.job_security}% (Formal Warnings: ${state.warning_count || 0}/3)
- Months to General Election: ${state.months_to_election}
- Active Macroeconomic Events: ${activeEventsClean}${recentTurnsSummary}

THIS MONTH'S PRESS DISPATCHES & MEDIA NARRATIVE:
${pressBriefing}

CORE ADVISORY GUIDELINES:
1. Address the player as "Governor".
2. ABSOLUTE RATE ACCURACY: Always cite the official Central Bank Policy Rate as exactly ${currentRate}%. Never hallucinate a different interest rate or confuse it with the Taylor Rule benchmark (${taylorRate}%) or prime lending rate (${state.bank_lending_rate}%).
3. If previous chat messages in conversation history reference an older rate, recognize that those messages were from earlier months and that the live rate is ${currentRate}%.
4. You have FULL ACCESS to this month's news coverage across Gloomberg, Doll Street Journal, Gotham News Tribune, and Cashington Post. Directly cite or analyze relevant headlines, editorial tones, or trader whispers when advising on market expectations or political risk.
5. Offer concrete tactical advice on interest rate decisions (Month 3), forward guidance signals (Months 1 & 2), parliamentary legislation, or targeted media blitzes.
6. NEVER cite raw internal software IDs (like POS-12 or NEG-05); refer to events by their natural real-world names.
7. FORMATTING REQUIREMENT: Always structure your response with clean, readable Markdown: separate distinct paragraphs with blank lines (\n\n), use bold headers for sections or topic areas, and use bullet points (• ) or numbered lists (1. , 2. ) for actionable recommendations and multi-metric summaries. Never output an unbroken wall of unspaced text. Keep your counsel crisp, authoritative, strategic, and under 260 words.
8. BALANCE SHEET & LIQUIDITY ACCURACY: Look strictly at "Balance Sheet Operational Mode". If the monthly pace is positive (e.g. +$30B/mo), the bank is actively conducting QUANTITATIVE EASING (QE), NOT QT. Do NOT state "we are not conducting QE" or claim "we are in QT" when the pace is positive! If the Emergency Discount Window is OPEN, acknowledge that standing emergency liquidity is active.`;

  // Build message history with the user's latest query
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-5).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.content })),
    { role: 'user', content: userMessage }
  ];

  const effectiveModel = model || 'deepseek-v4-pro';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: effectiveModel,
      messages,
      temperature: 0.6,
      max_tokens: 2500
    }),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Advisor DeepSeek call failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
  if (!content || !content.trim()) {
    throw new Error('DeepSeek returned an empty response (likely token limit hit)');
  }
  return content;
}

// Refine policy proposal with LLM or fallback logic
async function refineAndSubmitPolicy(rawIdea, targetSector, state) {
  let title = 'National Monetary & Credit Efficiency Bill';
  let refinedLegislation = 'Comprehensive structural policy aimed at improving capital allocation and easing systemic price pressures.';
  let effects = {
    parliamentary_approval: 4.0,
    public_approval: 2.5,
    gdp_growth: 0.15,
    inflation_cpi: -0.10
  };

  const ideaLower = rawIdea.toLowerCase();

  if (ideaLower.includes('housing') || ideaLower.includes('mortgage') || targetSector === 'housing') {
    title = 'Emergency Residential Mortgage Liquidity & Housing Act';
    refinedLegislation = `Be it enacted by Parliament: Establishing a specialized liquidity facility for conforming residential mortgages, capping prime spreads for first-time homebuyers, and encouraging high-density zoning subsidies to alleviate shelter price inflation.`;
    effects = {
      parliamentary_approval: 6.5,
      public_approval: 5.0,
      housing_cost_index: -2.5,
      inflation_cpi: -0.15
    };
  } else if (ideaLower.includes('bank') || ideaLower.includes('capital') || ideaLower.includes('reserve') || targetSector === 'banking') {
    title = 'Prudential Banking Capital Buffer & Lending Stability Act';
    refinedLegislation = `Be it enacted by Parliament: Implementing counter-cyclical capital conservation buffers for Tier-1 depository institutions, expanding collateral eligibility at the central bank discount window, and penalizing speculative asset concentration.`;
    effects = {
      parliamentary_approval: 5.0,
      public_approval: 2.0,
      bank_lending_rate: -0.20,
      market_credibility: 4.0
    };
  } else if (ideaLower.includes('wage') || ideaLower.includes('worker') || ideaLower.includes('labor') || targetSector === 'labor') {
    title = 'Labor Market Productivity & Real Purchasing Power Accord';
    refinedLegislation = `Be it enacted by Parliament: Fostering bipartisan sector-level productivity compacts, index-linking vocational training credits to high-demand technical sectors, and stabilizing collective bargaining dispute resolution mechanisms.`;
    effects = {
      parliamentary_approval: 3.5,
      public_approval: 6.0,
      real_wage_growth: 0.4,
      poverty_discontent: -4.0
    };
  } else if (ideaLower.includes('green') || ideaLower.includes('energy') || targetSector === 'energy') {
    title = 'Strategic Energy Grid Resilience & Transition Guarantee Act';
    refinedLegislation = `Be it enacted by Parliament: Underwriting low-cost concessional credit lines for domestic grid electrification, diversifying bulk liquified natural gas procurement, and insulating wholesale baseline tariffs against foreign supply chokepoints.`;
    effects = {
      parliamentary_approval: 4.5,
      public_approval: 4.5,
      flexible_cpi: -0.30,
      inflation_cpi: -0.20
    };
  }

  // Parliament voting simulation based on current parliamentary approval
  const baseSupport = Math.min(85, Math.max(25, state.parliamentary_approval));
  const randomSwing = (Math.random() * 20 - 10);
  const parliamentVoteFor = Math.round(baseSupport + randomSwing);
  const parliamentVoteAgainst = 100 - parliamentVoteFor;
  const passed = parliamentVoteFor >= 51;

  return {
    title,
    refinedLegislation,
    refined_legislation: refinedLegislation,
    target_sector: targetSector,
    status: passed ? 'passed' : 'rejected',
    parliament_vote_for: parliamentVoteFor,
    parliament_vote_against: parliamentVoteAgainst,
    effects: passed ? effects : null
  };
}

// Media blitz execution
function executeMediaBlitz(targetAudience, strategicMessage, state) {
  let publicResponse = '';
  let impactSummary = '';
  let effects = {};

  const isHawkish = strategicMessage.toLowerCase().includes('discipline') || strategicMessage.toLowerCase().includes('tight') || strategicMessage.toLowerCase().includes('inflation');
  const isDovish = strategicMessage.toLowerCase().includes('support') || strategicMessage.toLowerCase().includes('growth') || strategicMessage.toLowerCase().includes('jobs');

  if (targetAudience === 'main_street') {
    if (isHawkish) {
      publicResponse = 'Skeptical but respectful of resolute inflation-fighting stance.';
      impactSummary = 'Consumer confidence rose slightly (+1.5), expectations normalized, but mortgage angst remains.';
      effects = { consumer_confidence: 1.5, market_credibility: 1.0 };
    } else {
      publicResponse = 'Warmly received by families and small businesses.';
      impactSummary = 'Public approval jumped (+3.0), labor discontent eased, though bond traders eyed inflation risks.';
      effects = { public_approval: 3.0, consumer_confidence: 2.0 };
    }
  } else if (targetAudience === 'wall_street') {
    if (isHawkish) {
      publicResponse = 'Equities dipped on higher-for-longer messaging, but the 10-year yield stabilized.';
      impactSummary = 'Market credibility strengthened (+4.0), bond volatility subsided, stock index pulled back -45 pts.';
      effects = { market_credibility: 4.0, stock_market_index: -45 };
    } else {
      publicResponse = 'Wall Street cheered liquidity reassurance; equities rebounded.';
      impactSummary = 'Stock index rallied (+110 pts), credit spreads narrowed, but currency fell slightly (-0.4).';
      effects = { stock_market_index: 110, market_credibility: -1.0 };
    }
  } else if (targetAudience === 'parliament') {
    publicResponse = 'Select Committee lawmakers commended the Governors transparency and institutional accountability.';
    impactSummary = 'Parliamentary confidence surged (+5.5), bipartisan grilling scheduled for Question Time was canceled.';
    effects = { parliamentary_approval: 5.5 };
  } else {
    // foreign_fx
    publicResponse = 'International sovereign wealth funds and currency desks reaffirmed trust in central bank governance.';
    impactSummary = 'Currency index gained (+0.8), capital outflows reversed, foreign bond demand climbed.';
    effects = { market_credibility: 2.0 };
  }

  return {
    target_audience: targetAudience,
    strategic_message: strategicMessage,
    public_response: publicResponse,
    impact_summary: impactSummary,
    effects: effects
  };
}

module.exports = {
  handleAdvisorChat,
  refineAndSubmitPolicy,
  executeMediaBlitz
};
