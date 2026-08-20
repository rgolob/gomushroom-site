-- ═══════════════════════════════════════════════════════════════════════════
-- PROCESNI KORAKI — kaj se je s serijo dogajalo, kdaj, s čim in kako dolgo
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Delovni nalog je doslej vedel, KAJ je vstopilo in KAJ je nastalo, ne pa
-- KAKO. Bilanca (gm_dn_bilanca) beleži mase po fazah OF/VF/TE, torej odgovarja
-- na »koliko snovi je kje«. Čas v bilanco ne sodi: rotavapor, ki je tekel štiri
-- ure, in tisti, ki je tekel štirideset minut, dasta lahko enake masne vrstice.
--
-- Ta tabela doda manjkajočo plast — procesni korak s časom, opremo in parametri.
-- Faza je skupna os obeh: dogodek v bilanci in korak, ki ga je povzročil, sta
-- povezana prek nje (in po želji prek korak_id).
--
-- Iz trajanj korakov padejo ure koncentriranja, ure po napravi za vzdrževanje
-- in umerjanje ter strošek naprave na serijo — brez podvajanja podatkov.
--
-- Zaporedje je pri tem procesu vedno isto, zato se koraki ob odprtju naloga
-- ustvarijo iz predloge (master batch record → executed batch record). Korak,
-- ki ga pri konkretni seriji ni bilo, se označi kot preskočen — kar je hkrati
-- dokaz, da ni bil pozabljen.

create table if not exists gm_dn_koraki (
  id         text primary key,
  dokument   text not null,           -- gm_dn_work_orders.oznaka
  zaporedje  integer not null default 0,
  korak      text not null,           -- kljuc iz predloge: uz, stiskanje, koncentriranje …
  naziv      text,                    -- prikazno ime ob nastanku (predloga se lahko spremeni)
  faza       text,                    -- OF / VF / TE; prazno pri korakih brez faze
  oprema_id  text,                    -- gm_dn_oprema.id
  zacetek    timestamptz,
  konec      timestamptz,
  izvajalec  text,
  -- Parametri se po tipu koraka mocno razlikujejo: UZ ima moc in minute na
  -- kozarec, vrocevodna stopinje in ure, koncentriranje ciljno maso. Loceni
  -- stolpci bi dali tabelo z dvajsetimi vecinoma praznimi polji.
  parametri  jsonb not null default '{}'::jsonb,
  status     text not null default 'nacrtovan',  -- nacrtovan / v_teku / koncan / preskocen
  opomba     text,
  ustvarjen  timestamptz default now()
);

create index if not exists gm_dn_koraki_dokument_idx on gm_dn_koraki (dokument);
create index if not exists gm_dn_koraki_oprema_idx   on gm_dn_koraki (oprema_id);

-- Isti korak v istem nalogu se ne sme podvojiti ob ponovnem uvozu predloge.
create unique index if not exists gm_dn_koraki_dokument_zap_idx
  on gm_dn_koraki (dokument, zaporedje);

-- ── Dostop ────────────────────────────────────────────────────────────────
-- Enako kot vse gm_dn_* tabele: samo prijavljeni. Trgovina se jih ne dotakne.
alter table gm_dn_koraki enable row level security;

do $$
declare pol text;
begin
  for pol in select policyname from pg_policies
              where schemaname='public' and tablename='gm_dn_koraki' loop
    execute format('drop policy %I on gm_dn_koraki', pol);
  end loop;
end $$;

create policy gm_auth_all on gm_dn_koraki
  for all to authenticated using (true) with check (true);

revoke all on gm_dn_koraki from anon;

-- ── Ure po napravi ────────────────────────────────────────────────────────
-- Neto cas dela naprave, ki ga potrebujeta vzdrzevanje in umerjanje.
create or replace view gm_oprema_ure as
  select oprema_id,
         count(*)                                              as st_uporab,
         sum(extract(epoch from (konec - zacetek)) / 3600.0)    as ure,
         min(zacetek)                                           as prva_uporaba,
         max(konec)                                             as zadnja_uporaba
    from gm_dn_koraki
   where oprema_id is not null
     and zacetek is not null and konec is not null
     and konec > zacetek
   group by oprema_id;

grant select on gm_oprema_ure to authenticated;

-- ── Preveri ───────────────────────────────────────────────────────────────
--   select * from gm_dn_koraki where dokument = 'DN-26-001' order by zaporedje;
--   select * from gm_oprema_ure order by ure desc;
--
-- Anon ne sme imeti nicesar:
--   set role anon;
--   select count(*) from gm_dn_koraki;   -- pricakovano: permission denied
--   reset role;
