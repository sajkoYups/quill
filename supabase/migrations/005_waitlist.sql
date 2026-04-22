CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  product TEXT NOT NULL DEFAULT 'quill',
  stage TEXT NOT NULL DEFAULT 'waitlist',
  source TEXT,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_product_stage_created_at
  ON public.waitlist (product, stage, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_waitlist_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_waitlist_updated_at ON public.waitlist;
CREATE TRIGGER set_waitlist_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_waitlist_updated_at();

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
