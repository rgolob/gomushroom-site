// /js/article-header.js

const translations = {
  "/znanje/trojna-ekstrakcija/": "/en/learn/triple-extraction/",
  "/en/learn/triple-extraction/": "/znanje/trojna-ekstrakcija/",

  "/znanje/ultrazvocna-ekstrakcija/": "/en/learn/ultrasonic-extraction/",
  "/en/learn/ultrasonic-extraction/": "/znanje/ultrazvocna-ekstrakcija/",

  "/znanje/vakuumsko-koncentriranje/": "/en/learn/vacuum-concentration/",
  "/en/learn/vacuum-concentration/": "/znanje/vakuumsko-koncentriranje/",

  "/znanje/kaj-je-ekstrakcija/": "/en/learn/what-is-extraction/",
  "/en/learn/what-is-extraction/": "/znanje/kaj-je-ekstrakcija/",

  "/znanje/beta-glukani/": "/en/learn/beta-glucans/",
  "/en/learn/beta-glucans/": "/znanje/beta-glukani/"
};

document.addEventListener("DOMContentLoaded", () => {
  const target = document.getElementById("article-header");
  if (!target) return;

  const path = window.location.pathname;
  const isEn = path.startsWith("/en/");

  const homeUrl = isEn ? "/en/" : "/";
  const knowledgeUrl = isEn ? "/en/learn/" : "/znanje/";

  const homeLabel = isEn ? "Home" : "Domov";
  const knowledgeLabel = isEn ? "Learn" : "Znanje";

  const translatedUrl = translations[path];

  const slUrl = isEn ? (translatedUrl || "/znanje/") : path;
  const enUrl = isEn ? path : (translatedUrl || "/en/learn/");

  const shopLink = isEn
    ? ""
    : `<a href="/trgovina/">Trgovina</a>`;

  target.innerHTML = `
    <header class="site-header">
      <div class="wrap header-inner">

        <div class="brand">
          <a href="${homeUrl}" aria-label="GoMushroom domov">
            <img src="/assets/logo-horizontal.webp" alt="GoMushroom">
          </a>
        </div>

        <nav id="primary-nav" aria-label="Glavna navigacija">
          <a href="${homeUrl}">${homeLabel}</a>
          <a href="${knowledgeUrl}">${knowledgeLabel}</a>
          ${shopLink}
        </nav>

        <div class="nav-actions" aria-label="Jezik in meni">
          <div class="lang-switch" aria-label="Izbira jezika">
            <a class="lang-flag" href="${slUrl}" aria-label="Slovenščina" lang="sl">
              <img class="flag-img" src="/assets/flag-sl-64.webp" alt="Slovenščina" width="34" height="34" loading="lazy">
            </a>

            <a class="lang-flag" href="${enUrl}" aria-label="English" lang="en">
              <img class="flag-img" src="/assets/flag-uk-64.webp" alt="English" width="34" height="34" loading="lazy">
            </a>
          </div>
        </div>

      </div>
    </header>
  `;
});
