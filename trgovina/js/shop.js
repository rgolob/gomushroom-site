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

function formatPrice(value) {
  return Number(value || 0).toLocaleString('sl-SI', {
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
    aktivni.push({ vrednost: c.vrednost, opis: 'Časovni popust' });
  for (const p of (_settings.popusti || []).filter(p => p.aktiven)) {
    if (p.tip === 'koda') aktivni.push({ vrednost: p.vrednost, opis: `Koda ${p.kod}` });
    if (p.tip === 'kolicina') aktivni.push({ vrednost: p.vrednost, opis: `${p.min}+ kosov` });
    if (p.tip === 'znesek') aktivni.push({ vrednost: p.vrednost, opis: `Nad ${p.min} €` });
  }
  return aktivni;
}

function renderActiveDiscountBanner() {
  const banner = document.getElementById('shop-discount-banner');
  if (!banner) return;
  const aktivni = getAktivniPopusti();
  if (!aktivni.length) { banner.style.display = 'none'; return; }
  const vrstice = aktivni.map(p => {
    if (p.opis.startsWith('Koda')) return `🏷 Koda <strong>${p.opis.replace('Koda ','')}</strong>: −${p.vrednost}%`;
    if (p.opis.includes('+ kosov')) return `📦 Pri nakupu <strong>${p.opis}</strong>: −${p.vrednost}%`;
    if (p.opis.includes('Nad')) return `💰 Pri nakupu <strong>${p.opis}</strong>: −${p.vrednost}%`;
    return `⏰ <strong>${p.opis}</strong>: −${p.vrednost}%`;
  });
  banner.innerHTML = `<div style="background:linear-gradient(135deg,#2b0b39,#4a1a5e);color:#f0ebe3;padding:.75rem 1.25rem;border-radius:10px;margin-bottom:1.5rem">
    <div style="font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#af8455;margin-bottom:.35rem">Trenutne akcije</div>
    ${vrstice.map(v=>`<div style="font-size:.85rem;margin:.15rem 0">${v}</div>`).join('')}
  </div>`;
  banner.style.display = '';
}

// ── Produkti iz Supabase ──────────────────────────────────
async function loadProducts() {
  const [prodRes, varRes, stockRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/gm_products?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_product_variants?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_variant_stock_status?select=*`, { headers: SB_HEADERS })
  ]);
  if (!prodRes.ok || !varRes.ok) throw new Error('Napaka pri nalaganju.');
  const products = await prodRes.json();
  const variants = await varRes.json();
  const stockData = stockRes.ok ? await stockRes.json() : [];

  // Naredi map za hiter dostop: variant_id -> stock_status
  const stockMap = Object.fromEntries(stockData.map(s => [s.variant_id, s]));

  return products.map(p => ({
    ...p,
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
  if (!v.in_stock) return `<span style="color:#c0392b;font-size:.75rem;letter-spacing:.04em">● Ni na zalogi</span>`;
  if (v.low_stock) return `<span style="color:#e67e22;font-size:.75rem;letter-spacing:.04em">● Zadnji kosi</span>`;
  return `<span style="color:#3a6b4a;font-size:.75rem;letter-spacing:.04em">● Na zalogi</span>`;
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
    const detailUrl = p.is_bundle ? null : `/trgovina/${p.slug}-tinktura/`;
    const discPrice = defaultVariant.discount_pct > 0
      ? defaultVariant.price_malo * (1 - defaultVariant.discount_pct / 100)
      : defaultVariant.price_malo;

    return `
      <article class="shop-product" data-product-card="${p.id}">

        ${maxDiscount > 0 ? `<span class="gm-discount-badge">−${maxDiscount}%</span>` : ''}

        <a class="shop-product-link" href="${detailUrl || '/trgovina/'}">
          <picture>
            <img src="${p.image || '/assets/placeholder.webp'}" alt="${p.name}" width="800" height="1000" loading="lazy">
          </picture>
          <div class="shop-product-body">
            ${p.latin ? `<p class="product-species">${p.latin}</p>` : ''}
            <h2>${p.name}</h2>
            <p class="product-desc">${p.excerpt || ''}</p>
          </div>
        </a>

        <div class="shop-product-foot">

          ${p.variants.length > 1 ? `
          <div class="shop-product-variants">
            ${alcVariant ? `<button class="variant-btn is-active" data-variant-btn="alc" type="button">Alkoholna</button>` : ''}
            ${glyVariant ? `<button class="variant-btn${!alcVariant ? ' is-active' : ''}" data-variant-btn="gly" type="button">Brezalkoholna</button>` : ''}
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
            ${defaultVariant.in_stock ? '+ Dodaj v košarico' : 'Ni na zalogi'}
          </button>

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
        addBtn.dataset.sku = v.sku || '';
        addBtn.disabled = !v.in_stock;
        addBtn.textContent = v.in_stock ? '+ Dodaj' : 'Ni na zalogi';
      }

      // Badge
      let badge = card.querySelector('[data-discount-badge]');
      if (!badge && v.discount_pct > 0) {
        badge = document.createElement('span');
        badge.dataset.discountBadge = '';
        badge.style.cssText = 'position:absolute;top:12px;left:12px;z-index:10;background:#2b0b39;color:#af8455;font-size:.75rem;font-weight:700;letter-spacing:.04em;padding:.2rem .6rem;border-radius:999px;pointer-events:none';
        card.appendChild(badge);
      }
      if (badge) {
        badge.textContent = `−${v.discount_pct}%`;
        badge.style.display = v.discount_pct > 0 ? '' : 'none';
      }
    }

    btns.forEach(b => b.addEventListener('click', () => setVariant(b.dataset.variantBtn)));
  });
}

// ── Init ──────────────────────────────────────────────────
// GA4 - add_to_cart ob kliku na gumb
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
    await loadSettings();
    const products = await loadProducts();
    renderShopGrid(products);
    renderActiveDiscountBanner();
  } catch(e) {
    console.error('Shop error:', e);
  }
});
