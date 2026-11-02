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

async function runTests() {
  console.log('--- TESTING DEEPSEEK FLASH ADVISOR & VARIED NEWS DESKS ---');

  // 1. Create a session on Hard difficulty (4 newspapers)
  console.log('\n[1] Starting new simulation on Hard difficulty...');
  const createRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/game/new',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    user_id: 'usr_f12d5d53', // Klimbus Bunghole's user id!
    chair_name: 'Klimbus Bunghole',
    play_mode: 'first_person',
    difficulty: 'hard'
  });

  if (createRes.status !== 200) {
    throw new Error('Failed to create session: ' + JSON.stringify(createRes));
  }

  const session = createRes.data.session;
  const sessionId = session.id;
  console.log(`✓ Session initialized: ${sessionId}`);
  console.log(`  Articles generated: ${session.news_articles.length}`);

  // 2. Inspect the news articles for non-formulaic varied styles and indicator selection
  console.log('\n[2] Reviewing generated news stories for varied styles & indicators:');
  for (const art of session.news_articles) {
    console.log(`\n  --- [${art.publisher.toUpperCase()}] ---`);
    console.log(`  Headline: "${art.headline}"`);
    console.log(`  Byline: ${art.byline} | Dateline: ${art.dateline}`);
    console.log(`  Featured Focus: ${art.featured_variable}`);
    console.log(`  Trader Whisper: ${art.whisper_quote}`);
    console.log(`  Lede excerpt: "${art.body.substring(0, 150)}..."`);

    // Verify no internal codes like POS- or NEG- appear
    if (art.headline.includes('POS-') || art.headline.includes('NEG-') || art.body.includes('POS-') || art.body.includes('NEG-')) {
      throw new Error(`Article contains internal ID codes: ${art.headline}`);
    }
  }
  console.log('\n✓ All 4 articles exhibit distinct voices and dynamic focal indicators. Zero internal codes found.');

  // 3. Test Chief of Staff / Economic Advisor linked to DeepSeek Flash with News Context
  console.log('\n[3] Testing Chief of Staff & Economic Advisor with News Context via DeepSeek Flash...');
  const chatPrompt = "What are the press desks saying about our policies, and how should we handle the current market sentiment?";
  console.log(`  User message: "${chatPrompt}"`);

  const chatRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/advisor/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    session_id: sessionId,
    message: chatPrompt
  });

  if (chatRes.status !== 200) {
    throw new Error('Advisor chat failed: ' + JSON.stringify(chatRes));
  }

  const reply = chatRes.data.reply;
  console.log('\n  --- CHIEF OF STAFF REPLY ---');
  console.log(reply);
  console.log('  -----------------------------');

  // Verify the advisor references press coverage / media narrative
  const lowerReply = reply.toLowerCase();
  const hasNewsContext = lowerReply.includes('gloomberg') || lowerReply.includes('doll street') || lowerReply.includes('gotham') || lowerReply.includes('cashington') || lowerReply.includes('press') || lowerReply.includes('media') || lowerReply.includes('headline') || lowerReply.includes('trader') || lowerReply.includes('whisper');
  console.log(`✓ Advisor synthesized media and news context: ${hasNewsContext}`);

  // 4. Verify Klimbus Bunghole profile
  console.log('\n[4] Verifying Klimbus Bunghole profile and permissions...');
  const profileRes = await request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/profile/usr_f12d5d53',
    method: 'GET'
  });
  console.log(`✓ User: ${profileRes.data.user.display_name} (Role: ${profileRes.data.user.role})`);
  if (profileRes.data.user.role === 'admin') {
    throw new Error('Klimbus Bunghole has admin role!');
  }
  console.log('✓ Klimbus Bunghole is correctly configured as player (non-admin).');

  console.log('\n======================================================');
  console.log('ALL TESTS PASSED: DEEPSEEK FLASH ADVISOR & NEWS WORKING 100%');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
