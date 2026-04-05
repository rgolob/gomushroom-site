function renderCartPage() {
  const root = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const emptyEl = document.getElementById('cart-empty');

  if (!root || !totalEl || !emptyEl) return;

  const cart = getCart();

  if (!cart.length) {
    root.innerHTML = '';
    totalEl.textContent = formatPrice(0);
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  root.innerHTML = cart.map(item => `
    <article class="gm-cart-item">
      <div class="gm-cart-item__image">
        <img src="${item.image || ''}" alt="${item.title}">
      </div>

      <div class="gm-cart-item__content">
        <h3>${item.title}</h3>
        <p>${item.variantName}</p>
        ${item.volume_ml ? `<p>${item.volume_ml} ml</p>` : ''}
        ${item.label_note ? `<p>${item.label_note}</p>` : ''}
        <p>${formatPrice(item.price)}</p>
      </div>

      <div class="gm-cart-item__controls">
        <label>
          Količina
          <input
            type="number"
            min="1"
            step="1"
            value="${item.qty}"
            data-qty-input="${item.sku}">
        </label>

        <div class="gm-cart-item__subtotal">
          ${formatPrice(item.price * item.qty)}
        </div>

        <button type="button" class="gm-link-btn" data-remove-item="${item.sku}">
          Odstrani
        </button>
      </div>
    </article>
  `).join('');

  totalEl.textContent = formatPrice(getCartTotal());

  document.querySelectorAll('[data-remove-item]').forEach(button => {
    button.addEventListener('click', () => {
      removeFromCart(button.dataset.removeItem);
      renderCartPage();
    });
  });

  document.querySelectorAll('[data-qty-input]').forEach(input => {
    input.addEventListener('change', () => {
      updateQty(input.dataset.qtyInput, input.value);
      renderCartPage();
    });
  });
}

document.addEventListener('DOMContentLoaded', renderCartPage);
