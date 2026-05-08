// ── GoMushroom Produktna stran ───────────────────────────
// Bere cene, zalogo in popuste iz Supabase

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
const SB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY
};

// Slug produkta — nastavi glede na stran
const PRODUCT_SLUG = 'reishi';

function formatPrice(value) {
  return Number(value || 0).toLocaleString('sl-SI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

function stockLabel(v) {
  if (!v.in_stock) return `<span style="color:#c0392b;font-size:.8rem">● Ni na zalogi</span>`;
  if (v.low_stock) return `<span style="color:#e67e22;font-size:.8rem">● Zadnje kose</span>`;
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

function initProductPage(variants) {
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
  if (typeof gmViewItem === 'function' && data.product) {
    gmViewItem(data.product, activeVariant);
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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadProductVariants();
    if (!data) return;
    initProductPage(data.variants);
  } catch(e) {
    console.error('Product page error:', e);
  }
});
