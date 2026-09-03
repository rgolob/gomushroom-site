-- ═══════════════════════════════════════════════════════════════════════════
-- Kuponske kode recenzij niso vec javno berljive
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PREDPOGOJ: objavljena mora biti nova razlicica trgovine (cart-page.js,
-- blagajna.js, shop-reviews.js, recenzije.js in funkcija validate-coupon).
-- Stara koda bere kupone naravnost iz tabele in bi po tem SQL-u obstala.
--
-- Kaj je bilo narobe
-- ──────────────────
-- Kosarica in blagajna sta kupone recenzij brali z zahtevkom
--
--   gm_reviews?status=eq.approved&coupon_code=not.is.null&select=coupon_code,coupon_pct
--
-- s publishable kljucem, ki je javno viden v izvorni kodi trgovine. Isti
-- zahtevek je lahko poslal kdorkoli in dobil seznam VSEH veljavnih kuponskih
-- kod — tudi tistih, ki so bile izdane imenskim kupcem za njihovo recenzijo.
--
-- Popravek
-- ────────
-- Brskalnik kod ne bere vec. Vsako vneseno kodo posebej vprasa
-- netlify/functions/validate-coupon, ki odgovori samo o njej in nikoli ne vrne
-- seznama. Tu zapremo se pot v bazo.
--
-- Zakaj samo dva stolpca in ne cela tabela: trgovina mora recenzije se naprej
-- prikazovati. Faza 2 nas je naucila, da politika omeji vrstice, grant pa
-- stolpce — tu potrebujemo prav slednje.

-- ── 1. Zapremo stolpca ─────────────────────────────────────────────────────
revoke select (coupon_code, coupon_pct) on gm_reviews from anon;

-- Vstavljanje nove recenzije ostane: obrazec ob oddaji zapise coupon_pct.
-- Ce bi tudi to zaprli, oddaja recenzije ne bi vec delovala.

-- ── 2. Preveri ─────────────────────────────────────────────────────────────
-- Anon sme brati vse razen obeh kuponskih stolpcev.
select column_name, privilege_type
  from information_schema.column_privileges
 where table_name = 'gm_reviews' and grantee = 'anon' and privilege_type = 'SELECT'
 order by column_name;
-- V izpisu NE sme biti coupon_code in coupon_pct.

-- ── 3. Zadnji preizkus ─────────────────────────────────────────────────────
-- Ta zahtevek s publishable kljucem mora odslej vrniti napako, ne seznama:
--
--   curl "https://rjscfndegqxuefffsedf.supabase.co/rest/v1/gm_reviews\
--   ?status=eq.approved&select=coupon_code" \
--     -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"
--
-- Recenzije na strani izdelka pa se morajo se naprej prikazovati.
