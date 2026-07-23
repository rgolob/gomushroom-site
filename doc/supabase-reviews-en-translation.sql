-- Add English translation columns to gm_reviews (za prikaz na /en/shop/)
-- Run in Supabase SQL Editor

ALTER TABLE public.gm_reviews
  ADD COLUMN IF NOT EXISTS title_en TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS body_en TEXT DEFAULT NULL;
