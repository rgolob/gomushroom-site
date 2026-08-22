-- Bilanca pripada delovnemu nalogu, ne oznaki serije.
--
-- Oznaka serije je znana sele ob polnjenju oziroma zakljucku, koncentriranje pa
-- se zacne prej. Dokler je bila bilanca vodena po paru (tinktura, batch), je
-- nalog brez oznake serije svoje bilance ni imel kam vezati.
--
-- Stolpec je neobvezen: dogodki brez njega (razvojne serije in vsi zapisi izpred
-- te spremembe) se na nalog se naprej pripnejo po imenu serije.

alter table gm_dn_bilanca add column if not exists dn_id text;

-- Bilanca naloga se bere ob vsakem odprtju koraka in zavihka.
create index if not exists gm_dn_bilanca_dn_id_idx on gm_dn_bilanca (dn_id);
