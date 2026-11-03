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
  console.log('--- TESTING PARLIAMENT CONTEXTUAL QUESTIONS (RATE = 3.00%) ---');

  // 1. Create a session in Normal difficulty (starts at ~4.25% rate, debt-to-GDP at ~106%)
  const startRes = await post('/api/game/new', {
    user_id: 'user_guest_default',
    chair_name: 'Gov. Helena Vance',
    play_mode: 'first_person',
    difficulty: 'normal',
    skip_news: true
  });
  const session = startRes.data.session;
  console.log('Session created:', session.id, 'Initial Rate:', session.economic_state.interest_rate);

  // 2. Simulate cutting rates down to 3.00% using admin tweaker
  await post('/api/admin/tweak-economy', {
    session_id: session.id,
    variable: 'interest_rate',
    value: 3.00
  });
  await post('/api/admin/tweak-economy', {
    session_id: session.id,
    variable: 'bank_lending_rate',
    value: 5.25
  });
  await post('/api/admin/tweak-economy', {
    session_id: session.id,
    variable: 'debt_to_gdp',
    value: 110.4
  });
  await post('/api/admin/tweak-economy', {
    session_id: session.id,
    variable: 'fiscal_deficit',
    value: -3.12
  });

  // 3. Fetch Parliamentary Hearing questions at 3.00% rate
  const hearingRes = await get(`/api/game/${session.id}/parliament-hearing`);
  const questions = hearingRes.data.hearing.questions;
  console.log(`\nFetched ${questions.length} questions for 3.00% rate with 110.4% debt:`);

  questions.forEach((q, idx) => {
    console.log(`\nQ${idx + 1}: [${q.interrogator}]`);
    console.log(`   "${q.question}"`);
  });

  // Verify that NONE of the questions claim that the central bank is hiking or imposing "high interest rates"
  for (const q of questions) {
    if (q.question.includes('Are your high interest rates threatening national insolvency')) {
      throw new Error(`FAIL: Found inappropriate question for 3.00% rate: "${q.question}"`);
    }
    if (q.question.includes('Every 100 basis point rate increase adds tens of billions')) {
      throw new Error(`FAIL: Question claims rate increases when rates are at 3.00%: "${q.question}"`);
    }
  }

  // If debt question is present, verify it mentions rates lowered / fiscal dominance
  const debtQ = questions.find(q => q.id === 'q_sovereign_debt_and_fiscal_cliff');
  if (debtQ) {
    console.log('\nDebt Question Context Verification:');
    console.log('Found:', debtQ.question);
    if (!debtQ.question.includes('lowered policy rates') && !debtQ.question.includes('fiscal dominance')) {
      throw new Error('Debt question should reference lowered policy rates or fiscal dominance at 3.00%');
    }
    console.log('✓ SUCCESS: Debt question accurately reflects the 3.00% rate environment and rate easing!');
  } else {
    console.log('Debt question was rotated out for other relevant low-rate questions (savers/growth/housing).');
  }

  // 4. Now test High Rate regime (5.50%)
  console.log('\n--- TESTING PARLIAMENT QUESTIONS IN HIGH RATE REGIME (RATE = 5.50%) ---');
  await post('/api/admin/tweak-economy', {
    session_id: session.id,
    variable: 'interest_rate',
    value: 5.50
  });
  await post('/api/admin/tweak-economy', {
    session_id: session.id,
    variable: 'bank_lending_rate',
    value: 7.75
  });

  const highHearingRes = await get(`/api/game/${session.id}/parliament-hearing`);
  const highQuestions = highHearingRes.data.hearing.questions;
  console.log(`\nFetched ${highQuestions.length} questions for 5.50% rate:`);
  highQuestions.forEach((q, idx) => {
    console.log(`\nQ${idx + 1}: [${q.interrogator}]`);
    console.log(`   "${q.question}"`);
  });

  const highDebtQ = highQuestions.find(q => q.id === 'q_sovereign_debt_and_fiscal_cliff');
  if (highDebtQ) {
    if (!highDebtQ.question.includes('elevated 5.5% policy rate') && !highDebtQ.question.includes('high interest rates')) {
      throw new Error('In high rate regime, debt question should reference elevated rates');
    }
    console.log('✓ SUCCESS: In high rate regime, debt question accurately references elevated rates!');
  }

  console.log('\nALL PARLIAMENT CONTEXTUAL TESTS PASSED! ✓');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
