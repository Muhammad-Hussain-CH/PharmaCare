// routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const SALT_ROUNDS = 10;

function generateToken(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup-owner — one-time owner signup
router.post('/signup-owner', async (req, res) => {
  const { full_name, username, email, password } = req.body;

  if (!full_name || !username || !password) {
    return res.status(400).json({ error: 'full_name, username, and password are required' });
  }

  try {
    // Block if an owner already exists
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'owner'"
    );
    if (count > 0) {
      return res.status(403).json({ error: 'Owner account already exists. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.query(
      `INSERT INTO users (full_name, username, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'owner')`,
      [full_name, username, email || null, passwordHash]
    );

    const user = { user_id: result.insertId, role: 'owner', full_name };
    const token = generateToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already in use' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/create-worker — owner creates a worker account
router.post('/create-worker', requireAuth, requireRole('owner'), async (req, res) => {
  const { full_name, username, password } = req.body;

  if (!full_name || !username || !password) {
    return res.status(400).json({ error: 'full_name, username, and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.query(
      `INSERT INTO users (full_name, username, password_hash, role, created_by)
       VALUES (?, ?, ?, 'worker', ?)`,
      [full_name, username, passwordHash, req.user.user_id]
    );

    res.status(201).json({
      message: 'Worker account created',
      worker: { user_id: result.insertId, full_name, username }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already in use' });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — both owner and worker
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const userRow = rows[0];
    const match = await bcrypt.compare(password, userRow.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = { user_id: userRow.user_id, role: userRow.role, full_name: userRow.full_name };
    const token = generateToken(user);

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — restore session on frontend refresh
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;