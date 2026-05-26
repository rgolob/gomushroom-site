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
    return `
      <s style="color:#9a8f82;font-size:1rem;font-weight:400;display:block">${formatPrice(v.price_malo)}</s>
      <span class="price" style="color:#2b0b39">${formatPrice(discPrice)}</span>
      <span style="display:inline-block;margin-left:.5rem;background:#2b0b39;color:#af8455;font-size:.75rem;font-weight:700;padding:.15rem .5rem;border-radius:999px">−${v.discount_pct}%</span>`;
  }
  return `<span class="price">${formatPrice(v.price_malo)}</span>`;
}

async function loadProductVariants() {
  const [prodRes, varRes, stockRes, batchRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/gm_products?slug=eq.${PRODUCT_SLUG}&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_product_variants?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_variant_stock_status?select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_batches?order=date.asc&select=product_id,batch_num,alc_sku,gly_sku`, { headers: SB_HEADERS })
  ]);

  const products = await prodRes.json();
  const product = products[0];
  if (!product) return null;

  const allVariants = await varRes.json();
  const stockData = stockRes.ok ? await stockRes.json() : [];
  const stockMap = Object.fromEntries(stockData.map(s => [s.variant_id, s]));

  const batchData = batchRes.ok ? await batchRes.json() : [];
  const batchBySku = {};
  batchData.forEach(b => {
    if (b.alc_sku && !batchBySku[b.alc_sku]) batchBySku[b.alc_sku] = b.batch_num;
    if (b.gly_sku && !batchBySku[b.gly_sku]) batchBySku[b.gly_sku] = b.batch_num;
  });

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
        low_stock: status === 'low_stock',
        batchNum: batchBySku[v.sku] || ''
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
    if (variantNote) variantNote.textContent = v.type === 'alc' ? 'Alkoholna različica.' : 'Brezalkoholna različica z glicerinom.';

    if (addBtn) {
      addBtn.dataset.variant = v.type;
      addBtn.dataset.variantLabel = v.name;
      addBtn.dataset.price = discPrice.toFixed(2);
      addBtn.dataset.originalPrice = v.price_malo.toFixed(2);
      addBtn.dataset.discountPct = v.discount_pct || 0;
      addBtn.dataset.batchNum = v.batchNum || '';
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

  // GA4 - view_item
  if (typeof gmViewItem === 'function' && product) {
    gmViewItem(product, activeVariant);
  }
}

// GA4 - add_to_cart na produktni strani
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-add-to-cart]');
  if (!btn) return;
  if (typeof gmAddToCart === 'function') {
    gmAddToCart({
      sku: btn.dataset.sku,
      slug: btn.dataset.slug,
      name: btn.dataset.name,
      variant: btn.dataset.variant,
      variantLabel: btn.dataset.variantLabel,
      price: btn.dataset.price,
      quantity: 1,
    });
  }
});

async function loadRatingBadge(slug) {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/gm_reviews?product_id=eq.${slug}&status=eq.approved&select=rating`,
      { headers: SB_HEADERS }
    );
    if (!r.ok) return;
    const rows = await r.json();
    if (!rows.length) return;

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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadProductVariants();
    if (!data) return;
    initProductPage(data.variants, data.product);
    loadRatingBadge(PRODUCT_SLUG);
  } catch(e) {
    console.error('Product page error:', e);
  }
});
