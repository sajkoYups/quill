-- Keep public.users in sync with auth.users so subscriptions.user_id FK succeeds.
-- Run after 001_initial_schema.sql (public.users must exist).

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.email, ''), NEW.id::text || '@auth.placeholder'),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(
      NULLIF(EXCLUDED.email, ''),
      public.users.email
    ),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_auth_user_to_public();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_auth_user_to_public();

-- Backfill existing auth users into public.users
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT
  au.id,
  COALESCE(NULLIF(au.email, ''), au.id::text || '@auth.sync.local'),
  COALESCE(au.created_at, now()),
  now()
FROM auth.users AS au
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(
    NULLIF(EXCLUDED.email, ''),
    public.users.email
  ),
  updated_at = now();
