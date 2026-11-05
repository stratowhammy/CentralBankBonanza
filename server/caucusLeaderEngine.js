const db = require('./db');
const { generateRandomPrepromptEntropy } = require('./promptEntropy');

// Detailed caucus leader profiles with temperament and negotiation thresholds
const CAUCUS_LEADER_PROFILES = {
  // === UNICAMERAL (House of Commons) ===
  socialist_campaign_group: {
    id: 'socialist_campaign_group',
    name: 'Trade Union & Socialist Campaign Group',
    leader: 'Arthur Pendelton MP',
    system_type: 'unicameral',
    member_count: 44,
    ideology: 'Democratic Socialist & Union Benchers',
    temperament: 'combative_populist',
    intermediary_tolerance: 'low', // Despises staff intermediaries
    avatar_color: 'red',
    avatar_initials: 'AP',
    priorities: ['healthcare', 'labor', 'housing', 'social_welfare'],
    red_lines: ['privatization', 'corporate_tax_cuts', 'spending_caps', 'deregulation'],
    background: 'Former railway union general secretary and longtime backbencher representing industrial coal and manufacturing constituencies.',
    speech_style: 'Direct, morally intense, fiery, uses working-class idioms, contemptuous of corporate lobbyists and consultant spin.',
    personal_challenges: [
      "Look, I respect your office staff, but I don't give 44 socialist votes away over an aide's memo. If you want our union members to walk the plank, tell me straight to my face: how do you justify taking millions from K-Street while asking working families to tighten their belts?",
      "I don't horse-trade through junior aides. Answer me directly without staff filters: will you commit in writing to universal prevailing wages and statutory tenant protections on this bill, or are you just telling me what I want to hear?",
      "Your Chief of Staff talks a good game about 'bipartisan consensus', which usually means working people get sold out. Look me in the eye: what tangible protection does this legislation give to nurses and factory workers in my constituency?"
    ]
  },
  one_nation_moderates: {
    id: 'one_nation_moderates',
    name: 'One-Nation Moderate Benchers',
    leader: 'Victoria Ashworth MP',
    system_type: 'unicameral',
    member_count: 36,
    ideology: 'Centrist Civic Reformers',
    temperament: 'pragmatic_centrist',
    intermediary_tolerance: 'moderate',
    avatar_color: 'cyan',
    avatar_initials: 'VA',
    priorities: ['infrastructure', 'healthcare', 'climate', 'fiscal'],
    red_lines: ['radical_taxation', 'fiscal_recklessness', 'extremism'],
    background: 'Barrister and senior civic policy chair known for cross-party committee alliances and institutional prudence.',
    speech_style: 'Eloquent, patrician, measured, polite but uncompromising on institutional norms and deficit guardrails.',
    personal_challenges: [
      "Your Chief of Staff presented an intriguing outline, but my 36 moderate benchers represent vulnerable swing constituencies. I need to hear from you directly: how do you intend to defend the macroeconomic cost of this statute when inflation is pressing family budgets?",
      "I'm willing to overlook procedural friction, but I need your personal word as caucus chair: if we back your floor docket, will you ensure our regional hospital and green belt conservation amendments are not watered down in conference?"
    ]
  },
  free_enterprise_group: {
    id: 'free_enterprise_group',
    name: 'Fiscal Prudence & Free Enterprise Faction',
    leader: 'Sir Alistair Finch MP',
    system_type: 'unicameral',
    member_count: 39,
    ideology: 'Free-Market Conservative Backbenchers',
    temperament: 'aristocratic_patrician',
    intermediary_tolerance: 'low',
    avatar_color: 'amber',
    avatar_initials: 'AF',
    priorities: ['fiscal', 'deregulation', 'taxation', 'trade'],
    red_lines: ['wealth_taxes', 'public_ownership', 'burdensome_regulation'],
    background: 'Former merchant banker and City financier who views government intervention as economic poison.',
    speech_style: 'Dry, aristocratic, caustic, razor-sharp on balance sheets, impatient with bureaucratic boilerplate.',
    personal_challenges: [
      "Sending a junior staffer to solicit 39 conservative votes is rather presumptuous. If you want our capital-expensing faction behind your statutory docket, you tell me yourself: what regulatory burdens are you repealing in exchange?",
      "I don't discuss sovereign balance sheets with aides. Look at our debt-to-GDP telemetry. Answer me plainly: where is the statutory spending brake in your package, or are you expecting my members to endorse unchecked deficit borrowing?"
    ]
  },
  regional_devolution_bloc: {
    id: 'regional_devolution_bloc',
    name: 'Regional Autonomy & Devolution Alliance',
    leader: 'Fiona MacLeod MP',
    system_type: 'unicameral',
    member_count: 29,
    ideology: 'Municipal Decentralization & Regional Development',
    temperament: 'tenacious_advocate',
    intermediary_tolerance: 'moderate',
    avatar_color: 'emerald',
    avatar_initials: 'FM',
    priorities: ['infrastructure', 'transport', 'regional_grants', 'energy'],
    red_lines: ['centralized_mandates', 'national_takeovers', 'funding_carveouts_omitted'],
    background: 'Former regional council convener who fought for municipal transit and localized fiscal powers.',
    speech_style: 'Passionate, incisive, territorial, laser-focused on local funding formulas and provincial dignity.',
    personal_challenges: [
      "Your office staff keep promising that 'the provinces will benefit', but Westminster promises don't pave municipal roads. Speak to me directly: what percentage of this appropriation goes directly to regional authorities rather than central ministries?"
    ]
  },
  green_reform_caucus: {
    id: 'green_reform_caucus',
    name: 'Green Transition & Civil Liberties Caucus',
    leader: 'Dr. Helena Zhang MP',
    system_type: 'unicameral',
    member_count: 27,
    ideology: 'Ecological Modernization & Civil Freedoms',
    temperament: 'scientific_idealist',
    intermediary_tolerance: 'moderate',
    avatar_color: 'teal',
    avatar_initials: 'HZ',
    priorities: ['climate', 'energy', 'civil_liberties', 'technology'],
    red_lines: ['fossil_subsidies', 'environmental_rollbacks', 'surveillance_expansion'],
    background: 'Former atmospheric physics researcher and environmental rights attorney.',
    speech_style: 'Analytical, data-grounded, urgent, deeply skeptical of fossil fuel industry greenwashing.',
    personal_challenges: [
      "Staffers can paper over compromises with slick summaries, but emissions telemetry doesn't lie. Look me in the eye and answer: does this statute genuinely lower carbon intensity, or did you slip in permitting carve-outs for pipeline lobbyists?"
    ]
  },

  // === BICAMERAL (Lower House / Congressional) ===
  progressive_caucus: {
    id: 'progressive_caucus',
    name: 'Progressive Working-Class Caucus',
    leader: 'Rep. Elena Rostova',
    system_type: 'bicameral',
    member_count: 42,
    ideology: 'Social Democratic & Labor Justice',
    temperament: 'combative_populist',
    intermediary_tolerance: 'low',
    avatar_color: 'rose',
    avatar_initials: 'ER',
    priorities: ['healthcare', 'labor', 'housing', 'climate'],
    red_lines: ['corporate_giveaways', 'means_testing', 'deregulation'],
    background: 'Former tenant rights organizer and community health clinic director elected on a grassroots wave.',
    speech_style: 'Urgent, impassioned, plain-spoken, unapologetically pro-working class, hates corporate compromise.',
    personal_challenges: [
      "I don't negotiate my caucus's 42 votes through staff intermediaries. If you want our progressive bloc to deliver your floor majority, tell me directly: are you willing to cap prescription drug prices and protect union organizing, or are you folding to corporate donors?",
      "Your Chief of Staff says you need our votes to pass your bill. Fine. But look me in the eye right now: what are working families in my district getting out of this deal?"
    ]
  },
  freedom_faction: {
    id: 'freedom_faction',
    name: 'Conservative Freedom Faction',
    leader: 'Rep. Wyatt Vance',
    system_type: 'bicameral',
    member_count: 36,
    ideology: 'Constitutional Fiscal Conservatives',
    temperament: 'constitutional_hawkish',
    intermediary_tolerance: 'low',
    avatar_color: 'amber',
    avatar_initials: 'WV',
    priorities: ['fiscal', 'deregulation', 'defense', 'trade'],
    red_lines: ['omnibus_spending', 'debt_hikes', 'agency_expansions'],
    background: 'Constitutional litigator and former state auditor who views federal spending as an existential threat to sovereign liberty.',
    speech_style: 'Stern, uncompromising, legalistic, quotes founding principles and fiscal metrics with absolute conviction.',
    personal_challenges: [
      "I have made it a point of honor never to horse-trade with legislative aides. If you want 36 Freedom Faction votes on the floor, answer me yourself: where is the corresponding spending reduction? Give me the exact dollar figure or we vote NO.",
      "Your office staff sent a polite overture, but politeness doesn't pay down the national debt. Look me in the eye: will you support our statutory two-for-one regulatory repeal amendment, yes or no?"
    ]
  },
  problem_solvers: {
    id: 'problem_solvers',
    name: 'Problem Solvers Centrist Coalition',
    leader: 'Rep. Evelyn Mercer',
    system_type: 'bicameral',
    member_count: 28,
    ideology: 'Bipartisan Pragmatic Moderates',
    temperament: 'pragmatic_centrist',
    intermediary_tolerance: 'moderate',
    avatar_color: 'cyan',
    avatar_initials: 'EM',
    priorities: ['infrastructure', 'technology', 'trade', 'fiscal'],
    red_lines: ['polarizing_culture_war', 'fiscal_extremes'],
    background: 'Former civil engineering executive and moderate mayor known for bipartisan consensus-building.',
    speech_style: 'Pragmatic, metrics-oriented, deal-driven, focused on deliverable infrastructure and broad coalitions.',
    personal_challenges: [
      "Our 28 members are the only reason bills pass in this divided chamber. Tell me directly, without staff varnish: how does this measure hold together across both moderate wings without alienating suburban independents?"
    ]
  },
  rust_belt_alliance: {
    id: 'rust_belt_alliance',
    name: 'Rust Belt Industrial & Energy Alliance',
    leader: 'Rep. Frank Kowalski',
    system_type: 'bicameral',
    member_count: 31,
    ideology: 'Pro-Labor Domestic Manufacturing',
    temperament: 'tenacious_advocate',
    intermediary_tolerance: 'low',
    avatar_color: 'amber',
    avatar_initials: 'FK',
    priorities: ['trade', 'manufacturing', 'infrastructure', 'labor'],
    red_lines: ['trade_giveaways', 'offshoring_incentives', 'anti-union_provisions'],
    background: 'Former steel mill union steward and third-generation industrial community champion.',
    speech_style: 'Gruff, hearty, no-nonsense, speaks with deep industrial authenticity, sniffs out insincerity instantly.',
    personal_challenges: [
      "Listen to me, boss. Don't send your junior staffers to my office with glossy slide decks. If you want my steelworkers and machinists on your side, look me in the eye and tell me: does this bill mandate 100% domestic iron and steel, or is it another loophole-ridden sellout?",
      "I've seen politicians come and go with big promises. Answer me straight: what guarantees are you giving that these energy transition grants won't kill high-wage baseload jobs in my district?"
    ]
  },
  main_street_bloc: {
    id: 'main_street_bloc',
    name: 'Main Street Merchants & Small Enterprise Bloc',
    leader: 'Rep. Dwight Caldwell',
    system_type: 'bicameral',
    member_count: 22,
    ideology: 'Independent Commercial Reformers',
    temperament: 'pragmatic_centrist',
    intermediary_tolerance: 'moderate',
    avatar_color: 'emerald',
    avatar_initials: 'DC',
    priorities: ['taxation', 'banking', 'labor', 'fiscal'],
    red_lines: ['commercial_credit_crunches', 'monopolistic_carveouts'],
    background: 'Independent community banker and former president of regional chamber of commerce.',
    speech_style: 'Courteous, numbers-focused, entrepreneurial, protective of local retail and community banks.',
    personal_challenges: [
      "Small business owners in my district are suffocating under payment processing fees and regulatory audits. Talk to me directly: what concrete carve-out does your bill provide for community banks and independent merchants?"
    ]
  }
};

