const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testRegularUserFeatures() {
  console.log('--- TESTING REGULAR USER VIEW API & FLOWS ---');

  // 1. Fetch simulation list
  console.log('\n[1] Fetching simulation history for regular users...');
  const listRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/game/simulations/list',
    method: 'GET'
  });

  if (listRes.status !== 200) {
    throw new Error('Failed to fetch simulations list: ' + JSON.stringify(listRes));
  }
  console.log(`✓ Fetched ${listRes.data.simulations.length} existing simulations.`);
  if (listRes.data.simulations.length > 0) {
    const first = listRes.data.simulations[0];
    console.log(`  Sample: ID=${first.id}, Chair=${first.chair_name}, Type=${first.play_mode}, Status=${first.status}, Months=${first.total_months_elapsed}`);
    console.log(`  Results: Rate=${first.results.interest_rate}%, CPI=${first.results.inflation_cpi}%, ParlApproval=${first.results.parliamentary_approval}%`);
  }

  // 2. Start new simulation as a regular user
  console.log('\n[2] Starting new simulation: God Mode, Hard Scenario, Chair: Arthur Finch...');
  const startRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/game/new',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    user_id: 'user_guest_default',
    chair_name: 'Arthur Finch',
    play_mode: 'god_mode',
    difficulty: 'hard'
  });

  if (startRes.status !== 200) {
    throw new Error('Failed to start new simulation: ' + JSON.stringify(startRes));
  }
  const newSimId = startRes.data.session.id;
  console.log(`✓ New simulation created: ${newSimId}`);

  // 3. Run a batch simulation of 12 months for this simulation
  console.log('\n[3] Running automated 12-month simulation batch...');
  const simBatchRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${newSimId}/simulate-months`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    months: 12
  });

  if (simBatchRes.status !== 200) {
    throw new Error('Failed to simulate batch: ' + JSON.stringify(simBatchRes));
  }
  console.log(`✓ Simulated 12 months! New Year=${simBatchRes.data.current_year}, Month=${simBatchRes.data.current_month}, Status=${simBatchRes.data.status}`);
  console.log(`  End of Year 1: Policy Rate=${simBatchRes.data.economic_state.interest_rate}%, CPI=${simBatchRes.data.economic_state.inflation_cpi}%`);

  // 4. Check that simulation list now includes this simulation with updated results
  console.log('\n[4] Verifying updated results in simulation list...');
  const updatedListRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/game/simulations/list',
    method: 'GET'
  });
  const found = updatedListRes.data.simulations.find(s => s.id === newSimId);
  if (!found) {
    throw new Error(`Created simulation ${newSimId} not found in simulations list!`);
  }
  console.log(`✓ Found simulation ${newSimId} in results:`);
  console.log(`  Chair: ${found.chair_name}, Duration: ${found.total_months_elapsed} months, Rate: ${found.results.interest_rate}%, CPI: ${found.results.inflation_cpi}%`);

  // 5. Delete simulation
  console.log('\n[5] Testing simulation deletion...');
  const delRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${newSimId}`,
    method: 'DELETE'
  });
  if (delRes.status !== 200) {
    throw new Error('Failed to delete simulation: ' + JSON.stringify(delRes));
  }
  console.log(`✓ Successfully deleted simulation ${newSimId}`);

  console.log('\n======================================================');
  console.log('REGULAR USER VIEW BACKEND VERIFICATION COMPLETE: 100% PASS');
  console.log('======================================================\n');
}

testRegularUserFeatures().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
