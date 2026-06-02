const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pages = [
  { file: 'giayNam.html', category: 'Giày nam', title: 'Giày Nam' },
  { file: 'giayNu.html', category: 'Giày nữ', title: 'Giày Nữ' },
  { file: 'giayTreEm.html', category: 'Giày trẻ em', title: 'Giày Trẻ Em' },
  { file: 'giaySales.html', category: 'Sale', title: 'Sale' },
  { file: 'phuKien.html', category: 'Phụ kiện', title: 'Phụ Kiện' },
  { file: 'cuahang.html', category: 'all', title: 'Cửa Hàng' }
];

for (const p of pages) {
  const fp = path.join(root, p.file);
  let html = fs.readFileSync(fp, 'utf8');
  const start = html.indexOf('<!-- 3. Grid');
  const end = html.indexOf('<!-- ========== Shared Nam');
  if (start === -1 || end === -1) {
    console.log('skip', p.file);
    continue;
  }
  const block =
    '    <div id="catalog-placeholder" data-catalog-category="' +
    p.category +
    '" data-catalog-title="' +
    p.title +
    '"></div>\n';
  html = html.slice(0, start) + block + html.slice(end);
  if (!html.includes('catalog-core.js')) {
    html = html.replace(
      '<script src="assets/js/site-search.js"></script>',
      '<script src="assets/js/site-search.js"></script>\n    <script src="assets/js/catalog-core.js"></script>\n    <script src="assets/js/catalog-page.js"></script>'
    );
  }
  fs.writeFileSync(fp, html);
  console.log('updated', p.file);
}
