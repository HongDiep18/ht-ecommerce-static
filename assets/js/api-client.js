/**
 * HTTP client for HT Shop backend (optional).
 */
(function (global) {
  'use strict';

  var TOKEN_KEY = 'ht_api_token';
  var SESSION_KEY = 'ht_session_id';

  function baseUrl() {
    var b = global.HT_API_BASE;
    return b ? String(b).replace(/\/$/, '') : '';
  }

  function enabled() {
    return !!baseUrl();
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    document.dispatchEvent(new CustomEvent('ht-api-change'));
  }

  function getSessionId() {
    try {
      var id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return 'sess_anon';
    }
  }

  function request(path, options) {
    options = options || {};
    var headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    var token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    else headers['X-Session-Id'] = getSessionId();

    return fetch(baseUrl() + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error((data && data.message) || 'Request failed');
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  global.HTApi = {
    enabled: enabled,
    baseUrl: baseUrl,
    getToken: getToken,
    setToken: setToken,
    getSessionId: getSessionId,
    request: request,
    health: function () {
      return request('/api/health');
    },
    fetchProducts: function (query) {
      var q = new URLSearchParams(query || {}).toString();
      return request('/api/products' + (q ? '?' + q : ''));
    },
    fetchProduct: function (id) {
      return request('/api/products/' + encodeURIComponent(id));
    },
    register: function (data) {
      return request('/api/auth/register', { method: 'POST', body: data }).then(function (r) {
        if (r.token) setToken(r.token);
        return r;
      });
    },
    login: function (email, password) {
      return request('/api/auth/login', { method: 'POST', body: { email: email, password: password } }).then(function (r) {
        if (r.token) setToken(r.token);
        return r;
      });
    },
    logout: function () {
      setToken('');
    },
    me: function () {
      return request('/api/auth/me');
    },
    getCart: function () {
      return request('/api/cart');
    },
    addToCart: function (productId, sku, quantity) {
      return request('/api/cart/items', {
        method: 'POST',
        body: { productId: productId, sku: sku, quantity: quantity || 1 },
      });
    },
    placeOrder: function (shipping, paymentMethod) {
      return request('/api/orders', {
        method: 'POST',
        body: { shipping: shipping, paymentMethod: paymentMethod || 'cod' },
      });
    },
    getOrders: function () {
      return request('/api/orders');
    },
  };
})(window);
