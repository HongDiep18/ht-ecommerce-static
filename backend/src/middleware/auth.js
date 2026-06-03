'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDb } = require('../db');

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  req.sessionId = req.headers['x-session-id'] || null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const db = getDb();
    const user = db
      .prepare('SELECT id, email, name, phone, created_at FROM users WHERE id = ?')
      .get(payload.sub);
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: 'Đăng nhập để tiếp tục.' });
    }
    next();
  });
}

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== config.adminApiKey) {
    return res.status(403).json({ ok: false, message: 'Admin API key không hợp lệ.' });
  }
  next();
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });
}

module.exports = { optionalAuth, requireAuth, requireAdmin, signToken };
