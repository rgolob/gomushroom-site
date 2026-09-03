// ── GoMushroom Košarica ───────────────────────────────────
const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
const SB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY
};

const CP_LANG = document.documentElement.lang === 'en' ? 'en' : 'sl';
const CP_HOME = CP_LANG === 'en' ? '/en/shop/' : '/trgovina/';
const CP_CHECKOUT_URL = CP_LANG === 'en' ? '/en/shop/checkout/' : '/trgovina/blagajna/';
const CP_STR = {
  sl: {
    empty: 'Košarica je prazna', back: '← Nazaj v trgovino', unit: '/ kom', remove: 'Odstrani',
    itemsCount: (n) => `Skupaj (${n} kosov)`, discount: (pct) => `Popust ${pct}%`,
    shipping: 'Poštnina', shippingNote: 'Izračunana na blagajni, glede na izbrano državo dostave.',
    subtotal: 'Vmesna vsota', applyCoupon: 'Uveljavi', couponPartial: 'Delno',
    dateLocale: 'sl-SI'
  },
  en: {
    empty: 'Your cart is empty', back: '← Back to shop', unit: '/ each', remove: 'Remove',
    itemsCount: (n) => `Total (${n} item${n === 1 ? '' : 's'})`, discount: (pct) => `Discount ${pct}%`,
    shipping: 'Shipping', shippingNote: 'Calculated at checkout, based on the delivery country.',
    subtotal: 'Subtotal', applyCoupon: 'Apply', couponPartial: 'Partial',
    dateLocale: 'en-IE'
  }
}[CP_LANG];

let settings = {
  postnina: 3.90,
  brezplacnaPosninaOd: 60,
  // Enake zaloznice kot na blagajni, da se strani ne razhajata, ce nastavitve
  // niso na voljo.
  postninaTujina: 0,
  brezplacnaPosninaOdTujina: 60,
  sestevajPopuste: false,
  maxPopust: 50,
  popusti: [],
  casovniPopust: { vrednost: 0, od: '', do: '', aktiven: false }
};
// Enkratne kode iz e-novic (gm_coupons) so vezane na e-naslov, zato jih
// brskalnik ne sme brati — sicer bi si vsak lahko izpisal seznam veljavnih.
// Vsako vneseno kodo zato posebej vprašamo strežnik in odgovor si zapomnimo,
// da ob vsakem izrisu ne sprašujemo znova.
const enkratneKode = {};   // KODA -> { velja, pct, sporocilo }

async function preveriEnkratnoKodo(koda) {
  if (koda in enkratneKode) return enkratneKode[koda];
  try {
    const r = await fetch('/.netlify/functions/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: koda })
    });
    const d = await r.json();
    return (enkratneKode[koda] = {
      velja: !!d.velja,
      pct: Number(d.pct) || 0,
      sporocilo: d.sporocilo || ''
    });
  } catch (e) {
    // Ob izpadu omrežja kode ne označimo kot neveljavne; končno besedo ima
    // create-order, ki jo preveri ob oddaji naročila.
    return { velja: false };
  }
}

