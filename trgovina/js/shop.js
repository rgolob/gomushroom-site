const PRODUCTS = [
  {
    name: "Reishi tinktura",
    latin: "Ganoderma lucidum",
    image: "/assets/products/reishi-tinktura.webp",
    description: "Tinktura iz lastno pridelanega Reishija, pripravljena skozi lasten ekstrakcijski proces z jasnim poudarkom na surovini, formulaciji in sledljivosti.",
    origin: "Lastna pridelava",
    priceFrom: 31.90,
    detailUrl: "/trgovina/reishi-tinktura/",
    buyUrl: "/trgovina/reishi-tinktura/#nakup-top"
  },
  {
    name: "Chaga tinktura",
    latin: "Inonotus obliquus",
    image: "/assets/products/chaga-tinktura.webp",
    description: "Tinktura iz Chage iz brezovih gozdov EU/izven EU, pripravljena skozi lasten ekstrakcijski proces in formulirana v majhnih serijah.",
    origin: "Brezovi gozdovi EU / izven EU",
    priceFrom: 31.90,
    detailUrl: "/trgovina/chaga-tinktura/",
    buyUrl: "/trgovina/chaga-tinktura/#nakup-top"
  },
  {
    name: "Resasti bradovec",
    latin: "Hericium erinaceus",
    image: "/assets/products/bradovec-tinktura.webp",
    description: "Tinktura iz slovenske surovine iz Pohorske gobarne, pripravljena skozi lasten ekstrakcijski proces z jasnim poudarkom na izvoru in kakovosti.",
    origin: "Pohorska gobarna, Slovenija",
    priceFrom: 31.90,
    detailUrl: "/trgovina/resasti-bradovec-tinktura/",
    buyUrl: "/trgovina/resasti-bradovec-tinktura/#nakup-top"
  }
];

function formatPrice(value) {
  return value.toLocaleString("sl-SI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
}

function renderShopGrid() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map(product => `
    <article class="gm-shop-card">
      <a class="gm-shop-card__image" href="${product.detailUrl}" aria-label="${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
      </a>

      <div class="gm-shop-card__body">
        <div>
          <h2 class="gm-shop-card__title">
            <a href="${product.detailUrl}">${product.name}</a>
          </h2>
          <p class="gm-shop-card__latin">${product.latin}</p>
        </div>

        <p class="gm-shop-card__excerpt">${product.description}</p>

        <div class="gm-shop-card__meta">
          <div class="gm-shop-card__meta-row">
            <span>Izvor surovine</span>
            <strong>${product.origin}</strong>
          </div>
        </div>

        <div>
          <div class="gm-shop-card__price">od ${formatPrice(product.priceFrom)}</div>
          <p class="gm-shop-card__price-note">alkoholna / brezalkoholna različica</p>
        </div>

        <div class="gm-shop-card__actions">
          <a class="gm-btn gm-btn--primary" href="${product.buyUrl}">
            Kupi
          </a>
          <a class="gm-btn gm-btn--secondary" href="${product.detailUrl}">
            Podrobnosti
          </a>
        </div>
      </div>
    </article>
  `).join("");
}

renderShopGrid();
