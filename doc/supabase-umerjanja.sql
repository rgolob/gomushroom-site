-- ═══════════════════════════════════════════════════════════════════════════
-- UMERJANJA IN PREVERJANJA MERIL
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Naprava doslej nosi le datum zadnjega umerjanja in interval. To pove, do
-- kdaj velja, ne pove pa, kolikokrat je bilo opravljeno, kdo ga je opravil in
-- kaj je pokazalo. Ko je treba dokazati, da je bila meritev opravljena z
-- merilom, ki je takrat veljalo, je en sam datum premalo.
--
-- Vsako potrjevanje tocnosti je zato svoj zapis, s casom na minuto natancno.
-- Naprava (gm_dn_oprema.kalibracija) nosi zadnje stanje, da roki in opozorila
-- delajo naprej; zgodovina je tu.

create table if not exists gm_dn_umerjanja (
  id           text primary key,
  oprema_id    text not null,          -- gm_dn_oprema.id
  ts           timestamptz not null,    -- kdaj je bilo opravljeno (datum in ura)
  nacin        text,                    -- umerjanje / preverjanje / nastavitev
  rok          date,                    -- do kdaj velja; prazno pri nastavitvi
  izvajalec    text,
  certifikat   text,                    -- samo pri umerjanju pri zunanjem izvajalcu
  interval_mes integer,
  opomba       text,                    -- rezultat, odstopanje
  ustvarjen    timestamptz default now()
);

create index if not exists gm_dn_umerjanja_oprema_idx on gm_dn_umerjanja (oprema_id);
create index if not exists gm_dn_umerjanja_ts_idx     on gm_dn_umerjanja (ts desc);

-- RLS enako kot ostale zasebne tabele (glej doc/supabase-rls-faza1.sql).
-- Brez tega bi bila nova tabela edina odprta za publishable kljuc.
alter table gm_dn_umerjanja enable row level security;
drop policy if exists gm_auth_all on gm_dn_umerjanja;
create policy gm_auth_all on gm_dn_umerjanja
  for all to authenticated using (true) with check (true);
revoke all on gm_dn_umerjanja from anon;

-- ── Preveri ────────────────────────────────────────────────────────────────
--   select * from gm_dn_umerjanja order by ts desc;
--
-- Anon ne sme imeti nicesar:
--   set role anon;
--   select count(*) from gm_dn_umerjanja;   -- pricakovano: permission denied
--   reset role;

-- ── Po zagonu ──────────────────────────────────────────────────────────────
--   [ ] Oprema → merilo s poteklim rokom → v koraku se pojavi rdeca zapora
--   [ ] Gumb "Opravi preverjanje" zapise datum in uro; korak se da zakljuciti
--   [ ] Ob zagonu aplikacije se izpise, katera merila cakajo
