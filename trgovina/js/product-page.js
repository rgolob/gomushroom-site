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

// Jezik strani — preklopi prikazane nize (cene/zaloga/gumbi ostajajo isti podatki iz baze)
const LANG = document.documentElement.lang === 'en' ? 'en' : 'sl';
const PP_STR = {
  sl: {
    addToCart: 'Dodaj v košarico', outOfStock: 'Ni na zalogi', lastPieces: '● Zadnji kosi', inStock: '● Na zalogi',
    alcNote: 'Alkoholna različica.', glyNote: 'Brezalkoholna različica z glicerinom.',
    variantName: { alc: 'Alkoholna', gly: 'Brezalkoholna' },
    reviewWord: n => n === 1 ? 'ocena' : n < 5 ? 'ocene' : 'ocen',
    customer: 'Kupec', batchInPrep: d => `📋 Serija v pripravi · predviden zaključek: ${d}`,
    dateLocale: 'sl-SI'
  },
  en: {
    addToCart: 'Add to cart', outOfStock: 'Out of stock', lastPieces: '● Low stock', inStock: '● In stock',
    alcNote: 'Alcohol-based version.', glyNote: 'Alcohol-free version with glycerin.',
    variantName: { alc: 'Alcohol-based', gly: 'Alcohol-free' },
    reviewWord: n => n === 1 ? 'review' : 'reviews',
    customer: 'Customer', batchInPrep: d => `📋 New batch in progress · expected: ${d}`,
    dateLocale: 'en-IE'
  }
}[LANG];

function formatPrice(value) {
  return Number(value || 0).toLocaleString(PP_STR.dateLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

function stockLabel(v) {
  if (!v.in_stock) return `<span style="color:#9a8f85;font-size:.8rem">${PP_STR.outOfStock}</span>`;
  if (v.low_stock) return `<span style="color:#e67e22;font-size:.8rem">${PP_STR.lastPieces}</span>`;
  return `<span style="color:#3a6b4a;font-size:.8rem">${PP_STR.inStock}</span>`;
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
    if (variantLabel) variantLabel.textContent = PP_STR.variantName[v.type] || v.name;

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
    if (variantNote) variantNote.textContent = v.type === 'alc' ? PP_STR.alcNote : PP_STR.glyNote;

    if (addBtn) {
      addBtn.dataset.variant = v.type;
      addBtn.dataset.variantLabel = v.name;
      addBtn.dataset.price = discPrice.toFixed(2);
      addBtn.dataset.originalPrice = v.price_malo.toFixed(2);
      addBtn.dataset.discountPct = v.discount_pct || 0;
      addBtn.dataset.sku = v.sku || '';
      addBtn.disabled = !v.in_stock;
      addBtn.textContent = v.in_stock ? PP_STR.addToCart : PP_STR.outOfStock;
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

// shippingDetails/hasMerchantReturnPolicy sta zdaj staticno zapisana v
// JSON-LD vsake produktne strani (redko se spremenita), namesto da bi ju
// vsakic znova vbrizgali sem. Prej sta ta funkcija in injectReviewSchema()
// obe hkrati (brez await) brale in prepisovale isti <script> element, kar
// je povzrocalo tekmovalni pogoj - katerakoli je pisala kasneje, je tiho
// izbrisala polja, ki jih je dodala druga (npr. aggregateRating).

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
      const title = LANG === 'en' ? (r.title_en || r.title) : r.title;
      const body = LANG === 'en' ? (r.body_en || r.body) : r.body;
      const rev = {
        '@type': 'Review',
        author: { '@type': 'Person', name: r.name || PP_STR.customer },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating || 5, bestRating: 5, worstRating: 1 }
      };
      if (title) rev.name = title;
      if (body) rev.reviewBody = body;
      if (r.created_at) rev.datePublished = r.created_at.slice(0, 10);
      return rev;
    });
    script.textContent = JSON.stringify(data);
  } catch(e) { console.warn('Review schema napaka:', e); }
}

async function loadRatingBadge(slug) {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/gm_reviews?product_id=eq.${slug}&status=eq.approved&select=rating,title,body,title_en,body_en,name,created_at&order=created_at.desc`,
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
    const label = PP_STR.reviewWord(rows.length);

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
    const formatted = datum.toLocaleDateString(PP_STR.dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });

    const highlights = document.querySelector('.product-highlights');
    if (!highlights) return;
    const badge = document.createElement('p');
    badge.style.cssText = 'margin-top:.5rem;font-size:.8rem;color:#7a4f2e;font-weight:500';
    badge.textContent = PP_STR.batchInPrep(formatted);
    highlights.insertAdjacentElement('afterend', badge);
  } catch(e) {}
}

// Uskladi ceno/zalogo v JSON-LD z dejansko aktivnim popustom/zalogo variante.
// Klice se sinhrono, takoj po initProductPage - torej PREDEN loadRatingBadge
// sploh zacne svoj async fetch - da ne pride do iste tekme kot prej med
// vec vzporednimi pisci istega <script> elementa (glej git zgodovino).
function syncOfferSchema(variants) {
  try {
    const script = document.querySelector('script[type="application/ld+json"]');
    if (!script) return;
    const data = JSON.parse(script.textContent);
    if (!Array.isArray(data.offers)) return;
    data.offers.forEach(offer => {
      const v = variants.find(v => v.sku === offer.sku);
      if (!v) return;
      const effective = v.discount_pct > 0
        ? +(v.price_malo * (1 - v.discount_pct / 100)).toFixed(2)
        : v.price_malo;
      offer.price = effective.toFixed(2);
      offer.availability = !v.in_stock
        ? 'https://schema.org/OutOfStock'
        : v.low_stock
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock';
    });
    script.textContent = JSON.stringify(data);
  } catch(e) { console.warn('Offer schema sync napaka:', e); }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadProductVariants();
    if (!data) return;
    initProductPage(data.variants, data.product);
    syncOfferSchema(data.variants);
    loadRatingBadge(PRODUCT_SLUG);
    loadOpenDN(PRODUCT_SLUG);
  } catch(e) {
    console.error('Product page error:', e);
  }
});
