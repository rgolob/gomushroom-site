const CART_KEY = "gomushroom_cart";

// ── GA4: počakaj, da je sledenje res pripravljeno ─────────
// site-footer.js analytics.js (gm* funkcije) doda v DOM takoj, gtag pa nastane
// šele prek verige ga-dev-toggle.js → onload → cookie-consent.js. Klicatelji,
// ki event sprožijo takoj po odgovoru Supabase (view_item_list, view_item,
// view_cart), zato pogosto zadenejo trenutek, ko eno od obojega še ne obstaja -
// gmTrack() event tiho zavrže in v GA4 ga sploh ni.
// cart.js je naložen na vseh straneh trgovine (SL in EN), zato pomočnik živi tu.
function gmTrackingReady(fnName) {
  return typeof window[fnName] === 'function' && typeof window.gtag === 'function';
}
function gmWhenTracking(fnName, timeoutMs = 3000, intervalMs = 100) {
  return new Promise(resolve => {
    if (gmTrackingReady(fnName)) return resolve(true);
    const start = Date.now();
    const timer = setInterval(() => {
      const ready = gmTrackingReady(fnName);
      if (ready || Date.now() - start > timeoutMs) {
        clearInterval(timer);
        resolve(ready);
      }
    }, intervalMs);
  });
}

const CART_LANG = document.documentElement.lang === 'en' ? 'en' : 'sl';
const CART_HOME = CART_LANG === 'en' ? '/en/shop/cart/' : '/trgovina/kosarica/';
const CART_STR = CART_LANG === 'en'
  ? { added: (name) => `✓ ${name} added`, addedShort: '✓ Added to cart', cartLink: 'Cart →' }
  : { added: (name) => `✓ ${name} dodano`, addedShort: '✓ Dodano v košarico', cartLink: 'Košarica →' };

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
  window.dispatchEvent(new Event("cart:updated"));
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString(CART_LANG === 'en' ? 'en-IE' : 'sl-SI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
}

// ── Prag brezplačne poštnine ──────────────────────────────
// Za tujino velja svoj prag (brezplacnaPosninaOdTujina), blagajna to upošteva,
// trgovina in košarica pa sta doslej izpisovali samo domačega — tujemu kupcu je
// stran obljubljala brezplačno dostavo pri znesku, pri katerem je ne dobi.
//
// Države na teh dveh straneh ne poznamo; kupec jo izbere šele na blagajni. Zato
// izpišemo oba praga: en sam bi bil za polovico kupcev napačen. Če v tujino
// poštnine sploh ne zaračunavamo, prag tam ničesar ne pomeni in ga izpustimo.
// cart.js je naložen na vseh straneh trgovine (SL in EN), zato pravilo živi tu.
function pragiPostnine(settings) {
  const pragDoma = Number(settings?.brezplacnaPosninaOd) || 0;
  const pragTujina = Number(settings?.brezplacnaPosninaOdTujina) || pragDoma;
  const cenaTujina = Number(settings?.postninaTujina) || 0;
  return {
    doma: pragDoma,
    tujina: pragTujina,
    // Prag za tujino povemo samo takrat, ko tam poštnino sploh zaračunamo in se
    // od domačega razlikuje.
    lociVelja: pragDoma > 0 && cenaTujina > 0 && pragTujina !== pragDoma,
  };
}

function besediloBrezplacnePostnine(settings, lang) {
  const p = pragiPostnine(settings);
  if (!p.doma) return '';
  const en = lang === 'en';
  if (!p.lociVelja) {
    return en
      ? `Free shipping over <strong>${formatPrice(p.doma)}</strong>`
      : `Brezplačna dostava nad <strong>${formatPrice(p.doma)}</strong>`;
  }
  return en
    ? `Free shipping over <strong>${formatPrice(p.doma)}</strong> in Slovenia, <strong>${formatPrice(p.tujina)}</strong> abroad`
    : `Brezplačna dostava nad <strong>${formatPrice(p.doma)}</strong> v Sloveniji, <strong>${formatPrice(p.tujina)}</strong> v tujino`;
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
      originalPrice: Number(item.originalPrice || item.price || 0),
      discountPct: Number(item.discountPct || 0),
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
    originalPrice: Number(button.dataset.originalPrice || button.dataset.price),
    discountPct: Number(button.dataset.discountPct || 0),
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
  button.textContent = CART_STR.addedShort;
  button.disabled = true;

  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 2000);

  showCartToast(item.name);
}

function showCartToast(name) {
  let toast = document.getElementById('gm-cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gm-cart-toast';
    toast.innerHTML = `<span class="gm-toast-msg"></span><a href="${CART_HOME}" class="gm-toast-btn">${CART_STR.cartLink}</a>`;
    document.body.appendChild(toast);
  }
  toast.querySelector('.gm-toast-msg').textContent = CART_STR.added(name);
  toast.classList.remove('gm-toast-show');
  void toast.offsetWidth;
  toast.classList.add('gm-toast-show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('gm-toast-show'), 3000);
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
