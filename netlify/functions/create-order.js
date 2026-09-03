// ── Ustvarjanje naročila (faza 3) ──────────────────────────────────────────
//
// Doslej je celotno vrstico naročila sestavil brskalnik in jo s publishable
// ključem vstavil naravnost v gm_orders. Baza je verjela vsemu, kar je dobila:
// znesku, popustu, statusu. Kdor si je predrugačil stran, si je lahko izdal
// predračun za 0,01 €, vstavil naročilo z status='paid', ne da bi kdaj kaj
// plačal, ali tabelo zapolnil z izmišljenimi vrsticami.
//
// Odslej brskalnik pove samo, KAJ je v košarici (sku in količina) in komu naj
// gre. Ceno, popust, poštnino in status določi ta funkcija iz cen v bazi, s
// strežniškim ključem, ki brskalnika nikoli ne doseže. Anon nima nad gm_orders
// nobene pravice več (glej doc/supabase-rls-faza3.sql).
//
// Pri plačilu s kartico znesek dodatno preverimo pri Stripu: naročilo dobi
// status 'paid' samo, če je plačilo res uspelo in je bilo plačano vsaj toliko,
// kolikor smo izračunali sami.

const { randomUUID } = require('crypto');
const { stanjeKode, porabiKodo, sprostiKodo, SPOROCILA } = require('./_shared/kuponi');

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';

// Doma je Slovenija; stran v angleščini isto državo imenuje Slovenia.
const HOME_COUNTRIES = ['Slovenija', 'Slovenia'];

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://gomushroom.si',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Privzetki so isti kot v trgovini — veljajo samo, če vrstice v gm_settings ni.
const PRIVZETE_NASTAVITVE = {
  postnina: 3.90,
  postninaTujina: 0,
  brezplacnaPosninaOd: 60,
  brezplacnaPosninaOdTujina: 60,
  sestevajPopuste: false,
  maxPopust: 50,
  popusti: [],
  casovniPopust: { vrednost: 0, od: '', do: '', aktiven: false },
  upnPopust: { vrednost: 0, aktiven: false },
};

// ── Supabase s strežniškim ključem ─────────────────────────────────────────
function sbHeaders() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY ni nastavljen');
  return {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': 'Bearer ' + key,
  };
}

async function sbGet(pot) {
  const r = await fetch(`${SB_URL}/rest/v1/${pot}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Supabase GET ${pot}: ${r.status} ${await r.text()}`);
  return r.json();
}

// ── Denar ──────────────────────────────────────────────────────────────────
// Trgovina cene zaokroži s toFixed(2) že ob dodajanju v košarico. Tu delamo
// enako, sicer bi se izračun razlikoval za cent in kupec bi videl drug znesek,
// kot ga zaračunamo.
function na2(n) {
  return Number((Number(n) || 0).toFixed(2));
}

// ── RF referenca (ISO 11649) ───────────────────────────────────────────────
// Enak izračun kot v trgovini: referenca je izpeljana iz id-ja naročila, zato
// je znana že pred vstavitvijo in vrstice ni treba brati nazaj.
function generateRF(osnova) {
  const ref = String(osnova).replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (!ref) return '';
  const numeric = (ref + 'RF00').split('').map(c => {
    const code = c.charCodeAt(0);
    return code >= 65 ? String(code - 55) : c;
  }).join('');
  const checkDigits = String(98n - BigInt(numeric) % 97n).padStart(2, '0');
  return `RF${checkDigits}${ref}`;
}

function rfIzId(orderId) {
  return generateRF(String(orderId).replace(/-/g, '').substring(0, 12).toUpperCase());
}

// ── Nastavitve in kuponi ───────────────────────────────────────────────────
async function naloziNastavitve() {
  const nastavitve = { ...PRIVZETE_NASTAVITVE };
  const vrstice = await sbGet('gm_settings?select=key,value');
  for (const v of vrstice) {
    try { nastavitve[v.key] = JSON.parse(v.value); }
    catch { nastavitve[v.key] = v.value; }
  }
  return nastavitve;
}

async function naloziKuponeRecenzij() {
  return sbGet('gm_reviews?status=eq.approved&coupon_code=not.is.null&select=coupon_code,coupon_pct');
}

