-- ═══════════════════════════════════════════════════════════════════════════
-- gm_dn_rd: dopolnitev stolpcev
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Napaka, ki to zahteva:
--   PGRST204 — Could not find the 'etanol_knjizen' column of 'gm_dn_rd'
--
-- Tabela je bila ustvarjena pred temi stolpci, CREATE TABLE IF NOT EXISTS pa
-- obstojeci tabeli stolpcev ne doda — zato jih dodamo rocno.
--
-- Pozor: PostgREST v napaki poimenuje samo PRVI manjkajoci stolpec. Zato tu ne
-- dodajamo enega, ampak vse, ki jih aplikacija pise (rdToSb) — sicer bi se ista
-- napaka vrnila z naslednjim imenom.

alter table gm_dn_rd
  add column if not exists oznaka          text,
  add column if not exists datum           date,
  add column if not exists naziv           text,
  add column if not exists surovina        text,
  add column if not exists serija_surovine text,
  add column if not exists masa_surovine   numeric,
  add column if not exists masa_etoh       numeric,
  add column if not exists pct_etoh        numeric,
  add column if not exists vol_etoh        numeric,
  add column if not exists l_aae           numeric,
  add column if not exists izgube          numeric,
  add column if not exists opazanja        text,
  add column if not exists status          text default 'odprt',
  add column if not exists datum_zakljucka date,
  add column if not exists etanol_knjizen  boolean default false,
  add column if not exists ustvarjen       timestamptz default now();

comment on column gm_dn_rd.etanol_knjizen is
  'true = poraba etanola za ta poskus je ze knjizena v knjigi etanola.';

-- PostgREST drzi shemo v predpomnilniku; brez tega bi novi stolpci prijeli
-- sele cez kaksno minuto.
notify pgrst, 'reload schema';

-- ── Preveri ────────────────────────────────────────────────────────────────
-- Vrniti mora 17 vrstic (16 zgornjih + id).
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_dn_rd'
 order by column_name;
