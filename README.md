# ht-ecommerce-static

Multi-page storefront website for footwear and accessories. Content and navigation are primarily in Vietnamese. The site reuses shared **header** and **footer** fragments loaded at runtime, and ships with optional **PHP** endpoints for contact and newsletter forms.

---

## Introduction project

### Homepage

The **homepage** (`index.html`) is one long scroll: the same header and hotline appear as you move through the hero, product carousels, and promotional blocks. The screenshots below show two parts of that same page.

**Hero (top of page)** — branding, search, utilities, and main nav; seasonal hero (**“Nhẹ êm đón Hè”**) with featured shoes and lifestyle imagery.

![HT Shop homepage — hero: Hồng Thạnh header, navigation, and summer campaign](docs/readme-homepage.png)

Across the top, **Hồng Thạnh** (HT) uses the logo on the left, a rounded **search** bar in the center, and icons for Facebook, TikTok, account, and **cart**. The menu is in Vietnamese (**TRANG CHỦ**, **CỬA HÀNG**, **GIỚI THIỆU**, **GIÀY NỮ** / **NAM** / **TRẺ EM**, **SALE**, **PHỤ KIỆN GIÀY DÉP**), with the active item highlighted. Below that, the hero spotlights summer comfort copy and product photography on a light layout.

**Further down the homepage** — category product rails (example: **“SẢN PHẨM NAM MỚI NHẤT”** / latest men’s products) with a horizontal carousel: shoe cards, names, prices in **đ** (Vietnamese đồng), prev/next controls, and dots for slides. A wide **promotional banner** pairs product close-ups with lifestyle imagery; the **hotline** bar stays visible, along with **scroll-to-top** and a floating **chat** entry point.

![HT Shop homepage — product carousel (latest men’s products), banner strip, and hotline](docs/readme-homepage-products.png)

