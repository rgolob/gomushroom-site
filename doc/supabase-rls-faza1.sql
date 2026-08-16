-- ═══════════════════════════════════════════════════════════════════════════
-- FAZA 1 — zakleni tabele, ki jih trgovina nikoli ne bere
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Zaženi ŠELE potem, ko prijava z e-naslovom v obeh aplikacijah deluje in
-- opozorilo "Prijava brez Supabase Auth" izgine. Do takrat zahtevki nosijo
-- publishable ključ in bi jih te politike zavrnile.
--
-- Trgovina se teh tabel ne dotakne, zato prodaja ne more pasti. Če gre kaj
-- narobe, je na dnu datoteke stavek za takojšnjo vrnitev nazaj.
--
-- PREDPOGOJ v Supabase:
--   1. Authentication → Providers → Email: vklopljen
--   2. Authentication → Users → Add user (e-naslov + geslo, potrdi e-naslov)
--   3. Authentication → Providers → Email → "Confirm email" lahko pustiš
--      vklopljen; uporabnika, dodanega ročno, se da potrditi ob kreiranju
--   4. Priporočeno: Sign-ups DISABLED, da si ne more nihče ustvariti računa

-- ── 1. Pogled za trgovino ──────────────────────────────────────────────────
-- Trgovina iz delovnih nalogov bere samo datum naslednje serije. Cel nalog
-- nosi tudi trošarine in stroške, zato tabelo zakleneš, javno pa razkriješ
-- šest stolpcev skozi pogled. Pogled brez security_invoker teče s pravicami
-- lastnika in zato bere skozi RLS na tabeli — prav to potrebujemo.
create or replace view gm_odprti_nalogi as
  select vrsta_gobe, serija_alc, oznaka, datum, predviden_zakljucek, status
    from gm_dn_work_orders
   where status = 'odprt';
grant select on gm_odprti_nalogi to anon, authenticated;

-- ── 2. Vklopi RLS in dovoli samo prijavljenim ──────────────────────────────
-- POZOR: odstranimo VSE obstojece politike na teh tabelah, ne le svoje.
-- Del tabel (gm_dn_*) ze ima politiko, vezano na vlogo anon. Ce bi jo pustili,
-- bi tabela po vklopu RLS ostala odprta za publishable kljuc - videti bi bilo
-- kot zascita, delovalo pa ne bi. Politike najprej izpisemo, da se vidi, kaj
-- je bilo odstranjeno.
do $$
declare t text; pol text; n int;
begin
  foreach t in array array[
    'gm_dn_work_orders','gm_dn_etanol','gm_dn_materiali','gm_dn_oprema',
    'gm_dn_rd','gm_dn_bilanca','gm_dn_gly_zapisi','gm_dn_mat_tipi',
    'gm_customers','gm_invoices','gm_sale_groups','gm_sale_lines',
    'gm_sale_line_batches','gm_batches','gm_inv_counters','gm_tiers'
  ] loop
    if to_regclass(t) is null then
      raise notice 'preskocena (ne obstaja): %', t; continue;
    end if;
    n := 0;
    for pol in select policyname from pg_policies
                where schemaname='public' and tablename=t loop
      execute format('drop policy %I on %I', pol, t);
      raise notice '  odstranjena stara politika %.%', t, pol;
      n := n + 1;
    end loop;
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy gm_auth_all on %I for all to authenticated using (true) with check (true)', t);
    raise notice 'zaklenjeno: %  (odstranjenih starih politik: %)', t, n;
  end loop;
end $$;

-- ── 2b. Tabele, ki jih uporablja samo zaloga ───────────────────────────────
-- Manjkale so v prvem seznamu. Trgovina se jih ne dotakne, zato enak zaklep.
do $$
declare t text; pol text;
begin
  foreach t in array array['gm_data','gm_expenses','partner_data'] loop
    if to_regclass(t) is null then
      raise notice 'preskocena (ne obstaja): %', t; continue;
    end if;
    for pol in select policyname from pg_policies
                where schemaname='public' and tablename=t loop
      execute format('drop policy %I on %I', pol, t);
      raise notice '  odstranjena stara politika %.%', t, pol;
    end loop;
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy gm_auth_all on %I for all to authenticated using (true) with check (true)', t);
    raise notice 'zaklenjeno: %', t;
  end loop;
