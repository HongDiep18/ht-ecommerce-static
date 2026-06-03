'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../src/config');
const { getDb } = require('../src/db');
const { replaceAllProducts, countProducts } = require('../src/lib/products-store');

getDb();

if (!fs.existsSync(config.productsJsonPath)) {
  console.error('Missing:', config.productsJsonPath);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(config.productsJsonPath, 'utf8'));
const products = replaceAllProducts(raw);
console.log('Seeded', products.length, 'products into', config.dbPath);
console.log('Count in DB:', countProducts());
