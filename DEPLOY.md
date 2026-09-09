# Deploying BAUST Exchange to Vercel

Vercel is perfect for this Next.js app, but two things differ from local dev:

| Concern | Local dev | Vercel (production) |
| --- | --- | --- |
| Database | MySQL 9.4 on `127.0.0.1:3307` | Hosted MySQL (TiDB Cloud / Aiven / Railway) |
| Image uploads | `public/uploads` on disk | **Vercel Blob** (serverless FS is read-only) |

The code already handles both: the upload route uses Vercel Blob when
`BLOB_READ_WRITE_TOKEN` is set and falls back to local disk otherwise.

---

## Step 1 — Create a hosted MySQL (free tiers)

Vercel doesn't provide MySQL. Pick one:

- **TiDB Cloud Serverless** (recommended, generous free tier, MySQL-compatible):
  1. Sign up at <https://tidbcloud.com> → Create a **Serverless** cluster.
  2. Click **Connect** → copy the connection string (host, user, port 4000, password).
- **Aiven for MySQL** (free tier): <https://aiven.io> → create MySQL service.
- **Railway** (trial credits): provision a MySQL database.

Build your Prisma `DATABASE_URL` (TLS is required by these providers):

```
mysql://USER:PASSWORD@HOST:PORT/baust_exchange?sslaccept=strict&connection_limit=5
```

- `sslaccept=strict` — required by TiDB/Aiven
- `connection_limit=5` — keeps serverless functions within free-tier connection limits

## Step 2 — Create the schema on the hosted DB

From your machine (Prisma connects to the cloud DB directly):

```bash
# temporarily point at the cloud DB (PowerShell):
$env:DATABASE_URL = "mysql://USER:PASSWORD@HOST:PORT/baust_exchange?sslaccept=strict&connection_limit=5"
npx prisma db push        # creates tables
npm run db:seed           # seeds categories (+ SEED_ADMIN_EMAILS if set)
```

## Step 3 — Create Vercel Blob storage

1. Vercel Dashboard → your (future) project → **Storage** → **Create Database → Blob**.
2. After creation, click **.env.local** tab and copy `BLOB_READ_WRITE_TOKEN`.

## Step 4 — Add the production OAuth redirect URI

Google Cloud Console → *APIs & Services → Credentials → your OAuth client*:

Add: `https://YOUR-APP.vercel.app/api/auth/callback/google`

(Also rotate the client secret now if it was ever shared.)

## Step 5 — Deploy

### Option A — GitHub (recommended for redeploys)

```bash
git init && git add . && git commit -m "BAUST Exchange"
# push to a new GitHub repo, then:
```

Vercel Dashboard → **Add New Project → Import** the repo.
Framework preset is detected (Next.js). Add these **Environment Variables**:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | hosted MySQL URL from step 1 |
| `AUTH_SECRET` | new random secret — `npx auth secret` |
| `AUTH_URL` | `https://YOUR-APP.vercel.app` |
| `NEXTAUTH_URL` | `https://YOUR-APP.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `GOOGLE_CLIENT_ID` | your client id |
| `GOOGLE_CLIENT_SECRET` | your (rotated) secret |
| `BLOB_READ_WRITE_TOKEN` | from step 3 |
| `LISTING_AUTO_APPROVE` | `true` (or `false` to require admin approval) |

Click **Deploy**. `prisma generate` runs automatically via `postinstall`/`build`.

### Option B — Vercel CLI

```bash
npx vercel login          # browser confirmation
npx vercel                # preview deploy; answer prompts
npx vercel env add ...    # or set vars in the dashboard, then:
npx vercel --prod
```

## Step 6 — Make yourself admin

From your machine, pointing at the production DB:

```bash
$env:DATABASE_URL = "mysql://...prod..."; npm run make-admin -- you@gmail.com
```

(then reload `/admin` on the deployed site)

## Post-deploy checklist

- [ ] Landing page loads, Google sign-in works
- [ ] `/api/health` returns `"db":"ok"`
- [ ] Posting an item uploads images to Blob (`*.public.blob.vercel-storage.com`)
- [ ] `/admin` accessible only to admins

### Known limits

- The rate limiter is in-memory — per serverless instance only. Fine for a
  campus-scale app; swap for Upstash Redis if you need global limits.
- Serverless cold starts add ~1s on first request.
