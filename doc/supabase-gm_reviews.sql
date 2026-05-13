-- Zaženi v Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.gm_reviews (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT         NOT NULL,
  email         TEXT         NOT NULL,
  rating        INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         TEXT,
  body          TEXT         NOT NULL,
  product_id    TEXT         NOT NULL,
  product_name  TEXT,
  status        TEXT         NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected')),
  coupon_pct    INTEGER      DEFAULT 10,
  coupon_code   TEXT,
  coupon_sent   BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Indeks za hitro iskanje po produktu + statusu
CREATE INDEX IF NOT EXISTS idx_gm_reviews_product_status
  ON public.gm_reviews (product_id, status);

-- Vklopi RLS
ALTER TABLE public.gm_reviews ENABLE ROW LEVEL SECURITY;

-- Obiskovalci lahko dodajo recenzijo (samo status='pending')
CREATE POLICY "anon_insert" ON public.gm_reviews
  FOR INSERT TO anon
  WITH CHECK (status = 'pending');

-- Obiskovalci vidijo samo potrjene recenzije
CREATE POLICY "anon_select" ON public.gm_reviews
  FOR SELECT TO anon
  USING (status = 'approved');
