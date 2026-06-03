'use strict';

const express = require('express');
const cors = require('cors');
const config = require('./config');
const { getDb } = require('./db');

const healthRouter = require('./routes/health');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

function createApp() {
  getDb();

  const app = express();
  const origins = config.corsOrigin.split(',').map((s) => s.trim());

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || origins.includes(origin) || origins.includes('*')) {
          return cb(null, true);
        }
        cb(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/api', (req, res) => {
    res.json({
      ok: true,
      name: 'HT Shop API',
      endpoints: [
        'GET /api/health',
        'GET /api/products',
        'GET /api/products/:id',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me',
        'GET /api/cart',
        'POST /api/cart/items',
        'POST /api/orders',
        'GET /api/orders',
      ],
    });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/admin', adminRouter);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Lỗi máy chủ.' });
  });

  return app;
}

module.exports = { createApp };
