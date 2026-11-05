const db = require('./db');
const { calculateWhipVoteCount } = require('./politicalEngine');
const { generateRandomPrepromptEntropy } = require('./promptEntropy');
const { detectCaucusOutreachDirective, generateCaucusLeaderAIResponse } = require('./caucusLeaderEngine');

// Detect legislative bill drafting directive
function detectBillDraftDirective(text) {
  const t = text.toLowerCase();
  const hasVerb = (
    t.includes('draft') || t.includes('write') || t.includes('author') ||
    t.includes('propose') || t.includes('introduce') || t.includes('create a bill') ||
    t.includes('craft') || t.includes('prepare legislation') || t.includes('statute') ||
    t.includes('formulate') || t.includes('file a bill')
  );

  const hasNoun = (
    t.includes('bill') || t.includes('legislation') || t.includes('act') ||
    t.includes('statute') || t.includes('reform') || t.includes('law') ||
    t.includes('proposal') || t.includes('resolution') || t.includes('package')
  );

  if (hasVerb && hasNoun) {
    let category = 'general';
    let fiscalImpact = 15;
    let title = 'National Economic Resilience & Public Infrastructure Act';

    if (t.includes('energy') || t.includes('clean') || t.includes('climate') || t.includes('green') || t.includes('solar') || t.includes('wind')) {
      category = 'energy';
      fiscalImpact = 35;
      title = 'Clean Energy Grid Modernization & Strategic Export Act';
    } else if (t.includes('tax') || t.includes('deficit') || t.includes('fiscal') || t.includes('budget') || t.includes('debt')) {
      category = 'fiscal';
      fiscalImpact = -10;
      title = 'Middle-Class Fair Tax Relief & Deficit Reduction Act';
    } else if (t.includes('health') || t.includes('drug') || t.includes('medicine') || t.includes('hospital') || t.includes('medicare') || t.includes('nurse')) {
      category = 'healthcare';
      fiscalImpact = 20;
      title = 'Affordable Prescription Drugs & Hospital Nurse Staffing Act';
    } else if (t.includes('hous') || t.includes('mortgage') || t.includes('rent') || t.includes('homebuyer') || t.includes('zoning')) {
      category = 'housing';
      fiscalImpact = 18;
      title = 'First-Time Homebuyer Down-Payment & Zoning Relief Act';
    } else if (t.includes('tech') || t.includes('ai') || t.includes('semiconductor') || t.includes('chip') || t.includes('broadband')) {
      category = 'technology';
      fiscalImpact = 25;
      title = 'National Semiconductor Reshoring & Rural Gigabit Expansion Act';
    } else if (t.includes('trade') || t.includes('tariff') || t.includes('export') || t.includes('manufacturing')) {
      category = 'trade';
      fiscalImpact = 12;
      title = 'Allied Fair Trade & Domestic Steel Manufacturing Act';
    } else if (t.includes('crime') || t.includes('police') || t.includes('safety') || t.includes('justice')) {
      category = 'justice';
      fiscalImpact = 8;
      title = 'Community Safe Streets & First Responder Modernization Act';
    } else if (t.includes('veteran') || t.includes('military') || t.includes('defense')) {
      category = 'defense';
      fiscalImpact = 30;
      title = 'Veterans Comprehensive Care & Critical Cyber Defense Act';
    }

    return { isDraft: true, category, fiscalImpact, title, prompt: text };
  }
  return { isDraft: false };
}

// Detect whip count request
function detectWhipDirective(text) {
  const t = text.toLowerCase();
  return (
    t.includes('whip count') || t.includes('whip vote') || t.includes('floor vote') ||
    t.includes('whip tally') || t.includes('count the votes') || t.includes('floor tally') ||
    t.includes('do we have the votes') || t.includes('will it pass')
  );
}

// Detect committee submission
function detectCommitteeDirective(text) {
  const t = text.toLowerCase();
  return (
    t.includes('submit to committee') || t.includes('send to committee') ||
    t.includes('committee hearing') || t.includes('markup') || t.includes('refer to committee')
  );
}

// Detect campaign action directive
function detectCampaignDirective(text) {
  const t = text.toLowerCase();
  if (t.includes('fundraiser') || t.includes('donor') || t.includes('raise money')) return 'campaign_fundraiser';
  if (t.includes('townhall') || t.includes('town hall') || t.includes('meet voters')) return 'constituent_townhall';
  if (t.includes('press conference') || t.includes('media blitz') || t.includes('sunday show')) return 'media_press_conference';
  return null;
}

