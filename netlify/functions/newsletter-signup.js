// ── Prijava na e-novice in izdaja kode za prvi nakup ───────────────────────
//
// Brskalnik pošlje samo e-naslov. Kodo, njeno veljavnost in odstotek določi ta
// funkcija iz gm_settings, zapiše jo s strežniškim ključem in pošlje sporočilo.
// Brskalnik nad gm_newsletter in gm_coupons nima nobene pravice.
//
// Sporočilo pošljemo naravnost prek Resenda in ne prek send-email.js: tista
// funkcija sprejme poljuben HTML od klicatelja, kar je za javno dostopno pot
// preveč. Tu vsebino sestavimo sami, klicatelj vpliva samo na naslov prejemnika.

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://gomushroom.si',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PRIVZETO = { aktiven: true, pct: 10, veljavnostDni: 90 };

// Brez O/0 in I/1/L — koda se prepisuje iz e-pošte na roke in prav ti znaki se
// zamenjajo. 6 znakov iz 30-znakovne abecede je ~729 milijonov možnosti.
const ABECEDA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

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

async function sbPost(tabela, vrstica, prefer = 'return=representation') {
  const r = await fetch(`${SB_URL}/rest/v1/${tabela}`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: prefer },
    body: JSON.stringify(vrstica),
  });
  const besedilo = await r.text();
  return { ok: r.ok, status: r.status, besedilo };
}

async function naloziNastavitve() {
  const vrstice = await sbGet('gm_settings?key=eq.enovicePopup&select=value');
  if (!vrstice.length) return { ...PRIVZETO };
  try {
    return { ...PRIVZETO, ...JSON.parse(vrstice[0].value) };
  } catch {
    return { ...PRIVZETO };
  }
}

function novaKoda() {
  const { randomInt } = require('crypto');
  let s = '';
  for (let i = 0; i < 6; i++) s += ABECEDA[randomInt(ABECEDA.length)];
  return `GM-${s}`;
}

// Unikat na upper(code) je v bazi; tu samo omejimo, kolikokrat poskusimo, da
// ob nepričakovanem trku ne bi vrteli v neskončnost.
async function shraniKodo(email, pct, veljaDo, poskusov = 5) {
  for (let i = 0; i < poskusov; i++) {
    const koda = novaKoda();
    const { ok, status, besedilo } = await sbPost('gm_coupons', {
      code: koda,
      pct,
      email,
      expires_at: veljaDo,
    });
    if (ok) return koda;
    // 23505 = unique_violation; karkoli drugega je prava napaka.
    if (status !== 409 && !besedilo.includes('23505'))
      throw new Error(`gm_coupons: ${status} ${besedilo}`);
  }
  throw new Error('Kode ni bilo mogoče ustvariti');
}

function datumSl(iso) {
  const d = new Date(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

// ── Sporočilo ──────────────────────────────────────────────────────────────
// Enak videz kot potrditev naročila: logotip iz assets/logo-email.png, tabele
// namesto flexboxa in vgrajeni slogi, ker Outlook drugega ne razume.
function sestaviSporocilo({ koda, pct, veljaDo, odjavaZeton }) {
  const odjava = `https://gomushroom.si/odjava/?t=${odjavaZeton}`;
  return `<!doctype html>
<html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f2ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2ec;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#2b0b39;">

        <tr><td align="center" style="padding:28px 24px 8px;">
          <img src="https://gomushroom.si/assets/logo-email.png" width="159" height="55" alt="GoMushroom"
               style="display:block;border:0;outline:none;text-decoration:none;">
        </td></tr>

        <tr><td style="padding:12px 32px 0;">
          <h1 style="margin:0 0 10px;font-size:21px;font-weight:700;line-height:1.3;color:#2b0b39;">
            Vaša koda za ${pct} % popusta
          </h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#4a4453;">
            Hvala za prijavo na GoMushroom e-novice. Spodnjo kodo vnesite v košarici pri prvem naročilu.
          </p>
        </td></tr>

        <tr><td align="center" style="padding:0 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#f1f4ea;border-radius:12px;">
            <tr><td align="center" style="padding:20px 32px;">
              <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6a6670;margin-bottom:8px;">Vaša koda</div>
              <div style="font-size:26px;font-weight:700;letter-spacing:.10em;color:#2b0b39;">${koda}</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:18px 32px 0;">
          <p style="margin:0 0 6px;font-size:14px;line-height:1.65;color:#4a4453;">
            Koda velja do <strong>${datumSl(veljaDo)}</strong>, za eno naročilo, in samo za ta e-naslov.
          </p>
        </td></tr>

        <tr><td align="center" style="padding:22px 32px 4px;">
          <a href="https://gomushroom.si/trgovina/"
             style="display:inline-block;background:#2b0b39;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:10px;">
            V trgovino
          </a>
        </td></tr>

        <tr><td style="padding:24px 32px 28px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8b8794;border-top:1px solid #ece8e1;padding-top:16px;">
            To sporočilo ste prejeli, ker ste se prijavili na GoMushroom e-novice.
            <a href="${odjava}" style="color:#8b8794;">Odjava</a> je mogoča kadarkoli.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function posljiSporocilo(naslov, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY ni nastavljen');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'GoMushroom <info@gomushroom.si>',
      to: [naslov],
      reply_to: 'info@gomushroom.si',
      subject: 'Vaša koda za popust — GoMushroom',
      html,
    }),
  });
  if (!r.ok) throw new Error(`Resend: ${r.status} ${await r.text()}`);
}

// ── Handler ────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  try {
    const vhod = JSON.parse(event.body || '{}');

    // Skrito polje, ki ga človek nikoli ne izpolni. Roboti ga izpolnijo vedno,
    // zato jim odgovorimo enako kot uspešni prijavi in ne naredimo ničesar.
    if (String(vhod.website || '').trim()) {
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
    }

    const email = String(vhod.email || '').trim().toLowerCase().slice(0, 160);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Neveljaven e-naslov');

    const nastavitve = await naloziNastavitve();
    if (!nastavitve.aktiven) throw new Error('Prijava trenutno ni mogoča');

    const pct = Number(nastavitve.pct) || 10;
    const dni = Number(nastavitve.veljavnostDni) || 90;
    const veljaDo = new Date(Date.now() + dni * 86400000).toISOString();

    // Kdor je že prijavljen, ne dobi druge kode — sicer bi z istim naslovom
    // lahko poljubno pogosto obnavljal popust.
    const obstojeci = await sbGet(
      `gm_newsletter?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
    );
    if (obstojeci.length) {
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ ok: true, ponovna: true }),
      };
    }

    const koda = await shraniKodo(email, pct, veljaDo);

    const vpis = await sbPost('gm_newsletter', {
      email,
      lang: 'sl',
      source: 'first_purchase_popup',
      consent_text: String(vhod.consentText || '').slice(0, 500) || null,
      consent_ip: (event.headers['x-nf-client-connection-ip']
        || String(event.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || null),
    });
    if (!vpis.ok && !vpis.besedilo.includes('23505'))
      throw new Error(`gm_newsletter: ${vpis.status} ${vpis.besedilo}`);

    const zeton = (() => {
      try { return JSON.parse(vpis.besedilo)[0]?.unsubscribe_token || ''; }
      catch { return ''; }
    })();

    await posljiSporocilo(email, sestaviSporocilo({ koda, pct, veljaDo, odjavaZeton: zeton }));

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, pct }) };

  } catch (err) {
    console.error('newsletter-signup:', err);
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message || 'Prijave ni bilo mogoče oddati' }),
    };
  }
};