async function loadSettings() {
  try {
    // Kuponov ne beremo vec iz baze: seznam vseh veljavnih kod je bil s tem
    // javno dostopen vsakomur s publishable kljucem. Vsako vneseno kodo zdaj
    // posebej vprasamo validate-coupon.
    const [r] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/gm_settings?select=*`, { headers: SB_HEADERS })
    ]);
    if (r.ok) {
      const rows = await r.json();
      rows.forEach(row => {
        try { settings[row.key] = JSON.parse(row.value); }
        catch { settings[row.key] = row.value; }
      });
    }
  } catch(e) { console.warn('Nastavitve: fallback', e); }
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

function izracunajPopust(skupaj, kolicina, kodaVnesena) {
  const danes = todayStr();
  const ujemajoci = [];
  const c = settings.casovniPopust;
  if (c?.aktiven && c.vrednost > 0 && (!c.od || danes >= c.od) && (!c.do || danes <= c.do))
    ujemajoci.push({ vrednost: c.vrednost, opis: CP_LANG === 'en' ? 'Time-limited discount' : 'Časovni popust' });
  const vneseneKode = (kodaVnesena || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);
  for (const p of (settings.popusti || []).filter(p => p.aktiven)) {
    if (p.od && danes < p.od) continue;
    if (p.do && danes > p.do) continue;
    if (p.maxKolicina && (p.porabljeno || 0) >= p.maxKolicina) continue;
    let ok = false;
    let matchedKod = '';
    if (p.tip === 'koda') {
      const ruleKode = (p.kode?.length ? p.kode : p.kod ? [p.kod] : []).filter(Boolean);
      const m = ruleKode.find(k => vneseneKode.includes(k));
      if (m) { ok = true; matchedKod = m; }
    }
    if (p.tip === 'kolicina' && kolicina >= (p.min || 0)) ok = true;
    if (p.tip === 'znesek' && skupaj >= (p.min || 0)) ok = true;
    if (ok) ujemajoci.push({ vrednost: p.vrednost, opis: p.tip === 'koda'
      ? (CP_LANG === 'en' ? `Code ${matchedKod}` : `Koda ${matchedKod}`)
      : p.tip === 'kolicina'
      ? (CP_LANG === 'en' ? `${p.min}+ pcs` : `${p.min}+ kosov`)
      : (CP_LANG === 'en' ? `Over ${p.min} €` : `Nad ${p.min} €`) });
  }
  for (const k of vneseneKode) {
    const e = enkratneKode[k];
    if (e && e.velja)
      ujemajoci.push({ vrednost: e.pct, opis: CP_LANG === 'en' ? `Code ${k}` : `Koda ${k}` });
  }
  if (!ujemajoci.length) return { pct: 0, ujemajoci: [] };
  let pct = settings.sestevajPopuste
    ? ujemajoci.reduce((s, p) => s + p.vrednost, 0)
    : Math.max(...ujemajoci.map(p => p.vrednost));
  return { pct: Math.min(pct, settings.maxPopust || 50), ujemajoci };
}

function fmt(v) {
  return Number(v || 0).toLocaleString(CP_STR.dateLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ── Glavna re-render funkcija ────────────────────────────
function renderCart() {
  const cart = getCart();
  const wrap = document.getElementById('cart-items');
  if (!wrap) return;

  if (!cart.length) {
    wrap.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:rgba(43,11,57,.4)">
        <div style="font-size:2.5rem;margin-bottom:.75rem">🛒</div>
        <div style="font-size:1.4rem;font-weight:300">${CP_STR.empty}</div>
        <a href="${CP_HOME}" style="display:inline-block;margin-top:1.25rem;padding:.55rem 1.25rem;background:#2b0b39;color:#f0ebe3;border-radius:999px;text-decoration:none;font-size:.85rem">${CP_STR.back}</a>
      </div>`;
    updateSummary(0, 0, 0, []);
    return;
  }

  wrap.innerHTML = cart.map((item, i) => `
    <div class="gm-cart-item" data-index="${i}">
      <div class="gm-cart-item__image">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;border-radius:10px;display:block">` : '<div style="width:100%;height:100%;background:rgba(43,11,57,.06);border-radius:10px"></div>'}
      </div>
      <div class="gm-cart-item__content">
        <div style="font-size:1.1rem;font-weight:400;color:#2b0b39;line-height:1.2">${item.name}</div>
        <div style="font-size:.78rem;color:rgba(43,11,57,.5);margin:.2rem 0 .5rem">${item.variantLabel || ''}</div>
        <div style="font-size:.85rem;color:#2b0b39;font-weight:500">${
          item.discountPct > 0
            ? `<span style="text-decoration:line-through;color:rgba(43,11,57,.4);font-weight:400">${fmt(item.originalPrice)}</span> ${fmt(item.price)} <span style="font-size:.72em;color:#3a6b4a;font-weight:600">−${item.discountPct}%</span>`
            : `${fmt(item.price)}`
        } ${CP_STR.unit}</div>
      </div>
      <div class="gm-cart-item__controls">
        <div style="display:flex;align-items:center;gap:.4rem;background:rgba(43,11,57,.05);border-radius:999px;padding:.2rem .3rem">
          <button onclick="changeQty(${i}, -1)" style="width:28px;height:28px;border:none;background:white;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.1)">−</button>
          <span style="min-width:1.5rem;text-align:center;font-size:.9rem;font-weight:600;color:#2b0b39">${item.quantity}</span>
          <button onclick="changeQty(${i}, 1)" style="width:28px;height:28px;border:none;background:white;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.1)">+</button>
        </div>
        <div style="font-weight:700;color:#2b0b39;font-size:.95rem;margin-top:.35rem">${fmt(item.price * item.quantity)}</div>
        <button onclick="removeItem(${i})" style="background:none;border:none;color:rgba(43,11,57,.35);font-size:.72rem;cursor:pointer;padding:0;margin-top:.2rem;text-decoration:underline">${CP_STR.remove}</button>
      </div>
    </div>`).join('');

  // Izračun
  const bruto = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const kolicina = cart.reduce((s, i) => s + i.quantity, 0);
  const koda = document.getElementById('kupon-input')?.value?.trim() || '';
  const { pct, ujemajoci } = izracunajPopust(bruto, kolicina, koda);
  const popustZnesek = bruto * pct / 100;

  updateSummary(bruto, pct, popustZnesek, ujemajoci);
}

// Poštnina je odvisna od drzave dostave, ta pa se izbere sele na blagajni -
// tu je se ne poznamo. Prej smo tu izracunali domaco poštnino in jo prikazali
// kot da je dokoncna; tujemu kupcu je kosarica obljubljala napacen znesek.
// Namesto ugibanja povzetek pove oba prava, znesek za placilo pa ostane brez
// postnine - dokoncen izracun kupec vidi na blagajni.
function updateSummary(bruto, pct, popustZnesek, ujemajoci = []) {
  const el = document.getElementById('cart-summary-detail');
  const btn = document.getElementById('checkout-btn');
  if (!el) return;
  const cart = getCart();
  if (btn) btn.disabled = !cart.length;

  const zneskPoPopustu = bruto - popustZnesek;
  const postninaTxt = besediloBrezplacnePostnine(settings, CP_LANG);

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.4rem">
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:.83rem;color:rgba(43,11,57,.55);padding:.1rem 0">
        <span>${CP_STR.itemsCount(cart.reduce((s,i)=>s+i.quantity,0))}</span>
        <span>${fmt(bruto)}</span>
      </div>
      ${pct > 0 ? `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:.83rem;color:#3a6b4a;padding:.1rem 0">
          <span>${CP_STR.discount(pct)}</span>
          <span>−${fmt(popustZnesek)}</span>
        </div>
        ${ujemajoci.map(u => `<div style="font-size:.68rem;color:#3a6b4a;text-align:right;letter-spacing:.01em">✓ ${u.opis}</div>`).join('')}
      ` : ''}
      ${postninaTxt ? `<div style="font-size:.78rem;color:rgba(43,11,57,.55);padding:.3rem 0;line-height:1.5">
        🚚 ${postninaTxt}
        <span style="display:block;font-size:.68rem;color:rgba(43,11,57,.4);margin-top:.1rem">${CP_STR.shippingNote}</span>
      </div>` : `<div style="font-size:.78rem;color:rgba(43,11,57,.55);padding:.3rem 0">${CP_STR.shipping}: ${CP_STR.shippingNote}</div>`}
      <div style="border-top:1px solid rgba(43,11,57,.08);padding-top:.7rem;margin-top:.25rem;display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:.82rem;font-weight:600;color:#2b0b39">${CP_STR.subtotal}</span>
        <span style="font-size:1.3rem;font-weight:700;color:#2b0b39;font-family:'Cormorant Garamond',serif">${fmt(zneskPoPopustu)}</span>
      </div>
    </div>`;
}

