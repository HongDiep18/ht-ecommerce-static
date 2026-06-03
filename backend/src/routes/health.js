'use strict';

const express = require('express');
const { countProducts } = require('../lib/products-store');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'ht-shop-api',
    products: countProducts(),
    time: new Date().toISOString(),
  });
});

module.exports = router;
