const { calculateTaylorRule } = require('./simulationEngine');

// Advisor chat response generator
async function handleAdvisorChat(userMessage, state, chatHistory = [], apiKey = null) {
  const taylorRate = calculateTaylorRule(state);
  const inflationGap = state.inflation_cpi - 2.0;
  const yieldInversion = state.bond_yield_2y > state.bond_yield_10y;
  const activeEvent = state.active_events && state.active_events.length > 0 ? state.active_events[0] : null;

  const rowProvider = require('./db').prepare("SELECT value FROM system_settings WHERE key = 'llm_provider'").get();
  const provider = rowProvider ? rowProvider.value : 'local_macro_engine';

  if (provider === 'deepseek_flash' && apiKey && apiKey.trim().length > 5) {
    try {
      return await generateChatWithDeepSeek(userMessage, state, chatHistory, apiKey, taylorRate);
    } catch (err) {
      console.warn('DeepSeek advisor chat failed, falling back to local advisor:', err.message);
    }
  }

  // High-fidelity local economic advisor reasoning engine
  const msgLower = userMessage.toLowerCase();
  let reply = '';

  if (msgLower.includes('rate') || msgLower.includes('hike') || msgLower.includes('cut') || msgLower.includes('interest')) {
    reply = `Governor, looking at our current macroeconomic indicators, our benchmark policy rate is **${state.interest_rate}%**, while headline inflation sits at **${state.inflation_cpi}%** against our 2.0% objective. 

According to our benchmark Taylor Rule model, our estimated target policy rate should be **${taylorRate}%**. 
${state.interest_rate < taylorRate 
  ? `This indicates our current stance is somewhat accommodative. If we keep rates below the Taylor benchmark while inflation expectations remain unanchored, we risk entrenching wage-price friction.` 
  : `We are currently operating at or above the estimated neutral rate. Further restrictive hikes risk exacerbating commercial credit stress (currently at ${state.bank_lending_rate}% for business loans) and slowing annualized GDP growth below ${state.gdp_growth}%.`}

In Month 3 of this cycle, our options will range from a 25 to 50 bps adjustment or holding steady. On Doll Street, market pricing is currently divided. What is your priority: anchoring price expectations or preserving credit liquidity?`;

  } else if (msgLower.includes('inflation') || msgLower.includes('cpi') || msgLower.includes('prices')) {
    reply = `Governor, headline CPI is at **${state.inflation_cpi}%**, with core inflation running at **${state.core_inflation}%**. Real wage growth is currently registered at **${state.real_wage_growth}%**, meaning household purchasing power is ${state.real_wage_growth < 0 ? 'contracting in real terms' : 'modestly positive'}.

${activeEvent ? `Note that the ongoing **${activeEvent.name}** is exerting exogenous pressure on our price indices.` : ''}
If we want to rein in inflation without inducing an outright recession, forward guidance during Months 1 and 2 is our sharpest lever. A well-placed hawkish signal can tighten financial conditions through bond yield adjustments without waiting for the formal quarterly voting session.`;

  } else if (msgLower.includes('parliament') || msgLower.includes('politics') || msgLower.includes('job') || msgLower.includes('approval') || msgLower.includes('fire')) {
    reply = `Governor, our Parliamentary Confidence is at **${state.parliamentary_approval}%** and Public Approval is **${state.public_approval}%**. Your overall Job Security rating stands at **${state.job_security}%**.

With **${state.months_to_election} months** remaining until parliamentary elections, lawmakers are hypersensitive to voter complaints over mortgage rates and grocery receipts. If our approval dips below 25%, the Select Committee will initiate formal hearings. 
I strongly advise either submitting a targeted financial policy proposal to Parliament to demonstrate collaboration, or deploying a **Media Blitz** targeted at Main Street to explain our long-term strategy for purchasing power stability.`;

  } else if (msgLower.includes('stock') || msgLower.includes('market') || msgLower.includes('doll street') || msgLower.includes('wall street')) {
    reply = `The Doll Street Index stands at **${state.stock_market_index} points**. Commercial bank lending rates have settled at **${state.bank_lending_rate}%**, and corporate debt desks are closely watching the 10-year yield (**${state.bond_yield_10y}%**).

${yieldInversion ? `Be aware that the 2-Year Treasury yield (${state.bond_yield_2y}%) is currently inverted against the 10-Year yield (${state.bond_yield_10y}%). Historical data shows equity desks grow skittish when inversions persist beyond two quarters.` : `The yield curve slope remains positive, providing breathing room for bank net interest margins.`}
If you intend to hike at the next MPC meeting, expect equity multiples to compress by 150–300 points unless counterbalanced by reassuring forward guidance.`;

  } else {
    reply = `Governor, as your Chief of Staff and Economic Advisor, I am monitoring all data feeds across our monetary transmission channels. 

Currently:
- **Policy Stance:** Interest Rate at ${state.interest_rate}%, Taylor Rule Benchmark at ${taylorRate}%
- **Price Stability:** CPI Inflation at ${state.inflation_cpi}%, Core at ${state.core_inflation}%
- **Real Economy:** GDP Growth at ${state.gdp_growth}%, Unemployment at ${state.unemployment_rate}%
- **Financial Desk:** Doll Street Index at ${state.stock_market_index}, 10Y Yield at ${state.bond_yield_10y}%
- **Governance:** Parliamentary Confidence at ${state.parliamentary_approval}%, Job Security at ${state.job_security}%

You can instruct me to **draft and submit a policy idea to Parliament**, launch a **targeted Media Blitz** to shift public expectations, or test potential rate scenarios for the upcoming quarter. How shall we proceed?`;
  }

  return reply;
}

// DeepSeek integration for advisor chat
async function generateChatWithDeepSeek(userMessage, state, history, apiKey, taylorRate) {
  const systemPrompt = `You are the Chief of Staff and Senior Economic Advisor to the Governor of the Central Bank.
You are an elite macroeconomic strategist, expert in monetary theory, global finance, financial markets, and legislative politics.
You address the player respectfully as "Governor".
Current Economic Context:
- Policy Rate: ${state.interest_rate}%
- CPI Inflation: ${state.inflation_cpi}% (Target 2.0%)
- Taylor Rule Benchmark Rate: ${taylorRate}%
- GDP Growth: ${state.gdp_growth}%
- Unemployment: ${state.unemployment_rate}%
- Stock Index: ${state.stock_market_index}
- 10Y Yield: ${state.bond_yield_10y}%, 2Y Yield: ${state.bond_yield_2y}%
- Parliamentary Approval: ${state.parliamentary_approval}%
- Job Security: ${state.job_security}%
- Months to Election: ${state.months_to_election}

Provide concise, highly analytical, strategic counsel. You can advise on interest rate timing, forward guidance tone, legislative proposals for parliament, and media blitz strategies. Keep responses under 200 words.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.content })),
    { role: 'user', content: userMessage }
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.6,
      max_tokens: 450
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
  // Likelihood of passing depends on Parliamentary Approval, election pressure, and baseline appeal
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
    effects.parliamentary_approval = -2.0; // Small setback from rejected bill
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
