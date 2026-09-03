-- ═══════════════════════════════════════════════════════════════════════════
-- E-NOVICE — zgodovina kampanj
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Dopolnjuje doc/supabase-enovice.sql. Brez te tabele kampanje delujejo, a za
-- sabo ne pustijo sledi: cez pol leta ne bi vedeli, kaj smo komu poslali in
-- kdaj. To je potrebno tudi, ko se kdo pritozi nad prejeto posto.
--
-- Vsebino kampanje shranimo v enakih poljih, kot jih vnese vmesnik (zadeva,
-- naslov, odstavki, gumb), ne kot sestavljen HTML. Tako je zapis berljiv in
-- ga je mogoce kadarkoli izrisati znova.

create table if not exists gm_campaigns (
  id            uuid        primary key default gen_random_uuid(),
  subject       text        not null,
  title         text        not null,
  body          text        not null,   -- odstavki, loceni s prazno vrstico
  button_label  text,
  button_url    text,
  -- Kdo in koliko. sent_count je stevilo naslovov, ki jih je Resend sprejel;
  -- failed_count tiste, ki jih ni. Skupaj povesta, ali je posiljanje koncalo.
  sent_by       text,
  sent_count    integer     not null default 0,
  failed_count  integer     not null default 0,
  recipients    integer     not null default 0,   -- koliko jih je bilo izbranih
  filter        text,                             -- opis izbire prejemnikov
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);

create index if not exists gm_campaigns_started_idx on gm_campaigns (started_at desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Politika omeji vrstice, grant stolpce; zapreti je treba oboje.
alter table gm_campaigns enable row level security;

drop policy if exists gm_auth_all on gm_campaigns;
create policy gm_auth_all on gm_campaigns
  for all to authenticated using (true) with check (true);

revoke all on gm_campaigns from anon;

-- ── Preveri ────────────────────────────────────────────────────────────────
select policyname, cmd, roles from pg_policies
 where schemaname = 'public' and tablename = 'gm_campaigns';

select grantee, privilege_type from information_schema.role_table_grants
 where table_name = 'gm_campaigns' and grantee = 'anon';
-- Ta mora vrniti PRAZNO.
