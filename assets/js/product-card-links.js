/**
 * Makes product cards/buttons open the product detail page.
 * Works for:
 * - homepage slider cards: .product-list .card
 * - shop/category cards: .product-card (+ .buy-btn)
 */
(function () {
  'use strict';

  function textFrom(el) {
    return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function getPageCategory() {
    var p = window.location.pathname.toLowerCase();
    if (p.indexOf('giaynu') !== -1) return 'Giày nữ';
    if (p.indexOf('giaynam') !== -1) return 'Giày nam';
    if (p.indexOf('giaysales') !== -1) return 'Sale';
    if (p.indexOf('giaytreem') !== -1) return 'Giày trẻ em';
    if (p.indexOf('phukien') !== -1) return 'Phụ kiện';
    return 'Sản phẩm';
  }

  function getPageUrl() {
    var file = window.location.pathname.split('/').pop();
    return file || 'index.html';
  }

  function slugify(name) {
    var s = String(name || '').toLowerCase().trim();
    if (s.normalize) {
      s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    s = s.replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'product';
  }

  function extractProduct(card) {
    if (!card) return null;

    var name = textFrom(card.querySelector('.product-name')) || textFrom(card.querySelector('.card-title'));
    if (!name) return null;

    var price = textFrom(card.querySelector('.product-info .text-danger'))
      || textFrom(card.querySelector('.card-text.text-danger'))
      || textFrom(card.querySelector('.fw-bold.text-danger'))
      || 'Liên hệ';

    var imageEl = card.querySelector('img.front')
      || card.querySelector('.product-image')
      || card.querySelector('.card-img-top')
      || card.querySelector('img');

    var image = imageEl ? (imageEl.getAttribute('src') || '').trim() : '';

    return {
      id: slugify(name),
      name: name,
      price: price,
      image: image,
      category: getPageCategory(),
      categoryUrl: getPageUrl()
    };
  }

  function detailUrl(product) {
    var q = new URLSearchParams({
      id: product.id || '',
      name: product.name || '',
      price: product.price || '',
      image: product.image || '',
      category: product.category || '',
      categoryUrl: product.categoryUrl || ''
    });
    return 'product-detail.html?' + q.toString();
  }

  function openDetailFromCard(card) {
    var product = extractProduct(card);
    if (!product) return;
    window.location.href = detailUrl(product);
  }

  function initCardCursor() {
    document.querySelectorAll('.product-list .card, .products-wrapper .product-card').forEach(function (card) {
      card.style.cursor = 'pointer';
    });
  }

  function init() {
    initCardCursor();

    document.addEventListener('click', function (e) {
      var buyBtn = e.target.closest('.buy-btn');
      if (buyBtn) {
        e.preventDefault();
        e.stopPropagation();
        openDetailFromCard(buyBtn.closest('.product-card') || buyBtn.closest('.card'));
        return;
      }

      var card = e.target.closest('.product-list .card, .products-wrapper .product-card');
      if (!card) return;

      if (e.target.closest('a, button, input, textarea, select, .carousel-control-prev, .carousel-control-next')) {
        return;
      }

      openDetailFromCard(card);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
