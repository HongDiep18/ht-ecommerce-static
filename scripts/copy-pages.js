'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function fix(html) {
  return html
    .replace(/href="assets\//g, 'href="/assets/')
    .replace(/src="assets\//g, 'src="/assets/');
}

function injectPaths(html) {
  if (html.includes('paths.js')) return html;
  return html
    .replace(
      '<script src="/assets/js/includes.js"></script>',
      '<script src="/assets/js/paths.js"></script>\n  <script src="/assets/js/includes.js"></script>'
    )
    .replace(
      '<script src="assets/js/includes.js"></script>',
      '<script src="/assets/js/paths.js"></script>\n  <script src="/assets/js/includes.js"></script>'
    );
}

const moves = [
  ['product-detail.html', 'shop/product.html'],
  ['search.html', 'shop/search.html'],
  ['account.html', 'account/index.html'],
  ['wishlist.html', 'account/wishlist.html'],
  ['compare.html', 'account/compare.html'],
  ['checkout.html', 'account/checkout.html'],
  ['orders.html', 'account/orders.html'],
  ['admin.html', 'admin/index.html'],
  ['introduce.html', 'content/gioi-thieu.html'],
  ['log.html', 'content/blog.html'],
];

for (const [src, dest] of moves) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(ROOT, dest);
  if (!fs.existsSync(srcPath)) {
    console.warn('missing', src);
    continue;
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  let html = injectPaths(fix(fs.readFileSync(srcPath, 'utf8')));
  fs.writeFileSync(destPath, html, 'utf8');
  console.log('copied', dest);
}
