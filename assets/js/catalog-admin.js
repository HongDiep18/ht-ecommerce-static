/**
 * Simple product admin — edits catalog in localStorage (export JSON for server deploy).
 */
(function () {
  'use strict';

  var products = [];
  var editIndex = -1;

  function categoryUrlFor(cat) {
    var map = {
      'Giày nam': 'giayNam.html',
      'Giày nữ': 'giayNu.html',
      'Giày trẻ em': 'giayTreEm.html',
      Sale: 'giaySales.html',
      'Phụ kiện': 'phuKien.html',
      'Bán chạy': 'index.html'
    };
    return map[cat] || 'cuahang.html';
  }

  function refreshList() {
    var list = document.getElementById('admin-product-list');
    var count = document.getElementById('admin-count');
    if (count) count.textContent = products.length;
    if (!list) return;
    list.innerHTML = products.map(function (p, i) {
      return (
        '<button type="button" class="list-group-item list-group-item-action' + (i === editIndex ? ' active' : '') + '" data-index="' + i + '">' +
        '<div class="fw-semibold small">' + HTCatalog.escapeHtml(p.name) + '</div>' +
        '<div class="text-muted" style="font-size:0.75rem">' + HTCatalog.escapeHtml(p.category) + ' · ' + HTCatalog.escapeHtml(p.price) + '</div></button>'
      );
    }).join('');
    list.querySelectorAll('[data-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadForm(parseInt(btn.getAttribute('data-index'), 10));
      });
    });
  }

  function loadForm(index) {
    editIndex = index;
    var form = document.getElementById('admin-product-form');
    var ph = document.getElementById('admin-form-placeholder');
    if (!form) return;
    form.classList.remove('d-none');
    if (ph) ph.classList.add('d-none');
    var p = products[index];
    if (!p) return;
    form.elements.id.value = p.id;
    form.elements.name.value = p.name;
    form.elements.brand.value = p.brand || 'Hồng Thạnh';
    form.elements.category.value = p.category || 'Giày nam';
    form.elements.image.value = p.image || '';
    form.elements.imageHover.value = p.imageHover || '';
    form.elements.keywords.value = p.keywords || '';
    form.elements.salePercent.value = p.salePercent || '';
    form.elements.variantsJson.value = JSON.stringify(p.variants || [], null, 2);
    form.elements.editIndex.value = String(index);
    refreshList();
  }

  function newForm() {
    editIndex = -1;
    var form = document.getElementById('admin-product-form');
    var ph = document.getElementById('admin-form-placeholder');
    form.classList.remove('d-none');
    if (ph) ph.classList.add('d-none');
    form.reset();
    form.elements.editIndex.value = '-1';
    form.elements.brand.value = 'Hồng Thạnh';
    form.elements.variantsJson.value = JSON.stringify([
      { sku: 'new-39', size: '39', color: 'Đen', colorHex: '#111111', priceNumber: 200000, stock: 5 }
    ], null, 2);
    refreshList();
  }

  function saveFromForm(e) {
    e.preventDefault();
    var form = document.getElementById('admin-product-form');
    var variants;
    try {
      variants = JSON.parse(form.elements.variantsJson.value);
      if (!Array.isArray(variants)) throw new Error('variants must be array');
    } catch (err) {
      alert('Biến thể JSON không hợp lệ: ' + err.message);
      return;
    }
    var cat = form.elements.category.value;
    var item = {
      id: form.elements.id.value.trim(),
      name: form.elements.name.value.trim(),
      brand: form.elements.brand.value.trim(),
      category: cat,
      categoryUrl: categoryUrlFor(cat),
      keywords: form.elements.keywords.value.trim(),
      image: form.elements.image.value.trim(),
      imageHover: form.elements.imageHover.value.trim() || form.elements.image.value.trim(),
      salePercent: form.elements.salePercent.value ? Number(form.elements.salePercent.value) : undefined,
      variants: variants
    };
    var idx = parseInt(form.elements.editIndex.value, 10);
    if (idx >= 0) products[idx] = HTCatalog.normalizeProduct(item);
    else products.push(HTCatalog.normalizeProduct(item));
    HTCatalog.saveCatalogOverride(products);
    HTCatalog.loadCatalog(true).then(function (list) {
      products = list;
      alert('Đã lưu. Trang cửa hàng sẽ cập nhật khi tải lại.');
      loadForm(idx >= 0 ? idx : products.length - 1);
    });
  }

  function init() {
    var host = document.getElementById('admin-page');
    if (!host) return;

    HTCatalog.loadCatalog(true).then(function (list) {
      products = list;
      refreshList();
    });

    document.getElementById('admin-add-product').addEventListener('click', newForm);
    document.getElementById('admin-product-form').addEventListener('submit', saveFromForm);
    document.getElementById('admin-cancel-edit').addEventListener('click', function () {
      document.getElementById('admin-product-form').classList.add('d-none');
      document.getElementById('admin-form-placeholder').classList.remove('d-none');
      editIndex = -1;
      refreshList();
    });
    document.getElementById('admin-delete-product').addEventListener('click', function () {
      if (editIndex < 0) return;
      if (!confirm('Xóa sản phẩm này?')) return;
      products.splice(editIndex, 1);
      HTCatalog.saveCatalogOverride(products);
      editIndex = -1;
      document.getElementById('admin-product-form').classList.add('d-none');
      document.getElementById('admin-form-placeholder').classList.remove('d-none');
      refreshList();
    });
    document.getElementById('admin-export-json').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'products.json';
      a.click();
    });
    document.getElementById('admin-import-json').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (!Array.isArray(data)) throw new Error('Root must be array');
          products = data.map(HTCatalog.normalizeProduct).filter(Boolean);
          HTCatalog.saveCatalogOverride(products);
          refreshList();
          alert('Đã nhập ' + products.length + ' sản phẩm.');
        } catch (err) {
          alert('Lỗi JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
    document.getElementById('admin-reset-catalog').addEventListener('click', function () {
      if (!confirm('Xóa bản ghi localStorage và tải lại từ file products.json?')) return;
      HTCatalog.clearCatalogOverride();
      HTCatalog.loadCatalog(true).then(function (list) {
        products = list;
        editIndex = -1;
        refreshList();
        alert('Đã khôi phục từ file gốc.');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
