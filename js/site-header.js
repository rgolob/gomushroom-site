document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("site-header");
  if (!header) return;

  const path = window.location.pathname;
  const isEn = path.startsWith("/en/");
  const showCart = path.startsWith("/trgovina/") || path.startsWith("/en/shop/");

  const navItems = isEn
    ? `
      <a href="/en/learn/">Learn</a>
      <a href="/en/qc/heavy-metals/">Quality</a>
      <a href="/en/#services">Services</a>
      <a href="/en/#about" id="nav-about" aria-expanded="false" role="button">About</a>
      <a href="/en/shop/">Shop</a>
    `
    : `
      <a href="/znanje/">Znanje</a>
      <a href="/qc/tezke-kovine/">Kakovost</a>
      <a href="/#storitve">Storitve</a>
      <a href="/#o-meni" id="nav-about" aria-expanded="false" role="button">O&nbsp;meni</a>
      <a href="/trgovina/">Trgovina</a>
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
    "/qc/tezke-kovine/": "/en/qc/heavy-metals/",
    "/trgovina/": "/en/shop/",
    "/trgovina/reishi-tinktura/": "/en/shop/reishi-tincture/",
    "/trgovina/chaga-tinktura/": "/en/shop/chaga-tincture/",
    "/trgovina/resasti-bradovec-tinktura/": "/en/shop/lions-mane-tincture/",

    "/storitve/botanicni-ekstrakti/": "/en/services/botanical-extracts/",
    "/storitve/ekstrakcije-medicinskih-gob/": "/en/services/medicinal-mushroom-extraction/",
    "/storitve/gojenje-reishi/": "/en/services/reishi-cultivation/",

    "/znanje/trojna-ekstrakcija/": "/en/learn/triple-extraction/",
    "/znanje/ultrazvocna-ekstrakcija/": "/en/learn/ultrasonic-extraction/",
    "/znanje/vakuumsko-koncentriranje/": "/en/learn/vacuum-concentration/",
    "/znanje/kaj-je-ekstrakcija/": "/en/learn/what-is-extraction/",
    "/znanje/beta-glukani/": "/en/learn/beta-glucans/",
    "/znanje/beta-glukani-medicinske-gobe/": "/en/learn/beta-glucans/",
    "/znanje/ekstrakt-smrekovih-vrsickov/": "/en/learn/spruce-bud-extract/",
    "/znanje/smrekovi-vrsicki-raziskave/": "/en/learn/spruce-bud-research/",
    "/znanje/chaga-raziskave/": "/en/learn/chaga-research/",
    "/znanje/reishi-raziskave/": "/en/learn/reishi-research/",
    "/znanje/resasti-bradovec-raziskave/": "/en/learn/lions-mane-research/"
  };

  const pageMapEnToSl = {
    "/en/qc/heavy-metals/": "/qc/tezke-kovine/",
    "/en/shop/": "/trgovina/",
    "/en/shop/reishi-tincture/": "/trgovina/reishi-tinktura/",
    "/en/shop/chaga-tincture/": "/trgovina/chaga-tinktura/",
    "/en/shop/lions-mane-tincture/": "/trgovina/resasti-bradovec-tinktura/",

    "/en/services/botanical-extracts/": "/storitve/botanicni-ekstrakti/",
    "/en/services/medicinal-mushroom-extraction/": "/storitve/ekstrakcije-medicinskih-gob/",
    "/en/services/reishi-cultivation/": "/storitve/gojenje-reishi/",

    "/en/learn/triple-extraction/": "/znanje/trojna-ekstrakcija/",
    "/en/learn/ultrasonic-extraction/": "/znanje/ultrazvocna-ekstrakcija/",
    "/en/learn/vacuum-concentration/": "/znanje/vakuumsko-koncentriranje/",
    "/en/learn/what-is-extraction/": "/znanje/kaj-je-ekstrakcija/",
    "/en/learn/beta-glucans/": "/znanje/beta-glukani/",
    "/en/learn/spruce-bud-extract/": "/znanje/ekstrakt-smrekovih-vrsickov/",
    "/en/learn/spruce-bud-research/": "/znanje/smrekovi-vrsicki-raziskave/",
    "/en/learn/chaga-research/": "/znanje/chaga-raziskave/",
    "/en/learn/reishi-research/": "/znanje/reishi-raziskave/",
    "/en/learn/lions-mane-research/": "/znanje/resasti-bradovec-raziskave/"
  };

  // Če za trenutno stran ni natančnega prevoda, uskoči na ustrezno rubriko v drugem jeziku.
  function fallbackTranslatedUrl(currentPath, targetIsEn) {
    if (targetIsEn) {
      if (currentPath.startsWith("/znanje/")) return "/en/learn/";
      if (currentPath.startsWith("/storitve/")) return "/en/services/";
      if (currentPath.startsWith("/qc/")) return "/en/qc/heavy-metals/";
      if (currentPath.startsWith("/trgovina/")) return "/en/shop/";
      return "/en/";
    }
    if (currentPath.startsWith("/en/learn/")) return "/znanje/";
    if (currentPath.startsWith("/en/services/")) return "/storitve/";
    if (currentPath.startsWith("/en/qc/")) return "/qc/tezke-kovine/";
    if (currentPath.startsWith("/en/shop/")) return "/trgovina/";
    return "/";
  }

  function getLangUrls() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;

    if (isEn) {
      const translatedPage = pageMapEnToSl[currentPath];
      const translatedHash = hashMapEnToSl[currentHash];

      return {
        slUrl: translatedPage || (translatedHash ? `/${translatedHash}` : fallbackTranslatedUrl(currentPath, false)),
        enUrl: currentPath + currentHash
      };
    }

    const translatedPage = pageMapSlToEn[currentPath];
    const translatedHash = hashMapSlToEn[currentHash];

    return {
      slUrl: currentPath + currentHash,
      enUrl: translatedPage || (translatedHash ? `/en/${translatedHash}` : fallbackTranslatedUrl(currentPath, true))
    };
  }

  const { slUrl, enUrl } = getLangUrls();

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

  const cartHtml = showCart ? `
        <a class="cart-link" href="/trgovina/kosarica/" aria-label="${isEn ? 'Cart' : 'Košarica'}">
          <svg class="cart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 7h15l-1.5 8.5H8L6 4H3"></path>
            <circle cx="9" cy="20" r="1.5"></circle>
            <circle cx="18" cy="20" r="1.5"></circle>
          </svg>
          <span id="cart-count" class="cart-count" aria-label="${isEn ? 'Number of items in cart' : 'Število izdelkov v košarici'}">0</span>
        </a>` : "";

  header.innerHTML = `
    <div class="wrap nav">

      <div class="brand">
        <a href="${homeUrl}" id="site-logo" class="brand">
          <img src="/assets/logo-h168.webp"
               srcset="/assets/logo-h168.webp 168w, /assets/logo-horizontal.webp 1536w"
               sizes="84px"
               alt="GoMushroom" width="84" height="42" fetchpriority="high">
        </a>
      </div>

      <nav id="primary-nav" aria-label="Glavna navigacija">
        ${navItems}
      </nav>

      <div class="nav-actions" aria-label="Jezik in meni">
