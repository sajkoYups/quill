# Supabase billing sync (auth.users vs public.users)

`subscriptions.user_id` references `public.users(id)`. Supabase Auth stores identities in `auth.users`. If a row exists in `auth.users` but not in `public.users`, Stripe webhook upserts to `subscriptions` fail (foreign key), often silently in logs unless errors are checked.

## Diagnostics

Run in **Supabase SQL Editor**:

```sql
-- Auth users (recent)
select id, email, created_at
from auth.users
order by created_at desc
limit 20;
```

```sql
-- App users (public)
select id, email, created_at
from public.users
order by created_at desc
limit 20;
```

```sql
-- Auth users missing from public.users
select au.id, au.email
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null;
```

```sql
-- Subscription rows (after checkout)
select user_id, plan_name, status, stripe_subscription_id, stripe_customer_id, updated_at
from public.subscriptions
order by updated_at desc
limit 20;
```

## Temporary local unblock (manual)

If you need to test billing before migrations/triggers are applied, insert your user once (replace placeholders):

```sql
insert into public.users (id, email, updated_at)
values (
  'YOUR_AUTH_USER_UUID'::uuid,
  'your@email.com',
  now()
)
on conflict (id) do update set
  email = excluded.email,
  updated_at = now();
```

Then complete Stripe checkout again and confirm a row appears in `public.subscriptions`.

## Permanent fix

Apply migration `003_sync_auth_users_to_public.sql` (sync trigger + backfill). The API also calls `ensurePublicUserRecord` before creating a checkout session.
