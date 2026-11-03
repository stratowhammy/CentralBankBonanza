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

  if (msgLower.includes('rate') || msgLower.includes('hike') || msgLower.includes('cut') || msgLower.includes('interest')) {
    reply = `Governor, our official benchmark policy rate is currently **${currentRate}%**, while headline inflation sits at **${cpiRate}%** against our 2.0% objective. 

According to our benchmark Taylor Rule model, our estimated neutral target policy rate should be **${taylorRate}%**. 
${Number(currentRate) < Number(taylorRate) 
  ? `This indicates our current stance is accommodative (Taylor gap of ${(taylorRate - currentRate).toFixed(2)}%). If we hold rates below the Taylor benchmark while inflation expectations remain unanchored, we risk entrenching wage-price friction.` 
  : `We are currently operating at or above the estimated neutral rate. Further restrictive hikes risk exacerbating commercial credit stress (currently at ${state.bank_lending_rate}% for corporate borrowing) and slowing annualized GDP growth below ${state.gdp_growth}%.`}

${gloombergArt ? `On the fixed-income desks, Gloomberg is reporting: *"${gloombergArt.headline}"*, with primary dealers whispering: ${gloombergArt.whisper_quote || '"Watching the curve."'} ` : ''}
In Month ${monthInQ} of this cycle${isMpcMonth ? ' (our MPC meeting month), we must determine whether to adjust rates or hold' : ', our primary tool is forward guidance to steer market expectations before our formal Month 3 vote'}. On Doll Street, market pricing is closely divided. What is your priority: anchoring price expectations or preserving credit liquidity?`;

  } else if (msgLower.includes('news') || msgLower.includes('media') || msgLower.includes('press') || msgLower.includes('report') || msgLower.includes('story')) {
    reply = `Governor, here is our intelligence briefing on the active media narrative across the press desks for Year ${sessionMeta.current_year || 1}, Month ${sessionMeta.current_month || 1}:

${newsArticles.length > 0 ? newsArticles.map(a => `• **${a.publisher.toUpperCase()}** (${a.byline || 'Staff'}): *"${a.headline}"*\n  *Desk Whisper:* ${a.whisper_quote || 'Monitoring central bank communications.'}`).join('\n\n') : 'No major press dispatches have cleared the editorial wires yet this month.'}

The prevailing tone is ${gloombergArt?.tone || 'analytical'}. Our policy rate is set at **${currentRate}%**. I recommend deploying forward guidance in Month 1 or 2 to proactively shape market narratives before they harden into consensus.`;

  } else if (msgLower.includes('inflation') || msgLower.includes('cpi') || msgLower.includes('prices')) {
    const activeEvent = state.active_events && state.active_events.length > 0 ? state.active_events[0] : null;
    reply = `Governor, headline CPI stands at **${cpiRate}%**, with flexible goods at **${state.flexible_cpi || state.inflation_cpi}%** and sticky services running at **${state.sticky_cpi || state.core_inflation}%**. Real wage growth is currently at **${state.real_wage_growth}%**, meaning household purchasing power is ${state.real_wage_growth < 0 ? 'contracting in real terms' : 'modestly positive'}.

Our current policy rate of **${currentRate}%** ${Number(currentRate) < Number(cpiRate) ? 'remains negative in real terms' : 'provides a positive real rate buffer against current inflation'}.
${gothamArt ? `The Gotham Tribune is highlighting public frustration with: *"${gothamArt.headline}"*. ` : ''}
${activeEvent ? `Note that the ongoing **${activeEvent.name}** is exerting exogenous upward pressure on our price indices.` : ''}
If we want to rein in inflation without inducing an outright recession, forward guidance during Months 1 and 2 is our sharpest lever. A well-placed hawkish signal can tighten financial conditions through bond yield adjustments without waiting for the formal quarterly voting session.`;

  } else if (msgLower.includes('parliament') || msgLower.includes('politics') || msgLower.includes('job') || msgLower.includes('approval') || msgLower.includes('fire')) {
    reply = `Governor, our Parliamentary Confidence is at **${state.parliamentary_approval}%** and Public Approval is **${state.public_approval}%**. Your overall Job Security rating stands at **${state.job_security}%**.

${cashingtonArt ? `The Cashington Post is fueling political scrutiny with their lead piece: *"${cashingtonArt.headline}"*. ` : ''}
With **${state.months_to_election} months** remaining until parliamentary elections, lawmakers are hypersensitive to voter complaints over mortgage rates and grocery receipts. Our policy rate at **${currentRate}%** is being closely scrutinized. If approval dips below 25%, the Select Committee will initiate formal summons. 
I advise either submitting a targeted financial policy proposal to Parliament to demonstrate collaboration, or deploying a **Media Blitz** targeted at Main Street to explain our long-term strategy for purchasing power stability.`;

  } else if (msgLower.includes('stock') || msgLower.includes('market') || msgLower.includes('doll street') || msgLower.includes('wall street')) {
    const yieldInversion = state.bond_yield_2y > state.bond_yield_10y;
    reply = `The Doll Street Index stands at **${state.stock_market_index} points**. Commercial bank lending rates have settled at **${state.bank_lending_rate}%** with our policy rate anchored at **${currentRate}%**, and corporate debt desks are closely watching the 10-year yield (**${state.bond_yield_10y}%**).

${dollStreetArt ? `The Doll Street Journal is focusing on: *"${dollStreetArt.headline}"*. ` : ''}
${yieldInversion ? `Be aware that the 2-Year Treasury yield (${state.bond_yield_2y}%) is currently inverted against the 10-Year yield (${state.bond_yield_10y}%). Historical data shows equity desks grow skittish when inversions persist beyond two quarters.` : `The yield curve slope remains positive, providing breathing room for bank net interest margins.`}
If you intend to adjust rates at the next MPC meeting, expect equity multiples to react unless counterbalanced by reassuring forward guidance.`;

  } else {
    reply = `Governor, as your Chief of Staff and Economic Advisor, I am monitoring both macroeconomic telemetry and press coverage.

**Current Summary (Year ${sessionMeta.current_year || 1}, Month ${sessionMeta.current_month || 1}):**
- **Official Policy Rate:** ${currentRate}% (Taylor Rule Benchmark: ${taylorRate}%)
- **Price Pressures:** Headline CPI at ${cpiRate}% (Sticky Core: ${state.sticky_cpi || state.core_inflation}%)
- **Real Economy:** GDP Growth at ${state.gdp_growth}%, Unemployment at ${state.unemployment_rate}%
- **Financial Markets:** Doll Street at ${state.stock_market_index}, 10Y Yield at ${state.bond_yield_10y}%
- **Parliamentary Standing:** Confidence at ${state.parliamentary_approval}%, Job Security at ${state.job_security}%

${newsArticles.length > 0 ? `The media narrative this month is led by ${newsArticles[0].publisher.toUpperCase()}: *"${newsArticles[0].headline}"*.` : ''}

You can instruct me to **draft and submit a policy idea to Parliament**, launch a **targeted Media Blitz** to shift public expectations, or test potential rate scenarios for the upcoming quarter. How shall we proceed?`;
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
- Central Bank Balance Sheet: $${state.balance_sheet_size || 7.2}T (QT Runoff Pace: -$${Math.abs(state.qt_monthly_pace || 25)}B/mo)
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
7. Keep your counsel crisp, authoritative, strategic, and under 250 words.`;

  // Build message history with the user's latest query
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-5).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.content })),
    { role: 'user', content: userMessage }
  ];

  const effectiveModel = model || 'deepseek-v4-pro';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

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
    status: passed ? 'passed' : 'rejected',
    parliament_vote_for: parliamentVoteFor,
    parliament_vote_against: parliamentVoteAgainst,
    effects: passed ? effects : null
  };
}

// Media blitz execution
async function executeMediaBlitz(targetAudience, strategicMessage, state) {
  let publicResponse = '';
  let impactSummary = '';

  const isHawkish = strategicMessage.toLowerCase().includes('discipline') || strategicMessage.toLowerCase().includes('tight') || strategicMessage.toLowerCase().includes('inflation');
  const isDovish = strategicMessage.toLowerCase().includes('support') || strategicMessage.toLowerCase().includes('growth') || strategicMessage.toLowerCase().includes('jobs');

  if (targetAudience === 'main_street') {
    if (isHawkish) {
      publicResponse = 'Skeptical but respectful of resolute inflation-fighting stance.';
      impactSummary = 'Consumer confidence rose slightly (+1.5), expectations normalized, but mortgage angst remains.';
    } else {
      publicResponse = 'Warmly received by families and small businesses.';
      impactSummary = 'Public approval jumped (+3.0), labor discontent eased, though bond traders eyed inflation risks.';
    }
  } else if (targetAudience === 'wall_street') {
    if (isHawkish) {
      publicResponse = 'Equities dipped on higher-for-longer messaging, but the 10-year yield stabilized.';
      impactSummary = 'Market credibility strengthened (+4.0), bond volatility subsided, stock index pulled back -45 pts.';
    } else {
      publicResponse = 'Wall Street cheered liquidity reassurance; equities rebounded.';
      impactSummary = 'Stock index rallied (+110 pts), credit spreads narrowed, but currency fell slightly (-0.4).';
    }
  } else if (targetAudience === 'parliament') {
    publicResponse = 'Select Committee lawmakers commended the Governors transparency and institutional accountability.';
    impactSummary = 'Parliamentary confidence surged (+5.5), bipartisan grilling scheduled for Question Time was canceled.';
  } else {
    // foreign_fx
    publicResponse = 'International sovereign wealth funds and currency desks reaffirmed trust in central bank governance.';
    impactSummary = 'Currency index gained (+0.8), capital outflows reversed, foreign bond demand climbed.';
  }

  return {
    public_response: publicResponse,
    impact_summary: impactSummary
  };
}

module.exports = {
  handleAdvisorChat,
  refineAndSubmitPolicy,
  executeMediaBlitz
};
