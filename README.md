# Lumora — luminaires & art mural imprimés en 3D

Premium online shop + admin dashboard for a Tunisian 3D-printing design studio (lamps, wall art, custom orders).
French storefront, prices in TND, cash on delivery / bank transfer / D17.

**Stack:** Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 · Prisma 6 · PostgreSQL · Zod

## Run locally

```bash
npm install
npm run dev:db              # terminal 1 — real local PostgreSQL on port 5434 (no Docker needed)
npm run db:migrate          # terminal 2 — create the tables (first time only)
npm run db:seed -- --demo   # admin account, categories, 12 products (+ demo orders, reviews, coupons)
npm run dev                 # http://localhost:3000
```

Admin: http://localhost:3000/admin — log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`.

Demo coupons (with `--demo`): `BIENVENUE10` (-10 % from 80 DT), `LUMIERE20` (-20 DT from 150 DT).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` · `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | Quality checks |
| `npm test` | Order-service tests against the real DB (pricing, coupons, 5 concurrent checkouts for 3 units, restock…) |
| `npm run db:seed` | Admin + settings + categories + starter catalog (safe to re-run, never duplicates) |
| `npm run db:deploy` | Apply migrations in production |
| `node scripts/generate-catalog.mjs` | Regenerate the demo product illustrations in `public/catalog` |

## What's inside

**Storefront** — home (hero, collections, featured, best sellers, reviews), shop with search / price / stock / promo filters and sorting, category pages, product page (gallery, colour variants with per-colour stock, specs, reviews, related, JSON-LD), slide-in cart, cart page with coupon, guest or logged-in checkout, order confirmation & tracking, custom-order request with file uploads, contact, FAQ, legal pages, customer account (orders, cancel pending order, custom requests, profile, password), password reset, sitemap, robots, WhatsApp button.

**Admin (`/admin`)** — KPIs with period comparison, daily revenue chart, orders by status, best sellers, low stock, latest orders · Orders: filters, search, status workflow (customer e-mailed), tracking number, payment status, internal note, printable delivery note, CSV export · Products: create / edit, images upload & ordering, variants & stock, featured / new / made-to-order, archive · Stock page with movement history · Categories · Custom requests with quote & files · Customers (orders, total spent, suspend) · Coupons · Review moderation · Messages · Settings (store info, homepage texts, shipping fee & free threshold, payment methods, bank details).

## How it stays fast

- Catalog reads are cached (`src/server/catalog.ts`, tag `catalog`) and the home, product, about, FAQ and legal pages are prerendered. Every admin change clears the cache, so the site updates instantly. Measured in production: ~4 ms home and product pages, ~20 ms shop with filters, ~35 ms admin pages.
- Images are served as AVIF / WebP at the right size by `next/image` and cached for one year.

## How it stays correct and safe

- Prices, stock, coupons and shipping are always recomputed on the server; the browser cart is display-only.
- Stock is decremented with an atomic conditional `UPDATE`, so it can never go negative or be oversold, even with simultaneous checkouts (covered by a test). Cancellations and returns put stock back, and every stock change is logged.
- Single-use / limited coupons are consumed atomically.
- Every admin action checks the admin role on the server; customer files are private (admin-only download); uploads are type-checked by content, not just extension.
- scrypt password hashes, HttpOnly session cookies, rate limiting on login / checkout / forms, CSRF protection (Next.js origin check), security headers, CSV-injection-safe exports, honeypots against spam bots.

## Current database: Supabase project `lumora`

- Project ref `zpumvgrejizkllgnuncr`, region Paris (eu-west-3), organisation "hotelapp" (separate from the hotel app project).
- The app connects as a dedicated role `lumora_app` through the Supabase pooler: transaction mode (port 6543) for the app, session mode (port 5432) for migrations. The connection strings are in `.env.local`.
- Every table has RLS enabled with no policies, and `anon` / `authenticated` have no privileges, so nothing is reachable through Supabase's public Data API (migration `20261114010000_lock_data_api`).
- Files are stored in Supabase Storage (`STORAGE_DRIVER=supabase`): bucket `public-assets` (public, product images, 8 MB max) and `private-files` (private, customer files, 10 MB max, admin download only). The server uses the secret key `SUPABASE_SECRET_KEY` (`sb_secret_…`, or a legacy service_role JWT in `SUPABASE_SERVICE_ROLE_KEY`). Never prefix it with `NEXT_PUBLIC_`.
- To work on the local database again: `copy .env.local.backup-local-db .env.local` and run `npm run dev:db`.
- Free-plan projects pause after about a week without traffic; restore from the Supabase dashboard if that happens.

## Deploying (e.g. Vercel + Supabase)

1. Create a Supabase project. Copy the pooled connection string to `DATABASE_URL` and the direct one to `DIRECT_URL`.
2. Create two storage buckets: `public-assets` (public) and `private-files` (private). Set `STORAGE_DRIVER=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Set `NEXT_PUBLIC_APP_URL` (your domain), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL` for e-mails.
4. Run `npm run db:deploy` then `npm run db:seed` once against the production database.
5. Deploy. On a VPS / Railway you can keep `STORAGE_DRIVER=local` (files in `./storage`, back it up).

See `.env.example` for every variable.

## Before going live

- Replace the generated illustrations with real product photos (Admin → Produits).
- Fill in Admin → Paramètres: phone, WhatsApp, address, social links, bank details / D17 number.
- Without `RESEND_API_KEY`, e-mails are only printed in the server log.
- Rate limiting is in memory (per server instance). That's fine for one server; use Redis (e.g. Upstash) if you run several.
- Online card payment (Flouci / Konnect) is not included: it needs a merchant account and keys.
"# lumora" 
