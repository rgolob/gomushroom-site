const CART_KEY = 'gomushroom_cart';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Napaka pri branju košarice:', error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(item) {
  const cart = getCart();

  const existing = cart.find(entry => entry.sku === item.sku);

  if (existing) {
    existing.qty += item.qty || 1;
  } else {
    cart.push({
      title: item.title,
      slug: item.slug,
      sku: item.sku,
      variantName: item.variantName,
      variantType: item.variantType,
      price: Number(item.price),
      qty: item.qty || 1,
      image: item.image || '',
      volume_ml: item.volume_ml || null,
      label_note: item.label_note || ''
    });
  }

  saveCart(cart);
}

function removeFromCart(sku) {
  const filtered = getCart().filter(item => item.sku !== sku);
  saveCart(filtered);
}

function updateQty(sku, qty) {
  const cart = getCart();
  const item = cart.find(entry => entry.sku === sku);

  if (!item) return;

  const parsedQty = parseInt(qty, 10);
  item.qty = Number.isNaN(parsedQty) ? 1 : Math.max(1, parsedQty);

  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function formatPrice(value) {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(value) || 0);
}

function updateCartCount() {
  const badges = document.querySelectorAll('[data-cart-count]');
  const count = getCartCount();

  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', updateCartCount);
