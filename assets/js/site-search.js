/**
 * Client-side product search: loads assets/data/products.json,
 * filters by name/category/keywords (accent-insensitive when supported).
 */
(function () {
  'use strict';

  var DATA_PATH = 'assets/data/products.json';
  var catalog = null;
  var loadPromise = null;

  function normalize(s) {
    if (!s) return '';
    s = String(s).toLowerCase().trim();
    try {
      if (s.normalize) {
        s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }
      s = s.replace(/đ/g, 'd');
    } catch (e) {
      s = String(s).toLowerCase();
    }
    return s;
  }

  function loadCatalog() {
    if (catalog) return Promise.resolve(catalog);
    if (loadPromise) return loadPromise;
    loadPromise = fetch(DATA_PATH)
      .then(function (r) {
        if (!r.ok) throw new Error('catalog');
        return r.json();
      })
      .then(function (data) {
        catalog = Array.isArray(data) ? data : [];
        return catalog;
      })
      .catch(function () {
        catalog = [];
        return catalog;
      });
    return loadPromise;
  }

  function filterProducts(q) {
    if (!catalog || !q) return [];
    var nq = normalize(q);
    if (!nq) return [];
    return catalog.filter(function (p) {
      var blob = normalize(
        [p.name, p.category || '', p.keywords || '', p.price || ''].join(' ')
      );
      return blob.indexOf(nq) !== -1;
    });
  }

  function goSearchPage(q) {
    var query = (q || '').trim();
    if (!query) return;
    window.location.href = 'search.html?q=' + encodeURIComponent(query);
  }

  function renderDropdown(dropdown, items, query) {
    if (!items.length) {
      dropdown.innerHTML =
        '<div class="px-3 py-2 text-muted small">Không tìm thấy sản phẩm phù hợp.</div>' +
        '<a class="d-block px-3 py-2 small text-center border-top site-search-view-all" href="#">Xem tất cả kết quả</a>';
      var link = dropdown.querySelector('.site-search-view-all');
      if (link) {
        link.href = 'search.html?q=' + encodeURIComponent(query);
      }
      return;
    }
    var html = items
      .slice(0, 8)
      .map(function (p) {
        var url = p.detailUrl || 'portfolio-details.html';
        return (
          '<a class="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark border-bottom site-search-item" href="' +
          url +
          '">' +
          '<img src="' +
          p.image +
          '" alt="" width="44" height="44" class="rounded object-fit-cover flex-shrink-0" style="object-fit:cover"/>' +
          '<span class="flex-grow-1 min-w-0">' +
          '<span class="d-block small fw-semibold text-truncate">' +
          escapeHtml(p.name) +
          '</span>' +
          '<span class="d-block text-muted" style="font-size:0.75rem">' +
          escapeHtml(p.category || '') +
          ' · ' +
          escapeHtml(p.price || '') +
          '</span></span></a>'
        );
      })
      .join('');
    html +=
      '<a class="d-block px-3 py-2 small text-center text-primary fw-semibold site-search-view-all" href="#">Xem tất cả kết quả</a>';
    dropdown.innerHTML = html;
    var allLink = dropdown.querySelector('.site-search-view-all');
    if (allLink) allLink.href = 'search.html?q=' + encodeURIComponent(query);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms);
    };
  }

  function initHeaderSearch() {
    var input = document.getElementById('site-search-q');
    var dropdown = document.getElementById('site-search-dropdown');
    var btn = document.getElementById('site-search-submit');
    if (!input || !dropdown) return;

    var runFilter = debounce(function () {
      var q = input.value;
      loadCatalog().then(function () {
        var items = filterProducts(q);
        if (!q.trim()) {
          dropdown.classList.add('d-none');
          dropdown.innerHTML = '';
          return;
        }
        dropdown.classList.remove('d-none');
        renderDropdown(dropdown, items, q);
      });
    }, 200);

    input.addEventListener('input', runFilter);
    input.addEventListener('focus', function () {
      if (input.value.trim()) runFilter();
    });

    function submit() {
      goSearchPage(input.value);
    }

    if (btn) btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });

    document.addEventListener('click', function (e) {
      var wrap = document.getElementById('site-search-wrap');
      if (wrap && !wrap.contains(e.target)) {
        dropdown.classList.add('d-none');
      }
    });
  }

  function whenHeaderReady(cb) {
    if (document.getElementById('site-search-q')) {
      cb();
      return;
    }
    var header = document.getElementById('header');
    if (!header) return;
    var obs = new MutationObserver(function () {
      if (document.getElementById('site-search-q')) {
        obs.disconnect();
        cb();
      }
    });
    obs.observe(header, { childList: true, subtree: true });
  }

  function initSearchResultsPage() {
    var container = document.getElementById('site-search-page-results');
    var label = document.getElementById('site-search-page-label');
    if (!container) return;

    var params = new URLSearchParams(window.location.search);
    var q = params.get('q') || '';
    if (label) {
      label.textContent = q ? '“' + q + '”' : '(trống)';
    }

    loadCatalog().then(function () {
      var items = filterProducts(q);
      if (!q.trim()) {
        container.innerHTML =
          '<div class="col-12"><p class="text-muted">Nhập từ khóa ở thanh tìm kiếm phía trên để xem sản phẩm.</p></div>';
        return;
      }
      if (!items.length) {
        container.innerHTML =
          '<div class="col-12"><p class="text-muted">Không có sản phẩm khớp. Thử từ khóa khác hoặc xem danh mục <a href="giayNam.html">nam</a>, <a href="giayNu.html">nữ</a>.</p></div>';
        return;
      }
      container.innerHTML = items
        .map(function (p) {
          var url = p.detailUrl || 'portfolio-details.html';
          return (
            '<div class="col-6 col-md-4 col-lg-3 mb-4">' +
            '<a class="card h-100 text-decoration-none text-dark shadow-sm" href="' +
            url +
            '">' +
            '<img src="' +
            p.image +
            '" class="card-img-top" alt="" style="height:180px;object-fit:cover"/>' +
            '<div class="card-body">' +
            '<p class="card-title small fw-semibold mb-1" style="min-height:2.5rem">' +
            escapeHtml(p.name) +
            '</p>' +
            '<p class="text-danger fw-bold small mb-0">' +
            escapeHtml(p.price || '') +
            '</p>' +
            '<p class="text-muted mb-0" style="font-size:0.75rem">' +
            escapeHtml(p.category || '') +
            '</p></div></a></div>'
          );
        })
        .join('');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    whenHeaderReady(initHeaderSearch);
    initSearchResultsPage();
  });
})();