// Generate complete statutory bill text
function draftStatutoryBill(title, category, fiscalImpact, pState) {
  const year = new Date().getFullYear();
  return `A BILL

To establish comprehensive federal statutory programs advancing ${category.replace('_', ' ')}, authorized appropriations, and administrative reforms across all jurisdictions.

Be it enacted by the Senate and House of Representatives / Queen's Most Excellent Majesty in Parliament Assembled:

SECTION 1. SHORT TITLE.
This Act may be cited as the "${title}".

SECTION 2. FINDINGS AND CONGRESSIONAL INTENT.
(a) The legislative chamber finds that maintaining national economic competitiveness and constituent well-being requires focused public capital investments and regulatory modernization.
(b) Current macroeconomic telemetry requires fiscal prudence, ensuring that appropriations do not destabilize inflation expectations or exacerbate borrowing spreads.

SECTION 3. STATUTORY PROVISIONS AND ENFORCEMENT.
(a) The designated regulatory agencies shall promulgate binding standards within 180 days of enactment.
(b) Subsidies and competitive matching grants shall be formula-allocated to ensure parity between metropolitan districts and rural agricultural communities.
(c) Independent inspector general audits shall be published semi-annually to eliminate procurement fraud or cost overruns.

SECTION 4. APPROPRIATIONS AND FISCAL OFFSETS.
(a) AUTHORIZATION—There is authorized to be appropriated $${Math.abs(fiscalImpact)} Billion over a 5-year budget window.
(b) REVENUE OFFSETS—Expenditures shall be offset through targeted loophole closures on non-productive speculative assets and automated efficiency gains.

SECTION 5. EFFECTIVE DATE.
This Act shall take effect 60 days following executive signature and formal enactment.`;
}

