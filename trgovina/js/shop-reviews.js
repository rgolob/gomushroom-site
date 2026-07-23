// GoMushroom — Recenzije izdelkov na dnu trgovinske strani (naključni izbor, vrtiljak)
(function(){
'use strict';

if (typeof SB_URL === 'undefined') {
  var SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
  var SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
  var SB_HEADERS = { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY };
}

const MAX_CARDS = 8;
const TRUNCATE_LEN = 110;

const LANG = document.documentElement.lang === 'en' ? 'en' : 'sl';
const SR_STR = LANG === 'en'
  ? { heading: 'What our customers say', prev: 'Previous', next: 'Next', readMore: 'Read more' }
  : { heading: 'Kaj pravijo naše stranke', prev: 'Prejšnji', next: 'Naslednji', readMore: 'Preberi več' };
const SR_EN_DETAIL_PATHS = {
  'reishi': '/en/shop/reishi-tincture/',
  'chaga': '/en/shop/chaga-tincture/',
  'bradovec': '/en/shop/lions-mane-tincture/',
  'smrekovi-vrsicki': '/en/shop/spruce-bud-tincture/'
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stars(r) { return '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0)); }

function truncate(text) {
  const t = text || '';
  if (t.length <= TRUNCATE_LEN) return t;
  const cut = t.slice(0, TRUNCATE_LEN);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + '…';
}

function injectStyles() {
  if (document.getElementById('gmsr-styles')) return;
  const s = document.createElement('style');
  s.id = 'gmsr-styles';
  s.textContent = `
.shop-shell>div{min-width:0}
#gm-trgovina-recenzije{min-width:0}
.gmsr-wrap{width:100%;max-width:100%;min-width:0;padding:2rem 0;box-sizing:border-box;overflow:hidden}
.gmsr-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.25rem}
.gmsr-h2{font-size:1.45rem;font-weight:700;color:var(--brand,#2b0a39);margin:0;letter-spacing:var(--ls-h2,-.022em)}
.gmsr-nav{display:flex;gap:.5rem}
.gmsr-nav-btn{width:2.4rem;height:2.4rem;border-radius:50%;border:1px solid rgba(43,11,57,.15);background:#fff;color:var(--brand,#2b0a39);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
.gmsr-nav-btn:hover{background:rgba(43,11,57,.05)}
.gmsr-track{display:flex;gap:20px;width:100%;max-width:100%;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding-bottom:.5rem;-webkit-overflow-scrolling:touch}
.gmsr-track::-webkit-scrollbar{display:none}
.gmsr-card{flex:0 0 auto;width:300px;scroll-snap-align:start;background:#fff;border:1px solid rgba(43,11,57,.07);border-radius:14px;padding:1.25rem 1.4rem;cursor:pointer;transition:box-shadow .15s,transform .15s}
.gmsr-card:hover{box-shadow:0 8px 24px rgba(43,11,57,.08);transform:translateY(-2px)}
.gmsr-stars{color:#b18556;font-size:1rem;margin-bottom:.5rem;letter-spacing:.1em}
.gmsr-title{font-size:.95rem;font-weight:700;color:var(--brand,#2b0a39);margin:0 0 .35rem}
.gmsr-body{font-size:.88rem;color:rgba(43,11,57,.75);line-height:1.6;margin:0 0 .8rem}
.gmsr-foot{display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:var(--muted,#6b726d);gap:.5rem}
.gmsr-name{font-weight:600;color:var(--brand,#2b0a39)}
.gmsr-hint{color:#b18556;font-weight:600;white-space:nowrap}
@media (max-width:640px){.gmsr-card{width:calc(50% - 10px)}}
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
    bindInteraction(mount, picked);
  } catch (e) { console.warn('Recenzije v trgovini napaka:', e); }
}

function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function buildHTML(picked) {
  const cards = picked.map((rv, i) => {
    const title = LANG === 'en' ? (rv.title_en || rv.title) : rv.title;
    const body = LANG === 'en' ? (rv.body_en || rv.body) : rv.body;
    return `
      <div class="gmsr-card" data-idx="${i}" role="button" tabindex="0">
        <div class="gmsr-stars">${stars(rv)}</div>
        ${title ? `<p class="gmsr-title">${esc(title)}</p>` : ''}
        <p class="gmsr-body">${esc(truncate(body))}</p>
        <div class="gmsr-foot">
          <span class="gmsr-name">${esc(rv.name)}</span>
          <span class="gmsr-hint">${SR_STR.readMore}</span>
        </div>
      </div>`;
  }).join('');

  return `<div class="gmsr-wrap">
    <div class="gmsr-head">
      <h2 class="gmsr-h2">${SR_STR.heading}</h2>
      <div class="gmsr-nav">
        <button class="gmsr-nav-btn" type="button" data-gmsr-prev aria-label="${SR_STR.prev}">‹</button>
        <button class="gmsr-nav-btn" type="button" data-gmsr-next aria-label="${SR_STR.next}">›</button>
      </div>
    </div>
    <div class="gmsr-track">${cards}</div>
  </div>`;
}

function bindInteraction(mount, picked) {
  const track = mount.querySelector('.gmsr-track');
  const prev = mount.querySelector('[data-gmsr-prev]');
  const next = mount.querySelector('[data-gmsr-next]');
  if (track && prev && next) {
    const step = () => (track.querySelector('.gmsr-card')?.offsetWidth || 300) + 20;
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  }

  mount.querySelectorAll('.gmsr-card').forEach(card => {
    const rv = picked[Number(card.dataset.idx)];
    const url = (LANG === 'en' ? (SR_EN_DETAIL_PATHS[rv.product_id] || '/en/shop/') : `/trgovina/${rv.product_id}-tinktura/`) + '#gm-recenzije';
    const activate = () => {
      if (card.dataset.expanded === 'true') {
        window.location.href = url;
        return;
      }
      card.dataset.expanded = 'true';
      card.querySelector('.gmsr-body').textContent = (LANG === 'en' ? (rv.body_en || rv.body) : rv.body) || '';
      const hint = card.querySelector('.gmsr-hint');
      if (hint) hint.textContent = `${rv.product_name} →`;
    };
    card.addEventListener('click', activate);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
