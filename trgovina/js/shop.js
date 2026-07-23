// ── GoMushroom Shop ──────────────────────────────────────
if (typeof SB_URL === 'undefined') {
  var SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
  var SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
  var SB_HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + SB_KEY
  };
}

// Jezik strani — preklopi prikazane nize (cene/zaloga ostajajo isti podatki iz baze)
const LANG = document.documentElement.lang === 'en' ? 'en' : 'sl';
const SHOP_STR = {
  sl: {
    outOfStock: 'Ni na zalogi', lastPieces: '● Zadnji kosi', inStock: '● Na zalogi',
    alc: 'Alkoholna', gly: 'Brezalk.', add: '+ Dodaj',
    batchInProgress: (serija) => `Serija ${serija} &bull; v izdelavi`,
    expectedFill: 'Predvideno polnjenje:', infoLink: 'Čemu so namenjeni? →',
    dateLocale: 'sl-SI'
  },
  en: {
    outOfStock: 'Out of stock', lastPieces: '● Low stock', inStock: '● In stock',
    alc: 'Alcohol', gly: 'Alcohol-free', add: '+ Add',
    batchInProgress: (serija) => `Batch ${serija} &bull; in production`,
    expectedFill: 'Expected bottling:', infoLink: 'What are they for? →',
    dateLocale: 'en-IE'
  }
}[LANG];

