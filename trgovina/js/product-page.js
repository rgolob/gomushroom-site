// ── GoMushroom Produktna stran ───────────────────────────
// Bere cene, zalogo in popuste iz Supabase
const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';

const SB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY
};

// Slug produkta — bere iz data-slug atributa gumba za košarico
const PRODUCT_SLUG = document.getElementById('add-to-cart-btn')?.dataset.slug || 'reishi';

function formatPrice(value) {
  return Number(value || 0).toLocaleString('sl-SI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

function stockLabel(v) {
  if (!v.in_stock) return `<span style="color:#9a8f85;font-size:.8rem">Ni na zalogi</span>`;
  if (v.low_stock) return `<span style="color:#e67e22;font-size:.8rem">● Zadnji kosi</span>`;
  return `<span style="color:#3a6b4a;font-size:.8rem">● Na zalogi</span>`;
}

function priceHtml(v) {
  if (v.discount_pct > 0) {
    const discPrice = v.price_malo * (1 - v.discount_pct / 100);
    return `<s style="color:#9a8f82;font-size:1rem;font-weight:400">${formatPrice(v.price_malo)}</s> <span class="price" style="color:#2b0b39">${formatPrice(discPrice)}</span>`;
  }
  return `<span class="price">${formatPrice(v.price_malo)}</span>`;
}

async function loadProductVariants() {
  const [prodRes, varRes, stockRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/gm_products?slug=eq.${PRODUCT_SLUG}&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_product_variants?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_variant_stock_status?select=*`, { headers: SB_HEADERS })
  ]);

  const products = await prodRes.json();
  const product = products[0];
  if (!product) return null;

  const allVariants = await varRes.json();
  const stockData = stockRes.ok ? await stockRes.json() : [];
  const stockMap = Object.fromEntries(stockData.map(s => [s.variant_id, s]));

  const variants = allVariants
    .filter(v => v.product_id === product.id)
    .map(v => {
      const stock = stockMap[v.id] || {};
      const status = stock.stock_status || 'in_stock';
      return {
        ...v,
        discount_pct: Number(v.discount_pct) || 0,
        price_malo: Number(v.price_malo) || 0,
        in_stock: status !== 'out_of_stock',
        low_stock: status === 'low_stock'
      };
    });

  return { product, variants };
}

function initProductPage(variants, product) {
  let activeVariant = variants.find(v => v.type === 'alc') || variants[0];

  const priceWrap = document.getElementById('product-price-wrap');
  const stockWrap = document.getElementById('product-stock-wrap');
  const addBtn = document.getElementById('add-to-cart-btn');
  const variantLabel = document.querySelector('[data-variant-label]');
  const variantNote = document.querySelector('[data-variant-note]');

  function updateUI(v) {
    activeVariant = v;
    const discPrice = v.discount_pct > 0 ? v.price_malo * (1 - v.discount_pct / 100) : v.price_malo;

    if (priceWrap) priceWrap.innerHTML = priceHtml(v);
    if (stockWrap) stockWrap.innerHTML = stockLabel(v);
    if (variantLabel) variantLabel.textContent = v.name;

    const imgWrap = document.querySelector('.product-image-wrap');
    if (imgWrap) {
      let badge = imgWrap.querySelector('.gm-discount-badge');
      if (!badge && v.discount_pct > 0) {
        badge = document.createElement('span');
        badge.className = 'gm-discount-badge';
        imgWrap.appendChild(badge);
      }
      if (badge) {
        badge.textContent = `−${v.discount_pct}%`;
        badge.style.display = v.discount_pct > 0 ? '' : 'none';
      }

      // Zamenjaj sliko izdelka glede na različico, če sta na voljo obe (data-image-alc/-gly)
      const variantImg = v.type === 'gly' ? imgWrap.dataset.imageGly : imgWrap.dataset.imageAlc;
      if (variantImg) {
        const imgEl = imgWrap.querySelector('img');
        const sourceEl = imgWrap.querySelector('source');
        if (imgEl && imgEl.src !== location.origin + variantImg) {
          imgEl.src = variantImg;
          if (sourceEl) sourceEl.srcset = `${variantImg} 800w`;
        }
      }
    }
    if (variantNote) variantNote.textContent = v.type === 'alc' ? 'Alkoholna različica.' : 'Brezalkoholna različica z glicerinom.';

    if (addBtn) {
      addBtn.dataset.variant = v.type;
      addBtn.dataset.variantLabel = v.name;
      addBtn.dataset.price = discPrice.toFixed(2);
      addBtn.dataset.originalPrice = v.price_malo.toFixed(2);
      addBtn.dataset.discountPct = v.discount_pct || 0;
      addBtn.dataset.sku = v.sku || '';
      addBtn.disabled = !v.in_stock;
      addBtn.textContent = v.in_stock ? 'Dodaj v košarico' : 'Ni na zalogi';
    }

    // Posodobi variant gumbe
    document.querySelectorAll('[data-variant-btn]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.variantBtn === v.type);
    });
  }

  // Bind variant gumbe
  document.querySelectorAll('[data-variant-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = variants.find(v => v.type === btn.dataset.variantBtn);
      if (v) updateUI(v);
    });
  });

  // Init z alkoholno varianto
  updateUI(activeVariant);

  // GA4 + Meta Pixel - view_item / ViewContent
  if (typeof gmViewItem === 'function' && product) gmViewItem(product, activeVariant);
  if (typeof gmFbViewContent === 'function' && product) gmFbViewContent(product, activeVariant);
}

// GA4 + Meta Pixel - add_to_cart na produktni strani
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-add-to-cart]');
  if (!btn) return;
  const cartItem = {
    sku: btn.dataset.sku,
    slug: btn.dataset.slug,
    name: btn.dataset.name,
    variant: btn.dataset.variant,
    variantLabel: btn.dataset.variantLabel,
    price: btn.dataset.price,
    quantity: 1,
  };
  if (typeof gmAddToCart === 'function') gmAddToCart(cartItem);
  if (typeof gmFbAddToCart === 'function') gmFbAddToCart(cartItem);
});

async function injectShippingReturnSchema() {
  let rate = 3.90;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/gm_settings?key=eq.postnina&select=value`, { headers: SB_HEADERS });
    if (r.ok) {
      const rows = await r.json();
      if (rows.length) {
        const parsed = parseFloat(JSON.parse(rows[0].value));
        if (!isNaN(parsed)) rate = parsed;
      }
    }
  } catch(e) {}

  try {
    const script = document.querySelector('script[type="application/ld+json"]');
    if (!script) return;
    const data = JSON.parse(script.textContent);
    if (!Array.isArray(data.offers)) return;

    const shippingDetails = {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: rate.toFixed(2), currency: 'EUR' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'SI' }
    };
    const returnPolicy = {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'SI',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnShippingFees'
    };
    data.offers.forEach(o => {
      o.shippingDetails = shippingDetails;
      o.hasMerchantReturnPolicy = returnPolicy;
    });
    script.textContent = JSON.stringify(data);
  } catch(e) { console.warn('Shipping/return schema napaka:', e); }
}

