const CART_KEY = "gomushroom_cart";

function getCartPageCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCartPageCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }
}

function formatCartPrice(value) {
  return Number(value || 0).toLocaleString("sl-SI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
}

function renderCartPage() {
  const cart = getCartPageCart();
  const itemsWrap = document.getElementById("cart-items");
  const countEl = document.getElementById("cart-count");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  const checkoutNote = document.getElementById("checkout-note");

  if (!itemsWrap) return;

  if (!cart.length) {
    itemsWrap.innerHTML = `
      <div class="gm-cart-empty">
        Košarica je trenutno prazna.
      </div>
    `;
    if (countEl) countEl.textContent = "0";
    if (totalEl) totalEl.textContent = formatCartPrice(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (checkoutNote) checkoutNote.style.display = "block";
    return;
  }

  const totalCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalPrice = cart.reduce((sum, item) => {
    return sum + (Number(item.price || 0) * Number(item.quantity || 0));
  }, 0);

  itemsWrap.innerHTML = cart.map((item, index) => {
    const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
    const imageMarkup = item.image
      ? `<img src="${item.image}" alt="${item.name}" loading="lazy">`
      : "";

    return `
      <article class="gm-cart-item">
        <div class="gm-cart-item__image">
          ${imageMarkup}
        </div>

        <div class="gm-cart-item__content">
          <h3>${item.name}</h3>
          <p>${item.variantLabel || ""}</p>
          ${item.sku ? `<p>Šifra: ${item.sku}</p>` : ""}
          <p>Cena na kos: ${formatCartPrice(item.price)}</p>
        </div>

        <div class="gm-cart-item__controls">
          <label>
            Količina
            <input
              type="number"
              min="1"
              step="1"
              value="${item.quantity}"
              data-cart-qty
              data-index="${index}"
            >
          </label>

          <div class="gm-cart-item__subtotal">
            ${formatCartPrice(subtotal)}
          </div>

          <button class="gm-link-btn" type="button" data-remove-item data-index="${index}">
            Odstrani
          </button>
        </div>
      </article>
    `;
  }).join("");

  if (countEl) countEl.textContent = String(totalCount);
  if (totalEl) totalEl.textContent = formatCartPrice(totalPrice);
  if (checkoutBtn) checkoutBtn.disabled = false;
  if (checkoutNote) checkoutNote.style.display = "none";
}

function updateCartItemQuantity(index, quantity) {
  const cart = getCartPageCart();
  const safeQty = Math.max(1, Number(quantity || 1));

  if (!cart[index]) return;
  cart[index].quantity = safeQty;
  saveCartPageCart(cart);
  renderCartPage();
}

function removeCartItem(index) {
  const cart = getCartPageCart();
  if (!cart[index]) return;

  cart.splice(index, 1);
  saveCartPageCart(cart);
  renderCartPage();
}

document.addEventListener("change", (event) => {
  const input = event.target.closest("[data-cart-qty]");
  if (!input) return;

  const index = Number(input.dataset.index);
  updateCartItemQuantity(index, input.value);
});

document.addEventListener("click", (event) => {
  const removeBtn = event.target.closest("[data-remove-item]");
  if (removeBtn) {
    const index = Number(removeBtn.dataset.index);
    removeCartItem(index);
    return;
  }

  const checkoutBtn = event.target.closest("#checkout-btn");
  if (checkoutBtn) {
    const cart = getCartPageCart();
    if (!cart.length) return;

    alert("Naslednji korak je povezava na Stripe Checkout.");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  renderCartPage();
});
