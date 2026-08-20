-- ═══════════════════════════════════════════════════════════════════════════
-- BULK SERIJE — prodaja v litrih namesto v steklenicah
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Doslej je bila edina enota kos (steklenica 50 ml). Volumen je obstajal samo
-- v delovnem nalogu, in še to izpeljan iz števila steklenic:
--     vol_tinkture = (kol_alc + kol_alc_interno) × 0,050    (materiali/index.html:2981)
--
-- Bulk obrne to razmerje: vneseš volumen, steklenic pa ni. Zastavica je po
-- MEDIJU, ne po seriji — ista serija je lahko alkoholna v steklenicah in
-- glicerinska v bulku. Pogled zaloge že tako računa avail_alc in avail_gly
-- ločeno, zato se filter naravno prilega.
--
-- Mešanje znotraj enega medija (del ustekleničen, del bulk) NI podprto in za
-- zdaj tudi ni predvideno. Če bo kdaj, je pravi popravek prehod na mililitre
-- kot skupno enoto — ne dodatna zastavica.

-- ── 1. Delovni nalog ───────────────────────────────────────────────────────
-- kol_alc / kol_gly ostaneta za steklenice; pri bulku sta 0, količina pa gre v
-- kol_alc_l / kol_gly_l. Zastavica je eksplicitna, da obrazec ve, kaj risati,
-- tudi kadar količina še ni vnesena.
alter table gm_dn_work_orders
  add column if not exists alc_bulk  boolean default false,
  add column if not exists gly_bulk  boolean default false,
  add column if not exists kol_alc_l numeric,
  add column if not exists kol_gly_l numeric;

comment on column gm_dn_work_orders.kol_alc_l is
  'Volumen alkoholne tinkture v litrih, kadar je alc_bulk. Pri steklenicah ostane prazen — vol_tinkture se takrat še naprej izpelje iz kol_alc.';

-- ── 2. Serija ──────────────────────────────────────────────────────────────
-- alc_vol (ml na enoto) že obstaja. Pri bulku ga nastaviš na 1000, s čimer
-- »enota« pomeni liter in vsi obstoječi izračuni delujejo naprej.
alter table gm_batches
  add column if not exists alc_bulk boolean default false,
  add column if not exists gly_bulk boolean default false;

comment on column gm_batches.alc_bulk is
  'Serija ni ustekleničena — alc_qty je v litrih, ne v kosih. Take serije pogled gm_variant_stock_status izpusti, da ne pridejo v spletno trgovino.';

-- ── 3. Pogled zaloge ───────────────────────────────────────────────────────
-- BREZ TEGA bi 5 L bulka v trgovini pisalo »5 kom.« po 31,90 €, ker pogled
-- sešteva alc_qty in ne pogleda alc_vol. To je edina resna past te rešitve.
--
-- Ohranjen je popravek dvojnega odštevanja interne rezervacije iz
-- supabase-stock-view-popravek.sql; dodan je le izpust bulk serij.
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
          sum(case when coalesce(b.alc_bulk, false) then 0 else greatest(
                b.alc_qty
                - coalesce(s.sold_alc, 0)
                - greatest(coalesce(b.alc_alloc_int, 0) - coalesce(s.sold_int_alc, 0), 0)
              , 0) end) as avail_alc,
          sum(case when coalesce(b.gly_bulk, false) then 0 else greatest(
                b.gly_qty
                - coalesce(s.sold_gly, 0)
                - greatest(coalesce(b.gly_alloc_int, 0) - coalesce(s.sold_int_gly, 0), 0)
              , 0) end) as avail_gly,
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

grant select on gm_variant_stock_status to anon, authenticated;

-- ── 4. Prodajna vrstica ────────────────────────────────────────────────────
-- Razporejevalnik serij (zaloga/index.html:4418) jemlje po vrsti čez vse serije
-- izdelka in enot ne loči. Brez te zastavice bi zahteva »3« lahko vzela 3
-- steklenice iz ene serije in 3 litre iz druge — ali mešano.
alter table gm_sale_lines
  add column if not exists bulk boolean default false;

comment on column gm_sale_lines.bulk is
  'Vrstica je v litrih, ne v kosih. Razporejevalnik sme jemati samo iz serij z ujemajočo se zastavico.';

-- ── 5. Preveri ─────────────────────────────────────────────────────────────
-- Obstoječe serije morajo vse ostati nebulk in zaloga se ne sme spremeniti.
-- Primerjaj s stanjem pred zagonom:
--   select sku, type, qty_available, stock_status
--     from gm_variant_stock_status order by sku;
--
-- Nobena obstoječa vrstica ne sme imeti zastavice:
--   select count(*) from gm_batches where alc_bulk or gly_bulk;      -- 0
--   select count(*) from gm_sale_lines where bulk;                    -- 0

-- ── 6. Še odprto: tipi stolpcev ────────────────────────────────────────────
-- Bulk količine bodo decimalne (2,5 L). Če so ti stolpci integer, se to tiho
-- zaokroži. Najprej poglej:
--   select table_name, column_name, data_type
--     from information_schema.columns
--    where (table_name='gm_batches' and column_name in
--             ('alc_qty','gly_qty','alc_alloc_prod','alc_alloc_int',
--              'gly_alloc_prod','gly_alloc_int'))
--       or (table_name='gm_sale_line_batches' and column_name in ('alc','gly'))
--       or (table_name='gm_sale_lines' and column_name in ('alc','gly'))
--    order by table_name, column_name;
--
-- Za vsakega, ki je integer:
--   alter table <tabela> alter column <stolpec> type numeric;
