-- Tabele za GoMushroom DN app (materiali/index.html)
-- Zaženi v Supabase SQL editorju

CREATE TABLE IF NOT EXISTS gm_dn_work_orders (
  id              text PRIMARY KEY,
  oznaka          text UNIQUE NOT NULL,
  datum           text,
  namen           text,
  vrsta_gobe      text,
  serija_gobe     text,
  masa_gobe       numeric,
  serija_alc      text,
  kol_alc         integer DEFAULT 0,
  stek_alc        text DEFAULT 'bela',
  kol_alc_prodaja integer,
  kol_alc_interno integer,
  vit_c_alc       numeric DEFAULT 0,
  lecitin_alc     numeric DEFAULT 0,
  kol_gly         integer DEFAULT 0,
  stek_gly        text DEFAULT 'bela',
  kol_gly_prodaja integer,
  kol_gly_interno integer,
  vit_c_gly       numeric DEFAULT 0,
  lecitin_gly     numeric DEFAULT 0,
  izgube          numeric DEFAULT 0,
  aae_tinkture    numeric DEFAULT 0,
  vol_tinkture    numeric DEFAULT 0,
  masa_etoh       numeric DEFAULT 0,
  pct_etoh        numeric DEFAULT 96.25,
  gostota         numeric,
  vol_l           numeric DEFAULT 0,
  vol_pct         numeric,
  l_aae           numeric DEFAULT 0,
  trosarina       numeric,
  trosarina_eur   numeric,
  cena_alc        numeric,
  cena_gly        numeric,
  opomba          text,
  datum_zakljucka text,
  status          text DEFAULT 'odprt',
  ustvarjen       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gm_dn_etanol (
  id          text PRIMARY KEY,
  datum       text NOT NULL,
  tip         text NOT NULL,
  dokument    text,
  opomba      text,
  masa        numeric,
  pct         numeric,
  gostota     numeric,
  kolicina    numeric,
  l_aae       numeric DEFAULT 0,
  mas_pct     numeric,
  trosarina   numeric,
  strosek     numeric DEFAULT 0,
  aae_tinkture numeric,
  aae_izgube  numeric
);

CREATE TABLE IF NOT EXISTS gm_dn_materiali (
  id          text PRIMARY KEY,
  datum       text,
  tip         text NOT NULL,
  smer        text NOT NULL DEFAULT 'vhod',
  dokument    text,
  serija_gobe text,
  dobavitelj  text,
  kolicina    numeric DEFAULT 0,
  strosek     numeric DEFAULT 0,
  opomba      text
);

CREATE TABLE IF NOT EXISTS gm_dn_oprema (
  id           text PRIMARY KEY,
  kat          text DEFAULT 'oprema',
  naziv        text NOT NULL,
  model        text,
  status       text DEFAULT 'aktivna',
  opomba       text,
  datum_nakupa text,
  cena         numeric,
  serijska     text,
  dobavitelj   text,
  garancija    text,
  vzdrz        text,
  kolicina     numeric
);

CREATE TABLE IF NOT EXISTS gm_dn_rd (
  id              text PRIMARY KEY,
  datum           date,
  naziv           text,
  surovina        text,
  serija_surovine text,
  masa_surovine   numeric,
  masa_etoh       numeric,
  pct_etoh        numeric,
  vol_etoh        numeric,
  l_aae           numeric,
  izgube          numeric,
  opazanja        text,
  status          text DEFAULT 'odprt',
  datum_zakljucka date,
  etanol_knjizen  boolean DEFAULT false,
  ustvarjen       timestamptz DEFAULT now()
);

-- ── ALTER TABLE za posodobitve (zaženi če tabele že obstajajo) ──────────────

-- gm_dn_work_orders: dodaj stolpce za prodaja/interno razdelitev
ALTER TABLE gm_dn_work_orders
  ADD COLUMN IF NOT EXISTS kol_alc_prodaja integer,
  ADD COLUMN IF NOT EXISTS kol_alc_interno integer,
  ADD COLUMN IF NOT EXISTS kol_gly_prodaja integer,
  ADD COLUMN IF NOT EXISTS kol_gly_interno integer;

-- gm_dn_work_orders: suha snov (Lod, %) — meritev tinkture, ki jo naredi nalog
ALTER TABLE gm_dn_work_orders
  ADD COLUMN IF NOT EXISTS suha_snov numeric;

-- gm_dn_materiali: dodaj dobavitelj + sprosti NOT NULL na datum
ALTER TABLE gm_dn_materiali
  ADD COLUMN IF NOT EXISTS dobavitelj text;
ALTER TABLE gm_dn_materiali
  ALTER COLUMN datum DROP NOT NULL;

-- gm_dn_work_orders: razbitje porabljene gobe po serijah ([{serija,masa},...])
ALTER TABLE gm_dn_work_orders
  ADD COLUMN IF NOT EXISTS serije jsonb;

-- gm_dn_materiali / gm_dn_etanol: proizvajalec (pri etanolu pogosto ni isti kot
-- dobavitelj), etanol pa doslej dobavitelja sploh ni imel
ALTER TABLE gm_dn_materiali
  ADD COLUMN IF NOT EXISTS proizvajalec text;
ALTER TABLE gm_dn_etanol
  ADD COLUMN IF NOT EXISTS dobavitelj text,
  ADD COLUMN IF NOT EXISTS proizvajalec text;

-- ═══════════════════════════════════════════════════════════════════════════
-- OPREMA — inventarne oznake in uporaba po serijah
-- Zaženi vse skupaj; vsak stavek je varen za ponovni zagon.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Inventarna številka ─────────────────────────────────────────────────────
-- GM-0001, GM-0002 … Dodeli se enkrat in se ne spreminja: natisnjena nalepka
-- mora ostati veljavna. Nanjo je vezana QR povezava na kartico naprave.
ALTER TABLE gm_dn_oprema
  ADD COLUMN IF NOT EXISTS inv_st text;
-- Dve napravi ne smeta nositi iste oznake — nalepka bi kazala na napačno.
CREATE UNIQUE INDEX IF NOT EXISTS gm_dn_oprema_inv_st_idx
  ON gm_dn_oprema (inv_st) WHERE inv_st IS NOT NULL;

-- ── Polja, ki jih register potrebuje za zapisnik o proizvodnji ──────────────
ALTER TABLE gm_dn_oprema
  -- Proizvajalec ni isto kot dobavitelj; pri reklamaciji rabiš prvega.
  ADD COLUMN IF NOT EXISTS proizvajalec text,
  -- Kje naprava stoji — za popis in za iskanje po delavnici.
  ADD COLUMN IF NOT EXISTS lokacija text,
  -- Interval vzdrževanja v mesecih. Stolpec vzdrz nosi datum naslednjega;
  -- z intervalom ga je mogoče izračunati sam ob opravljenem vzdrževanju,
  -- namesto da ga vsakič vpisuješ na roko in ga kdaj pozabiš.
  ADD COLUMN IF NOT EXISTS vzdrz_interval_mes integer,
  -- Kako se pri merilu potrdi točnost. Vsakega merila ni mogoče umeriti in
  -- enotno polje "kalibracija" bi silit v vpis, ki ne obstaja:
  --   umerjanje   tehtnica — zunanji izvajalec z utežmi izda certifikat; rok velja
  --   preverjanje primerjava proti referenci brez nastavljanja; rok velja
  --   nastavitev  refraktometer — nastaviš ga na destilirano vodo pred uporabo
  --   certifikat  stekleni alkoholmeter po gostoti — nima česa nastavljati,
  --               ima tovarniški certifikat in razred; roka ni
  --   brez        točnost ni kritična
  ADD COLUMN IF NOT EXISTS preverjanje text,
  ADD COLUMN IF NOT EXISTS certifikat text,
  -- Datum in interval veljata samo pri umerjanju in preverjanju.
  ADD COLUMN IF NOT EXISTS kalibracija date,
  ADD COLUMN IF NOT EXISTS kalibracija_interval_mes integer,
  -- Ali naprava pride v stik z izdelkom (HACCP).
  ADD COLUMN IF NOT EXISTS stik_zivilo boolean DEFAULT false,
  -- Naprave, ki vedno tečejo skupaj s to: rotavapor → chiller, vakuumska
  -- črpalka, kontroler. Ko glavno napravo izbereš pri delovnem nalogu, se
  -- vpišejo tudi one.
  --
  -- Seznam je pripet na glavno napravo in ne kot skupna oznaka sklopa: ena
  -- črpalka je lahko naštet spremljevalec pri več rotavaporjih, česar oznaka
  -- sklopa ne zmore. Zveza je zato usmerjena — črpalka ne potegne rotavaporjev.
  ADD COLUMN IF NOT EXISTS spremljevalci jsonb;

-- ── Uporaba opreme po delovnih nalogih ──────────────────────────────────────
-- Register opreme pove, kaj imaš; ta tabela pove, na čem je nastala posamezna
-- serija — kar je za zapisnik o proizvodnji bistveno. Iz iste vezi bereš tudi
-- obratno smer: katere serije so šle skozi določeno napravo.
--
-- Obdobja uporabe ne beležimo posebej: to je obdobje delovnega naloga. Beležimo
-- namen, ker en nalog isto napravo uporabi v različnih korakih.
CREATE TABLE IF NOT EXISTS gm_dn_oprema_uporaba (
  id         text PRIMARY KEY,
  dokument   text NOT NULL,          -- oznaka DN (npr. DN-26-004)
  oprema_id  text NOT NULL,          -- gm_dn_oprema.id
  namen      text,                   -- ekstrakcija, filtracija, polnjenje …
  ustvarjen  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gm_dn_oprema_uporaba_dokument_idx ON gm_dn_oprema_uporaba (dokument);
CREATE INDEX IF NOT EXISTS gm_dn_oprema_uporaba_oprema_idx   ON gm_dn_oprema_uporaba (oprema_id);

-- ── Neto čas delovanja iz masne bilance ─────────────────────────────────────
-- Bilanca je proces koncentriranja: rotavapor teče ves čas, ko je serija v
-- njem. Neto čas je vsota odsekov od vhoda (V) do izhoda (I) ali regenerata
-- (R); Corr je knjigovodski popravek in ne pomeni, da je naprava tekla.
--
-- Zapisan je na vsako napravo v procesu in je podlaga za dnevnik njenega dela
-- ter za servisne intervale po urah.
ALTER TABLE gm_dn_oprema_uporaba
  ADD COLUMN IF NOT EXISTS bil_kljuc text,     -- serija iz bilance: tinktura|||batch
  ADD COLUMN IF NOT EXISTS minute integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cas_od timestamptz,   -- prvi vhod
  ADD COLUMN IF NOT EXISTS cas_do timestamptz;   -- zadnji izhod ali regenerat
-- Stolpca nista "od"/"do": "do" je v Postgresu rezervirana beseda in bi terjala
-- narekovaje v vsaki poizvedbi.
CREATE INDEX IF NOT EXISTS gm_dn_oprema_uporaba_bil_idx ON gm_dn_oprema_uporaba (bil_kljuc);

-- Serija v bilanci nima nujno delovnega naloga, zato dokument ne sme biti
-- obvezen; brez tega bi bila uporaba opreme na taki seriji zavrnjena.
ALTER TABLE gm_dn_oprema_uporaba
  ALTER COLUMN dokument DROP NOT NULL;

-- RLS enako kot ostale zasebne tabele (glej doc/supabase-rls-faza1.sql).
-- Brez tega bi bila nova tabela edina odprta za publishable ključ — torej za
-- kogarkoli — medtem ko so vse sosednje zaklenjene.
ALTER TABLE gm_dn_oprema_uporaba ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gm_auth_all ON gm_dn_oprema_uporaba;
CREATE POLICY gm_auth_all ON gm_dn_oprema_uporaba
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Preveri, kaj je nastalo ─────────────────────────────────────────────────
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_dn_oprema'
   and column_name in ('inv_st','proizvajalec','lokacija','vzdrz_interval_mes',
                       'kalibracija','kalibracija_interval_mes','stik_zivilo')
 order by column_name;

select c.relname as tabela, c.relrowsecurity as rls_vklopljen,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as st_politik
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname='gm_dn_oprema_uporaba';

-- ── Dovoli dostop z anon ključem ────────────────────────────────────────────
-- Najlažje: v Supabase -> Authentication -> Policies -> onemogoči RLS za te tabele
-- ALI dodaj politiko:
-- ALTER TABLE gm_dn_work_orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon_all" ON gm_dn_work_orders FOR ALL USING (true) WITH CHECK (true);
-- (ponovi za vse 4 tabele)
