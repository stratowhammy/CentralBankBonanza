const { calculateTaylorRule } = require('./simulationEngine');

// Advisor chat response generator
async function handleAdvisorChat(userMessage, state, chatHistory = [], apiKey = null, newsArticles = []) {
  const taylorRate = calculateTaylorRule(state);

  const rowProvider = require('./db').prepare("SELECT value FROM system_settings WHERE key = 'llm_provider'").get();
  const provider = rowProvider ? rowProvider.value : 'deepseek_flash';

  const effectiveKey = apiKey || process.env.DEEPSEEK_API_KEY;

  if (effectiveKey && effectiveKey.trim().length > 5 && provider !== 'local_only') {
    try {
      return await generateChatWithDeepSeek(userMessage, state, chatHistory, effectiveKey, taylorRate, newsArticles);
    } catch (err) {
      console.warn('DeepSeek advisor chat failed, falling back to local advisor:', err.message);
    }
  }

  // High-fidelity local economic advisor reasoning engine (synthesizes macro data AND news context)
  const msgLower = userMessage.toLowerCase();
  let reply = '';

  const gloombergArt = newsArticles.find(a => a.publisher === 'gloomberg');
  const dollStreetArt = newsArticles.find(a => a.publisher === 'doll_street');
  const gothamArt = newsArticles.find(a => a.publisher === 'gotham');
  const cashingtonArt = newsArticles.find(a => a.publisher === 'cashington');

  if (msgLower.includes('rate') || msgLower.includes('hike') || msgLower.includes('cut') || msgLower.includes('interest')) {
    reply = `Governor, our benchmark policy rate is **${state.interest_rate}%**, while headline inflation sits at **${state.inflation_cpi}%** against our 2.0% objective. 

According to our benchmark Taylor Rule model, our estimated target policy rate should be **${taylorRate}%**. 
${state.interest_rate < taylorRate 
  ? `This indicates our current stance is somewhat accommodative. If we hold rates below the Taylor benchmark while inflation expectations remain unanchored, we risk entrenching wage-price friction.` 
  : `We are currently operating at or above the estimated neutral rate. Further restrictive hikes risk exacerbating commercial credit stress (currently at ${state.bank_lending_rate}% for corporate borrowing) and slowing annualized GDP growth below ${state.gdp_growth}%.`}

${gloombergArt ? `On the fixed-income desks, Gloomberg is reporting: *"${gloombergArt.headline}"*, with primary dealers whispering: ${gloombergArt.whisper_quote || '"Watching the curve."'} ` : ''}
In Month 3 of this cycle, our options will range from a 25 to 50 bps adjustment or holding steady. On Doll Street, market pricing is currently divided. What is your priority: anchoring price expectations or preserving credit liquidity?`;

  } else if (msgLower.includes('news') || msgLower.includes('media') || msgLower.includes('press') || msgLower.includes('report') || msgLower.includes('story')) {
    reply = `Governor, here is our intelligence briefing on the active media narrative across the press desks this month:

${newsArticles.length > 0 ? newsArticles.map(a => `• **${a.publisher.toUpperCase()}** (${a.byline || 'Staff'}): *"${a.headline}"*\n  *Desk Whisper:* ${a.whisper_quote || 'Monitoring central bank communications.'}`).join('\n\n') : 'No major press dispatches have cleared the editorial wires yet this month.'}

The prevailing tone is ${gloombergArt?.tone || 'analytical'}. I recommend deploying forward guidance in Month 1 or 2 to proactively shape these narratives before they harden into market consensus.`;

  } else if (msgLower.includes('inflation') || msgLower.includes('cpi') || msgLower.includes('prices')) {
    const activeEvent = state.active_events && state.active_events.length > 0 ? state.active_events[0] : null;
    reply = `Governor, headline CPI stands at **${state.inflation_cpi}%**, with flexible goods at **${state.flexible_cpi || state.inflation_cpi}%** and sticky services running at **${state.sticky_cpi || state.core_inflation}%**. Real wage growth is currently at **${state.real_wage_growth}%**, meaning household purchasing power is ${state.real_wage_growth < 0 ? 'contracting in real terms' : 'modestly positive'}.

${gothamArt ? `The Gotham Tribune is highlighting public frustration with: *"${gothamArt.headline}"*. ` : ''}
${activeEvent ? `Note that the ongoing **${activeEvent.name}** is exerting exogenous upward pressure on our price indices.` : ''}
If we want to rein in inflation without inducing an outright recession, forward guidance during Months 1 and 2 is our sharpest lever. A well-placed hawkish signal can tighten financial conditions through bond yield adjustments without waiting for the formal quarterly voting session.`;

  } else if (msgLower.includes('parliament') || msgLower.includes('politics') || msgLower.includes('job') || msgLower.includes('approval') || msgLower.includes('fire')) {
    reply = `Governor, our Parliamentary Confidence is at **${state.parliamentary_approval}%** and Public Approval is **${state.public_approval}%**. Your overall Job Security rating stands at **${state.job_security}%**.

${cashingtonArt ? `The Cashington Post is fueling political scrutiny with their lead piece: *"${cashingtonArt.headline}"*. ` : ''}
With **${state.months_to_election} months** remaining until parliamentary elections, lawmakers are hypersensitive to voter complaints over mortgage rates and grocery receipts. If our approval dips below 25%, the Select Committee will initiate formal hearings. 
I strongly advise either submitting a targeted financial policy proposal to Parliament to demonstrate collaboration, or deploying a **Media Blitz** targeted at Main Street to explain our long-term strategy for purchasing power stability.`;

  } else if (msgLower.includes('stock') || msgLower.includes('market') || msgLower.includes('doll street') || msgLower.includes('wall street')) {
    const yieldInversion = state.bond_yield_2y > state.bond_yield_10y;
    reply = `The Doll Street Index stands at **${state.stock_market_index} points**. Commercial bank lending rates have settled at **${state.bank_lending_rate}%**, and corporate debt desks are closely watching the 10-year yield (**${state.bond_yield_10y}%**).

${dollStreetArt ? `The Doll Street Journal is focusing on: *"${dollStreetArt.headline}"*. ` : ''}
${yieldInversion ? `Be aware that the 2-Year Treasury yield (${state.bond_yield_2y}%) is currently inverted against the 10-Year yield (${state.bond_yield_10y}%). Historical data shows equity desks grow skittish when inversions persist beyond two quarters.` : `The yield curve slope remains positive, providing breathing room for bank net interest margins.`}
If you intend to hike at the next MPC meeting, expect equity multiples to compress by 150–300 points unless counterbalanced by reassuring forward guidance.`;

  } else {
    reply = `Governor, as your Chief of Staff and Economic Advisor, I am monitoring both macroeconomic telemetry and press coverage.

**Current Summary:**
- **Policy Stance:** Rate at ${state.interest_rate}% (Taylor Target: ${taylorRate}%)
- **Price Pressures:** CPI at ${state.inflation_cpi}% (Sticky Core: ${state.sticky_cpi || state.core_inflation}%)
- **Real Economy:** GDP Growth at ${state.gdp_growth}%, Unemployment at ${state.unemployment_rate}%
- **Financial Markets:** Doll Street at ${state.stock_market_index}, 10Y Yield at ${state.bond_yield_10y}%
- **Parliamentary Standing:** Confidence at ${state.parliamentary_approval}%, Job Security at ${state.job_security}%

${newsArticles.length > 0 ? `The media narrative this month is led by ${newsArticles[0].publisher.toUpperCase()}: *"${newsArticles[0].headline}"*.` : ''}

You can instruct me to **draft and submit a policy idea to Parliament**, launch a **targeted Media Blitz** to shift public expectations, or test potential rate scenarios for the upcoming quarter. How shall we proceed?`;
  }

  return reply;
}

