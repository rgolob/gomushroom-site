-- ═══════════════════════════════════════════════════════════════════════════
-- FAZA 2 — naročila kupcev niso več javno berljiva
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PREDPOGOJ: najprej objavi novo različico trgovine (blagajna.js). Stara koda
-- vstavljeno naročilo prebere nazaj in bi po tem SQL-u obstala pri nakupu.
-- Vrstni red je torej: deploy → ta SQL → testni nakup.
--
-- Kaj je bilo narobe
-- ──────────────────
-- Faza 1 je zaklenila zasebne tabele, gm_orders pa je pustila odprt, ker ga
-- trgovina potrebuje. Potrebovala pa ga je tudi za BRANJE: po vstavitvi je
-- vrstico prebrala nazaj (Prefer: return=representation), da je prišla do
-- id-ja, iz katerega izračuna RF referenco.
--
-- RLS ne zna omejiti branja na »vrstico, ki si jo pravkar vstavil brez
-- prijave«, zato je bralna pravica veljala za vsa naročila. Publishable ključ
-- je v izvorni kodi trgovine — imena, e-naslovi, telefoni in naslovi kupcev so
-- bili s tem javno berljivi.
--
-- Trgovina zdaj id ustvari sama in RF izračuna pred vstavitvijo, zato branja ne
-- potrebuje več.

-- ── 1. gm_orders ───────────────────────────────────────────────────────────
-- Odstranimo VSE obstoječe politike, tudi tuje: če ostane katera s SELECT za
-- anon, bo videti kot popravek, luknja pa bo ostala odprta.
do $$
declare pol text; n int := 0;
begin
  for pol in select policyname from pg_policies
              where schemaname='public' and tablename='gm_orders' loop
    execute format('drop policy %I on gm_orders', pol);
    raise notice '  odstranjena stara politika gm_orders.%', pol;
    n := n + 1;
  end loop;
  raise notice 'gm_orders: odstranjenih politik %', n;
end $$;

alter table gm_orders enable row level security;

-- Kupec sme oddati naročilo …
create policy gm_orders_anon_insert on gm_orders
  for insert to anon with check (true);

-- … in trgovina sme zabeležiti, da je bilo potrditveno sporočilo poslano.
-- To je edini popravek, ki ga trgovina še dela. Ostane do faze 3, ko gre
-- ustvarjanje naročila v Netlify funkcijo s strežniškim ključem in anon ne bo
-- imel do te tabele nobenega dostopa več.
create policy gm_orders_anon_update on gm_orders
  for update to anon using (true) with check (true);

-- Politika pove, KATERE vrstice sme anon popraviti, ne katere stolpce. Sama bi
-- torej dovolila tudi spremembo zneska ali statusa v tuji vrstici. Stolpčne
-- pravice to zamejijo na edini stolpec, ki ga trgovina res piše.
revoke update on gm_orders from anon;
grant  update (confirmation_sent_at) on gm_orders to anon;
grant  insert on gm_orders to anon;

-- Brati sme samo prijavljeni (zaloga).
create policy gm_auth_all on gm_orders
  for all to authenticated using (true) with check (true);

-- ── 2. gm_reviews ──────────────────────────────────────────────────────────
-- Trgovina bere izključno odobrene (status=eq.approved v vseh poizvedbah) in
-- vstavlja nove s status='pending' brez branja nazaj. Politika to samo zapiše:
-- doslej je bilo pravilo v kodi trgovine, ne v bazi, in kdorkoli je lahko
-- prebral tudi nepregledane recenzije z e-naslovi piscev.
do $$
declare pol text; n int := 0;
begin
  for pol in select policyname from pg_policies
              where schemaname='public' and tablename='gm_reviews' loop
    execute format('drop policy %I on gm_reviews', pol);
    raise notice '  odstranjena stara politika gm_reviews.%', pol;
    n := n + 1;
  end loop;
  raise notice 'gm_reviews: odstranjenih politik %', n;
end $$;

alter table gm_reviews enable row level security;

create policy gm_reviews_anon_read on gm_reviews
  for select to anon using (status = 'approved');

create policy gm_reviews_anon_insert on gm_reviews
  for insert to anon with check (status = 'pending');

create policy gm_auth_all on gm_reviews
  for all to authenticated using (true) with check (true);

-- ── 3. Preveri ─────────────────────────────────────────────────────────────
select tablename, policyname, roles, cmd, qual, with_check
  from pg_policies
 where schemaname='public' and tablename in ('gm_orders','gm_reviews')
 order by tablename, policyname;

-- Anon mora imeti pri gm_orders samo insert (vse stolpce) in update enega
-- stolpca. Če se tu pojavi select, luknja ni zaprta.
select table_name, privilege_type, coalesce(column_name,'(vsi)') as stolpec
  from information_schema.column_privileges
 where grantee='anon' and table_schema='public' and table_name='gm_orders'
 union all
select table_name, privilege_type, '(tabela)'
  from information_schema.table_privileges
 where grantee='anon' and table_schema='public' and table_name='gm_orders'
 order by 1,2,3;

-- ── 4. Kontrolni seznam po zagonu ──────────────────────────────────────────
--   [ ] Trgovina: izdelki in ocene se prikažejo (brez prijave)
--   [ ] Trgovina: nakup z bančnim nakazilom gre do konca, RF se prikaže
--   [ ] Zaloga: naročilo se pojavi z imenom, naslovom in RF referenco
--   [ ] Zaloga → Recenzije: nepregledane (pending) so še vedno vidne
--       (pregled recenzij je doslej bral s publishable ključem; popravljeno)
--   [ ] Potrditveno sporočilo pride kupcu
--   [ ] Naslednji ukaz mora vrniti PRAZNO (ne vrstic):
--       curl -s "https://<projekt>.supabase.co/rest/v1/gm_orders?select=name,email" \
--            -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"
--   [ ] Isto za nepregledane recenzije:
--       curl -s "https://<projekt>.supabase.co/rest/v1/gm_reviews?status=eq.pending&select=name,email" \
--            -H "apikey: <publishable>" -H "Authorization: Bearer <publishable>"

-- ── 5. VRNITEV NAZAJ, če prodaja obstane ───────────────────────────────────
-- create policy gm_orders_anon_read on gm_orders for select to anon using (true);
-- create policy gm_reviews_anon_read_vse on gm_reviews for select to anon using (true);
-- grant update on gm_orders to anon;

-- ── FAZA 3 (še NE) ─────────────────────────────────────────────────────────
-- Ustvarjanje naročila v Netlify funkcijo s strežniškim ključem, kot je že
-- create-payment-intent. Takrat odpadeta obe anon politiki na gm_orders:
-- kupec ne bo mogel niti vstavljati vrstic neposredno, kar odpravi tudi
-- možnost, da bi kdo tabelo zapolnil z izmišljenimi naročili.