- **What it is:** A static HTML/CSS/JavaScript front end built on the [BootstrapMade Bikin](https://bootstrapmade.com/bikin-free-simple-landing-page-template/) template (Bootstrap **5.3.3**), customized for a shoe shop (menus for men’s/women’s/kids’ shoes, sales, accessories, store locator, blog-style pages).
- **Main entry:** Open `index.html` in a browser **via a local HTTP server** (see [Tutorial](#tutorial)) so `fetch()` can load `partials/header.html` and `partials/footer.html`.
- **Key pages (examples):**
  - `index.html` — home
  - `shop/cua-hang.html` — store hub
  - `shop/catalog.html?cat=nam|nu|…` — category listings (one template)
  - `shop/product.html`, `shop/search.html` — detail & search
  - `account/*` — login, wishlist, compare, checkout, orders
  - `admin/index.html` — product admin
  - `content/gioi-thieu.html`, `content/blog.html` — about & articles
  - Old root URLs (`giayNam.html`, etc.) redirect to the new paths

---

## Tech stack (detail)

### Core

| Layer          | Technology                                             | Notes                                                                                                              |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Markup**     | HTML5                                                  | Multiple `.html` pages; no SPA framework.                                                                          |
| **Styling**    | CSS3, **Bootstrap 5.3.3**                              | Grid, utilities, components, RTL variants present under `assets/vendor/bootstrap/`.                                |
| **Icons**      | **Bootstrap Icons**, **Font Awesome 6** (CDN in pages) | Mix of `bi-*` and Font Awesome classes.                                                                            |
| **Typography** | **Google Fonts**                                       | Roboto, Lato, Nunito (linked from `fonts.googleapis.com`).                                                         |
| **Scripting**  | **Vanilla JavaScript**                                 | `assets/js/main.js` (template behaviors), `header.js`, `cuahang.js`, inline scripts on some pages.                 |
| **Partials**   | `includes.js` + `fetch()`                              | `HTShop.loadHeader()` / `loadFooter()` load `partials/*.html`; **requires HTTP(S)** (not reliable with `file://`). |
| **Search**     | `site-search.js` + `products.json`                     | Client-side catalog filter; results on `search.html` (no backend).                                                 |

### Third-party libraries (vendored under `assets/vendor/`)

| Library                                   | Role                                                |
| ----------------------------------------- | --------------------------------------------------- |
| **Bootstrap** (`bootstrap.bundle.min.js`) | JS for dropdowns, modals, carousel, collapse, etc.  |
| **AOS**                                   | Animate-on-scroll for sections.                     |
| **Swiper**                                | Touch-friendly sliders/carousels.                   |
| **GLightbox**                             | Image/media lightbox.                               |
| **Isotope** + **imagesLoaded**            | Filterable/masonry-style layouts after images load. |
| **php-email-form** (`validate.js`)        | Client-side validation wired to PHP form endpoints. |

### Optional backend

| Piece   | Role                                                                                                                                                                                                                                      |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PHP** | `forms/contact.php`, `forms/newsletter.php` process POST data and send mail via the **PHP Email Form** helper expected at `assets/vendor/php-email-form/php-email-form.php` (BootstrapMade pro asset; see comments inside the PHP files). |

### Source assets

| Path           | Purpose                                                                      |
| -------------- | ---------------------------------------------------------------------------- |
| `assets/css/`  | Compiled/custom styles (`main.css`, page-specific CSS).                      |
| `assets/scss/` | SCSS sources / readme for theme customization (if you compile SCSS locally). |
| `assets/data/` | `products.json` — searchable product catalog for the header search.          |

### Backend API (optional)

| Piece        | Path                         | Notes                                             |
| ------------ | ---------------------------- | ------------------------------------------------- |
| **Node API** | `backend/`                   | Express + SQLite — products, auth, cart, orders   |
| **Config**   | `assets/js/ht-api-config.js` | Sets `HT_API_BASE` (e.g. `http://localhost:3001`) |
| **Client**   | `assets/js/api-client.js`    | `HTApi.*` helpers + JWT / guest session           |

See **`backend/README.md`** for install (`npm install`, `npm run seed`, `npm run dev`) and endpoint list. Run the static site and API on two ports (e.g. PHP `8080` + API `3001`).

### What this project does **not** include (yet)

- No payment gateway integration (MoMo, VNPay, etc.).
- No **React**, **Vue**, **Angular**, or similar SPA framework.
- No server-side rendering framework; pages are plain HTML unless you add your own stack.

---

## Tutorial

### 1. Run the site locally (recommended)

Because the header and footer are loaded with `fetch('partials/...')`, you should serve the project root over **HTTP**.

**Option A — PHP built-in server** (good if you also want to test forms):

```bash
cd path/to/HT_Shop
php -S localhost:8080
```

Then open `http://localhost:8080/index.html` in your browser.

**Option A2 — With backend API** (catalog, cart, orders, real login):

```bash
# Terminal 1 — static site
cd path/to/HT_Shop
php -S localhost:8080

# Terminal 2 — API
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

Ensure `assets/js/ht-api-config.js` sets `HT_API_BASE = 'http://localhost:3001'`. Open `giayNam.html`, `checkout.html`, or `account.html` to test.

**Option B — Any static file server** (header/footer only; forms will not work without PHP):

Examples: `npx serve .`, Python `python -m http.server 8080`, or IIS/XAMPP pointing at this folder.

### 2. Edit global layout (header / footer)

1. Open `partials/header.html` for navigation, logo, and top bar.
2. Open `partials/footer.html` for the site footer.
3. Reload any page that includes the `fetch` scripts; changes apply to all pages that load those partials.

**Note:** Some links in the header use absolute paths like `/index.html`. On a local server, ensure the site is served from the **root** of that server (or adjust links to relative paths such as `index.html` if you deploy in a subfolder).

### Product search (client-side)

- The header search box loads `assets/js/site-search.js` and reads the catalog **`assets/data/products.json`** (no server database).
- While typing, a short suggestion list appears; **Enter** or the search icon opens **`search.html?q=…`** with a full grid of matches.
- Matching is case-insensitive and strips most combining accents so queries like `dep` can match **Dép**.
- To add or change products: use **`admin.html`** (API mode with backend, or localStorage offline), or edit **`assets/data/products.json`** and run `npm run seed` in `backend/`.

### HTML page organization

- **Shop pages** (`index.html`, `search.html`, `introduce.html`, `log.html`, `cuahang.html`, `giay*.html`, `phuKien.html`) share one layout rhythm:
  1. `<head>` — meta → favicons → fonts → Font Awesome → vendor CSS → `main.css` (+ page CSS) → **`assets/js/includes.js`**
  2. **Site header** — empty `<header id="header">` then `<script>HTShop.loadHeader();</script>` (loads `partials/header.html`)
  3. **Page body** — content only, introduced with `<!-- ========== Page: … ========== -->`
  4. **Optional** — `<div id="layoutCommon">` + `HTShop.loadLayoutCommon()` for `partials/commonNamNu.html` (store + category listing pages)
  5. **Site footer** — `<footer id="footer">` then `HTShop.loadFooter();`
  6. **Scripts** — vendor bundle → `header.js` → (`ht-api-config.js`, `api-client.js` when using API) → `site-search.js` → `catalog-core.js` / `engagement.js` as needed → `main.js`
- **Legacy/template-only pages** (`starter-page.html`, `portfolio-details.html`, `service-details.html`) still use the old embedded header pattern from the BootstrapMade template; new storefront pages should copy a refactored shop page instead.

### 3. Add or change a page

1. Copy a refactored shop page (**`introduce.html`**, **`giayNam.html`**, or **`search.html`**) instead of `starter-page.html` if you need the shared header, footer, and search.
2. Keep the same `<head>` vendor CSS order as other pages for consistent styling.
3. Include the same vendor JS at the bottom (`bootstrap.bundle`, `main.js`, etc.) as `index.html` unless you know you can omit a library.
4. Keep **`assets/js/includes.js`** in `<head>` and call **`HTShop.loadHeader()`** / **`HTShop.loadFooter()`** after the placeholders; include **`assets/js/site-search.js`** immediately after **`header.js`** when the search box is present.

### 4. Styling

- Global rules: `assets/css/main.css`.
- Page-specific: e.g. `assets/css/cuahang.css`, `assets/css/log.css`.
- If you maintain SCSS, compile into `assets/css/` and keep class names aligned with Bootstrap where possible.

### 5. Contact and newsletter forms

1. Ensure **PHP** is enabled on your host.
2. In `forms/contact.php` (and similarly `forms/newsletter.php`), set `$receiving_email_address` to your real inbox.
3. Add `assets/vendor/php-email-form/php-email-form.php` if you use BootstrapMade’s PHP Email Form library, or replace the scripts with your own mail/API logic.
4. For **SMTP**, uncomment and fill the `$contact->smtp` block in the PHP file as documented there.

### 6. Product admin

1. Open **`admin.html`**.
2. If using the API: run `backend` (`npm run dev`), set **`HT_API_BASE`** in `assets/js/ht-api-config.js`, enter **Admin API key** (same as `ADMIN_API_KEY` in `backend/.env`, default `ht-admin-dev-key`) → **Lưu key**.
3. Green banner = changes save to **SQLite** for all visitors after reload.
4. Blue banner = **localStorage** only in that browser; use **Tải JSON** to update `assets/data/products.json` manually.
5. **Khôi phục từ products.json** reloads the seed file into the DB (API) or clears the browser override (offline).

### 7. Deploy

#### Static storefront only

- Upload the project root to any static host (IIS static site, nginx, Apache, S3 + CloudFront, Netlify, GitHub Pages, etc.).
- Serve over **HTTPS** in production.
- Keep folder layout: `index.html`, `assets/`, `partials/` at the web root (or adjust paths if using a subfolder).
- Set `HT_API_BASE` to `''` in `ht-api-config.js` so the site reads **`assets/data/products.json`** only.

#### Static + Node API (recommended for cart / orders / admin)

| Component           | Suggestion                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **Frontend**        | Same static upload as above                                                                              |
| **API**             | Run `backend` on a VPS, Azure App Service, Railway, Render, etc. with Node 18+                           |
| **Database**        | Default SQLite file in `backend/data/`; for production scale, migrate to PostgreSQL/MySQL                |
| **Env**             | Set `JWT_SECRET`, `ADMIN_API_KEY`, `CORS_ORIGIN` to your real shop URL (e.g. `https://shop.example.com`) |
| **Frontend config** | `HT_API_BASE = 'https://api.example.com'` (no trailing slash)                                            |

Use a reverse proxy so the browser calls one origin if you prefer (e.g. nginx: `/api` → `localhost:3001`).

#### PHP contact / newsletter

- Host must support **PHP** for `forms/contact.php` and `forms/newsletter.php`.
- XAMPP, cPanel, or IIS + PHP are typical on Windows hosting.
- Configure `$receiving_email_address` and optional SMTP in those PHP files.

#### Windows / IIS quick checklist

1. Site physical path → project root.
2. Default document: `index.html`.
3. MIME types: `.json` as `application/json` if downloads fail.
4. Optional: separate site or application for Node API on another port, firewall open only to the proxy.

#### After deploy

- Run `npm run seed` once on the server (or copy a prepared `htshop.sqlite`).
- Test: `https://your-api/api/health`, then `checkout.html` and `admin.html` with admin key.

---

## Repository layout (overview)

```
HT_Shop/
├── index.html                # Home (only main page at root)
├── shop/                     # catalog, cua-hang, product, search
├── account/                  # login, wishlist, compare, checkout, orders
├── admin/                    # product admin
├── content/                  # gioi-thieu, blog
├── backend/                  # Node.js REST API (optional)
├── partials/                 # header, footer, catalog-section
├── forms/                    # contact.php, newsletter.php
├── _archive/                 # legacy BootstrapMade template pages
├── assets/
│   ├── data/products.json
│   ├── js/paths.js           # site URL map (root-relative)
│   └── …
├── giayNam.html, …           # redirect stubs → new URLs (backward compatible)
└── README.md
```

---

## License and third-party credits

- Template basis: **Bikin** by BootstrapMade (see header comments in `assets/js/main.js` and [BootstrapMade license](https://bootstrapmade.com/license/)).
- Vendor libraries retain their respective licenses under `assets/vendor/`.

For a host-specific guide (e.g. only cPanel or only Azure), name the platform and we can extend section 7.