// ── Popust ─────────────────────────────────────────────────────────────────
// Ista pravila kot izracunajPopust() v trgovini, le da opisov ne sestavljamo —
// v naročilo se shrani samo odstotek, opisi so stvar prikaza.
function izracunajPopust(nastavitve, kuponiRecenzij, bruto, kolicina, koda, enkratniPct = 0) {
  const danes = new Date().toISOString().split('T')[0];
  const odstotki = [];

  // Enkratna koda iz e-novic (gm_coupons). Veljavnost, ujemanje naslova in
  // "samo prvi nakup" so preverjeni ze prej, tu vstopi samo odstotek.
  if (enkratniPct > 0) odstotki.push(enkratniPct);

  const c = nastavitve.casovniPopust;
  if (c?.aktiven && c.vrednost > 0 && (!c.od || danes >= c.od) && (!c.do || danes <= c.do))
    odstotki.push(c.vrednost);

  const vnesene = String(koda || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

  for (const p of (nastavitve.popusti || []).filter(p => p.aktiven)) {
    if (p.tip === 'koda') {
      const ruleKode = (p.kode?.length ? p.kode : p.kod ? [p.kod] : []).filter(Boolean);
      if (ruleKode.some(k => vnesene.includes(String(k).toUpperCase()))) odstotki.push(p.vrednost);
    }
    if (p.tip === 'kolicina' && kolicina >= (p.min || 0)) odstotki.push(p.vrednost);
    if (p.tip === 'znesek' && bruto >= (p.min || 0)) odstotki.push(p.vrednost);
  }

  for (const rc of kuponiRecenzij) {
    if (rc.coupon_code && vnesene.includes(String(rc.coupon_code).toUpperCase()))
      odstotki.push(rc.coupon_pct || 10);
  }

  if (!odstotki.length) return 0;
  const pct = nastavitve.sestevajPopuste
    ? odstotki.reduce((s, v) => s + v, 0)
    : Math.max(...odstotki);
  return Math.min(pct, nastavitve.maxPopust || 50);
}

// ── Košarica po cenah iz baze ──────────────────────────────────────────────
// Brskalnik pošlje sku in količino. Ceno vzamemo iz gm_product_variants, ne
// iz tega, kar je poslal — v tem je bistvo faze 3.
const POLJA_VARIANTE = 'id,sku,name,type,price_malo,discount_pct,product_id';

function vSeznam(vrednosti) {
  return `in.(${vrednosti.map(v => `"${String(v).replace(/"/g, '')}"`).join(',')})`;
}

async function ovrednotiKosarico(postavke) {
  const skuji = [...new Set(postavke.map(p => String(p.sku || '').trim()).filter(Boolean))];
  // Košarica živi v localStorage in lahko preživi spremembe trgovine. Starejši
  // zapisi nimajo sku-ja, imajo pa slug in varianto — po tem jih najdemo enako
  // zanesljivo, da kupcu ni treba prazniti košarice.
  const brezSku = postavke.filter(p => !String(p.sku || '').trim());
  const slugi = [...new Set(brezSku.map(p => String(p.slug || '').trim()).filter(Boolean))];

  if (brezSku.some(p => !String(p.slug || '').trim() || !String(p.variant || '').trim()))
    throw new Error('Košarica je zastarela — osveži jo in poskusi znova');

  const poizvedbe = [];

  if (skuji.length) {
    const q = new URLSearchParams({ active: 'eq.true', sku: vSeznam(skuji), select: POLJA_VARIANTE });
    poizvedbe.push(sbGet(`gm_product_variants?${q}`));
  } else {
    poizvedbe.push(Promise.resolve([]));
  }

  if (slugi.length) {
    const q = new URLSearchParams({ slug: vSeznam(slugi), select: 'id,slug' });
    poizvedbe.push(sbGet(`gm_products?${q}`));
  } else {
    poizvedbe.push(Promise.resolve([]));
  }

  const [poSkuSeznam, izdelki] = await Promise.all(poizvedbe);

  const poSku = Object.fromEntries(poSkuSeznam.map(v => [v.sku, v]));
  const poSlugVarianti = {};

  if (izdelki.length) {
    const q = new URLSearchParams({
      active: 'eq.true',
      product_id: vSeznam(izdelki.map(i => i.id)),
      select: POLJA_VARIANTE,
    });
    const variante = await sbGet(`gm_product_variants?${q}`);
    const slugPoId = Object.fromEntries(izdelki.map(i => [i.id, i.slug]));
    for (const v of variante) {
      poSlugVarianti[`${slugPoId[v.product_id]}|${v.type}`] = v;
    }
  }

  const artikli = [];
  for (const p of postavke) {
    const sku = String(p.sku || '').trim();
    const v = sku
      ? poSku[sku]
      : poSlugVarianti[`${String(p.slug).trim()}|${String(p.variant).trim()}`];
    if (!v) throw new Error(`Izdelka ${sku || p.slug} ni več v prodaji`);

    const kolicina = Math.floor(Number(p.quantity) || 0);
    if (kolicina < 1 || kolicina > 99) throw new Error(`Neveljavna količina za ${sku || p.slug}`);

    const redna = Number(v.price_malo) || 0;
    const popustVariante = Number(v.discount_pct) || 0;
    const cena = na2(popustVariante > 0 ? redna * (1 - popustVariante / 100) : redna);

    artikli.push({
      sku: v.sku,
      slug: String(p.slug || '').trim(),
      variantId: v.id,
      productId: v.product_id,
      name: p.name || v.name || v.sku,
      variant: v.type,
      variantLabel: p.variantLabel || v.name || '',
      price: cena,
      originalPrice: na2(redna),
      discountPct: popustVariante,
      quantity: kolicina,
      image: p.image || '',
    });
  }
  return artikli;
}