function formatPrice(value) {
  return Number(value || 0).toLocaleString(SHOP_STR.dateLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

// ── Nastavitve iz Supabase ────────────────────────────────
if (typeof _settings === 'undefined') var _settings = null;
async function loadSettings() {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/gm_settings?select=*`, { headers: SB_HEADERS });
    if (!r.ok) return;
    const rows = await r.json();
    _settings = {};
    rows.forEach(row => {
      try { _settings[row.key] = JSON.parse(row.value); }
      catch { _settings[row.key] = row.value; }
    });
  } catch(e) { console.warn('Settings load failed', e); }
}

function getAktivniPopusti() {
  if (!_settings) return [];
  const danes = new Date().toISOString().split('T')[0];
  const aktivni = [];
  const c = _settings.casovniPopust;
  if (c?.aktiven && c.vrednost > 0 && (!c.od || danes >= c.od) && (!c.do || danes <= c.do))
    aktivni.push({ vrednost: c.vrednost, tip: 'time' });
  for (const p of (_settings.popusti || []).filter(p => p.aktiven)) {
    if (p.od && danes < p.od) continue;
    if (p.do && danes > p.do) continue;
    if (p.maxKolicina && (p.porabljeno || 0) >= p.maxKolicina) continue;
    if (p.prikaziVTrgovini === false) continue;
    if (p.tip === 'koda' && p.prikaziVTrgovini !== true) continue;
    if (p.tip === 'koda') aktivni.push({ vrednost: p.vrednost, tip: 'code', kod: p.kod });
    if (p.tip === 'kolicina') aktivni.push({ vrednost: p.vrednost, tip: 'qty', min: p.min });
    if (p.tip === 'znesek') aktivni.push({ vrednost: p.vrednost, tip: 'amount', min: p.min });
  }
  return aktivni;
}

function renderActiveDiscountBanner() {
  const banner = document.getElementById('shop-discount-banner');
  if (!banner) return;
  const aktivni = getAktivniPopusti();
  const brezplacnaOd = _settings?.brezplacnaPosninaOd;
  if (!aktivni.length && !brezplacnaOd) { banner.style.display = 'none'; return; }
  const vrstice = aktivni.map(p => {
    if (p.tip === 'code') return LANG === 'en'
      ? `🏷 Code <strong>${p.kod}</strong>: −${p.vrednost}%`
      : `🏷 Koda <strong>${p.kod}</strong>: −${p.vrednost}%`;
    if (p.tip === 'qty') return LANG === 'en'
      ? `📦 Buy <strong>${p.min}+ pcs</strong>: −${p.vrednost}%`
      : `📦 Pri nakupu <strong>${p.min}+ kosov</strong>: −${p.vrednost}%`;
    if (p.tip === 'amount') return LANG === 'en'
      ? `💰 Spend over <strong>${p.min} €</strong>: −${p.vrednost}%`
      : `💰 Pri nakupu <strong>Nad ${p.min} €</strong>: −${p.vrednost}%`;
    return LANG === 'en'
      ? `⏰ <strong>Time-limited discount</strong>: −${p.vrednost}%`
      : `⏰ <strong>Časovni popust</strong>: −${p.vrednost}%`;
  });
  if (brezplacnaOd) vrstice.push(LANG === 'en'
    ? `🚚 Free shipping over <strong>${formatPrice(brezplacnaOd)}</strong>`
    : `🚚 Brezplačna dostava nad <strong>${formatPrice(brezplacnaOd)}</strong>`);
  banner.innerHTML = `<div style="display:flex;flex-direction:column;gap:.15rem">
    ${vrstice.map(v=>`<span style="font-size:.75rem;color:rgba(43,11,57,.55);line-height:1.5;letter-spacing:.01em">${v}</span>`).join('')}
  </div>`;
  banner.style.display = '';
}

// ── Produkti iz Supabase ──────────────────────────────────
const MESECI = {
  sl: ['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December']
}[LANG];

function predvidenoDatum(datumStr, predvidenStr) {
  const src = predvidenStr || datumStr;
  if (!src) return null;
  const [y, m, d] = src.split('-').map(Number);
  const dt = predvidenStr ? new Date(y, m - 1, d) : new Date(y, m - 1, d + 18);
  return LANG === 'en' ? `${MESECI[dt.getMonth()]} ${dt.getDate()}` : `${dt.getDate()}. ${MESECI[dt.getMonth()]}`;
}

const VRSTA_TO_SLUG = {
  'Reishi': 'reishi',
  'Resasti bradovec': 'resasti-bradovec',
  'Chaga': 'chaga',
  'Smrekovi vršički': 'smrekovi-vrsicki'
};

const INFO_ARTICLE_LINKS = {
  sl: { 'smrekovi-vrsicki': '/znanje/smrekovi-vrsicki-raziskave/' },
  en: {}
}[LANG];

// Angleške produktne strani
const EN_DETAIL_PATHS = {
  'reishi': '/en/shop/reishi-tincture/',
  'chaga': '/en/shop/chaga-tincture/',
  'bradovec': '/en/shop/lions-mane-tincture/'
};

// Pravo angleško ime izdelka (gm_products.name je samo v slovenscini)
const EN_PRODUCT_NAMES = { 'bradovec': "Lion's Mane" };
function displayProductName(p) {
  return LANG === 'en' ? (EN_PRODUCT_NAMES[p.slug] || p.name) : p.name;
}

// Izdelki, ki (za zdaj) niso na voljo v EN trgovini
const EN_HIDDEN_PRODUCTS = ['smrekovi-vrsicki'];

// ── Kartice izdelkov: kratek opis + oznake z ikonami ──────
const CHIP_ICONS = {
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-4.5 5-8 8-10 3 2 8 5.5 8 10a7 7 0 0 1-7 7 7 7 0 0 1-2 0Z"/><path d="M12 12c-2.5 2.5-4 5-4 8"/>',
  'tree-pine': '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14"/><path d="m17 8 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 8"/><path d="M12 2 9 6.3a1 1 0 0 0 .8 1.7h4.4a1 1 0 0 0 .8-1.7L12 2Z"/><path d="M12 17v5"/>',
  flower: '<circle cx="12" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/>',
  'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z"/>',
  sunrise: '<path d="M12 2v6"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="M16 18a4 4 0 0 0-8 0"/>'
};

function chipSvg(name) {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CHIP_ICONS[name] || ''}</svg>`;
}

const PRODUCT_CARD_META = {
  sl: {
    'reishi': {
      desc: 'Za večerno rutino in mirnejši zaključek dneva.',
      chips: [
        { icon: 'moon', label: 'Večerni ritual' },
        { icon: 'flower', label: 'Umiritev' }
      ]
    },
    'bradovec': {
      desc: 'Za mentalno rutino in zahtevne dni.',
      chips: [
        { icon: 'target', label: 'Fokus' },
        { icon: 'book-open', label: 'Mentalna rutina' }
      ]
    },
    'chaga': {
      desc: 'Za naporne dni in zahtevna obdobja.',
      chips: [
        { icon: 'sunrise', label: 'Vsakodnevna rutina' },
        { icon: 'leaf', label: 'Tradicionalna uporaba' }
      ]
    },
    'smrekovi-vrsicki': {
      desc: 'Iz domače tradicije v sodobnem ekstraktu.',
      chips: [
        { icon: 'tree-pine', label: 'Mladi vršički' },
        { icon: 'leaf', label: 'Tradicionalna uporaba' }
      ]
    }
  },
  en: {
    'reishi': {
      desc: 'For an evening ritual and a calmer end to the day.',
      chips: [
        { icon: 'moon', label: 'Evening ritual' },
        { icon: 'flower', label: 'Calming' }
      ]
    },
    'bradovec': {
      desc: 'For mental routine and demanding days.',
      chips: [
        { icon: 'target', label: 'Focus' },
        { icon: 'book-open', label: 'Mental routine' }
      ]
    },
    'chaga': {
      desc: 'For strenuous days and demanding periods.',
      chips: [
        { icon: 'sunrise', label: 'Daily routine' },
        { icon: 'leaf', label: 'Traditional use' }
      ]
    },
    'smrekovi-vrsicki': {
      desc: 'From local tradition to a modern extract.',
      chips: [
        { icon: 'tree-pine', label: 'Young spruce buds' },
        { icon: 'leaf', label: 'Traditional use' }
      ]
    }
  }
}[LANG];

async function loadProductRatings() {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/gm_reviews?status=eq.approved&select=product_id,rating`, { headers: SB_HEADERS });
    if (!r.ok) return {};
    const rows = await r.json();
    const bySlug = {};
    rows.forEach(row => {
      if (!bySlug[row.product_id]) bySlug[row.product_id] = [];
      bySlug[row.product_id].push(row.rating || 0);
    });
    const out = {};
    Object.keys(bySlug).forEach(slug => {
      const ratings = bySlug[slug];
      out[slug] = {
        avg: ratings.reduce((s, r) => s + r, 0) / ratings.length,
        count: ratings.length
      };
    });
    return out;
  } catch(e) { return {}; }
}

async function loadProducts() {
  const [prodRes, varRes, stockRes, dnRes, ratingsMap] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/gm_products?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_product_variants?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_variant_stock_status?select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_dn_work_orders?status=eq.odprt&select=vrsta_gobe,serija_alc,oznaka,datum,predviden_zakljucek`, { headers: SB_HEADERS }),
    loadProductRatings()
  ]);
  if (!prodRes.ok || !varRes.ok) throw new Error('Napaka pri nalaganju.');
  const products = await prodRes.json();
  const variants = await varRes.json();
  const stockData = stockRes.ok ? await stockRes.json() : [];
  const dnData = dnRes.ok ? await dnRes.json() : [];

  // Naredi map za hiter dostop: variant_id -> stock_status
  const stockMap = Object.fromEntries(stockData.map(s => [s.variant_id, s]));
  // Odprti delovni nalogi: slug -> { serija_alc, oznaka }
  const dnMap = {};
  dnData.forEach(d => {
    const slug = VRSTA_TO_SLUG[d.vrsta_gobe];
    if (slug) dnMap[slug] = d;
  });

  return products
    .filter(p => LANG !== 'en' || !EN_HIDDEN_PRODUCTS.includes(p.slug))
    .map(p => ({
      ...p,
      activeBatch: dnMap[p.slug] || null,
      rating: ratingsMap[p.slug] || null,
      variants: variants
        .filter(v => v.product_id === p.id)
        .map(v => {
          const stock = stockMap[v.id] || {};
          const status = stock.stock_status || 'in_stock';
          return {
            ...v,
            discount_pct: Number(v.discount_pct) || 0,
            price_malo: Number(v.price_malo) || 0,
            in_stock: status !== 'out_of_stock',
            low_stock: status === 'low_stock',
            qty_available: stock.qty_available || 0
          };
        })
    }));
}

