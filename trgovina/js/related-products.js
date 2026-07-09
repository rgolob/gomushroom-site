// GoMushroom — Sorodni izdelki (naključni izdelki iz trgovine na dnu produktne strani)
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

function injectStyles() {
  if (document.getElementById('gmrp-styles')) return;
  const s = document.createElement('style');
  s.id = 'gmrp-styles';
  s.textContent = `
.gmrp-wrap{width:100%;padding:1rem 0 2rem;box-sizing:border-box}
.gmrp-h2{font-size:1.45rem;font-weight:700;color:var(--brand,#2b0a39);margin:0 0 1.5rem;letter-spacing:var(--ls-h2,-.022em)}
`;
  document.head.appendChild(s);
}

async function init() {
  const mount = document.getElementById('gm-sorodni');
  if (!mount) return;
  const currentSlug = document.getElementById('add-to-cart-btn')?.dataset.slug || null;

  try {
    const [prodRes, varRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/gm_products?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
      fetch(`${SB_URL}/rest/v1/gm_product_variants?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    ]);
    if (!prodRes.ok || !varRes.ok) return;
    const products = await prodRes.json();
    const variants = await varRes.json();

    const others = products.filter(p => p.slug !== currentSlug && !p.is_bundle);
    const picked = shuffle(others).slice(0, 3);
    if (!picked.length) return;

    injectStyles();
    mount.innerHTML = buildHTML(picked, variants);
  } catch (e) { console.warn('Sorodni izdelki napaka:', e); }
}

function buildHTML(picked, variants) {
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
      ? `<s style="color:#9a8f82;font-size:.9rem;font-weight:400">${formatPrice(defaultVariant.price_malo)}</s> <strong style="color:#2b0b39">${formatPrice(discPrice)}</strong>`
      : `<strong style="color:#2b0b39">${formatPrice(defaultVariant.price_malo)}</strong>`;

    return `
      <article class="shop-product" data-product-card="${p.id}">
        <a class="shop-product-img-link" href="${detailUrl}">
          <div class="shop-product-image">
            <img src="${p.image ? p.image.replace(/\.webp$/, '-shop.webp') : '/assets/placeholder.webp'}" alt="${p.name}" width="400" height="400" loading="lazy" onerror="this.src='${p.image || '/assets/placeholder.webp'}'">
          </div>
        </a>
        <div class="shop-product-content">
          <a class="shop-product-text-link" href="${detailUrl}">
            ${p.latin ? `<p class="product-species">${p.latin}</p>` : ''}
            <h2>${p.name}</h2>
          </a>
          <div class="shop-product-foot">
            <div class="shop-product-price-row">
              <div>${priceHtml}</div>
            </div>
            <button class="gm-btn gm-btn--primary shop-add-btn" type="button" data-add-to-cart
              data-slug="${p.slug}" data-name="${p.name}"
              data-variant="${defaultVariant.type}" data-variant-label="${defaultVariant.name}"
              data-price="${discPrice.toFixed(2)}" data-sku="${defaultVariant.sku || ''}"
              data-image="${p.image || ''}">
              + Dodaj
            </button>
          </div>
        </div>
      </article>`;
  }).join('');

  return `<div class="gmrp-wrap">
    <h2 class="gmrp-h2">Morda vas zanima tudi</h2>
    <div class="shop-grid">${cards}</div>
  </div>`;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
