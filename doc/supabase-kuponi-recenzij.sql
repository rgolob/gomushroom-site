-- ═══════════════════════════════════════════════════════════════════════════
-- gm_reviews: brskalnik ne bere vec kuponskih kod in e-naslovov
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
-- kod. Ob tem je bil javno berljiv tudi stolpec email — torej e-naslovi vseh,
-- ki so kdaj oddali recenzijo.
--
-- Zakaj prvi poskus ni prijel
-- ───────────────────────────
-- Najprej smo poskusili samo
--
--   revoke select (coupon_code, coupon_pct) on gm_reviews from anon;
--
-- kar ni spremenilo nicesar. V Postgresu stolpcni revoke ne odvzame pravice,
-- podeljene na ravni cele tabele: dokler ima vloga SELECT na tabeli, velja za
-- vse stolpce in stolpcni revoke je brez ucinka. Pravico je zato treba
-- odvzeti na tabeli in jo nato podeliti samo stolpcem, ki so res potrebni.

-- ── 1. Odvzamemo bralno pravico na tabeli ──────────────────────────────────
revoke select on gm_reviews from anon;

-- ── 2. Podelimo jo samo stolpcem, ki jih trgovina res bere ─────────────────
-- status je zraven, ker trgovina po njem filtrira (status=eq.approved),
-- created_at pa, ker po njem razvrsca. Filtriranje in razvrscanje zahtevata
-- bralno pravico na tistem stolpcu.
--
-- Zunaj ostanejo: coupon_code, coupon_pct, coupon_sent, email, id, lang,
-- rejection_reason.
grant select (
  product_id,
  product_name,
  rating,
  title,
  body,
  title_en,
  body_en,
  name,
  status,
  created_at
) on gm_reviews to anon;

-- Vstavljanje ostane nedotaknjeno: obrazec ob oddaji recenzije zapise tudi
-- email in coupon_pct. Pisati sme naprej, brati teh dveh ne more vec.

-- ── 3. Preveri ─────────────────────────────────────────────────────────────
select column_name
  from information_schema.column_privileges
 where table_name = 'gm_reviews' and grantee = 'anon' and privilege_type = 'SELECT'
 order by column_name;
--
-- Pricakovano natanko teh deset:
--   body, body_en, created_at, name, product_id, product_name,
--   rating, status, title, title_en
--
-- Ce je v izpisu se vedno coupon_code, coupon_pct ali email, revoke ni prijel.

-- ── 4. Zadnji preizkus na zivi strani ──────────────────────────────────────
-- Ta zahtevek mora odslej vrniti napako, ne seznama:
--
--   curl "https://rjscfndegqxuefffsedf.supabase.co/rest/v1/gm_reviews\
--   ?status=eq.approved&select=coupon_code" \
--     -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"
--
-- Recenzije na strani izdelka pa se morajo se naprej prikazovati in koda
-- REVIEW-... mora v kosarici se naprej dati popust.