// ── Pomočne funkcije ──────────────────────────────────────
function stockBadge(v) {
  if (!v.in_stock) return `<span style="color:#9a8f85;font-size:.75rem;letter-spacing:.04em">${SHOP_STR.outOfStock}</span>`;
  if (v.low_stock) return `<span style="color:#e67e22;font-size:.75rem;letter-spacing:.04em">${SHOP_STR.lastPieces}</span>`;
  return `<span style="color:#3a6b4a;font-size:.75rem;letter-spacing:.04em">${SHOP_STR.inStock}</span>`;
}

const SHOP_HOME = LANG === 'en' ? '/en/shop/' : '/trgovina/';

function buildDetailUrl(p) {
  if (p.is_bundle) return null;
  if (LANG === 'en') return EN_DETAIL_PATHS[p.slug] || null;
  return p.detail_path || `/trgovina/${p.slug}-tinktura/`;
}

function priceHtml(v) {
  if (v.discount_pct > 0) {
    const discPrice = v.price_malo * (1 - v.discount_pct / 100);
    return `<s style="color:#9a8f82;font-size:.9rem;font-weight:400">${formatPrice(v.price_malo)}</s> <strong style="color:#2b0b39">${formatPrice(discPrice)}</strong>`;
  }
  return `<strong style="color:#2b0b39">${formatPrice(v.price_malo)}</strong>`;
}

