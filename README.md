# BAUST Exchange

A simple campus marketplace for the BAUST community — buy, sell, exchange and
donate useful items (books, furniture, electronics, stationery and more).

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Prisma + MySQL** and **Auth.js (NextAuth v5) with Google sign-in**.

## Features

- Google-only authentication (no passwords stored; blocked users cannot sign in)
- Post listings with up to 6 images (sell / exchange / give away / sell-or-exchange)
- Marketplace with search, category, condition, price-range and department filters + pagination
- Listing detail pages with seller info, exchange requests, direct messaging and reporting
- Owner controls: mark items sold / exchanged / given, delete listings
- Incoming/outgoing exchange requests with accept / reject / cancel / complete
- One-to-one messaging with unread badges
- "Wanted items" board with keyword matching + MATCH notifications when new listings arrive
- In-app notifications (optionally emailed via SMTP) with unread counters
- User profiles (department, student ID, phone)
- Admin panel (`/admin`): approve/reject/remove listings, review reports, manage user roles and blocking
- Rate limiting, Zod validation, server-side authorization on every route
- Audit log of user activity

## Getting started

### 1. Prerequisites

- Node.js 20+
- MySQL 8+ running locally (or a hosted MySQL)

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | `mysql://user:password@localhost:3306/baust_exchange` |
| `AUTH_SECRET` | Random string — `npx auth secret` |
| `AUTH_URL` / `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console (OAuth 2.0). Redirect URI: `http://localhost:3000/api/auth/callback/google` |
| `SMTP_*` | Optional — enables notification emails |
| `LISTING_AUTO_APPROVE` | `true` = listings go live instantly, `false` = admin approval required |
| `SEED_ADMIN_EMAILS` | Comma-separated emails promoted to admin by the seed script |

### 4. Database

```bash
npm run db:push      # create tables from the Prisma schema
npm run db:seed      # seed default categories (+ promote SEED_ADMIN_EMAILS)
```

### 5. Run

```bash
npm run dev          # http://localhost:3000
```

## Payments: SSLCommerz Gateway + bKash

The upgrade flow (`/upgrade` → PRO membership ৳49 / item pin ৳20) has two payment paths:

### 1. Instant SSLCommerz Gateway (default)

- `POST /api/payments/sslcommerz/init` creates a `pending` Payment record and requests a
  session from SSLCommerz (both bKash, Nagad, Rocket, Visa/Mastercard and Internet Banking
  are available inside SSLCommerz's hosted checkout — you don't need a separate bKash API|.
- The user is redirected to SSLCommerz's `GatewayPageURL`. On completion SSLCommerz POSTs back to
  `/api/payments/sslcommerz/callback` (and `/api/payments/sslcommerz/ipn` as server-to-server IPN|.
- The callback validates the `val_id` against SSLCommerz's Validation API, then marks the Payment
  `approved` and instantly activates the PRO subscription (30 d) or pins the listing (7 d).
  The payer's method shows up as e.g. `SSLCommerz (BKASH)` in the admin panel.

### 2. Manual TrxID fallback (admin-verified|

- Student sends money to the bKash/Nagad/Rocket personal number shown on the page**, copies the
  Transaction ID (TrxID) mango submits it via `POST /api/payments` (status `pending`|.
- Admin reviews it at `/admin` → approves/rejects with `PATCH /api/admin/payments/[id]`.

> Note: the manual-mode bKash number is set to `01703125674` in
> `src/app/(app)/upgrade/page.tsx` → `paymentNumbers.bKash` — replace it if you use a different bKash personal/merchant number before going live.

### Payment environment variables

| Variable | Description |
| --- | --- |
| `SSLCOMMERZ_STORE_ID` | SSLCommerz store ID (sandbox default: `baust6a9ed2a72ad80`)|
| `SSLCOMMERZ_STORE_PASSWORD` | SSLCommerz store password (sandbox default: `YOUR_STORE_PASSWORD` — replace with your sandbox store password)|
| `SSLCOMMERZ_IS_LIVE` | `"true"` = production `securepay.sslcommerz.com`, anything else = sandbox (`sandbox-gw.sslcommerz.com`)|

### Going live with bKash

1. Register at [SSLCommerz](https://www.sslcommerz.com) and open a merchant store|
2. Have bKash enabled for your store credentials (their onboarding adds it to the checkout page)|
3. Set `SSLCOMMERZ_STORE_ID`/`SSLCOMMERZ_STORE_PASSWORD` to your real credentials and
   `SSLCOMMERZ_IS_LIVE="true"` — on Vercel run `vercel env add` for each, or set them in the dashboard|
4. Make sure your domain's `/api/payments/sslcommerz/callback` and `/ipn` URLs are HTTPS-reachable
   (SSLCommerz won't hit `localhost` IPN URLs in production|.

## Making an admin

Users are created on first Google sign-in. To promote one:

```bash
npm run make-admin -- someone@example.com
```

or set `SEED_ADMIN_EMAILS` before running the seed.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Generate the Prisma client and build for production |
| `npm start` | Start the production server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:push` / `db:migrate` / `db:deploy` | Sync schema to the database |
| `npm run db:seed` | Seed categories and promote seed admins |
| `npm run db:studio` | Browse data in Prisma Studio |
| `npm run make-admin -- email` | Promote a user to admin |

## Project structure

```
src/
  app/
    (app)/           authenticated pages (dashboard, marketplace, item/[id],
                     post-item, post-wanted, my-listings, exchange-requests,
                     messages, wanted, notifications, profile, settings, admin)
    api/             REST route handlers (listings, exchange-requests, messages,
                     notifications, wanted, reports, profile, upload, admin/*, health)
    login/           Google sign-in page
    auth/logout/     sign-out helper page
  components/        UI, layout, forms, marketplace, listings, requests,
                     messages, wanted, notifications, profile, admin
  lib/               auth, authz, prisma, validations, notifications, mailer,
                     matching, ratelimit, upload, activity, utils
  middleware.ts      JWT route protection (redirects to /login, guards /admin)
prisma/              schema + seed
scripts/             make-admin utility
```

## Notes

- Uploads are stored under `public/uploads` (swap `src/lib/upload.ts` for S3/Cloudinary later).
- The rate limiter is in-memory; use Redis for multi-instance deployments.
- This project is not an official BAUST service.
