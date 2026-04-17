# Quill Release Runbook

## 1) Build artifacts

Desktop installers are produced from `apps/desktop/release`:
- macOS: DMG/ZIP (x64 + arm64)
- Windows: NSIS installer (x64)

Commands:
- `npm run dist:mac -w @quill/desktop`
- `npm run dist:win -w @quill/desktop`

CI workflow (push/PR to `main`):
- `.github/workflows/desktop-cross-platform.yml`

Release publish workflow (push a version tag, e.g. `v0.0.1`):
- `.github/workflows/release-desktop.yml`
- Builds macOS + Windows and uploads installers to Cloudflare R2.

## 2) R2 release distribution

R2 keys overwritten each release:
- `mac/latest.dmg`
- `win/latest.exe`

Versioned copy per tag is also uploaded:
- `releases/<tag>/macos-latest.dmg`
- `releases/<tag>/windows-latest.exe`

Required GitHub Secrets:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Expected public download URLs:
- `https://downloads.quill.app/mac/latest.dmg`
- `https://downloads.quill.app/win/latest.exe`

Rollback:
1. Identify previous good tag file in `releases/<old-tag>/...`.
2. Copy it back over latest key in R2.
3. Re-test download URLs.

## 3) Environment variables

API (`apps/api/.env`):
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_RETURN_URL`

Desktop (`apps/desktop/.env`):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Landing (`apps/web/.env`):
- `NEXT_PUBLIC_DOWNLOAD_URL_MAC`
- `NEXT_PUBLIC_DOWNLOAD_URL_WINDOWS`
- `NEXT_PUBLIC_DOWNLOAD_URL_LINUX`

## 4) Supabase users and subscriptions

Billing webhooks write `public.subscriptions` with `user_id` referencing `public.users`. See [SUPABASE_BILLING_SYNC.md](./SUPABASE_BILLING_SYNC.md) for diagnostics, manual unblock SQL, and migration `003_sync_auth_users_to_public.sql`.

## 5) Stripe webhook verification

Endpoint:
- `POST /billing/webhooks/stripe`

Behavior checks:
- Request body must stay raw bytes for signature verification.
- `stripe-signature` header required.
- Duplicate event IDs are ignored.

Local verification:
1. Run API locally.
2. Run Stripe CLI forwarding to local webhook endpoint.
3. Trigger test checkout and replay events.
4. Confirm `subscriptions` rows are updated for `checkout.session.completed`,
   `customer.subscription.updated`, and `customer.subscription.deleted`.

## 6) Stripe test matrix (must pass)

- **Subscribe happy path**: user upgrades, checkout succeeds, tier becomes paid.
- **Payment failure / recovery**: failed payment event updates status, recovery event restores paid path.
- **Cancel flow**: cancellation updates status and entitlement.
- **Portal flow**: manage subscription link opens portal and returns successfully.

## 7) Desktop smoke checks

See full checklist in:
- `apps/desktop/SMOKE_TEST_CHECKLIST.md`

Minimum pass gate:
- install, open app, auth, create chat, send message, billing action available, uninstall.
