// Deljen XML feed za /meta-feed.xml (SL) in /meta-feed-en.xml (EN).
// Cena, popust (discount_pct) in zaloga se ob vsakem requestu preberejo živo iz
// Supabase (isti podatki, ki jih na strani prikazuje trgovina/js/shop.js) - tu
// ostane le statičen marketinški del (naslov/opis/link/slika) po jeziku.

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
const SB_HEADERS = {
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY,
};

// Izdelki, ki (za zdaj) niso na voljo v EN trgovini - drži v koraku s
// EN_HIDDEN_PRODUCTS v trgovina/js/shop.js.
const EN_HIDDEN_PRODUCTS = ['smrekovi-vrsicki'];

const VARIANT_LABEL = {
  alc: { sl: 'Alkoholna', en: 'Alcohol-based' },
  gly: { sl: 'Brezalkoholna', en: 'Alcohol-free' },
};

const PRODUCT_META = {
  reishi: {
    title: { sl: 'Reishi tinktura', en: 'Reishi Tincture' },
    description: {
      sl: 'Reishi tinktura 50 ml iz lastno pridelane gobe Ganoderma lucidum. Trojna ekstrakcija, majhne serije, lastna formulacija in testiran končni izdelek.',
      en: 'Reishi tincture 50 ml made from our own cultivated Ganoderma lucidum. Triple extraction, small batches, our own formulation and a tested final product.',
    },
    link: {
      sl: 'https://gomushroom.si/trgovina/reishi-tinktura/',
      en: 'https://gomushroom.si/en/shop/reishi-tincture/',
    },
    imageLink: 'https://gomushroom.si/assets/shop/reishi-tinktura-50ml-gomushroom.webp',
  },
  bradovec: {
    title: { sl: 'Resasti bradovec tinktura', en: "Lion's Mane Tincture" },
    description: {
      sl: 'Resasti bradovec tinktura GoMushroom. Slovenska surovina iz Pohorske gobarne, lasten ekstrakcijski proces, majhne serije in transparenten pristop do kakovosti.',
      en: "GoMushroom Lion's Mane tincture. Slovenian raw material from Pohorska gobarna, our own extraction process, small batches and a transparent approach to quality.",
    },
    link: {
      sl: 'https://gomushroom.si/trgovina/resasti-bradovec-tinktura/',
      en: 'https://gomushroom.si/en/shop/lions-mane-tincture/',
    },
    imageLink: 'https://gomushroom.si/assets/shop/resasti-bradovec-tinktura-50ml-gomushroom.webp',
  },
  chaga: {
    title: { sl: 'Chaga tinktura', en: 'Chaga Tincture' },
    description: {
      sl: 'Chaga tinktura GoMushroom. Surovina iz brezovih gozdov EU/izven EU, lasten ekstrakcijski proces, majhne serije in transparenten pristop do kakovosti.',
      en: 'GoMushroom Chaga tincture. Raw material from EU/non-EU birch forests, our own extraction process, small batches and a transparent approach to quality.',
    },
    link: {
      sl: 'https://gomushroom.si/trgovina/chaga-tinktura/',
      en: 'https://gomushroom.si/en/shop/chaga-tincture/',
    },
    imageLink: 'https://gomushroom.si/assets/shop/chaga-tinktura-50ml-gomushroom.webp',
  },
  'smrekovi-vrsicki': {
    title: { sl: 'Smrekovi vršički tinktura', en: 'Spruce Bud Tincture' },
    description: {
      sl: 'Sezonski ekstrakt smrekovih vršičkov iz alkoholno-vodne ekstrakcije in vakuumskega koncentriranja. Naravni terpeni, fenolne spojine, vitamin C. Alkoholna ali brezalkoholna različica.',
      en: 'Seasonal spruce bud extract made through alcohol-water extraction and vacuum concentration. Natural terpenes, phenolic compounds, vitamin C. Alcohol-based or alcohol-free version.',
    },
    link: {
      sl: 'https://gomushroom.si/trgovina/smrekovi-vrsicki-tinktura/',
      en: 'https://gomushroom.si/en/shop/spruce-bud-tincture/',
    },
    imageLink: 'https://gomushroom.si/assets/shop/smrekovi-vrsicki-tinktura-50ml-gomushroom.webp',
  },
};

// ── Živi podatki iz Supabase (cena, popust, zaloga) ──────────────────────────

