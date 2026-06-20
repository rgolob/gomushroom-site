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
function gmFbViewContent(product, variant) {
  if (!product || !variant) return;
  gmFbTrack('ViewContent', {
    content_ids: [variant.sku || product.slug],
    content_name: product.name,
    content_type: 'product',
    value: Number(variant.price_malo) || 0,
    currency: 'EUR'
  });
}

// ── ADD TO CART ───────────────────────────────────────────
function gmFbAddToCart(item) {
  if (!item) return;
  gmFbTrack('AddToCart', {
    content_ids: [item.sku || item.slug],
    content_name: item.name,
    content_type: 'product',
    value: Number(item.price) * (item.quantity || 1),
    currency: 'EUR'
  });
}

// ── INITIATE CHECKOUT ─────────────────────────────────────
function gmFbInitiateCheckout(cart, total) {
  if (!cart?.length) return;
  gmFbTrack('InitiateCheckout', {
    content_ids: cart.map(i => i.sku || i.slug),
    content_type: 'product',
    num_items: cart.reduce((s, i) => s + (i.quantity || 1), 0),
    value: Number(total) || 0,
    currency: 'EUR'
  });
}

// ── PURCHASE ──────────────────────────────────────────────
function gmFbPurchase(cart, total) {
  if (!cart?.length) return;
  gmFbTrack('Purchase', {
    content_ids: cart.map(i => i.sku || i.slug),
    content_type: 'product',
    num_items: cart.reduce((s, i) => s + (i.quantity || 1), 0),
    value: Number(total) || 0,
    currency: 'EUR'
  });
}
