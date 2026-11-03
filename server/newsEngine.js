const db = require('./db');

// Publisher editorial personas with distinct narrative voices
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
    editorialGuidance: `You are the Senior Fixed Income Correspondent at GLOOMBERG NEWS.
VOICE: Authoritative, institutional, data-driven, speaking directly to rates desks and sovereign debt managers.
ANTI-FORMULA RULES:
- NEVER open with calendar cliches like "In Month X of Year Y..." or "The macroeconomic landscape entered Month X...".
- Open in media res: with a spread move, a bond curve dislocation, an aggressive trade on the swaps desk, or a blunt quote from a clearinghouse.
- DO NOT list every statistic. Focus primarily on the prioritized drivers (sovereign yields, sticky vs flexible inflation, or policy rate transmission).
- Quote real bond desks, primary dealers, and rate strategists using authentic terminology (e.g. basis points, term premium, inverted curve, liquidity squeeze).`
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
    editorialGuidance: `You are a Lead Financial Columnist at THE DOLL STREET JOURNAL.
VOICE: Capitalist, corporate-savvy, skeptical, attuned to boardroom power and corporate refinancing cliffs.
ANTI-FORMULA RULES:
- NEVER open with dry economic summaries like "During Month X, the market saw...".
- Open with boardroom anxiety: an executive trimming CapEx budgets, a private equity sponsor facing loan covenants, or equity analysts slashing price targets.
- Focus primarily on corporate borrowing costs, equity valuations, or profit margins. Ignore extraneous consumer metrics.
- Quote chief financial officers, venture partners, and Wall Street asset managers with cynical, insider candor.`
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
    editorialGuidance: `You are an Investigative Metro Living Standards Reporter at the GOTHAM NEWS TRIBUNE.
VOICE: Gritty, human-centered, investigative, passionate about working-class grocery bills, housing pain, and union strikes.
ANTI-FORMULA RULES:
- NEVER open with econometric declarations like "Economic telemetry indicates...".
- Open at ground level: a crowded supermarket aisle, an eviction hearing in municipal court, an early-morning union hall, or a diner counter.
- Translate statistics into kitchen-table realities: monthly rent hikes, overtime paychecks swallowed by groceries, or delayed medical care.
- Quote ordinary working people: transit mechanics, nurses, grocery clerks, and tenant association organizers.`
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
VOICE: Insider political journalism, palace intrigue, adversarial, tracking legislative whips, hearings, and election stakes.
ANTI-FORMULA RULES:
- NEVER open with passive fiscal recitations like "The parliamentary environment in Month X was...".
- Open in the corridors of power: a hostile committee hearing confrontation, a leaked Treasury memorandum, a late-night backbench revolt, or campaign polling panic.
- Frame monetary decisions as political battles: threats to Central Bank statutory autonomy, deficit clashes, and public blame-shifting.
- Quote rival lawmakers, committee chairs, anonymous ministerial aides, and party strategists.`
  }
};

// Select the top 1-2 most critical, newsworthy economic drivers for each publisher
function selectPrimaryEconomicDrivers(state, publisherKey) {
  const drivers = [];

  // General high-priority overrides
  if (state.credibility_warning) {
    drivers.push({
      metric: 'Forward Guidance Credibility Shock',
      detail: state.credibility_warning,
      urgency: 'critical'
    });
  }

  if (state.last_mpc_vote && state.last_mpc_vote.dissents > 0) {
    drivers.push({
      metric: 'Monetary Policy Committee Division',
      detail: `MPC split ${state.last_mpc_vote.tally_label} with ${state.last_mpc_vote.dissents} dissenting votes`,
      urgency: 'high'
    });
  }

  // Publisher-specific prioritization
  if (publisherKey === 'gloomberg') {
    const yieldInversion = state.bond_yield_2y > state.bond_yield_10y;
    if (yieldInversion) {
      drivers.push({
        metric: 'Sovereign Yield Curve Inversion',
        detail: `2Y yield (${state.bond_yield_2y}%) trades ${(state.bond_yield_2y - state.bond_yield_10y).toFixed(2)}% above 10Y yield (${state.bond_yield_10y}%)`,
        urgency: 'high'
      });
    } else if (state.inflation_cpi > 3.5) {
      drivers.push({
        metric: 'Sticky Services Inflation Inertia',
        detail: `Sticky core inflation at ${state.sticky_cpi || state.core_inflation}% outpacing flexible goods at ${state.flexible_cpi || state.inflation_cpi}%`,
        urgency: 'high'
      });
    } else if (state.gdp_growth < 1.2) {
      drivers.push({
        metric: 'Macroeconomic Growth Deceleration',
        detail: `Real GDP annualized growth flagging at ${state.gdp_growth}%`,
        urgency: 'high'
      });
    } else {
      drivers.push({
        metric: 'Benchmark Policy Rate & Balance Sheet',
        detail: `Policy rate steady at ${state.interest_rate}%, Quantitative Tightening pace -$${Math.abs(state.qt_monthly_pace || 25)}B/mo`,
        urgency: 'medium'
      });
    }
  } else if (publisherKey === 'doll_street') {
    if (state.bank_lending_rate > 6.8) {
      drivers.push({
        metric: 'Commercial Borrowing Costs & Refinancing Cliff',
        detail: `Prime commercial loan rates at ${state.bank_lending_rate}%, pressuring leveraged corporate issuers`,
        urgency: 'high'
      });
    } else if (state.stock_market_index > 5400) {
      drivers.push({
        metric: 'Doll Street Equity Rally & Multiple Compression',
        detail: `Equities trading at elevated ${state.stock_market_index} pts despite tight credit`,
        urgency: 'medium'
      });
    } else {
      drivers.push({
        metric: 'Corporate Profit Margins & Cost of Capital',
        detail: `Equities at ${state.stock_market_index} pts as CFOs navigate ${state.interest_rate}% base rates`,
        urgency: 'medium'
      });
    }
  } else if (publisherKey === 'gotham') {
    if (state.real_wage_growth < -0.2) {
      drivers.push({
        metric: 'Household Purchasing Power Erosion',
        detail: `Real wage growth slipped to ${state.real_wage_growth}%, squeezing working families`,
        urgency: 'high'
      });
    } else if (state.housing_cost_index > 145) {
      drivers.push({
        metric: 'Metropolitan Housing & Rental Shortage',
        detail: `Housing Cost Index climbed to ${state.housing_cost_index}, pricing out workforce renters`,
        urgency: 'high'
      });
    } else {
      drivers.push({
        metric: 'Grocery Bills & Social Discontent',
        detail: `Social Discontent index at ${state.poverty_discontent}/100 amid persistent food and utility costs`,
        urgency: 'medium'
      });
    }
  } else if (publisherKey === 'cashington') {
    if (state.parliamentary_approval < 45) {
      drivers.push({
        metric: 'Parliamentary Select Committee Hostility',
        detail: `Chair approval in Parliament down to ${state.parliamentary_approval}%, prompting calls for hearings`,
        urgency: 'critical'
      });
    } else if (state.months_to_election <= 24) {
      drivers.push({
        metric: 'Electoral Campaign Vulnerability',
        detail: `Only ${state.months_to_election} months to parliamentary elections as lawmakers face constituent backlash`,
        urgency: 'high'
      });
    } else {
      drivers.push({
        metric: 'Fiscal Deficit & Sovereign Debt Servicing',
        detail: `National deficit at ${state.fiscal_deficit}% of GDP and debt-to-GDP at ${state.debt_to_gdp}%`,
        urgency: 'medium'
      });
    }
  }

  return drivers;
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
async function generateMonthlyNews(economicState, difficulty, year, month) {
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
    return publishers.map(pub => generateWithLocalMacroEngine(pub, economicState, year, month));
  }

  // Fire all publisher articles concurrently in parallel
  const articlePromises = publishers.map(async (pub) => {
    try {
      return await generateWithDeepSeek(pub, economicState, year, month, apiKey);
    } catch (err) {
      console.warn(`DeepSeek generation failed for ${pub}, falling back to local macro engine:`, err.message);
      return generateWithLocalMacroEngine(pub, economicState, year, month);
    }
  });

  const results = await Promise.allSettled(articlePromises);
  return results.map((res, idx) => {
    if (res.status === 'fulfilled' && res.value) {
      return res.value;
    }
    return generateWithLocalMacroEngine(publishers[idx], economicState, year, month);
  });
}

// DeepSeek API integration with varied styles, rapid completion and dynamic indicator selection
async function generateWithDeepSeek(publisherKey, state, year, month, apiKey) {
  const profile = PUBLISHER_PROFILES[publisherKey];
  // For news journalism, use deepseek-chat (DeepSeek-V3 / Flash) to generate varied, authentic articles in 2 seconds
  // without reasoning overhead, while leaving deepseek-v4-pro for deep advisor conversations.
  const customNewsModel = getSystemSetting('news_model');
  const model = customNewsModel || 'deepseek-chat';

  const drivers = selectPrimaryEconomicDrivers(state, publisherKey);
  const primaryDriver = drivers[0];

  const systemPrompt = `${profile.editorialGuidance}
