-- ═══════════════════════════════════════════════════════════════════════════
-- gm_dn_gly_zapisi: dopolnitev stolpcev
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Napaka, ki to zahteva:
--   PGRST204 — Could not find the 'vir' column of 'gm_dn_gly_zapisi'
--
-- Isti vzorec kot pri gm_dn_rd: tabela je nastala pred temi stolpci, aplikacija
-- pa jih od takrat pise. Zapis zato v bazo ni sel in je ostal samo v brskalniku.
--
-- Pozor: PostgREST v napaki poimenuje samo PRVI manjkajoci stolpec. Zato tu ne
-- dodajamo enega, ampak vse, ki jih aplikacija pise (glyToSb).

create table if not exists gm_dn_gly_zapisi (
  id text primary key
);

alter table gm_dn_gly_zapisi
  add column if not exists dn_id     text,
  add column if not exists vir       text,
  add column if not exists tinktura  text,
  add column if not exists batch     text,
  add column if not exists bil_kljuc text,
  add column if not exists vnos      jsonb,
  add column if not exists izracun   jsonb,
  add column if not exists doseceno  jsonb,
  add column if not exists shranjen  timestamptz default now();

comment on column gm_dn_gly_zapisi.vir is
  'Od kod je zapis prisel (obrazec serije / delovni nalog).';
comment on column gm_dn_gly_zapisi.doseceno is
  'Dejansko dosezene kolicine; brez tega je zapis samo nacrt.';

-- Tabela je pod istim pravilom kot ostale (glej supabase-rls-faza1.sql):
-- bere in pise samo prijavljen uporabnik.
alter table gm_dn_gly_zapisi enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
     where tablename = 'gm_dn_gly_zapisi' and policyname = 'gm_auth_all'
  ) then
    create policy gm_auth_all on gm_dn_gly_zapisi
      for all to authenticated using (true) with check (true);
  end if;
end $$;
revoke all on gm_dn_gly_zapisi from anon;

-- PostgREST drzi shemo v predpomnilniku; brez tega bi novi stolpci prijeli
-- sele cez kaksno minuto.
notify pgrst, 'reload schema';

-- ── Preveri ────────────────────────────────────────────────────────────────
-- Vrniti mora 10 vrstic (9 zgornjih + id).
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_dn_gly_zapisi'
 order by column_name;
