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

async function runTests() {
  console.log('--- TESTING PARLIAMENTARY HEARING ENHANCEMENTS ---\n');

  // 1. Create a game session
  console.log('[1] Creating new session (Normal difficulty)...');
  const sessionRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/game/new',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    user_id: 'user_guest_default',
    chair_name: 'Arthur Volcker',
    play_mode: 'first_person',
    difficulty: 'normal',
    skip_news: true
  });

  const session = sessionRes.data.session;
  console.log(`✓ Session created: ${session.id} (Year: ${session.current_year}, Month: ${session.current_month})`);

  // 2. Test Question Variation
  console.log('\n[2] Testing Question Variation across different economic conditions...');
  
  // Baseline questions
  const hearingRes1 = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}/parliament-hearing`,
    method: 'GET'
  });
  console.log(`✓ Baseline hearing fetched: ${hearingRes1.data.hearing.questions.length} questions`);
  hearingRes1.data.hearing.questions.forEach((q, idx) => {
    console.log(`   Q${idx + 1}: [${q.interrogator}]`);
    console.log(`      "${q.question.substring(0, 110)}..."`);
  });

  // Tweak economy to simulate housing & mortgage crisis + yield curve inversion
  console.log('\n   Injecting high mortgage rate (7.8%) and inverted 2s10s yield curve...');
  await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/admin/tweak-economy',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    session_id: session.id,
    variable: 'bank_lending_rate',
    value: 7.85
  });
  await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/admin/tweak-economy',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    session_id: session.id,
    variable: 'bond_yield_2y',
    value: 5.40
  });
  await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/admin/tweak-economy',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    session_id: session.id,
    variable: 'bond_yield_10y',
    value: 4.60
  });

  const hearingRes2 = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}/parliament-hearing`,
    method: 'GET'
  });
  console.log(`\n✓ New contextual questions generated for tweaked economy:`);
  hearingRes2.data.hearing.questions.forEach((q, idx) => {
    console.log(`   Q${idx + 1}: [${q.interrogator}]`);
    console.log(`      "${q.question.substring(0, 110)}..."`);
  });

  const hasMortgageOrYield = hearingRes2.data.hearing.questions.some(q => 
    q.id === 'q_housing_and_mortgage_crisis' || 
    q.id === 'q_yield_curve_inversion_and_bond_panic' || 
    q.id === 'q_small_business_credit_squeeze'
  );
  if (!hasMortgageOrYield) {
    throw new Error('Expected dynamic questions to prioritize housing or yield curve issues!');
  }
  console.log('✓ Questions dynamically varied and matched the acute economic stressors!');

  // 3. Test Answering and ensuring questions are NO LONGER VISIBLE afterwards
  console.log('\n[3] Testing Testimony Submission and verifying questions disappear...');
  const choices = {};
  hearingRes2.data.hearing.questions.forEach(q => {
    choices[q.id] = q.strategies[0].key;
  });

  const testifyRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}/parliament-hearing/testify`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { choices });

  console.log(`✓ Testimony submitted! Status: ${testifyRes.status}`);
  console.log(`   Summary: ${testifyRes.data.summary}`);
  console.log(`   Updated Parliamentary Approval: ${testifyRes.data.parliamentary_approval}%`);

  // Re-fetch hearing to verify questions are hidden
  const hearingResAfter = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}/parliament-hearing`,
    method: 'GET'
  });
  console.log(`✓ Re-fetched hearing status: completed=${hearingResAfter.data.hearing.completed}`);
  console.log(`   Visible questions count: ${hearingResAfter.data.hearing.questions.length}`);
  if (hearingResAfter.data.hearing.questions.length !== 0) {
    throw new Error('FAILED: Questions should no longer be visible after answering!');
  }
  if (!hearingResAfter.data.hearing.completed) {
    throw new Error('FAILED: Hearing should be marked completed after answering!');
  }
  console.log('✓ SUCCESS: Questions are NO LONGER visible once answered!');

  // 4. Test Advance Enforcement (Summons in the round)
  console.log('\n[4] Testing Hearing Attendance Enforcement when advancing round...');
  
  // Advance to month 2, 3, 4, 5, 6
  // In month 6, a statutory hearing is scheduled
  console.log('   Advancing to Month 6 (Semi-annual statutory hearing month)...');
  for (let m = session.current_month; m < 6; m++) {
    const monthInQ = ((m - 1) % 3) + 1;
    let actionPayload;
    if (monthInQ === 3) {
      actionPayload = { action_type: 'mpc_rate_decision', action_value: '0' };
    } else {
      actionPayload = { action_type: 'silence', action_value: '0' };
    }
    await request({
      hostname: 'localhost',
      port: 3001,
      path: `/api/game/${session.id}/action`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, actionPayload);
  }

  // Verify we are at Month 6 and hearing_eligible is true
  const month6SessionRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}`,
    method: 'GET'
  });
  const month6Session = month6SessionRes.data.session;
  console.log(`   Now at Month: ${month6Session.current_month}, Total Elapsed: ${month6Session.total_months_elapsed}`);
  console.log(`   Hearing Eligible: ${month6Session.hearing_eligible}`);
  if (!month6Session.hearing_eligible) {
    throw new Error('Expected Month 6 to have hearing_eligible = true');
  }

  // Attempt to advance turn in Month 6 WITHOUT attending or declining
  console.log('   Attempting to advance turn in Month 6 without attending hearing...');
  const advanceAttempt = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}/action`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    action_type: 'mpc_rate_decision',
    action_value: '0'
  });

  console.log(`   Advance attempt status: ${advanceAttempt.status} (Expected 400)`);
  console.log(`   Error message: "${advanceAttempt.data.message || advanceAttempt.data.error}"`);
  if (advanceAttempt.status !== 400 || advanceAttempt.data.error !== 'parliament_hearing_required') {
    throw new Error('FAILED: Expected turn advance to be blocked by mandatory parliamentary hearing summons!');
  }
  console.log('✓ SUCCESS: Advance was blocked because hearing attendance is required in the round!');

  // 5. Test Declining Hearing with Sanctions/Penalties
  console.log('\n[5] Testing Declining Hearing and applying institutional penalties...');
  const preDeclineApproval = month6Session.economic_state.parliamentary_approval;
  const preDeclineWarnings = month6Session.economic_state.warning_count || 0;
  console.log(`   Pre-decline approval: ${preDeclineApproval}%, warnings: ${preDeclineWarnings}`);

  const declineRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}/parliament-hearing/decline`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  console.log(`✓ Decline status: ${declineRes.status}`);
  console.log(`   Summary: ${declineRes.data.summary}`);
  console.log(`   New Parliamentary Approval: ${declineRes.data.parliamentary_approval}% (Delta: ${declineRes.data.penalties.parliamentary_approval_delta}%)`);
  console.log(`   New Warning Count: ${declineRes.data.penalties.new_warning_count}/3`);

  if (declineRes.data.penalties.parliamentary_approval_delta !== -18) {
    throw new Error('Expected -18% penalty on parliamentary approval');
  }
  if (declineRes.data.penalties.new_warning_count !== preDeclineWarnings + 1) {
    throw new Error('Expected warning count to increase by 1');
  }
  console.log('✓ Penalties correctly applied for declining the summons!');

  // Verify questions are not visible after declining
  const hearingResDeclined = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}/parliament-hearing`,
    method: 'GET'
  });
  console.log(`   Declined hearing questions count: ${hearingResDeclined.data.hearing.questions.length} (Expected 0)`);
  if (hearingResDeclined.data.hearing.questions.length !== 0) {
    throw new Error('Questions should not be visible after declining!');
  }

  // 6. Test advancing now that the hearing was declined/resolved
  console.log('\n[6] Verifying turn can now advance following declined hearing...');
  const advanceAfterDecline = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${session.id}/action`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    action_type: 'mpc_rate_decision',
    action_value: '0'
  });

  console.log(`✓ Advance after decline status: ${advanceAfterDecline.status}`);
  console.log(`   Advanced to Month: ${advanceAfterDecline.data.current_month}`);
  if (advanceAfterDecline.status !== 200 || advanceAfterDecline.data.current_month !== 7) {
    throw new Error('FAILED: Expected turn advance to succeed and reach Month 7 after resolving hearing!');
  }
  console.log('✓ SUCCESS: Turn advanced cleanly to Month 7!');

  console.log('\n======================================================');
  console.log('ALL PARLIAMENTARY HEARING TESTS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
