-- ═══════════════════════════════════════════════════════════════════════════
-- E-NOVICE — zbiranje naslovov in enkratne kode za prvi nakup
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Obiskovalec pusti e-naslov, v zameno dobi kodo za popust pri prvem nakupu.
--
-- Zakaj je koda vezana na e-naslov
-- ────────────────────────────────
-- Splošna koda (DOBRODOSLI10) prej ali slej pristane na strani s kuponi in jo
-- uporabljajo tudi tisti, ki naslova nikoli niso pustili. Zato je vsaka koda
-- tu enkratna IN zapisana skupaj z naslovom, ki jo je zahteval. Ob naročilu
-- mora e-naslov v naročilu ustrezati temu naslovu, sicer koda ne velja.
--
-- S tem odpadejo vsi trije običajni načini zlorabe:
--   • nabiranje kod z izmišljenimi naslovi — vsaka velja le za svoj naslov,
--   • koda na strani s kuponi — drugim ne koristi,
--   • večkratna uporaba — used_at se zapiše ob naročilu.
--
-- Brskalnik nad obema tabelama nima nobene pravice. Vpis opravi
-- netlify/functions/newsletter-signup, preverjanje in porabo pa
-- netlify/functions/validate-coupon in create-order — vsi s strežniškim
-- ključem, ki brskalnika nikoli ne doseže.

-- ── 1. Prijavljeni na e-novice ─────────────────────────────────────────────
create table if not exists gm_newsletter (
  id                 uuid primary key default gen_random_uuid(),
  email              text        not null,
  lang               text        not null default 'sl',
  source             text        not null default 'first_purchase_popup',
  -- Dokazilo o privolitvi: kaj je pisalo pod gumbom in kdaj je kliknil.
  -- Brez tega bi ob pritožbi ostala samo naša beseda proti njegovi.
  consent_text       text,
  consent_ip         text,
  subscribed_at      timestamptz not null default now(),
  unsubscribed_at    timestamptz,
  -- Token gre v odjavno povezavo, da za odjavo ni treba prijave.
  unsubscribe_token  uuid        not null default gen_random_uuid()
);

-- Naslov shranimo v mali začetnici (funkcija ga zniža), unikat pa vseeno
-- postavimo na lower(), da se Ana@ in ana@ ne moreta prijaviti dvakrat.
create unique index if not exists gm_newsletter_email_uidx
  on gm_newsletter (lower(email));

create index if not exists gm_newsletter_subscribed_idx
  on gm_newsletter (subscribed_at desc);

-- ── 2. Izdane kode ─────────────────────────────────────────────────────────
create table if not exists gm_coupons (
  id                  uuid        primary key default gen_random_uuid(),
  code                text        not null,
  pct                 numeric     not null default 10,
  email               text        not null,
  source              text        not null default 'first_purchase_popup',
  -- Velja samo, če ta naslov še ni naročal.
  first_purchase_only boolean     not null default true,
  issued_at           timestamptz not null default now(),
  expires_at          timestamptz not null,
  used_at             timestamptz,
  order_id            uuid
);

-- Iskanje po kodi je vedno neobčutljivo na velikost črk, zato indeks na upper().
create unique index if not exists gm_coupons_code_uidx on gm_coupons (upper(code));
create index if not exists gm_coupons_email_idx        on gm_coupons (lower(email));
create index if not exists gm_coupons_issued_idx       on gm_coupons (issued_at desc);

-- ── 3. RLS ─────────────────────────────────────────────────────────────────
-- Faza 2 nas je naučila, da politika in grant nista ista stvar: politika omeji
-- vrstice, grant stolpce. Zapreti je treba oboje.
alter table gm_newsletter enable row level security;
alter table gm_coupons    enable row level security;

drop policy if exists gm_auth_all on gm_newsletter;
create policy gm_auth_all on gm_newsletter
  for all to authenticated using (true) with check (true);

drop policy if exists gm_auth_all on gm_coupons;
create policy gm_auth_all on gm_coupons
  for all to authenticated using (true) with check (true);

revoke all on gm_newsletter from anon;
revoke all on gm_coupons    from anon;

-- ── 4. Nastavitve popupa ───────────────────────────────────────────────────
-- Vse, kar se utegne spreminjati, je tu — da za spremembo veljavnosti ali za
-- izklop popupa ni treba objavljati nove različice strani.
--
--   aktiven        popup se sploh prikaže
--   pct            odstotek popusta
--   veljavnostDni  koliko dni velja izdana koda
--   zamikSek       po koliko sekundah se prikaže
--   scrollPct      ali prej, če obiskovalec toliko odstotkov strani prevrti
--   ponovnoCezDni  koliko dni miruje, če ga obiskovalec zapre
insert into gm_settings (key, value)
values ('enovicePopup', '{"aktiven":true,"pct":10,"veljavnostDni":90,"zamikSek":25,"scrollPct":45,"ponovnoCezDni":7}')
on conflict (key) do nothing;

-- ── 5. Preveri ─────────────────────────────────────────────────────────────
-- Obe morata imeti samo gm_auth_all za authenticated; anon nič.
select tablename, policyname, cmd, roles
  from pg_policies
 where schemaname = 'public' and tablename in ('gm_newsletter', 'gm_coupons')
 order by tablename, policyname;

select grantee, table_name, privilege_type
  from information_schema.role_table_grants
 where table_name in ('gm_newsletter', 'gm_coupons') and grantee = 'anon';
-- Ta mora vrniti PRAZNO.