${cartHtml}
${showCart ? "" : `
        <div class="lang-switch" aria-label="Jezik">

          <a id="lang-sl" class="lang-flag" href="${slUrl}" aria-label="Slovenščina" lang="sl">
            <img class="flag-img" src="/assets/flag-sl-64.webp" alt="Slovenščina" width="34" height="34" loading="lazy">
          </a>

          <a id="lang-en" class="lang-flag" href="${enUrl}" aria-label="English" lang="en">
            <img class="flag-img" src="/assets/flag-uk-64.webp" alt="English" width="34" height="34" loading="lazy">
          </a>

        </div>`}

        <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Meni" aria-expanded="false" aria-controls="primary-nav">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z"></path>
          </svg>
        </button>

      </div>
    </div>
  `;

  const langSl = document.getElementById("lang-sl");
  const langEn = document.getElementById("lang-en");

  const updateLangLinks = () => {
    const urls = getLangUrls();

    if (langSl) langSl.href = urls.slUrl;
    if (langEn) langEn.href = urls.enUrl;
  };

  updateLangLinks();
  window.addEventListener("hashchange", updateLangLinks);

  if (showCart) {
    const cartCountEl = document.getElementById("cart-count");
    const updateCartCount = () => {
      if (!cartCountEl) return;
      const prev = Number(cartCountEl.textContent) || 0;
      const count = getCartCount();
      cartCountEl.textContent = count;
      cartCountEl.classList.toggle("is-empty", count === 0);
      cartCountEl.classList.toggle("has-items", count > 0);
      if (count > prev) {
        cartCountEl.classList.remove("cart-count--pulse");
        void cartCountEl.offsetWidth;
        cartCountEl.classList.add("cart-count--pulse");
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cart:updated", updateCartCount);
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
