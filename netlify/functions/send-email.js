const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';

async function markConfirmationSent(orderId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(orderId))) throw new Error('Neveljaven orderId');

  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY ni nastavljen');

  const r = await fetch(`${SB_URL}/rest/v1/gm_orders?id=eq.${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ confirmation_sent_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(`PATCH gm_orders: ${r.status} ${await r.text()}`);
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://gomushroom.si',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  try {
    const { to, subject, html, from, attachments, orderId } = JSON.parse(event.body);

    if (!to || !subject || !html) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Resend API key not configured' }) };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'GoMushroom <info@gomushroom.si>',
        to: Array.isArray(to) ? to : [to],
        bcc: ['info@gomushroom.si'],
        reply_to: 'info@gomushroom.si',
        subject,
        html,
        ...(attachments && attachments.length ? { attachments } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, headers, body: JSON.stringify(data) };
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

    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
