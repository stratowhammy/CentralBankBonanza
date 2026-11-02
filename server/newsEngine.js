const db = require('./db');

// Publisher editorial personas
const PUBLISHER_PROFILES = {
  gloomberg: {
    name: 'Gloomberg News',
    tagline: 'The Global Macro & Fixed Income Authority',
    flavor: 'Data-driven, macroeconomic aggregates, bond yield curves, industrial metrics, and foreign exchange cross-currents.',
    perspective: 'Analytical, sober, highly attuned to statistics and macroeconomic equilibrium.'
  },
  doll_street: {
    name: 'The Doll Street Journal',
    tagline: 'The Voice of Free Enterprise & Capital Markets',
    flavor: 'Capitalist, corporate earnings, Wall Street equity multiples, merger activity, CEO compensation, and corporate tax burdens.',
    perspective: 'Pro-business, sensitive to borrowing costs, market liquidity, and investor sentiment.'
  },
  gotham: {
    name: 'Gotham News Tribune',
    tagline: 'The People\'s Chronicle & Metro Sentinel',
    flavor: 'Social realities, working-class grocery bills, metro housing and rental shortages, healthcare costs, labor union strikes, and household debt distress.',
    perspective: 'Human-interest, welfare-focused, critical of corporate greed and tightening pressures on family budgets.'
  },
  cashington: {
    name: 'The Cashington Post',
    tagline: 'Inside the Halls of Power & Parliament',
    flavor: 'Hard legislative politics, parliamentary oversight committees, coalition maneuvers, electoral polls, fiscal budget gridlock, and statutory threats to central bank independence.',
    perspective: 'Political, investigative, focused on power dynamics, votes of confidence, and cabinet intrigue.'
  }
};

// Helper to get system settings
function getSystemSetting(key) {
  try {
    const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
    return row ? row.value : null;
  } catch (err) {
    return null;
  }
}

// Generate articles for the active month based on difficulty
async function generateMonthlyNews(economicState, difficulty, year, month) {
  const publishers = ['gloomberg', 'doll_street'];
  if (difficulty === 'normal' || difficulty === 'hard') {
    publishers.push('gotham');
  }
  if (difficulty === 'hard') {
    publishers.push('cashington');
  }

  const provider = getSystemSetting('llm_provider') || 'local_macro_engine';
  const apiKey = getSystemSetting('deepseek_api_key') || process.env.DEEPSEEK_API_KEY;
  const articles = [];

  for (const pub of publishers) {
    let article = null;
    if (provider === 'deepseek_flash' && apiKey && apiKey.trim().length > 5) {
      try {
        article = await generateWithDeepSeek(pub, economicState, year, month, apiKey);
      } catch (err) {
        console.warn(`DeepSeek generation failed for ${pub}, falling back to local macro engine:`, err.message);
        article = generateWithLocalMacroEngine(pub, economicState, year, month);
      }
    } else {
      article = generateWithLocalMacroEngine(pub, economicState, year, month);
    }
    articles.push(article);
  }

  return articles;
}

