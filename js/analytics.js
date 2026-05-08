// ── GoMushroom GA4 E-commerce Tracking ───────────────────
// Pošilja standardne GA4 ecommerce evente
// Zahteva: cookie-consent.js mora biti naložen pred tem

const GM_GA_ID = 'G-L2PGE7VDHB';

// Varno pokliče gtag samo če obstaja in je GA naložen
function gmTrack(eventName, params = {}) {
  if (typeof gtag !== 'function') return;
  if (localStorage.getItem('gm_cookie_consent') !== 'all') return;
  gtag('event', eventName, params);
}

// ── Pomočne funkcije ──────────────────────────────────────
function gmCartToItems(cart) {
  return cart.map((item, index) => ({
    item_id: item.sku || item.slug,
    item_name: item.name,
    item_variant: item.variantLabel || item.variant,
    item_category: 'Tinkture',
    price: Number(item.price) || 0,
    quantity: item.quantity || 1,
    index,
  }));
}

function gmProductToItem(product, variant, index = 0) {
  return {
    item_id: variant.sku || product.slug,
    item_name: product.name,
    item_variant: variant.name || variant.type,
    item_category: 'Tinkture',
    price: Number(variant.price_malo) || 0,
    quantity: 1,
    index,
  };
}

// ── VIEW ITEM LIST (shop grid) ────────────────────────────
// Pokliči ko se shop grid naloži
function gmViewItemList(products) {
  if (!products?.length) return;
  gmTrack('view_item_list', {
    item_list_id: 'shop_grid',
    item_list_name: 'Trgovina',
    items: products.flatMap((p, pi) =>
      (p.variants || []).slice(0, 1).map(v => gmProductToItem(p, v, pi))
    )
  });
}

// ── VIEW ITEM (produktna stran) ───────────────────────────
function gmViewItem(product, variant) {
  if (!product || !variant) return;
  gmTrack('view_item', {
    currency: 'EUR',
    value: Number(variant.price_malo) || 0,
    items: [gmProductToItem(product, variant)]
  });
}

// ── SELECT ITEM (varianta picker) ────────────────────────
function gmSelectItem(product, variant) {
  if (!product || !variant) return;
  gmTrack('select_item', {
    item_list_id: 'shop_grid',
    item_list_name: 'Trgovina',
    items: [gmProductToItem(product, variant)]
  });
}

// ── ADD TO CART ───────────────────────────────────────────
function gmAddToCart(item) {
  if (!item) return;
  gmTrack('add_to_cart', {
    currency: 'EUR',
    value: Number(item.price) * (item.quantity || 1),
    items: [{
      item_id: item.sku || item.slug,
      item_name: item.name,
      item_variant: item.variantLabel || item.variant,
      item_category: 'Tinkture',
      price: Number(item.price) || 0,
      quantity: item.quantity || 1,
    }]
  });
}

// ── REMOVE FROM CART ──────────────────────────────────────
function gmRemoveFromCart(item) {
  if (!item) return;
  gmTrack('remove_from_cart', {
    currency: 'EUR',
    value: Number(item.price) * (item.quantity || 1),
    items: [{
      item_id: item.sku || item.slug,
      item_name: item.name,
      item_variant: item.variantLabel || item.variant,
      item_category: 'Tinkture',
      price: Number(item.price) || 0,
      quantity: item.quantity || 1,
    }]
  });
}

// ── VIEW CART ─────────────────────────────────────────────
function gmViewCart(cart, total) {
  if (!cart?.length) return;
  gmTrack('view_cart', {
    currency: 'EUR',
    value: Number(total) || 0,
    items: gmCartToItems(cart)
  });
}

// ── BEGIN CHECKOUT ────────────────────────────────────────
function gmBeginCheckout(cart, total, coupon) {
  if (!cart?.length) return;
  gmTrack('begin_checkout', {
    currency: 'EUR',
    value: Number(total) || 0,
    coupon: coupon || undefined,
    items: gmCartToItems(cart)
  });
}

// ── ADD PAYMENT INFO ──────────────────────────────────────
function gmAddPaymentInfo(cart, total, coupon) {
  if (!cart?.length) return;
  gmTrack('add_payment_info', {
    currency: 'EUR',
    value: Number(total) || 0,
    payment_type: 'Bank Transfer',
    coupon: coupon || undefined,
    items: gmCartToItems(cart)
  });
}

// ── PURCHASE ──────────────────────────────────────────────
function gmPurchase(orderId, cart, total, shipping, discount, coupon) {
  if (!cart?.length) return;
  gmTrack('purchase', {
    transaction_id: String(orderId).substring(0, 16),
    currency: 'EUR',
    value: Number(total) || 0,
    shipping: Number(shipping) || 0,
    discount: Number(discount) || 0,
    coupon: coupon || undefined,
    items: gmCartToItems(cart)
  });
}

// ── AUTO-BIND: košarica stran ─────────────────────────────
// Pokliči na kosarica/index.html ob zagonu
function gmInitCartPage() {
  const cart = JSON.parse(localStorage.getItem('gomushroom_cart') || '[]');
  if (!cart.length) return;
  const total = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  gmViewCart(cart, total);
}

// ── AUTO-BIND: blagajna stran ─────────────────────────────
function gmInitCheckoutPage() {
  const cart = JSON.parse(localStorage.getItem('gomushroom_cart') || '[]');
  if (!cart.length) return;
  const total = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const coupon = sessionStorage.getItem('gm_kupon') || '';
  gmBeginCheckout(cart, total, coupon);
}
