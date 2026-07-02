// ── GoMushroom Meta Pixel ─────────────────────────────────
// Naloži se samo ko uporabnik sprejme vse piškotke

const FB_PIXEL_ID = '1204751763480900';

(function() {
  if (typeof fbq !== 'undefined') return;
  if (localStorage.getItem('gm_cookie_consent') !== 'all') return;

  !function(f,b,e,v,n,t,s){
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', FB_PIXEL_ID);
  fbq('track', 'PageView');
})();

function gmFbTrack(event, params) {
  if (typeof fbq !== 'function') return;
  if (localStorage.getItem('gm_cookie_consent') !== 'all') return;
  fbq('track', event, params);
}

// ── VIEW CONTENT (produktna stran) ────────────────────────
// variant.sku mora biti enak g:id v XML feedu
function gmFbViewContent(product, variant) {
  if (!product || !variant) return;
  const id = variant.sku || product.slug;
  const basePrice = Number(variant.price_malo) || 0;
  const discPct = Number(variant.discount_pct) || 0;
  const effectivePrice = discPct > 0 ? +(basePrice * (1 - discPct / 100)).toFixed(2) : basePrice;
  gmFbTrack('ViewContent', {
    content_ids:  [id],
    content_name: product.name,
    content_type: 'product',
    contents:     [{ id, quantity: 1, item_price: effectivePrice }],
    value:        effectivePrice,
    currency:     'EUR',
  });
}

// ── ADD TO CART ───────────────────────────────────────────
// item.sku mora biti enak g:id v XML feedu
function gmFbAddToCart(item) {
  if (!item) return;
  const id  = item.sku || item.slug;
  const qty = item.quantity || 1;
  const price = Number(item.price) || 0;
  gmFbTrack('AddToCart', {
    content_ids:  [id],
    content_name: item.name,
    content_type: 'product',
    contents:     [{ id, quantity: qty, item_price: price }],
    value:        +(price * qty).toFixed(2),
    currency:     'EUR',
  });
}

// ── INITIATE CHECKOUT ─────────────────────────────────────
function gmFbInitiateCheckout(cart, total) {
  if (!cart?.length) return;
  gmFbTrack('InitiateCheckout', {
    content_ids:  cart.map(i => i.sku || i.slug),
    content_type: 'product',
    contents:     cart.map(i => ({
      id:         i.sku || i.slug,
      quantity:   i.quantity || 1,
      item_price: Number(i.price) || 0,
    })),
    num_items:    cart.reduce((s, i) => s + (i.quantity || 1), 0),
    value:        Number(total) || 0,
    currency:     'EUR',
  });
}

// ── PURCHASE ──────────────────────────────────────────────
// orderId poveže Pixel Purchase z naročilom (deduplication)
function gmFbPurchase(cart, total, orderId) {
  if (!cart?.length) return;
  const params = {
    content_ids:  cart.map(i => i.sku || i.slug),
    content_type: 'product',
    contents:     cart.map(i => ({
      id:         i.sku || i.slug,
      quantity:   i.quantity || 1,
      item_price: Number(i.price) || 0,
    })),
    num_items:    cart.reduce((s, i) => s + (i.quantity || 1), 0),
    value:        Number(total) || 0,
    currency:     'EUR',
  };
  if (orderId) params.order_id = orderId;
  gmFbTrack('Purchase', params);
}
