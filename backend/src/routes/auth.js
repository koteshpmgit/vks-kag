const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, signToken } = require('../middleware/auth');

const router = express.Router();
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(500).json({ error: e.message });
});

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name });

router.post('/signup', wrap(async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = await db.query('SELECT id FROM users WHERE email=$1', [String(email).toLowerCase()]);
  if (existing.rowCount > 0) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const r = await db.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING *',
    [String(email).toLowerCase(), hash, name || '']
  );
  const user = r.rows[0];
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const r = await db.query('SELECT * FROM users WHERE email=$1', [String(email).toLowerCase()]);
  const user = r.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, wrap(async (req, res) => {
  const r = await db.query('SELECT * FROM users WHERE id=$1', [req.userId]);
  if (!r.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(publicUser(r.rows[0]));
}));

module.exports = router;