You write rigorous, varied, non-formulaic financial journalism between 250 and 450 words.
CRITICAL EDITORIAL STANDARDS:
1. NEVER reproduce formulaic boilerplate or robotic opening sentences.
2. Focus strictly on the primary economic drivers selected for this edition rather than listing all variables.
3. NEVER cite internal event codes (e.g. do not write "POS-12" or "NEG-05"); refer to events only by their natural real-world names.
4. Provide sharp narrative immersion, authentic stakeholder voices, and vivid quotes.
5. Format your output strictly as a JSON object with keys:
  - "headline": string (punchy, authentic headline)
  - "body": string (multi-paragraph news story)
  - "tone": ("hawkish"|"dovish"|"alarmist"|"bullish"|"critical"|"neutral")
  - "urgency": ("low"|"medium"|"high"|"critical")
  - "featured_variable": string
  - "byline": string
  - "dateline": string
  - "whisper_quote": string (a short, pungent market gossip / hallway quote)`;

  // Clean active events representation without any internal IDs
  const activeEventsClean = (state.active_events && state.active_events.length > 0)
    ? state.active_events.map(e => `${e.name} (${e.summary})`).join('; ')
    : 'None';

  const userPrompt = `EDITION: Year ${year}, Month ${month}.
PUBLISHER: ${profile.name}
TOP ECONOMIC DRIVERS TO FOCUS ON:
${drivers.map(d => `- [${d.urgency.toUpperCase()}] ${d.metric}: ${d.detail}`).join('\n')}