function changeQty(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;
  const newQty = cart[index].quantity + delta;
  if (newQty < 1) { removeItem(index); return; }
  cart[index].quantity = newQty;
  saveCart(cart);
  renderCart();
}

function removeItem(index) {
  const cart = getCart();
  const removed = cart[index];
  cart.splice(index, 1);
  saveCart(cart);
  // GA4 - remove_from_cart
  if (removed && typeof gmRemoveFromCart === 'function') gmRemoveFromCart(removed);
  renderCart();
}

function bindKupon() {
  const input = document.getElementById('kupon-input');
  const btn = document.getElementById('kupon-btn');
  if (!input || !btn) return;

  const validate = async () => {
    const raw = input.value.trim();
    if (!raw) { input.style.borderColor = ''; btn.textContent = CP_STR.applyCoupon; btn.style.cssText = ''; renderCart(); return; }
    const kode = raw.split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

    const lokalno = k =>
      (settings.popusti || []).some(p => {
        if (!p.aktiven || p.tip !== 'koda') return false;
        const ruleKode = (p.kode?.length ? p.kode : p.kod ? [p.kod] : []).filter(Boolean);
        return ruleKode.includes(k);
      });

    // Kod, ki jih lokalno ne poznamo, ne zavrnemo na slepo — enkratne kode iz
    // e-novic pozna samo strežnik. Med čakanjem gumb pove, da preverjamo.
    const neznane = kode.filter(k => !lokalno(k) && !(k in enkratneKode));
    if (neznane.length) {
      btn.disabled = true;
      btn.textContent = '…';
      await Promise.all(neznane.map(preveriEnkratnoKodo));
      btn.disabled = false;
    }

    const veljavne = kode.filter(k => lokalno(k) || (enkratneKode[k] && enkratneKode[k].velja));
    if (veljavne.length === kode.length) {
      // All codes valid — green ✓
      input.style.borderColor = '#3a6b4a';
      btn.textContent = '✓';
      btn.style.background = '#3a6b4a';
      btn.style.color = 'white';
      btn.style.borderColor = '';
    } else if (veljavne.length > 0) {
      // Some codes valid — amber ⚠
      input.style.borderColor = '#e67e22';
      btn.textContent = CP_STR.couponPartial;
      btn.style.background = '#e67e22';
      btn.style.color = 'white';
      btn.style.borderColor = '';
    } else {
      // No codes valid — red ✗
      input.style.borderColor = '#c0392b';
      btn.textContent = '✗';
      btn.style.background = '';
      btn.style.color = '#c0392b';
    }
    renderCart();
  };

  btn.addEventListener('click', validate);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') validate(); });
}