function injectReviewSchema(rows) {
  try {
    const script = document.querySelector('script[type="application/ld+json"]');
    if (!script || !rows.length) return;
    const data = JSON.parse(script.textContent);

    const avg = rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length;
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg.toFixed(1),
      reviewCount: rows.length
    };
    data.review = rows.map(r => {
      const rev = {
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name || 'Kupec' },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating || 5, bestRating: 5, worstRating: 1 }
      };
      if (r.title) rev.name = r.title;
      if (r.body) rev.reviewBody = r.body;
      if (r.created_at) rev.datePublished = r.created_at.slice(0, 10);
      return rev;
    });
    script.textContent = JSON.stringify(data);
  } catch(e) { console.warn('Review schema napaka:', e); }
}

async function loadRatingBadge(slug) {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/gm_reviews?product_id=eq.${slug}&status=eq.approved&select=rating,title,body,name,created_at&order=created_at.desc`,
      { headers: SB_HEADERS }
    );
    if (!r.ok) return;
    const rows = await r.json();
    if (!rows.length) return;

    injectReviewSchema(rows);

    const avg = rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length;
    const avgStr = avg.toFixed(1);
    const full = Math.round(avg);
    const stars = '★'.repeat(full) + '☆'.repeat(5 - full);
    const label = rows.length === 1 ? 'ocena' : rows.length < 5 ? 'ocene' : 'ocen';

    const anchor = document.querySelector('.variant-picker') || document.querySelector('.product-title');
    if (!anchor) return;

    const badge = document.createElement('a');
    badge.href = '#gm-recenzije';
    badge.style.cssText = 'display:inline-flex;align-items:center;gap:.4rem;margin:0 0 .6rem;text-decoration:none;color:inherit';
    badge.innerHTML = `
      <span style="color:#b18556;font-size:.95rem;letter-spacing:.04em">${stars}</span>
      <span style="font-size:.82rem;font-weight:600;color:#2b0b39">${avgStr}</span>
      <span style="font-size:.78rem;color:rgba(43,11,57,.45)">${rows.length} ${label}</span>`;
    anchor.insertAdjacentElement('beforebegin', badge);
  } catch(e) {}
}

const SLUG_TO_VRSTA = {
  'reishi': 'Reishi',
  'bradovec': 'Resasti bradovec',
  'chaga': 'Chaga',
  'smrekovi-vrsicki': 'Smrekovi vršički'
};

async function loadOpenDN(slug) {
  try {
    const vrsta = SLUG_TO_VRSTA[slug];
    if (!vrsta) return;
    const r = await fetch(
      `${SB_URL}/rest/v1/gm_dn_work_orders?status=eq.odprt&vrsta_gobe=eq.${encodeURIComponent(vrsta)}&select=predviden_zakljucek&order=datum.desc&limit=1`,
      { headers: SB_HEADERS }
    );
    if (!r.ok) return;
    const rows = await r.json();
    if (!rows.length || !rows[0].predviden_zakljucek) return;

    const datum = new Date(rows[0].predviden_zakljucek);
    const formatted = datum.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });

    const highlights = document.querySelector('.product-highlights');
    if (!highlights) return;
    const badge = document.createElement('p');
    badge.style.cssText = 'margin-top:.5rem;font-size:.8rem;color:#7a4f2e;font-weight:500';
    badge.textContent = `📋 Serija v pripravi · predviden zaključek: ${formatted}`;
    highlights.insertAdjacentElement('afterend', badge);
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadProductVariants();
    if (!data) return;
    initProductPage(data.variants, data.product);
    loadRatingBadge(PRODUCT_SLUG);
    loadOpenDN(PRODUCT_SLUG);
    injectShippingReturnSchema();
  } catch(e) {
    console.error('Product page error:', e);
  }
});
