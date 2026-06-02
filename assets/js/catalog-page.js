/**
 * Renders category / store listing from HTCatalog + filters + pagination.
 * Page must include: <div id="catalog-placeholder" data-catalog-category="..." data-catalog-title="...">
 */
(function () {
  'use strict';

  var PER_PAGE = 12;
  var state = { page: 1 };

  function getPageFromUrl() {
    var p = new URLSearchParams(window.location.search).get('page');
    return Math.max(1, parseInt(p, 10) || 1);
  }

  function setPageInUrl(page) {
    var url = new URL(window.location.href);
    if (page <= 1) url.searchParams.delete('page');
    else url.searchParams.set('page', String(page));
    history.replaceState({}, '', url.pathname + url.search);
  }

  function getFilters(section) {
    return {
      sort: section.querySelector('#catalog-sort').value,
      brand: section.querySelector('#catalog-brand').value,
      size: section.querySelector('#catalog-size').value,
      priceMin: section.querySelector('#catalog-price-min').value,
      priceMax: section.querySelector('#catalog-price-max').value,
      inStockOnly: true
    };
  }

  function fillFilterOptions(section, products) {
    var brandSel = section.querySelector('#catalog-brand');
    var sizeSel = section.querySelector('#catalog-size');
    var brands = HTCatalog.getBrands(products);
    var sizes = HTCatalog.getSizes(products);
    var bVal = brandSel.value;
    var sVal = sizeSel.value;
    brandSel.innerHTML = '<option value="">Tất cả</option>' + brands.map(function (b) {
      return '<option value="' + HTCatalog.escapeHtml(b) + '">' + HTCatalog.escapeHtml(b) + '</option>';
    }).join('');
    sizeSel.innerHTML = '<option value="">Tất cả</option>' + sizes.map(function (s) {
      return '<option value="' + HTCatalog.escapeHtml(s) + '">' + HTCatalog.escapeHtml(s) + '</option>';
    }).join('');
    brandSel.value = bVal;
    sizeSel.value = sVal;
  }

  function renderPagination(container, pag) {
    if (pag.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    var html = '<ul class="pagination justify-content-center flex-wrap">';
    if (pag.page > 1) {
      html += '<li class="page-item"><a class="page-link" href="#" data-page="' + (pag.page - 1) + '">&laquo;</a></li>';
    }
    var start = Math.max(1, pag.page - 2);
    var end = Math.min(pag.totalPages, pag.page + 2);
    if (start > 1) {
      html += '<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>';
      if (start > 2) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
    for (var i = start; i <= end; i++) {
      html += '<li class="page-item' + (i === pag.page ? ' active' : '') + '">' +
        '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
    }
    if (end < pag.totalPages) {
      if (end < pag.totalPages - 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      html += '<li class="page-item"><a class="page-link" href="#" data-page="' + pag.totalPages + '">' + pag.totalPages + '</a></li>';
    }
    if (pag.page < pag.totalPages) {
      html += '<li class="page-item"><a class="page-link" href="#" data-page="' + (pag.page + 1) + '">&raquo;</a></li>';
    }
    html += '</ul>';
    container.innerHTML = html;
    container.querySelectorAll('[data-page]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        state.page = parseInt(a.getAttribute('data-page'), 10);
        setPageInUrl(state.page);
        renderCatalog(section);
      });
    });
  }

  var section;

  function renderCatalog(sec) {
    section = sec || section;
    if (!section) return;

    var category = section.dataset.catalogCategory || 'all';
    var grid = section.querySelector('#catalog-grid');
    var countEl = section.querySelector('#catalog-result-count');
    var pagEl = section.querySelector('#catalog-pagination');

    HTCatalog.loadCatalog().then(function (all) {
      var pool = category === 'all' ? all : all.filter(function (p) {
        return HTCatalog.matchCategory(p, category);
      });
      fillFilterOptions(section, pool);
      var filtered = HTCatalog.filterAndSort(pool, Object.assign({ category: null }, getFilters(section)));
      var pag = HTCatalog.paginate(filtered, state.page, PER_PAGE);
      state.page = pag.page;

      if (countEl) {
        countEl.textContent = 'Hiển thị ' + (pag.total ? ((pag.page - 1) * pag.perPage + 1) + '–' + Math.min(pag.page * pag.perPage, pag.total) : 0) + ' / ' + pag.total + ' sản phẩm';
      }
      if (!pag.items.length) {
        grid.innerHTML = '<div class="col-12"><p class="text-muted">Không có sản phẩm phù hợp bộ lọc.</p></div>';
      } else {
        grid.innerHTML = pag.items.map(HTCatalog.renderProductCard).join('');
      }
      renderPagination(pagEl, pag);
      document.dispatchEvent(new CustomEvent('ht-cards-updated'));
      if (window.HTEngagement && HTEngagement.refreshCardActions) {
        HTEngagement.refreshCardActions();
      }
    });
  }

  function initViewToggle(sec) {
    var gridBtn = sec.querySelector('[data-catalog-view="grid"]');
    var listBtn = sec.querySelector('[data-catalog-view="list"]');
    var wrapper = sec.querySelector('.products-wrapper');
    if (!gridBtn || !listBtn || !wrapper) return;
    gridBtn.addEventListener('click', function () {
      wrapper.classList.remove('list-view');
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
    });
    listBtn.addEventListener('click', function () {
      wrapper.classList.add('list-view');
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
    });
  }

  function bindFilters(sec) {
    ['catalog-sort', 'catalog-brand', 'catalog-size', 'catalog-price-min', 'catalog-price-max'].forEach(function (id) {
      var el = sec.querySelector('#' + id);
      if (el) {
        el.addEventListener('change', function () {
          state.page = 1;
          setPageInUrl(1);
          renderCatalog(sec);
        });
      }
    });
    var reset = sec.querySelector('#catalog-reset');
    if (reset) {
      reset.addEventListener('click', function () {
        sec.querySelector('#catalog-sort').value = 'newest';
        sec.querySelector('#catalog-brand').value = '';
        sec.querySelector('#catalog-size').value = '';
        sec.querySelector('#catalog-price-min').value = '';
        sec.querySelector('#catalog-price-max').value = '';
        state.page = 1;
        setPageInUrl(1);
        renderCatalog(sec);
      });
    }
  }

  function initSection(sec, title) {
    sec.dataset.catalogCategory = sec.dataset.catalogCategory || 'all';
    var titleEl = sec.querySelector('#catalog-page-title');
    if (titleEl && title) titleEl.textContent = title;
    state.page = getPageFromUrl();
    initViewToggle(sec);
    bindFilters(sec);
    renderCatalog(sec);
    document.addEventListener('ht-catalog-change', function () {
      renderCatalog(sec);
    });
  }

  function mountFromPlaceholder() {
    var ph = document.getElementById('catalog-placeholder');
    if (!ph) return;

    var category = ph.getAttribute('data-catalog-category') || 'all';
    var title = ph.getAttribute('data-catalog-title') || 'Sản phẩm';

    fetch('partials/catalog-section.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        ph.insertAdjacentHTML('afterend', html);
        ph.remove();
        var sec = document.querySelector('[data-catalog-root]');
        if (!sec) return;
        sec.dataset.catalogCategory = category;
        initSection(sec, title);
      })
      .catch(function () {
        ph.innerHTML = '<p class="text-danger">Không tải được danh mục sản phẩm.</p>';
      });
  }

  document.addEventListener('DOMContentLoaded', mountFromPlaceholder);
})();
