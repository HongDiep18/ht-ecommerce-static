'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAuth, signToken } = require('../middleware/auth');

const router = express.Router();

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || '',
    createdAt: row.created_at,
  };
}

router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, message: 'Thiếu họ tên, email hoặc mật khẩu.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ ok: false, message: 'Mật khẩu tối thiểu 6 ký tự.' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (existing) {
    return res.status(409).json({ ok: false, message: 'Email đã được đăng ký.' });
  }

  const id = 'u_' + uuidv4().replace(/-/g, '').slice(0, 12);
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, phone) VALUES (?, ?, ?, ?, ?)'
  ).run(id, String(email).toLowerCase(), hash, name, phone || '');

  const user = db
    .prepare('SELECT id, email, name, phone, created_at FROM users WHERE id = ?')
    .get(id);
  const token = signToken(id);
  res.status(201).json({ ok: true, user: publicUser(user), token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Thiếu email hoặc mật khẩu.' });
  }

  const db = getDb();
  const row = db
    .prepare('SELECT id, email, password_hash, name, phone, created_at FROM users WHERE email = ?')
    .get(String(email).toLowerCase());
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ ok: false, message: 'Email hoặc mật khẩu không đúng.' });
  }

  const token = signToken(row.id);
  res.json({ ok: true, user: publicUser(row), token });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: publicUser(req.user) });
});

module.exports = router;
