/**
 * Point the storefront at the Node API.
 * Load this BEFORE catalog-core.js when using the backend.
 */
(function (global) {
  'use strict';
  global.HT_API_BASE = 'http://localhost:3001';
})(window);
