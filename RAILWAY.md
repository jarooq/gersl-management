# Deploying GERSL on Railway

This deploys the API + web frontend as a single Railway service, with
Cloudflare R2 for file storage. The Postgres plugin (Railway-managed) holds
the database.

## 0. Prerequisites

- Railway account (https://railway.com) — Hobby plan ($5/mo) recommended so
  the service stays warm 24/7.
- Cloudflare account with R2 enabled.
- A custom domain (optional but recommended). Cloudflare DNS is easiest.
- An SMTP provider for email (Resend, AWS SES, SendGrid). Skip for first deploy
  — login + most flows work without it.
- Source pushed to a GitHub repo Railway can read.

## 1. Cloudflare R2 setup (5 min)

1. https://dash.cloudflare.com → R2 → Create bucket.
   - **Name:** `gersl-uploads`
   - **Location hint:** closest region (e.g. APAC).
2. (Public bucket for donor portal images)
   - Bucket → Settings → Public Access → enable **R2.dev subdomain**.
   - Note the public hostname: `https://pub-<id>.r2.dev`.
   - You can later attach a custom domain (`media.gersl.org`) — same effect.
3. R2 → Manage R2 API Tokens → **Create API Token**.
   - Permission: **Object Read & Write**.
   - Bucket scope: this bucket only.
   - **Save** Access Key ID + Secret Access Key — shown once.
4. Note your **Account ID** (top right of Cloudflare dashboard).

## 2. Push the repo to GitHub

```
cd /path/to/gersl-management
git push origin main
```

(There are 30+ commits ahead of `origin/main` from the build phase.)

## 3. Create the Railway project (3 min)

1. Railway → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. The first build will fail (or warn) because env vars aren't set yet — this
   is expected. Set them now (next step) and click **Deploy** again.
3. Add the **Postgres** plugin: Project → **+ New** → **Database** → **Add
   PostgreSQL**. Railway injects `DATABASE_URL` into the web service
   automatically.

## 4. Set environment variables

In the Railway service → **Variables**, paste:

```
NODE_ENV=production
JWT_SECRET=<generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`>
JWT_REFRESH_SECRET=<generate another, different from JWT_SECRET>
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Database — DATABASE_URL is injected automatically by the Postgres plugin.
# Railway PG uses self-signed certs; turn cert verification off:
DB_SSL_STRICT=false

# CORS
CORS_ALLOWED_ORIGINS=https://<your-app>.up.railway.app
# Add your custom domain too once it's wired:
# CORS_ALLOWED_ORIGINS=https://erp.gersl.org,https://<your-app>.up.railway.app

# R2 storage
S3_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=gersl-uploads
S3_ACCESS_KEY_ID=<from step 1.3>
S3_SECRET_ACCESS_KEY=<from step 1.3>
S3_PUBLIC_BASE_URL=https://pub-<id>.r2.dev   # or https://media.gersl.org
S3_PUBLIC_PREFIX=campaigns

# SMTP (skip for first deploy — login still works)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@gersl.org
FRONTEND_URL=https://<your-app>.up.railway.app

# Optional: org-wide geofence for mobile attendance
ORG_GEOFENCE_LAT=
ORG_GEOFENCE_LNG=
ORG_GEOFENCE_RADIUS_M=200

# Frontend build also needs to know the API URL. Vite reads this at build
# time via --dart-define... no, that's Flutter. For Vite:
VITE_API_URL=/api
```

`VITE_API_URL=/api` is the right value because the API and the web are on the
same host (single-service mode). Don't make it absolute.

## 5. Deploy

Click **Deploy**. First build is ~3 minutes. Watch the logs:
- `npm install` (root)
- `npm run build` (Vite)
- `cd server && npm install --omit=dev`
- `node server/src/server.js`
- Look for `📦 Serving frontend from /app/dist` and
  `✅ Database connection established successfully`.

Healthcheck `/health` should return 200 within 30s.

## 6. Run migrations

Railway → service → **⋯** → **Shell** (one-shot terminal). Or local with the
production DATABASE_URL.

```
node server/src/migrations/create_audit_logs.js
node server/src/migrations/add_procurement_roles.js
node server/src/scripts/seed-procurement-permissions.js
node server/src/migrations/extend_purchase_requisitions.js
node server/src/migrations/create_rfqs.js
node server/src/migrations/create_quotations_bid_analyses.js
node server/src/migrations/extend_purchase_orders.js
node server/src/migrations/create_grn_three_way_match.js
node server/src/migrations/extend_vendors_thresholds.js
node server/src/migrations/create_cash_accounts.js
node server/src/migrations/create_cash_transactions.js
node server/src/migrations/create_cash_count_sessions.js
node server/src/migrations/create_petty_cash_replenishments.js
node server/src/migrations/create_movements_vehicles.js
node server/src/migrations/create_fuel_claims.js
node server/src/migrations/create_attendance_corrections.js
node server/src/migrations/create_mobile_punches_devices.js
```

All scripts are idempotent — re-running is safe.

## 6.1 First-run admin bootstrap

Before you can log in, you need at least one user. Set these in Railway
**Variables** (one-time):

```
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_EMAIL=you@gersl.org
BOOTSTRAP_ADMIN_PASSWORD=<min 12 chars, upper+lower+digit>
BOOTSTRAP_ADMIN_FULLNAME=Your Name
```

Then in Railway shell:

```
node server/src/scripts/seed-bootstrap.js
```

The script refuses to run if any user already exists — it's safe to leave
the env vars set permanently and run the script again on every redeploy
without risk. **Rotate the password on first login** so the credential
isn't sitting in your env vars.

## 7. Custom domain (optional)

1. Service → **Settings** → **Domains** → **Add Custom Domain** → enter
   `erp.gersl.org`.
2. Copy the CNAME target Railway shows.
3. Cloudflare DNS → add CNAME for `erp.gersl.org` → that target. **Set
   proxy status to DNS-only (grey cloud)** — Railway needs the request to
   reach it without Cloudflare in front re-terminating TLS.
4. Wait 1–2 minutes for cert. Update `CORS_ALLOWED_ORIGINS` env to include it.

## 8. Smoke test

- `https://<your-app>.up.railway.app` → loads the React frontend.
- Log in with a seeded admin account.
- Upload a campaign image — verify it appears at `https://pub-<id>.r2.dev/campaigns/...`.
- Public donor portal page at `/campaigns` loads the image directly from R2.
- Upload a private file (e.g. orphan document) — verify the URL is on your
  Railway domain (`/uploads/orphans/...`) and that hitting it without auth
  returns 401.

## 9. Mobile app build

```
cd mobile
flutter build apk --release \
  --dart-define=API_BASE_URL=https://<your-app>.up.railway.app/api
flutter build ipa --release \
  --dart-define=API_BASE_URL=https://<your-app>.up.railway.app/api
```

Push to TestFlight / Play Internal Testing for pilot distribution.

## Costs at this scale

| Component        | Monthly | Note                                           |
| ---------------- | ------- | ---------------------------------------------- |
| Railway hobby    | $5      | Keeps service warm; covers DB + service        |
| Cloudflare R2    | $0      | Free tier: 10 GB stored, $0 egress always      |
| Cloudflare DNS   | $0      |                                                |
| SMTP (Resend)    | $0      | Free 3K emails/mo                              |
| Sentry           | $0      | Optional, free 5K errors/mo                    |
| **Total**        | **$5**  |                                                |

## Storage policy

- `campaigns/*` is served via the R2 public URL (donor portal works without
  login). The Express `/uploads/campaigns/*` route 302s to that URL.
- Everything else (orphans, staff documents, RFQ attachments, GRN photos,
  task evidence) is served via a 1-hour **signed URL** issued by the API
  after `protect` middleware succeeds. The frontend keeps using the same
  `/uploads/<path>` shape; it doesn't need to know storage moved.

## Local dev unchanged

Without `S3_*` env vars set, the upload pipeline falls back to disk
(`server/uploads/`). `npm run dev` in `server/` and `npm run dev` at root
work as they always have.

## Rollback

Railway → **Deployments** → pick a previous build → **Redeploy**. ~30s.

## Things this guide doesn't cover

- **Background workers**: none yet. If we add fuel-claim batch payouts or
  push-notification fanout, that's a second Railway service.
- **CDN in front of Railway**: skip until traffic warrants. Cloudflare can
  proxy the Railway domain (orange cloud) once you've verified TLS works
  end-to-end.
- **Database backups**: Railway Hobby has 7-day point-in-time recovery on
  Postgres. Pro adds longer retention. A nightly `pg_dump` cron is also a
  good idea once you have real data.
- **Connection pooling**: Railway PG caps connections low. If you ever see
  "too many connections" errors, enable PgBouncer (one-click in Railway).