// Helper: detect if a user prompt is asking the Chief of Staff to reach out to a caucus leader
function detectCaucusOutreachDirective(text, caucuses = []) {
  const t = text.toLowerCase();
  const outreachVerbs = [
    'reach out', 'contact', 'send a note', 'send note', 'talk to', 'speak to',
    'negotiate with', 'approach', 'message', 'dm', 'ping', 'ask', 'propose to',
    'cut a deal with', 'backchannel', 'confer with', 'write to'
  ];

  const hasOutreachVerb = outreachVerbs.some(v => t.includes(v));
  if (!hasOutreachVerb) return { isOutreach: false };

  // Match against available caucuses and leaders
  for (const c of caucuses) {
    const leaderNames = c.leader.toLowerCase().split(' ');
    const lastName = leaderNames[leaderNames.length - 1];
    const caucusWords = c.name.toLowerCase().split(' ');

    const mentionsLeader = t.includes(c.leader.toLowerCase()) || 
      (lastName.length > 3 && t.includes(lastName));
    const mentionsCaucus = t.includes(c.id) || 
      caucusWords.some(w => w.length > 4 && t.includes(w));

    if (mentionsLeader || mentionsCaucus) {
      return {
        isOutreach: true,
        targetCaucus: c,
        targetLeader: c.leader,
        rawText: text
      };
    }
  }

  return { isOutreach: false };
}

