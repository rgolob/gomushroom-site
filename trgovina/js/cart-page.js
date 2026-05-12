// ── GoMushroom Košarica ───────────────────────────────────
const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
const SB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY
};

let settings = {
  postnina: 3.90,
  brezplacnaPosninaOd: 60,
  sestevajPopuste: false,
  maxPopust: 50,
  popusti: [],
  casovniPopust: { vrednost: 0, od: '', do: '', aktiven: false }
};

async function loadSettings() {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/gm_settings?select=*`, { headers: SB_HEADERS });
    if (!r.ok) return;
    const rows = await r.json();
    rows.forEach(row => {
      try { settings[row.key] = JSON.parse(row.value); }
      catch { settings[row.key] = row.value; }
    });
  } catch(e) { console.warn('Nastavitve: fallback', e); }
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

function izracunajPopust(skupaj, kolicina, kodaVnesena) {
  const danes = todayStr();
  const ujemajoci = [];
  const c = settings.casovniPopust;
  if (c?.aktiven && c.vrednost > 0 && (!c.od || danes >= c.od) && (!c.do || danes <= c.do))
    ujemajoci.push({ vrednost: c.vrednost, opis: 'Časovni popust' });
  for (const p of (settings.popusti || []).filter(p => p.aktiven)) {
    if (p.od && danes < p.od) continue;
    if (p.do && danes > p.do) continue;
    if (p.maxKolicina && (p.porabljeno || 0) >= p.maxKolicina) continue;
    let ok = false;
    const kode = (kodaVnesena || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);
    let matchedKod = '';
    if (p.tip === 'koda') {
      const ruleKode = (p.kode?.length ? p.kode : p.kod ? [p.kod] : []).filter(Boolean);
      const m = ruleKode.find(k => kode.includes(k));
      if (m) { ok = true; matchedKod = m; }
    }
    if (p.tip === 'kolicina' && kolicina >= (p.min || 0)) ok = true;
    if (p.tip === 'znesek' && skupaj >= (p.min || 0)) ok = true;
    if (ok) ujemajoci.push({ vrednost: p.vrednost, opis: p.tip === 'koda' ? `Koda ${matchedKod}` : p.tip === 'kolicina' ? `${p.min}+ kosov` : `Nad ${p.min} €` });
  }
  if (!ujemajoci.length) return { pct: 0, ujemajoci: [] };
  let pct = settings.sestevajPopuste
    ? ujemajoci.reduce((s, p) => s + p.vrednost, 0)
    : Math.max(...ujemajoci.map(p => p.vrednost));
  return { pct: Math.min(pct, settings.maxPopust || 50), ujemajoci };
}

function fmt(v) {
  return Number(v || 0).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
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
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:300">Košarica je prazna</div>
        <a href="/trgovina/" style="display:inline-block;margin-top:1.25rem;padding:.55rem 1.25rem;background:#2b0b39;color:#f0ebe3;border-radius:999px;text-decoration:none;font-size:.85rem">← Nazaj v trgovino</a>
      </div>`;
    updateSummary(0, 0, 0, 0, []);
    return;
  }

  wrap.innerHTML = cart.map((item, i) => `
    <div class="gm-cart-item" data-index="${i}">
      <div class="gm-cart-item__image">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy" style="width:100%;height:100%;object-fit:contain;border-radius:10px;display:block">` : '<div style="width:100%;height:100%;background:rgba(43,11,57,.06);border-radius:10px"></div>'}
      </div>
      <div class="gm-cart-item__content">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:400;color:#2b0b39;line-height:1.2">${item.name}</div>
        <div style="font-size:.78rem;color:rgba(43,11,57,.5);margin:.2rem 0 .5rem">${item.variantLabel || ''}</div>
        <div style="font-size:.85rem;color:#2b0b39;font-weight:500">${fmt(item.price)} / kom</div>
      </div>
      <div class="gm-cart-item__controls">
        <div style="display:flex;align-items:center;gap:.4rem;background:rgba(43,11,57,.05);border-radius:999px;padding:.2rem .3rem">
          <button onclick="changeQty(${i}, -1)" style="width:28px;height:28px;border:none;background:white;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.1)">−</button>
          <span style="min-width:1.5rem;text-align:center;font-size:.9rem;font-weight:600;color:#2b0b39">${item.quantity}</span>
          <button onclick="changeQty(${i}, 1)" style="width:28px;height:28px;border:none;background:white;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.1)">+</button>
        </div>
        <div style="font-weight:700;color:#2b0b39;font-size:.95rem;margin-top:.35rem">${fmt(item.price * item.quantity)}</div>
        <button onclick="removeItem(${i})" style="background:none;border:none;color:rgba(43,11,57,.35);font-size:.72rem;cursor:pointer;padding:0;margin-top:.2rem;text-decoration:underline">Odstrani</button>
      </div>
    </div>`).join('');

  // Izračun
  const bruto = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const kolicina = cart.reduce((s, i) => s + i.quantity, 0);
  const koda = document.getElementById('kupon-input')?.value?.trim() || '';
  const { pct, ujemajoci } = izracunajPopust(bruto, kolicina, koda);
  const popustZnesek = bruto * pct / 100;
  const zneskPoPopustu = bruto - popustZnesek;
  const postnina = zneskPoPopustu >= (settings.brezplacnaPosninaOd || 60) ? 0 : (settings.postnina || 3.90);
  const skupaj = zneskPoPopustu + postnina;

  updateSummary(bruto, pct, popustZnesek, postnina, skupaj, ujemajoci);
}

function updateSummary(bruto, pct, popustZnesek, postnina, skupaj, ujemajoci = []) {
  const el = document.getElementById('cart-summary-detail');
  const btn = document.getElementById('checkout-btn');
  if (!el) return;
  const cart = getCart();
  if (btn) btn.disabled = !cart.length;

  const brezplacnaOd = settings.brezplacnaPosninaOd || 60;
  const zneskPoPopustu = bruto - popustZnesek;
  const doBrezplacne = brezplacnaOd - zneskPoPopustu;

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:.4rem">
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:.83rem;color:rgba(43,11,57,.55);padding:.1rem 0">
        <span>Skupaj (${cart.reduce((s,i)=>s+i.quantity,0)} kosov)</span>
        <span>${fmt(bruto)}</span>
      </div>
      ${pct > 0 ? `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:.83rem;color:#3a6b4a;padding:.1rem 0">
          <span>Popust ${pct}%</span>
          <span>−${fmt(popustZnesek)}</span>
        </div>
        ${ujemajoci.map(u => `<div style="font-size:.68rem;color:#3a6b4a;text-align:right;letter-spacing:.01em">✓ ${u.opis}</div>`).join('')}
      ` : ''}
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:.83rem;color:rgba(43,11,57,.55);padding:.1rem 0">
        <span>Poštnina</span>
        <span style="color:${postnina===0?'#3a6b4a':'rgba(43,11,57,.55)'}">${postnina === 0 ? 'Brezplačno' : fmt(postnina)}</span>
      </div>
      ${doBrezplacne > 0 && postnina > 0 ? `<div style="font-size:.68rem;color:rgba(43,11,57,.38);text-align:right">Dodaj še ${fmt(doBrezplacne)} za brezplačno dostavo</div>` : ''}
      <div style="border-top:1px solid rgba(43,11,57,.08);padding-top:.7rem;margin-top:.25rem;display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:.82rem;font-weight:600;color:#2b0b39">Skupaj za plačilo</span>
        <span style="font-size:1.3rem;font-weight:700;color:#2b0b39;font-family:'Cormorant Garamond',serif">${fmt(skupaj)}</span>
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

  const validate = () => {
    const raw = input.value.trim();
    if (!raw) { input.style.borderColor = ''; btn.textContent = 'Uveljavi'; btn.style.cssText = ''; renderCart(); return; }
    const kode = raw.split(',').map(k => k.trim().toUpperCase()).filter(Boolean);
    const veljavne = kode.filter(k => (settings.popusti || []).some(p => {
      if (!p.aktiven || p.tip !== 'koda') return false;
      const ruleKode = (p.kode?.length ? p.kode : p.kod ? [p.kod] : []).filter(Boolean);
      return ruleKode.includes(k);
    }));
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
      btn.textContent = 'Delno';
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
    // GA4 - begin_checkout
    if (typeof gmBeginCheckout === 'function') {
      const total = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
      gmBeginCheckout(cart, total, kupon);
    }
    window.location.href = '/trgovina/blagajna/';
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  renderCart();
  bindKupon();
  // GA4 - view_cart
  if (typeof gmInitCartPage === 'function') gmInitCartPage();
});
