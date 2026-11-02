const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// Register a new user
router.post('/register', (req, res) => {
  try {
    const { username, password, display_name } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const userId = 'usr_' + uuidv4().substring(0, 8);
    // In production we would use bcrypt, for simplicity we store password directly or hashed
    const displayName = display_name && display_name.trim().length > 0 ? display_name.trim() : username;

    db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, role)
      VALUES (?, ?, ?, ?, 'player')
    `).run(userId, cleanUsername, password, displayName);

    const user = { id: userId, username: cleanUsername, display_name: displayName, role: 'player' };
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.prepare('SELECT id, username, display_name, role, password_hash FROM users WHERE username = ?').get(cleanUsername);
    
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const userSafe = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role
    };

    res.json({ success: true, user: userSafe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quick guest login
router.post('/guest', (req, res) => {
  try {
    const guestUser = db.prepare('SELECT id, username, display_name, role FROM users WHERE username = ?').get('guest');
    res.json({ success: true, user: guestUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile and game career stats
router.get('/profile/:userId', (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, display_name, role, created_at FROM users WHERE id = ?').get(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessions = db.prepare(`
      SELECT id, chair_name, play_mode, difficulty, status, current_year, current_month, total_months_elapsed, created_at, updated_at
      FROM game_sessions
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).all(req.params.userId);

    res.json({ user, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
