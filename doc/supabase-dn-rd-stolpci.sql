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

-- Koncentrat z rotavaporja (vrstica R v masni bilanci): gre nazaj v kanister
-- in iz zaloge sploh ne odide. Zato se ne knjizi nikamor — niti kot izhod niti
-- kot vhod; knjizi se le tisto, kar zalogo res zapusti. Enako dela izhod
-- delovnega naloga, ki knjizi tinkture + gly + polizdelek + izgube, odvzema R
-- pa ne. Tu ga hranimo samo zato, da je razclenitev poskusa popolna.
alter table gm_dn_rd
  add column if not exists masa_regen numeric,
  add column if not exists pct_regen  numeric,
  add column if not exists aae_regen  numeric;

comment on column gm_dn_rd.aae_produkt is
  'L AAE, ki so ostali v produktu (polizdelek). Trosarina je odlozena.';
comment on column gm_dn_rd.aae_regen is
  'L AAE koncentrata, ki ostane na zalogi. Vrstica R v masni bilanci; ne knjizi se.';
comment on column gm_dn_rd.aae_izgube is
  'Manjko: l_aae - aae_regen - aae_produkt. Knjizi se skupaj s polizdelkom.';

-- ── Polizdelek pri poskusu ─────────────────────────────────────────────────
-- Pilotna serija ni za prodajo in lahko lezi mesece, dokler se ne odlocis, ali
-- jo regeneriras, predelas ali zavrzes. Delovni nalog to ze pozna (glej
-- supabase-dn-polizdelek.sql); poskus je do zdaj ves etanol odpisal kot porabo,
-- zato je nalog ostal odprt, ker ga ni bilo mogoce posteno zakljuciti.
alter table gm_dn_rd
  add column if not exists aae_polizdelek          numeric default 0,
  add column if not exists aae_polizdelek_sproscen numeric default 0,
  add column if not exists aae_polizdelek_odpisan  numeric default 0;

-- Odpis polizdelka pri delovnem nalogu: kadar polizdelka ne bo vec in se ne
-- vrne v zalogo. V knjigo etanola se pri tem ne knjizi nic — iz zaloge je ta
-- alkohol odsel ze ob nalogu.
alter table gm_dn_work_orders
  add column if not exists aae_polizdelek_odpisan numeric default 0;

comment on column gm_dn_rd.aae_polizdelek is
  'L AAE, vezani v pilotni seriji. Iz kanistra so odsli, a niso ne izguba ne prodano blago.';

-- PostgREST drzi shemo v predpomnilniku; brez tega bi novi stolpci prijeli
-- sele cez kaksno minuto.
notify pgrst, 'reload schema';

-- ── Preveri ────────────────────────────────────────────────────────────────
-- Vrniti mora 29 vrstic (16 + 6 + 3 + 3 spodnjih + id).
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_dn_rd'
 order by column_name;
