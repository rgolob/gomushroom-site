// ── Preverjanje kode za popust ─────────────────────────────────────────────
//
// Kode iz gm_coupons so enkratne in vezane na e-naslov, zato jih brskalnik ne
// sme brati — sicer bi si vsakdo lahko izpisal celoten seznam veljavnih kod.
// Ta funkcija odgovori samo na vprasanje "ali ta koda velja"; nikoli ne vrne
// seznama in nikoli ne pove, kateremu naslovu koda pripada.
//
// Klice se dvakrat:
//   • v kosarici brez naslova — pove, ali koda obstaja in koliksen je popust,
//     da kupec vidi znesek se preden gre na blagajno;
//   • na blagajni z naslovom — pove tudi, ali se naslov ujema, da kupec za to
//     ne izve sele ob oddaji narocila.
//
// Dokoncno besedo ima create-order, ki isti pregled ponovi s tem, kar je res
// v narocilu. Ta funkcija je za prikaz, ne za obrambo.

const { stanjeKode, SPOROCILA } = require('./_shared/kuponi');

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://gomushroom.si',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  try {
    const vhod = JSON.parse(event.body || '{}');
    const stanje = await stanjeKode(vhod.code, vhod.email);

    if (!stanje.najdena) {
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ velja: false, znana: false }) };
    }

    if (!stanje.velja) {
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
          velja: false,
          znana: true,
          razlog: stanje.razlog,
          sporocilo: SPOROCILA[stanje.razlog] || 'Kode ni mogoče uveljaviti.',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({
        velja: true,
        znana: true,
        pct: Number(stanje.kupon.pct) || 0,
        veljaDo: stanje.kupon.expires_at,
      }),
    };

  } catch (err) {
    // Ob tezavi z bazo raje recemo "ne poznam", kot da bi veljavno kodo
    // zavrnili z napacnim razlogom; create-order jo preveri se enkrat.
    console.error('validate-coupon:', err);
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ velja: false, znana: false }) };
  }
};
