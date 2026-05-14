/**
 * Loads shared HTML fragments (header, footer, optional layout blocks).
 * Include once in <head>: <script src="assets/js/includes.js"></script>
 * Then call HTShop.loadHeader() / HTShop.loadFooter() right after each placeholder element.
 */
(function (global) {
  'use strict';

  function loadPartial(elementId, path) {
    var el = document.getElementById(elementId);
    if (!el) {
      return Promise.resolve();
    }
    return fetch(path)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ' for ' + path);
        }
        return res.text();
      })
      .then(function (html) {
        el.innerHTML = html;
      });
  }

  global.HTShop = {
    loadPartial: loadPartial,
    loadHeader: function () {
      return loadPartial('header', 'partials/header.html');
    },
    loadFooter: function () {
      return loadPartial('footer', 'partials/footer.html');
    },
    loadLayoutCommon: function () {
      return loadPartial('layoutCommon', 'partials/commonNamNu.html');
    }
  };
})(typeof window !== 'undefined' ? window : this);
