document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("site-header");
  if (!header) return;

  const path = window.location.pathname;
  const isEn = path.startsWith("/en/");

const navItems = isEn
  ? `
    <a href="/en/#services">Services</a>
    <a href="/en//#approach">Approach</a>
    <a href="/en/qc/heavy-metals/">Quality</a>
    <a href="/en//#about" id="nav-about" aria-expanded="false" role="button">About</a>
    <a href="/en//#gallery">Gallery</a>
    <a href="/en//#references">References</a>
  `
  : `
    <a href="#storitve">Storitve</a>
    <a href="#pristop">Pristop</a>
    <a href="/znanje/">Znanje</a>
    <a href="/qc/tezke-kovine/">Kakovost</a>
    <a href="#o-meni" id="nav-about" aria-expanded="false" role="button">O&nbsp;meni</a>
    <a href="#galerija">Galerija</a>
    <a href="#reference">Reference</a>
  `;

  const homeUrl = isEn ? "/en/" : "/";

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

      <div class="nav-actions" aria-label="Jezik in meni">

        <div class="lang-switch" aria-label="Jezik">

          <a class="lang-flag"
             href="/"
             aria-label="Slovenščina"
             lang="sl">

            <img class="flag-img"
                 src="/assets/flag-sl-64.webp"
                 alt="Slovenščina"
                 width="34"
                 height="34"
                 loading="lazy">
          </a>

          <a class="lang-flag"
             href="/en/"
             aria-label="English"
             lang="en">

            <img class="flag-img"
                 src="/assets/flag-uk-64.webp"
                 alt="English"
                 width="34"
                 height="34"
                 loading="lazy">
          </a>

        </div>

        <button class="nav-toggle"
                id="nav-toggle"
                type="button"
                aria-label="Meni"
                aria-expanded="false"
                aria-controls="primary-nav">

          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

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
