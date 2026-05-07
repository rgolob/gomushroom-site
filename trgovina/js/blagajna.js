// ── GoMushroom Blagajna ───────────────────────────────────

const SB_URL = ‘https://rjscfndegqxuefffsedf.supabase.co’;
const SB_KEY = ‘sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa’;
const SB_HEADERS = {
‘Content-Type’: ‘application/json’,
‘apikey’: SB_KEY,
‘Authorization’: ’Bearer ’ + SB_KEY
};

// GoMushroom bančni podatki
const GM_IBAN    = ‘LT373250035347139970’;
const GM_NAME    = ‘GoMushroom, Rok Golob s.p.’;
const GM_ADDRESS = ‘Prapreče pri Straži 22’;
const GM_CITY    = ‘8351 Straža’;

// Nastavitve
let settings = {
postnina: 3.90,
brezplacnaPosninaOd: 60,
sestevajPopuste: false,
maxPopust: 50,
popusti: [],
casovniPopust: { vrednost: 0, od: ‘’, do: ‘’, aktiven: false }
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
} catch(e) { console.warn(‘Settings fallback’, e); }
}

// ── RF referenca (ISO 11649) ──────────────────────────────
function generateRF(orderId) {
const ref = String(orderId).replace(/[^A-Z0-9]/gi, ‘’).toUpperCase();
if (!ref) return ‘’;
const moved = ref + ‘RF00’;
const numeric = moved.split(’’).map(c => {
const code = c.charCodeAt(0);
return code >= 65 ? String(code - 55) : c;
}).join(’’);
const remainder = BigInt(numeric) % 97n;
const checkDigits = String(98n - remainder).padStart(2, ‘0’);
return `RF${checkDigits}${ref}`;
}

// ── UPN QR string ─────────────────────────────────────────
function buildUPNString(amount, rf, purpose) {
const pad = (val, len) => String(val || ‘’).substring(0, len).padEnd(len);
const amountStr = Math.round((amount || 0) * 100).toString().padStart(11, ‘0’);
const fields = [
‘UPNQR’, ‘’, ‘’, ‘’, ‘’, ‘’, ‘’,
amountStr, ‘’,
pad(GM_IBAN, 34),
pad(‘GDSV’, 4),
pad(purpose || ‘Placilo’, 42),
pad(rf, 35),
pad(GM_NAME, 33),
pad(GM_ADDRESS, 33),
pad(GM_CITY, 33),
];
const payload = fields.join(’\n’);
const checksum = payload.split(’’).reduce((s, c) => s + c.charCodeAt(0), 0) % 1000;
return payload + ‘\n’ + String(checksum).padStart(3, ‘0’);
}

