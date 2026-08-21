-- ═══════════════════════════════════════════════════════════════════════════
-- VRSTA NAPRAVE — da procesni korak ponudi tehtnico, ne celega registra
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Kategorija (kat) pove, KAKO se z napravo ravna: oprema, merilo, drobni
-- inventar. Ne pove pa, KAJ naprava je. Zato je spustni seznam pri koraku
-- nasteval cel register — tudi rotavapor pri tehtanju surovine.
--
-- Vrsta je zaprt seznam, ker se mora ujemati s tem, kar zahteva korak;
-- prosto besedilo se ne bi. Vrednosti so v aplikaciji (VRSTE_OPREME):
--   tehtnica, susilnik, uz_kopel, stiskalnica, rotavapor, chiller, vakuum,
--   tlacni, grelnik, mesalo, mlin, polnilnik, flowhood, alkoholometer,
--   termometer, ph, hladilnik, drugo
--
-- Stolpec je namenoma brez omejitve (check constraint): seznam vrst se bo
-- se dopolnjeval, vsaka nova vrsta pa bi sicer zahtevala nov SQL. Aplikacija
-- pise samo vrednosti iz seznama, prazna vrednost pomeni "ni dolocena".

alter table gm_dn_oprema add column if not exists vrsta text;

-- ── Kaj je zdaj brez vrste ─────────────────────────────────────────────────
-- Obrazec pri odpiranju predlaga vrsto iz naziva, potrdi pa jo clovek ob
-- shranjevanju. Spodnji izpis pove, koliko zapisov to se caka.
select coalesce(vrsta,'(ni določena)') as vrsta, count(*) as naprav
  from gm_dn_oprema
 where coalesce(kat,'oprema') <> 'inventar'
 group by 1
 order by naprav desc;

-- ── Kontrolni seznam po zagonu ─────────────────────────────────────────────
--   [ ] Oprema: odpri napravo — polje "Vrsta naprave" je vidno
--   [ ] Pri stari napravi je vrsta predlagana iz naziva; shrani, ce se ujema
--   [ ] Drobni inventar polja nima (ni naprava, ki bi jo korak klical)
--   [ ] Nalog → Procesni koraki → Tehtanje surovine: v spustnem seznamu je
--       skupina „Za ta korak" s tehtnico, ostalo pod „Ostalo"
--   [ ] Nov nalog: ce je tehtnica v registru ena sama, je ze izbrana
