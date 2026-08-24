// Vpise ocene izdelkov v staticni HTML.
//
// Zvezdice v Googlu izhajajo iz aggregateRating v strukturiranih podatkih. Tega
// v HTML ni bilo nikjer - dodal ga je sele product-page.js po nalaganju strani.
// Google JavaScript sicer izvaja, a v drugem, zamaknjenem prehodu, ki ni
// zanesljiv: zato je zvezdice dobil Reishi, ostali izdelki pa ne, ceprav imajo
// ocene enako prikazane.
//
// Skripta tece kot ukaz gradnje na Netlifyju, torej ob vsaki objavi - rocnega
// zagona ni treba. Za suhi tek: node doc/osvezi-ocene.mjs --preveri
//
// Ce Supabase ni dosegljiv, pusti strani take, kot so, in se konca brez napake:
// objava zaradi neosvezenih ocen ne sme pasti.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
const KOREN = join(dirname(fileURLToPath(import.meta.url)), '..');
const SAMO_PREVERI = process.argv.includes('--preveri');

// Slug je isti za slovensko in anglesko stran - ocene izdelka niso vezane na
// jezik. Vzet je iz data-slug na gumbu "dodaj v kosarico", da sta vir ocen tu
// in v product-page.js ista stvar.
function straniIzdelkov() {
  const najdene = [];
  for (const mapa of ['trgovina', 'en/shop']) {
    const pot = join(KOREN, mapa);
    if (!existsSync(pot)) continue;
    for (const ime of readdirSync(pot).sort()) {
      const f = join(pot, ime, 'index.html');
      if (!existsSync(f)) continue;
      const slug = readFileSync(f, 'utf8').match(/data-slug="([^"]+)"/);
      if (slug) najdene.push({ pot: relative(KOREN, f), slug: slug[1] });
    }
  }
  return najdene;
}

// Odobrene ocene tega izdelka - isti filter kot v product-page.js.
async function ocene(slug) {
  const url = `${SB_URL}/rest/v1/gm_reviews?product_id=eq.${slug}`
    + '&status=eq.approved&select=rating';
  const r = await fetch(url, {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY },
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error('Supabase ' + r.status);
  const vrstice = await r.json();
  if (!vrstice.length) return null;
  const vsota = vrstice.reduce((s, v) => s + (v.rating || 0), 0);
  // Enako zaokrozevanje kot injectReviewSchema, sicer bi se staticna in
  // izrisana vrednost razlikovali za desetinko in bi bilo videti kot napaka.
  return {
    '@type': 'AggregateRating',
    ratingValue: (vsota / vrstice.length).toFixed(1),
    reviewCount: vrstice.length,
  };
}

const opis = a => (a ? `${a.ratingValue} (${a.reviewCount})` : '—');

// Vstavi aggregateRating v Product schemo strani. Vrne opis spremembe ali null.
function zapisi(pot, agg) {
  const polna = join(KOREN, pot);
  const h = readFileSync(polna, 'utf8');
  const vzorec = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  for (const m of h.matchAll(vzorec)) {
    let d;
    try { d = JSON.parse(m[1]); } catch { continue; }
    if (d['@type'] !== 'Product') continue;
    const staro = d.aggregateRating || null;
    if (JSON.stringify(staro) === JSON.stringify(agg)) return null;
    if (agg) d.aggregateRating = agg; else delete d.aggregateRating;
    if (!SAMO_PREVERI) {
      const nov = '<script type="application/ld+json">\n'
        + JSON.stringify(d, null, 2) + '\n  </script>';
      writeFileSync(polna, h.slice(0, m.index) + nov + h.slice(m.index + m[0].length));
    }
    return `${opis(staro)} → ${opis(agg)}`;
  }
  return 'NAPAKA: na strani ni Product scheme';
}

const strani = straniIzdelkov();
if (!strani.length) { console.log('Ni strani izdelkov.'); process.exit(0); }

const predpomnilnik = new Map();
let spremenjenih = 0, napak = 0;
for (const { pot, slug } of strani) {
  if (!predpomnilnik.has(slug)) {
    try {
      predpomnilnik.set(slug, await ocene(slug));
    } catch (e) {
      // Nedosegljiv Supabase ne sme podreti objave - strani ostanejo, kot so.
      console.log(`  preskoceno  ${slug}: ${e.message}`);
      predpomnilnik.set(slug, undefined);
    }
  }
  const agg = predpomnilnik.get(slug);
  if (agg === undefined) continue;
  const sprememba = zapisi(pot, agg);
  if (sprememba === null) console.log(`  ostaja  ${pot}`);
  else if (sprememba.startsWith('NAPAKA')) { console.log(`  NAPAKA  ${pot}: ${sprememba}`); napak++; }
  else { console.log(`  ${SAMO_PREVERI ? 'bi se spremenil' : 'zapisano'}  ${pot}  ${sprememba}`); spremenjenih++; }
}
console.log(`\n${spremenjenih} strani, ${napak} napak`);