function qrUrl(amount, rf, purpose, size = 200) {
const upn = buildUPNString(amount, rf, purpose);
return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upn)}`;
}

// ── Format ────────────────────────────────────────────────
function fmt(v) {
return Number(v || 0).toLocaleString(‘sl-SI’, {
minimumFractionDigits: 2, maximumFractionDigits: 2
}) + ’ €’;
}

function todayStr() { return new Date().toISOString().split(‘T’)[0]; }

// ── Popusti ───────────────────────────────────────────────
function izracunajPopust(skupaj, kolicina, koda) {
const danes = todayStr();
const ujemajoci = [];
const c = settings.casovniPopust;
if (c?.aktiven && c.vrednost > 0 && (!c.od || danes >= c.od) && (!c.do || danes <= c.do))
ujemajoci.push({ vrednost: c.vrednost, opis: ‘Časovni popust’ });
for (const p of (settings.popusti || []).filter(p => p.aktiven)) {
let ok = false;
if (p.tip === ‘koda’ && koda && p.kod === koda.toUpperCase().trim()) ok = true;
if (p.tip === ‘kolicina’ && kolicina >= (p.min || 0)) ok = true;
if (p.tip === ‘znesek’ && skupaj >= (p.min || 0)) ok = true;
if (ok) ujemajoci.push({ vrednost: p.vrednost, opis: p.tip === ‘koda’ ? `Koda ${p.kod}` : p.tip === ‘kolicina’ ? `${p.min}+ kosov` : `Nad ${p.min} €` });
}
if (!ujemajoci.length) return { pct: 0, ujemajoci: [] };
let pct = settings.sestevajPopuste
? ujemajoci.reduce((s, p) => s + p.vrednost, 0)
: Math.max(…ujemajoci.map(p => p.vrednost));
return { pct: Math.min(pct, settings.maxPopust || 50), ujemajoci };
}

// ── Render povzetka ───────────────────────────────────────
function renderSummary() {
const cart = getCart();
const itemsEl = document.getElementById(‘order-items’);
if (!itemsEl) return;

if (!cart.length) {
window.location.href = ‘/trgovina/kosarica/’;
return;
}

const koda = sessionStorage.getItem(‘gm_kupon’) || ‘’;
const bruto = cart.reduce((s, i) => s + i.price * i.quantity, 0);
const kolicina = cart.reduce((s, i) => s + i.quantity, 0);
const { pct, ujemajoci } = izracunajPopust(bruto, kolicina, koda);
const popustZnesek = bruto * pct / 100;
const zneskPoPopustu = bruto - popustZnesek;
const postnina = zneskPoPopustu >= (settings.brezplacnaPosninaOd || 60) ? 0 : (settings.postnina || 3.90);
const skupaj = zneskPoPopustu + postnina;

// Artikli
itemsEl.innerHTML = cart.map(item => ` <div class="order-item"> <div class="order-item__name">${item.name}<br><small style="color:rgba(43,11,57,.4)">${item.variantLabel || ''}</small></div> <div class="order-item__qty">${item.quantity}×</div> <div class="order-item__price">${fmt(item.price * item.quantity)}</div> </div>`).join(’’);

// Zneski
document.getElementById(‘order-subtotal’).textContent = fmt(bruto);
document.getElementById(‘order-shipping’).textContent = postnina === 0 ? ‘🎁 Brezplačno’ : fmt(postnina);
document.getElementById(‘order-total’).textContent = fmt(skupaj);

const discRow = document.getElementById(‘order-discount-row’);
if (pct > 0) {
discRow.style.display = ‘flex’;
document.getElementById(‘order-discount-label’).textContent = `Popust (${pct}%)`;
document.getElementById(‘order-discount-amt’).textContent = `−${fmt(popustZnesek)}`;
} else {
discRow.style.display = ‘none’;
}

// Shrani za submit
window._orderCalc = { bruto, pct, popustZnesek, zneskPoPopustu, postnina, skupaj, kolicina, koda };
}

// ── Validacija ────────────────────────────────────────────
function validate() {
const fields = [‘c-name’, ‘c-email’, ‘c-street’, ‘c-post’, ‘c-city’];
let ok = true;
fields.forEach(id => {
const el = document.getElementById(id);
if (!el.value.trim()) { el.classList.add(‘error’); ok = false; }
else el.classList.remove(‘error’);
});
const email = document.getElementById(‘c-email’);
if (email.value && !email.value.includes(’@’)) { email.classList.add(‘error’); ok = false; }
return ok;
}

// ── Submit naročila ───────────────────────────────────────
async function placeOrder() {
if (!validate()) {
document.querySelector(’.checkout-field input.error’)?.scrollIntoView({ behavior: ‘smooth’, block: ‘center’ });
return;
}

const btn = document.getElementById(‘place-order-btn’);
btn.disabled = true;
btn.textContent = ‘⏳ Pošiljam…’;

const cart = getCart();
const calc = window._orderCalc;
const name = document.getElementById(‘c-name’).value.trim();
const email = document.getElementById(‘c-email’).value.trim();

// Generiraj začasno referenco (bo posodobljena z order ID)
const tempRef = generateRF(‘GM’ + Date.now().toString().slice(-8));

const orderData = {
name,
email,
phone: document.getElementById(‘c-phone’).value.trim() || null,
street: document.getElementById(‘c-street’).value.trim(),
post: document.getElementById(‘c-post’).value.trim(),
city: document.getElementById(‘c-city’).value.trim(),
country: ‘Slovenija’,
note: document.getElementById(‘c-note’).value.trim() || null,
items: cart,
subtotal: calc.bruto,
discount_pct: calc.pct,
discount_amt: calc.popustZnesek,
shipping: calc.postnina,
total: calc.skupaj,
coupon_code: calc.koda || null,
status: ‘pending’,
rf_reference: tempRef,
};

try {
// Shrani v Supabase
const r = await fetch(`${SB_URL}/rest/v1/gm_orders`, {
method: ‘POST’,
headers: { …SB_HEADERS, ‘Prefer’: ‘return=representation’ },
body: JSON.stringify(orderData)
});

```
if (!r.ok) throw new Error('Supabase error: ' + r.status);
const [order] = await r.json();

