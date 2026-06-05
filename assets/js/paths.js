/**
 * Site URL map — use root-relative paths from any page depth.
 */
(function (global) {
  'use strict';

  var CATS = {
    all: { category: 'all', title: 'Cửa Hàng' },
    nam: { category: 'Giày nam', title: 'Giày Nam' },
    nu: { category: 'Giày nữ', title: 'Giày Nữ' },
    'tre-em': { category: 'Giày trẻ em', title: 'Giày Trẻ Em' },
    sale: { category: 'Sale', title: 'Sale' },
    'phu-kien': { category: 'Phụ kiện', title: 'Phụ Kiện' },
    'ban-chay': { category: 'Bán chạy', title: 'Bán Chạy' },
  };

  function catalog(slug) {
    slug = slug || 'all';
    return '/shop/catalog.html?cat=' + encodeURIComponent(slug);
  }

  function categoryUrlFromName(name) {
    var key;
    for (key in CATS) {
      if (CATS[key].category === name) {
        return catalog(key);
      }
    }
    return catalog('all');
  }

  function slugFromCategoryName(name) {
    var key;
    for (key in CATS) {
      if (CATS[key].category === name) return key;
    }
    return 'all';
  }

  function productDetail(id, variantSku) {
    var q = 'id=' + encodeURIComponent(id || '');
    if (variantSku) q += '&variant=' + encodeURIComponent(variantSku);
    return '/shop/product.html?' + q;
  }

  var paths = {
    home: '/index.html',
    assets: '/assets',
    shop: {
      catalog: catalog,
      cuaHang: '/shop/cua-hang.html',
      product: '/shop/product.html',
      search: '/shop/search.html',
    },
    account: {
      index: '/account/index.html',
      wishlist: '/account/wishlist.html',
      compare: '/account/compare.html',
      checkout: '/account/checkout.html',
      orders: '/account/orders.html',
    },
    admin: '/admin/index.html',
    content: {
      gioiThieu: '/content/gioi-thieu.html',
      blog: '/content/blog.html',
    },
    cats: CATS,
    categoryUrlFromName: categoryUrlFromName,
    slugFromCategoryName: slugFromCategoryName,
    productDetail: productDetail,
  };

  global.HTShop = global.HTShop || {};
  global.HTShop.paths = paths;
})(typeof window !== 'undefined' ? window : this);
