-- ═══════════════════════════════════════════════════════════════════════════
-- Etanol, vezan v polizdelku
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ZAZENI PRED objavo nove razlicice aplikacije materiali. Brez teh stolpcev
-- Supabase zavrne zapis naloga in vpisana vrednost ostane samo lokalno.
--
-- Zakaj nov stolpec in ne izgube
-- ──────────────────────────────
-- Bilanca etanola je doslej poznala tri usode vhodnega alkohola:
--
--   vhod = tinkture (trosarinsko blago) + etanol v glicerinu + izgube
--
-- Pri razvojnem nalogu nastane se cetrta: etanol ostane vezan v necem, kar ni
-- koncni izdelek in ni namenjeno prodaji — na primer 2 kg 50 % izvlecka. Ta
-- etanol je odsel iz cisterne, zato ga bilanca mora videti, a ni ne izguba
-- (ni izhlapel, ne gre v regeneracijo) ne trosarinsko blago (izdelek se ni
-- koncan in ni prodan).
--
-- Ce bi ga vpisali med izgube, bi se bilanca sicer zaprla, a bi kazala izgubo,
-- ki je ni — in ob morebitni prodaji polizdelka ne bi bilo nikjer zapisano,
-- koliko trosarine je s tem zapadlo.

alter table gm_dn_work_orders
  add column if not exists aae_polizdelek numeric default 0,
  add column if not exists polizdelek_opis text;

comment on column gm_dn_work_orders.aae_polizdelek is
  'L AAE, vezan v polizdelku. Odsteje se od zaloge etanola, ni pa predmet '
  'trosarine — ta zapade sele ob prodaji ali predelavi v koncni izdelek.';
comment on column gm_dn_work_orders.polizdelek_opis is
  'Kaj polizdelek je, npr. "2 kg 50 % izvlecka". Brez tega je stevilka cez '
  'nekaj mesecev neuporabna.';

-- ── Preveri ────────────────────────────────────────────────────────────────
select column_name, data_type, column_default
  from information_schema.columns
 where table_name = 'gm_dn_work_orders'
   and column_name in ('aae_polizdelek', 'polizdelek_opis')
 order by column_name;
--
-- Pricakovano dve vrstici: aae_polizdelek (numeric, default 0) in
-- polizdelek_opis (text).

-- ── Koliko AAE lezi v polizdelkih ──────────────────────────────────────────
-- Isti sestevek kaze aplikacija na zaslonu Etanol; tu je za preverjanje.
--
--   select oznaka, aae_polizdelek, polizdelek_opis
--     from gm_dn_work_orders
--    where coalesce(aae_polizdelek, 0) > 0
--    order by datum;
