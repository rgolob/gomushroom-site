const PRODUCTS = [
  {
    key: "reishi",
    name: "Reishi tinktura",
    latin: "Ganoderma lucidum",
    image: "/assets/reishi-tinktura.webp",
    description:
      "Tinktura iz lastno pridelanega Reishija, pripravljena skozi lasten ekstrakcijski proces. Poudarek je na surovini, sledljivosti in formulaciji končnega izdelka — brez bližnjic.",
    tagline: "Lastna pridelava · Lasten proces · Majhne serije",
    origin: "Lastna pridelava",
    detailUrl: "/trgovina/reishi-tinktura/",
    variants: {
      alcohol: {
        label: "Alkoholna",
        price: 31.90,
        sku: "REISHI-ALC-50"
      },
      glycerin: {
        label: "Brezalkoholna",
        price: 33.90,
        sku: "REISHI-GLY-50"
      }
    },
    ingredients:
      "Prečiščena voda, etanol / rastlinski glicerin, ekstrakt gobe Ganoderma lucidum, sončnični lecitin, vitamin C.",
    usage:
      "1–2 pipeti dnevno, lahko razredčeno v vodi ali samostojno. Pred uporabo pretresite.",
    warning:
      "Prehransko dopolnilo ni nadomestilo za uravnoteženo prehrano. Priporočenega dnevnega odmerka se ne sme prekoračiti. Hraniti izven dosega otrok."
  },
  {
    key: "chaga",
    name: "Chaga tinktura",
    latin: "Inonotus obliquus",
    image: "/assets/chaga-tinktura.webp",
    description:
      "Tinktura iz Chage iz brezovih gozdov EU / izven EU, pripravljena skozi lasten ekstrakcijski proces. Posebnost izdelka je surovina, njeno poreklo in skrbno vodena formulacija.",
    tagline: "Brezovi gozdovi · Lasten proces · Majhne serije",
    origin: "Brezovi gozdovi EU / izven EU",
    detailUrl: "/trgovina/chaga-tinktura/",
    variants: {
      alcohol: {
        label: "Alkoholna",
        price: 31.90,
        sku: "CHAGA-ALC-50"
      },
      glycerin: {
        label: "Brezalkoholna",
        price: 33.90,
        sku: "CHAGA-GLY-50"
      }
    },
    ingredients:
      "Prečiščena voda, etanol / rastlinski glicerin, ekstrakt gobe Inonotus obliquus, sončnični lecitin, vitamin C.",
    usage:
      "1–2 pipeti dnevno, lahko razredčeno v vodi ali samostojno. Pred uporabo pretresite.",
    warning:
      "Prehransko dopolnilo ni nadomestilo za uravnoteženo prehrano. Priporočenega dnevnega odmerka se ne sme prekoračiti. Hraniti izven dosega otrok."
  },
  {
    key: "bradovec",
    name: "Resasti bradovec",
    latin: "Hericium erinaceus",
    image: "/assets/bradovec-tinktura.webp",
    description:
      "Tinktura iz slovenske surovine iz Pohorske gobarne, pripravljena skozi lasten ekstrakcijski proces. Poudarek je na izvoru, formulaciji in kakovosti končnega izdelka.",
    tagline: "Slovenska surovina · Lasten proces · Majhne serije",
    origin: "Pohorska gobarna, Slovenija",
    detailUrl: "/trgovina/resasti-bradovec-tinktura/",
    variants: {
      alcohol: {
        label: "Alkoholna",
        price: 31.90,
        sku: "BRADO-ALC-50"
      },
      glycerin: {
        label: "Brezalkoholna",
        price: 33.90,
        sku: "BRADO-GLY-50"
      }
    },
    ingredients:
      "Prečiščena voda, etanol / rastlinski glicerin, ekstrakt gobe Hericium erinaceus, sončnični lecitin, vitamin C.",
    usage:
      "1–2 pipeti dnevno, lahko razredčeno v vodi ali samostojno. Pred uporabo pretresite.",
    warning:
      "Prehransko dopolnilo ni nadomestilo za uravnoteženo prehrano. Priporočenega dnevnega odmerka se ne sme prekoračiti. Hraniti izven dosega otrok."
  }
];

