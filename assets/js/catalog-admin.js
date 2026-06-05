/**
 * Product admin — server API (SQLite) when HTApi + admin key, else localStorage override.
 */
(function () {
  'use strict';

  var products = [];
  var selectedId = null;
  var useApi = false;

  function categoryUrlFor(cat) {
    if (window.HTShop && HTShop.paths && HTShop.paths.categoryUrlFromName) {
      return HTShop.paths.categoryUrlFromName(cat);
    }
    return '/shop/cua-hang.html';
  }

  function apiMode() {
    return window.HTApi && HTApi.enabled() && HTApi.adminEnabled();
  }

  function setModeBanner() {
    var el = document.getElementById('admin-mode-banner');
    if (!el) return;
    if (apiMode()) {
      el.className = 'alert alert-success small';
      el.innerHTML =
        'Đang lưu qua <strong>backend API</strong> (SQLite). Mọi người dùng site sẽ thấy thay đổi sau khi tải lại trang.';
    } else if (window.HTApi && HTApi.enabled()) {
      el.className = 'alert alert-warning small';
      el.innerHTML =
        'API đã bật nhưng chưa có <strong>Admin API key</strong>. Nhập key bên dưới (mặc định dev: <code>ht-admin-dev-key</code>) hoặc dùng chế độ trình duyệt.';
    } else {
      el.className = 'alert alert-info small';
      el.innerHTML =
        'Chế độ <strong>trình duyệt</strong> (localStorage). Bật <code>HT_API_BASE</code> + Admin key để lưu lên server.';
    }
  }

  function reloadProducts() {
    if (apiMode()) {
      return HTApi.adminGetProducts().then(function (r) {
        products = (r.products || []).map(HTCatalog.normalizeProduct).filter(Boolean);
        HTCatalog.invalidateCatalogCache();
        return products;
      });
    }
    return HTCatalog.loadCatalog(true).then(function (list) {
      products = list;
      return products;
    });
  }

  function refreshList() {
    var list = document.getElementById('admin-product-list');
    var count = document.getElementById('admin-count');
    if (count) count.textContent = products.length;
    if (!list) return;
    list.innerHTML = products
      .map(function (p) {
        var active = p.id === selectedId ? ' active' : '';
        return (
          '<button type="button" class="list-group-item list-group-item-action' +
          active +
          '" data-id="' +
          HTCatalog.escapeHtml(p.id) +
          '">' +
          '<div class="fw-semibold small">' +
          HTCatalog.escapeHtml(p.name) +
          '</div>' +
          '<div class="text-muted" style="font-size:0.75rem">' +
          HTCatalog.escapeHtml(p.category) +
          ' · ' +
          HTCatalog.escapeHtml(p.price) +
          '</div></button>'
        );
      })
      .join('');
    list.querySelectorAll('[data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadForm(btn.getAttribute('data-id'));
      });
    });
  }

  function findProduct(id) {
    return products.find(function (p) {
      return p.id === id;
    });
  }

  function loadForm(id) {
    selectedId = id;
    var form = document.getElementById('admin-product-form');
    var ph = document.getElementById('admin-form-placeholder');
    if (!form) return;
    var p = findProduct(id);
    if (!p) return;
    form.classList.remove('d-none');
    if (ph) ph.classList.add('d-none');
    form.elements.id.value = p.id;
    form.elements.id.readOnly = true;
    form.elements.name.value = p.name;
    form.elements.brand.value = p.brand || 'Hồng Thạnh';
    form.elements.category.value = p.category || 'Giày nam';
    form.elements.image.value = p.image || '';
    form.elements.imageHover.value = p.imageHover || '';
    form.elements.keywords.value = p.keywords || '';
    form.elements.salePercent.value = p.salePercent || '';
    form.elements.variantsJson.value = JSON.stringify(p.variants || [], null, 2);
    form.elements.isNew.value = '0';
    refreshList();
  }

  function newForm() {
    selectedId = null;
    var form = document.getElementById('admin-product-form');
    var ph = document.getElementById('admin-form-placeholder');
    form.classList.remove('d-none');
    if (ph) ph.classList.add('d-none');
    form.reset();
    form.elements.id.readOnly = false;
    form.elements.isNew.value = '1';
    form.elements.brand.value = 'Hồng Thạnh';
    form.elements.variantsJson.value = JSON.stringify(
      [
        {
          sku: 'new-39-den',
          size: '39',
          color: 'Đen',
          colorHex: '#111111',
          priceNumber: 200000,
          stock: 5,
        },
      ],
      null,
      2
    );
    refreshList();
  }

  function hideForm() {
    selectedId = null;
    document.getElementById('admin-product-form').classList.add('d-none');
    document.getElementById('admin-form-placeholder').classList.remove('d-none');
    refreshList();
  }

  function buildItemFromForm(form) {
    var variants;
    try {
      variants = JSON.parse(form.elements.variantsJson.value);
      if (!Array.isArray(variants)) throw new Error('variants must be array');
    } catch (err) {
      throw new Error('Biến thể JSON không hợp lệ: ' + err.message);
    }
    var cat = form.elements.category.value;
    return {
      id: form.elements.id.value.trim(),
      name: form.elements.name.value.trim(),
      brand: form.elements.brand.value.trim(),
      category: cat,
      categoryUrl: categoryUrlFor(cat),
      keywords: form.elements.keywords.value.trim(),
      image: form.elements.image.value.trim(),
      imageHover: form.elements.imageHover.value.trim() || form.elements.image.value.trim(),
      salePercent: form.elements.salePercent.value
        ? Number(form.elements.salePercent.value)
        : undefined,
      variants: variants,
    };
  }

  function saveFromForm(e) {
    e.preventDefault();
    var form = document.getElementById('admin-product-form');
    var item;
    try {
      item = HTCatalog.normalizeProduct(buildItemFromForm(form));
      if (!item) throw new Error('Thiếu ID hoặc dữ liệu không hợp lệ');
    } catch (err) {
      alert(err.message);
      return;
    }

    var isNew = form.elements.isNew.value === '1';

    if (apiMode()) {
      HTApi.adminSaveProduct(item, isNew)
        .then(function () {
          return reloadProducts();
        })
        .then(function () {
          alert('Đã lưu lên server.');
          loadForm(item.id);
        })
        .catch(function (err) {
          alert(err.message || 'Lưu thất bại.');
        });
      return;
    }

    if (isNew) {
      if (products.some(function (p) { return p.id === item.id; })) {
        alert('ID đã tồn tại.');
        return;
      }
      products.push(item);
    } else {
      var idx = products.findIndex(function (p) { return p.id === item.id; });
      if (idx >= 0) products[idx] = item;
      else products.push(item);
    }
    HTCatalog.saveCatalogOverride(products);
    reloadProducts().then(function () {
      alert('Đã lưu (localStorage). Tải JSON để đưa lên server file.');
      loadForm(item.id);
    });
  }

  function deleteSelected() {
    if (!selectedId) return;
    if (!confirm('Xóa sản phẩm này?')) return;

    if (apiMode()) {
      HTApi.adminDeleteProduct(selectedId)
        .then(function () {
          return reloadProducts();
        })
        .then(function () {
          hideForm();
          alert('Đã xóa trên server.');
        })
        .catch(function (err) {
          alert(err.message || 'Xóa thất bại.');
        });
      return;
    }

    products = products.filter(function (p) { return p.id !== selectedId; });
    HTCatalog.saveCatalogOverride(products);
    reloadProducts().then(hideForm);
  }

  function init() {
    var host = document.getElementById('admin-page');
    if (!host) return;

    useApi = apiMode();
    setModeBanner();

    var keyInput = document.getElementById('admin-api-key');
    var keySave = document.getElementById('admin-api-key-save');
    if (keyInput && window.HTApi) {
      keyInput.value = HTApi.getAdminKey() || '';
      if (keySave) {
        keySave.addEventListener('click', function () {
          HTApi.setAdminKey(keyInput.value.trim());
          useApi = apiMode();
          setModeBanner();
          reloadProducts().then(refreshList);
        });
      }
    }

    reloadProducts().then(refreshList);

    document.getElementById('admin-add-product').addEventListener('click', newForm);
    document.getElementById('admin-product-form').addEventListener('submit', saveFromForm);
    document.getElementById('admin-cancel-edit').addEventListener('click', hideForm);
    document.getElementById('admin-delete-product').addEventListener('click', deleteSelected);

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
          var normalized = data.map(HTCatalog.normalizeProduct).filter(Boolean);

          if (apiMode()) {
            if (!confirm('Thay toàn bộ catalog trên server bằng file này (' + normalized.length + ' SP)?')) {
              e.target.value = '';
              return;
            }
            HTApi.adminImportProducts(normalized)
              .then(function (r) {
                return reloadProducts();
              })
              .then(function () {
                alert('Đã nhập lên server.');
                refreshList();
                hideForm();
              })
              .catch(function (err) {
                alert(err.message || 'Nhập thất bại.');
              });
          } else {
            products = normalized;
            HTCatalog.saveCatalogOverride(products);
            refreshList();
            alert('Đã nhập ' + products.length + ' sản phẩm (localStorage).');
          }
        } catch (err) {
          alert('Lỗi JSON: ' + err.message);
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    });

    document.getElementById('admin-reset-catalog').addEventListener('click', function () {
      if (apiMode()) {
        if (!confirm('Tải lại catalog từ assets/data/products.json vào database?')) return;
        HTApi.adminSeedFromFile()
          .then(function (r) {
            return reloadProducts();
          })
          .then(function () {
            hideForm();
            alert('Đã khôi phục từ file gốc trên server.');
            refreshList();
          })
          .catch(function (err) {
            alert(err.message || 'Khôi phục thất bại.');
          });
        return;
      }
      if (!confirm('Xóa bản ghi localStorage và tải lại từ file products.json?')) return;
      HTCatalog.clearCatalogOverride();
      reloadProducts().then(function () {
        hideForm();
        alert('Đã khôi phục từ file gốc (trình duyệt).');
        refreshList();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