// DeepSeek API integration
async function generateWithDeepSeek(publisherKey, state, year, month, apiKey) {
  const profile = PUBLISHER_PROFILES[publisherKey];
  const model = getSystemSetting('deepseek_model') || 'deepseek-chat';

  const systemPrompt = `You are a senior financial journalist writing for "${profile.name}" (${profile.tagline}).
Your editorial stance is: ${profile.flavor}
You write rigorous, highly analytical news stories between 250 and 500 words.
CRITICAL GUIDELINES:
1. Use direct, authoritative journalistic prose.
2. Provide deep analysis of economic forces, quoting industry figures, traders, workers, or politicians as appropriate.
3. NEVER offer direct policy guidance or tell the Central Bank what to do. The reader is the Central Banker and must deduce the severity and implications themselves.
4. Base your story strictly on the supplied economic indicators and active events.
5. Format your output strictly as JSON with keys: "headline", "body", "tone" (hawkish/dovish/alarmist/bullish/critical/neutral), "urgency" (low/medium/high/critical), "featured_variable".`;

  const userPrompt = `Date: Year ${year}, Month ${month}.
Current Economic State:
- Central Bank Policy Rate: ${state.interest_rate}%
- Headline CPI Inflation: ${state.inflation_cpi}% (Target is 2.0%)
- Core Inflation: ${state.core_inflation}%
- Real GDP Growth: ${state.gdp_growth}% annualized
- Unemployment Rate: ${state.unemployment_rate}%
- Stock Market Index (Doll Street Index): ${state.stock_market_index} pts
- 10-Year Treasury Yield: ${state.bond_yield_10y}%
- 2-Year Treasury Yield: ${state.bond_yield_2y}%
- Commercial Bank Lending Rate: ${state.bank_lending_rate}%
- Real Wage Growth: ${state.real_wage_growth}%
- Housing Cost Index: ${state.housing_cost_index}
- Consumer Confidence: ${state.consumer_confidence}/100
- Social Discontent / Strike Risk: ${state.poverty_discontent}/100
- Parliamentary Approval: ${state.parliamentary_approval}%
- Fiscal Deficit: ${state.fiscal_deficit}% of GDP
- Active Events: ${state.active_events && state.active_events.length > 0 ? state.active_events.map(e => e.name).join(', ') : 'None'}

Write an analytical 250-500 word news story for ${profile.name}.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
      temperature: 0.7,
      max_tokens: 850
    }),
    signal: controller.signal
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`DeepSeek API responded with HTTP ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    publisher: publisherKey,
    headline: parsed.headline,
    body: parsed.body,
    tone: parsed.tone || 'neutral',
    urgency: parsed.urgency || 'medium',
    featured_variable: parsed.featured_variable || 'inflation_cpi'
  };
}

