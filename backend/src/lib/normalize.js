'use strict';

function parsePrice(str) {
  if (typeof str === 'number' && !isNaN(str)) return str;
  const n = parseInt(String(str || '').replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function formatPrice(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

function normalizeProduct(raw) {
  if (!raw || !raw.id) return null;
  const p = { ...raw };
  p.brand = p.brand || 'Hồng Thạnh';
  p.keywords = p.keywords || '';
  p.imageHover = p.imageHover || p.image || '';

  if (!Array.isArray(p.variants) || !p.variants.length) {
    const base = parsePrice(p.price);
    p.variants = [
      {
        sku: p.id + '-default',
        size: '39',
        color: 'Mặc định',
        colorHex: '#333333',
        price: p.price || formatPrice(base),
        priceNumber: base,
        stock: typeof p.stock === 'number' ? p.stock : 10,
      },
    ];
  } else {
    p.variants = p.variants.map((v, i) => {
      const pn = v.priceNumber != null ? v.priceNumber : parsePrice(v.price);
      return {
        sku: v.sku || p.id + '-v' + i,
        size: String(v.size || '39'),
        color: v.color || 'Mặc định',
        colorHex: v.colorHex || '#333',
        price: v.price || formatPrice(pn),
        priceNumber: pn,
        stock: typeof v.stock === 'number' ? v.stock : 0,
      };
    });
  }

  const prices = p.variants.map((v) => v.priceNumber);
  p.priceNumber = Math.min(...prices);
  p.priceMaxNumber = Math.max(...prices);
  if (!p.price) p.price = formatPrice(p.priceNumber);
  if (p.salePriceNumber && p.salePriceNumber < p.priceNumber) {
    p.priceNumber = p.salePriceNumber;
    p.price = formatPrice(p.salePriceNumber);
  }
  return p;
}

function matchCategory(product, categoryFilter) {
  if (!categoryFilter || categoryFilter === 'all') return true;
  return (product.category || '') === categoryFilter;
}

function filterAndSort(products, opts = {}) {
  let list = products.slice();

  if (opts.category) {
    list = list.filter((p) => matchCategory(p, opts.category));
  }
  if (opts.brand) list = list.filter((p) => p.brand === opts.brand);
  if (opts.size) {
    list = list.filter((p) =>
      p.variants.some((v) => v.size === opts.size && v.stock > 0)
    );
  }
  if (opts.priceMin != null && opts.priceMin !== '') {
    const min = Number(opts.priceMin);
    list = list.filter((p) => p.priceNumber >= min);
  }
  if (opts.priceMax != null && opts.priceMax !== '') {
    const max = Number(opts.priceMax);
    list = list.filter((p) => p.priceNumber <= max);
  }
  if (opts.inStockOnly) {
    list = list.filter((p) => p.variants.some((v) => v.stock > 0));
  }
  if (opts.q) {
    const nq = String(opts.q).toLowerCase();
    list = list.filter((p) => {
      const blob = [p.name, p.brand, p.category, p.keywords].join(' ').toLowerCase();
      return blob.includes(nq);
    });
  }

  const sort = opts.sort || 'newest';
  list.sort((a, b) => {
    if (sort === 'price-asc') return a.priceNumber - b.priceNumber;
    if (sort === 'price-desc') return b.priceNumber - a.priceNumber;
    if (sort === 'name') return a.name.localeCompare(b.name, 'vi');
    return (b.id || '').localeCompare(a.id || '');
  });

  return list;
}

function paginate(list, page, perPage = 12) {
  page = Math.max(1, parseInt(page, 10) || 1);
  perPage = perPage || 12;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = page > totalPages ? totalPages : page;
  const start = (safePage - 1) * perPage;
  return {
    items: list.slice(start, start + perPage),
    page: safePage,
    perPage,
    total,
    totalPages,
  };
}

function getBrands(products) {
  const set = {};
  products.forEach((p) => {
    if (p.brand) set[p.brand] = true;
  });
  return Object.keys(set).sort();
}

function getSizes(products) {
  const set = {};
  products.forEach((p) => {
    p.variants.forEach((v) => {
      set[v.size] = true;
    });
  });
  return Object.keys(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

module.exports = {
  parsePrice,
  formatPrice,
  normalizeProduct,
  matchCategory,
  filterAndSort,
  paginate,
  getBrands,
  getSizes,
};
