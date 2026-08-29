# TODO

Odprte stvari, ki so bile ugotovljene med delom in še niso rešene.
Vsaka ima zapisano, kje je in zakaj je pomembna.

## Varnost

### Supabase Auth namesto anon ključa
Vse tri aplikacije (`trgovina/`, `zaloga/`, `materiali/`) se v Supabase
prijavljajo samo s publishable ključem, ki je v izvorni kodi strani:

```js
const SB_KEY='sb_publishable_…';
const SB_HDR={…,'Authorization':'Bearer '+SB_KEY};
```

Geslo za vstop v `materiali/` in `zaloga/` je zgolj primerjava SHA-256 v
brskalniku (`LOGIN_HASH`) — Supabase o njem ne ve ničesar. Kdorkoli prebere
izvorno kodo strani, lahko bere in piše vse `gm_dn_*` tabele: knjigo etanola,
delovne naloge, bilanco, zapise šarž.

RLS s politiko za `anon` tega ne spremeni. Resnična rešitev je Supabase Auth
(pravi uporabnik) in politike, vezane na `auth.uid()`.

Glede na to, da gre za trošarinsko evidenco in zapise šarž, je to vredno
narediti.

### GDPR — strežniški purchase ne preverja privolitve
`netlify/functions/track-purchase.js` pošlje `purchase` v GA4 tudi, kadar je
kupec izbral »Samo nujne«. Brskalniška pot (`gmTrack`) privolitev preverja,
strežniška ne.

## Obračun etanola

### ~~`vrnjen` se šteje kot izhod~~ — rešeno

Vhod v knjigo etanola je izključno ročni vnos nabave ali regeneracije;
tretjega vhodnega tipa ni. Pravilo `isIn = nabava || regeneracija` je torej
popolno, ne pomanjkljivo.

Funkcija `knjizVrnjen()` je ustvarjala zapis tipa `vrnjen`, ki ga to pravilo
ne pozna. Nikoli ni bila dosegljiva (nihče ni nastavil `_dnVrnjenAAE`, nanjo
ni kazal noben gumb), zato takih zapisov v knjigi ni in zaloga zaradi tega
ni bila napačna. Odstranjena je, da ne more nastati pozneje.

### R&D poraba etanola se ne knjiži
`zakljuciRD()` obstaja in dela pravilno, a ni bil še nikoli sprožen. Etanol,
porabljen v razvojnih poskusih, zato na zalogi še vedno stoji.

Vprašanje za računovodjo oz. carinski oddelek: ali se etanol, porabljen v
razvoju brez nastanka produkta, obravnava kot obdavčena poraba, kot
dokumentiran primanjkljaj ali kako drugače. Odgovor določa, kaj naj aplikacija
sploh knjiži.

## Analitika

### `GA_API_SECRET` v Netlify
Brez te spremenljivke `netlify/functions/track-purchase.js` tiho vrne
`{"ok":false,"reason":"no_secret"}` in strežniški `purchase` — rezerva za
primer, ko se Stripe vrne s preusmeritve — nikoli ne odide.

### `add_payment_info` samo pri UPN
Event se sproži le v poti plačila po UPN, ne pri kartičnem plačilu prek
Stripa. V lijaku je zato `add_payment_info` sistematično nižji od
`begin_checkout`.

### `gmSelectItem()` je mrtva koda
Definiran v `js/analytics.js`, nikoli klican. Ali ga poveži na izbirnik
variante v trgovini ali odstrani.

## Materiali

### Hitri račun vsote regeneratov po fazah
Spodnja tabela v preglednici Bilance (OF / VF / TE, pogače, izgube, AAE po
fazah). Odloženo — »zaenkrat ne«.

### Revizijska sled — kdaj je bilo kaj vneseno
Danes se hrani samo zadnje stanje. Vsak zapis ima polje `shranjen`, a se ob
vsakem shranjevanju prepiše, in `sbPush*` pošilja `upsert` — prejšnja
vrednost izgine brez sledi. Vidi se torej, *kdaj je bil zapis nazadnje
spremenjen*, ne pa *kaj je bilo prej* in ne *koliko popravkov je bilo*.

Za trošarinsko evidenco in zapise šarž je to premalo: nadzornika ne zanima
le trenutna številka, ampak ali je bila naknadno popravljena.

Kar bi bilo treba:

1. **Ločena tabela, samo za dodajanje** — `gm_dn_dnevnik`:
   `cas`, `tabela`, `zapis_id`, `akcija` (insert/update/delete), `staro` jsonb,
   `novo` jsonb, `uporabnik`. RLS naj dovoli `insert`, ne pa `update` ali
   `delete` — dnevnik, ki ga aplikacija lahko popravi, ni revizijska sled.

2. **Sprožilec v Postgresu, ne v aplikaciji.** `AFTER INSERT OR UPDATE OR
   DELETE` na `gm_dn_*` tabelah. Če bi pisala aplikacija, bi se sled izgubila
   ob spremembi neposredno v Supabase UI ali ob napaki v brskalniku.

3. **Kdo** je odvisen od Supabase Auth (glej prvo točko v Varnosti). Dokler se
   vse tri aplikacije prijavljajo z istim publishable ključem, sta zapisljiva
   samo *kdaj* in *kaj* — `auth.uid()` je prazen.

Prikaz v aplikaciji je majhen del: pri vsakem preračunu oz. nalogu gumb
»zgodovina sprememb«, ki pokaže seznam `cas → polje: staro ⟶ novo`.
Vredno narediti hkrati s Supabase Auth, ker si točki delita isto rešitev.