// Posodobi RF referenco z pravim order ID
const rf = generateRF(order.id.replace(/-/g, '').substring(0, 12).toUpperCase());
await fetch(`${SB_URL}/rest/v1/gm_orders?id=eq.${order.id}`, {
  method: 'PATCH',
  headers: SB_HEADERS,
  body: JSON.stringify({ rf_reference: rf })
});

// Pošlji potrditveni email
await sendConfirmationEmail(order, rf, calc);

// Prikaži QR in uspeh
showSuccess(order, rf, calc);

// Počisti košarico
saveCart([]);
sessionStorage.removeItem('gm_kupon');
```

} catch(e) {
console.error(‘Order error:’, e);
btn.disabled = false;
btn.textContent = ‘Naroči in plačaj →’;
alert(‘Prišlo je do napake. Prosimo, poskusite znova ali nas kontaktirajte na info@gomushroom.si’);
}
}

// ── Potrditveni email ─────────────────────────────────────
async function sendConfirmationEmail(order, rf, calc) {
const ibanFormatted = GM_IBAN.replace(/(.{4})/g, ‘$1 ‘).trim();
const itemsList = order.items.map(i =>
`<tr><td style="padding:.4rem .5rem">${i.name} — ${i.variantLabel||''}</td><td style="padding:.4rem .5rem;text-align:right">${i.quantity}×</td><td style="padding:.4rem .5rem;text-align:right">${(i.price*i.quantity).toFixed(2)} €</td></tr>`
).join(’’);

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Georgia,serif;color:#2b0b39;max-width:600px;margin:0 auto"> <div style="background:#f7f3ee;padding:1.5rem;border-bottom:2px solid #af8455"> <div style="font-size:1.4rem;font-weight:300">Go<strong style="color:#af8455">Mushroom</strong></div> <div style="font-size:.75rem;color:#9a8f82;margin-top:.25rem">Rok Golob s.p. · gomushroom.si</div> <div style="margin-top:.75rem;font-size:1rem;font-weight:500">Predračun — potrditev naročila</div> </div> <div style="padding:1.5rem"> <p>Spoštovani ${order.name},</p> <p>hvala za vaše naročilo pri GoMushroom. V nadaljevanju so podatki za plačilo.</p> <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:.88rem"> <thead><tr style="background:#f7f3ee"> <th style="padding:.4rem .5rem;text-align:left">Artikel</th> <th style="padding:.4rem .5rem;text-align:right">Kol.</th> <th style="padding:.4rem .5rem;text-align:right">Skupaj</th> </tr></thead> <tbody>${itemsList}</tbody> </table> ${calc.pct > 0 ? `<p style="color:#3a6b4a;font-size:.88rem">Popust (${calc.pct}%): −${calc.popustZnesek.toFixed(2)} €</p>` : ‘’}
<p style="font-size:.88rem">Poštnina: ${calc.postnina === 0 ? ‘Brezplačno’ : calc.postnina.toFixed(2) + ’ €’}</p>
<p style="font-size:1.1rem;font-weight:700">Skupaj za plačilo: ${calc.skupaj.toFixed(2)} €</p>

```
  <div style="background:#f7f3ee;border-left:3px solid #af8455;padding:1rem;border-radius:0 8px 8px 0;margin:1.25rem 0">
    <strong style="font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:#9a8f82;display:block;margin-bottom:.5rem">Podatki za plačilo</strong>
    Prejemnik: ${GM_NAME}<br>
    IBAN: ${ibanFormatted}<br>
    BIC: HDELSI22<br>
    Referenca: ${rf}<br>
    Znesek: ${calc.skupaj.toFixed(2)} €
  </div>

  <p style="font-size:.82rem;color:rgba(43,11,57,.6)">Po prejemu plačila bomo naročilo nemudoma odpremili.</p>
  <p>Lep pozdrav,<br>Rok</p>
