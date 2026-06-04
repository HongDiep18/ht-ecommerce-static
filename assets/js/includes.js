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

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () {
        reject(new Error('Failed to load ' + src));
      };
      document.head.appendChild(s);
    });
  }

  /** Loads ht-api-config.js + api-client.js (for cart badge, admin, checkout). */
  function loadApiClient() {
    return loadScript('assets/js/ht-api-config.js').then(function () {
      return loadScript('assets/js/api-client.js');
    });
  }

  global.HTShop = {
    loadPartial: loadPartial,
    loadScript: loadScript,
    loadApiClient: loadApiClient,
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
