(function () {
  const header = document.getElementById("shop-header");
  if (!header) return;

  const navItems = `
    <a href="/">Domov</a>
    <a href="/znanje/">Znanje</a>
    <a href="/qc/tezke-kovine/">Kakovost</a>
    <a href="/trgovina/">Trgovina</a>
  `;

  function getCartCount() {
    const possibleKeys = ["cart", "gomushroom_cart", "gm_cart"];
    for (const key of possibleKeys) {
      const rawCart = localStorage.getItem(key);
      if (!rawCart) continue;
      try {
        const cart = JSON.parse(rawCart);
        if (Array.isArray(cart)) {
          return cart.reduce((sum, item) => sum + Number(item.quantity || item.qty || 1), 0);
        }
        if (cart && Array.isArray(cart.items)) {
          return cart.items.reduce((sum, item) => sum + Number(item.quantity || item.qty || 1), 0);
        }
      } catch (e) {}
    }
    return 0;
  }

  // Inject header immediately — #shop-header is already in DOM at this point
  header.innerHTML = `
    <div class="wrap nav">
      <div class="brand">
        <a href="/" id="site-logo" class="brand">
          <img src="/assets/logo-horizontal-320.webp"
               srcset="/assets/logo-horizontal-320.webp 1x, /assets/logo-horizontal.webp 2x"
               alt="GoMushroom" width="84" height="42" fetchpriority="high">
        </a>
      </div>
      <nav id="primary-nav" aria-label="Glavna navigacija">
        ${navItems}
      </nav>
      <div class="nav-actions" aria-label="Košarica in meni">
        <a class="cart-link" href="/trgovina/kosarica/" aria-label="Košarica">
          <svg class="cart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 7h15l-1.5 8.5H8L6 4H3"></path>
            <circle cx="9" cy="20" r="1.5"></circle>
            <circle cx="18" cy="20" r="1.5"></circle>
          </svg>
          <span id="cart-count" class="cart-count" aria-label="Število izdelkov v košarici">0</span>
        </a>
        <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Meni" aria-expanded="false" aria-controls="primary-nav">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Cart count — runs right after inject since elements are now in DOM
  const cartCountEl = document.getElementById("cart-count");

  function updateCartCount() {
    if (!cartCountEl) return;
    const count = getCartCount();
    cartCountEl.textContent = count;
    cartCountEl.classList.toggle("is-empty", count === 0);
    cartCountEl.classList.toggle("has-items", count > 0);
  }

  updateCartCount();
  window.addEventListener("storage", updateCartCount);
  window.addEventListener("cart:updated", updateCartCount);

  const navToggle = document.getElementById("nav-toggle");
  const primaryNav = document.getElementById("primary-nav");
  if (!navToggle || !primaryNav) return;

  const closeMenu = () => {
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  };
  const openMenu = () => {
    header.classList.add("nav-open");
    navToggle.setAttribute("aria-expanded", "true");
  };

  navToggle.addEventListener("click", () => {
    header.classList.contains("nav-open") ? closeMenu() : openMenu();
  });

  primaryNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
})();
