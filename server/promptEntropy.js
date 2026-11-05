const crypto = require('crypto');

// Pool of diverse analytical & rhetorical lenses for macroeconomic & political reporting
const RHETORICAL_LENSES = [
  'Forensic balance-sheet and commercial debt covenant scrutiny',
  'Ground-level supply chain logistics and warehouse inventory carrying costs',
  'Institutional pension fund asset-liability duration matching and yield hunt',
  'Suburban middle-class mortgage refinancing stress and grocery basket elasticity',
  'Sovereign bond syndicate auctions and dealer distribution friction',
  'Regional manufacturing capital expenditure hurdles and factory shift adjustments',
  'Frontline district voter mood and town hall constituent pushback',
  'Corporate earnings multiple compression and debt service coverage ratios',
  'Municipal bond financing for local utility and transit infrastructure',
  'Cross-border trade currency hedging and import invoice margins',
  'Small-business line-of-credit renewals and bank lending standards',
  'Organized labor union wage bargaining demands versus corporate margin targets',
  'Commercial real estate refinancing cliffs and tenant leasing concessions',
  'Consumer sentiment divergence between high-income wealth and hourly wage earners',
  'Parliamentary select committee subpoena friction and legislative hearing heat',
  'Backbench factional divisions and floor whip margin vulnerabilities'
];

const NARRATIVE_CADENCES = [
  'Open with an authentic scene from a trading desk or committee hallway, pivot to the indicator telemetry, and close with a sharp market quote.',
  'Lead with a historical parallel to a previous decade, contrast it against today’s figures, and conclude on stakeholder stakes.',
  'Contrast institutional corporate confidence against working-class household realities using specific numerical differentials.',
  'Frame the story through the acute dilemma facing the policymaker between mandate targets and political fallout.',
  'Trace the transmission mechanism from policy benchmark adjustments through commercial lending to everyday consumer purchasing power.'
];

const STYLISTIC_VOCABULARY_TONES = [
  'Austere, measured, institutional clarity',
  'Fast-paced financial wire urgency',
  'Investigative, questioning political commentary',
  'Pragmatic, industrial bread-and-butter realism',
  'Sharp, cynical Wall Street trading desk color'
];

const LEXICAL_KEYSTONES = [
  ['friction', 'trajectory', 'imperative'],
  ['asymmetry', 'resilience', 'compounding'],
  ['headwind', 'clearing', 'prudence'],
  ['tenacity', 'credibility', 'divergence'],
  ['momentum', 'liquidity', 'anchor'],
  ['drag', 'solvency', 'equilibrium'],
  ['recalibration', 'threshold', 'velocity']
];

/**
 * Generates randomized preprompt entropy instructions.
 * Guarantees that the system/preprompt pattern is never the same between requests.
 */
function generateRandomPrepromptEntropy(domain = 'macro_finance') {
  const nonce = crypto.randomBytes(4).toString('hex');
  const seed = Math.floor(100000 + Math.random() * 900000);
  const lens = RHETORICAL_LENSES[Math.floor(Math.random() * RHETORICAL_LENSES.length)];
  const cadence = NARRATIVE_CADENCES[Math.floor(Math.random() * NARRATIVE_CADENCES.length)];
  const style = STYLISTIC_VOCABULARY_TONES[Math.floor(Math.random() * STYLISTIC_VOCABULARY_TONES.length)];
  const keystones = LEXICAL_KEYSTONES[Math.floor(Math.random() * LEXICAL_KEYSTONES.length)];

  return `
[DYNAMIC PREPROMPT ENTROPY INJECTION: Nonce 0x${nonce} | Seed #${seed}]
- RHETORICAL LENS: ${lens}
- NARRATIVE CADENCE: ${cadence}
- STYLISTIC TONE: ${style}
- THEMATIC ANCHORS: "${keystones[0]}", "${keystones[1]}", "${keystones[2]}"
- THINKING DIRECTIVE: You MUST first write a <think>...</think> internal reasoning block analyzing the live numbers and planning the narrative arc before drafting the final output.
- WORD COUNT CONSTRAINT: The final story body MUST be strictly between 100 and 120 words.
`.trim();
}

/**
 * Trims or expands story text so its word count is strictly capped between minWords (100) and maxWords (120).
 */
function enforceWordCount(text, minWords = 100, maxWords = 120) {
  if (!text) return '';

  // Clean extra markdown or think tags if present
  let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Split into words
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length <= maxWords && words.length >= minWords) {
    return clean;
  }

  // If too long (> maxWords), trim cleanly to sentence boundary within 120 words
  if (words.length > maxWords) {
    const candidateWords = words.slice(0, maxWords);
    const joined = candidateWords.join(' ');
    
    // Find the last period, exclamation mark, or question mark
    const lastPunct = Math.max(
      joined.lastIndexOf('.'),
      joined.lastIndexOf('!'),
      joined.lastIndexOf('?')
    );

    // If there is a clean sentence ending after word 85, slice there; otherwise end with period
    if (lastPunct > 0 && joined.substring(0, lastPunct + 1).split(/\s+/).length >= minWords - 10) {
      return joined.substring(0, lastPunct + 1);
    }

    // Otherwise slice cleanly at maxWords and terminate
    return candidateWords.join(' ').replace(/[,\s;:-]+$/, '') + '.';
  }

  // If too short (< minWords), enrich with authentic analytical padding
  if (words.length < minWords) {
    const needed = minWords - words.length;
    const paddingPool = [
      'Market participants continue to closely analyze how ongoing fiscal commitments and borrowing costs ripple across both corporate balance sheets and constituent kitchen-table budgets.',
      'Committee leaders and economic analysts emphasize that the interaction between price stability and employment will dictate legislative sentiment well into the coming financial quarter.',
      'As trading desks recalibrate forward expectations, district representatives are bracing for sustained scrutiny from voters demanding measurable stability amidst broader structural shifts in the macro backdrop.'
    ];

    let enriched = clean;
    for (const pad of paddingPool) {
      if (enriched.split(/\s+/).filter(Boolean).length >= minWords) break;
      enriched += ' ' + pad;
    }

    // Now re-verify it does not exceed maxWords
    const reWords = enriched.split(/\s+/).filter(Boolean);
    if (reWords.length > maxWords) {
      return reWords.slice(0, maxWords).join(' ').replace(/[,\s;:-]+$/, '') + '.';
    }
    return enriched;
  }

  return clean;
}

module.exports = {
  generateRandomPrepromptEntropy,
  enforceWordCount,
  RHETORICAL_LENSES,
  NARRATIVE_CADENCES
};
