-- ═══════════════════════════════════════════════════════════════════════════
-- FAZA 2 — POPRAVEK: potrditev prejema (confirmation_sent_at) se ni pisala
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Kaj je bilo narobe
-- ──────────────────
-- supabase-rls-faza2.sql je anon pustil pravico UPDATE (stolpec
-- confirmation_sent_at) in politiko gm_orders_anon_update z using(true), a
-- odstranil VSAKO SELECT pravico nad gm_orders. Postgres RLS za UPDATE/DELETE
-- najprej poišče vrstice prek SELECT vidljivosti in šele nato preveri USING
-- klavzulo UPDATE politike — brez SELECT pravice anon ne najde nobene
-- vrstice, zato PATCH .../gm_orders?id=eq.<id> tiho "uspe" (ni napake), a
-- popravi 0 vrstic.
--
-- Posledica: pri VSEH naročilih z bančnim nakazilom, oddanih po uvedbi faze 2,
-- je confirmation_sent_at ostal NULL, čeprav je potrditveno sporočilo dejansko
-- šlo ven (blagajna.js najprej pošlje e-pošto, šele nato poskusi PATCH, napako
-- pri PATCH pa samo tiho zabeleži v konzolo).
--
-- Popravek
-- ────────
-- Anon dobi SELECT samo na stolpec id — UUID sam po sebi ne razkriva ničesar
-- o kupcu, potreben pa je, da PATCH z WHERE id=eq... sploh najde vrstico.
-- Poizvedba, ki bi poskusila prebrati kateri koli drug stolpec (select=name
-- ali select=* ipd.), ostane zavrnjena na nivoju stolpčnih pravic.

grant select (id) on gm_orders to anon;

create policy gm_orders_anon_select_id on gm_orders
  for select to anon using (true);

-- ── Preveri ────────────────────────────────────────────────────────────────
-- Mora iti skozi in popraviti 1 vrstico (uporabi id iz katerega koli
-- testnega naročila):
--   set role anon;
--   update gm_orders set confirmation_sent_at = now() where id = '<id>';
--   reset role;
--
-- Mora ostati prazno (id sam po sebi ni PII, a ostali stolpci morajo biti
-- še vedno nedostopni):
--   set role anon;
--   select name, email from gm_orders;         -- pričakovano: napaka (denied)
--   select id from gm_orders limit 5;           -- pričakovano: gre skozi
--   reset role;
--
-- ── Popravek obstoječih naročil ───────────────────────────────────────────
-- Naročila, oddana med uvedbo faze 2 in tem popravkom, imajo
-- confirmation_sent_at = NULL, čeprav je sporočilo šlo ven. Če je pomembno,
-- da stolpec odraža resnično stanje, ga ročno popravi na created_at (edini
-- približek, ki ga imamo, saj se e-pošta pošlje takoj po vstavitvi):
--   update gm_orders
--      set confirmation_sent_at = created_at
--    where confirmation_sent_at is null
--      and status = 'pending'
--      and created_at > '<datum uvedbe faze 2>';
