const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function post(path, data) {
  return request({
    hostname: 'localhost',
    port: 3001,
    path,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, data);
}

function get(path) {
  return request({
    hostname: 'localhost',
    port: 3001,
    path,
    method: 'GET'
  });
}

async function runTests() {
  console.log('--- STARTING ECONOMY SCALE & VOLATILITY TEST SUITE ---');

  // Test 1: Create Small Emerging Economy with Hard Condition & Extreme Volatility
  console.log('\n1. Creating Small Emerging Economy session...');
  const res1 = await post('/api/game/new', {
    user_id: 'user_guest_default',
    chair_name: 'Dr. Santiago Valdes',
    play_mode: 'first_person',
    economy_type: 'small_emerging',
    starting_condition: 'hard',
    volatility: 'extreme',
    skip_news: true
  });

  if (res1.status !== 200) {
    throw new Error(`Failed to create session: ${JSON.stringify(res1.data)}`);
  }

  const session1 = res1.data.session;
  console.log('Session created:', session1.id);
  console.log('Economy Type:', session1.economy_type);
  console.log('Starting Condition:', session1.starting_condition);
  console.log('Volatility:', session1.volatility);

  const econ1 = session1.economic_state;
  console.log('Initial Telemetry:', {
    foreign_benchmark: econ1.foreign_benchmark_rate,
    sovereign_spread: econ1.sovereign_risk_spread,
    fx_reserves: econ1.fx_reserves_billions,
    capital_flow: econ1.capital_flow_momentum,
    currency_index: econ1.currency_index
  });

  if (session1.economy_type !== 'small_emerging') throw new Error('Expected small_emerging');
  if (session1.starting_condition !== 'hard') throw new Error('Expected hard');
  if (session1.volatility !== 'extreme') throw new Error('Expected extreme');
  if (econ1.fx_reserves_billions === undefined || econ1.fx_reserves_billions <= 0) {
    throw new Error('Expected positive fx_reserves_billions');
  }
  if (econ1.sovereign_risk_spread === undefined || econ1.sovereign_risk_spread < 100) {
    throw new Error('Expected sovereign_risk_spread to reflect emerging market spread');
  }

  // Test 2: Execute FX Intervention - Defend Currency
  console.log('\n2. Testing FX Intervention (defend_currency)...');
  const prevReserves = econ1.fx_reserves_billions;
  const prevCurrency = econ1.currency_index;

  const fxRes = await post(`/api/game/${session1.id}/fx-intervention`, {
    action_type: 'defend_currency',
    amount_billions: 10
  });

  console.log('FX Intervention Response:', fxRes.data.message);
  console.log('New Reserves:', fxRes.data.fx_reserves_billions);
  console.log('New Currency Index:', fxRes.data.currency_index);

  if (fxRes.data.fx_reserves_billions >= prevReserves) {
    throw new Error('Defending currency should reduce reserves');
  }
  if (fxRes.data.currency_index <= prevCurrency) {
    throw new Error('Defending currency should boost/support currency index');
  }

  // Test 3: Advance Turn with Guidance
  console.log('\n3. Advancing Month with Open Economy Guidance...');
  const advanceRes = await post(`/api/game/${session1.id}/action`, {
    action_type: 'guidance',
    guidance_text: 'Central bank signals foreign exchange stability vigilance.',
    skip_news: true
  });

  const nextEcon = advanceRes.data.economic_state;
  console.log('Month 2 Telemetry:', {
    month: advanceRes.data.current_month,
    foreign_benchmark: nextEcon.foreign_benchmark_rate,
    sovereign_spread: nextEcon.sovereign_risk_spread,
    fx_reserves: nextEcon.fx_reserves_billions,
    capital_flow: nextEcon.capital_flow_momentum
  });

  if (nextEcon.fx_reserves_billions === undefined) {
    throw new Error('Reserves should persist across turns');
  }

  // Test 4: Middle Advanced Economy with Easy Condition & Low Volatility
  console.log('\n4. Creating Middle Advanced Economy session...');
  const res2 = await post('/api/game/new', {
    user_id: 'user_guest_default',
    chair_name: 'Gov. Astrid Lindqvist',
    play_mode: 'first_person',
    economy_type: 'middle_advanced',
    starting_condition: 'easy',
    volatility: 'low',
    skip_news: true
  });
  const session2 = res2.data.session;
  console.log('Middle Advanced session created:', session2.id, {
    economy_type: session2.economy_type,
    volatility: session2.volatility,
    sovereign_spread: session2.economic_state.sovereign_risk_spread,
    reserves: session2.economic_state.fx_reserves_billions
  });

  if (session2.economy_type !== 'middle_advanced') throw new Error('Expected middle_advanced');
  if (session2.economic_state.sovereign_risk_spread > 100) {
    throw new Error('Middle advanced sovereign risk spread should be moderate/low');
  }

  // Test 5: Backwards compatibility - Legacy new request
  console.log('\n5. Testing Legacy New Session Request (difficulty only)...');
  const resLegacy = await post('/api/game/new', {
    user_id: 'user_guest_default',
    chair_name: 'Sir Arthur Sterling',
    play_mode: 'first_person',
    difficulty: 'normal',
    skip_news: true
  });
  const sessionLegacy = resLegacy.data.session;
  console.log('Legacy session created:', sessionLegacy.id, {
    economy_type: sessionLegacy.economy_type,
    difficulty: sessionLegacy.difficulty,
    starting_condition: sessionLegacy.starting_condition,
    volatility: sessionLegacy.volatility
  });
  if (sessionLegacy.economy_type !== 'large_hegemon') {
    throw new Error('Legacy session should default to large_hegemon');
  }

  // Test 6: Verify list endpoint
  console.log('\n6. Checking Simulations List Endpoint...');
  const listRes = await get('/api/game/simulations/list');
  const found = listRes.data.simulations.find(s => s.id === session1.id);
  if (!found) throw new Error('Session1 not found in simulations list');
  console.log('List item verify:', {
    id: found.id,
    economy_type: found.economy_type,
    starting_condition: found.starting_condition,
    volatility: found.volatility
  });
  if (found.economy_type !== 'small_emerging' || found.volatility !== 'extreme') {
    throw new Error('List item does not carry economy_type or volatility');
  }

  console.log('\nALL SCALE AND VOLATILITY TESTS PASSED SUCCESSFULLY! ✓');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