// Built-in Macroeconomic Engine (High-fidelity editorial generator)
function generateWithLocalMacroEngine(publisherKey, state, year, month) {
  const profile = PUBLISHER_PROFILES[publisherKey];
  const activeEvent = state.active_events && state.active_events.length > 0 ? state.active_events[0] : null;

  let headline = '';
  let body = '';
  let tone = 'neutral';
  let urgency = 'medium';
  let featuredVar = 'inflation_cpi';

  if (publisherKey === 'gloomberg') {
    featuredVar = state.inflation_cpi > 4.0 ? 'inflation_cpi' : (state.gdp_growth < 1.0 ? 'gdp_growth' : 'bond_yield_10y');
    const yieldInversion = state.bond_yield_2y > state.bond_yield_10y;

    if (activeEvent) {
      headline = `Macro Headwinds Intensify as ${activeEvent.name} Ripples Through Sovereign Debt and Capital Flows`;
      tone = activeEvent.polarity === 'Negative' ? 'alarmist' : 'bullish';
      urgency = activeEvent.impact > 70 ? 'high' : 'medium';
    } else if (state.inflation_cpi > 4.5) {
      headline = `Price Pressures Prove Stubborn at ${state.inflation_cpi}% as Term Premiums Widen Across Sovereign Curves`;
      tone = 'hawkish';
      urgency = 'high';
    } else if (state.gdp_growth < 1.2) {
      headline = `Aggregate Growth Decelerates to ${state.gdp_growth}% Annualized Rate as Freight Volumes and CapEx Flag`;
      tone = 'dovish';
      urgency = 'high';
    } else if (yieldInversion) {
      headline = `Curve Inversion Deepens to ${Number((state.bond_yield_2y - state.bond_yield_10y).toFixed(2))} Points as Debt Desks Brace for Policy Friction`;
      tone = 'hawkish';
      urgency = 'medium';
    } else {
      headline = `Macro Telemetry Holds Steady with Policy Rate at ${state.interest_rate}% Amid Shifting Cross-Border Capital Flows`;
      tone = 'neutral';
      urgency = 'low';
    }

    body = `The macro landscape entered Month ${month} of Year ${year} under tightening structural dynamics, as headline consumer price inflation registered at ${state.inflation_cpi}%, remaining visibly detached from the statutory 2.0% objective. Simultaneously, core measures recorded an annual print of ${state.core_inflation}%, demonstrating that underlying price formation remains resistant to early monetary tightening impulses.

In fixed-income markets, trading desks navigated notable dislocations across benchmark maturities. The benchmark 10-year sovereign bond yield hovered at ${state.bond_yield_10y}%, while the policy-sensitive 2-year instrument traded at ${state.bond_yield_2y}%. ${yieldInversion ? `The ongoing spread inversion reflects deepening bond-market skepticism regarding mid-term terminal growth prospects and signals historical precedent for cyclical retrenchment.` : `The modest positive term spread suggests bondholders are pricing in a prolonged equilibrium rate above pre-pandemic norms.`} Commercial bank borrowing costs have adjusted concurrently, with prime corporate lending rates climbing to ${state.bank_lending_rate}%.

On the real side of the economy, real annualized GDP expansion slowed to an estimated ${state.gdp_growth}%, down from previous cyclical peaks, while the national unemployment rate edged to ${state.unemployment_rate}%. Econometric models maintained by sovereign clearinghouses suggest that the output gap is closing rapidly, even as global commodity freight rates and terms-of-trade adjustments introduce supply-side friction. 

${activeEvent ? `Compounding these aggregate pressures, the ongoing emergence of ${activeEvent.name} has forced multinational supply chains to scramble for contingency financing. Institutional analysts caution that foreign exchange volatility will remain elevated as sovereign reserves absorb secondary settlement shocks.` : `Market participants now scrutinize upcoming central bank communications for signs of whether the monetary authorities view current conditions as a sustainable soft landing or an uneasy structural truce.`}`;

  } else if (publisherKey === 'doll_street') {
    featuredVar = 'stock_market_index';
    const marketChange = state.stock_market_index > 5000 ? 'resilient' : 'embattled';

    if (state.interest_rate > 5.0) {
      headline = `Boardrooms Sound Alarm as ${state.interest_rate}% Policy Rate Compresses Valuations on Doll Street`;
      tone = 'dovish';
      urgency = 'high';
    } else if (state.stock_market_index > 5400) {
      headline = `Doll Street Index Rallies to ${state.stock_market_index} as Corporate Earnings Defy Borrowing Cost Pressures`;
      tone = 'bullish';
      urgency = 'medium';
    } else if (state.bank_lending_rate > 7.0) {
      headline = `Private Equity and Mid-Cap Issuers Face Refinancing Cliff as Commercial Rates Breach ${state.bank_lending_rate}%`;
      tone = 'alarmist';
      urgency = 'critical';
    } else {
      headline = `Equities Range-Bound at ${state.stock_market_index} as Institutional Investors Debate Cost of Capital Trajectory`;
      tone = 'neutral';
      urgency = 'medium';
    }

    body = `Corporate treasurers and equity strategists across the financial district are confronting a pivotal shift in the cost of capital as Month ${month} trading concluded with the Doll Street Index closing at ${state.stock_market_index}. With the benchmark central bank interest rate pinned at ${state.interest_rate}%, executives from industrial conglomerates to software leaders are reassessing their capital expenditure budgets and share buyback commitments.

Earnings season disclosures indicate that corporate profit margins are absorbing the dual friction of elevated wage outlays and commercial bank loan rates of ${state.bank_lending_rate}%. A growing coalition of chief financial officers at major manufacturing firms reported that debt-servicing outlays now consume an average of 18.4% of operating cash flow, forcing the postponement of secondary factory groundbreakings and technology fleet modernizations.

"The era of frictionless liquidity is behind us," remarked Julian Vance, head of capital markets at Sterling Asset Management. "When commercial paper commands close to 7%, private equity sponsors cannot execute traditional leveraged buyouts without substantial equity checks. The equity risk premium has compressed to levels where holding cash or short-dated bills is providing severe competition to common stock."

Despite these borrowing headwinds, consumer-facing retail chains and defense contractors demonstrated surprising pricing discipline, preserving EBITDA margins through automated logistics and selective wholesale price markups. However, venture capital syndicates and mid-tier commercial real estate funds report heightened distress, with several regional debt facilities requiring capital calls to avoid covenant violations. Market makers warn that any unexpected hawkish surprise at upcoming monetary policy reviews could trigger swift valuation corrections across high-multiple growth equities.`;

  } else if (publisherKey === 'gotham') {
    featuredVar = 'housing_cost_index';
    headline = state.inflation_cpi > 4.0 
      ? `Grocery Bills and Rent Hikes Squeeze Working Families as Gotham Inflation Hits ${state.inflation_cpi}%`
      : `Housing Costs at Index ${state.housing_cost_index} Leave Young Renters Stranded Despite Low Unemployment`;
    tone = 'critical';
    urgency = state.poverty_discontent > 50 ? 'high' : 'medium';

    body = `Across kitchen tables in Gotham's outer boroughs, the reality of macroeconomic statistics is measured in grocery receipts, utility cut-off notices, and lease renewal notices. While official communiques cite an unemployment rate of ${state.unemployment_rate}%, working-class households report that steady paychecks are failing to keep pace with living expenses, as real wage growth slipped to ${state.real_wage_growth}%.

The shelter crisis remains the primary point of public frustration. The metropolitan housing cost index climbed to ${state.housing_cost_index}, driven by an acute shortage of workforce rental housing and mortgage rates that have priced prospective first-time buyers entirely out of the market. In neighborhood community centers, tenants describe rent hikes averaging 9 to 14 percent over the past twelve months, forcing families into overcrowded conditions or long commutes from peripheral towns.

"Every trip to the grocery store feels like a calculated compromise," said Marcus Morales, an electrical technician and father of three in South Gotham. "Milk, poultry, and electricity bills have climbed faster than any overtime hours I can log. The bank tells us inflation is coming down, but my family's expenses haven't seen that memo."

Labor leaders are warning that patience is wearing thin. The municipal social discontent index currently registers at ${state.poverty_discontent} out of 100, with public transit workers, healthcare aides, and sanitation staff threatening strike votes unless cost-of-living adjustments are written into upcoming collective agreements. Food pantries across the metropolitan area reported an 18% increase in first-time visits this quarter, serving employed citizens who can no longer absorb the combined squeeze of housing and grocery inflation. Community organizers emphasize that until working wages restore lost purchasing power, civic frustration will continue to simmer.`;

  } else if (publisherKey === 'cashington') {
    featuredVar = 'parliamentary_approval';
    headline = state.parliamentary_approval < 50
      ? `Parliamentary Committee Summons Central Bank Leadership as Approval Drops to ${state.parliamentary_approval}%`
      : `Partisan Clash Erupts in Parliament Over Fiscal Deficit and Monetary Tightening Mandates`;
    tone = state.parliamentary_approval < 40 ? 'critical' : 'hawkish';
    urgency = state.months_to_election < 18 ? 'high' : 'medium';

    body = `Tensions between the legislative branch and the central bank escalated sharply this week as lawmakers on the Parliamentary Treasury Select Committee sparred over the macroeconomic trajectory ahead of the national election in ${state.months_to_election} months. The central bank chair's parliamentary approval rating stood at ${state.parliamentary_approval}%, reflecting mounting political friction over sustained interest rate burdens.

With the national fiscal deficit standing at ${state.fiscal_deficit}% of GDP and total sovereign debt-to-GDP at ${state.debt_to_gdp}%, coalition ministers find their budget priorities heavily constrained by rising sovereign interest obligations. Ministry of Finance projections indicate that national debt-servicing outlays will exceed public education expenditures within the current fiscal year if benchmark interest rates remain at ${state.interest_rate}%.

Backbench lawmakers from contested suburban constituencies delivered sharp speeches on the parliamentary floor, criticizing the central bank's perceived indifference to mortgage burdens and public sector capital constraints. Several opposition leaders have drafted legislation proposing formal parliamentary oversight of future rate adjustments, directly challenging the central bank's statutory autonomy index, which currently stands at ${state.central_bank_autonomy}%.

"The central bank cannot operate in an academic ivory tower while homeowners and small businesses bear the brunt of every rate policy move," declared Member of Parliament Donald Sterling during heated question time. "When families lose their homes to mortgage spikes, accountability must extend to the appointed leadership who set those parameters."

In response, defenders of central bank independence warned that any political interference in interest rate setting would trigger swift capital flight and sovereign rating downgrades. Nonetheless, with campaign season approaching, analysts note that the political tolerance for restrictive monetary policy is eroding rapidly among parliamentary leaders facing restless electorates.`;
  }

  return {
    publisher: publisherKey,
    headline,
    body,
    tone,
    urgency,
    featured_variable: featuredVar
  };
}

module.exports = {
  generateMonthlyNews,
  PUBLISHER_PROFILES
};
