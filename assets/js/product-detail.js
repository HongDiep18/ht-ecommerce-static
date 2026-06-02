/**
 * Product detail page renderer.
 * Supports:
 * - ?id=<catalog-id> (preferred, from assets/data/products.json)
 * - fallback params: ?name=&price=&image=&category=&categoryUrl=
 */
(function () {
  'use strict';

  var DATA_PATH = 'assets/data/products.json';

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function decodeParam(value) {
    if (!value) return '';
    try {
      return decodeURIComponent(value).trim();
    } catch (e) {
      return String(value).trim();
    }
  }

  function getFallbackProduct(params) {
    var name = decodeParam(params.get('name'));
    if (!name) return null;
    return {
      id: decodeParam(params.get('id')) || '',
      name: name,
      price: decodeParam(params.get('price')) || 'Liên hệ',
      image: decodeParam(params.get('image')) || 'assets/img/product/SP_Nu/1.jpg',
      category: decodeParam(params.get('category')) || 'Sản phẩm',
      categoryUrl: decodeParam(params.get('categoryUrl')) || 'cuahang.html',
      keywords: decodeParam(params.get('keywords')) || ''
    };
  }

  function renderNotFound(container) {
    container.innerHTML =
      '<div class="col-12">' +
      '<div class="alert alert-warning mb-0">Không tìm thấy sản phẩm. Vui lòng quay lại <a href="cuahang.html">Cửa hàng</a>.</div>' +
      '</div>';
  }

  function renderProduct(product) {
    var titleEl = document.getElementById('product-detail-title');
    var breadcrumbNameEl = document.getElementById('product-detail-name-breadcrumb');
    var nameEl = document.getElementById('product-detail-name');
    var categoryEl = document.getElementById('product-detail-category');
    var imageEl = document.getElementById('product-detail-image');
    var priceEl = document.getElementById('product-detail-price');
    var metaEl = document.getElementById('product-detail-meta');
    var backEl = document.getElementById('product-detail-back-link');

    var safeName = product.name || 'Sản phẩm';
    var safeCategory = product.category || 'Sản phẩm';
    var safeCategoryUrl = product.categoryUrl || 'cuahang.html';
    var safePrice = product.price || 'Liên hệ';
    var safeImage = product.image || 'assets/img/product/SP_Nu/1.jpg';

    document.title = safeName + ' — Hồng Thạnh';
    if (titleEl) titleEl.textContent = safeName;
    if (breadcrumbNameEl) breadcrumbNameEl.textContent = safeName;
    if (nameEl) nameEl.textContent = safeName;
    if (categoryEl) categoryEl.textContent = safeCategory;
    if (imageEl) {
      imageEl.src = safeImage;
      imageEl.alt = safeName;
    }
    if (priceEl) priceEl.textContent = safePrice;
    if (metaEl) {
      metaEl.innerHTML =
        '<span class="me-3"><strong>Mã:</strong> ' + escapeHtml(product.id || 'N/A') + '</span>' +
        '<span><strong>Danh mục:</strong> ' + escapeHtml(safeCategory) + '</span>';
    }
    if (backEl) {
      backEl.href = safeCategoryUrl;
      backEl.textContent = 'Quay lại ' + safeCategory;
    }
  }

  function renderRelated(current, catalog) {
    var wrap = document.getElementById('product-detail-related');
    if (!wrap || !Array.isArray(catalog)) return;

    var related = catalog.filter(function (p) {
      return p.id !== current.id && (p.category || '') === (current.category || '');
    }).slice(0, 4);

    if (!related.length) {
      wrap.innerHTML = '<p class="text-muted mb-0">Hiện chưa có sản phẩm liên quan.</p>';
      return;
    }

    wrap.innerHTML = related.map(function (p) {
      return (
        '<div class="col-6 col-md-3">' +
        '<a class="card h-100 text-decoration-none text-dark shadow-sm" href="product-detail.html?id=' + encodeURIComponent(p.id || '') + '">' +
        '<img src="' + escapeHtml(p.image || '') + '" class="card-img-top" alt="' + escapeHtml(p.name || '') + '" style="height:180px;object-fit:cover">' +
        '<div class="card-body">' +
        '<p class="card-title small fw-semibold mb-1" style="min-height:2.5rem">' + escapeHtml(p.name || '') + '</p>' +
        '<p class="text-danger fw-bold small mb-0">' + escapeHtml(p.price || 'Liên hệ') + '</p>' +
        '</div></a></div>'
      );
    }).join('');
  }

  function initProductDetailPage() {
    var host = document.getElementById('product-detail-page');
    if (!host) return;

    var params = new URLSearchParams(window.location.search);
    var id = decodeParam(params.get('id'));
    var fallbackProduct = getFallbackProduct(params);

    fetch(DATA_PATH)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (catalog) {
        catalog = Array.isArray(catalog) ? catalog : [];
        var product = null;
        if (id) {
          product = catalog.find(function (p) { return (p.id || '') === id; }) || null;
        }
        if (!product && fallbackProduct) {
          product = fallbackProduct;
        }

        if (!product) {
          renderNotFound(host);
          return;
        }

        renderProduct(product);
        renderRelated(product, catalog);
        document.dispatchEvent(new CustomEvent('ht-product-loaded', { detail: product }));
      })
      .catch(function () {
        if (fallbackProduct) {
          renderProduct(fallbackProduct);
          renderRelated(fallbackProduct, []);
          document.dispatchEvent(new CustomEvent('ht-product-loaded', { detail: fallbackProduct }));
        } else {
          renderNotFound(host);
        }
      });
  }

  document.addEventListener('DOMContentLoaded', initProductDetailPage);
})();
