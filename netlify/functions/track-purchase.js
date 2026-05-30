const GA_MEASUREMENT_ID = 'G-L2PGE7VDHB';

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://gomushroom.si',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  const GA_API_SECRET = process.env.GA_API_SECRET;
  if (!GA_API_SECRET) return { statusCode: 200, headers: HEADERS, body: '{"ok":false,"reason":"no_secret"}' };

  try {
    const { orderId, items, total, shipping, discount, coupon, clientId } = JSON.parse(event.body);

    const payload = {
      client_id: clientId || `srv.${Date.now()}`,
      events: [{
        name: 'purchase',
        params: {
          transaction_id: String(orderId).substring(0, 16),
          currency: 'EUR',
          value: Number(total) || 0,
          shipping: Number(shipping) || 0,
          discount: Number(discount) || 0,
          ...(coupon ? { coupon } : {}),
          items: (items || []).map((item, idx) => ({
            item_id: item.sku || item.slug,
            item_name: item.name,
            item_variant: item.variantLabel || item.variant,
            item_category: 'Tinkture',
            price: Number(item.price) || 0,
            quantity: item.quantity || 1,
            index: idx,
          })),
        },
      }],
    };

    const r = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: r.ok, status: r.status }) };
  } catch (err) {
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
