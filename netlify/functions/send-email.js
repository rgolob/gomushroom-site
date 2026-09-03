// ── Pošiljanje e-pošte ─────────────────────────────────────────────────────
//
// Kaj je bilo narobe
// ──────────────────
// Funkcija je od kogarkoli sprejela to, subject in html ter sporočilo poslala
// z naslova info@gomushroom.si. CORS tega ni preprečeval — omejuje samo
// brskalnike, curl pa ne. Vsak na internetu je torej lahko poslal poljubno
// vsebino poljubnemu prejemniku v imenu GoMushroom: lažno predstavljanje,
// poraba tuje Resend kvote in pokvarjen ugled domene.
//
// Kako je zdaj
// ────────────
// Sta dve poti in nobena ne dovoli poljubnega prejemnika neprijavljenemu
// klicatelju:
//
//   1. PRIJAVLJENI (zaloga) — priloži žeton svoje seje. Sme poslati komurkoli,
//      ker je to njegovo delo: kuponi za recenzije, računi, dobavnice.
//
//   2. TRGOVINA (kupec, brez prijave) — mora navesti orderId obstoječega
//      naročila, ki ni starejše od enega dne. Prejemnik je takrat lahko samo
//      e-naslov s tistega naročila ali naš lastni info@gomushroom.si.
//      Poljubnega naslova ni mogoče izbrati, zato ta pot ni več uporabna za
//      pošiljanje neznancem.
//
// Vsebina pri drugi poti ostane od klicatelja. To je zavestna omejitev tega
// popravka: potrditev naročila sestavlja trgovina in njena selitev na strežnik
// je svoja naloga. Ker pa lahko takšno sporočilo pride samo do kupca lastnega
// naročila ali do nas, škoda ne more ven.

const { jePrijavljen, zetonIzZahtevka } = require('./_shared/prijava');

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';

// Naš lastni naslov sme prejeti obvestilo o naročilu vedno.
const NAS_NASLOV = 'info@gomushroom.si';

// Naročilo, starejše od tega, ne more več sprožiti pošiljanja. Brez te meje bi
// bil vsak star orderId trajna vstopnica za pošiljanje tistemu kupcu.
const NAJVEC_STAROST_MS = 24 * 60 * 60 * 1000;

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://gomushroom.si',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function sbHeaders() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY ni nastavljen');
  return { 'Content-Type': 'application/json', apikey: key, Authorization: 'Bearer ' + key };
}

async function naloziNarocilo(orderId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(orderId || ''))) return null;
  const r = await fetch(
    `${SB_URL}/rest/v1/gm_orders?id=eq.${orderId}&select=id,email,created_at`,
    { headers: sbHeaders() }
  );
  if (!r.ok) return null;
  const vrstice = await r.json();
  return vrstice[0] || null;
}

async function markConfirmationSent(orderId) {
  const r = await fetch(`${SB_URL}/rest/v1/gm_orders?id=eq.${orderId}`, {
    method: 'PATCH',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify({ confirmation_sent_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`PATCH gm_orders: ${r.status} ${await r.text()}`);
}

const naslovi = v => (Array.isArray(v) ? v : [v])
  .map(e => String(e || '').trim().toLowerCase())
  .filter(Boolean);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method not allowed' };

  try {
    const telo = JSON.parse(event.body || '{}');
    const { to, subject, html, from, attachments, orderId } = telo;

    if (!to || !subject || !html) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const prejemniki = naslovi(to);
    if (!prejemniki.length) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Ni prejemnika' }) };
    }

    // ── Kdo klice ──────────────────────────────────────────────────────────
    const kdo = await jePrijavljen(zetonIzZahtevka(event, telo));

    if (!kdo) {
      // Brez prijave: samo za obstoječe, sveže naročilo in samo njegovemu
      // kupcu ali nam.
      const narocilo = await naloziNarocilo(orderId);
      if (!narocilo) {
        return { statusCode: 403, headers: HEADERS, body: JSON.stringify({ error: 'Ni dovoljenja za pošiljanje' }) };
      }
      if (Date.now() - new Date(narocilo.created_at).getTime() > NAJVEC_STAROST_MS) {
        return { statusCode: 403, headers: HEADERS, body: JSON.stringify({ error: 'Naročilo je prestaro' }) };
      }

      const dovoljeni = new Set([String(narocilo.email || '').toLowerCase(), NAS_NASLOV]);
      if (prejemniki.some(e => !dovoljeni.has(e))) {
        return { statusCode: 403, headers: HEADERS, body: JSON.stringify({ error: 'Prejemnik ne ustreza naročilu' }) };
      }
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Resend API key not configured' }) };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'GoMushroom <info@gomushroom.si>',
        to: prejemniki,
        bcc: [NAS_NASLOV],
        reply_to: NAS_NASLOV,
        subject,
        html,
        ...(attachments && attachments.length ? { attachments } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, headers: HEADERS, body: JSON.stringify(data) };
    }

    // Zabeležimo, da je potrditveno sporočilo šlo ven. To je delala trgovina
    // sama, dokler je imela pravico pisati v gm_orders; po fazi 3 je nima več,
    // zato to opravi tu strežniški ključ. Neuspeh tu ne sme pokvariti pošiljanja
    // — sporočilo je takrat že oddano.
    if (orderId) {
      try {
        await markConfirmationSent(orderId);
      } catch (e) {
        console.error('confirmation_sent_at ni bil zabeležen:', e);
      }
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) };

  } catch (err) {
    console.error('send-email:', err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
