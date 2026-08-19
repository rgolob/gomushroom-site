-- ═══════════════════════════════════════════════════════════════════════════
-- FAZA 3 — brskalnik nad gm_orders nima več nobene pravice
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PREDPOGOJI (v tem vrstnem redu!):
--   1. V Netlify je nastavljena spremenljivka SUPABASE_SECRET_KEY
--      (Supabase → Project Settings → API Keys → Secret keys → default).
--   2. Objavljena je nova različica trgovine (create-order.js, send-email.js,
--      blagajna.js).
--   3. Opravljen je testni nakup z nakazilom IN s kartico — oba morata iti do
--      konca, preden zaženeš ta SQL.
-- Šele nato ta datoteka. Stara koda vstavlja naročila neposredno in bi po tem
-- SQL-u obstala pri nakupu.
--
-- Kaj je bilo narobe
-- ──────────────────
-- Fazi 1 in 2 sta zaprli BRANJE tujih podatkov. Pisanje je ostalo odprto:
-- celotno vrstico naročila je sestavil brskalnik in jo s publishable ključem
-- (ta je javno viden v izvorni kodi trgovine) vstavil v gm_orders. Baza je
-- verjela vsemu, kar je dobila — znesku, popustu, statusu.
--
-- V praksi je to pomenilo troje:
--   • predračun za poljuben znesek (npr. 0,01 € za naročilo v vrednosti 100 €),
--   • vrstica s status='paid', ne da bi bilo kdaj kaj plačano,
--   • poljubno število izmišljenih naročil v tabeli.
--
-- Poleg tega je create-payment-intent znesek za Stripe vzel od brskalnika, kar
-- je omogočalo podplačilo.
--
-- Popravek
-- ────────
-- Naročilo odslej sestavi netlify/functions/create-order s strežniškim ključem:
-- ceno vzame iz gm_product_variants, popust in poštnino iz gm_settings, pri
-- kartici pa pri Stripu preveri, da je bilo plačano vsaj toliko, kolikor je
-- naročilo vredno. Brskalnik pošlje samo sku in količino.
--
-- Strežniški ključ RLS obide, zato create-order deluje tudi potem, ko anon
-- nad to tabelo nima ničesar.

-- ── 1. Odstranimo vse politike za anon ─────────────────────────────────────
drop policy if exists gm_orders_anon_insert    on gm_orders;
drop policy if exists gm_orders_anon_update    on gm_orders;
drop policy if exists gm_orders_anon_select_id on gm_orders;

-- ── 2. In vse pravice ──────────────────────────────────────────────────────
-- Faza 2 nas je naučila, da politika in grant nista ista stvar: politika omeji
-- vrstice, grant stolpce. Zapreti je treba oboje — dovolj je, da ena plast
-- ostane odprta, pa jo naslednji popravek na drugi plasti spet aktivira.
revoke all on gm_orders from anon;

-- Prijavljeni (zaloga) ostane nespremenjen — politika gm_auth_all velja naprej.

-- ── 3. Preveri ─────────────────────────────────────────────────────────────
-- Pri gm_orders sme ostati samo gm_auth_all za authenticated.
select policyname, cmd, roles, qual
  from pg_policies
 where schemaname='public' and tablename='gm_orders'
 order by policyname;

-- Ta mora vrniti PRAZNO — anon nima nobene pravice več.
select privilege_type, coalesce(column_name,'(vsi)') as stolpec
  from information_schema.column_privileges
 where grantee='anon' and table_schema='public' and table_name='gm_orders'
 union all
select privilege_type, '(tabela)'
  from information_schema.table_privileges
 where grantee='anon' and table_schema='public' and table_name='gm_orders'
 order by 1,2;

-- Vsak od teh mora javiti permission denied:
--   set role anon;
--   select id from gm_orders limit 1;
--   insert into gm_orders (name,email) values ('x','x@x.si');
--   reset role;

-- ── 4. Kontrolni seznam po zagonu ──────────────────────────────────────────
--   [ ] Trgovina: izdelki in ocene se prikažejo (brez prijave)
--   [ ] Nakup z nakazilom gre do konca, RF referenca se prikaže
--   [ ] Nakup s kartico gre do konca
--   [ ] Zaloga: obe naročili se pojavita z imenom, naslovom in zneskom
--   [ ] Potrditveno sporočilo pride kupcu
--   [ ] confirmation_sent_at je zapolnjen (zdaj ga piše send-email)
--   [ ] Znesek naročila v bazi se ujema s tistim, ki ga je videl kupec

-- ── 5. VRNITEV NAZAJ, če prodaja obstane ───────────────────────────────────
-- grant insert on gm_orders to anon;
-- grant select (id) on gm_orders to anon;
-- grant update (confirmation_sent_at) on gm_orders to anon;
-- create policy gm_orders_anon_insert    on gm_orders for insert to anon with check (true);
-- create policy gm_orders_anon_select_id on gm_orders for select to anon using (true);
-- create policy gm_orders_anon_update    on gm_orders for update to anon using (true) with check (true);

-- ── Še odprto ──────────────────────────────────────────────────────────────
-- gm_reviews: anon še vedno sme vstavljati recenzije (status='pending'). Tam
-- ni denarja in pregled je ročen, zato je tveganje drugačne narave — a ista
-- vrsta popravka (vstavljanje prek funkcije) bi odpravila tudi možnost, da kdo
-- tabelo zapolni z izmišljenimi ocenami.
