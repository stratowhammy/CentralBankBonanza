const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/political', require('./server/routes/political'));
app.use('/api/game', require('./server/routes/game'));

const PORT = 3999;
const server = app.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);

  try {
    const BASE = `http://localhost:${PORT}/api/political`;

    // 1. Check Events Catalog
    console.log("Checking events catalog...");
    const catRes = await fetch(`${BASE}/events-catalog`);
    const cat = await catRes.json();
    console.log(`Events catalog returned ${cat.events.length} events (${cat.metadata.positive_events} positive, ${cat.metadata.negative_events} negative)`);
    if (cat.events.length !== 50) throw new Error("Catalog must have 50 events");

    // 2. Create New Political Career
    console.log("Creating new political session...");
    const createRes = await fetch(`${BASE}/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'user_guest_default',
        politician_name: 'Dame Julianne Sterling MP',
        system_type: 'parliamentary',
        party_name: 'Democratic Alliance',
        district_name: 'Highland Greenshire'
      })
    });
    const { session } = await createRes.json();
    console.log(`Session created: ID=${session.id}, Title=${session.political_state.politician_title}`);
    console.log(`Starter Bills: ${session.bills.length}`);

    // 3. Advisor Chat: Draft Legislation
    console.log("Testing advisor drafting directive...");
    const chatRes = await fetch(`${BASE}/session/${session.id}/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Please draft a comprehensive statute on Clean Energy Grid Modernization"
      })
    });
    const chatData = await chatRes.json();
    console.log("Advisor response contains <think>:", chatData.response.includes('<think>'));
    console.log("New drafted bill created ID:", chatData.drafted_bill_id);
    if (!chatData.drafted_bill_id) throw new Error("Expected drafted bill to be created");

    // 4. Whip Count on the new bill
    console.log("Testing whip count calculation...");
    const whipRes = await fetch(`${BASE}/session/${session.id}/bill/${chatData.drafted_bill_id}/whip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capital_spent: 10 })
    });
    const whipData = await whipRes.json();
    console.log(`Whip count: ${whipData.whip.total_ayes} Ayes vs ${whipData.whip.total_nays} Nays`);

    // 5. Committee Markup
    console.log("Testing committee markup...");
    const commRes = await fetch(`${BASE}/session/${session.id}/bill/${chatData.drafted_bill_id}/committee`, {
      method: 'POST'
    });
    const commData = await commRes.json();
    console.log(`Committee markup: ${commData.committee_result.message}`);

    // 6. Floor Division Vote
    console.log("Testing floor division vote...");
    const floorRes = await fetch(`${BASE}/session/${session.id}/bill/${chatData.drafted_bill_id}/floor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capital_spent: 15 })
    });
    const floorData = await floorRes.json();
    console.log(`Floor vote result: ${floorData.message}`);

    // 7. Monthly Action Advance
    console.log("Testing monthly primary action advancement...");
    const actionRes = await fetch(`${BASE}/session/${session.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_type: 'constituent_townhall',
        action_details: 'Met with rural farmers and local union reps'
      })
    });
    const actionData = await actionRes.json();
    console.log(`Turn advanced: Year ${actionData.session.current_year}, Month ${actionData.session.current_month}`);
    console.log(`District Approval: ${actionData.session.political_state.district_approval}%`);
    console.log(`Months to election: ${actionData.session.political_state.months_to_election}`);

    console.log("\n========================================================");
    console.log("🎉 ALL POLITICAL SIMULATOR INTEGRATION TESTS PASSED!");
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});
