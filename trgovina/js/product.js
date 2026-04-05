function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('slug');
}

function renderList(items) {
  if (!items || !items.length) return '<p>Ni podatkov.</p>';
  return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

async function loadProductPage() {
  const root = document.getElementById('product-detail');
  if (!root) return;

  try {
    const slug = getSlugFromUrl();

    if (!slug) {
      root.innerHTML = '<p>Produkt ni določen.</p>';
      return;
    }

    const response = await fetch('/trgovina/data/products.json');
    if (!response.ok) {
      throw new Error('Napaka pri nalaganju products.json');
    }

    const data = await response.json();
    const product = (data.products || []).find(item => item.slug === slug && item.active);

    if (!product) {
      root.innerHTML = '<p>Produkta ni bilo mogoče najti.</p>';
      return;
    }

    const variantButtons = (product.variants || []).map((variant, index) => `
      <button
        type="button"
        class="gm-variant-btn${index === 0 ? ' is-active' : ''}"
        data-variant-index="${index}">
        ${variant.name}
      </button>
    `).join('');

    root.innerHTML = `
      <article class="gm-product-page">
        <div class="gm-product-page__media">
          <img src="${product.image || ''}" alt="${product.title}">
        </div>

        <div class="gm-product-page__content">
          <p class="gm-product-page__eyebrow">GoMushroom trgovina</p>
          <h1>${product.title}</h1>

          ${product.details?.latin_name ? `<p class="gm-product-page__latin"><em>${product.details.latin_name}</em></p>` : ''}
          <p class="gm-product-page__excerpt">${product.excerpt || ''}</p>
          <div class="gm-product-page__description">${product.description || ''}</div>

          <div class="gm-product-page__variants">
            <div class="gm-product-page__label">Izberi varianto</div>
            <div class="gm-variant-list">
              ${variantButtons}
            </div>
          </div>

          <div class="gm-product-page__purchase">
            <div class="gm-product-price" id="selected-price"></div>
            <div class="gm-product-volume" id="selected-volume"></div>
            <div class="gm-product-label-note" id="selected-label-note"></div>

            <div class="gm-product-actions">
              <label class="gm-qty-label">
                Količina
                <input id="product-qty" type="number" min="1" step="1" value="1">
              </label>

              <button id="add-to-cart-btn" class="gm-btn gm-btn--primary" type="button">
                Dodaj v košarico
              </button>
            </div>
          </div>
        </div>
      </article>

      <section class="gm-product-extra">
        <div class="gm-product-section">
          <h2>Sestavine</h2>
          <div id="selected-ingredients"></div>
        </div>

        <div class="gm-product-section">
          <h2>Priporočen način uporabe</h2>
          <div id="usage-protocol"></div>
        </div>

        <div class="gm-product-section">
          <h2>Opozorila</h2>
          <div id="warnings-list"></div>
        </div>

        <div class="gm-product-section">
          <h2>Dodatne informacije</h2>
          <div id="extra-info"></div>
        </div>
      </section>
    `;

    let selectedVariantIndex = 0;

    const priceEl = document.getElementById('selected-price');
    const volumeEl = document.getElementById('selected-volume');
    const labelNoteEl = document.getElementById('selected-label-note');
    const ingredientsEl = document.getElementById('selected-ingredients');
    const usageEl = document.getElementById('usage-protocol');
    const warningsEl = document.getElementById('warnings-list');
    const extraInfoEl = document.getElementById('extra-info');

    function renderUsageProtocol() {
      const usage = product.usage_protocol;

      if (!usage) {
        usageEl.innerHTML = '<p>Ni podatkov.</p>';
        return;
      }

      usageEl.innerHTML = `
        ${usage.intro ? `<p>${usage.intro}</p>` : ''}
        ${usage.steps && usage.steps.length ? `<ul>${usage.steps.map(step => `<li>${step}</li>`).join('')}</ul>` : ''}
        ${usage.note ? `<p>${usage.note}</p>` : ''}
      `;
    }

    function renderWarnings() {
      warningsEl.innerHTML = renderList(product.warnings || []);
    }

    function renderExtraInfo() {
      const details = product.details || {};

      const parts = [];

      if (details.category) {
        parts.push(`<p><strong>Kategorija:</strong> ${details.category}</p>`);
      }

      if (details.source) {
        parts.push(`<p><strong>Izvor:</strong> ${details.source}</p>`);
      }

      if (details.storage) {
        parts.push(`<p><strong>Shranjevanje:</strong> ${details.storage}</p>`);
      }

      if (details.sediment_note) {
        parts.push(`<p><strong>Usedlina:</strong> ${details.sediment_note}</p>`);
      }

      if (details.general_note) {
        parts.push(`<p><strong>Opomba:</strong> ${details.general_note}</p>`);
      }

      if (product.bundle_contents && product.bundle_contents.length) {
        parts.push(`<p><strong>Vsebina kompleta:</strong> ${product.bundle_contents.join(', ')}</p>`);
      }

      extraInfoEl.innerHTML = parts.length ? parts.join('') : '<p>Ni podatkov.</p>';
    }

    function renderSelectedVariant() {
      const variant = product.variants[selectedVariantIndex];

      priceEl.textContent = formatPrice(variant.price);
      volumeEl.textContent = variant.volume_ml ? `${variant.volume_ml} ml` : '';
      labelNoteEl.textContent = variant.label_note || '';
      ingredientsEl.innerHTML = renderList(variant.ingredients || []);
    }

    function syncActiveButtons() {
      document.querySelectorAll('.gm-variant-btn').forEach(btn => {
        btn.classList.remove('is-active');
      });

      const activeBtn = document.querySelector(`[data-variant-index="${selectedVariantIndex}"]`);
      if (activeBtn) {
        activeBtn.classList.add('is-active');
      }
    }

    document.querySelectorAll('.gm-variant-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedVariantIndex = Number(btn.dataset.variantIndex);
        syncActiveButtons();
        renderSelectedVariant();
      });
    });

    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
      const qtyInput = document.getElementById('product-qty');
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      const variant = product.variants[selectedVariantIndex];

      addToCart({
        title: product.title,
        slug: product.slug,
        sku: variant.sku,
        variantName: variant.name,
        variantType: variant.type,
        price: variant.price,
        qty,
        image: product.image,
        volume_ml: variant.volume_ml,
        label_note: variant.label_note
      });

      window.location.href = '/trgovina/kosarica/';
    });

    renderSelectedVariant();
    renderUsageProtocol();
    renderWarnings();
    renderExtraInfo();
    syncActiveButtons();
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p>Pri nalaganju produkta je prišlo do napake.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadProductPage);
