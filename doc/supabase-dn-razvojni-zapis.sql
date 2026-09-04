-- ═══════════════════════════════════════════════════════════════════════════
-- Razvojni zapis na delovnem nalogu: delo in zakljucek
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ZAZENI PRED objavo nove razlicice aplikacije materiali. Brez teh stolpcev
-- vpisano ostane samo lokalno; aplikacija zapis sicer shrani, a okrnjen, in te
-- na to opozori.
--
-- Zakaj
-- ─────
-- Redni nalog ima namen samodejen ("Ekstrakcija Reishi") in poteka ni treba
-- opisovati — pove ga zaporedje korakov. Razvojni nalog pa je poskus: zakaj si
-- ga delal, kaj si naredil in kaj je iz tega prislo, je njegova vsebina in
-- brez tega je cez pol leta neuporaben.
--
-- Namen je ze obstajal (stolpec namen), a je bil v obrazcu zaklenjen in
-- samodejen. Pri razvojnem nalogu je odslej prosto besedilo; pri rednem ostane
-- samodejen, da se ne pise vsakic isto.

alter table gm_dn_work_orders
  add column if not exists delo text,
  add column if not exists zakljucek text;

comment on column gm_dn_work_orders.delo is
  'Razvojni nalog: kaj je bilo narejeno — postopek, parametri, opazanja med '
  'potekom. Pri rednem nalogu ostane prazno.';
comment on column gm_dn_work_orders.zakljucek is
  'Razvojni nalog: kaj je iz poskusa prislo — rezultat, sklep, kaj naprej.';

-- ── Preveri ────────────────────────────────────────────────────────────────
select column_name, data_type
  from information_schema.columns
 where table_name = 'gm_dn_work_orders'
   and column_name in ('namen', 'delo', 'zakljucek')
 order by column_name;
--
-- Pricakovane tri vrstice: delo (text), namen (text) in zakljucek (text).
-- namen je obstajal ze prej; tu je samo zato, da vidis vse tri skupaj.

-- ── Pregled razvojnih nalogov ──────────────────────────────────────────────
--   select oznaka, datum, namen, delo, zakljucek
--     from gm_dn_work_orders
--    where je_rd
--    order by datum desc;
