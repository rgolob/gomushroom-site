-- Sledenje posiljki na racunu.
--
-- Spletno narocilo gre na posto in kupec pricakuje stevilko za sledenje.
-- Vpise se ob oznaki "Predano", ko je stevilka v roki; od tam gre v obvestilo
-- o odpremi in ostane na racunu, ce jo kdo kasneje isce.
--
-- Stolpec je neobvezen: dokler ga ni, aplikacija dela naprej, racun se shrani
-- brez njega in enkrat na sejo pove, da se sledenje ne shranjuje.

alter table gm_invoices add column if not exists sledenje text;

-- Nacin predaje: 'posta' ali 'prevzem'.
--
-- Naslov o tem ne pove vsega - veleprodajni kupec ima naslov na racunu, pa
-- vseeno pride po blago sam. Zato se nacin izbere ob prodaji in je od tam
-- naprej podatek, ne domneva; po njem se odloci, ali se vprasa za sledenje in
-- ali se ponudi nalepka za posiljko.
--
-- Prav tako neobvezen: zapisi brez njega se ravnajo po starem merilu (naslov).

alter table gm_sale_groups add column if not exists dostava text;