// Varnostna zaloga pomeni "nizka zaloga", ne "ni na zalogi": dokler je na voljo
// vsaj en kos, izdelek v feedu ostane razpolozljiv. Status iz baze upostevamo le,
// kadar kolicine ni.
function gmInStock(stock) {
  const qty = Number(stock && stock.qty_available);
  if (Number.isFinite(qty)) return qty > 0;
  return ((stock && stock.stock_status) || 'in_stock') !== 'out_of_stock';
}

async function fetchLiveProducts() {
  const [prodRes, varRes, stockRes] = await Promise.all([
    fetch(`${SB_URL}/rest/v1/gm_products?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_product_variants?active=eq.true&order=sort_order.asc&select=*`, { headers: SB_HEADERS }),
    fetch(`${SB_URL}/rest/v1/gm_variant_stock_status?select=*`, { headers: SB_HEADERS }),
  ]);
  if (!prodRes.ok || !varRes.ok) throw new Error('Napaka pri nalaganju izdelkov iz Supabase.');
  const products = await prodRes.json();
  const variants = await varRes.json();
  const stockData = stockRes.ok ? await stockRes.json() : [];
  const stockMap = Object.fromEntries(stockData.map(s => [s.variant_id, s]));

  return products
    .filter(p => PRODUCT_META[p.slug])
    .map(p => ({
      slug: p.slug,
      variants: variants
        .filter(v => v.product_id === p.id)
        .map(v => {
          const stock = stockMap[v.id] || {};
          return {
            type: v.type,
            sku: v.sku || '',
            price_malo: Number(v.price_malo) || 0,
            discount_pct: Number(v.discount_pct) || 0,
            in_stock: gmInStock(stock),
          };
        }),
    }));
}

// ── XML helpers ──────────────────────────────────────────────────────────────

export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildItem(meta, product, variant, lang) {
  const variantLabel = VARIANT_LABEL[variant.type]?.[lang] || variant.type;
  const title = `${meta.title[lang]} - ${variantLabel} 50 ml`;
  const productType = lang === 'en' ? 'Medicinal Mushrooms &gt; Tinctures' : 'Medicinske gobe &gt; Tinkture';
  const price = variant.price_malo.toFixed(2);
  const salePrice = variant.discount_pct > 0
    ? (variant.price_malo * (1 - variant.discount_pct / 100)).toFixed(2)
    : null;

  const lines = [
    `    <item>`,
    `      <g:id>${esc(variant.sku)}</g:id>`,
    `      <g:item_group_id>${esc(product.slug)}</g:item_group_id>`,
    `      <g:title>${esc(title)}</g:title>`,
    `      <g:description>${esc(meta.description[lang])}</g:description>`,
    `      <g:link>${esc(meta.link[lang])}</g:link>`,
    `      <g:image_link>${esc(meta.imageLink)}</g:image_link>`,
    `      <g:availability>${variant.in_stock ? 'in stock' : 'out of stock'}</g:availability>`,
    `      <g:price>${price} EUR</g:price>`,
  ];

  if (salePrice) {
    lines.push(`      <g:sale_price>${salePrice} EUR</g:sale_price>`);
  }

  lines.push(`      <g:condition>new</g:condition>`);
  lines.push(`      <g:brand>GoMushroom</g:brand>`);
  lines.push(`      <g:mpn>${esc(variant.sku)}</g:mpn>`);
  lines.push(`      <g:product_type>${productType}</g:product_type>`);
  lines.push(`      <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Nutrition &gt; Vitamins &amp; Supplements</g:google_product_category>`);
  lines.push(`      <g:identifier_exists>false</g:identifier_exists>`);
  lines.push(`    </item>`);

  return lines.join('\n');
}

export async function buildFeed(lang) {
  const liveProducts = await fetchLiveProducts();
  const items = liveProducts
    .filter(p => lang !== 'en' || !EN_HIDDEN_PRODUCTS.includes(p.slug))
    .flatMap(p => {
      const meta = PRODUCT_META[p.slug];
      if (!meta.link[lang]) return [];
      return p.variants
        .filter(v => v.sku)
        .map(v => buildItem(meta, p, v, lang));
    });

  const title = lang === 'en' ? 'GoMushroom (EN)' : 'GoMushroom';
  const description = lang === 'en' ? 'GoMushroom product feed (English)' : 'GoMushroom product feed';
  const link = lang === 'en' ? 'https://gomushroom.si/en/shop/' : 'https://gomushroom.si/';
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    `  <channel>`,
    `    <title>${esc(title)}</title>`,
    `    <link>${esc(link)}</link>`,
    `    <description>${esc(description)}</description>`,
    ...items,
    `  </channel>`,
    `</rss>`,
  ].join('\n');
}
