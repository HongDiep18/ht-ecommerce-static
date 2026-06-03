'use strict';

const express = require('express');
const fs = require('fs');
const {
  getAllProducts,
  getProductById,
  upsertProduct,
  deleteProduct,
  replaceAllProducts,
} = require('../lib/products-store');
const { requireAdmin } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

router.use(requireAdmin);

router.get('/products', (req, res) => {
  res.json({ ok: true, products: getAllProducts() });
});

router.post('/products', (req, res) => {
  try {
    const product = upsertProduct(req.body);
    res.status(201).json({ ok: true, product });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
});

router.put('/products/:id', (req, res) => {
  const body = { ...req.body, id: req.params.id };
  try {
    const product = upsertProduct(body);
    res.json({ ok: true, product });
  } catch (e) {
    res.status(400).json({ ok: false, message: e.message });
  }
});

router.delete('/products/:id', (req, res) => {
  const removed = deleteProduct(req.params.id);
  if (!removed) {
    return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm.' });
  }
  res.json({ ok: true });
});

router.post('/seed', (req, res) => {
  if (!fs.existsSync(config.productsJsonPath)) {
    return res.status(500).json({ ok: false, message: 'products.json không tồn tại.' });
  }
  const raw = JSON.parse(fs.readFileSync(config.productsJsonPath, 'utf8'));
  const products = replaceAllProducts(raw);
  res.json({ ok: true, count: products.length });
});

module.exports = router;
