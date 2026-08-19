-- ═══════════════════════════════════════════════════════════════════════════
-- gm_variant_stock_status — interna rezervacija se je odštevala dvakrat
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Kaj je bilo narobe
-- ──────────────────
-- gm_batches.gly_alloc_int (in alc_alloc_int) je PRVOTNA interna rezervacija,
-- ne preostala. Ko se rezervirana količina interno porabi, se poraba zapiše
-- kot prodaja s kanalom 'int' — torej je že zajeta v sold_gly.
--
-- Pogled je odšteval oboje:
--     qty − prodano − alloc_int
-- s čimer je isto količino odštel dvakrat. Pri razprodani šarži je rezultat
-- padel pod nič, negativni prispevek pa je tiho požrl zalogo novejših šarž,
-- ker pogled šarže sešteva.
--
-- Konkretno pri reishiju (stanje ob odkritju):
--   R240131 gly: 77 − 77 − 5  = −5   (šarža je bila razprodana, pravilno 0)
--   R250322 gly: 66 − 52 − 11 =  3   (pravilno 14)
--   skupaj: −2  →  trgovina je pisala "ni na zalogi", v resnici 14 kosov
--
-- Zaloga (zaloga/index.html:3376) je ves čas računala pravilno:
--     remInt = max(0, alloc_int − sold_int)
-- torej odšteje samo NEPORABLJENI del rezervacije. Zato je zaloga kazala prav,
-- trgovina pa ne — isti podatki, dve različni formuli.
--
-- Popravek
-- ────────
--   1. odšteje se samo neporabljena rezervacija: max(0, alloc_int − sold_int)
--      (sold_int = prodaje s kanalom 'int', enako kot stockIsProdCh() v zalogi)
--   2. posamezna šarža ne more prispevati manj kot 0 (greatest(..., 0)),
--      tako kot Math.max(0, …) v zalogi
--   3. sg.status is distinct from 'stornirano' namesto <>: pri <> se vrstica z
--      status IS NULL tiho izpusti in se sploh ne šteje kot prodana. Zaloga
--      preskoči samo točno 'stornirano', vse drugo šteje kot prodajo.

create or replace view gm_variant_stock_status as
 with sold as (
   select slb.batch_id,
          sum(slb.alc) as sold_alc,
          sum(slb.gly) as sold_gly,
          coalesce(sum(slb.alc) filter (where sg.channel = 'int'), 0) as sold_int_alc,
          coalesce(sum(slb.gly) filter (where sg.channel = 'int'), 0) as sold_int_gly
     from gm_sale_line_batches slb
     join gm_sale_groups sg on sg.id = slb.group_id
    where sg.status is distinct from 'stornirano'
    group by slb.batch_id
 ), batch_stock as (
   select b.product_id,
          sum(greatest(
                b.alc_qty
                - coalesce(s.sold_alc, 0)
                - greatest(coalesce(b.alc_alloc_int, 0) - coalesce(s.sold_int_alc, 0), 0)
              , 0)) as avail_alc,
          sum(greatest(
                b.gly_qty
                - coalesce(s.sold_gly, 0)
                - greatest(coalesce(b.gly_alloc_int, 0) - coalesce(s.sold_int_gly, 0), 0)
              , 0)) as avail_gly,
          max(b.safety_alc) as safety_alc,
          max(b.safety_gly) as safety_gly
     from gm_batches b
     left join sold s on s.batch_id = b.id
    group by b.product_id
 )
 select pv.id as variant_id,
        pv.product_id,
        pv.type,
        pv.sku,
        pv.name,
        case pv.type
            when 'alc' then coalesce(bs.avail_alc, 0::numeric)
            else coalesce(bs.avail_gly, 0::numeric)
        end as qty_available,
        case pv.type
            when 'alc' then coalesce(bs.safety_alc, 0)
            else coalesce(bs.safety_gly, 0)
        end as safety_qty,
        case
            when case pv.type
                   when 'alc' then coalesce(bs.avail_alc, 0::numeric)
                   else coalesce(bs.avail_gly, 0::numeric)
                 end <= 0::numeric then 'out_of_stock'::text
            when case pv.type
                   when 'alc' then coalesce(bs.avail_alc, 0::numeric)
                   else coalesce(bs.avail_gly, 0::numeric)
                 end <= case pv.type
                          when 'alc' then coalesce(bs.safety_alc, 0)
                          else coalesce(bs.safety_gly, 0)
                        end::numeric then 'low_stock'::text
            else 'in_stock'::text
        end as stock_status
   from gm_product_variants pv
   left join batch_stock bs on bs.product_id = pv.product_id;

-- Pogled se ob create or replace ustvari na novo, zato pravico podelimo znova.
grant select on gm_variant_stock_status to anon, authenticated;

-- ── Preveri ────────────────────────────────────────────────────────────────
-- Za reishi mora zdaj pisati 11 (alc) in 14 (gly) — enako kot zaloga:
--   select p.slug, v.sku, v.type, s.qty_available, s.stock_status
--     from gm_product_variants v
--     join gm_products p on p.id = v.product_id
--     left join gm_variant_stock_status s on s.variant_id = v.id
--    where p.slug ilike '%reishi%';
--
-- Nikjer ne sme biti negativne vrednosti:
--   select sku, qty_available from gm_variant_stock_status where qty_available < 0;
--
-- Primerjaj celoten seznam s tem, kar kaže zaloga:
--   select sku, type, qty_available, safety_qty, stock_status
--     from gm_variant_stock_status order by sku;

-- ── VRNITEV NAZAJ ──────────────────────────────────────────────────────────
-- Prvotna različica je v git zgodovini tega popravka; obnoviš jo s
-- create or replace view in staro definicijo (pg_get_viewdef izpis).
