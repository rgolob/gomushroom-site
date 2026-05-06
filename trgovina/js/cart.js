const CART_KEY = "gomushroom_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    console.warn("Napaka pri branju košarice:", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString("sl-SI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    if (count > 0) {
      badge.textContent = String(count);
      badge.style.display = "inline-flex";
    } else {
      badge.textContent = "";
      badge.style.display = "none";
    }
  });
}

function addToCart(item) {
  const cart = getCart();

  const existing = cart.find((cartItem) =>
    cartItem.slug === item.slug &&
    cartItem.variant === item.variant
  );

  if (existing) {
    existing.quantity += Number(item.quantity || 1);
  } else {
    cart.push({
      slug: item.slug,
      name: item.name,
      variant: item.variant,
      variantLabel: item.variantLabel || "",
      price: Number(item.price || 0),
      sku: item.sku || "",
      image: item.image || "",
      quantity: Number(item.quantity || 1)
    });
  }

  saveCart(cart);
}

function handleAddToCartClick(button) {
  const quantityInput = button
    .closest("[data-product-root]")?.querySelector("[data-qty-input]");

  const quantity = quantityInput ? Math.max(1, Number(quantityInput.value || 1)) : 1;

  const item = {
    slug: button.dataset.slug,
    name: button.dataset.name,
    variant: button.dataset.variant,
    variantLabel: button.dataset.variantLabel,
    price: Number(button.dataset.price),
    sku: button.dataset.sku || "",
    image: button.dataset.image || "",
    quantity
  };

  if (!item.slug || !item.name || !item.variant || !item.price) {
    console.warn("Manjkajo podatki za dodajanje v košarico.", item);
    return;
  }

  addToCart(item);

  const originalText = button.textContent;
  button.textContent = "Dodano";
  button.disabled = true;

  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 900);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-to-cart]");
  if (!button) return;

  handleAddToCartClick(button);
});

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
});

window.addEventListener("pageshow", () => {
  updateCartBadge();
});