// ── Stripe ─────────────────────────────────────────────────────────────────
async function preveriPlacilo(paymentIntentId, pricakovanZnesek) {
  const key = process.env.STRIPE_SK_LIVE || process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe ključ ni nastavljen');

  const r = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(key + ':').toString('base64') },
  });
  const pi = await r.json();
  if (!r.ok) throw new Error(pi.error?.message || 'Stripe: plačila ni bilo mogoče preveriti');

  if (pi.status !== 'succeeded') throw new Error(`Plačilo ni zaključeno (${pi.status})`);
  if (pi.currency !== 'eur') throw new Error(`Napačna valuta (${pi.currency})`);

  // Plačano mora biti vsaj toliko, kolikor smo izračunali sami. Dva centa
  // dopusti zaokroževanje; kdor bi hotel podplačati, zgreši za veliko več.
  const placano = Number(pi.amount_received ?? pi.amount) || 0;
  const zahtevano = Math.round(pricakovanZnesek * 100);
  if (placano + 2 < zahtevano)
    throw new Error(`Plačani znesek (${(placano / 100).toFixed(2)} €) je nižji od naročila (${pricakovanZnesek.toFixed(2)} €)`);

  return { livemode: !!pi.livemode };
}

// ── Vhodni podatki ─────────────────────────────────────────────────────────
function ocisti(s, maxDolzina) {
  return String(s ?? '').trim().slice(0, maxDolzina);
}

function preveriKupca(k) {
  const kupec = {
    name:   ocisti(k?.name, 120),
    email:  ocisti(k?.email, 160).toLowerCase(),
    phone:  ocisti(k?.phone, 40) || null,
    street: ocisti(k?.street, 160),
    post:   ocisti(k?.post, 20),
    city:   ocisti(k?.city, 80),
    country: ocisti(k?.country, 60) || 'Slovenija',
    note:   ocisti(k?.note, 1000) || null,
  };
  for (const polje of ['name', 'email', 'street', 'post', 'city']) {
    if (!kupec[polje]) throw new Error(`Manjka podatek: ${polje}`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kupec.email)) throw new Error('Neveljaven e-naslov');
  return kupec;
}

