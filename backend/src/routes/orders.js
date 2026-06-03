'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { getProductById } = require('../lib/products-store');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

function cartOwner(req) {
  if (req.user) return { userId: req.user.id, sessionId: null };
  const sessionId = req.sessionId || req.headers['x-session-id'];
  if (!sessionId) return null;
  return { userId: null, sessionId };
}

function loadCartLines(owner) {
  const db = getDb();
  if (owner.userId) {
    return db
      .prepare('SELECT * FROM cart_items WHERE user_id = ?')
      .all(owner.userId);
  }
  return db
    .prepare('SELECT * FROM cart_items WHERE session_id = ? AND user_id IS NULL')
    .all(owner.sessionId);
}

function getVariant(product, sku) {
  return product?.variants?.find((v) => v.sku === sku) || null;
}

function decrementStock(productId, sku, qty) {
  const product = getProductById(productId);
  if (!product) return false;
  const idx = product.variants.findIndex((v) => v.sku === sku);
  if (idx < 0) return false;
  if (product.variants[idx].stock < qty) return false;
  product.variants[idx].stock -= qty;
  const { upsertProduct } = require('../lib/products-store');
  upsertProduct(product);
  return true;
}

router.use(optionalAuth);

router.post('/', (req, res) => {
  const owner = cartOwner(req);
  if (!owner) {
    return res.status(400).json({ ok: false, message: 'Gửi header X-Session-Id hoặc đăng nhập.' });
  }

  const shipping = req.body?.shipping || {};
  if (!shipping.name || !shipping.phone || !shipping.address) {
    return res.status(400).json({
      ok: false,
      message: 'Thiếu họ tên, số điện thoại hoặc địa chỉ giao hàng.',
    });
  }

  const lines = loadCartLines(owner);
  if (!lines.length) {
    return res.status(400).json({ ok: false, message: 'Giỏ hàng trống.' });
  }

  const orderItems = [];
  let total = 0;
  for (const line of lines) {
    const product = getProductById(line.product_id);
    const variant = product ? getVariant(product, line.sku) : null;
    if (!variant || variant.stock < line.quantity) {
      return res.status(400).json({
        ok: false,
        message: 'Một số sản phẩm không còn đủ hàng.',
      });
    }
    orderItems.push({
      productId: line.product_id,
      sku: line.sku,
      name: product.name,
      priceNumber: variant.priceNumber,
      quantity: line.quantity,
    });
    total += variant.priceNumber * line.quantity;
  }

  for (const item of orderItems) {
    if (!decrementStock(item.productId, item.sku, item.quantity)) {
      return res.status(400).json({ ok: false, message: 'Cập nhật tồn kho thất bại.' });
    }
  }

  const db = getDb();
  const orderId = 'ord_' + uuidv4().replace(/-/g, '').slice(0, 12);
  const paymentMethod = req.body?.paymentMethod || 'cod';

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (id, user_id, session_id, status, payment_method, shipping_json, total)
       VALUES (?, ?, ?, 'pending', ?, ?, ?)`
    ).run(
      orderId,
      owner.userId,
      owner.sessionId,
      paymentMethod,
      JSON.stringify(shipping),
      total
    );

    const insertItem = db.prepare(
      `INSERT INTO order_items (id, order_id, product_id, sku, name, price_number, quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of orderItems) {
      insertItem.run(
        'oi_' + uuidv4().replace(/-/g, '').slice(0, 12),
        orderId,
        item.productId,
        item.sku,
        item.name,
        item.priceNumber,
        item.quantity
      );
    }

    if (owner.userId) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(owner.userId);
    } else {
      db.prepare('DELETE FROM cart_items WHERE session_id = ? AND user_id IS NULL').run(
        owner.sessionId
      );
    }
  });

  tx();

  res.status(201).json({
    ok: true,
    order: {
      id: orderId,
      status: 'pending',
      paymentMethod,
      total,
      shipping,
      items: orderItems,
      createdAt: new Date().toISOString(),
    },
  });
});

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const orders = db
    .prepare(
      `SELECT id, status, payment_method, shipping_json, total, created_at
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(req.user.id);

  const itemsStmt = db.prepare(
    `SELECT product_id, sku, name, price_number, quantity FROM order_items WHERE order_id = ?`
  );

  res.json({
    ok: true,
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      paymentMethod: o.payment_method,
      shipping: JSON.parse(o.shipping_json),
      total: o.total,
      createdAt: o.created_at,
      items: itemsStmt.all(o.id).map((i) => ({
        productId: i.product_id,
        sku: i.sku,
        name: i.name,
        priceNumber: i.price_number,
        quantity: i.quantity,
      })),
    })),
  });
});

router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const o = db
    .prepare(
      `SELECT id, status, payment_method, shipping_json, total, created_at
       FROM orders WHERE id = ? AND user_id = ?`
    )
    .get(req.params.id, req.user.id);
  if (!o) {
    return res.status(404).json({ ok: false, message: 'Không tìm thấy đơn hàng.' });
  }
  const items = db
    .prepare(
      `SELECT product_id, sku, name, price_number, quantity FROM order_items WHERE order_id = ?`
    )
    .all(o.id);

  res.json({
    ok: true,
    order: {
      id: o.id,
      status: o.status,
      paymentMethod: o.payment_method,
      shipping: JSON.parse(o.shipping_json),
      total: o.total,
      createdAt: o.created_at,
      items: items.map((i) => ({
        productId: i.product_id,
        sku: i.sku,
        name: i.name,
        priceNumber: i.price_number,
        quantity: i.quantity,
      })),
    },
  });
});

module.exports = router;