function formatPrice(value) {
  return Number(value || 0).toLocaleString("sl-SI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
}

function renderShopGrid() {
  const grid = document.getElementById("shop-grid");
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map((product) => {
    const defaultVariant = product.variants.alcohol;

    return `
      <article class="gm-shop-card" data-product-card="${product.key}">
        <a class="gm-shop-card__image" href="${product.detailUrl}" aria-label="${product.name}">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </a>

        <div class="gm-shop-card__body">
          <div>
            <h2 class="gm-shop-card__title">
              <a href="${product.detailUrl}">${product.name}</a>
            </h2>
            <p class="gm-shop-card__latin">${product.latin}</p>
            <p class="gm-tagline">${product.tagline}</p>
          </div>

          <p class="gm-shop-card__excerpt">${product.description}</p>

          <div class="gm-shop-card__meta">
            <div class="gm-shop-card__meta-row">
              <span>Izvor surovine</span>
              <strong>${product.origin}</strong>
            </div>
          </div>

          <div class="gm-shop-card__variant-picker" role="radiogroup" aria-label="Izbira različice za ${product.name}">
            <button class="gm-variant-btn is-active" type="button" data-card-variant-btn="alcohol">
              Alkoholna
            </button>
            <button class="gm-variant-btn" type="button" data-card-variant-btn="glycerin">
              Brezalkoholna
            </button>
          </div>

          <div>
            <div class="gm-shop-card__price" data-card-price>${formatPrice(defaultVariant.price)}</div>
            <p class="gm-shop-card__price-note" data-card-variant-label>${defaultVariant.label}</p>
            <p class="gm-micro">Na zalogi · Majhna serija</p>
          </div>

          <div class="gm-shop-card__actions">
            <button
              class="gm-btn gm-btn--primary"
              type="button"
              data-add-to-cart
              data-slug="${product.key}"
              data-name="${product.name}"
              data-variant="alcohol"
              data-variant-label="${defaultVariant.label}"
              data-price="${defaultVariant.price}"
              data-sku="${defaultVariant.sku}"
              data-image="${product.image}">
              Dodaj v košarico
            </button>

            <a class="gm-btn gm-btn--secondary" href="${product.detailUrl}">
              Podrobnosti
            </a>
          </div>

          <div class="gm-accordion">
            <div class="gm-acc-item">
              <button class="gm-acc-toggle" type="button">Sestavine</button>
              <div class="gm-acc-content">
                <p>${product.ingredients}</p>
              </div>
            </div>

            <div class="gm-acc-item">
              <button class="gm-acc-toggle" type="button">Način uporabe</button>
              <div class="gm-acc-content">
                <p>${product.usage}</p>
              </div>
            </div>

            <div class="gm-acc-item">
              <button class="gm-acc-toggle" type="button">Opozorila</button>
              <div class="gm-acc-content">
                <p>${product.warning}</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  bindVariantPickers();
  bindAccordions();
}

function bindVariantPickers() {
  document.querySelectorAll("[data-product-card]").forEach((card) => {
    const productKey = card.dataset.productCard;
    const product = PRODUCTS.find((p) => p.key === productKey);
    if (!product) return;

    const priceEl = card.querySelector("[data-card-price]");
    const variantLabelEl = card.querySelector("[data-card-variant-label]");
    const addToCartBtn = card.querySelector("[data-add-to-cart]");
    const variantButtons = card.querySelectorAll("[data-card-variant-btn]");

    function setVariant(variantKey) {
      const variant = product.variants[variantKey];
      if (!variant) return;

      variantButtons.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.cardVariantBtn === variantKey);
      });

      if (priceEl) priceEl.textContent = formatPrice(variant.price);
      if (variantLabelEl) variantLabelEl.textContent = variant.label;

      if (addToCartBtn) {
        addToCartBtn.dataset.variant = variantKey;
        addToCartBtn.dataset.variantLabel = variant.label;
        addToCartBtn.dataset.price = String(variant.price);
        addToCartBtn.dataset.sku = variant.sku;
      }
    }

    variantButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        setVariant(btn.dataset.cardVariantBtn);
      });
    });

    setVariant("alcohol");
  });
}

function bindAccordions() {
  document.querySelectorAll(".gm-acc-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".gm-acc-item");
      if (!item) return;
      item.classList.toggle("open");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderShopGrid();
});