document.addEventListener('click', e => {
  if (e.target.closest('#checkout-btn')) {
    const cart = getCart();
    if (!cart.length) return;
    const kupon = document.getElementById('kupon-input')?.value?.trim() || '';
    sessionStorage.setItem('gm_kupon', kupon);
    const total = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    // GA4 begin_checkout tukaj NE pošiljamo - pošlje ga blagajna ob prihodu
    // (gmInitCheckoutPage). Prej sta se sprožila oba in je bil begin_checkout
    // v GA4 štet dvakrat na eno sejo.
    if (typeof gmFbInitiateCheckout === 'function') gmFbInitiateCheckout(cart, total);
    window.location.href = CP_CHECKOUT_URL;
  }
});

// analytics.js naloži site-footer.js dinamično (defer), zato ob DOMContentLoaded
// še ni nujno tu. Prej se je view_cart v takem primeru tiho izgubil - ali je
// event odšel ali ne, je bilo odvisno samo od tega, kdo je bil hitrejši:
// prenos analytics.js ali odgovor Supabase. Zato ga počakamo.
document.addEventListener('DOMContentLoaded', async () => {
  // Izdelke izriši takoj iz localStorage (ne čakaj na omrežje) -
  // šele nato dopolni s poštnino/popusti, ki potrebujejo gm_settings.
  renderCart();
  bindKupon();
  await loadSettings();
  renderCart();
  // GA4 - view_cart. Počakamo, da sta analytics.js in gtag na voljo, sicer se
  // event izgubi (glej gmWhenTracking v cart.js).
  if (typeof gmWhenTracking === 'function') {
    if (await gmWhenTracking('gmInitCartPage')) gmInitCartPage();
  } else if (typeof gmInitCartPage === 'function') {
    gmInitCartPage();
  }
});
