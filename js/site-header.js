document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("site-header");
  if (!header) return;

  const path = window.location.pathname;
  const isEn = path.startsWith("/en/");
  const isShopPage = path.startsWith("/trgovina/");

  const navItems = isEn
    ? `
      <a href="/en/#services">Services</a>
      <a href="/en/#approach">Approach</a>
      <a href="/en/qc/heavy-metals/">Quality</a>
      <a href="/en/#about" id="nav-about" aria-expanded="false" role="button">About</a>
      <a href="/en/#gallery">Gallery</a>
      <a href="/en/#references">References</a>
    `
    : `
      <a href="/#storitve">Storitve</a>
      <a href="/#pristop">Pristop</a>
      <a href="/znanje/">Znanje</a>
      <a href="/qc/tezke-kovine/">Kakovost</a>
      <a href="/trgovina/">Trgovina</a>
      <a href="/#o-meni" id="nav-about" aria-expanded="false" role="button">O&nbsp;meni</a>
      <a href="/#galerija">Galerija</a>
      <a href="/#reference">Reference</a>
    `;

  const homeUrl = isEn ? "/en/" : "/";

  const hashMapSlToEn = {
    "#storitve": "#services",
    "#pristop": "#approach",
    "#o-meni": "#about",
    "#galerija": "#gallery",
    "#reference": "#references"
  };

  const hashMapEnToSl = {
    "#services": "#storitve",
    "#approach": "#pristop",
    "#about": "#o-meni",
    "#gallery": "#galerija",
    "#references": "#reference"
  };

  const pageMapSlToEn = {
    "/qc/tezke-kovine/": "/en/qc/heavy-metals/"
  };

  const pageMapEnToSl = {
    "/en/qc/heavy-metals/": "/qc/tezke-kovine/"
  };

  function getLangUrls() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;

    if (isEn) {
      const translatedPage = pageMapEnToSl[currentPath];
      const translatedHash = hashMapEnToSl[currentHash];

      return {
        slUrl: translatedPage || `/${translatedHash || ""}`,
        enUrl: currentPath + currentHash
      };
    }

    const translatedPage = pageMapSlToEn[currentPath];
    const translatedHash = hashMapSlToEn[currentHash];

    return {
      slUrl: currentPath + currentHash,
      enUrl: translatedPage || `/en/${translatedHash || ""}`
    };
  }

  function getCartCount() {
    const possibleKeys = ["cart", "gomushroom_cart", "gm_cart"];

    for (const key of possibleKeys) {
      const rawCart = localStorage.getItem(key);
      if (!rawCart) continue;

      try {
        const cart = JSON.parse(rawCart);

        if (Array.isArray(cart)) {
          return cart.reduce((sum, item) => {
            return sum + Number(item.quantity || item.qty || 1);
          }, 0);
        }

        if (cart && Array.isArray(cart.items)) {
          return cart.items.reduce((sum, item) => {
            return sum + Number(item.quantity || item.qty || 1);
          }, 0);
        }
      } catch (error) {
        console.warn("Napaka pri branju košarice:", error);
      }
    }

    return 0;
  }

  const { slUrl, enUrl } = getLangUrls();

  const cartAction = isShopPage
    ? `
      <a class="cart-link" href="/trgovina/kosarica/" aria-label="Košarica">
        <svg class="cart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 7h15l-1.5 8.5H8L6 4H3"></path>
          <circle cx="9" cy="20" r="1.5"></circle>
          <circle cx="18" cy="20" r="1.5"></circle>
        </svg>
        <span id="cart-count" class="cart-count" aria-label="Število izdelkov v košarici">0</span>
      </a>
    `
    : "";

  const langSwitch = isShopPage
    ? ""
    : `
      <div class="lang-switch" aria-label="Jezik">
        <a id="lang-sl" class="lang-flag" href="${slUrl}" aria-label="Slovenščina" lang="sl">
          <img class="flag-img" src="/assets/flag-sl-64.webp" alt="Slovenščina" width="34" height="34" loading="lazy">
        </a>

        <a id="lang-en" class="lang-flag" href="${enUrl}" aria-label="English" lang="en">
          <img class="flag-img" src="/assets/flag-uk-64.webp" alt="English" width="34" height="34" loading="lazy">
        </a>
      </div>
    `;

  header.innerHTML = `
    <div class="wrap nav">
      <div class="brand">
        <a href="${homeUrl}" id="site-logo" class="brand">
          <img src="/assets/logo-horizontal.webp" alt="GoMushroom">
        </a>
      </div>

      <nav id="primary-nav" aria-label="Glavna navigacija">
        ${navItems}
      </nav>

      <div class="nav-actions" aria-label="Jezik, košarica in meni">
        ${cartAction}
        ${langSwitch}

        <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Meni" aria-expanded="false" aria-controls="primary-nav">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

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

  if (!isShopPage) {
    const langSl = document.getElementById("lang-sl");
    const langEn = document.getElementById("lang-en");

    const updateLangLinks = () => {
      const urls = getLangUrls();

      if (langSl) langSl.href = urls.slUrl;
      if (langEn) langEn.href = urls.enUrl;
    };

    updateLangLinks();
    window.addEventListener("hashchange", updateLangLinks);
  }

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
    const isOpen = header.classList.contains("nav-open");
    isOpen ? closeMenu() : openMenu();
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
});