// ── Render ────────────────────────────────────────────────
function renderShopGrid(products) {
  const grid = document.querySelector('.shop-grid');
  if (!grid) return;

  grid.innerHTML = products.map(p => {
    const alcVariant = p.variants.find(v => v.type === 'alc');
    const glyVariant = p.variants.find(v => v.type === 'gly');
    const defaultVariant = alcVariant || glyVariant;
    if (!defaultVariant) return '';

    const maxDiscount = Math.max(...p.variants.map(v => v.discount_pct || 0));
    const detailUrl = buildDetailUrl(p);
    const discPrice = defaultVariant.discount_pct > 0
      ? defaultVariant.price_malo * (1 - defaultVariant.discount_pct / 100)
      : defaultVariant.price_malo;

    return `
      <article class="shop-product" data-product-card="${p.id}">

        <div class="shop-product-img-wrap">
          <a class="shop-product-img-link" href="${detailUrl || SHOP_HOME}">
            <div class="shop-product-image">
              <img src="${p.image ? p.image.replace(/\.webp$/, '-shop.webp') : '/assets/placeholder.webp'}" alt="${displayProductName(p)}" width="400" height="400" loading="lazy" onerror="this.src='${p.image || '/assets/placeholder.webp'}'">
              ${maxDiscount > 0 ? `<span class="gm-discount-badge">−${maxDiscount}%</span>` : ''}
            </div>
          </a>
          ${p.rating ? `<a class="shop-product-rating" href="${detailUrl ? detailUrl + '#gm-recenzije' : SHOP_HOME}">
            <span class="shop-product-rating-stars">${'★'.repeat(Math.round(p.rating.avg))}${'☆'.repeat(5 - Math.round(p.rating.avg))}</span>
            <span class="shop-product-rating-count">${p.rating.avg.toFixed(1)} (${p.rating.count})</span>
          </a>` : ''}
        </div>

        <div class="shop-product-content">
          <a class="shop-product-text-link" href="${detailUrl || SHOP_HOME}">
            ${p.latin ? `<p class="product-species">${p.latin}</p>` : ''}
            <h2>${displayProductName(p)}</h2>
            ${PRODUCT_CARD_META[p.slug] ? `
            <p class="shop-product-desc">${PRODUCT_CARD_META[p.slug].desc}</p>
            <div class="shop-product-chips">
              ${PRODUCT_CARD_META[p.slug].chips.map(c => `<span class="shop-product-chip">${chipSvg(c.icon)}${c.label}</span>`).join('')}
            </div>` : ''}
            ${p.activeBatch ? `<div class="batch-production-bar"><span><span style="display:block">${SHOP_STR.batchInProgress(p.activeBatch.serija_alc)}</span>${predvidenoDatum(p.activeBatch.datum, p.activeBatch.predviden_zakljucek) ? `<span style="display:block;font-weight:500;text-transform:none;letter-spacing:0;opacity:.7">${SHOP_STR.expectedFill} ${predvidenoDatum(p.activeBatch.datum, p.activeBatch.predviden_zakljucek)}</span>` : ''}</span></div>` : ''}
          </a>
          ${INFO_ARTICLE_LINKS[p.slug] ? `<a class="shop-product-info-link" href="${INFO_ARTICLE_LINKS[p.slug]}">${SHOP_STR.infoLink}</a>` : ''}

          <div class="shop-product-foot">

            ${p.variants.length > 1 ? `
            <div class="shop-product-variants">
              ${alcVariant ? `<button class="variant-btn is-active" data-variant-btn="alc" type="button">${SHOP_STR.alc}</button>` : ''}
              ${glyVariant ? `<button class="variant-btn${!alcVariant ? ' is-active' : ''}" data-variant-btn="gly" type="button">${SHOP_STR.gly}</button>` : ''}
            </div>` : ''}

            <div class="shop-product-price-row">
              <div data-price-wrap>${priceHtml(defaultVariant)}</div>
              <div data-stock-wrap>${stockBadge(defaultVariant)}</div>
            </div>

            <button class="gm-btn gm-btn--primary shop-add-btn" type="button" data-add-to-cart
              data-slug="${p.slug}" data-name="${p.name}"
              data-variant="${defaultVariant.type}" data-variant-label="${defaultVariant.name}"
              data-price="${discPrice.toFixed(2)}" data-sku="${defaultVariant.sku || ''}"
              data-image="${p.image || ''}"
              ${!defaultVariant.in_stock ? 'disabled' : ''}>
              ${defaultVariant.in_stock ? SHOP_STR.add : SHOP_STR.outOfStock}
            </button>

          </div>

        </div>

      </article>`;
  }).join('');

  bindVariantPickers(products);
  // GA4 - view_item_list
  if (typeof gmViewItemList === 'function') gmViewItemList(products);
}

