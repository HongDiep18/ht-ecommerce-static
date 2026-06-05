/**
 * Accounts & engagement (client-side, localStorage).
 * Login/register, wishlist, compare, reviews, notification prefs.
 */
(function (global) {
  "use strict";

  var KEYS = {
    user: "ht_user",
    wishlist: "ht_wishlist",
    compare: "ht_compare",
    reviews: "ht_reviews",
    notifications: "ht_notifications",
  };

  var MAX_COMPARE = 4;

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    document.dispatchEvent(new CustomEvent("ht-engagement-change"));
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(message, type) {
    var el = document.getElementById("ht-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "ht-toast";
      el.className = "ht-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.className = "ht-toast ht-toast--" + (type || "info") + " ht-toast--show";
    el.textContent = message;
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove("ht-toast--show");
    }, 2800);
  }

  function normalizeProduct(p) {
    if (!p || !p.id) return null;
    return {
      id: p.id,
      name: p.name || "Sản phẩm",
      price: p.price || "Liên hệ",
      image: p.image || "",
      category: p.category || "",
      categoryUrl: p.categoryUrl || (window.HTShop && HTShop.paths ? HTShop.paths.shop.cuaHang : "/shop/cua-hang.html"),
    };
  }

  var store = {
    getUser: function () {
      return read(KEYS.user, null);
    },
    register: function (data) {
      if (global.HTApi && HTApi.enabled()) {
        return HTApi.register({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || "",
        })
          .then(function (r) {
            write(KEYS.user, r.user);
            return { ok: true, user: r.user };
          })
          .catch(function (err) {
            return { ok: false, message: err.message || "Đăng ký thất bại." };
          });
      }
      var users = read("ht_users", []);
      if (
        users.some(function (u) {
          return u.email === data.email;
        })
      ) {
        return { ok: false, message: "Email đã được đăng ký." };
      }
      var user = {
        id: "u_" + Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      write("ht_users", users);
      write(KEYS.user, user);
      return { ok: true, user: user };
    },
    login: function (email, password) {
      if (global.HTApi && HTApi.enabled()) {
        return HTApi.login(email, password)
          .then(function (r) {
            write(KEYS.user, r.user);
            return { ok: true, user: r.user };
          })
          .catch(function (err) {
            return { ok: false, message: err.message || "Đăng nhập thất bại." };
          });
      }
      var users = read("ht_users", []);
      var user = users.find(function (u) {
        return u.email === email;
      });
      if (!user) {
        return {
          ok: false,
          message: "Không tìm thấy tài khoản. Hãy đăng ký trước.",
        };
      }
      if (password && password.length < 4) {
        return { ok: false, message: "Mật khẩu tối thiểu 4 ký tự." };
      }
      write(KEYS.user, user);
      return { ok: true, user: user };
    },
    logout: function () {
      if (global.HTApi && HTApi.enabled()) HTApi.logout();
      localStorage.removeItem(KEYS.user);
      document.dispatchEvent(new CustomEvent("ht-engagement-change"));
    },
    syncSessionFromApi: function () {
      if (!global.HTApi || !HTApi.enabled() || !HTApi.getToken()) {
        return Promise.resolve(null);
      }
      return HTApi.me()
        .then(function (r) {
          if (r.user) write(KEYS.user, r.user);
          return r.user;
        })
        .catch(function () {
          HTApi.logout();
          localStorage.removeItem(KEYS.user);
          return null;
        });
    },
    getWishlist: function () {
      return read(KEYS.wishlist, []);
    },
    isInWishlist: function (id) {
      return store.getWishlist().some(function (p) {
        return p.id === id;
      });
    },
    toggleWishlist: function (product) {
      product = normalizeProduct(product);
      if (!product) return { ok: false };
      var list = store.getWishlist();
      var idx = list.findIndex(function (p) {
        return p.id === product.id;
      });
      if (idx >= 0) {
        list.splice(idx, 1);
        write(KEYS.wishlist, list);
        return { ok: true, added: false };
      }
      list.unshift(product);
      write(KEYS.wishlist, list);
      return { ok: true, added: true };
    },
    getCompare: function () {
      return read(KEYS.compare, []);
    },
    isInCompare: function (id) {
      return store.getCompare().some(function (p) {
        return p.id === id;
      });
    },
    addCompare: function (product) {
      product = normalizeProduct(product);
      if (!product) return { ok: false, message: "Sản phẩm không hợp lệ." };
      var list = store.getCompare();
      if (
        list.some(function (p) {
          return p.id === product.id;
        })
      ) {
        return { ok: true, message: "Sản phẩm đã có trong danh sách so sánh." };
      }
      if (list.length >= MAX_COMPARE) {
        return {
          ok: false,
          message: "Chỉ so sánh tối đa " + MAX_COMPARE + " sản phẩm.",
        };
      }
      list.push(product);
      write(KEYS.compare, list);
      return { ok: true, message: "Đã thêm vào so sánh." };
    },
    removeCompare: function (id) {
      var list = store.getCompare().filter(function (p) {
        return p.id !== id;
      });
      write(KEYS.compare, list);
    },
    clearCompare: function () {
      write(KEYS.compare, []);
    },
    getReviews: function (productId) {
      var all = read(KEYS.reviews, {});
      return all[productId] || [];
    },
    addReview: function (productId, review) {
      var all = read(KEYS.reviews, {});
      if (!all[productId]) all[productId] = [];
      all[productId].unshift({
        id: "r_" + Date.now(),
        name: review.name || "Khách",
        rating: Math.min(5, Math.max(1, Number(review.rating) || 5)),
        comment: review.comment || "",
        date: new Date().toISOString(),
      });
      write(KEYS.reviews, all);
    },
    getNotifications: function () {
      return read(KEYS.notifications, { promoEmail: false, stockAlerts: [] });
    },
    setPromoEmail: function (enabled, email) {
      var n = store.getNotifications();
      n.promoEmail = !!enabled;
      n.promoEmailAddress =
        email || (store.getUser() && store.getUser().email) || "";
      write(KEYS.notifications, n);
    },
    addStockAlert: function (productId, email) {
      var n = store.getNotifications();
      n.stockAlerts = n.stockAlerts || [];
      if (
        !n.stockAlerts.some(function (a) {
          return a.productId === productId && a.email === email;
        })
      ) {
        n.stockAlerts.push({
          productId: productId,
          email: email,
          createdAt: new Date().toISOString(),
        });
        write(KEYS.notifications, n);
        return true;
      }
      return false;
    },
    detailUrl: function (p) {
      var q = new URLSearchParams({
        id: p.id || "",
        name: p.name || "",
        price: p.price || "",
        image: p.image || "",
        category: p.category || "",
        categoryUrl: p.categoryUrl || "",
      });
      if (global.HTShop && HTShop.paths && HTShop.paths.productDetail) {
        return HTShop.paths.productDetail(p.id);
      }
      return "/shop/product.html?" + q.toString();
    },
  };

  function updateHeaderBadges() {
    var wishBadge = document.getElementById("ht-badge-wishlist");
    var compareBadge = document.getElementById("ht-badge-compare");
    var wishCount = store.getWishlist().length;
    var compareCount = store.getCompare().length;
    if (wishBadge) {
      wishBadge.textContent = wishCount;
      wishBadge.classList.toggle("d-none", wishCount === 0);
    }
    if (compareBadge) {
      compareBadge.textContent = compareCount;
      compareBadge.classList.toggle("d-none", compareCount === 0);
    }
  }

  function renderStars(rating) {
    var html = "";
    for (var i = 1; i <= 5; i++) {
      html +=
        '<i class="bi ' +
        (i <= rating ? "bi-star-fill text-warning" : "bi-star text-muted") +
        '"></i>';
    }
    return html;
  }

  function bindStarInput(container) {
    var input = container.querySelector('input[name="rating"]');
    if (!input) return;
    container.querySelectorAll("[data-star]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.getAttribute("data-star");
        input.value = val;
        container
          .querySelectorAll("[data-star] i")
          .forEach(function (icon, idx) {
            icon.className =
              "bi " +
              (idx < val ? "bi-star-fill text-warning" : "bi-star text-muted");
          });
      });
    });
  }

  function initProductDetailEngagement(product) {
    var page = document.getElementById("product-detail-page");
    if (!page || !product || !product.id) return;

    page.dataset.productId = product.id;

    var wishBtn = document.getElementById("ht-detail-wishlist");
    var compareBtn = document.getElementById("ht-detail-compare");
    function syncDetailButtons() {
      if (wishBtn) {
        var inWish = store.isInWishlist(product.id);
        wishBtn.classList.toggle("active", inWish);
        wishBtn.innerHTML =
          '<i class="bi ' +
          (inWish ? "bi-heart-fill" : "bi-heart") +
          ' me-1"></i>Yêu thích';
      }
      if (compareBtn) {
        compareBtn.classList.toggle("active", store.isInCompare(product.id));
      }
    }
    syncDetailButtons();

    if (wishBtn) {
      wishBtn.addEventListener("click", function () {
        var r = store.toggleWishlist(product);
        if (r.ok)
          toast(
            r.added ? "Đã thêm vào yêu thích." : "Đã xóa khỏi yêu thích.",
            "success",
          );
        syncDetailButtons();
        updateHeaderBadges();
      });
    }
    if (compareBtn) {
      compareBtn.addEventListener("click", function () {
        var r = store.addCompare(product);
        toast(
          r.message || (r.ok ? "Đã thêm so sánh." : "Không thêm được."),
          r.ok ? "success" : "warning",
        );
        syncDetailButtons();
        updateHeaderBadges();
      });
    }

    var reviewsList = document.getElementById("ht-reviews-list");
    var reviewsSummary = document.getElementById("ht-reviews-summary");
    var reviews = store.getReviews(product.id);
    if (!reviews.length) {
      store.addReview(product.id, {
        name: "Lan Anh",
        rating: 5,
        comment: "Đi êm chân, form đẹp, giao nhanh. Rất hài lòng!",
      });
      store.addReview(product.id, {
        name: "Minh Tuấn",
        rating: 4,
        comment: "Chất liệu ổn, đúng size. Sẽ mua thêm.",
      });
      reviews = store.getReviews(product.id);
    }
    var avg =
      reviews.reduce(function (s, r) {
        return s + r.rating;
      }, 0) / reviews.length;
    if (reviewsSummary) {
      reviewsSummary.innerHTML =
        '<span class="ht-rating-avg">' +
        avg.toFixed(1) +
        "</span> " +
        renderStars(Math.round(avg)) +
        ' <span class="text-muted small">(' +
        reviews.length +
        " đánh giá)</span>";
    }
    if (reviewsList) {
      reviewsList.innerHTML = reviews
        .map(function (r) {
          return (
            '<div class="border-bottom pb-3 mb-3">' +
            '<div class="d-flex justify-content-between align-items-start">' +
            "<strong>" +
            escapeHtml(r.name) +
            "</strong>" +
            '<span class="text-muted small">' +
            new Date(r.date).toLocaleDateString("vi-VN") +
            "</span></div>" +
            '<div class="my-1">' +
            renderStars(r.rating) +
            "</div>" +
            '<p class="mb-0 text-muted">' +
            escapeHtml(r.comment) +
            "</p></div>"
          );
        })
        .join("");
    }

    var reviewForm = document.getElementById("ht-review-form");
    if (reviewForm) {
      bindStarInput(reviewForm);
      reviewForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var user = store.getUser();
        var fd = new FormData(reviewForm);
        store.addReview(product.id, {
          name: user ? user.name : fd.get("name") || "Khách",
          rating: fd.get("rating"),
          comment: fd.get("comment"),
        });
        toast("Cảm ơn bạn đã đánh giá!", "success");
        reviewForm.reset();
        initProductDetailEngagement(product);
      });
    }

    var stockForm = document.getElementById("ht-stock-alert-form");
    if (stockForm) {
      stockForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = stockForm.querySelector('[name="email"]').value.trim();
        if (!email) {
          toast("Vui lòng nhập email.", "warning");
          return;
        }
        if (store.addStockAlert(product.id, email)) {
          toast("Đã đăng ký thông báo khi có hàng.", "success");
        } else {
          toast("Bạn đã đăng ký thông báo cho sản phẩm này.", "info");
        }
      });
      var user = store.getUser();
      if (user && user.email) {
        var em = stockForm.querySelector('[name="email"]');
        if (em) em.value = user.email;
      }
    }
  }

  function injectCardActions() {
    document
      .querySelectorAll(
        ".product-list .card, .products-wrapper .product-card, #site-search-page-results a.card"
      )
      .forEach(function (card) {
        if (card.querySelector(".ht-card-actions")) return;
        card.classList.add("position-relative");
        var wrap = document.createElement("div");
        wrap.className = "ht-card-actions";
        wrap.innerHTML =
          '<button type="button" class="btn btn-light btn-sm rounded-circle ht-action-btn ht-wishlist-btn" title="Yêu thích" aria-label="Yêu thích"><i class="bi bi-heart"></i></button>' +
          '<button type="button" class="btn btn-light btn-sm rounded-circle ht-action-btn ht-compare-btn" title="So sánh" aria-label="So sánh"><i class="bi bi-sliders"></i></button>';
        card.appendChild(wrap);
      });
  }

  function extractProductFromCard(card) {
    if (!card || !global.extractProductForEngagement) return null;
    return global.extractProductForEngagement(card);
  }

  function initCardActionClicks() {
    document.addEventListener("click", function (e) {
      var wishBtn = e.target.closest(".ht-wishlist-btn");
      var compareBtn = e.target.closest(".ht-compare-btn");
      if (!wishBtn && !compareBtn) return;
      e.preventDefault();
      e.stopPropagation();
      var card = (wishBtn || compareBtn).closest(".card, .product-card");
      var product = extractProductFromCard(card);
      if (!product && document.getElementById("product-detail-page")) {
        product = {
          id: document.getElementById("product-detail-page").dataset.productId,
          name: document.getElementById("product-detail-name").textContent,
          price: document.getElementById("product-detail-price").textContent,
          image: document.getElementById("product-detail-image").src,
          category: document.getElementById("product-detail-category")
            .textContent,
          categoryUrl: document.getElementById("product-detail-back-link").href,
        };
      }
      if (!product || !product.id) return;
      if (wishBtn) {
        var r = store.toggleWishlist(product);
        if (r.ok) {
          toast(
            r.added ? "Đã thêm yêu thích." : "Đã xóa yêu thích.",
            "success",
          );
          var icon = wishBtn.querySelector("i");
          if (icon)
            icon.className =
              "bi " +
              (store.isInWishlist(product.id)
                ? "bi-heart-fill text-danger"
                : "bi-heart");
        }
        updateHeaderBadges();
      }
      if (compareBtn) {
        var cr = store.addCompare(product);
        toast(
          cr.message || (cr.ok ? "Đã thêm so sánh." : "Lỗi"),
          cr.ok ? "success" : "warning",
        );
        updateHeaderBadges();
      }
    });
  }

  function whenHeaderReady(cb) {
    if (document.getElementById("ht-badge-wishlist")) {
      cb();
      return;
    }
    var header = document.getElementById("header");
    if (!header) return;
    var obs = new MutationObserver(function () {
      if (document.getElementById("ht-badge-wishlist")) {
        obs.disconnect();
        cb();
      }
    });
    obs.observe(header, { childList: true, subtree: true });
  }

  function initAccountPage() {
    var host = document.getElementById("account-page");
    if (!host) return;

    var user = store.getUser();
    var guestPanel = document.getElementById("account-guest");
    var userPanel = document.getElementById("account-user");
    var loginForm = document.getElementById("ht-login-form");
    var registerForm = document.getElementById("ht-register-form");
    var notifForm = document.getElementById("ht-notif-form");
    if (!guestPanel || !userPanel) return;

    function refreshPanels() {
      user = store.getUser();
      if (user) {
        guestPanel.classList.add("d-none");
        userPanel.classList.remove("d-none");
        document.getElementById("account-user-name").textContent = user.name;
        document.getElementById("account-user-email").textContent = user.email;
        var n = store.getNotifications();
        var promo = document.getElementById("ht-promo-email");
        if (promo) promo.checked = !!n.promoEmail;
      } else {
        guestPanel.classList.remove("d-none");
        userPanel.classList.add("d-none");
      }
    }
    refreshPanels();

    function handleAuthResult(r) {
      if (r && r.then) {
        r.then(function (res) {
          if (res.ok) {
            toast("Thành công.", "success");
            refreshPanels();
          } else toast(res.message, "warning");
        });
        return;
      }
      if (r.ok) {
        toast("Thành công.", "success");
        refreshPanels();
      } else toast(r.message, "warning");
    }

    store.syncSessionFromApi().then(refreshPanels);

    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(loginForm);
        handleAuthResult(store.login(fd.get("email"), fd.get("password")));
      });
    }
    if (registerForm) {
      registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(registerForm);
        handleAuthResult(
          store.register({
            name: fd.get("name"),
            email: fd.get("email"),
            phone: fd.get("phone"),
            password: fd.get("password"),
          }),
        );
      });
    }
    var logoutBtn = document.getElementById("ht-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        store.logout();
        toast("Đã đăng xuất.", "info");
        refreshPanels();
      });
    }
    if (notifForm) {
      var n = store.getNotifications();
      var promo = document.getElementById("ht-promo-email");
      if (promo) promo.checked = !!n.promoEmail;
      notifForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = notifForm.querySelector('[name="email"]').value.trim();
        store.setPromoEmail(
          document.getElementById("ht-promo-email").checked,
          email,
        );
        toast("Đã lưu cài đặt thông báo.", "success");
      });
    }
  }

  function initWishlistPage() {
    var host = document.getElementById("wishlist-page");
    if (!host) return;
    var list = store.getWishlist();
    var container = document.getElementById("wishlist-items");
    if (!list.length) {
      container.innerHTML =
        '<p class="text-muted">Chưa có sản phẩm yêu thích. Hãy bấm <i class="bi bi-heart"></i> trên sản phẩm để lưu.</p>';
      return;
    }
    container.innerHTML =
      '<div class="row g-3">' +
      list
        .map(function (p) {
          return (
            '<div class="col-6 col-md-4 col-lg-3">' +
            '<div class="card h-100 shadow-sm">' +
            '<img src="' +
            escapeHtml(p.image) +
            '" class="card-img-top" alt="" style="height:180px;object-fit:cover">' +
            '<div class="card-body d-flex flex-column">' +
            '<p class="small fw-semibold flex-grow-1">' +
            escapeHtml(p.name) +
            "</p>" +
            '<p class="text-danger fw-bold small">' +
            escapeHtml(p.price) +
            "</p>" +
            '<div class="d-flex gap-1">' +
            '<a class="btn btn-sm btn-danger flex-grow-1" href="' +
            store.detailUrl(p) +
            '">Xem chi tiết</a>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary ht-remove-wish" data-id="' +
            escapeHtml(p.id) +
            '"><i class="bi bi-trash"></i></button>' +
            "</div></div></div></div>"
          );
        })
        .join("") +
      "</div>";
    container.querySelectorAll(".ht-remove-wish").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var item = list.find(function (p) {
          return p.id === id;
        });
        if (item) store.toggleWishlist(item);
        initWishlistPage();
        updateHeaderBadges();
        toast("Đã xóa khỏi yêu thích.", "info");
      });
    });
  }

  function initComparePage() {
    var host = document.getElementById("compare-page");
    if (!host) return;
    var list = store.getCompare();
    var container = document.getElementById("compare-table-wrap");
    if (!list.length) {
      container.innerHTML =
        '<p class="text-muted">Chưa có sản phẩm so sánh. Bấm <i class="bi bi-sliders"></i> trên thẻ sản phẩm (tối đa ' +
        MAX_COMPARE +
        ").</p>";
      return;
    }
    var rows = [
      { label: "Hình ảnh", key: "image", isImg: true },
      { label: "Tên", key: "name" },
      { label: "Giá", key: "price" },
      { label: "Danh mục", key: "category" },
    ];
    var html =
      '<div class="table-responsive"><table class="table table-bordered align-middle ht-compare-table"><thead><tr><th></th>';
    list.forEach(function (p) {
      html +=
        '<th class="text-center" style="min-width:160px">' +
        escapeHtml(p.name) +
        '<button type="button" class="btn btn-sm btn-link text-danger d-block mx-auto ht-remove-compare" data-id="' +
        escapeHtml(p.id) +
        '">Xóa</button></th>';
    });
    html += "</tr></thead><tbody>";
    rows.forEach(function (row) {
      html += "<tr><th>" + row.label + "</th>";
      list.forEach(function (p) {
        if (row.isImg) {
          html +=
            '<td class="text-center"><img src="' +
            escapeHtml(p.image) +
            '" alt="" style="height:100px;object-fit:contain"></td>';
        } else {
          html += "<td>" + escapeHtml(p[row.key] || "—") + "</td>";
        }
      });
      html += "</tr>";
    });
    html += "<tr><th></th>";
    list.forEach(function (p) {
      html +=
        '<td class="text-center"><a class="btn btn-sm btn-danger" href="' +
        store.detailUrl(p) +
        '">Chi tiết</a></td>';
    });
    html += "</tr></tbody></table></div>";
    container.innerHTML = html;
    container.querySelectorAll(".ht-remove-compare").forEach(function (btn) {
      btn.addEventListener("click", function () {
        store.removeCompare(btn.getAttribute("data-id"));
        initComparePage();
        updateHeaderBadges();
      });
    });
  }

  function initGlobal() {
    whenHeaderReady(updateHeaderBadges);
    document.addEventListener("ht-engagement-change", updateHeaderBadges);
    injectCardActions();
    initCardActionClicks();
    initAccountPage();
    initWishlistPage();
    initComparePage();
    document.addEventListener('ht-cards-updated', injectCardActions);
    document.addEventListener("ht-product-loaded", function (e) {
      if (e.detail) initProductDetailEngagement(e.detail);
    });
  }

  global.HTEngagement = store;
  global.HTEngagement.toast = toast;
  global.HTEngagement.updateHeaderBadges = updateHeaderBadges;
  global.HTEngagement.refreshCardActions = injectCardActions;

  document.addEventListener("DOMContentLoaded", initGlobal);
})(window);
