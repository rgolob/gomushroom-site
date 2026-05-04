// ── GoMushroom Shop ──────────────────────────────────────
// Bere produkte iz Supabase gm_products + gm_product_variants
// ─────────────────────────────────────────────────────────

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
const SB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString('sl-SI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

async function loadProducts() {
  const [prodRes, varRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/gm_products?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_product_variants?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS })
  ]);
  if (!prodRes.ok || !varRes.ok) throw new Error('Napaka pri nalaganju produktov.');
  const products = await prodRes.json();
  const variants = await varRes.json();
  return products.map(p => ({ ...p, variants: variants.filter(v => v.product_id === p.id) }));
}

function formatIngredients(ingredients) {
  if (!ingredients || !ingredients.length) return '—';
  return ingredients.join(', ') + '.';
}

function formatUsage(p) {
  let html = '';
  if (p.usage_intro) html += `<p>${p.usage_intro}</p>`;
  if (p.usage_steps && p.usage_steps.length)
    html += `<ul>${p.usage_steps.map(s => `<li>${s}</li>`).join('')}</ul>`;
  if (p.usage_note) html += `<p><em>${p.usage_note}</em></p>`;
  return html || '<p>—</p>';
}

function formatWarnings(warnings) {
  if (!warnings || !warnings.length) return '<p>—</p>';
  return `<ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul>`;
}

function renderShopGrid(products) {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;

  grid.innerHTML = products.map(p => {
    const alcVariant = p.variants.find(v => v.type === 'alc');
    const discounts = p.variants.map(v => Number(v.discount_pct) || 0);
    const maxDiscount = discounts.length ? Math.max(...discounts) : 0;
    const glyVariant = p.variants.find(v => v.type === 'gly');
    const defaultVariant = alcVariant || glyVariant;
    if (!defaultVariant) return '';
    const detailUrl = p.is_bundle
      ? null
      : `/trgovina/${p.slug}-tinktura/`;

    return `
      <article class="gm-shop-card" data-product-card="${p.id}" data-slug="${p.slug}" style="position:relative">
        ${maxDiscount > 0 ? `<span class="gm-discount-badge" data-discount-badge>−${maxDiscount}%</span>` : ''}
        <a class="gm-shop-card__image" href="${detailUrl || '/trgovina/kosarica/'}" aria-label="${p.name}">
          <img src="${p.image || '/assets/placeholder.webp'}" alt="${p.name}" loading="lazy">
        </a>
        <div class="gm-shop-card__body">
          <div>
            <h2 class="gm-shop-card__title"><a href="${detailUrl}">${p.name}</a></h2>
            ${p.latin ? `<p class="gm-shop-card__latin">${p.latin}</p>` : ''}
            ${p.tagline ? `<p class="gm-tagline">${p.tagline}</p>` : ''}
          </div>
          <p class="gm-shop-card__excerpt">${p.excerpt || ''}</p>
          ${p.origin ? `<div class="gm-shop-card__meta"><div class="gm-shop-card__meta-row"><span>Izvor surovine</span><strong>${p.origin}</strong></div></div>` : ''}
          ${p.variants.length > 1 ? `
          <div class="gm-shop-card__variant-picker" role="radiogroup" aria-label="Izbira različice za ${p.name}">
            ${alcVariant ? `<button class="gm-variant-btn is-active" type="button" data-card-variant-btn="alc">Alkoholna</button>` : ''}
            ${glyVariant ? `<button class="gm-variant-btn${!alcVariant ? ' is-active' : ''}" type="button" data-card-variant-btn="gly">Brezalkoholna</button>` : ''}
          </div>` : ''}
          <div>
            <div class="gm-shop-card__price" data-card-price>${formatPrice(defaultVariant.price_malo)}</div>
            <p class="gm-shop-card__price-note" data-card-variant-label>${defaultVariant.name}</p>
            <p class="gm-micro">Na zalogi · Majhna serija</p>
          </div>
          <div class="gm-shop-card__actions">
            <button class="gm-btn gm-btn--primary" type="button" data-add-to-cart
              data-slug="${p.slug}" data-name="${p.name}"
              data-variant="${defaultVariant.type}" data-variant-label="${defaultVariant.name}"
              data-price="${defaultVariant.price_malo}" data-sku="${defaultVariant.sku}"
              data-image="${p.image || ''}">
              Dodaj v košarico
            </button>
            ${detailUrl ? `<a class="gm-btn gm-btn--secondary" href="${detailUrl}">Podrobnosti</a>` : ''}
          </div>
          <div class="gm-accordion">
            <div class="gm-acc-item">
              <button class="gm-acc-toggle" type="button">Sestavine</button>
              <div class="gm-acc-content"><p data-ingredients-el>${formatIngredients(defaultVariant.ingredients)}</p></div>
            </div>
            <div class="gm-acc-item">
              <button class="gm-acc-toggle" type="button">Način uporabe</button>
              <div class="gm-acc-content">${formatUsage(p)}</div>
            </div>
            <div class="gm-acc-item">
              <button class="gm-acc-toggle" type="button">Opozorila</button>
              <div class="gm-acc-content">${formatWarnings(p.warnings)}</div>
            </div>
          </div>
        </div>
      </article>`;
  }).join('');

  bindVariantPickers(products);
  bindAccordions();
}

function bindVariantPickers(products) {
  document.querySelectorAll('[data-product-card]').forEach(card => {
    const product = products.find(p => p.id === card.dataset.productCard);
    if (!product) return;
    const priceEl = card.querySelector('[data-card-price]');
    const variantLabelEl = card.querySelector('[data-card-variant-label]');
    const addBtn = card.querySelector('[data-add-to-cart]');
    const ingredientsEl = card.querySelector('[data-ingredients-el]');
    const btns = card.querySelectorAll('[data-card-variant-btn]');

    function setVariant(type) {
      const v = product.variants.find(v => v.type === type);
      if (!v) return;
      btns.forEach(b => b.classList.toggle('is-active', b.dataset.cardVariantBtn === type));
      if (priceEl) priceEl.textContent = formatPrice(v.price_malo);
      if (variantLabelEl) variantLabelEl.textContent = v.name;
      if (ingredientsEl) ingredientsEl.textContent = formatIngredients(v.ingredients);
      if (addBtn) {
        addBtn.dataset.variant = type;
        addBtn.dataset.variantLabel = v.name;
        addBtn.dataset.price = String(v.price_malo);
        addBtn.dataset.sku = v.sku;
      }
      // Posodobi badge
      const badge = card.querySelector('[data-discount-badge]');
      const disc = v.discount_pct || 0;
      if (badge) {
        badge.textContent = `−${disc}%`;
        badge.style.display = disc > 0 ? '' : 'none';
      }
    }

    btns.forEach(b => b.addEventListener('click', () => setVariant(b.dataset.cardVariantBtn)));
  });
}

function bindAccordions() {
  document.querySelectorAll('.gm-acc-toggle').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.gm-acc-item')?.classList.toggle('open'));
  });
}

function renderSkeleton() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  grid.innerHTML = [1,2,3].map(() =>
    `<div style="min-height:420px;background:rgba(43,11,57,.04);border-radius:24px"></div>`
  ).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  renderSkeleton();
  try {
    const products = await loadProducts();
    renderShopGrid(products);
  } catch(e) {
    console.error(e);
    const grid = document.getElementById('shop-grid');
    if (grid) grid.innerHTML = '<p style="padding:1rem">Trenutno ni mogoče naložiti produktov.</p>';
  }
});
