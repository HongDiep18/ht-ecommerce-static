'use strict';

const { createApp } = require('./app');
const config = require('./config');
const { countProducts } = require('./lib/products-store');
const { replaceAllProducts } = require('./lib/products-store');
const fs = require('fs');

function ensureSeeded() {
  if (countProducts() > 0) return;
  if (!fs.existsSync(config.productsJsonPath)) {
    console.warn('No products in DB and products.json missing — run: npm run seed');
    return;
  }
  const raw = JSON.parse(fs.readFileSync(config.productsJsonPath, 'utf8'));
  const list = replaceAllProducts(raw);
  console.log('Auto-seeded', list.length, 'products from products.json');
}

const app = createApp();
ensureSeeded();

app.listen(config.port, () => {
  console.log(`HT Shop API http://localhost:${config.port}`);
  console.log(`CORS origin: ${config.corsOrigin}`);
  console.log(`Health: http://localhost:${config.port}/api/health`);
});
