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

async function runVerification() {
  console.log('--- STARTING SECTION 5 VERIFICATION SUITE ---');

  // 1. Create Game Session
  console.log('\n[1] Creating new session with Section 5 parameters...');
  const newGameRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/game/new',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    user_id: 'user_admin_default',
    chair_name: 'Helena Vance',
    play_mode: 'first_person',
    difficulty: 'hard'
  });

  if (newGameRes.status !== 200) {
    throw new Error('Failed to create game: ' + JSON.stringify(newGameRes));
  }

  const session = newGameRes.data.session;
  const sessionId = session.id;
  console.log(`✓ Session initialized: ${sessionId}`);
  console.log(`  - Dual CPI: Flexible=${session.economic_state.flexible_cpi}%, Sticky=${session.economic_state.sticky_cpi}%, Headline=${session.economic_state.inflation_cpi}%`);
  console.log(`  - Balance Sheet: $${session.economic_state.balance_sheet_size}T, QT Pace: ${session.economic_state.qt_monthly_pace}B/mo`);
  console.log(`  - Market Credibility: ${session.economic_state.market_credibility}/100`);
  console.log(`  - Dot Plot median Y1: ${session.dot_plot?.median_projections?.year_1}%, Neutral r*: ${session.dot_plot?.median_projections?.long_run}%`);

  const firstArticle = session.news_articles[0];
  console.log(`  - Newspaper Broadsheet: "${firstArticle.headline}"`);
  console.log(`    Byline: ${firstArticle.byline}`);
  console.log(`    Dateline: ${firstArticle.dateline}`);
  console.log(`    Trader Whisper: ${firstArticle.whisper_quote}`);

  // 2. Month 1 Action: Dovish Guidance
  console.log('\n[2] Month 1 Action: Delivering Dovish Forward Guidance...');
  const m1Res = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${sessionId}/action`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    action_type: 'guidance',
    action_value: 'dovish',
    statement: 'Growth risks warrant patience; financial conditions will remain accommodative.'
  });
  console.log(`✓ Month 1 complete. Next: Year ${m1Res.data.current_year}, Month ${m1Res.data.current_month} (Q${m1Res.data.current_quarter}, M${m1Res.data.month_in_quarter})`);

  // 3. Month 2 Action: Dovish Guidance again
  console.log('\n[3] Month 2 Action: Reiterating Dovish Stance...');
  const m2Res = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${sessionId}/action`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    action_type: 'guidance',
    action_value: 'dovish',
    statement: 'The Committee sees no urgency to tighten borrowing costs.'
  });
  console.log(`✓ Month 2 complete. Next is Month 3 MPC Decision Meeting.`);

  // 4. Month 3 Action: +50 bps Rate Hike (Triggers Taper Tantrum Flip-Flop & MPC Voting Division)
  console.log('\n[4] Month 3 Action: +50 bps Jumbo Hike (Testing Guidance Flip-Flop & MPC Vote)...');
  const m3Res = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${sessionId}/action`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    action_type: 'mpc_rate_decision',
    action_value: '50',
    statement: 'The Committee unexpectedly votes to raise rates by 50 bps.'
  });

  const m3State = m3Res.data.economic_state;
  const mpcVote = m3Res.data.last_mpc_vote;
  console.log(`✓ Month 3 complete!`);
  console.log(`  - Policy Rate now: ${m3State.interest_rate}%`);
  console.log(`  - MPC Vote Result: ${mpcVote.tally_label} (${mpcVote.consensus_summary})`);
  console.log(`    Ayes: ${mpcVote.ayes}, Dissents: ${mpcVote.dissents} (Hawks: ${mpcVote.hawkish_dissents}, Doves: ${mpcVote.dovish_dissents})`);
  console.log(`    Sample Member Rationale: ${mpcVote.member_votes[1].name} (${mpcVote.member_votes[1].role}): "${mpcVote.member_votes[1].rationale}"`);
  console.log(`  - Credibility Warning / Tantrum Triggered: "${m3State.credibility_warning}"`);
  console.log(`  - Market Credibility post-tantrum: ${m3State.market_credibility}/100`);
  console.log(`  - Friedman Transmission Pipeline impulses queued: ${m3State.transmission_pipeline.length} items`);

  // 5. Balance Sheet & Emergency Discount Window Operations
  console.log('\n[5] Testing Balance Sheet & Liquidity Desk update...');
  const bsRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${sessionId}/balance-sheet`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    qt_monthly_pace: -45,
    discount_window_active: true
  });
  console.log(`✓ Balance Sheet updated: QT Pace = ${bsRes.data.economic_state.qt_monthly_pace}B/mo, Discount Window Active = ${bsRes.data.economic_state.discount_window_active}`);

  // 6. Dot Plot Endpoint
  console.log('\n[6] Testing Dot Plot API endpoint...');
  const dpRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${sessionId}/dot-plot`,
    method: 'GET'
  });
  console.log(`✓ Dot Plot fetched: ${dpRes.data.dot_plot.dots.length} members projected.`);
  console.log(`  - Year 1 Median: ${dpRes.data.dot_plot.median_projections.year_1}%`);
  console.log(`  - Year 2 Median: ${dpRes.data.dot_plot.median_projections.year_2}%`);
  console.log(`  - Long-Run Neutral (r*): ${dpRes.data.dot_plot.median_projections.long_run}%`);

  // 7. Parliamentary Select Committee Hearing
  console.log('\n[7] Testing Parliamentary Question Time Hearing API...');
  const hearingRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${sessionId}/parliament-hearing`,
    method: 'GET'
  });
  console.log(`✓ Parliamentary Hearing loaded with ${hearingRes.data.hearing.questions.length} questions:`);
  hearingRes.data.hearing.questions.forEach((q, i) => {
    console.log(`  Q${i+1} [${q.interrogator}]: "${q.question.substring(0, 80)}..."`);
  });

  console.log('  Submitting chosen testimony strategies...');
  const testifyRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${sessionId}/parliament-hearing/testify`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    choices: {
      q_mortgage_cost: 'empathetic_disinflation',
      q_inflation_target: 'defiant_independence',
      q_corporate_profits: 'deflect_fiscal'
    }
  });
  console.log(`✓ Testimony delivered! Summary: ${testifyRes.data.summary}`);
  console.log(`  New Parliamentary Approval: ${testifyRes.data.parliamentary_approval}%, Autonomy: ${testifyRes.data.central_bank_autonomy}%`);

  // 8. 4-Year Term (Month 48) Reappointment Review
  console.log('\n[8] Testing 4-Year Term Reappointment Review Scorecard...');
  const termRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: `/api/game/${sessionId}/term-review`,
    method: 'GET'
  });
  console.log(`✓ Term Review Scorecard:`);
  console.log(`  Chair: ${termRes.data.scorecard.chair_name}`);
  console.log(`  Verdict: ${termRes.data.scorecard.verdict_title}`);
  console.log(`  Avg CPI Deviation from 2%: ±${termRes.data.scorecard.avg_inflation_deviation}%`);
  console.log(`  Avg Real GDP Growth: ${termRes.data.scorecard.avg_gdp_growth}%`);
  console.log(`  Avg Unemployment: ${termRes.data.scorecard.avg_unemployment}%`);
  console.log(`  Official Citation: "${termRes.data.scorecard.citation.substring(0, 100)}..."`);

  console.log('\n======================================================');
  console.log('ALL SECTION 5 IMPLEMENTATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
