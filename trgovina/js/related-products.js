// GoMushroom — Sorodni izdelki: vrtiljak naključnih izdelkov na dnu produktne strani
(function(){
'use strict';

if (typeof SB_URL === 'undefined') {
  var SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
  var SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
  var SB_HEADERS = { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY };
}

function formatPrice(v) {
  return Number(v || 0).toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stars(n) { return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)); }

function buildRatingMap(reviews) {
  const map = {};
  (reviews || []).forEach(rv => {
    const slug = rv.product_id;
    if (!slug || slug.startsWith('ig-')) return;
    if (!map[slug]) map[slug] = { sum: 0, count: 0 };
    map[slug].sum += (rv.rating || 0);
    map[slug].count++;
  });
  return map;
}

function injectStyles() {
  if (document.getElementById('gmrp-styles')) return;
  const s = document.createElement('style');
  s.id = 'gmrp-styles';
  s.textContent = `
.gmrp-wrap{width:100%;padding:1rem 0 2rem;box-sizing:border-box}
.gmrp-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.25rem}
.gmrp-h2{font-size:1.45rem;font-weight:700;color:var(--brand,#2b0a39);margin:0;letter-spacing:var(--ls-h2,-.022em)}
.gmrp-nav{display:flex;gap:.5rem}
.gmrp-nav-btn{width:2.4rem;height:2.4rem;border-radius:50%;border:1px solid rgba(43,11,57,.15);background:#fff;color:var(--brand,#2b0a39);font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
.gmrp-nav-btn:hover{background:rgba(43,11,57,.05)}
.gmrp-track{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding-bottom:.5rem;-webkit-overflow-scrolling:touch}
.gmrp-track::-webkit-scrollbar{display:none}
.gmrp-card{flex:0 0 auto;width:220px;scroll-snap-align:start;text-decoration:none;color:inherit;display:block}
.gmrp-card-img{aspect-ratio:1/1;border-radius:12px;overflow:hidden;background:#f5f0e8;margin-bottom:.7rem}
.gmrp-card-img img{width:100%;height:100%;object-fit:cover;display:block}
.gmrp-card-name{font-size:.95rem;font-weight:700;color:var(--brand,#2b0a39);margin:0 0 .25rem}
.gmrp-card-rating{font-size:.8rem;color:#b18556;margin:0 0 .3rem;display:flex;align-items:center;gap:.3rem}
.gmrp-card-rating-avg{color:var(--muted,#6b726d);font-weight:600}
.gmrp-card-price{font-size:.88rem}
@media (max-width:640px){.gmrp-card{width:160px}}
`;
  document.head.appendChild(s);
}

async function init() {
  const mount = document.getElementById('gm-sorodni');
  if (!mount) return;
  const currentSlug = document.getElementById('add-to-cart-btn')?.dataset.slug || null;

  try {
    const [prodRes, varRes, revRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/gm_products?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
      fetch(`${SB_URL}/rest/v1/gm_product_variants?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
      fetch(`${SB_URL}/rest/v1/gm_reviews?status=eq.approved&select=product_id,rating`, { headers: SB_HEADERS }),
    ]);
    if (!prodRes.ok || !varRes.ok) return;
    const products = await prodRes.json();
    const variants = await varRes.json();
    const ratingMap = buildRatingMap(revRes.ok ? await revRes.json() : []);

    const others = products.filter(p => p.slug !== currentSlug && !p.is_bundle);
    const picked = shuffle(others);
    if (!picked.length) return;

    injectStyles();
    mount.innerHTML = buildHTML(picked, variants, ratingMap);
    bindNav(mount);
  } catch (e) { console.warn('Sorodni izdelki napaka:', e); }
}

function bindNav(mount) {
  const track = mount.querySelector('.gmrp-track');
  const prev = mount.querySelector('[data-gmrp-prev]');
  const next = mount.querySelector('[data-gmrp-next]');
  if (!track || !prev || !next) return;
  const step = () => (track.querySelector('.gmrp-card')?.offsetWidth || 220) + 20;
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
}

function buildHTML(picked, variants, ratingMap) {
  const cards = picked.map(p => {
    const pv = variants.filter(v => v.product_id === p.id);
    const alcVariant = pv.find(v => v.type === 'alc');
    const glyVariant = pv.find(v => v.type === 'gly');
    const defaultVariant = alcVariant || glyVariant;
    if (!defaultVariant) return '';

    const detailUrl = p.detail_path || `/trgovina/${p.slug}-tinktura/`;
    const discPrice = defaultVariant.discount_pct > 0
      ? defaultVariant.price_malo * (1 - defaultVariant.discount_pct / 100)
      : defaultVariant.price_malo;
    const priceHtml = defaultVariant.discount_pct > 0
      ? `<s style="color:#9a8f82;font-weight:400">${formatPrice(defaultVariant.price_malo)}</s> <strong style="color:#2b0b39">${formatPrice(discPrice)}</strong>`
      : `<strong style="color:#2b0b39">${formatPrice(defaultVariant.price_malo)}</strong>`;

    const rating = ratingMap[p.slug];
    const ratingHtml = rating && rating.count
      ? `<div class="gmrp-card-rating">${stars(rating.sum / rating.count)} <span class="gmrp-card-rating-avg">${(rating.sum / rating.count).toFixed(1)}</span></div>`
      : '';

    return `
      <a class="gmrp-card" href="${detailUrl}">
        <div class="gmrp-card-img">
          <img src="${p.image ? p.image.replace(/\.webp$/, '-shop.webp') : '/assets/placeholder.webp'}" alt="${p.name}" width="400" height="400" loading="lazy" onerror="this.src='${p.image || '/assets/placeholder.webp'}'">
        </div>
        <p class="gmrp-card-name">${p.name}</p>
        ${ratingHtml}
        <div class="gmrp-card-price">${priceHtml}</div>
      </a>`;
  }).join('');

  return `<div class="gmrp-wrap">
    <div class="gmrp-head">
      <h2 class="gmrp-h2">Morda vas zanima tudi</h2>
      <div class="gmrp-nav">
        <button class="gmrp-nav-btn" type="button" data-gmrp-prev aria-label="Prejšnji">‹</button>
        <button class="gmrp-nav-btn" type="button" data-gmrp-next aria-label="Naslednji">›</button>
      </div>
    </div>
    <div class="gmrp-track">${cards}</div>
  </div>`;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
