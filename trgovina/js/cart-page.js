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
    let ustreza = false;
    if (p.tip === 'koda' && kodaVnesena && p.kod === kodaVnesena.toUpperCase().trim()) ustreza = true;
    if (p.tip === 'kolicina' && kolicina >= (p.min || 0)) ustreza = true;
    if (p.tip === 'znesek' && skupaj >= (p.min || 0)) ustreza = true;
    if (ustreza) ujemajoci.push({
      vrednost: p.vrednost,
      opis: p.tip === 'koda' ? `Koda ${p.kod}` : p.tip === 'kolicina' ? `${p.min}+ kosov` : `Nad ${p.min} €`
    });
  }

  if (!ujemajoci.length) return { pct: 0, ujemajoci: [] };
  let pct = settings.sestevajPopuste
    ? ujemajoci.reduce((s, p) => s + p.vrednost, 0)
    : Math.max(...ujemajoci.map(p => p.vrednost));
  return { pct: Math.min(pct, settings.maxPopust || 50), ujemajoci };
}

function fmt(value) {
  return Number(value || 0).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function renderCartPage() {
  const cart = getCart();
  const itemsWrap = document.getElementById('cart-items');
  if (!itemsWrap) return;

  if (!cart.length) {
    itemsWrap.innerHTML = '<div class="gm-cart-empty">Košarica je trenutno prazna.</div>';
    updateSummary(0, 0, 0, 0, []);
    return;
  }

  const bruto = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const kolicina = cart.reduce((s, i) => s + i.quantity, 0);
  const koda = document.getElementById('kupon-input')?.value?.trim() || '';
  const { pct, ujemajoci } = izracunajPopust(bruto, kolicina, koda);
  const popustZnesek = bruto * pct / 100;
  const zneskPoPopustu = bruto - popustZnesek;
  const postnina = zneskPoPopustu >= (settings.brezplacnaPosninaOd || 60) ? 0 : (settings.postnina || 3.90);
  const skupaj = zneskPoPopustu + postnina;

  itemsWrap.innerHTML = cart.map((item, index) => `
    <article class="gm-cart-item">
      <div class="gm-cart-item__image">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy">` : ''}
      </div>
      <div class="gm-cart-item__content">
        <h3>${item.name}</h3>
        <p>${item.variantLabel || ''}</p>
        <p>Cena: ${fmt(item.price)}</p>
      </div>
      <div class="gm-cart-item__controls">
        <label>Količina
          <input type="number" min="1" step="1" value="${item.quantity}" data-cart-qty data-index="${index}">
        </label>
        <div class="gm-cart-item__subtotal">${fmt(item.price * item.quantity)}</div>
        <button class="gm-link-btn" type="button" data-remove-item data-index="${index}">Odstrani</button>
      </div>
    </article>`).join('');

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
    <div class="gm-cart-summary__row">
      <span>Skupaj (${cart.reduce((s,i)=>s+i.quantity,0)} kosov)</span>
      <strong>${fmt(bruto)}</strong>
    </div>
    ${pct > 0 ? `
      <div class="gm-cart-summary__row" style="color:#3a6b4a">
        <span>Popust (${pct}%)</span>
        <strong>−${fmt(popustZnesek)}</strong>
      </div>
      ${ujemajoci.map(u => `<div style="font-size:.72rem;color:#3a6b4a;padding:.1rem 0">✓ ${u.opis}</div>`).join('')}
    ` : ''}
    <div class="gm-cart-summary__row">
      <span>Poštnina</span>
      <strong>${postnina === 0 ? '🎁 Brezplačno' : fmt(postnina)}</strong>
    </div>
    <div style="font-size:.72rem;color:${postnina===0?'#3a6b4a':'#888'};text-align:right;margin-bottom:.5rem">
      ${postnina === 0
        ? `✓ Brezplačna dostava nad ${fmt(brezplacnaOd)}`
        : doBrezplacne > 0
          ? `Dodaj še ${fmt(doBrezplacne)} za brezplačno dostavo`
          : `Brezplačna dostava nad ${fmt(brezplacnaOd)}`}
    </div>
    <div style="border-top:1px solid rgba(43,11,57,.1);padding-top:.75rem;margin-top:.25rem" class="gm-cart-summary__row">
      <span style="font-weight:700">Skupaj za plačilo</span>
      <strong style="font-size:1.2rem">${fmt(skupaj)}</strong>
    </div>`;
}

function bindKupon() {
  const input = document.getElementById('kupon-input');
  const btn = document.getElementById('kupon-btn');
  if (!input || !btn) return;

  btn.addEventListener('click', () => {
    const koda = input.value.trim().toUpperCase();
    if (!koda) return;
    const najden = (settings.popusti || []).find(p => p.tip === 'koda' && p.kod === koda && p.aktiven);
    if (najden) {
      input.style.borderColor = '#3a6b4a';
      btn.textContent = '✓ Uveljavljen';
      btn.style.background = '#3a6b4a';
      btn.style.color = 'white';
    } else {
      input.style.borderColor = '#c0392b';
      btn.textContent = '✗ Napačna koda';
      btn.style.color = '#c0392b';
      setTimeout(() => {
        btn.textContent = 'Uveljavi';
        btn.style.color = '';
        input.style.borderColor = '';
      }, 2000);
    }
    renderCartPage();
  });

  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}

document.addEventListener('change', e => {
  const input = e.target.closest('[data-cart-qty]');
  if (!input) return;
  const cart = getCart();
  const i = Number(input.dataset.index);
  if (cart[i]) { cart[i].quantity = Math.max(1, Number(input.value || 1)); saveCart(cart); renderCartPage(); }
});

document.addEventListener('click', e => {
  const removeBtn = e.target.closest('[data-remove-item]');
  if (removeBtn) {
    const cart = getCart();
    cart.splice(Number(removeBtn.dataset.index), 1);
    saveCart(cart);
    renderCartPage();
    return;
  }

  if (e.target.closest('#checkout-btn')) {
    if (!getCart().length) return;
    sessionStorage.setItem('gm_kupon', document.getElementById('kupon-input')?.value?.trim() || '');
    window.location.href = '/trgovina/blagajna/';
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  renderCartPage();
  bindKupon();
});
