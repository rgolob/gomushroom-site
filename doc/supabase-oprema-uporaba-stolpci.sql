-- ═══════════════════════════════════════════════════════════════════════════
-- MANJKAJOČI STOLPCI V gm_dn_oprema_uporaba
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Aplikacija je ob shranjevanju naloga javila:
--
--   PGRST204 — Could not find the 'bil_kljuc' column
--              of 'gm_dn_oprema_uporaba' in the schema cache
--
-- Tabela je bila ustvarjena, preden so bili dodani stolpci za neto čas
-- delovanja naprave iz masne bilance. Isti stavek stoji tudi v
-- doc/supabase_dn_tables.sql, a je bil dodan pozneje, zato ga ta baza še ni
-- videla. Ker je manjkal en sam stolpec, ni šla skozi cela vrstica — uporaba
-- opreme se ni sinhronizirala nikoli, čeprav je tabela obstajala.
--
-- Zaženi enkrat. Če so stolpci že tam, stavek ne naredi ničesar.

alter table gm_dn_oprema_uporaba
  add column if not exists bil_kljuc text,      -- serija iz bilance: tinktura|||batch
  add column if not exists minute integer default 0,
  add column if not exists cas_od timestamptz,  -- prvi vhod
  add column if not exists cas_do timestamptz;  -- zadnji izhod ali regenerat

create index if not exists gm_dn_oprema_uporaba_bil_idx
  on gm_dn_oprema_uporaba (bil_kljuc);

-- Serija v bilanci nima nujno delovnega naloga, zato dokument ne sme biti
-- obvezen; brez tega bi bila uporaba opreme na taki seriji zavrnjena.
alter table gm_dn_oprema_uporaba
  alter column dokument drop not null;

-- ── Ob tem še datum koraka ─────────────────────────────────────────────────
-- Korak z datumom brez ur je datum ob ponovnem branju izgubil. Nalog za nazaj
-- je tak skoraj vedno.
alter table gm_dn_koraki
  add column if not exists datum date;

-- ── Preveri ────────────────────────────────────────────────────────────────
-- Vsi štirje stolpci morajo biti na seznamu:
select column_name, data_type
  from information_schema.columns
 where table_schema='public' and table_name='gm_dn_oprema_uporaba'
 order by ordinal_position;

-- In datum pri korakih:
select column_name
  from information_schema.columns
 where table_schema='public' and table_name='gm_dn_koraki' and column_name='datum';

-- ── Po zagonu ──────────────────────────────────────────────────────────────
--   [ ] Odpri in shrani delovni nalog — klicaj v glavi mora izginiti
--   [ ] Oprema → naprava → Dnevnik dela: vrstice se pojavijo
--   [ ] Če klicaj ostane, ga tapni — pove, kaj še manjka
