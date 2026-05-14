-- Add delivery_num column to gm_sale_groups
-- Run in Supabase SQL Editor

ALTER TABLE public.gm_sale_groups
  ADD COLUMN IF NOT EXISTS delivery_num TEXT DEFAULT NULL;
