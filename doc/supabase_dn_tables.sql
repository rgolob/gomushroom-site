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

-- gm_dn_materiali: dodaj dobavitelj + sprosti NOT NULL na datum
ALTER TABLE gm_dn_materiali
  ADD COLUMN IF NOT EXISTS dobavitelj text;
ALTER TABLE gm_dn_materiali
  ALTER COLUMN datum DROP NOT NULL;

-- ── Dovoli dostop z anon ključem ────────────────────────────────────────────
-- Najlažje: v Supabase -> Authentication -> Policies -> onemogoči RLS za te tabele
-- ALI dodaj politiko:
-- ALTER TABLE gm_dn_work_orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon_all" ON gm_dn_work_orders FOR ALL USING (true) WITH CHECK (true);
-- (ponovi za vse 4 tabele)
