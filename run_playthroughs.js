const http = require('http');

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, 'http://localhost:3001');
    const req = http.request(u, {
      method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runRound1() {
  console.log('=====================================================');
  console.log('--- ROUND 1: THE GRADUALIST TIGHTENER (HARD MODE) ---');
  console.log('=====================================================');

  const guest = await request('/api/auth/guest', 'POST');
  const userId = guest.data.user.id;

  const startRes = await request('/api/game/new', 'POST', {
    user_id: userId,
    chair_name: 'Chair Helena Vance',
    play_mode: 'first_person',
    difficulty: 'hard'
  });
  const session = startRes.data.session;
  console.log(`Initialized Session ${session.id} for ${session.chair_name}`);
  console.log(`Starting State: Rate=${session.economic_state.interest_rate}%, CPI=${session.economic_state.inflation_cpi}%, GDP=${session.economic_state.gdp_growth}%, Unemp=${session.economic_state.unemployment_rate}%, JobSecurity=${session.economic_state.job_security}%`);

  const round1Log = [];

  // Month 1: Hawkish guidance
  console.log('\n[Year 1, Month 1] Delivering Hawkish Forward Guidance...');
  const m1 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'guidance',
    action_value: 'hawkish',
    statement: 'The Committee observes persistent service inflation and stands prepared to adjust the policy rate upward.'
  });
  round1Log.push({ month: 1, action: 'Hawkish Guidance', state: m1.data.economic_state, articles: m1.data.news_articles });

  // Month 2: Silence
  console.log('[Year 1, Month 2] Choosing Silence (Say Nothing)...');
  const m2 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'silence',
    action_value: '0',
    statement: 'No public statement issued.'
  });
  round1Log.push({ month: 2, action: 'Silence', state: m2.data.economic_state, articles: m2.data.news_articles });

  // Month 3: MPC Decision (+25 bps)
  console.log('[Year 1, Month 3] MPC Rate Decision: +25 bps hike...');
  const m3 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'mpc_rate_decision',
    action_value: '25',
    statement: 'The Committee voted to raise the benchmark rate by 25 basis points to 4.50%.'
  });
  round1Log.push({ month: 3, action: '+25 bps hike', state: m3.data.economic_state, articles: m3.data.news_articles });

  // Month 4: Advisor Chat & Month 4 Guidance
  console.log('[Year 1, Month 4] Consulting Chief of Staff...');
  const chat1 = await request('/api/advisor/chat', 'POST', {
    session_id: session.id,
    message: 'What is our assessment of the recent 25 bps hike on Doll Street and housing?'
  });
  console.log('Advisor Response:', chat1.data.reply.substring(0, 180) + '...');

  const m4 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'guidance',
    action_value: 'neutral',
    statement: 'The Committee will monitor high-frequency labor and price data before our next meeting.'
  });
  round1Log.push({ month: 4, action: 'Neutral Guidance', state: m4.data.economic_state, articles: m4.data.news_articles });

  // Month 5: Submit Policy to Parliament & Month 5 Guidance
  console.log('[Year 1, Month 5] Proposing Banking Stability Bill to Parliament...');
  const polRes = await request('/api/advisor/submit-policy', 'POST', {
    session_id: session.id,
    raw_idea: 'Introduce counter-cyclical liquidity requirements for shadow banks',
    target_sector: 'banking'
  });
  console.log(`Parliament Vote: ${polRes.data.policy.parliament_vote_for} Ayes / ${polRes.data.policy.parliament_vote_against} Noes -> ${polRes.data.policy.status.toUpperCase()}`);

  const m5 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'silence',
    action_value: '0',
    statement: 'Silence.'
  });
  round1Log.push({ month: 5, action: 'Silence', state: m5.data.economic_state, articles: m5.data.news_articles });

  // Month 6: MPC Decision (+25 bps)
  console.log('[Year 1, Month 6] MPC Rate Decision: +25 bps hike to 4.75%...');
  const m6 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'mpc_rate_decision',
    action_value: '25',
    statement: 'Second 25 bps hike enacted.'
  });
  round1Log.push({ month: 6, action: '+25 bps hike', state: m6.data.economic_state, articles: m6.data.news_articles });

  // Month 7: Media Blitz & Month 7 Action
  console.log('[Year 1, Month 7] Launching Media Blitz to Main Street...');
  const blitzRes = await request('/api/advisor/media-blitz', 'POST', {
    session_id: session.id,
    target_audience: 'main_street',
    strategic_message: 'Reassure on Long-Term Price Discipline and Purchasing Power Stability'
  });
  console.log(`Blitz Impact: ${blitzRes.data.media_blitz.impact_summary}`);

  const m7 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'guidance',
    action_value: 'dovish',
    statement: 'Signs of stabilization are emerging; policy is approaching terminal restrictive levels.'
  });
  round1Log.push({ month: 7, action: 'Dovish Guidance', state: m7.data.economic_state, articles: m7.data.news_articles });

  // Month 8: Silence
  console.log('[Year 1, Month 8] Month 8 Action: Silence...');
  const m8 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'silence',
    action_value: '0',
    statement: 'Silence.'
  });
  round1Log.push({ month: 8, action: 'Silence', state: m8.data.economic_state, articles: m8.data.news_articles });

  // Month 9: MPC Decision (HOLD / Pause at 4.75%)
  console.log('[Year 1, Month 9] MPC Decision: HOLD (0 bps pause at 4.75%)...');
  const m9 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'mpc_rate_decision',
    action_value: '0',
    statement: 'The Committee voted to maintain the policy rate at 4.75% to evaluate cumulative lags.'
  });
  round1Log.push({ month: 9, action: 'Hold (0 bps)', state: m9.data.economic_state, articles: m9.data.news_articles });

  return round1Log;
}

