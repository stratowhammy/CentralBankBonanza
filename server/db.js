const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'central_bank.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'player', -- 'player' or 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    chair_name TEXT NOT NULL,
    play_mode TEXT NOT NULL, -- 'first_person' or 'god_mode'
    difficulty TEXT NOT NULL, -- 'easy', 'normal', 'hard'
    status TEXT DEFAULT 'active', -- 'active', 'retired', 'dismissed', 'term_completed'
    current_year INTEGER DEFAULT 1,
    current_month INTEGER DEFAULT 1, -- 1..12
    total_months_elapsed INTEGER DEFAULT 0,
    
    -- Economic State (stored as JSON for full fidelity)
    economic_state TEXT NOT NULL,
    
    -- God Mode / Chair Succession State (stored as JSON)
    chair_state TEXT NOT NULL,
    
    -- Last decision metadata
    last_action TEXT,
    last_action_details TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS turn_history (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    month_in_quarter INTEGER NOT NULL, -- 1, 2, or 3
    action_type TEXT NOT NULL, -- 'guidance', 'silence', 'mpc_rate_decision'
    action_value TEXT,
    statement TEXT,
    economic_snapshot TEXT NOT NULL, -- JSON snapshot of indicators
    active_events TEXT, -- JSON array of active events / shocks
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS news_articles (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    publisher TEXT NOT NULL, -- 'gloomberg', 'doll_street', 'gotham', 'cashington'
    headline TEXT NOT NULL,
    body TEXT NOT NULL,
    tone TEXT NOT NULL, -- 'hawkish', 'dovish', 'alarmist', 'bullish', 'critical', 'neutral'
    urgency TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    featured_variable TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS policy_proposals (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    raw_idea TEXT NOT NULL,
    refined_legislation TEXT NOT NULL,
    target_sector TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'passed', 'rejected'
    parliament_vote_for INTEGER,
    parliament_vote_against INTEGER,
    enacted_effects TEXT, -- JSON effects
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS media_blitzes (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    target_audience TEXT NOT NULL, -- 'wall_street', 'main_street', 'parliament', 'foreign_fx'
    strategic_message TEXT NOT NULL,
    public_response TEXT NOT NULL,
    impact_summary TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS advisor_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL, -- 'user' or 'advisor'
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- High-performance query indexes
  CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_turn_history_session_id ON turn_history(session_id);
  CREATE INDEX IF NOT EXISTS idx_turn_history_session_ym ON turn_history(session_id, year, month);
  CREATE INDEX IF NOT EXISTS idx_news_articles_session_ym ON news_articles(session_id, year, month);
  CREATE INDEX IF NOT EXISTS idx_advisor_messages_session ON advisor_messages(session_id);
`);

// Safe column migrations for Section 5 features
try {
  db.exec('ALTER TABLE news_articles ADD COLUMN byline TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE news_articles ADD COLUMN dateline TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE news_articles ADD COLUMN whisper_quote TEXT');
} catch (e) {}
try {
  db.exec('ALTER TABLE game_sessions ADD COLUMN hearings_completed INTEGER DEFAULT 0');
} catch (e) {}

// Seed default admin and guest users if they don't exist
const checkAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!checkAdmin) {
  const adminId = 'user_admin_default';
  // simple hash for default admin: 'centralbank123'
  db.prepare(`
    INSERT INTO users (id, username, password_hash, display_name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, 'admin', 'centralbank123', 'Board Governor (Admin)', 'admin');
}

const checkGuest = db.prepare('SELECT id FROM users WHERE username = ?').get('guest');
if (!checkGuest) {
  db.prepare(`
    INSERT INTO users (id, username, password_hash, display_name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('user_guest_default', 'guest', 'guestpass', 'Guest Governor', 'player');
}

// Seed default system settings
const getSetting = db.prepare('SELECT value FROM system_settings WHERE key = ?');
if (!getSetting.get('deepseek_api_key')) {
  db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('deepseek_api_key', '');
}
db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('deepseek_model', 'deepseek-v4-pro')").run();
if (!getSetting.get('llm_provider')) {
  db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('llm_provider', 'deepseek_flash');
}

module.exports = db;
