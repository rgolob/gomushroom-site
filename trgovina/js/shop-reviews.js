// GoMushroom — Recenzije izdelkov na dnu trgovinske strani (naključni izbor, povezan s produktom)
(function(){
'use strict';

if (typeof SB_URL === 'undefined') {
  var SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
  var SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
  var SB_HEADERS = { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY };
}

const MAX_CARDS = 6;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stars(r) { return '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0)); }

function injectStyles() {
  if (document.getElementById('gmsr-styles')) return;
  const s = document.createElement('style');
  s.id = 'gmsr-styles';
  s.textContent = `
.gmsr-wrap{width:100%;padding:2rem 0}
.gmsr-h2{font-size:1.45rem;font-weight:700;color:var(--brand,#2b0a39);margin:0 0 1.5rem;letter-spacing:var(--ls-h2,-.022em)}
.gmsr-grid{display:grid;grid-template-columns:1fr;gap:20px}
@media (min-width:720px){.gmsr-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:1080px){.gmsr-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.gmsr-card{display:block;background:#fff;border:1px solid rgba(43,11,57,.07);border-radius:14px;padding:1.25rem 1.4rem;text-decoration:none;color:inherit;transition:box-shadow .15s,transform .15s}
.gmsr-card:hover{box-shadow:0 8px 24px rgba(43,11,57,.08);transform:translateY(-2px)}
.gmsr-stars{color:#b18556;font-size:1rem;margin-bottom:.5rem;letter-spacing:.1em}
.gmsr-title{font-size:.95rem;font-weight:700;color:var(--brand,#2b0a39);margin:0 0 .35rem}
.gmsr-body{font-size:.88rem;color:rgba(43,11,57,.75);line-height:1.6;margin:0 0 .8rem;
  display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.gmsr-foot{display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:var(--muted,#6b726d);gap:.5rem}
.gmsr-name{font-weight:600;color:var(--brand,#2b0a39)}
.gmsr-product{color:#b18556;font-weight:600;white-space:nowrap}
`;
  document.head.appendChild(s);
}

async function init() {
  const mount = document.getElementById('gm-trgovina-recenzije');
  if (!mount) return;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/gm_reviews?status=eq.approved&order=created_at.desc&limit=100`, { headers: SB_HEADERS });
    if (!r.ok) return;
    const all = await r.json();
    // Izloči IG akcije (niso prava recenzija izdelka) in prazne
    const real = all.filter(rv => !(rv.product_id || '').startsWith('ig-') && (rv.body || rv.title));
    const picked = shuffle(real).slice(0, MAX_CARDS);
    if (!picked.length) return;

    injectStyles();
    mount.innerHTML = buildHTML(picked);
  } catch (e) { console.warn('Recenzije v trgovini napaka:', e); }
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function buildHTML(picked) {
  const cards = picked.map(rv => {
    const url = `/trgovina/${rv.product_id}-tinktura/#gm-recenzije`;
    return `
      <a class="gmsr-card" href="${url}">
        <div class="gmsr-stars">${stars(rv)}</div>
        ${rv.title ? `<p class="gmsr-title">${esc(rv.title)}</p>` : ''}
        <p class="gmsr-body">${esc(rv.body)}</p>
        <div class="gmsr-foot">
          <span class="gmsr-name">${esc(rv.name)}</span>
          <span class="gmsr-product">${esc(rv.product_name)} →</span>
        </div>
      </a>`;
  }).join('');

  return `<div class="gmsr-wrap">
    <h2 class="gmsr-h2">Kaj pravijo naše stranke</h2>
    <div class="gmsr-grid">${cards}</div>
  </div>`;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