async function runRound2() {
  console.log('\n=====================================================');
  console.log('--- ROUND 2: CRISIS MANAGEMENT & VOLCKER SHOCK ---');
  console.log('=====================================================');

  const guest = await request('/api/auth/guest', 'POST');
  const userId = guest.data.user.id;

  const startRes = await request('/api/game/new', 'POST', {
    user_id: userId,
    chair_name: 'Chair Paul Sterling',
    play_mode: 'first_person',
    difficulty: 'hard'
  });
  const session = startRes.data.session;
  console.log(`Initialized Session ${session.id} for ${session.chair_name}`);

  // Inject a severe macroeconomic crisis shock: NEG-05 (Stagflationary Energy Shock)
  console.log('Injecting Shock NEG-05: Severe Stagflationary Energy Shock...');
  await request('/api/admin/inject-shock', 'POST', {
    session_id: session.id,
    event_id: 'NEG-05'
  });

  const round2Log = [];

  // Month 1: Emergency Hawkish Guidance in face of oil shock
  console.log('\n[Year 1, Month 1] Crisis Month 1: Emergency Hawkish Warning...');
  const m1 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'guidance',
    action_value: 'hawkish',
    statement: 'Energy shocks will not be permitted to contaminate core inflation expectations. We will act with maximum force.'
  });
  round2Log.push({ month: 1, action: 'Emergency Hawkish', state: m1.data.economic_state, articles: m1.data.news_articles });

  // Month 2: Hawkish speech again
  console.log('[Year 1, Month 2] Crisis Month 2: Reinforcing Hawkish Stance...');
  const m2 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'guidance',
    action_value: 'hawkish',
    statement: 'Second hawkish warning issued.'
  });
  round2Log.push({ month: 2, action: 'Hawkish Warning 2', state: m2.data.economic_state, articles: m2.data.news_articles });

  // Month 3: Aggressive Volcker Hike (+75 bps!)
  console.log('[Year 1, Month 3] Crisis Month 3: MPC Volcker Rate Hike (+75 bps to 5.00%)...');
  const m3 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'mpc_rate_decision',
    action_value: '75',
    statement: 'The Committee voted to raise the policy rate by 75 basis points to 5.00% to crush inflation expectations.'
  });
  round2Log.push({ month: 3, action: '+75 bps hike', state: m3.data.economic_state, articles: m3.data.news_articles });

  // Month 4: Parliamentary Select Committee grilling
  console.log('[Year 1, Month 4] Consulting Advisor on Parliamentary Backlash...');
  const chat2 = await request('/api/advisor/chat', 'POST', {
    session_id: session.id,
    message: 'Parliament is threatening hearings over the 75 bps hike. How dangerous is our job security right now?'
  });
  console.log('Advisor Response:', chat2.data.reply.substring(0, 180) + '...');

  const m4 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'silence',
    action_value: '0',
    statement: 'Silence.'
  });
  round2Log.push({ month: 4, action: 'Silence', state: m4.data.economic_state, articles: m4.data.news_articles });

  // Month 5: Media Blitz to Parliament to prevent dismissal
  console.log('[Year 1, Month 5] Emergency Media Blitz to Parliament Select Committee...');
  const blitzRes2 = await request('/api/advisor/media-blitz', 'POST', {
    session_id: session.id,
    target_audience: 'parliament',
    strategic_message: 'Call for Parliamentary Fiscal Budget Restraint and Structural Supply Investment'
  });
  console.log(`Blitz Impact on Parliament: ${blitzRes2.data.media_blitz.impact_summary}`);

  const m5 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'guidance',
    action_value: 'neutral',
    statement: 'Data dependent.'
  });
  round2Log.push({ month: 5, action: 'Neutral Guidance', state: m5.data.economic_state, articles: m5.data.news_articles });

  // Month 6: Second Large Hike (+50 bps to 5.50%)
  console.log('[Year 1, Month 6] Crisis Month 6: MPC Rate Hike (+50 bps to 5.50%)...');
  const m6 = await request(`/api/game/${session.id}/action`, 'POST', {
    action_type: 'mpc_rate_decision',
    action_value: '50',
    statement: 'Policy rate raised by 50 basis points to 5.50%.'
  });
  round2Log.push({ month: 6, action: '+50 bps hike', state: m6.data.economic_state, articles: m6.data.news_articles });

  return round2Log;
}

async function main() {
  const r1 = await runRound1();
  const r2 = await runRound2();

  console.log('\n=====================================================');
  console.log('--- TELEMETRY COMPARISON SUMMARY ---');
  console.log('=====================================================');
  console.log('\nRound 1 Final State:');
  console.log(`Rate: ${r1[r1.length-1].state.interest_rate}%, CPI: ${r1[r1.length-1].state.inflation_cpi}%, GDP: ${r1[r1.length-1].state.gdp_growth}%, Unemp: ${r1[r1.length-1].state.unemployment_rate}%, JobSec: ${r1[r1.length-1].state.job_security}%, ParlApp: ${r1[r1.length-1].state.parliamentary_approval}%`);

  console.log('\nRound 2 Final State (Post-Shock & Aggressive Hikes):');
  console.log(`Rate: ${r2[r2.length-1].state.interest_rate}%, CPI: ${r2[r2.length-1].state.inflation_cpi}%, GDP: ${r2[r2.length-1].state.gdp_growth}%, Unemp: ${r2[r2.length-1].state.unemployment_rate}%, JobSec: ${r2[r2.length-1].state.job_security}%, ParlApp: ${r2[r2.length-1].state.parliamentary_approval}%, Warnings: ${r2[r2.length-1].state.warning_count}`);
}

main().catch(console.error);
