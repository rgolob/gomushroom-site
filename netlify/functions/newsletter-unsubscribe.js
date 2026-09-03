// ── Odjava z e-novic ───────────────────────────────────────────────────────
//
// Vsak prijavljeni ima v gm_newsletter svoj unsubscribe_token, ki gre v
// odjavno povezavo v nogi vsakega sporocila. Odjava zato ne potrebuje prijave
// in ne razkrije e-naslova: zeton je edini podatek, ki potuje.
//
// Zeton je nakljucen UUID, zato ga ni mogoce uganiti, in ker odpira samo
// odjavo, tudi razkrit ne more skodovati — najhuje, kar zmore, je odjaviti
// nekoga, ki tega ni hotel.
//
// Odgovorimo enako, ce zeton obstaja ali ne. Sicer bi bila ta pot orodje za
// preverjanje, kateri zetoni so pravi.

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';

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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  try {
    const { token } = JSON.parse(event.body || '{}');
    const zeton = String(token || '').trim();

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(zeton)) {
      return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Neveljavna povezava' }) };
    }

    // Ze odjavljenega ne odjavljamo znova, da si ne prepisemo prvotnega casa
    // odjave — ta je dokazilo, kdaj je clovek odjavo zahteval.
    const r = await fetch(
      `${SB_URL}/rest/v1/gm_newsletter?unsubscribe_token=eq.${encodeURIComponent(zeton)}` +
      `&unsubscribed_at=is.null`,
      {
        method: 'PATCH',
        headers: { ...sbHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }),
      }
    );
    if (!r.ok) throw new Error(`gm_newsletter PATCH: ${r.status} ${await r.text()}`);

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('newsletter-unsubscribe:', err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Odjave ni bilo mogoče izvesti' }) };
  }
};
