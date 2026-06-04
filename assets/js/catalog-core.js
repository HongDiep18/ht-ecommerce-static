/**
 * Product catalog — single source of truth (JSON + optional localStorage override).
 */
(function (global) {
  'use strict';

  var DATA_PATH = 'assets/data/products.json';
  var OVERRIDE_KEY = 'ht_catalog_override';
  var cache = null;
  var loadPromise = null;

  function parsePrice(str) {
    if (typeof str === 'number' && !isNaN(str)) return str;
    var n = parseInt(String(str || '').replace(/[^\d]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  function formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizeProduct(raw) {
    if (!raw || !raw.id) return null;
    var p = Object.assign({}, raw);
    p.brand = p.brand || 'Hồng Thạnh';
    p.keywords = p.keywords || '';
    p.imageHover = p.imageHover || p.image || '';

    if (!Array.isArray(p.variants) || !p.variants.length) {
      var base = parsePrice(p.price);
      p.variants = [
        {
          sku: p.id + '-default',
          size: '39',
          color: 'Mặc định',
          colorHex: '#333333',
          price: p.price || formatPrice(base),
          priceNumber: base,
          stock: typeof p.stock === 'number' ? p.stock : 10
        }
      ];
    } else {
      p.variants = p.variants.map(function (v, i) {
        var pn = v.priceNumber != null ? v.priceNumber : parsePrice(v.price);
        return {
          sku: v.sku || p.id + '-v' + i,
          size: String(v.size || '39'),
          color: v.color || 'Mặc định',
          colorHex: v.colorHex || '#333',
          price: v.price || formatPrice(pn),
          priceNumber: pn,
          stock: typeof v.stock === 'number' ? v.stock : 0
        };
      });
    }

    var prices = p.variants.map(function (v) { return v.priceNumber; });
    p.priceNumber = Math.min.apply(null, prices);
    p.priceMaxNumber = Math.max.apply(null, prices);
    if (!p.price) p.price = formatPrice(p.priceNumber);
    if (p.salePriceNumber && p.salePriceNumber < p.priceNumber) {
      p.priceNumber = p.salePriceNumber;
      p.price = formatPrice(p.salePriceNumber);
    }
    return p;
  }

  function loadFromApi() {
    var base = (global.HT_API_BASE || '').replace(/\/$/, '');
    if (!base) return null;
    return fetch(base + '/api/products?perPage=500')
      .then(function (r) {
        if (!r.ok) throw new Error('api catalog failed');
        return r.json();
      })
      .then(function (data) {
        var list = (data && data.items) ? data.items : [];
        cache = list.map(normalizeProduct).filter(Boolean);
        return cache;
      });
  }

  function invalidateCatalogCache() {
    cache = null;
    loadPromise = null;
    document.dispatchEvent(new CustomEvent('ht-catalog-change'));
  }

  function loadCatalog(force) {
    if (cache && !force) return Promise.resolve(cache);
    if (force) {
      cache = null;
      loadPromise = null;
    }
    if (loadPromise && !force) return loadPromise;

    var apiLoad = loadFromApi();
    if (apiLoad) {
      loadPromise = apiLoad.catch(function () {
        return loadCatalogFromFile();
      });
      return loadPromise;
    }

    loadPromise = loadCatalogFromFile();
    return loadPromise;
  }

  function loadCatalogFromFile() {
    return fetch(DATA_PATH)
      .then(function (r) {
        if (!r.ok) throw new Error('catalog fetch failed');
        return r.json();
      })
      .then(function (fileData) {
        var override = null;
        try {
          var raw = localStorage.getItem(OVERRIDE_KEY);
          if (raw) override = JSON.parse(raw);
        } catch (e) { /* ignore */ }
        var list = Array.isArray(override) && override.length ? override : fileData;
        cache = list.map(normalizeProduct).filter(Boolean);
        return cache;
      })
      .catch(function () {
        cache = [];
        return cache;
      });
  }

  function saveCatalogOverride(products) {
    cache = products.map(normalizeProduct).filter(Boolean);
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(cache));
    loadPromise = Promise.resolve(cache);
    document.dispatchEvent(new CustomEvent('ht-catalog-change'));
    return cache;
  }

  function clearCatalogOverride() {
    localStorage.removeItem(OVERRIDE_KEY);
    cache = null;
    loadPromise = null;
    document.dispatchEvent(new CustomEvent('ht-catalog-change'));
  }

  function getProductById(id) {
    if (!cache || !id) return null;
    return cache.find(function (p) { return p.id === id; }) || null;
  }

  function getCatalog() {
    return cache || [];
  }

  function getVariant(product, sku) {
    if (!product || !product.variants) return null;
    if (!sku) return product.variants.find(function (v) { return v.stock > 0; }) || product.variants[0];
    return product.variants.find(function (v) { return v.sku === sku; }) || product.variants[0];
  }

  function detailUrl(product, variantSku) {
    var q = new URLSearchParams({ id: product.id });
    if (variantSku) q.set('variant', variantSku);
    return 'product-detail.html?' + q.toString();
  }

  function matchCategory(product, categoryFilter) {
    if (!categoryFilter || categoryFilter === 'all') return true;
    return (product.category || '') === categoryFilter;
  }

  function getBrands(products) {
    var set = {};
    products.forEach(function (p) {
      if (p.brand) set[p.brand] = true;
    });
    return Object.keys(set).sort();
  }

  function getSizes(products) {
    var set = {};
    products.forEach(function (p) {
      p.variants.forEach(function (v) {
        set[v.size] = true;
      });
    });
    return Object.keys(set).sort(function (a, b) {
      return parseInt(a, 10) - parseInt(b, 10);
    });
  }

  function filterAndSort(products, opts) {
    opts = opts || {};
    var list = products.slice();

    if (opts.category) {
      list = list.filter(function (p) { return matchCategory(p, opts.category); });
    }
    if (opts.brand) {
      list = list.filter(function (p) { return p.brand === opts.brand; });
    }
    if (opts.size) {
      list = list.filter(function (p) {
        return p.variants.some(function (v) { return v.size === opts.size && v.stock > 0; });
      });
    }
    if (opts.priceMin != null && opts.priceMin !== '') {
      var min = Number(opts.priceMin);
      list = list.filter(function (p) { return p.priceNumber >= min; });
    }
    if (opts.priceMax != null && opts.priceMax !== '') {
      var max = Number(opts.priceMax);
      list = list.filter(function (p) { return p.priceNumber <= max; });
    }
    if (opts.inStockOnly) {
      list = list.filter(function (p) {
        return p.variants.some(function (v) { return v.stock > 0; });
      });
    }
    if (opts.q) {
      var nq = String(opts.q).toLowerCase();
      list = list.filter(function (p) {
        var blob = [p.name, p.brand, p.category, p.keywords].join(' ').toLowerCase();
        return blob.indexOf(nq) !== -1;
      });
    }

    var sort = opts.sort || 'newest';
    list.sort(function (a, b) {
      if (sort === 'price-asc') return a.priceNumber - b.priceNumber;
      if (sort === 'price-desc') return b.priceNumber - a.priceNumber;
      if (sort === 'name') return a.name.localeCompare(b.name, 'vi');
      return (b.id || '').localeCompare(a.id || '');
    });

    return list;
  }

  function paginate(list, page, perPage) {
    page = Math.max(1, parseInt(page, 10) || 1);
    perPage = perPage || 12;
    var total = list.length;
    var totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;
    var start = (page - 1) * perPage;
    return {
      items: list.slice(start, start + perPage),
      page: page,
      perPage: perPage,
      total: total,
      totalPages: totalPages
    };
  }

  function renderProductCard(product) {
    var discount = product.salePercent ? '<span class="badge bg-danger position-absolute top-0 start-0 m-2">-' + product.salePercent + '%</span>' : '';
    var sizes = product.variants.map(function (v) { return v.size; }).filter(function (s, i, a) { return a.indexOf(s) === i; }).slice(0, 5);
    var colors = product.variants.map(function (v) { return v; }).filter(function (v, i, arr) {
      return arr.findIndex(function (x) { return x.color === v.color; }) === i;
    }).slice(0, 4);

    var sizeHtml = sizes.length ? '<div class="small text-muted mt-1">Size: ' + escapeHtml(sizes.join(', ')) + '</div>' : '';
    var colorHtml = colors.length ? '<div class="d-flex gap-1 mt-1">' + colors.map(function (v) {
      return '<span title="' + escapeHtml(v.color) + '" style="width:12px;height:12px;border-radius:50%;background:' + escapeHtml(v.colorHex) + ';border:1px solid #ddd"></span>';
    }).join('') + '</div>' : '';

    return (
      '<div class="col-6 col-md-4 col-lg-3 mb-4">' +
      '<div class="product-card position-relative overflow-hidden border rounded p-2" data-product-id="' + escapeHtml(product.id) + '">' +
      discount +
      '<div class="product-image-wrapper position-relative">' +
      '<img src="' + escapeHtml(product.image) + '" class="img-fluid product-image" alt="' + escapeHtml(product.name) + '">' +
      '<img src="' + escapeHtml(product.imageHover) + '" class="img-fluid product-hover-image position-absolute top-0 start-0 w-100 h-100" alt="">' +
      '</div>' +
      '<div class="product-info mt-2 d-flex justify-content-between align-items-center">' +
      '<div class="product-text text-start">' +
      '<p class="mb-1 fw-semibold product-name">' + escapeHtml(product.name) + '</p>' +
      '<p class="mb-0 text-danger fw-bold product-price">' + escapeHtml(product.price) + '</p>' +
      sizeHtml + colorHtml +
      '</div>' +
      '<button type="button" class="btn btn-warning btn-sm buy-btn d-inline-flex align-items-center text-nowrap px-3 text-white">' +
      'ĐẶT HÀNG <i class="fa-solid fa-caret-down ms-2" style="color:#fff"></i></button>' +
      '</div></div></div>'
    );
  }

  global.HTCatalog = {
    loadCatalog: loadCatalog,
    invalidateCatalogCache: invalidateCatalogCache,
    saveCatalogOverride: saveCatalogOverride,
    clearCatalogOverride: clearCatalogOverride,
    getProductById: getProductById,
    getCatalog: getCatalog,
    getVariant: getVariant,
    detailUrl: detailUrl,
    parsePrice: parsePrice,
    formatPrice: formatPrice,
    escapeHtml: escapeHtml,
    normalizeProduct: normalizeProduct,
    filterAndSort: filterAndSort,
    paginate: paginate,
    getBrands: getBrands,
    getSizes: getSizes,
    renderProductCard: renderProductCard,
    matchCategory: matchCategory,
    OVERRIDE_KEY: OVERRIDE_KEY
  };
})(window);
