/**
 * Point the storefront at the Node API.
 * Load BEFORE catalog-core.js / api-client.js.
 * Set to '' or comment out HT_API_BASE to use products.json only (offline).
 */
(function (global) {
  'use strict';
  global.HT_API_BASE = 'http://localhost:3001';
})(window);