// ── Variant picker ────────────────────────────────────────
function bindVariantPickers(products) {
  document.querySelectorAll('[data-product-card]').forEach(card => {
    const product = products.find(p => p.id === card.dataset.productCard);
    if (!product) return;
    const btns = card.querySelectorAll('[data-variant-btn]');

    function setVariant(type) {
      const v = product.variants.find(v => v.type === type);
      if (!v) return;

      btns.forEach(b => b.classList.toggle('is-active', b.dataset.variantBtn === type));

      const discPrice = v.discount_pct > 0 ? v.price_malo * (1 - v.discount_pct / 100) : v.price_malo;

      card.querySelector('[data-price-wrap]').innerHTML = priceHtml(v);
      card.querySelector('[data-stock-wrap]').innerHTML = stockBadge(v);

      const addBtn = card.querySelector('[data-add-to-cart]');
      if (addBtn) {
        addBtn.dataset.variant = type;
        addBtn.dataset.variantLabel = v.name;
        addBtn.dataset.price = discPrice.toFixed(2);
        addBtn.dataset.originalPrice = v.price_malo.toFixed(2);
        addBtn.dataset.discountPct = v.discount_pct || 0;
        addBtn.dataset.sku = v.sku || '';
        addBtn.disabled = !v.in_stock;
        addBtn.textContent = v.in_stock ? SHOP_STR.add : SHOP_STR.outOfStock;
      }

      // Badge — poišči obstoječega (statičnega ali dinamičnega), ne ustvari duplikata
      let badge = card.querySelector('.gm-discount-badge');
      if (!badge && v.discount_pct > 0) {
        badge = document.createElement('span');
        badge.className = 'gm-discount-badge';
        const imgWrap = card.querySelector('.shop-product-image');
        if (imgWrap) imgWrap.appendChild(badge);
        else card.appendChild(badge);
      }
      if (badge) {
        badge.textContent = `−${v.discount_pct}%`;
        badge.style.display = v.discount_pct > 0 ? '' : 'none';
      }

      // Zamenjaj sliko kartice glede na različico (ce obstaja -gly-shop verzija)
      if (product.image) {
        const imgEl = card.querySelector('.shop-product-image img');
        if (imgEl) {
          const base = product.image.replace(/\.webp$/, '');
          const variantImg = type === 'gly' ? `${base}-gly-shop.webp` : `${base}-shop.webp`;
          const fallbackImg = `${base}-shop.webp`;
          imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = fallbackImg; };
          imgEl.src = variantImg;
        }
      }
    }

    btns.forEach(b => b.addEventListener('click', () => setVariant(b.dataset.variantBtn)));

    // Celotna kartica klikabilna → produktna stran
    const detailUrl = card.querySelector('.shop-product-img-link')?.getAttribute('href');
    if (detailUrl && detailUrl !== SHOP_HOME) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', e => {
        if (e.target.closest('button, a')) return;
        window.location.href = detailUrl;
      });
    }
  });
}

// ── Init ──────────────────────────────────────────────────
// GA4 - add_to_cart ob kliku na gumb
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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadSettings();
    const products = await loadProducts();
    renderShopGrid(products);
    renderActiveDiscountBanner();
  } catch(e) {
    console.error('Shop error:', e);
  }
});
