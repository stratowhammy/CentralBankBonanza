const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { injectEvent } = require('../simulationEngine');

// Load economic_event_web.json
let eventWebData = null;
try {
  const eventWebPath = path.join(__dirname, '..', '..', 'economic_event_web.json');
  if (fs.existsSync(eventWebPath)) {
    eventWebData = JSON.parse(fs.readFileSync(eventWebPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not load economic_event_web.json for admin:', err.message);
}

// Get admin dashboard stats and all active sessions
router.get('/dashboard', (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const sessionCount = db.prepare('SELECT COUNT(*) as count FROM game_sessions').get().count;
    const activeCount = db.prepare("SELECT COUNT(*) as count FROM game_sessions WHERE status = 'active'").get().count;

    const sessions = db.prepare(`
      SELECT s.id, s.user_id, u.username, u.display_name, s.chair_name, s.play_mode, s.difficulty,
             s.status, s.current_year, s.current_month, s.total_months_elapsed, s.economic_state,
             s.updated_at
      FROM game_sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.updated_at DESC LIMIT 50
    `).all();

    const parsedSessions = sessions.map(s => ({
      ...s,
      economic_state: JSON.parse(s.economic_state)
    }));

    // Fetch settings
    const settingsRows = db.prepare('SELECT key, value FROM system_settings').all();
    const settings = {};
    for (const r of settingsRows) {
      settings[r.key] = r.value;
    }

    res.json({
      stats: {
        total_users: userCount,
        total_sessions: sessionCount,
        active_sessions: activeCount,
        total_event_catalog_size: eventWebData && eventWebData.events ? eventWebData.events.length : 50
      },
      sessions: parsedSessions,
      settings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get the catalog of 50 backwards-planned events
router.get('/events-catalog', (req, res) => {
  if (eventWebData && eventWebData.events) {
    res.json({
      total: eventWebData.events.length,
      metadata: eventWebData.metadata,
      events: eventWebData.events
    });
  } else {
    res.status(500).json({ error: 'Event web catalog not loaded' });
  }
});

// Inject a major shock/event into a live game session
router.post('/inject-shock', (req, res) => {
  try {
    const { session_id, event_id } = req.body;
    if (!session_id || !event_id) {
      return res.status(400).json({ error: 'session_id and event_id are required' });
    }

    const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let state = JSON.parse(session.economic_state);
    const updatedState = injectEvent(state, event_id);

    db.prepare('UPDATE game_sessions SET economic_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(updatedState), session_id);

    res.json({
      success: true,
      message: `Successfully injected event ${event_id} into session ${session_id}`,
      active_events: updatedState.active_events,
      updated_state: updatedState
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually tweak any economic variable in a session (admin simulation testing)
router.post('/tweak-economy', (req, res) => {
  try {
    const { session_id, variable, value } = req.body;
    if (!session_id || !variable || value === undefined) {
      return res.status(400).json({ error: 'session_id, variable, and value are required' });
    }

    const session = db.prepare('SELECT economic_state FROM game_sessions WHERE id = ?').get(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    let state = JSON.parse(session.economic_state);
    state[variable] = Number(value);

    db.prepare('UPDATE game_sessions SET economic_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(state), session_id);

    res.json({
      success: true,
      message: `Updated ${variable} to ${value}`,
      updated_state: state
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update system settings (e.g. DeepSeek API Key, Google Cloud TTS)
router.post('/settings', (req, res) => {
  try {
    const { 
      deepseek_api_key, 
      deepseek_model, 
      llm_provider,
      google_tts_api_key,
      google_tts_model,
      google_tts_voice
    } = req.body;

    if (deepseek_api_key !== undefined) {
      db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('deepseek_api_key', deepseek_api_key.trim());
    }
    if (deepseek_model !== undefined) {
      db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('deepseek_model', deepseek_model.trim());
    }
    if (llm_provider !== undefined) {
      db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('llm_provider', llm_provider.trim());
    }
    if (google_tts_api_key !== undefined) {
      db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('google_tts_api_key', google_tts_api_key.trim());
    }
    if (google_tts_model !== undefined) {
      db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('google_tts_model', google_tts_model.trim());
    }
    if (google_tts_voice !== undefined) {
      db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('google_tts_voice', google_tts_voice.trim());
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
