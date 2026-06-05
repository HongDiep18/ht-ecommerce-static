/**
 * Order history — logged-in users via HTApi.
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

  function initOrdersPage() {
    var host = document.getElementById('orders-list');
    if (!host) return;

    if (!window.HTApi || !HTApi.enabled()) {
      host.innerHTML =
        '<p class="alert alert-warning">Cần bật backend API. Xem <code>backend/README.md</code>.</p>';
      return;
    }

    if (!HTApi.getToken()) {
      host.innerHTML =
        '<p class="text-muted">Vui lòng <a href="/account/index.html">đăng nhập</a> để xem đơn hàng.</p>';
      return;
    }

    HTApi.getOrders()
      .then(function (r) {
        var orders = r.orders || [];
        if (!orders.length) {
          host.innerHTML = '<p class="text-muted">Chưa có đơn hàng nào.</p>';
          return;
        }
        host.innerHTML = orders
          .map(function (o) {
            var items = (o.items || [])
              .map(function (i) {
                return (
                  escapeHtml(i.name) +
                  ' ×' +
                  i.quantity +
                  ' (' +
                  formatMoney(i.priceNumber * i.quantity) +
                  ')'
                );
              })
              .join('<br>');
            return (
              '<div class="card border-0 shadow-sm mb-3">' +
              '<div class="card-body">' +
              '<div class="d-flex justify-content-between flex-wrap gap-2 mb-2">' +
              '<strong>' +
              escapeHtml(o.id) +
              '</strong>' +
              '<span class="badge bg-secondary">' +
              escapeHtml(o.status) +
              '</span></div>' +
              '<p class="small text-muted mb-1">' +
              escapeHtml(o.createdAt) +
              ' · COD · ' +
              formatMoney(o.total) +
              '</p>' +
              '<p class="small mb-2">' +
              items +
              '</p>' +
              '<p class="small mb-0 text-muted">' +
              escapeHtml((o.shipping && o.shipping.address) || '') +
              '</p></div></div>'
            );
          })
          .join('');
      })
      .catch(function (err) {
        host.innerHTML =
          '<p class="alert alert-danger">' + escapeHtml(err.message) + '</p>';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.HTEngagement && HTEngagement.syncSessionFromApi) {
      HTEngagement.syncSessionFromApi().then(initOrdersPage);
    } else {
      initOrdersPage();
    }
  });
})();
