/**
 * HTTP client for HT Shop backend (optional).
 */
(function (global) {
  'use strict';

  var TOKEN_KEY = 'ht_api_token';
  var SESSION_KEY = 'ht_session_id';
  var ADMIN_KEY = 'ht_admin_api_key';

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

  function getCart() {
    return request('/api/cart');
  }

  function getAdminKey() {
    try {
      return localStorage.getItem(ADMIN_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setAdminKey(key) {
    if (key) localStorage.setItem(ADMIN_KEY, key);
    else localStorage.removeItem(ADMIN_KEY);
    document.dispatchEvent(new CustomEvent('ht-api-change'));
  }

  function adminRequest(path, options) {
    options = options || {};
    var key = getAdminKey();
    if (!key) {
      return Promise.reject(new Error('Chưa nhập Admin API key.'));
    }
    var headers = Object.assign({}, options.headers || {}, { 'X-Admin-Key': key });
    return request(path, Object.assign({}, options, { headers: headers }));
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
    updateCartItem: function (lineId, quantity) {
      return request('/api/cart/items/' + encodeURIComponent(lineId), {
        method: 'PATCH',
        body: { quantity: quantity },
      });
    },
    removeCartItem: function (lineId) {
      return request('/api/cart/items/' + encodeURIComponent(lineId), { method: 'DELETE' });
    },
    getCart: getCart,
    getAdminKey: getAdminKey,
    setAdminKey: setAdminKey,
    adminEnabled: function () {
      return enabled() && !!getAdminKey();
    },
    adminGetProducts: function () {
      return adminRequest('/api/admin/products');
    },
    adminSaveProduct: function (product, isNew) {
      if (isNew) {
        return adminRequest('/api/admin/products', { method: 'POST', body: product });
      }
      return adminRequest('/api/admin/products/' + encodeURIComponent(product.id), {
        method: 'PUT',
        body: product,
      });
    },
    adminDeleteProduct: function (id) {
      return adminRequest('/api/admin/products/' + encodeURIComponent(id), { method: 'DELETE' });
    },
    adminImportProducts: function (products) {
      return adminRequest('/api/admin/import', { method: 'POST', body: { products: products } });
    },
    adminSeedFromFile: function () {
      return adminRequest('/api/admin/seed', { method: 'POST' });
    },
    refreshCartBadge: function () {
      if (!enabled()) return Promise.resolve();
      return getCart()
        .then(function (r) {
          var count = (r.items || []).reduce(function (s, i) {
            return s + (i.quantity || 0);
          }, 0);
          var badge = document.getElementById('ht-badge-cart');
          if (!badge) return;
          badge.textContent = count > 99 ? '99+' : String(count);
          badge.classList.toggle('d-none', count < 1);
        })
        .catch(function () {});
    },
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (enabled()) {
      global.HTApi.refreshCartBadge();
    }
  });
  document.addEventListener('ht-api-change', function () {
    if (enabled()) global.HTApi.refreshCartBadge();
  });
})(window);
