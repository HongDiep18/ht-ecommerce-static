/**
 * Cart & checkout — requires HT Shop backend (HTApi).
 */
(function () {
  'use strict';

  function formatMoney(n) {
    return (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg, type) {
    if (window.HTEngagement && HTEngagement.toast) {
      HTEngagement.toast(msg, type);
      return;
    }
    alert(msg);
  }

  function renderCart(data) {
    var host = document.getElementById('checkout-cart-items');
    var subtotalEl = document.getElementById('checkout-subtotal');
    var submitBtn = document.getElementById('checkout-submit-btn');
    if (!host) return;

    var items = data.items || [];
    if (!items.length) {
      host.innerHTML =
        '<div class="card-body"><p class="text-muted mb-2">Giỏ hàng trống.</p>' +
        '<a href="cuahang.html" class="btn btn-sm btn-danger">Tiếp tục mua sắm</a></div>';
      if (subtotalEl) subtotalEl.textContent = '0đ';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    host.innerHTML =
      '<ul class="list-group list-group-flush">' +
      items
        .map(function (item) {
          return (
            '<li class="list-group-item">' +
            '<div class="d-flex gap-3 align-items-start">' +
            '<img src="' +
            escapeHtml(item.image) +
            '" alt="" width="72" height="72" class="rounded object-fit-cover" style="object-fit:cover">' +
            '<div class="flex-grow-1">' +
            '<p class="fw-semibold mb-1 small">' +
            escapeHtml(item.name) +
            '</p>' +
            '<p class="text-muted small mb-1">Size ' +
            escapeHtml(item.size) +
            ' · ' +
            escapeHtml(item.color) +
            '</p>' +
            '<p class="text-danger fw-bold small mb-2">' +
            escapeHtml(item.price) +
            '</p>' +
            '<div class="d-flex align-items-center gap-2">' +
            '<label class="small text-muted mb-0">SL</label>' +
            '<input type="number" class="form-control form-control-sm" style="width:4rem" min="1" max="' +
            item.stock +
            '" value="' +
            item.quantity +
            '" data-line-id="' +
            escapeHtml(item.id) +
            '" data-cart-qty>' +
            '<button type="button" class="btn btn-sm btn-outline-danger" data-remove-line="' +
            escapeHtml(item.id) +
            '">Xóa</button>' +
            '</div></div>' +
            '<div class="text-end small fw-semibold">' +
            formatMoney(item.lineTotal) +
            '</div></div></li>'
          );
        })
        .join('') +
      '</ul>';

    if (subtotalEl) subtotalEl.textContent = formatMoney(data.subtotal);
    if (submitBtn) submitBtn.disabled = false;

    host.querySelectorAll('[data-cart-qty]').forEach(function (input) {
      input.addEventListener('change', function () {
        var qty = parseInt(input.value, 10) || 1;
        HTApi.request('/api/cart/items/' + encodeURIComponent(input.getAttribute('data-line-id')), {
          method: 'PATCH',
          body: { quantity: qty },
        })
          .then(function (r) {
            renderCart(r);
            HTApi.refreshCartBadge();
          })
          .catch(function (err) {
            toast(err.message, 'warning');
            refresh();
          });
      });
    });

    host.querySelectorAll('[data-remove-line]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        HTApi.request('/api/cart/items/' + encodeURIComponent(btn.getAttribute('data-remove-line')), {
          method: 'DELETE',
        })
          .then(function (r) {
            renderCart(r);
            HTApi.refreshCartBadge();
            toast('Đã xóa khỏi giỏ.', 'info');
          })
          .catch(function (err) {
            toast(err.message, 'warning');
          });
      });
    });
  }

  function refresh() {
    return HTApi.getCart().then(renderCart);
  }

  function prefillShipping() {
    var user = window.HTEngagement && HTEngagement.getUser ? HTEngagement.getUser() : null;
    if (!user) return;
    var form = document.getElementById('checkout-order-form');
    if (!form) return;
    var name = form.querySelector('[name="name"]');
    var phone = form.querySelector('[name="phone"]');
    if (name && !name.value) name.value = user.name || '';
    if (phone && !phone.value) phone.value = user.phone || '';
  }

  function initCheckoutPage() {
    if (!document.getElementById('checkout-page')) return;

    var off = document.getElementById('checkout-api-off');
    if (!window.HTApi || !HTApi.enabled()) {
      if (off) off.classList.remove('d-none');
      var host = document.getElementById('checkout-cart-items');
      if (host) host.innerHTML = '<div class="card-body text-muted">API chưa bật.</div>';
      return;
    }

    if (window.HTEngagement && HTEngagement.syncSessionFromApi) {
      HTEngagement.syncSessionFromApi().then(prefillShipping);
    } else {
      prefillShipping();
    }

    refresh().then(function () {
      HTApi.refreshCartBadge();
    });

    var form = document.getElementById('checkout-order-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var btn = document.getElementById('checkout-submit-btn');
        if (btn) btn.disabled = true;
        HTApi.placeOrder({
          name: fd.get('name'),
          phone: fd.get('phone'),
          address: fd.get('address'),
          note: fd.get('note') || '',
        })
          .then(function (r) {
            var box = document.getElementById('checkout-success');
            if (box) {
              box.classList.remove('d-none');
              box.innerHTML =
                'Đặt hàng thành công! Mã đơn: <strong>' +
                escapeHtml(r.order.id) +
                '</strong>. Tổng: ' +
                formatMoney(r.order.total) +
                '. <a href="orders.html">Xem đơn hàng</a>';
            }
            toast('Đặt hàng thành công.', 'success');
            refresh();
            HTApi.refreshCartBadge();
          })
          .catch(function (err) {
            toast(err.message, 'warning');
            if (btn) btn.disabled = false;
          });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initCheckoutPage);
})();
