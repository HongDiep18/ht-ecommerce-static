'use strict';

const express = require('express');
const {
  getAllProducts,
  getProductById,
} = require('../lib/products-store');
const {
  filterAndSort,
  paginate,
  getBrands,
  getSizes,
  matchCategory,
} = require('../lib/normalize');

const router = express.Router();

router.get('/', (req, res) => {
  const all = getAllProducts();
  let pool = all;
  const category = req.query.category;
  if (category && category !== 'all') {
    pool = all.filter((p) => matchCategory(p, category));
  }

  const filtered = filterAndSort(pool, {
    category: null,
    brand: req.query.brand,
    size: req.query.size,
    priceMin: req.query.priceMin,
    priceMax: req.query.priceMax,
    sort: req.query.sort,
    q: req.query.q,
    inStockOnly: req.query.inStockOnly === '1',
  });

  const pag = paginate(filtered, req.query.page, parseInt(req.query.perPage, 10) || 12);

  res.json({
    ok: true,
    ...pag,
    brands: getBrands(pool),
    sizes: getSizes(pool),
  });
});

router.get('/:id', (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ ok: false, message: 'Không tìm thấy sản phẩm.' });
  }
  res.json({ ok: true, product });
});

module.exports = router;