BACKGROUND CONTEXT:
- Policy Rate: ${state.interest_rate}% | Bank Lending: ${state.bank_lending_rate}%
- Inflation: Headline ${state.inflation_cpi}% (Flexible: ${state.flexible_cpi || state.inflation_cpi}%, Sticky: ${state.sticky_cpi || state.core_inflation}%)
- Real GDP: ${state.gdp_growth}% | Unemployment: ${state.unemployment_rate}%
- Doll Street: ${state.stock_market_index} pts | 10Y Yield: ${state.bond_yield_10y}% | 2Y Yield: ${state.bond_yield_2y}%
- Active Macro Events: ${activeEventsClean}

Write an engaging, authentic, non-formulaic story for ${profile.name} focusing on the primary economic driver.`;

  const controller = new AbortController();
  // 8 second timeout per parallel request ensures fast fallback without hanging turns
  const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      max_tokens: 1200
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

  return {
    publisher: publisherKey,
    headline: parsed.headline || 'Economic Horizon Shifts',
    body: parsed.body || 'Financial markets digest incoming economic data.',
    tone: parsed.tone || 'neutral',
    urgency: parsed.urgency || primaryDriver.urgency || 'medium',
    featured_variable: parsed.featured_variable || primaryDriver.metric,
    byline: parsed.byline || profile.bylines[Math.floor(Math.random() * profile.bylines.length)],
    dateline: parsed.dateline || profile.dateline,
    whisper_quote: parsed.whisper_quote || 'Market desks await further guidance from the central bank.'
  };
}

// Built-in Macroeconomic Engine (High-fidelity editorial generator with varied openings)
function generateWithLocalMacroEngine(publisherKey, state, year, month) {
  const profile = PUBLISHER_PROFILES[publisherKey];
  const activeEvent = state.active_events && state.active_events.length > 0 ? state.active_events[0] : null;
  const mpcVote = state.last_mpc_vote;
  const byline = profile.bylines[Math.floor(Math.random() * profile.bylines.length)];
  const dateline = profile.dateline;

  let headline = '';
  let body = '';
  let tone = 'neutral';
  let urgency = 'medium';
  let featuredVar = 'inflation_cpi';
  let whisperQuote = '';

  const drivers = selectPrimaryEconomicDrivers(state, publisherKey);
  const primaryDriver = drivers[0];

  if (publisherKey === 'gloomberg') {
    featuredVar = 'bond_yield_10y';
    const yieldInversion = state.bond_yield_2y > state.bond_yield_10y;

    if (state.credibility_warning) {
      headline = `Front-End Bond Desks Reel as Guidance Shock Dislocates 2-Year Paper`;
      tone = 'alarmist';
      urgency = 'critical';
      whisperQuote = `"The tape went dark for ninety seconds. When the Chair signals dovish patience and then drops a surprise hike, liquidity vaporizes."`;
      body = `Trading desks at major sovereign clearinghouses halted proprietary arbitrage trades this morning after an abrupt reversal in central bank policy shattered interest rate expectations. Two-year sovereign benchmark notes experienced a violent 28-basis-point yield surge, marking the sharpest single-session yield dislocation in three quarters.