// Fallback high-fidelity Political Chief of Staff engine
function generateLocalPoliticalAdvice(userMessage, pState, eState, bills = []) {
  const draftDirective = detectBillDraftDirective(userMessage);
  const isWhipRequest = detectWhipDirective(userMessage);
  const isCommittee = detectCommitteeDirective(userMessage);
  const campaignType = detectCampaignDirective(userMessage);

  let thinking = '';
  let responseText = '';
  let draftedBill = null;

  // 1. Bill Drafting Directive
  if (draftDirective.isDraft) {
    const billTitle = draftDirective.title;
    const statutoryText = draftStatutoryBill(billTitle, draftDirective.category, draftDirective.fiscalImpact, pState);

    draftedBill = {
      title: billTitle,
      summary: `Comprehensive statutory measure addressing ${draftDirective.category} with estimated 5-year fiscal appropriation of $${draftDirective.fiscalImpact}B.`,
      statutory_text: statutoryText,
      category: draftDirective.category,
      fiscal_impact_billions: draftDirective.fiscalImpact,
      public_support: 58 + Math.floor(Math.random() * 15),
      status: 'in_committee',
      committee_name: pState.committee_name || 'Committee on Economic & Legislative Oversight'
    };

    thinking = `[CHIEF OF STAFF STRATEGIC MEMORANDUM]
1. Mandate & Jurisdiction Assessment:
- Principal requested statutory drafting regarding: "${userMessage}".
- Subject aligns with ${draftDirective.category} docket and falls squarely under our committee jurisdiction (${pState.committee_name}).

2. Political & Electoral Calculus:
- District Approval (${pState.district_approval}%): Measure provides visible delivery for local community constituents without alienating swing-suburban voters.
- Polling Margin (${pState.polling_margin}%): Landmark sponsorship bolsters our legislative record against challenger attack ads.
- Party Whip Standing (${pState.party_loyalty}%): Provisions balance progressive funding demands with moderate fiscal offsets.

3. Macroeconomic Telemetry Sensitivity:
- Inflation (CPI: ${eState.inflation_cpi}%): Kept 5-year outlay at $${draftDirective.fiscalImpact}B to prevent fueling consumer demand price pressure.
- Deficit (${eState.fiscal_deficit}% of GDP): Explicit Section 4 revenue offsets shield our office from fiscal hawk attacks.

4. Execution Path:
- Statutory text drafted with full legislative citations.
- Submitting directly to committee docket for priority markup.`;

    responseText = `### 🏛️ Chief of Staff Briefing: Legislation Formally Drafted & Filed

Governor / Representative, I have drafted the formal statutory language for the **${billTitle}** and placed it onto our active committee docket.

#### Executive Summary
* **Title:** ${billTitle}
* **Committee Referral:** \`${draftedBill.committee_name}\`
* **Fiscal Score:** Estimated **$${draftDirective.fiscalImpact} Billion** (with dedicated Section 4 deficit offsets).
* **Preliminary Public Support:** **${draftedBill.public_support}%** favorable across district polling.

---

### Key Statutory Provisions
1. **Section 1–2 (Title & Findings):** Establishes explicit legislative findings addressing cost of living and district economic stability.
2. **Section 3 (Substantive Mandate):** Authorizes targeted federal grant and formula-distribution mechanisms while safeguarding local autonomy.
3. **Section 4 (Fiscal Integrity):** Explicitly pairs appropriations with unspent fund clawbacks, neutralizing opposition deficit hawk talking points.

*The measure is now ready for committee markup hearings or whip operation calculations.*`;

    return {
      content: `<think>\n${thinking}\n</think>\n\n${responseText}`,
      draftedBill
    };
  }

  // 1b. Donor Commitments & War Chest Strategy
  const isDonorQuery = /donor|promise|pledge|war\s*chest/i.test(userMessage);
  if (isDonorQuery) {
    thinking = `[CHIEF OF STAFF CAMPAIGN FINANCE & DONOR MEMORANDUM]
- Principal inquired regarding donor promises, campaign fundraising, and war chest accumulation ($${pState.war_chest_millions}M).
- Legislative Hook: Affirmative pledges made during donor interrogation salons are logged onto the persistent Donor Commitments Ledger.
- Risk/Reward Dynamics: Divisive corporate/special interest pledges deliver massive war chest bounties (+$7M-$15M+) at the cost of ethics scrutiny (+8 to +12), whereas ethical clean accords provide modest funding (+$1.5M-$3M) but bolster public approval and polling margins.
- Execution: Direct principal to 'Donor Pledges' on the legislative chamber board to draft fulfilling statutes.`;

    responseText = `### 💰 Chief of Staff Briefing: Donor Commitments & Campaign War Chest

Boss, our campaign war chest currently holds **$${pState.war_chest_millions} Million** in cash-on-hand.

Here is our strategic playbook for leveraging donor promises to fuel our political machine:

#### 1. The Donor Commitments Ledger
Whenever we answer policy questions during our campaign fundraising gauntlets, affirmative commitments made to donor groups are automatically logged on our persistent **Donor Commitments List**.

#### 2. Drafting Statutes from Pledges
You can open the **Author Bill** panel and click **Donor Commitments & Pledges**. This allows us to draft statutory language specifically targeted to fulfill the donor group's priority with pre-configured fiscal scores and categories.

#### 3. Cashing In on Enactment
When the bill is successfully whipped and passed into law on the floor:
* **⚡ Divisive Special Interest Compacts:** Unleash massive campaign bounties (**+$7M to +$15M+** in bundled cash), though watchdogs may launch ethics scrutiny inquiries.
* **✨ Clean Public Interest Accords:** Yield modest grassroots contributions (**+$1.5M to +$3M**) alongside significant gains in voter favorability and polling margin (+2% to +4%).

*Click the **'Donor Pledges'** button on your Legislative Chamber board anytime to review all pending commitments and draft fulfilling legislation!*`;

    return {
      content: `<think>\n${thinking}\n</think>\n\n${responseText}`
    };
  }

  // 2. Whip Count Calculation Request
  if (isWhipRequest) {
    const targetBill = bills.length > 0 ? bills[0] : {
      title: 'Current Priority Legislative Docket',
      category: 'fiscal',
      fiscal_impact_billions: 20,
      public_support: 62
    };

    const whip = calculateWhipVoteCount(targetBill, pState, pState.political_capital || 0);

    thinking = `[CHIEF OF STAFF WHIP TALLY REASONING]
1. Chamber Floor Math:
- Total Chamber Seats: ${whip.total_seats}.
- Constitutional Majority Threshold: ${whip.majority_threshold} votes.

2. Coalition Breakdown:
- Party Loyalists & Centrists: Strong baseline cohesion based on current party loyalty (${pState.party_loyalty}%).
- Moderate Faction: Cautious regarding fiscal outlay ($${targetBill.fiscal_impact_billions}B).
- Opposition Crossover: Bipartisan provisions attract ${whip.breakdown.opposition_ayes} cross-aisle votes.

3. Outcome Evaluation:
- Projected Tally: ${whip.total_ayes} Ayes vs ${whip.total_nays} Nays (${whip.undecided} Undecided).
- Assessment: ${whip.passed ? 'Solid majority for passage.' : 'Deficit needs arm-twisting or earmarks.'}`;

    responseText = `### 📋 Chief of Staff Whip Report: Floor Vote Projection

Here is our whip board's calculated floor tally for **${targetBill.title}**:

| Category | Projected Seats | Whip Status |
| :--- | :---: | :--- |
| **Total Chamber Seats** | **${whip.total_seats}** | Chamber Size |
| **Majority Needed** | **${whip.majority_threshold}** | Statutory Threshold |
| **Projected AYES** | **${whip.total_ayes}** | ✅ Solid Supporting Coalition |
| **Projected NAYS** | **${whip.total_nays}** | ❌ Hard Opposition & Fiscal Rebels |
| **Undecided / Leaning** | **${whip.undecided}** | ⚖️ Swing Votes in Play |

#### Strategic Recommendation
${whip.passed 
  ? `⭐ **Green Light for Floor Action:** We currently command **${whip.total_ayes} votes**, comfortably surpassing the ${whip.majority_threshold}-seat requirement. I recommend scheduling the floor division immediately before opposition whips can mount counter-attacks.`
  : `⚠️ **Vote Shortfall Warning:** We are **${whip.majority_threshold - whip.total_ayes} votes short** of passage. I advise spending 5 to 10 points of Political Capital on localized district earmarks or offering committee amendment concessions to bridge the gap.`
}`;

    return {
      content: `<think>\n${thinking}\n</think>\n\n${responseText}`
    };
  }

  // 3. Campaign & Media Directives
  if (campaignType) {
    let actionTitle = 'Strategic Campaign Blitz';
    if (campaignType === 'campaign_fundraiser') actionTitle = 'High-Dollar Donor & PAC Fundraiser';
    if (campaignType === 'constituent_townhall') actionTitle = 'District Constituent Town Hall';
    if (campaignType === 'media_press_conference') actionTitle = 'Capitol Press Conference & Sunday Circuit';

    thinking = `[CAMPAIGN STRATEGY MEMORANDUM]
- Principal directive: Mobilize ${actionTitle}.
- Current War Chest: $${pState.war_chest_millions}M | District Approval: ${pState.district_approval}%.
- Strategy: Maximize message discipline, keep the focus on kitchen-table economics (CPI: ${eState.inflation_cpi}%), and protect re-election margin (+${pState.polling_margin}%).`;

    responseText = `### 🎙️ Chief of Staff Directive: ${actionTitle} Scheduled

Understood. I have initiated logistics for the **${actionTitle}**.

* **Message Focus:** Delivering concrete solutions for working families, defending our legislative accomplishments in committee, and holding down living costs.
* **Expected Impact:** Strengthens local name ID, rallies the party grassroots, and expands our campaign resources ahead of the next election cycle.

*You can also lock in this monthly primary action directly from the Monthly Action Bar.*`;

    return {
      content: `<think>\n${thinking}\n</think>\n\n${responseText}`
    };
  }

  // 4. General Strategic Political Counsel
  thinking = `[CHIEF OF STAFF POLITICAL ASSESSMENT]
1. Macroeconomic Context:
- Inflation (CPI: ${eState.inflation_cpi}%): Voter pain index is the primary determinant of constituent sentiment.
- Unemployment (${eState.unemployment_rate}%): Labor markets remain watchpoint for local manufacturing precincts.
- Interest Rates (${eState.interest_rate}%): Mortgage affordability is generating constituent casework inquiries.

2. Electoral Security:
- Current District Approval: ${pState.district_approval}% | National Approval: ${pState.national_approval}%.
- Polling Margin: ${pState.polling_margin}% | Months to Election: ${pState.months_to_election}.
- Promotion Readiness: ${pState.promotion_available ? 'Eligible for elevation to next office!' : 'Requires higher seniority and bills passed.'}

3. Recommendations:
- Sponsor targeted statutory legislation.
- Maintain cordial relations with committee leadership and party whips.
- Build up campaign war chest reserves ($${pState.war_chest_millions}M).`;

  responseText = `### 🏛️ Chief of Staff Strategic Briefing

Boss, here is where we stand on the Hill / in Westminster this month:

#### 1. Political Standing & Re-Election Pulse
* **District Favorability:** **${pState.district_approval}%** (Constituents view our office favorably, but vigilance is required).
* **Polling Margin:** **+${pState.polling_margin}%** over the prospective opposition challenger.
* **Campaign War Chest:** **$${pState.war_chest_millions} Million** in available cash-on-hand.
* **Party Whip Trust:** **${pState.party_loyalty}%** loyalty score.

#### 2. Macroeconomic Climate & Voter Sentiment
* **Inflation & Grocery Bills:** Currently sitting at **${eState.inflation_cpi}%**. If grocery and utility prices climb above 4.5%, opposition super-PACs will launch television attack blitzes.
* **Interest & Borrowing Rates:** The Central Bank has benchmark rates at **${eState.interest_rate}%**, which is keeping 30-year mortgages elevated.

#### 3. Recommended Chief of Staff Actions
1. **Draft Legislation:** Tell me what issue you want to tackle (e.g., *"Draft a bill on clean energy infrastructure"* or *"Author legislation for first-time homebuyers"*), and I will author statutory text and submit it to committee.
2. **Floor Whip Counts:** Ask me to *"get a whip vote count"* on any bill to see if we have the floor votes.
3. **Constituent Outreach:** Schedule a town hall or press conference from your action desk to bolster local support.

*How would you like to direct our office this month?*`;

  return {
    content: `<think>\n${thinking}\n</think>\n\n${responseText}`
  };
}

