async function loadShop() {
  const root = document.getElementById('shop-grid');
  if (!root) return;

  try {
    const response = await fetch('/trgovina/data/products.json');
    if (!response.ok) {
      throw new Error('Napaka pri nalaganju products.json');
    }

    const data = await response.json();
    const products = (data.products || []).filter(product => product.active);

    if (!products.length) {
      root.innerHTML = '<p>Trenutno ni aktivnih produktov.</p>';
      return;
    }

    root.innerHTML = products.map(product => {
      const prices = (product.variants || []).map(v => Number(v.price)).filter(v => !Number.isNaN(v));
      const minPrice = prices.length ? Math.min(...prices) : 0;

      return `
        <article class="gm-shop-card">
          <a class="gm-shop-card__image" href="/trgovina/izdelek/?slug=${encodeURIComponent(product.slug)}">
            <img src="${product.image || ''}" alt="${product.title}">
          </a>

          <div class="gm-shop-card__body">
            <h3 class="gm-shop-card__title">
              <a href="/trgovina/izdelek/?slug=${encodeURIComponent(product.slug)}">${product.title}</a>
            </h3>

            <p class="gm-shop-card__excerpt">${product.excerpt || ''}</p>

            <div class="gm-shop-card__meta">
              <span class="gm-shop-card__price">od ${formatPrice(minPrice)}</span>
            </div>

            <div class="gm-shop-card__actions">
              <a class="gm-btn gm-btn--primary" href="/trgovina/izdelek/?slug=${encodeURIComponent(product.slug)}">
                Poglej izdelek
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  } catch (error) {
    console.error(error);
    root.innerHTML = '<p>Pri nalaganju trgovine je prišlo do napake.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadShop);
