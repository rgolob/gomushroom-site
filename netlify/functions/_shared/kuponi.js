// ── Enkratne kode za popust (gm_coupons) ───────────────────────────────────
//
// Pravilo o veljavnosti je tu, da ga ni treba pisati dvakrat: uporabljata ga
// validate-coupon (za prikaz v kosarici in na blagajni) in create-order (za
// dejansko uveljavitev). Ce bi se razsla, bi kupec v kosarici videl popust,
// ki ga ob oddaji ne bi dobil.
//
// Koda je enkratna IN vezana na e-naslov, ki jo je zahteval. Zato splosna
// koda, ki pristane na strani s kuponi, tu ni mogoca.

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';

// Format iz newsletter-signup: GM- in sest znakov brez O/0 in I/1/L.
const OBLIKA_KODE = /^GM-[A-Z0-9]{4,12}$/;

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

const SPOROCILA = {
  'porabljena':    'Ta koda je že bila uporabljena.',
  'potekla':       'Ta koda je potekla.',
  'drug-naslov':   'Ta koda je bila izdana na drug e-naslov.',
  'ni-prvi-nakup': 'Ta koda velja samo za prvo naročilo.',
};

// ── Kode iz recenzij (gm_reviews) ──────────────────────────────────────────
// Zaloga jih ob potrditvi recenzije zapise v gm_reviews.coupon_code v obliki
// REVIEW-XXXXXX. Doslej jih je kosarica brala naravnost iz tabele, kar pomeni,
// da si je vsakdo lahko izpisal seznam vseh veljavnih kod. Zato jih odslej
// bere samo streznik, prek te funkcije.
const OBLIKA_RECENZIJE = /^REVIEW-[A-Z0-9]{4,12}$/;

async function stanjeKodeRecenzije(koda) {
  const iskana = String(koda || '').trim().toUpperCase();
  if (!OBLIKA_RECENZIJE.test(iskana)) return { najdena: false };

  const vrstice = await sbGet(
    `gm_reviews?status=eq.approved&coupon_code=eq.${encodeURIComponent(iskana)}` +
    `&select=coupon_code,coupon_pct&limit=1`
  );
  if (!vrstice.length) return { najdena: false };

  // Te kode nimajo ne roka ne oznake porabe — take so bile od zacetka in tega
  // popravek ne spreminja, da ne bi razveljavil ze razdeljenih kuponov.
  return {
    najdena: true,
    velja: true,
    kupon: { code: vrstice[0].coupon_code, pct: Number(vrstice[0].coupon_pct) || 10 },
    vrsta: 'recenzija',
  };
}

// Vrne { najdena, velja, razlog?, kupon? }.
// Brez e-naslova preveri le obstoj, porabljenost in veljavnost — toliko, da
// kosarica lahko pokaze znesek, preden naslov sploh poznamo. Z naslovom
// preveri se ujemanje in ali gre res za prvi nakup.
async function stanjeKode(koda, email) {
  const iskana = String(koda || '').trim().toUpperCase();
  if (!OBLIKA_KODE.test(iskana)) return { najdena: false };

  const vrstice = await sbGet(
    `gm_coupons?code=eq.${encodeURIComponent(iskana)}` +
    `&select=id,code,pct,email,expires_at,used_at,first_purchase_only`
  );
  if (!vrstice.length) return { najdena: false };

  const k = vrstice[0];
  if (k.used_at) return { najdena: true, velja: false, razlog: 'porabljena', kupon: k };
  if (new Date(k.expires_at) < new Date())
    return { najdena: true, velja: false, razlog: 'potekla', kupon: k };

  if (email) {
    const naslov = String(email).trim().toLowerCase();
    if (naslov !== String(k.email).toLowerCase())
      return { najdena: true, velja: false, razlog: 'drug-naslov', kupon: k };

    if (k.first_purchase_only) {
      // Preklicana in opuscena narocila ne stejejo kot opravljen nakup, testna
      // pa tudi ne — sicer bi si s testiranjem sami pokvarili prvo narocilo.
      const prejsnja = await sbGet(
        `gm_orders?email=eq.${encodeURIComponent(naslov)}` +
        `&status=not.in.(cancelled,abandoned)&is_test=is.false&select=id&limit=1`
      );
      if (prejsnja.length) return { najdena: true, velja: false, razlog: 'ni-prvi-nakup', kupon: k };
    }
  }

  return { najdena: true, velja: true, kupon: k };
}

// Zapise porabo. Pogoj used_at=is.null poskrbi, da dve socasni narocili ne
// moreta obe porabiti iste kode — drugo dobi nazaj prazen seznam.
async function porabiKodo(kuponId, orderId) {
  const r = await fetch(
    `${SB_URL}/rest/v1/gm_coupons?id=eq.${encodeURIComponent(kuponId)}&used_at=is.null`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify({ used_at: new Date().toISOString(), order_id: orderId }),
    }
  );
  if (!r.ok) throw new Error(`gm_coupons PATCH: ${r.status} ${await r.text()}`);
  const vrstice = await r.json();
  return vrstice.length > 0;
}

// Vrne kodo v uporabo, ce narocila na koncu ni bilo. Omejeno na order_id, ki
// jo je zaklenil, da ne bi po pomoti sprostili kode tujega narocila.
async function sprostiKodo(kuponId, orderId) {
  const r = await fetch(
    `${SB_URL}/rest/v1/gm_coupons?id=eq.${encodeURIComponent(kuponId)}` +
    `&order_id=eq.${encodeURIComponent(orderId)}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ used_at: null, order_id: null }),
    }
  );
  if (!r.ok) throw new Error(`gm_coupons PATCH (sprostitev): ${r.status} ${await r.text()}`);
}

// Ena vstopna tocka za obe vrsti kod, da klicatelju ni treba vedeti, od kod
// katera prihaja.
async function stanjeKateregakoli(koda, email) {
  const enkratna = await stanjeKode(koda, email);
  if (enkratna.najdena) return { ...enkratna, vrsta: 'enkratna' };
  return stanjeKodeRecenzije(koda);
}

module.exports = {
  stanjeKode, stanjeKodeRecenzije, stanjeKateregakoli,
  porabiKodo, sprostiKodo, SPOROCILA, OBLIKA_KODE,
};