</div>
<div style="background:#f7f3ee;padding:1rem 1.5rem;border-top:1px solid rgba(43,11,57,.1);font-size:.72rem;color:#9a8f82">
  GoMushroom, Rok Golob s.p. · Prapreče pri Straži 22, 8351 Straža · <a href="mailto:info@gomushroom.si" style="color:#af8455">info@gomushroom.si</a>
</div>
```

  </body></html>`;

try {
await fetch(’/.netlify/functions/send-email’, {
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({
to: order.email,
subject: `Potrditev naročila — GoMushroom`,
html
})
});
// Označi kot poslano
await fetch(`${SB_URL}/rest/v1/gm_orders?id=eq.${order.id}`, {
method: ‘PATCH’,
headers: SB_HEADERS,
body: JSON.stringify({ confirmation_sent_at: new Date().toISOString() })
});
} catch(e) { console.warn(‘Email send failed:’, e); }
}

// ── Prikaz uspeha + QR ───────────────────────────────────
function showSuccess(order, rf, calc) {
document.getElementById(‘checkout-form-wrap’).style.display = ‘none’;
const successEl = document.getElementById(‘order-success’);
successEl.classList.add(‘visible’);

// QR koda
const qr = qrUrl(calc.skupaj, rf, `Placilo narocila GoMushroom`, 200);
document.getElementById(‘qr-img’).src = qr;

// Plačilni podatki
const ibanFormatted = GM_IBAN.replace(/(.{4})/g, ’$1 ’).trim();
document.getElementById(‘payment-details’).innerHTML = `<strong>Podatki za nakazilo</strong> Prejemnik: ${GM_NAME}<br> IBAN: ${ibanFormatted}<br> BIC: HDELSI22<br> Referenca: <strong>${rf}</strong><br> Znesek: <strong>${calc.skupaj.toFixed(2)} €</strong>`;

successEl.scrollIntoView({ behavior: ‘smooth’ });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener(‘DOMContentLoaded’, async () => {
await loadSettings();
renderSummary();

document.getElementById(‘place-order-btn’)?.addEventListener(‘click’, placeOrder);

// Real-time error clearing
document.querySelectorAll(’.checkout-field input’).forEach(input => {
input.addEventListener(‘input’, () => input.classList.remove(‘error’));
});

// Nav toggle
const navToggle = document.getElementById(‘nav-toggle’);
const siteHeader = document.getElementById(‘site-header’);
if (navToggle && siteHeader) {
navToggle.addEventListener(‘click’, () => {
const expanded = navToggle.getAttribute(‘aria-expanded’) === ‘true’;
navToggle.setAttribute(‘aria-expanded’, String(!expanded));
siteHeader.classList.toggle(‘nav-open’);
});
}
});