// Generate in-character response using v4-pro thinking (via DeepSeek API if available, or rich local Statecraft engine)
async function generateCaucusLeaderAIResponse({
  caucusId,
  senderType, // 'user' (direct personal) or 'advisor' (aide on behalf of office)
  incomingMessage,
  isRespondingToPersonalPrompt = false,
  activePersonalPrompt = null,
  pState,
  eState,
  bills = [],
  dmHistory = [],
  session
}) {
  const profile = CAUCUS_LEADER_PROFILES[caucusId] || {
    id: caucusId,
    name: 'Legislative Faction',
    leader: 'Senior Faction Leader',
    member_count: 30,
    ideology: 'Legislative Faction',
    temperament: 'pragmatic_centrist',
    intermediary_tolerance: 'moderate',
    speech_style: 'Formal, strategic, legislative.',
    personal_challenges: ["Tell me straight without staff filters: why should my members back your legislative agenda?"]
  };

  // Check if DeepSeek API key is present in database
  let apiKey = null;
  try {
    const row = db.prepare("SELECT value FROM system_settings WHERE key = 'deepseek_api_key'").get();
    if (row && row.value && row.value.trim().length > 5) {
      apiKey = row.value.trim();
    }
  } catch (e) {}

  // Determine if leader should demand to "speak to you personally"
  // Rules:
  // 1. If message comes from 'advisor' (aide channel) AND
  //    (leader's intermediary_tolerance is 'low', OR message is proposing a deal / vote pledge / asking for floor backing)
  //    => They refuse to deal with an aide and demand to speak to the player personally!
  // 2. If already responding to personal prompt, they evaluate the direct response.
  let requiresPersonalResponse = false;
  let personalPrompt = null;

  const isAskingForVotesOrDeal = /vote|bill|deal|logroll|support|back|pass|statute|amendment|compromise/i.test(incomingMessage);
  
  if (senderType === 'advisor' && !isRespondingToPersonalPrompt) {
    if (profile.intermediary_tolerance === 'low' || isAskingForVotesOrDeal) {
      requiresPersonalResponse = true;
      const challenges = profile.personal_challenges || [
        `I don't negotiate through aides. Tell ${pState.politician_title} ${pState.politician_name} to look me in the eye and give me their personal word.`
      ];
      personalPrompt = challenges[Math.floor(Math.random() * challenges.length)];
    }
  }

  // If DeepSeek API key exists, call deepseek-v4-pro with thinking
  if (apiKey) {
    try {
      const entropy = generateRandomPrepromptEntropy('politics');
      const isUnicameral = session.system_type === 'unicameral' || session.system_type === 'parliamentary';
      const chamberName = isUnicameral ? 'House of Commons' : 'Lower House';

      const promptContext = `You are ${profile.leader}, leader of the ${profile.name} (${profile.member_count} voting members) in the ${chamberName}.
Your Ideology: ${profile.ideology}.
Your Background: ${profile.background || 'Veteran legislator'}.
Your Temperament: ${profile.temperament}.
Speech Style: ${profile.speech_style}.

Interaction context:
- You are communicating with the office of ${pState.politician_title} ${pState.politician_name} (Leader of ${pState.player_caucus_name || 'their caucus'}).
- Sender Type: ${senderType === 'user' ? 'Direct 1-on-1 personal message from the Politician themselves' : 'Chief of Staff / Legislative Aide writing on behalf of the Politician'}.
${isRespondingToPersonalPrompt ? `CRITICAL CONTEXT: The Politician is directly answering your previous demand to speak to you personally: "${activePersonalPrompt}". Evaluate their authentic conviction, policy concessions, and whether you believe them.` : ''}
${requiresPersonalResponse ? `MANDATORY REQUIREMENT: You refuse to conduct high-stakes business or grant vote pledges to a staff intermediary. You must tell the aide that you demand to speak to ${pState.politician_name} PERSONALLY in the cloakroom, and pose this exact challenge: "${personalPrompt}".` : ''}

Current Macro & Chamber Context:
- Inflation (CPI): ${eState.inflation_cpi}% | Unemployment: ${eState.unemployment_rate}% | Rates: ${eState.interest_rate}%.
- Politician District Approval: ${pState.district_approval}% | War Chest: $${pState.war_chest_millions}M | Ethics Scrutiny: ${pState.ethics_scrutiny}%.

${entropy}

Instructions:
1. Conduct all tactical, vote-counting, ideological calculus and gut evaluation inside <think>...</think> tags.
2. In your visible response, stay completely in character. Be memorable, sharp, and authentic to your ideology.
3. If speaking directly to the Politician, address them by title/name, evaluate what they said, and either strike a hard bargain, demand specific amendments, or shake on a deal if satisfied.`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(4500),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-v4-pro',
          messages: [
            { role: 'system', content: promptContext },
            ...dmHistory.slice(-4).map(m => ({
              role: m.sender === 'caucus_leader' ? 'assistant' : 'user',
              content: m.content
            })),
            { role: 'user', content: incomingMessage }
          ],
          max_tokens: 3000,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const choice = data.choices && data.choices[0];
        if (choice && choice.message) {
          let fullText = choice.message.content || '';
          if (choice.message.reasoning_content && !fullText.includes('<think>')) {
            fullText = `<think>\n${choice.message.reasoning_content}\n</think>\n\n${fullText}`;
          }

          let dealAgreed = false;
          let pledgedVotes = 0;
          if (isRespondingToPersonalPrompt && /deal|agree|support|ayes|deliver.*votes|locked/i.test(fullText)) {
            dealAgreed = true;
            pledgedVotes = Math.round(profile.member_count * 0.85);
          }

          return {
            content: fullText,
            requiresPersonalResponse,
            personalPrompt,
            dealAgreed,
            pledgedVotes,
            leaderName: profile.leader,
            caucusName: profile.name
          };
        }
      }
    } catch (apiErr) {
      console.warn('DeepSeek caucus leader API call fallback:', apiErr.message);
    }
  }

  // High-Fidelity Local Statecraft Engine with v4-pro Thinking
  return generateLocalCaucusLeaderAI({
    profile,
    senderType,
    incomingMessage,
    isRespondingToPersonalPrompt,
    activePersonalPrompt,
    requiresPersonalResponse,
    personalPrompt,
    pState,
    eState,
    bills
  });
}