// ── Handler ────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  try {
    const vhod = JSON.parse(event.body || '{}');
    const kanal = vhod.channel === 'stripe' ? 'stripe' : 'wp';

    if (!Array.isArray(vhod.items) || !vhod.items.length) throw new Error('Košarica je prazna');
    if (vhod.items.length > 50) throw new Error('Preveč različnih izdelkov');

    const kupec = preveriKupca(vhod.customer);
    const koda = ocisti(vhod.coupon, 200);

    const [nastavitve, kuponiRecenzij, artikli] = await Promise.all([
      naloziNastavitve(),
      naloziKuponeRecenzij(),
      ovrednotiKosarico(vhod.items),
    ]);

    // ── Enkratna koda iz e-novic ───────────────────────────────────────────
    // Preverimo jo tu, s podatki iz naročila, in ne verjamemo temu, kar je o
    // njej rekla blagajna. Neveljavne kode ne zavrnemo z napako — kupec je
    // morda vpisal več kod naenkrat in ostale so lahko v redu. Ta enostavno
    // ne prispeva popusta.
    let enkratni = null;
    for (const k of String(koda || '').split(',').map(s => s.trim()).filter(Boolean)) {
      const stanje = await stanjeKode(k, kupec.email);
      if (stanje.najdena && stanje.velja) { enkratni = stanje.kupon; break; }
      if (stanje.najdena && !stanje.velja)
        console.warn('create-order: koda zavrnjena —', k, stanje.razlog, SPOROCILA[stanje.razlog] || '');
    }

    // ── Izračun, enak kot renderSummary() v trgovini ───────────────────────
    const bruto = na2(artikli.reduce((s, a) => s + a.price * a.quantity, 0));
    const kolicina = artikli.reduce((s, a) => s + a.quantity, 0);
    const pct = izracunajPopust(
      nastavitve, kuponiRecenzij, bruto, kolicina, koda,
      enkratni ? Number(enkratni.pct) || 0 : 0
    );
    const popustZnesek = na2(bruto * pct / 100);
    const poPopustu = na2(bruto - popustZnesek);

    const tujina = !HOME_COUNTRIES.includes(kupec.country);
    const osnovnaPostnina = tujina ? (nastavitve.postninaTujina || 0) : (nastavitve.postnina || 3.90);
    const brezplacnaOd = tujina
      ? (nastavitve.brezplacnaPosninaOdTujina || nastavitve.brezplacnaPosninaOd || 60)
      : (nastavitve.brezplacnaPosninaOd || 60);
    const postnina = poPopustu >= brezplacnaOd ? 0 : na2(osnovnaPostnina);

    // Dodaten popust za plačilo z nakazilom velja samo pri nakazilu.
    const upnCfg = nastavitve.upnPopust;
    const upnPct = (kanal === 'wp' && upnCfg?.aktiven && upnCfg.vrednost > 0) ? upnCfg.vrednost : 0;
    const predUpn = na2(poPopustu + postnina);
    const upnZnesek = na2(predUpn * upnPct / 100);
    const skupaj = na2(predUpn - upnZnesek);

    if (skupaj < 0.5) throw new Error('Znesek naročila je prenizek');

    // ── Plačilo ────────────────────────────────────────────────────────────
    let status = 'pending';
    let rfReference;
    let isTest = false;

    const orderId = randomUUID();

    if (kanal === 'stripe') {
      const pi = ocisti(vhod.paymentIntentId, 100);
      if (!/^pi_[A-Za-z0-9_]+$/.test(pi)) throw new Error('Manjka oznaka plačila');
      const { livemode } = await preveriPlacilo(pi, skupaj);
      status = 'paid';
      rfReference = pi;
      isTest = !livemode;
    } else {
      rfReference = rfIzId(orderId);
    }

    // pricePaid je dejansko plačana cena na kos po vseh popustih — shranjena
    // ob nakupu, da je kasneje ni treba ugibati iz skupnega zneska.
    const faktor = 1 - pct / 100;
    const postavke = artikli.map(a => ({ ...a, pricePaid: na2(a.price * faktor) }));

    const vrstica = {
      id: orderId,
      name: kupec.name,
      email: kupec.email,
      phone: kupec.phone,
      street: kupec.street,
      post: kupec.post,
      city: kupec.city,
      country: kupec.country,
      note: kupec.note,
      items: postavke,
      subtotal: bruto,
      discount_pct: pct,
      discount_amt: na2(popustZnesek + upnZnesek),
      shipping: postnina,
      total: skupaj,
      coupon_code: koda || null,
      status,
      channel: kanal,
      rf_reference: rfReference,
      is_test: isTest,
    };

    // Kodo porabimo tik pred vstavitvijo naročila. Pogoj used_at=is.null v
    // porabiKodo poskrbi, da je pri dveh sočasnih naročilih uspešno samo eno.
    // Če prehiti drugo, naročila vseeno ne zavrnemo — plačilo je na tej točki
    // že opravljeno in kupca ne smemo pustiti brez naročila zaradi kupona.
    if (enkratni) {
      const porabljena = await porabiKodo(enkratni.id, orderId);
      if (!porabljena)
        console.error('create-order: koda', enkratni.code, 'je bila porabljena vmes; naročilo', orderId, 'je vseeno dobilo popust');
    }

    const r = await fetch(`${SB_URL}/rest/v1/gm_orders`, {
      method: 'POST',
      headers: { ...sbHeaders(), 'Prefer': 'return=minimal' },
      body: JSON.stringify(vrstica),
    });
    if (!r.ok) {
      // Naročila ni — kode ne smemo pustiti porabljene, sicer bi jo kupec
      // izgubil zaradi naše napake.
      if (enkratni) {
        try { await sprostiKodo(enkratni.id, orderId); }
        catch (e) { console.error('create-order: kode', enkratni.code, 'ni bilo mogoče sprostiti:', e); }
      }
      throw new Error(`Naročila ni bilo mogoče shraniti: ${r.status} ${await r.text()}`);
    }

    // Trgovina iz tega sestavi potrditveno sporočilo in prikaz uspeha, zato so
    // vsi zneski, ki jih kupec vidi, izračunani tu — ne v brskalniku.
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        order: vrstica,
        calc: {
          bruto,
          pct,
          popustZnesek: na2(popustZnesek + upnZnesek),
          zneskPoPopustu: poPopustu,
          postnina,
          skupaj,
          kolicina,
          koda,
          country: kupec.country,
          upnPct,
          upnZnesek,
        },
      }),
    };

  } catch (err) {
    // Vzrok gre v Netlify dnevnik; kupcu pokažemo samo sporočilo.
    console.error('create-order:', err);
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Naročila ni bilo mogoče oddati' }),
    };
  }
};
