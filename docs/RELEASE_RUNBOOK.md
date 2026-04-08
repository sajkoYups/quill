# Quill Release Runbook

## 1) Build artifacts

Desktop installers are produced from `apps/desktop/release`:
- macOS: DMG/ZIP (x64 + arm64)
- Windows: NSIS installer (x64)
- Linux: AppImage + DEB (x64)

Commands:
- `npm run dist:mac -w @quill/desktop`
- `npm run dist:win -w @quill/desktop`
- `npm run dist:linux -w @quill/desktop`

CI workflow:
- `.github/workflows/desktop-cross-platform.yml`

## 2) Environment variables

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

## 3) Supabase users and subscriptions

Billing webhooks write `public.subscriptions` with `user_id` referencing `public.users`. See [SUPABASE_BILLING_SYNC.md](./SUPABASE_BILLING_SYNC.md) for diagnostics, manual unblock SQL, and migration `003_sync_auth_users_to_public.sql`.

## 4) Stripe webhook verification

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

## 5) Stripe test matrix (must pass)

- **Subscribe happy path**: user upgrades, checkout succeeds, tier becomes paid.
- **Payment failure / recovery**: failed payment event updates status, recovery event restores paid path.
- **Cancel flow**: cancellation updates status and entitlement.
- **Portal flow**: manage subscription link opens portal and returns successfully.

## 6) Desktop smoke checks

See full checklist in:
- `apps/desktop/SMOKE_TEST_CHECKLIST.md`

Minimum pass gate:
- install, open app, auth, create chat, send message, billing action available, uninstall.
