-- Add lang column to gm_reviews - jezik strani, na kateri je bila recenzija
-- oddana (sl/en). Uporablja se za jezik mejlov, ki jih recenzent dobi ob
-- potrditvi (kupon koda) ali zavrnitvi - dotlej sta bila oba trdno kodirana
-- v slovenscino, ker gm_reviews ni nosil nobenega jezikovnega signala.
-- Run in Supabase SQL Editor

ALTER TABLE public.gm_reviews
  ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT 'sl';
