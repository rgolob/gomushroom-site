-- ═══════════════════════════════════════════════════════════════════════════
-- Popis etanola: kanistri v bazi, ne samo v brskalniku
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ZAZENI PRED objavo nove razlicice aplikacije materiali.
--
-- Zakaj
-- ─────
-- Popis je doslej zivel v localStorage. To pomeni: ce brskalnik pocisti
-- podatke, je popis izgubljen, in na drugem racunalniku ga sploh ni. Za
-- pripomocek je bilo to dovolj, za evidenco zaloge pa ne — zlasti odkar se
-- ob mesanju iz kanistrov odsteva in mora stanje drzati.
--
-- Kaj hranimo
-- ───────────
-- Tisto, kar zares izmeris: maso, odcitek alkoholometra in temperaturo
-- merjenja. Prava jakost pri 20 C, volumen in AAE se iz tega izracunajo v
-- aplikaciji po tabeli OIML R 22 — shranjeni ne bi bili nic bolj resnicni,
-- razsli pa bi se, ce se popravek kdaj izboljsa.

create table if not exists gm_etanol_zaloga (
  id           text primary key,
  oznaka       text,
  masa         numeric not null default 0,   -- kg
  odcitek      numeric not null default 0,   -- vol %, kot kaze alkoholometer
  temperatura  numeric,                      -- C ob merjenju; prazno = 20
  opomba       text,
  posodobljeno timestamptz not null default now(),
  ustvarjeno   timestamptz not null default now()
);

comment on table gm_etanol_zaloga is
  'Kanistri z etanolom: kar je bilo izmerjeno. Prava jakost pri 20 C, volumen '
  'in AAE se racunajo v aplikaciji po OIML R 22.';
comment on column gm_etanol_zaloga.odcitek is
  'Odcitek alkoholometra pri temperaturi merjenja, ne jakost pri 20 C.';

-- ── Dostop ─────────────────────────────────────────────────────────────────
-- Enako kot ostale tabele aplikacije: bere in pise samo prijavljen uporabnik.
alter table gm_etanol_zaloga enable row level security;

do $$
declare pol text;
begin
  for pol in select policyname from pg_policies
              where schemaname='public' and tablename='gm_etanol_zaloga' loop
    execute format('drop policy %I on gm_etanol_zaloga', pol);
  end loop;
end $$;

create policy gm_auth_all on gm_etanol_zaloga
  for all to authenticated using (true) with check (true);

revoke all on gm_etanol_zaloga from anon;

-- ── Preveri ────────────────────────────────────────────────────────────────
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_etanol_zaloga'
 order by ordinal_position;

select policyname, cmd, roles
  from pg_policies
 where tablename = 'gm_etanol_zaloga';
--
-- Pricakovano: osem stolpcev in ena politika gm_auth_all za {authenticated}.

-- ── Pregled zaloge ─────────────────────────────────────────────────────────
--   select oznaka, masa, odcitek, temperatura, posodobljeno
--     from gm_etanol_zaloga
--    order by odcitek desc;

-- ═══════════════════════════════════════════════════════════════════════════
-- Dopolnitev: tara kanistra
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Kanister stehtas poln, na tehtnici je torej bruto. Ce je masa praznega
-- zapisana enkrat, ti ni treba vsakic odstevati na pamet — vpises bruto in
-- neto se izracuna sam.
--
-- Masa v stolpcu masa ostaja NETO, torej etanol sam. Bruto se ne shranjuje:
-- je le vhod za preracun in bi se ob vsakem dolivanju razsel z realnostjo,
-- neto pa je tisto, s cimer se racuna zaloga.

alter table gm_etanol_zaloga
  add column if not exists tara numeric;

comment on column gm_etanol_zaloga.tara is
  'Masa praznega kanistra v kg. Neobvezno; ce je vpisana, lahko v aplikaciji '
  'vpises bruto in neto se izracuna.';

-- ── Preveri ────────────────────────────────────────────────────────────────
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_etanol_zaloga' and column_name = 'tara';
