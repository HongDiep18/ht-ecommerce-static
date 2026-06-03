# HT Shop — Backend API

Node.js **Express** API with **SQLite** for catalog, accounts, cart, and orders.

## Quick start

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

API base: **http://localhost:3001**

Frontend (separate terminal):

```bash
cd ..
php -S localhost:8080
```

Enable API in the shop: uncomment `HT_API_BASE` in `assets/js/ht-api-config.js` and load that script **before** `catalog-core.js` on pages that use the catalog.

## Environment (`.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | API port |
| `JWT_SECRET` | (dev default) | Sign login tokens |
| `ADMIN_API_KEY` | `ht-admin-dev-key` | Header `X-Admin-Key` for admin routes |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed browser origin (comma-separated for several) |
| `DB_PATH` | `./data/htshop.sqlite` | SQLite file |

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health + product count |
| GET | `/api/products` | — | List with `category`, `brand`, `size`, `priceMin`, `priceMax`, `sort`, `q`, `page`, `perPage` |
| GET | `/api/products/:id` | — | Single product |
| POST | `/api/auth/register` | — | `{ name, email, password, phone? }` → `{ token, user }` |
| POST | `/api/auth/login` | — | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/cart` | Bearer or `X-Session-Id` | Cart lines |
| POST | `/api/cart/items` | Bearer or `X-Session-Id` | `{ productId, sku, quantity }` |
| PATCH | `/api/cart/items/:lineId` | Bearer or `X-Session-Id` | `{ quantity }` |
| DELETE | `/api/cart/items/:lineId` | Bearer or `X-Session-Id` | Remove line |
| POST | `/api/orders` | Bearer or `X-Session-Id` | `{ shipping: { name, phone, address, note? }, paymentMethod? }` |
| GET | `/api/orders` | Bearer | Order history |
| GET | `/api/orders/:id` | Bearer | One order |
| GET | `/api/admin/products` | `X-Admin-Key` | All products |
| POST | `/api/admin/products` | `X-Admin-Key` | Create/update body |
| PUT | `/api/admin/products/:id` | `X-Admin-Key` | Update |
| DELETE | `/api/admin/products/:id` | `X-Admin-Key` | Delete |
| POST | `/api/admin/seed` | `X-Admin-Key` | Reload from `assets/data/products.json` |

### Guest cart / orders

Send header **`X-Session-Id`** (any stable string; the frontend generates one in `localStorage`). Logged-in users use **`Authorization: Bearer <token>`** instead.

## Data

- Products are seeded from **`../assets/data/products.json`** on first start or via `npm run seed`.
- Placing an order **decrements variant stock** in the database.
- Admin changes go through `/api/admin/*`; export JSON from the static admin UI can still be synced by re-running seed or PUT endpoints.

## Production notes

- Change `JWT_SECRET` and `ADMIN_API_KEY`.
- Put the API behind HTTPS and reverse proxy (IIS, nginx, Caddy).
- Replace SQLite with PostgreSQL/MySQL when you outgrow single-file DB.
- Wire payment webhooks (MoMo, VNPay) as new routes — not included yet.