// Procedural high-fidelity Statecraft engine generating in-character dialogue with <think>...</think>
function generateLocalCaucusLeaderAI({
  profile,
  senderType,
  incomingMessage,
  isRespondingToPersonalPrompt,
  activePersonalPrompt,
  requiresPersonalResponse,
  personalPrompt,
  pState,
  eState,
  bills
}) {
  let thinking = '';
  let reply = '';
  let dealAgreed = false;
  let pledgedVotes = 0;

  // Case 1: Message from Aide (Advisor), leader demands personal dialogue
  if (senderType === 'advisor' && requiresPersonalResponse) {
    thinking = `[CAUCUS LEADER STRATEGIC REASONING — v4-pro]
Leader: ${profile.leader} (${profile.name}, ${profile.member_count} members).
Inbound: Staff aide reaching out on behalf of ${pState.politician_title} ${pState.politician_name}.
Content: "${incomingMessage}".

Tactical Calculus:
1. Intermediary Disdain: My caucus represents ${profile.member_count} disciplined lawmakers. We are not a voting rubber stamp for leadership or committee chairs to court through twenty-something legislative assistants.
2. Leverage Assessment: ${pState.politician_name} clearly needs our floor votes. If they want our locked bloc, they must bear the political skin-in-the-game personally.
3. Decision: Refuse staff communication outright. Demand a 1-on-1 personal audience in the cloakroom and pose the ideological challenge: "${personalPrompt}".`;

    reply = `To the Office of ${pState.politician_title} ${pState.politician_name}:

I received your office dispatch. Let me be blunt: I do not barter away the ${profile.member_count} votes of the ${profile.name} through junior aides and staff memos. 

If your principal wants our caucus behind their legislative docket, tell them to get off their pedestal and come talk to me directly in the cloakroom. 

Here is what I need to hear from ${pState.politician_name} personally:

> **"${personalPrompt}"**

Have them message me in our direct line in their own words. Until then, my caucus is marked down as a firm NO.`;

    return {
      content: `<think>\n${thinking}\n</think>\n\n${reply}`,
      requiresPersonalResponse: true,
      personalPrompt,
      dealAgreed: false,
      pledgedVotes: 0,
      leaderName: profile.leader,
      caucusName: profile.name
    };
  }

  // Case 2: User is answering an active personal prompt directly
  if (isRespondingToPersonalPrompt) {
    const responseQuality = incomingMessage.trim().length > 40 ? 'substantive' : 'curt';
    const mentionsConcession = /commit|amend|promise|fund|protect|ensure|include|priority|concession/i.test(incomingMessage);

    thinking = `[CAUCUS LEADER EVALUATION OF PERSONAL AUDIENCE — v4-pro]
Leader: ${profile.leader}.
Politician Direct Words: "${incomingMessage}".
Prompt Answered: "${activePersonalPrompt}".

Psychological & Policy Evaluation:
- Authenticity check: Response appears ${responseQuality}. ${mentionsConcession ? 'Includes concrete policy assurances and compromises.' : 'Relies primarily on rhetorical persuasion.'}
- Caucus Priority Alignment: Evaluated against ${profile.priorities.join(', ')}.
- Political Risk: Partnering with ${pState.politician_name} (District App: ${pState.district_approval}%, War Chest: $${pState.war_chest_millions}M).
- Verdict: ${mentionsConcession || responseQuality === 'substantive' ? 'Accept terms. Pledge caucus votes on upcoming floor divisions.' : 'Demand firmer statutory commitment before releasing votes.'}`;

    if (mentionsConcession || responseQuality === 'substantive') {
      dealAgreed = true;
      pledgedVotes = Math.round(profile.member_count * 0.85);

      reply = `${pState.politician_name},

I appreciate you looking me in the eye and answering that yourself instead of hiding behind press releases and staff memos. That takes political backbone.

Your words address the core concerns of the ${profile.name}. If you hold to the commitments you just laid out, you have my personal word: **my caucus will deliver ${pledgedVotes} locked votes** for your priority statute on the floor.

Let's get this legislation passed. But remember—if you walk back these terms in committee conference, our alliance is finished.`;

    } else {
      reply = `${pState.politician_name},

I hear you, but that sounds more like a Sunday show talking point than a binding commitment. My members are facing real constituent heat over living costs and district jobs. 

If you want the ${profile.member_count} votes of the ${profile.name}, I need you to be specific: what statutory amendment or funding guarantee are you adding to the bill text for our priorities? Give me something tangible.`;
    }

    return {
      content: `<think>\n${thinking}\n</think>\n\n${reply}`,
      requiresPersonalResponse: !dealAgreed,
      personalPrompt: dealAgreed ? null : activePersonalPrompt,
      dealAgreed,
      pledgedVotes,
      leaderName: profile.leader,
      caucusName: profile.name
    };
  }

  // Case 3: Routine Direct 1-on-1 DM from user
  thinking = `[CAUCUS LEADER DIRECT MESSAGE REASONING — v4-pro]
Leader: ${profile.leader} (${profile.name}).
Sender: ${pState.politician_title} ${pState.politician_name} (Direct 1-on-1).
Message: "${incomingMessage}".

Strategic Context:
- ${pState.politician_name} reached out personally. Respects the stature of our caucus.
- Current Chamber Standing: Party Loyalty ${pState.party_loyalty}%, Political Capital: ${pState.political_capital} pts.
- Core Faction Goals: ${profile.priorities.join(', ')}. Red lines: ${profile.red_lines.join(', ')}.`;

  reply = `${pState.politician_name},

Good to hear from you directly. You know where the ${profile.name} stands: we care first and foremost about **${profile.priorities.map(p => p.replace('_', ' ')).join(', ')}**.

If your office is advancing legislation that respects our red lines and brings real resources to our communities, our ${profile.member_count} members are prepared to do business. What specific statutory language or committee markup are you proposing?`;

  return {
    content: `<think>\n${thinking}\n</think>\n\n${reply}`,
    requiresPersonalResponse: false,
    personalPrompt: null,
    dealAgreed: false,
    pledgedVotes: 0,
    leaderName: profile.leader,
    caucusName: profile.name
  };
}

module.exports = {
  CAUCUS_LEADER_PROFILES,
  detectCaucusOutreachDirective,
  generateCaucusLeaderAIResponse
};
