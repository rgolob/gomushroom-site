// ── Pošiljanje kampanje e-novic ────────────────────────────────────────────
//
// Klice jo samo vmesnik /enovice/, in sicer po paketih: brskalnik ima dostop
// do gm_newsletter (prek prijave), zato prejemnike izbere sam in jih poslje
// po največ 100 naenkrat. Tako se izognemo desetsekundni omejitvi funkcije in
// lahko sproti kazemo napredek.
//
// Zakaj to ni odprt rele
// ──────────────────────
// Dvoje. Prvic, klicatelj mora priloziti zeton prijavljenega uporabnika, ki ga
// preverimo pri Supabase Auth — brez veljavne prijave ni posiljanja. Drugic,
// HTML sestavimo tu iz posameznih polj (zadeva, naslov, odstavki, gumb);
// klicatelj ne more poslati poljubne vsebine.
//
// Poleg tega vsak naslov iz paketa preverimo v gm_newsletter: kdor ni
// prijavljen ali se je odjavil, poste ne dobi, tudi ce je v seznamu pomotoma.

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_ANON = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';

// Resendova omejitev za /emails/batch.
const NAJVEC_V_PAKETU = 100;

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://gomushroom.si',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function sbHeaders() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY ni nastavljen');
  return { 'Content-Type': 'application/json', apikey: key, Authorization: 'Bearer ' + key };
}

async function sbGet(pot) {
  const r = await fetch(`${SB_URL}/rest/v1/${pot}`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`Supabase GET ${pot}: ${r.status} ${await r.text()}`);
  return r.json();
}

// ── Kdo klice ──────────────────────────────────────────────────────────────
// Zeton preverimo pri Supabase Auth; ce vrne uporabnika, je prijava veljavna.
// Sami zetona ne razbiramo — podpis bi morali preveriti proti kljucu, ki ga tu
// nimamo, razbran brez preverjanja pa ne pove nicesar.
async function preveriPrijavo(zeton) {
  if (!zeton || zeton.length < 20) throw new Error('Manjka prijava');
  const r = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_ANON, Authorization: 'Bearer ' + zeton },
  });
  if (!r.ok) throw new Error('Prijava ni veljavna');
  const u = await r.json();
  if (!u || !u.email) throw new Error('Prijava ni veljavna');
  return u.email;
}

// ── Sporočilo ──────────────────────────────────────────────────────────────
function ubezi(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Dovolimo samo naše povezave in navadni http(s); javascript: in podobno ne
// sme priti do prejemnikovega odjemalca.
function varenNaslov(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) return '';
  return s;
}

function sestaviSporocilo({ naslov, besedilo, gumbBesedilo, gumbUrl, odjavaZeton }) {
  const odstavki = String(besedilo || '')
    .split(/\n\s*\n/)
    .map(o => o.trim())
    .filter(Boolean)
    .map(o => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#4a4453;">${
      ubezi(o).replace(/\n/g, '<br>')}</p>`)
    .join('');

  const url = varenNaslov(gumbUrl);
  const gumb = (url && gumbBesedilo)
    ? `<tr><td align="center" style="padding:14px 32px 4px;">
         <a href="${ubezi(url)}"
            style="display:inline-block;background:#2b0b39;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:10px;">
           ${ubezi(gumbBesedilo)}
         </a>
       </td></tr>`
    : '';

  const odjava = `https://gomushroom.si/odjava/?t=${encodeURIComponent(odjavaZeton || '')}`;

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
          <h1 style="margin:0 0 12px;font-size:21px;font-weight:700;line-height:1.3;color:#2b0b39;">${ubezi(naslov)}</h1>
          ${odstavki}
        </td></tr>

        ${gumb}

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

// ── Resend ─────────────────────────────────────────────────────────────────
async function posljiPaket(sporocila) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY ni nastavljen');

  const r = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(sporocila),
  });
  const odgovor = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend: ${r.status} ${JSON.stringify(odgovor).slice(0, 300)}`);
  return Array.isArray(odgovor.data) ? odgovor.data.length : sporocila.length;
}

// ── Handler ────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  try {
    const vhod = JSON.parse(event.body || '{}');
    const kdo = await preveriPrijavo(vhod.zeton);

    const zadeva = String(vhod.zadeva || '').trim().slice(0, 200);
    const naslov = String(vhod.naslov || '').trim().slice(0, 200);
    const besedilo = String(vhod.besedilo || '').trim().slice(0, 20000);
    const gumbBesedilo = String(vhod.gumbBesedilo || '').trim().slice(0, 60);
    const gumbUrl = String(vhod.gumbUrl || '').trim().slice(0, 500);

    if (!zadeva) throw new Error('Manjka zadeva');
    if (!naslov) throw new Error('Manjka naslov');
    if (!besedilo) throw new Error('Manjka besedilo');
    if (gumbUrl && !varenNaslov(gumbUrl)) throw new Error('Naslov gumba mora biti http(s)');

    // ── Poskusno pošiljanje ────────────────────────────────────────────────
    // Gre na en sam naslov, brez preverjanja v gm_newsletter — prav zato, da
    // je mogoče pogledati, kako sporočilo izgleda, preden ga kdo drug dobi.
    if (vhod.nacin === 'test') {
      const naslovnik = String(vhod.test || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(naslovnik)) throw new Error('Neveljaven poskusni naslov');
      await posljiPaket([{
        from: 'GoMushroom <info@gomushroom.si>',
        to: [naslovnik],
        reply_to: 'info@gomushroom.si',
        subject: `[POSKUS] ${zadeva}`,
        html: sestaviSporocilo({ naslov, besedilo, gumbBesedilo, gumbUrl, odjavaZeton: 'poskus' }),
      }]);
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, poslanih: 1 }) };
    }

    // ── Paket prave kampanje ───────────────────────────────────────────────
    const zeleni = Array.isArray(vhod.prejemniki) ? vhod.prejemniki : [];
    if (!zeleni.length) throw new Error('Paket je prazen');
    if (zeleni.length > NAJVEC_V_PAKETU) throw new Error(`Največ ${NAJVEC_V_PAKETU} naslovov na paket`);

    // Naslove, ki jih je poslal brskalnik, preverimo v bazi. Odjavljeni in
    // tisti, ki jih na seznamu sploh ni, so izločeni — ne glede na to, kaj je
    // poslal klicatelj.
    const seznam = zeleni
      .map(e => String(e || '').trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    const vBazi = await sbGet(
      'gm_newsletter?unsubscribed_at=is.null&select=email,unsubscribe_token' +
      `&email=in.(${seznam.map(e => `"${e.replace(/"/g, '')}"`).join(',')})`
    );

    if (!vBazi.length) {
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, poslanih: 0, izloceni: seznam.length }) };
    }

    const sporocila = vBazi.map(v => ({
      from: 'GoMushroom <info@gomushroom.si>',
      to: [v.email],
      reply_to: 'info@gomushroom.si',
      subject: zadeva,
      html: sestaviSporocilo({ naslov, besedilo, gumbBesedilo, gumbUrl, odjavaZeton: v.unsubscribe_token }),
    }));

    const poslanih = await posljiPaket(sporocila);

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        ok: true,
        poslanih,
        izloceni: seznam.length - vBazi.length,
        kdo,
      }),
    };

  } catch (err) {
    console.error('newsletter-campaign:', err);
    const status = /prijav/i.test(err.message) ? 401 : 400;
    return { statusCode: status, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
