-- ═══════════════════════════════════════════════════════════════════════════
-- gm_dn_polizdelki — kartica polizdelka
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ZAZENI PRED objavo nove razlicice aplikacije materiali. Brez te tabele
-- polizdelki ostanejo samo v brskalniku (aplikacija to pove in jih poslje gor,
-- ko tabela nastane).
--
-- Kaj je polizdelek
-- ─────────────────
-- Oznacena posoda z vsebino, ki vsebuje alkohol, a se ni izdelek. Nastane ob
-- zakljucku naloga iz tistega, kar je ostalo v seriji. Alkohol je iz kanistra
-- ze odsel in je na kartici etanola knjizen kot izhod — ni pa ne izguba ne
-- prodano blago, zato je trosarina zanj odlozena, dokler se ne odlocimo, kaj
-- bo iz njega.
--
-- Zakaj seznam gibanj in ne stevci
-- ────────────────────────────────
-- Prej so bili trije stevci na nalogu (vpisano, sprosceno, odpisano). Vsak nov
-- izid je zahteval nov stevec; ko je prisla odprema drugemu podjetju, bi bil
-- cetrti. Gibanja tega ne potrebujejo: nov izid je nova vrstica, ne nov
-- stolpec. Poleg tega povedo, KAJ se je s posodo dogajalo, ne le koliko je se
-- notri — ena serija gre lahko po delih na vec strani.
--
-- Vrste gibanj in kaj se ob njih knjizi v knjigo etanola:
--   nastanek     nic — alkohol je bil odpisan ze ob zakljucku naloga
--   regeneracija VHOD, ker destilat res pritece nazaj v kanister
--   v_nalog      nic — tekocina gre naravnost v naslednji nalog, mimo kanistra
--   odprema      nic — iz zaloge je odsel ze ob nalogu; trosarina zapade tu
--   odpis        nic — iz istega razloga; dvojni odpis bi zalogo potisnil v minus

create table if not exists gm_dn_polizdelki (
  id            text primary key,
  oznaka        text,
  naziv         text,
  iz_dn         text,
  iz_dn_oznaka  text,
  datum         date,
  kolicina_g    numeric default 0,
  vol_pct       numeric default 0,
  l_aae         numeric default 0,
  lokacija      text,
  opomba        text,
  gibanja       jsonb default '[]'::jsonb,
  ustvarjen     timestamptz default now()
);

-- Ce je tabela nastala pred katerim od stolpcev, jih dodamo posamic. PostgREST
-- v napaki PGRST204 poimenuje samo PRVI manjkajoci stolpec, zato nastejemo vse.
alter table gm_dn_polizdelki
  add column if not exists oznaka       text,
  add column if not exists naziv        text,
  add column if not exists iz_dn        text,
  add column if not exists iz_dn_oznaka text,
  add column if not exists datum        date,
  add column if not exists kolicina_g   numeric default 0,
  add column if not exists vol_pct      numeric default 0,
  add column if not exists l_aae        numeric default 0,
  add column if not exists lokacija     text,
  add column if not exists opomba       text,
  add column if not exists gibanja      jsonb default '[]'::jsonb,
  add column if not exists ustvarjen    timestamptz default now();

comment on column gm_dn_polizdelki.oznaka is
  'Izpeljana iz naloga: RD-26-001-P1 je prvi polizdelek naloga RD-26-001. Na QR nalepki.';
comment on column gm_dn_polizdelki.l_aae is
  'L AAE ob nastanku. Trenutno stanje je vsota gibanj, ne to stevilo.';
comment on column gm_dn_polizdelki.gibanja is
  'Seznam gibanj: {id, datum, vrsta, lAAE, kolicinaG, kam, trosarina, opomba}.';

-- Enako pravilo kot pri ostalih tabelah: bere in pise samo prijavljen uporabnik.
alter table gm_dn_polizdelki enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
     where tablename = 'gm_dn_polizdelki' and policyname = 'gm_auth_all'
  ) then
    create policy gm_auth_all on gm_dn_polizdelki
      for all to authenticated using (true) with check (true);
  end if;
end $$;
revoke all on gm_dn_polizdelki from anon;

-- PostgREST drzi shemo v predpomnilniku.
notify pgrst, 'reload schema';

-- ── Preveri ────────────────────────────────────────────────────────────────
-- Vrniti mora 13 vrstic.
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_dn_polizdelki'
 order by column_name;
