const CART_KEY = "gomushroom_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  document.querySelectorAll("[data-cart-count]").forEach(badge => {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = "inline-flex";
    } else {
      badge.textContent = "";
      badge.style.display = "none";
    }
  });
}

function addToCart(item) {
  const cart = getCart();

  const existing = cart.find(cartItem =>
    cartItem.slug === item.slug &&
    cartItem.variant === item.variant
  );

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }

  saveCart(cart);
}

function handleAddToCartClick(button) {
  const item = {
    slug: button.dataset.slug,
    name: button.dataset.name,
    variant: button.dataset.variant,
    variantLabel: button.dataset.variantLabel,
    price: Number(button.dataset.price),
    sku: button.dataset.sku || "",
    image: button.dataset.image || "",
    quantity: 1
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

document.addEventListener("click", event => {
  const button = event.target.closest("[data-add-to-cart]");
  if (!button) return;

  handleAddToCartClick(button);
});

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
});