// Main handler connecting to deepseek-v4-pro or local engine
async function handlePoliticalAdvisorChat(userMessage, pState, eState, chatHistory = [], bills = [], session = null) {
  // Check if user is asking the Chief of Staff to reach out to another caucus leader
  const availableCaucuses = session?.caucuses || [];
  const outreach = detectCaucusOutreachDirective(userMessage, availableCaucuses);

  if (outreach.isOutreach && outreach.targetCaucus) {
    const targetCaucus = outreach.targetCaucus;
    const caucusRes = await generateCaucusLeaderAIResponse({
      caucusId: targetCaucus.id,
      senderType: 'advisor',
      incomingMessage: userMessage,
      pState,
      eState,
      bills,
      session
    });

    let thinking = '';
    let responseText = '';

    if (caucusRes.requiresPersonalResponse) {
      thinking = `[CHIEF OF STAFF CAUCUS DIPLOMACY REPORT — v4-pro]
- Directive: Dispatched diplomatic inquiry to ${targetCaucus.leader} (${targetCaucus.name}) on behalf of our office.
- Diplomatic Resistance: ${targetCaucus.leader} firmly rejects staff intermediaries.
- Personal Demand Issued: "${caucusRes.personalPrompt}".
- Assessment: To secure ${targetCaucus.member_count} floor votes, the Boss must personally speak to them in the Cloakroom DMs.`;

      responseText = `### ⚠️ Cloakroom Dispatch: ${targetCaucus.leader} Demands a Personal Audience!

Boss, I dispatched a formal diplomatic inquiry to **${targetCaucus.leader}** (${targetCaucus.name}) on behalf of our office.

${targetCaucus.leader} flatly refused to negotiate through staff intermediaries, stating:

> *"I don't barter away the **${targetCaucus.member_count} votes** of my caucus through junior aides and staff memos. If ${pState.politician_name} wants our support, they need to answer me directly."*

---

#### 🗣️ Personal Challenge Posed by ${targetCaucus.leader}:
> **"${caucusRes.personalPrompt}"**

---

👉 **Next Step:** Switch to the **Cloakroom DMs** tab above, select **${targetCaucus.leader}**, and respond to their challenge **in your own words**. They will not move an inch until they hear directly from you without an aide acting as intermediary!`;
    } else {
      thinking = `[CHIEF OF STAFF CAUCUS DIPLOMACY REPORT — v4-pro]
- Directive: Reached out to ${targetCaucus.leader} (${targetCaucus.name}).
- Leader Stance: Responded via aide channel.
- Core Requirements: Wants focus on ${targetCaucus.priorities?.join(', ')}.`;

      responseText = `### 🏛️ Chief of Staff Diplomatic Report: Contact with ${targetCaucus.leader}

Boss, I conferred with the office of **${targetCaucus.leader}** (${targetCaucus.name}, commanding **${targetCaucus.member_count} seats**).

Here is the feedback their leadership relayed:

> ${caucusRes.content.replace(/<think>[\s\S]*?<\/think>/, '').trim()}

I have logged this exchange into your **Cloakroom DMs** thread with ${targetCaucus.leader}. You can jump in and direct message them anytime!`;
    }

    return {
      content: `<think>\n${thinking}\n</think>\n\n${responseText}`,
      caucusOutreach: {
        targetCaucus,
        leaderResponseText: caucusRes.content,
        requiresPersonalResponse: caucusRes.requiresPersonalResponse,
        personalPrompt: caucusRes.personalPrompt
      }
    };
  }

  // Check if DeepSeek API key exists in system settings
  let apiKey = null;
  try {
    const row = db.prepare("SELECT value FROM system_settings WHERE key = 'deepseek_api_key'").get();
    if (row && row.value && row.value.trim().length > 5) {
      apiKey = row.value.trim();
    }
  } catch (e) {}

  // If DeepSeek API key is available, call API with strict political persona & thinking
  if (apiKey) {
    try {
      const entropy = generateRandomPrepromptEntropy('politics');
      const systemPrompt = `You are the seasoned, sharp, fiercely loyal Chief of Staff to ${pState.politician_title} ${pState.politician_name} in ${pState.chamber}.
Your principal belongs to the ${pState.party_name} (${pState.party_ideology}) representing ${pState.district_name}.
Current political metrics: District Approval: ${pState.district_approval}%, National Approval: ${pState.national_approval}%, Party Loyalty: ${pState.party_loyalty}%, War Chest: $${pState.war_chest_millions}M, Polling Margin: +${pState.polling_margin}%, Months to Election: ${pState.months_to_election}.
Current macroeconomic telemetry: Inflation CPI: ${eState.inflation_cpi}%, Unemployment: ${eState.unemployment_rate}%, GDP Growth: ${eState.gdp_growth}%, Central Bank Interest Rate: ${eState.interest_rate}%, Fiscal Deficit: ${eState.fiscal_deficit}%.

${entropy}

Your duties:
1. Write and draft formal statutory legislation when instructed.
2. Provide whip counts and floor division assessments.
3. Offer strategic, ruthless, yet constitutionally grounded political counsel.
4. Format all internal tactical analysis, vote math, and political calculus inside <think>...</think> tags.`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(4000),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-v4-pro',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory.slice(-4).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
            { role: 'user', content: userMessage }
          ],
          max_tokens: 3500,
          temperature: 0.6
        })
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices && data.choices[0];
        if (choice && choice.message) {
          let fullContent = choice.message.content || '';
          if (choice.message.reasoning_content && !fullContent.includes('<think>')) {
            fullContent = `<think>\n${choice.message.reasoning_content}\n</think>\n\n${fullContent}`;
          }

          // Check if user requested a bill draft to persist
          const draftCheck = detectBillDraftDirective(userMessage);
          let draftedBill = null;
          if (draftCheck.isDraft) {
            draftedBill = {
              title: draftCheck.title,
              summary: `Statutory measure addressing ${draftCheck.category}.`,
              statutory_text: draftStatutoryBill(draftCheck.title, draftCheck.category, draftCheck.fiscalImpact, pState),
              category: draftCheck.category,
              fiscal_impact_billions: draftCheck.fiscalImpact,
              public_support: 62,
              status: 'in_committee',
              committee_name: pState.committee_name || 'Committee on Economic & Legislative Oversight'
            };
          }

          return { content: fullContent, draftedBill };
        }
      }
    } catch (apiErr) {
      console.warn('DeepSeek API failed in political advisor, using local statecraft engine:', apiErr.message);
    }
  }

  // Default to offline high-fidelity Statecraft engine
  return generateLocalPoliticalAdvice(userMessage, pState, eState, bills);
}

module.exports = {
  detectBillDraftDirective,
  detectWhipDirective,
  detectCommitteeDirective,
  detectCampaignDirective,
  draftStatutoryBill,
  handlePoliticalAdvisorChat
};
