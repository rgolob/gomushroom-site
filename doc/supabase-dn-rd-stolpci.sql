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

-- ── Zapis poskusa in razclenitev etanola ───────────────────────────────────
-- Poskus etanola ne pokuri: vecina ga ostane v produktu. Do zdaj je nalog
-- poznal samo porabo, zato je vsak poskus izgledal kot cista izguba.
alter table gm_dn_rd
  add column if not exists namen        text,
  add column if not exists zakljucki    text,
  add column if not exists masa_produkt numeric,
  add column if not exists pct_produkt  numeric,
  add column if not exists aae_produkt  numeric,
  add column if not exists aae_izgube   numeric;

comment on column gm_dn_rd.aae_produkt is
  'L AAE, ki so ostali v produktu. Trosarinsko je poraba se vedno cela (l_aae).';
comment on column gm_dn_rd.aae_izgube is
  'L AAE, ki jih produkt ne nosi: l_aae - aae_produkt.';

-- PostgREST drzi shemo v predpomnilniku; brez tega bi novi stolpci prijeli
-- sele cez kaksno minuto.
notify pgrst, 'reload schema';

-- ── Preveri ────────────────────────────────────────────────────────────────
-- Vrniti mora 23 vrstic (16 + 6 spodnjih + id).
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_dn_rd'
 order by column_name;
