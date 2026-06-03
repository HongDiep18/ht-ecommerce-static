'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { getProductById } = require('../lib/products-store');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

function cartOwner(req) {
  if (req.user) return { userId: req.user.id, sessionId: null };
  const sessionId = req.sessionId || req.headers['x-session-id'];
  if (!sessionId) return null;
  return { userId: null, sessionId };
}

function getVariant(product, sku) {
  if (!product?.variants?.length) return null;
  return product.variants.find((v) => v.sku === sku) || null;
}

function loadCartLines(owner) {
  const db = getDb();
  let rows;
  if (owner.userId) {
    rows = db
      .prepare('SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at')
      .all(owner.userId);
  } else {
    rows = db
      .prepare('SELECT * FROM cart_items WHERE session_id = ? AND user_id IS NULL ORDER BY created_at')
      .all(owner.sessionId);
  }
  return rows;
}

function enrichLines(lines) {
  return lines
    .map((line) => {
      const product = getProductById(line.product_id);
      const variant = product ? getVariant(product, line.sku) : null;
      if (!product || !variant) return null;
      return {
        id: line.id,
        productId: line.product_id,
        sku: line.sku,
        quantity: line.quantity,
        name: product.name,
        image: product.image,
        price: variant.price,
        priceNumber: variant.priceNumber,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        lineTotal: variant.priceNumber * line.quantity,
      };
    })
    .filter(Boolean);
}

router.use(optionalAuth);

router.get('/', (req, res) => {
  const owner = cartOwner(req);
  if (!owner) {
    return res.status(400).json({
      ok: false,
      message: 'Gửi header X-Session-Id hoặc đăng nhập.',
    });
  }
  const items = enrichLines(loadCartLines(owner));
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  res.json({ ok: true, items, subtotal });
});

router.post('/items', (req, res) => {
  const owner = cartOwner(req);
  if (!owner) {
    return res.status(400).json({ ok: false, message: 'Gửi header X-Session-Id hoặc đăng nhập.' });
  }

  const { productId, sku, quantity } = req.body || {};
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const product = getProductById(productId);
  const variant = product ? getVariant(product, sku) : null;
  if (!variant) {
    return res.status(400).json({ ok: false, message: 'Sản phẩm hoặc biến thể không hợp lệ.' });
  }
  if (variant.stock < qty) {
    return res.status(400).json({ ok: false, message: 'Không đủ tồn kho.' });
  }

  const db = getDb();
  const existing = owner.userId
    ? db
        .prepare(
          'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND sku = ?'
        )
        .get(owner.userId, productId, sku)
    : db
        .prepare(
          'SELECT id, quantity FROM cart_items WHERE session_id = ? AND user_id IS NULL AND product_id = ? AND sku = ?'
        )
        .get(owner.sessionId, productId, sku);

  if (existing) {
    const newQty = existing.quantity + qty;
    if (variant.stock < newQty) {
      return res.status(400).json({ ok: false, message: 'Không đủ tồn kho.' });
    }
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    const id = 'ci_' + uuidv4().replace(/-/g, '').slice(0, 12);
    db.prepare(
      'INSERT INTO cart_items (id, user_id, session_id, product_id, sku, quantity) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, owner.userId, owner.sessionId, productId, sku, qty);
  }

  const items = enrichLines(loadCartLines(owner));
  res.json({
    ok: true,
    items,
    subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
  });
});

router.patch('/items/:lineId', (req, res) => {
  const owner = cartOwner(req);
  if (!owner) {
    return res.status(400).json({ ok: false, message: 'Gửi header X-Session-Id hoặc đăng nhập.' });
  }

  const qty = Math.max(1, parseInt(req.body?.quantity, 10) || 1);
  const db = getDb();
  const line = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(req.params.lineId);
  if (!line || !ownsLine(line, owner)) {
    return res.status(404).json({ ok: false, message: 'Không tìm thấy dòng giỏ hàng.' });
  }

  const product = getProductById(line.product_id);
  const variant = product ? getVariant(product, line.sku) : null;
  if (!variant || variant.stock < qty) {
    return res.status(400).json({ ok: false, message: 'Không đủ tồn kho.' });
  }

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, line.id);
  const items = enrichLines(loadCartLines(owner));
  res.json({
    ok: true,
    items,
    subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
  });
});

router.delete('/items/:lineId', (req, res) => {
  const owner = cartOwner(req);
  if (!owner) {
    return res.status(400).json({ ok: false, message: 'Gửi header X-Session-Id hoặc đăng nhập.' });
  }

  const db = getDb();
  const line = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(req.params.lineId);
  if (!line || !ownsLine(line, owner)) {
    return res.status(404).json({ ok: false, message: 'Không tìm thấy dòng giỏ hàng.' });
  }
  db.prepare('DELETE FROM cart_items WHERE id = ?').run(line.id);
  const items = enrichLines(loadCartLines(owner));
  res.json({
    ok: true,
    items,
    subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
  });
});

function ownsLine(line, owner) {
  if (owner.userId) return line.user_id === owner.userId;
  return line.session_id === owner.sessionId && !line.user_id;
}

module.exports = router;