"You cannot preach data dependency and then blindside market makers," said Marcus Vance, global head of rates trading at Barclays Capital. "Dealers were positioning for an extended pause based on official forward guidance. The sudden move wiped out basis trades across commercial portfolios."

Concurrently, the benchmark 10-year yield touched ${state.bond_yield_10y}%, steepening the yield curve even as credit spreads widened on investment-grade debt. Liquidity providers report that bid-ask spreads on short-dated bills remain five times wider than historical norms as capital managers await an emergency clarification from the Monetary Policy Committee.`;

    } else if (mpcVote && mpcVote.dissents > 0) {
      headline = `Committee Fractures: Dissidents Clash Over Growth Drag as Rate Voted ${mpcVote.tally_label}`;
      tone = 'hawkish';
      urgency = 'high';
      whisperQuote = `"The unified front at the central bank is dead. Hawks are terrified of wage permanence, while doves are pointing to collapsing order books."`;
      body = `A bitter ideological rift split the Monetary Policy Committee into opposing camps, concluding in a ${mpcVote.tally_label} decision that leaves market pricing unanchored. Minutes from the review reveal unprecedented friction between conservative governors advocating aggressive tightening and regional members warning that cumulative transmission lags are pushing industrial sectors into retrenchment.

${mpcVote.hawkish_dissents > 0 ? `Hawkish members formally dissented, citing persistent core services inflation of ${state.sticky_cpi || state.core_inflation}% as proof that statutory price targets remain in jeopardy.` : ''} ${mpcVote.dovish_dissents > 0 ? `Conversely, dissenting doves argued that annualized GDP growth of ${state.gdp_growth}% signals that monetary restraint has already reached restrictive limits.` : ''}

With the policy rate set at ${state.interest_rate}%, swap markets have priced in a 65% probability of further committee volatility at the next quarterly review. Sovereign clearing desks note that foreign asset managers have reduced duration exposure until the Committee reconciles its forward posture.`;

    } else if (yieldInversion) {
      headline = `Curve Inversion Deepens to ${(state.bond_yield_2y - state.bond_yield_10y).toFixed(2)}% as Fixed Income Desks Price Policy Friction`;
      tone = 'hawkish';
      urgency = 'high';
      whisperQuote = `"An inverted yield curve is the fixed-income market's polite way of saying the central bank is heading for a structural misstep."`;
      body = `The benchmark yield spread between two-year and ten-year sovereign debt plunged deeper into negative territory, registering an inversion of ${(state.bond_yield_2y - state.bond_yield_10y).toFixed(2)} percentage points as institutional debt buyers braced for extended monetary constriction.

The two-year note closed trading at ${state.bond_yield_2y}%, pushed higher by expectations of elevated borrowing costs, while the 10-year benchmark settled at ${state.bond_yield_10y}%. Historically, sustained inversions of this magnitude have preceded cyclical downturns by three to five quarters as bank lending margins compress and interbank liquidity tightens.

"When short-dated paper yields more than ten-year bonds, commercial lenders lose the fundamental incentive to extend long-term investment capital," observed Elena Rostova, senior sovereign debt strategist at Gloomberg. "We are already seeing commercial paper facilities pulling back lines of credit to mid-tier industrial borrowers."`;

    } else {
      headline = `Benchmark Policy Rate Anchored at ${state.interest_rate}% as Global Capital Flows Steady`;
      tone = 'neutral';
      urgency = 'low';
      whisperQuote = `"Quiet session on the primary dealer desk. Markets have priced terminal rates near equilibrium for the immediate cycle."`;
      body = `Fixed-income markets settled into an orderly cadence as the benchmark policy rate remained established at ${state.interest_rate}%, with sovereign debt issuance clearing at predictable bid-to-cover ratios. Headline consumer price inflation stood at ${state.inflation_cpi}%, showing measurable signs of stabilization across flexible commodity and freight components.

