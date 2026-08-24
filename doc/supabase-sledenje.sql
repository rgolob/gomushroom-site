-- Sledenje posiljki na racunu.
--
-- Spletno narocilo gre na posto in kupec pricakuje stevilko za sledenje.
-- Vpise se ob oznaki "Predano", ko je stevilka v roki; od tam gre v obvestilo
-- o odpremi in ostane na racunu, ce jo kdo kasneje isce.
--
-- Stolpec je neobvezen: dokler ga ni, aplikacija dela naprej, racun se shrani
-- brez njega in enkrat na sejo pove, da se sledenje ne shranjuje.

alter table gm_invoices add column if not exists sledenje text;