// DeepSeek Flash integration for Chief of Staff & Senior Economic Advisor
async function generateChatWithDeepSeek(userMessage, state, history, apiKey, taylorRate, newsArticles = []) {
  // Format press articles context for the Chief of Staff
  const pressBriefing = (newsArticles && newsArticles.length > 0)
    ? newsArticles.map(a => `• [${a.publisher.toUpperCase()}] "${a.headline}" (Byline: ${a.byline || 'Staff'}). Stance: ${a.tone}. Hallway Whisper: "${a.whisper_quote || 'None'}". Excerpt: "${a.body.substring(0, 180)}..."`).join('\n')
    : 'No press dispatches published yet for this month.';

  // Format active events cleanly without internal IDs
  const activeEventsClean = (state.active_events && state.active_events.length > 0)
    ? state.active_events.map(e => `${e.name} (${e.summary})`).join('; ')
    : 'None';

  const systemPrompt = `You are the Chief of Staff and Senior Economic Advisor to the Governor / Chair of the Central Bank.
You are an elite macroeconomic strategist, master of monetary theory, bond market micro-structure, and legislative parliamentary politics.
You speak candidly, strategically, and loyally to the Governor, addressing them respectfully as "Governor".

CURRENT MACROECONOMIC STATE:
- Central Bank Policy Rate: ${state.interest_rate}% (Theoretical Taylor Rule Target: ${taylorRate}%)
- Headline CPI Inflation: ${state.inflation_cpi}% (Target 2.0%) [Flexible Goods: ${state.flexible_cpi || state.inflation_cpi}%, Sticky Core Services: ${state.sticky_cpi || state.core_inflation}%]
- Real GDP Growth: ${state.gdp_growth}% annualized
- Unemployment Rate: ${state.unemployment_rate}% (NAIRU: 4.2%)
- Doll Street Equity Index: ${state.stock_market_index} pts | Prime Commercial Lending: ${state.bank_lending_rate}%
- Sovereign Yields: 10Y Treasury: ${state.bond_yield_10y}%, 2Y Treasury: ${state.bond_yield_2y}% (Spread: ${(state.bond_yield_10y - state.bond_yield_2y).toFixed(2)}%)
- Central Bank Balance Sheet: $${state.balance_sheet_size || 7.2}T (QT Runoff Pace: -$${Math.abs(state.qt_monthly_pace || 25)}B/mo)
- Market Credibility: ${state.market_credibility || 75}/100 | Credibility Warning: ${state.credibility_warning || 'None'}
- Parliamentary Approval: ${state.parliamentary_approval}% | Public Sentiment: ${state.public_approval}%
- Governor Job Security: ${state.job_security}% (Formal Warnings: ${state.warning_count || 0}/3)
- Months to General Election: ${state.months_to_election}
- Active Macroeconomic Events: ${activeEventsClean}

THIS MONTH'S PRESS DISPATCHES & MEDIA NARRATIVE:
${pressBriefing}

CORE ADVISORY GUIDELINES:
1. Address the player as "Governor".
2. You have FULL ACCESS to this month's news coverage across Gloomberg, Doll Street Journal, Gotham News Tribune, and Cashington Post. Directly cite or analyze relevant headlines, editorial tones, or trader whispers when advising on market expectations or political risk.
3. Offer concrete tactical advice on interest rate decisions (Month 3), forward guidance signals (Months 1 & 2), parliamentary legislation, or targeted media blitzes.
4. NEVER cite raw internal software IDs (like POS-12 or NEG-05); refer to events by their natural real-world names.
5. Keep your counsel crisp, authoritative, strategic, and under 250 words.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-5).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.content })),
    { role: 'user', content: userMessage }
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.65,
      max_tokens: 500
    }),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Advisor DeepSeek call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Refine a policy idea and simulate parliamentary vote
async function refineAndSubmitPolicy(rawIdea, targetSector, state) {
  const title = `The ${targetSector.charAt(0).toUpperCase() + targetSector.slice(1)} Stabilization & Reform Act`;
  
  const refinedText = `A statutory enactment to amend the National Banking and Credit Code: Specifically authorizing the Central Bank Board, in coordination with the Treasury, to establish targeted operational frameworks for ${rawIdea.toLowerCase()}. The measure introduces strict auditing standards, provides temporary reserve adjustments, and establishes an inter-agency oversight council to safeguard fiscal and monetary alignment.`;

  // Simulate Parliamentary Vote (100 total seats in Parliament)
  const baseSupport = state.parliamentary_approval * 0.70;
  const crisisBonus = state.inflation_cpi > 4.5 || state.unemployment_rate > 5.5 ? 12 : 5;
  const randomSwing = Math.floor(Math.random() * 20) - 10;
  
  const votesFor = Math.max(15, Math.min(85, Math.round(baseSupport + crisisBonus + randomSwing)));
  const votesAgainst = 100 - votesFor;
  const passed = votesFor >= 51;

  const effects = {};
  if (passed) {
    if (targetSector === 'banking') {
      effects.bank_lending_rate = -0.20;
      effects.parliamentary_approval = +4.0;
      effects.stock_market_index = +40;
    } else if (targetSector === 'housing') {
      effects.housing_cost_index = -2.5;
      effects.public_approval = +5.0;
      effects.consumer_confidence = +3.0;
    } else if (targetSector === 'green_transition') {
      effects.gdp_growth = +0.15;
      effects.public_approval = +4.0;
      effects.fiscal_deficit = -0.15;
    } else {
      effects.consumer_confidence = +2.5;
      effects.parliamentary_approval = +3.0;
    }
  } else {
    effects.parliamentary_approval = -2.0;
  }

  return {
    title,
    raw_idea: rawIdea,
    refined_legislation: refinedText,
    target_sector: targetSector,
    status: passed ? 'passed' : 'rejected',
    parliament_vote_for: votesFor,
    parliament_vote_against: votesAgainst,
    effects
  };
}

// Execute Media Blitz
function executeMediaBlitz(targetAudience, strategicMessage, state) {
  let publicResponse = '';
  let impactSummary = '';
  const effects = {};

  if (targetAudience === 'wall_street') {
    publicResponse = 'Institutional desks and trading floors responded quickly. Bond spreads tightened and corporate bond issuance calendars cleared backlogged offerings.';
    impactSummary = 'Doll Street Index rallied +45 points; 2-year sovereign yield stabilized; financial conditions index relaxed.';
    effects.stock_market_index = 45;
    effects.bond_yield_2y = -0.05;
  } else if (targetAudience === 'main_street') {
    publicResponse = 'Regional media and morning broadcasts featured interviews clarifying that price stabilization remains the number one national priority.';
    impactSummary = 'Consumer confidence lifted +3.5 points; household panic over inflation moderated.';
    effects.consumer_confidence = 3.5;
    effects.public_approval = 4.0;
    effects.poverty_discontent = -2.0;
  } else if (targetAudience === 'parliament') {
    publicResponse = 'Key legislative committee leaders issued a rare bipartisan joint statement commending the central bank for transparency.';
    impactSummary = 'Parliamentary Approval gained +6.0 points; immediate threats of hostile oversight hearings neutralized.';
    effects.parliamentary_approval = 6.0;
    effects.job_security = 5.0;
  } else if (targetAudience === 'foreign_fx') {
    publicResponse = 'International central bank forums and overseas currency trading desks praised the sovereign policy resolve.';
    impactSummary = 'Trade-weighted currency index appreciated +0.8 points; sovereign CDS spread narrowed.';
    effects.currency_index = 0.8;
    effects.bond_yield_10y = -0.04;
  }

  return {
    target_audience: targetAudience,
    strategic_message: strategicMessage,
    public_response: publicResponse,
    impact_summary: impactSummary,
    effects
  };
}

module.exports = {
  handleAdvisorChat,
  refineAndSubmitPolicy,
  executeMediaBlitz
};