Trading volume across commercial paper was steady, with corporate prime lending rates averaging ${state.bank_lending_rate}%. While Quantitative Tightening operations continue to reduce the central bank's balance sheet at -$${Math.abs(state.qt_monthly_pace || 25)}B monthly, dealer absorption has proceeded without signs of repo stress.

Market strategists note that the stabilization of ten-year yields at ${state.bond_yield_10y}% provides room for corporate treasurers to execute planned debt refinancing ahead of the next macroeconomic quarter.`;
    }

  } else if (publisherKey === 'doll_street') {
    featuredVar = 'stock_market_index';

    if (state.bank_lending_rate > 6.8) {
      headline = `CFOs Sound Alarm as 7% Commercial Borrowing Freezes Corporate M&A`;
      tone = 'dovish';
      urgency = 'high';
      whisperQuote = `"Private equity debt math completely disintegrates above 7%. Deals that penciled out twelve months ago are being aborted in due diligence."`;
      body = `Corporate boardrooms across Doll Street are shelving capital expansion plans as commercial loan rates breached ${state.bank_lending_rate}%, forcing chief financial officers to reallocate operating cash flow toward debt servicing rather than research or hiring.

A survey of thirty mid-cap manufacturing and technology executives revealed that debt-service obligations now devour an average of 19.2% of EBITDA. Several syndicated leveraged buyout transactions were scrapped this week after debt underwriting syndicates demanded equity checks exceeding 55%.

"The era of gratuitous financial engineering is officially closed," stated Julian Cole, managing partner at Sterling Capital Partners. "When commercial paper commands nearly seven percent, industrial corporations cannot borrow to repurchase equity without risking credit downgrades. The hurdle rate for new factory groundbreakings has doubled."`;

    } else if (state.stock_market_index > 5400) {
      headline = `Doll Street Index Rallies to ${state.stock_market_index} as Mega-Cap Earnings Defy Tight Money`;
      tone = 'bullish';
      urgency = 'medium';
      whisperQuote = `"Mega-cap technology balance sheets are minting interest income while smaller peers suffer under loan costs."`;
      body = `Equities surged to new cyclical territory as the Doll Street Index closed at ${state.stock_market_index}, propelled by robust earnings releases from cash-rich industrial champions and enterprise software leaders.

Despite central bank policy rates of ${state.interest_rate}%, corporate cash reserves generated substantial yields on short-dated sovereign paper, insulating balance sheets against commercial credit stress. Valuation multiples expanded across high-margin defensives, shrugging off warnings of delayed transmission drags.

"Investors are bifurcating the market," noted Arthur Pendelton, Doll Street equities columnist. "Companies with pristine balance sheets and dominant pricing power are compounding earnings, while debt-heavy small-caps lag behind. As long as top-line revenue holds, institutional capital is sticking with equity equities."`;

    } else {
      headline = `Equities Range-Bound at ${state.stock_market_index} as Boardrooms Weigh Capital Costs`;
      tone = 'neutral';
      urgency = 'medium';
      whisperQuote = `"Why take equity risk when risk-free sovereign bills guarantee nearly five percent? Investors are demanding higher earnings yields."`;
      body = `Trading on the financial district concluded with muted volatility as the Doll Street Index hovered at ${state.stock_market_index}. Portfolio managers reported light institutional turnover as corporate earnings season concluded with modest beats but cautious forward guidance.

With the benchmark policy rate at ${state.interest_rate}%, corporate finance committees are debating whether to deploy free cash toward debt retirement or modest dividend increases. Mergers and acquisitions activity remains constrained, though private credit funds report steady demand for customized asset-backed lending.

"We are in a holding pattern," said Victoria Vance, capital markets editor. "Institutional investors are waiting to see whether upcoming consumer spending figures indicate a soft landing or a deeper squeeze on discretionary corporate margins."`;
    }

  } else if (publisherKey === 'gotham') {
    featuredVar = 'housing_cost_index';

    if (state.housing_cost_index > 145) {
      headline = `Rent Hikes and Mortgage Lockout Strand Young Families in Outer Boroughs`;
      tone = 'critical';
      urgency = 'high';
      whisperQuote = `"My landlord raised rent by $250 while my grocery bill climbed by another hundred. The central bank says inflation is under control, but our household budget is sinking."`;
      body = `At neighborhood community meetings across Gotham's working-class boroughs, frustration over living standards boiled over as the metropolitan housing cost index surged to ${state.housing_cost_index}.

