# Supabase RLS Access Model

This project enables RLS on all `public` app tables and applies authenticated user-scoped policies where possible.

## Table Access Summary

- `public.users`: authenticated users can `SELECT` and `UPDATE` only their own row (`id = auth.uid()`).
- `public.subscriptions`: authenticated users can `SELECT/INSERT/UPDATE/DELETE` only rows with `user_id = auth.uid()`.
- `public.settings`: authenticated users can manage only `owner_type = 'user'` rows where `owner_id = auth.uid()::text`.
- `public.chats`: authenticated users can manage only `owner_type = 'user'` rows where `owner_id = auth.uid()::text`.
- `public.messages`: authenticated users can access rows only when the parent chat is owned by `auth.uid()`.
- `public.screenshots`: authenticated users can access rows only when the parent chat is owned by `auth.uid()`.
- `public.documents`: authenticated users can access rows only when the parent chat is owned by `auth.uid()`.
- `public.document_chunks`: authenticated users can access rows only through document -> chat ownership owned by `auth.uid()`.
- `public.usage_logs`: authenticated users can manage only `owner_type = 'user'` rows where `owner_id = auth.uid()::text`.
- `public.guest_devices`: RLS enabled with no anon/authenticated policy by default (service-role-only access path).

## Notes

- API backend uses the service role for DB access, which bypasses RLS by design. RLS serves as defense in depth for non-service-role paths.
- Guest/device-scoped access is enforced in API logic; JWT-based `auth.uid()` cannot safely model guest ownership without explicit guest claims.

## Verification Checklist

1. Apply latest migration (including `004_enable_rls_public_tables.sql`).
2. In Supabase SQL editor, run role-scoped checks:
   - under authenticated context, confirm own rows are visible and cross-user rows are denied
   - under anon context, confirm protected tables are denied
3. Re-run Security Advisor and confirm `RLS Disabled In Public` is cleared for all listed tables.
