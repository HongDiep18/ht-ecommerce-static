'use strict';

const { getDb } = require('../db');
const { normalizeProduct } = require('./normalize');

function rowToProduct(row) {
  if (!row) return null;
  try {
    return normalizeProduct(JSON.parse(row.data));
  } catch {
    return null;
  }
}

function getAllProducts() {
  const db = getDb();
  const rows = db.prepare('SELECT id, data FROM products ORDER BY id').all();
  return rows.map(rowToProduct).filter(Boolean);
}

function getProductById(id) {
  const db = getDb();
  const row = db.prepare('SELECT id, data FROM products WHERE id = ?').get(id);
  return rowToProduct(row);
}

function upsertProduct(product) {
  const normalized = normalizeProduct(product);
  if (!normalized) throw new Error('Invalid product');
  const db = getDb();
  db.prepare(
    `INSERT INTO products (id, data, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`
  ).run(normalized.id, JSON.stringify(normalized));
  return normalized;
}

function deleteProduct(id) {
  const db = getDb();
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return result.changes > 0;
}

function replaceAllProducts(products) {
  const db = getDb();
  const normalized = products.map(normalizeProduct).filter(Boolean);
  const tx = db.transaction((list) => {
    db.prepare('DELETE FROM products').run();
    const insert = db.prepare(
      `INSERT INTO products (id, data, updated_at) VALUES (?, ?, datetime('now'))`
    );
    for (const p of list) {
      insert.run(p.id, JSON.stringify(p));
    }
  });
  tx(normalized);
  return normalized;
}

function countProducts() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
}

module.exports = {
  getAllProducts,
  getProductById,
  upsertProduct,
  deleteProduct,
  replaceAllProducts,
  countProducts,
};
