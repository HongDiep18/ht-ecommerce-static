/**
 * Product detail page — loads from HTCatalog with variant selection.
 */
(function () {
  'use strict';

  var currentProduct = null;
  var selectedVariant = null;

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

  function renderNotFound() {
    var host = document.getElementById('product-detail-page');
    if (!host) return;
    var main = host.querySelector('.container.py-5');
    if (main) {
      main.innerHTML =
        '<div class="alert alert-warning">Không tìm thấy sản phẩm. <a href="cuahang.html">Quay lại cửa hàng</a></div>';
    }
  }

  function renderVariantSelectors(product) {
    var wrap = document.getElementById('product-detail-variants');
    if (!wrap) return;

    var sizes = [];
    var colors = [];
    product.variants.forEach(function (v) {
      if (sizes.indexOf(v.size) === -1) sizes.push(v.size);
      if (!colors.some(function (c) { return c.color === v.color; })) {
        colors.push({ color: v.color, colorHex: v.colorHex });
      }
    });

    var sizeHtml = sizes.map(function (s) {
      var active = selectedVariant && selectedVariant.size === s ? ' active' : '';
      var disabled = !product.variants.some(function (v) { return v.size === s && v.stock > 0; });
      return '<button type="button" class="btn btn-sm btn-outline-secondary ht-variant-size' + active + (disabled ? ' disabled' : '') + '" data-size="' + escapeHtml(s) + '">' + escapeHtml(s) + '</button>';
    }).join('');

    var colorHtml = colors.map(function (c) {
      var active = selectedVariant && selectedVariant.color === c.color ? ' active' : '';
      return '<button type="button" class="btn btn-sm btn-outline-secondary ht-variant-color' + active + '" data-color="' + escapeHtml(c.color) + '" title="' + escapeHtml(c.color) + '"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:' + escapeHtml(c.colorHex) + ';border:1px solid #ccc"></span></button>';
    }).join('');

    wrap.innerHTML =
      '<div class="mb-3"><label class="form-label small fw-semibold">Chọn size</label><div class="d-flex flex-wrap gap-2">' + sizeHtml + '</div></div>' +
      '<div class="mb-2"><label class="form-label small fw-semibold">Chọn màu</label><div class="d-flex flex-wrap gap-2">' + colorHtml + '</div></div>' +
      '<p class="small mb-0" id="product-variant-stock"></p>';

    function pickVariant(size, color) {
      var v = product.variants.find(function (x) {
        return x.size === size && x.color === color && x.stock > 0;
      });
      if (!v && size) {
        v = product.variants.find(function (x) { return x.size === size && x.stock > 0; });
      }
      if (!v) v = product.variants.find(function (x) { return x.stock > 0; }) || product.variants[0];
      selectedVariant = v;
      updatePriceDisplay(product);
      var stockEl = document.getElementById('product-variant-stock');
      if (stockEl) {
        stockEl.textContent = v.stock > 0 ? 'Còn ' + v.stock + ' sản phẩm (SKU: ' + v.sku + ')' : 'Hết hàng — đăng ký nhận tin bên dưới';
        stockEl.className = 'small mb-0 ' + (v.stock > 0 ? 'text-success' : 'text-danger');
      }
      wrap.querySelectorAll('.ht-variant-size').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-size') === v.size);
      });
      wrap.querySelectorAll('.ht-variant-color').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-color') === v.color);
      });
    }

    wrap.querySelectorAll('.ht-variant-size').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('disabled')) return;
        pickVariant(btn.getAttribute('data-size'), selectedVariant ? selectedVariant.color : null);
      });
    });
    wrap.querySelectorAll('.ht-variant-color').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pickVariant(selectedVariant ? selectedVariant.size : null, btn.getAttribute('data-color'));
      });
    });

    var params = new URLSearchParams(window.location.search);
    var skuParam = decodeParam(params.get('variant'));
    if (skuParam) {
      var fromSku = HTCatalog.getVariant(product, skuParam);
      if (fromSku) selectedVariant = fromSku;
    }
    if (!selectedVariant) {
      selectedVariant = product.variants.find(function (v) { return v.stock > 0; }) || product.variants[0];
    }
    pickVariant(selectedVariant.size, selectedVariant.color);
  }

  function updatePriceDisplay(product) {
    var priceEl = document.getElementById('product-detail-price');
    if (priceEl && selectedVariant) {
      priceEl.textContent = selectedVariant.price;
    }
    var metaEl = document.getElementById('product-detail-meta');
    if (metaEl && product) {
      metaEl.innerHTML =
        '<span class="me-3"><strong>Mã:</strong> ' + escapeHtml(product.id) + '</span>' +
        '<span class="me-3"><strong>SKU:</strong> ' + escapeHtml(selectedVariant ? selectedVariant.sku : '') + '</span>' +
        '<span><strong>Thương hiệu:</strong> ' + escapeHtml(product.brand || 'Hồng Thạnh') + '</span>';
    }
  }

  function renderProduct(product) {
    currentProduct = product;
    var breadcrumbNameEl = document.getElementById('product-detail-name-breadcrumb');
    var nameEl = document.getElementById('product-detail-name');
    var categoryEl = document.getElementById('product-detail-category');
    var imageEl = document.getElementById('product-detail-image');
    var backEl = document.getElementById('product-detail-back-link');
    var page = document.getElementById('product-detail-page');

    document.title = product.name + ' — Hồng Thạnh';
    if (breadcrumbNameEl) breadcrumbNameEl.textContent = product.name;
    if (nameEl) nameEl.textContent = product.name;
    if (categoryEl) categoryEl.textContent = product.category || 'Sản phẩm';
    if (imageEl) {
      imageEl.src = product.image;
      imageEl.alt = product.name;
    }
    if (backEl) {
      backEl.href = product.categoryUrl || 'cuahang.html';
      backEl.textContent = 'Quay lại ' + (product.category || 'danh mục');
    }
    if (page) page.dataset.productId = product.id;

    renderVariantSelectors(product);
    renderRelated(product);
    document.dispatchEvent(new CustomEvent('ht-product-loaded', { detail: product }));
  }

  function renderRelated(product) {
    var wrap = document.getElementById('product-detail-related');
    if (!wrap) return;
    HTCatalog.loadCatalog().then(function (catalog) {
      var related = catalog.filter(function (p) {
        return p.id !== product.id && p.category === product.category;
      }).slice(0, 4);
      if (!related.length) {
        wrap.innerHTML = '<p class="text-muted mb-0">Chưa có sản phẩm liên quan.</p>';
        return;
      }
      wrap.innerHTML = related.map(function (p) {
        return (
          '<div class="col-6 col-md-3">' +
          '<a class="card h-100 text-decoration-none text-dark shadow-sm" href="' + HTCatalog.detailUrl(p) + '">' +
          '<img src="' + escapeHtml(p.image) + '" class="card-img-top" alt="" style="height:180px;object-fit:cover">' +
          '<div class="card-body"><p class="card-title small fw-semibold mb-1">' + escapeHtml(p.name) + '</p>' +
          '<p class="text-danger fw-bold small mb-0">' + escapeHtml(p.price) + '</p></div></a></div>'
        );
      }).join('');
      document.dispatchEvent(new CustomEvent('ht-cards-updated'));
    });
  }

  function initProductDetailPage() {
    var host = document.getElementById('product-detail-page');
    if (!host) return;

    var params = new URLSearchParams(window.location.search);
    var id = decodeParam(params.get('id'));

    HTCatalog.loadCatalog().then(function (catalog) {
      var product = id ? HTCatalog.getProductById(id) : null;
      if (!product) {
        renderNotFound();
        return;
      }
      renderProduct(product);
    });
  }

  document.addEventListener('DOMContentLoaded', initProductDetailPage);
})();