end $$;

-- ── 2c. Tabele, ki jih delita trgovina in zaloga ───────────────────────────
-- Trgovina mora do njih brez prijave, zato obstojecih politik NE brisemo -
-- samo dodamo se eno za prijavljenega, da zaloga spet bere in pise. Brisanje
-- bi podrlo prodajo.
do $$
declare t text;
begin
  foreach t in array array[
    'gm_products','gm_product_variants','gm_settings','gm_reviews','gm_orders'
  ] loop
    if to_regclass(t) is null then
      raise notice 'preskocena (ne obstaja): %', t; continue;
    end if;
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists gm_auth_all on %I', t);
    execute format(
      'create policy gm_auth_all on %I for all to authenticated using (true) with check (true)', t);
    raise notice 'dodan dostop za prijavljenega: %  (obstojece politike ostajajo)', t;
  end loop;
end $$;

-- ── 3. Preveri, kaj je zdaj zaklenjeno ─────────────────────────────────────
-- rowsecurity mora biti true pri vseh spodnjih tabelah.
select c.relname as tabela, c.relrowsecurity as rls_vklopljen,
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as st_politik
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
  and (c.relname like 'gm\_%' or c.relname='partner_data')
order by c.relrowsecurity desc, c.relname;

-- ── 4. Kontrolni seznam po zagonu ──────────────────────────────────────────
-- V aplikaciji (prijavljen z e-naslovom):
--   [ ] Materiali: seznam se naloži, nov vnos se shrani, sync kaže ✓
--   [ ] Etanol: seznam se naloži, nova nabava se shrani
--   [ ] Nalogi: seznam se naloži, nalog se shrani in zaključi
--   [ ] Zaloga: serije, prodaje, računi — se naložijo in shranijo
--
-- Brez prijave (odjavi se ali odpri v anonimnem oknu):
--   [ ] Trgovina: izdelki, cene, recenzije se prikažejo
--   [ ] Trgovina: datum naslednje serije se še vedno prikaže (pogled deluje)
--   [ ] Trgovina: nakup gre do konca (najprej s testno kartico)
--   [ ] curl spodaj mora vrniti prazno ali napako, NE pa vrstic:
--       curl -s "https://<projekt>.supabase.co/rest/v1/gm_customers?select=*" \
--            -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"

-- ── 5. VRNITEV NAZAJ, če kaj ne dela ───────────────────────────────────────
-- Zaženi samo v sili; podatki ostanejo nedotaknjeni, odpre pa se dostop nazaj.
-- do $$
-- declare t text;
-- begin
--   foreach t in array array[
--     'gm_dn_work_orders','gm_dn_etanol','gm_dn_materiali','gm_dn_oprema',
--     'gm_dn_rd','gm_dn_bilanca','gm_dn_gly_zapisi','gm_dn_mat_tipi',
--     'gm_customers','gm_invoices','gm_sale_groups','gm_sale_lines',
--     'gm_sale_line_batches','gm_batches','gm_inv_counters','gm_tiers'
--   ] loop
--     if to_regclass(t) is null then continue; end if;
--     execute format('alter table %I disable row level security', t);
--   end loop;
-- end $$;

-- ── FAZA 2 in 3 (še NE) ────────────────────────────────────────────────────
-- Ostane še: bralne politike za tabele, ki jih trgovina res potrebuje
-- (gm_products, gm_product_variants, gm_variant_stock_status, gm_settings,
-- gm_reviews samo odobrene), in politiki samo za vpis na gm_orders ter
-- gm_reviews. Te se dotaknejo blagajne, zato šele po ločenem testu nakupa.
