'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const REDIRECTS = {
  'giayNam.html': '/shop/catalog.html?cat=nam',
  'giayNu.html': '/shop/catalog.html?cat=nu',
  'giayTreEm.html': '/shop/catalog.html?cat=tre-em',
  'giaySales.html': '/shop/catalog.html?cat=sale',
  'phuKien.html': '/shop/catalog.html?cat=phu-kien',
  'cuahang.html': '/shop/cua-hang.html',
  'product-detail.html': '/shop/product.html',
  'search.html': '/shop/search.html',
  'account.html': '/account/index.html',
  'wishlist.html': '/account/wishlist.html',
  'compare.html': '/account/compare.html',
  'checkout.html': '/account/checkout.html',
  'orders.html': '/account/orders.html',
  'admin.html': '/admin/index.html',
  'introduce.html': '/content/gioi-thieu.html',
  'log.html': '/content/blog.html',
};

const CATEGORY_URL_MAP = {
  'giayNam.html': '/shop/catalog.html?cat=nam',
  'giayNu.html': '/shop/catalog.html?cat=nu',
  'giayTreEm.html': '/shop/catalog.html?cat=tre-em',
  'giaySales.html': '/shop/catalog.html?cat=sale',
  'phuKien.html': '/shop/catalog.html?cat=phu-kien',
  'cuahang.html': '/shop/cua-hang.html',
  'index.html': '/index.html',
};

function redirectHtml(target) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${target}">
  <script>location.replace(${JSON.stringify(target)});</script>
  <title>Redirect</title>
</head>
<body><p>Đang chuyển… <a href="${target}">Tiếp tục</a></p></body>
</html>
`;
}

function toRootAssets(html) {
  return html
    .replace(/href="assets\//g, 'href="/assets/')
    .replace(/src="assets\//g, 'src="/assets/')
    .replace(/href='assets\//g, "href='/assets/")
    .replace(/src='assets\//g, "src='/assets/");
}

function movePage(src, dest) {
  const srcPath = path.join(ROOT, src);
  const destPath = path.join(ROOT, dest);
  if (!fs.existsSync(srcPath)) {
    console.warn('skip missing', src);
    return;
  }
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  let html = fs.readFileSync(srcPath, 'utf8');
  html = toRootAssets(html);
  fs.writeFileSync(destPath, html, 'utf8');
  console.log('moved', src, '->', dest);
}

// Redirect stubs at old locations
for (const [file, target] of Object.entries(REDIRECTS)) {
  fs.writeFileSync(path.join(ROOT, file), redirectHtml(target), 'utf8');
}

// products.json categoryUrl
const productsPath = path.join(ROOT, 'assets', 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
for (const p of products) {
  if (p.categoryUrl && CATEGORY_URL_MAP[p.categoryUrl]) {
    p.categoryUrl = CATEGORY_URL_MAP[p.categoryUrl];
  }
}
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n', 'utf8');
console.log('updated products.json');

// Archive legacy
const archiveDir = path.join(ROOT, '_archive');
fs.mkdirSync(archiveDir, { recursive: true });
for (const f of ['starter-page.html', 'portfolio-details.html', 'service-details.html']) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    fs.renameSync(p, path.join(archiveDir, f));
    console.log('archived', f);
  }
}

console.log('done — run after creating shop/account/admin/content pages');