With mortgage rates locked near commercial lending levels of ${state.bank_lending_rate}%, first-time home purchases have vanished for working families, funneling thousands into an already overheated rental market. Eviction filings in municipal housing court have increased by 22% year-over-year, while local food banks report unprecedented lines of fully employed citizens seeking emergency grocery staples.

"Every month feels like a high-wire act with no safety net," said Clara Morales, a certified nursing assistant in South Gotham. "My paycheck hasn't moved, but my rent, milk, and electricity bills have skyrocketed. We are cutting back on everything just to keep a roof overhead."

Community organizers and tenant unions are demanding immediate legislative intervention, warning that without shelter rent stabilization, civic discontent will continue to spill into municipal labor negotiations.`;

    } else {
      headline = `Paychecks Strained as Inflation Hits Grocery Receipts in Neighborhood Markets`;
      tone = 'critical';
      urgency = 'medium';
      whisperQuote = `"You walk out of the supermarket with two brown bags and you've spent seventy dollars. That's three hours of overtime gone."`;
      body = `Across grocery aisles in Gotham's working neighborhoods, consumer price statistics translate into agonizing choices between essential dairy products, heating bills, and winter clothing. While headline figures cite an unemployment rate of ${state.unemployment_rate}%, real wage growth remains depressed at ${state.real_wage_growth}%.

Small business owners report that foot traffic is declining as working households eliminate discretionary outings. Neighborhood bodegas and hardware shops cite declining wholesale inventory turnover, while utility shut-off warnings have reached multi-year peaks.

"Families are exhausted," remarked Terrell Jenkins, urban housing and economy reporter. "The economic communiques released downtown sound clinical, but on Main Street, working people are managing household deficits that cannot be resolved without real purchasing power growth."`;
    }

  } else if (publisherKey === 'cashington') {
    featuredVar = 'parliamentary_approval';

    if (state.parliamentary_approval < 50) {
      headline = `Committee Summons Central Bank Leadership as Approval Plunges to ${state.parliamentary_approval}%`;
      tone = 'critical';
      urgency = 'critical';
      whisperQuote = `"The backbenchers are facing furious town halls over mortgage rates. If the central bank refuses to listen, Parliament will introduce legislation to curb its charter."`;
      body = `A storm erupted in the corridors of Parliament Hill as legislative approval for the central bank chair slid to ${state.parliamentary_approval}%, prompting senior members of the Treasury Select Committee to demand an emergency oversight hearing.

With ${state.months_to_election} months remaining before general elections, coalition MPs in suburban swing ridings delivered fierce speeches on the parliamentary floor, accusing appointed central bankers of indifference toward family mortgage distress and municipal financing shortfalls.

"Statutory independence is a privilege granted by Parliament, not a divine right to ignore public suffering," declared Member of Parliament Donald Sterling during question time. "When working families lose their homes to punitive borrowing rates, the officials responsible must answer directly to the elected representatives of the people."

Several opposition backbenchers confirmed they are drafting private member bills that would impose formal parliamentary oversight mechanisms on future interest rate adjustments, escalating a constitutional showdown over monetary sovereignty.`;

    } else {
      headline = `Parliament Clashes Over Sovereign Debt Burden as Election Season Draws Near`;
      tone = 'hawkish';
      urgency = 'medium';
      whisperQuote = `"The fiscal deficit is crowding out every domestic legislative priority. Ministers cannot build hospitals when sovereign interest payments consume the budget."`;
      body = `Tensions between Treasury ministers and legislative budget committees intensified as lawmakers debated the national fiscal deficit of ${state.fiscal_deficit}% of GDP and total debt-to-GDP of ${state.debt_to_gdp}%.

With benchmark borrowing costs holding at ${state.interest_rate}%, national debt service obligations have become the fastest-growing line item in the sovereign budget, forcing cabinet leaders to freeze funding allocations for transit modernization and regional hospital networks.

"The arithmetic is unyielding," noted Eleanor Sterling, parliamentary bureau chief. "Every quarter that interest rates remain restrictive adds billions to the sovereign carrying cost. With campaign season approaching in ${state.months_to_election} months, lawmakers are increasingly unwilling to absorb the political cost of fiscal austerity while central bank officials operate with unyielding discretion."`;
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
  selectPrimaryEconomicDrivers
};
