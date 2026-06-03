'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'ht-shop-dev-secret-change-me',
  adminApiKey: process.env.ADMIN_API_KEY || 'ht-admin-dev-key',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  dbPath: process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, '..', 'data', 'htshop.sqlite'),
  productsJsonPath: path.join(__dirname, '..', '..', 'assets', 'data', 'products.json'),
};
