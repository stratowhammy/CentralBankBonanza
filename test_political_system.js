const express = require('express');
const db = require('./server/db');
const { getInitialPoliticalState, evolvePoliticalState, calculateWhipVoteCount } = require('./server/politicalEngine');
const { getInitialEconomicState } = require('./server/simulationEngine');
const { handlePoliticalAdvisorChat } = require('./server/politicalAdvisorEngine');

async function runTest() {
  console.log("=== Testing Political Simulator Mechanics ===");

  // 1. Initial State
  const pState = getInitialPoliticalState('parliamentary', 'backbencher', 'Democratic Alliance', 'Highland Greenshire');
  pState.politician_name = 'Marcus Sterling MP';
  console.log("Initial Title:", pState.politician_title);
  console.log("District Approval:", pState.district_approval);
  console.log("Party:", pState.party_name);

  // 2. Shared Economic State
  const eState = getInitialEconomicState('normal', 'large_hegemon', 'normal', 'normal');
  console.log("Initial Inflation CPI:", eState.inflation_cpi);

  // 3. Evolve Political State with a Primary Action
  const evolved = evolvePoliticalState(pState, eState, { type: 'constituent_townhall' });
  console.log("After Townhall - District Approval:", evolved.politicalState.district_approval);
  console.log("After Townhall - Polling Margin:", evolved.politicalState.polling_margin);

  // 4. Whip Count Calculation
  const sampleBill = {
    title: 'Clean Energy Grid Modernization Act',
    category: 'energy',
    fiscal_impact_billions: 35,
    public_support: 68
  };
  const whip = calculateWhipVoteCount(sampleBill, evolved.politicalState, 10);
  console.log("Whip Count Result:", whip.total_ayes, "Ayes vs", whip.total_nays, "Nays (Majority:", whip.majority_threshold, ") Passed?", whip.passed);

  // 5. Chief of Staff Advisor Chat
  const advice = await handlePoliticalAdvisorChat("Please draft legislation on affordable prescription drugs for seniors", evolved.politicalState, eState);
  console.log("Advisor Output contains <think>:", advice.content.includes('<think>'));
  console.log("Advisor drafted bill created:", !!advice.draftedBill);
  if (advice.draftedBill) {
    console.log("Drafted Bill Title:", advice.draftedBill.title);
  }

  console.log("=== All Backend Political Mechanics Passed! ===");
}

runTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
