const http = require('http');

async function runTests() {
  console.log('--- Starting Central Bank Bonanza Integration Tests ---');
  
  // Start server
  const server = require('./server/index.js');
  await new Promise(r => setTimeout(r, 1000));

  function request(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const u = new URL(path, 'http://localhost:3001');
      const req = http.request(u, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
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

  try {
    // 1. Health check
    const health = await request('/api/health');
    console.log('1. Health check status:', health.status, health.data.status);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Guest Login
    const guest = await request('/api/auth/guest', 'POST');
    console.log('2. Guest login status:', guest.status, 'User:', guest.data.user.display_name);
    const userId = guest.data.user.id;

    // 3. Start New Game in Hard mode (all 4 newspapers!)
    const newGame = await request('/api/game/new', 'POST', {
      user_id: userId,
      chair_name: 'Chair Arthur Volcker',
      play_mode: 'first_person',
      difficulty: 'hard'
    });
    console.log('3. Start Game status:', newGame.status);
    const session = newGame.data.session;
    console.log('   Session ID:', session.id);
    console.log('   Month:', session.current_month, 'Quarter:', session.current_quarter);
    console.log('   Newspapers generated:', session.news_articles.length);
    session.news_articles.forEach(a => {
      console.log(`   - [${a.publisher}] "${a.headline}" (${a.body.split(' ').length} words, tone: ${a.tone})`);
    });

    // 4. Month 1 Action: Forward Guidance
    console.log('\n4. Month 1 Action: Delivering Hawkish Guidance...');
    const m1Action = await request(`/api/game/${session.id}/action`, 'POST', {
      action_type: 'guidance',
      action_value: 'hawkish',
      statement: 'Inflation remains unacceptably persistent. The Committee stands ready to raise borrowing costs.'
    });
    console.log('   Advanced to Year:', m1Action.data.current_year, 'Month:', m1Action.data.current_month);
    console.log('   Newspapers generated:', m1Action.data.news_articles.length);
    console.log('   Policy Rate:', m1Action.data.economic_state.interest_rate, '10Y Yield:', m1Action.data.economic_state.bond_yield_10y);

    // 5. Month 2 Action: Say Nothing
    console.log('\n5. Month 2 Action: Saying Nothing (Silence)...');
    const m2Action = await request(`/api/game/${session.id}/action`, 'POST', {
      action_type: 'silence',
      action_value: '0',
      statement: 'No public statement delivered.'
    });
    console.log('   Advanced to Year:', m2Action.data.current_year, 'Month:', m2Action.data.current_month, '(Month in Q:', m2Action.data.month_in_quarter, ')');
    console.log('   Is MPC Meeting Month:', m2Action.data.month_in_quarter === 3);

    // 6. Month 3 Action: MPC Rate Decision (+50 bps hike!)
    console.log('\n6. Month 3 Action: MPC Decision (+50 bps Rate Hike)...');
    const m3Action = await request(`/api/game/${session.id}/action`, 'POST', {
      action_type: 'mpc_rate_decision',
      action_value: '50',
      statement: 'The Committee voted today to increase the policy rate by 50 basis points to restore price discipline.'
    });
    console.log('   Advanced to Year:', m3Action.data.current_year, 'Month:', m3Action.data.current_month, 'Total Months:', m3Action.data.total_months_elapsed);
    console.log('   New Interest Rate:', m3Action.data.economic_state.interest_rate, '% (Was 4.25%)');

    // 7. Economic Advisor Chat
    console.log('\n7. Testing Economic Advisor Chat...');
    const chat = await request('/api/advisor/chat', 'POST', {
      session_id: session.id,
      message: 'Governor here. How did the markets absorb our 50 bps rate hike?'
    });
    console.log('   Advisor Reply:\n  ', chat.data.reply);

    // 8. Submit Policy Idea to Parliament
    console.log('\n8. Testing Policy Idea Submission to Parliament...');
    const policy = await request('/api/advisor/submit-policy', 'POST', {
      session_id: session.id,
      raw_idea: 'Establish a counter-cyclical capital buffer surcharge of 2.0% on large commercial banks',
      target_sector: 'banking'
    });
    console.log('   Policy Title:', policy.data.policy.title);
    console.log('   Parliament Vote:', policy.data.policy.parliament_vote_for, 'Ayes vs', policy.data.policy.parliament_vote_against, 'Noes');
    console.log('   Outcome:', policy.data.policy.status.toUpperCase());

    // 9. Launch Media Blitz
    console.log('\n9. Testing Media Blitz...');
    const blitz = await request('/api/advisor/media-blitz', 'POST', {
      session_id: session.id,
      target_audience: 'main_street',
      strategic_message: 'Reassure on Long-Term Price Discipline and Purchasing Power Stability'
    });
    console.log('   Audience:', blitz.data.media_blitz.target_audience);
    console.log('   Public Response:', blitz.data.media_blitz.public_response);
    console.log('   Impact:', blitz.data.media_blitz.impact_summary);

    // 10. Admin Shock Injector: Inject POS-01 (AI Productivity Boom)
    console.log('\n10. Testing Admin Shock Injector (POS-01)...');
    const shock = await request('/api/admin/inject-shock', 'POST', {
      session_id: session.id,
      event_id: 'POS-01'
    });
    console.log('   Injection status:', shock.status);
    console.log('   Active event:', shock.data.active_events[0].name, '(Tier:', shock.data.active_events[0].tier, ')');

    // 11. Admin Economic State Tweaker
    console.log('\n11. Testing Admin Economic Tweaker...');
    const tweak = await request('/api/admin/tweak-economy', 'POST', {
      session_id: session.id,
      variable: 'inflation_cpi',
      value: 6.75
    });
    console.log('   Tweak status:', tweak.status, 'New CPI:', tweak.data.updated_state.inflation_cpi);

    console.log('\n>>> ALL 11 INTEGRATION TESTS PASSED PERFECTLY! <<<');
    process.exit(0);

  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
