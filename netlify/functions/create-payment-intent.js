const https = require('https');
const querystring = require('querystring');

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://gomushroom.si',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function stripePost(path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  const body = querystring.stringify(params);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com',
      path: `/v1/${path}`,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(key + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Stripe-Version': '2024-06-20',
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  try {
    const { amount } = JSON.parse(event.body);
    if (!amount || amount < 0.5) throw new Error('Neveljaven znesek');

    const { status, body } = await stripePost('payment_intents', {
      amount: Math.round(amount * 100),
      currency: 'eur',
      'automatic_payment_methods[enabled]': 'true',
    });

    if (status !== 200) throw new Error(body.error?.message || 'Stripe napaka');

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ clientSecret: body.client_secret }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
