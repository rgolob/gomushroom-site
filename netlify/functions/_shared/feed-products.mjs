// Deljen katalog za /meta-feed.xml (SL) in /meta-feed-en.xml (EN).
// Posodobi ta seznam ob spremembi cen, razpoložljivosti ali novih izdelkih -
// cena/zaloga/SKU sta skupna za oba feeda (isti fizični izdelek), title/description/link
// pa sta ločena po jeziku.
// Za popust dodaj varianti: salePrice, salePriceFrom, salePriceTo
// (datum v formatu ISO 8601+tz, npr. "2026-07-01T00:00+02:00/2026-07-31T23:59+02:00")

export const PRODUCTS = [
  {
    id: 'reishi-tinktura',
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
    additionalImageLinks: [],
    brand: 'GoMushroom',
    condition: 'new',
    variants: [
      { sku: 'RE-ALC-50', variantTitle: { sl: 'Alkoholna', en: 'Alcohol-based' }, price: '31.90', availability: 'in stock' },
      { sku: 'RE-GLY-50', variantTitle: { sl: 'Brezalkoholna', en: 'Alcohol-free' }, price: '33.90', availability: 'in stock' },
    ],
  },
  {
    id: 'resasti-bradovec-tinktura',
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
    additionalImageLinks: [],
    brand: 'GoMushroom',
    condition: 'new',
    variants: [
      { sku: 'LM-ALC-50', variantTitle: { sl: 'Alkoholna', en: 'Alcohol-based' }, price: '31.90', availability: 'in stock' },
      { sku: 'LM-GLY-50', variantTitle: { sl: 'Brezalkoholna', en: 'Alcohol-free' }, price: '33.90', availability: 'in stock' },
    ],
  },
  {
    id: 'chaga-tinktura',
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
    additionalImageLinks: [],
    brand: 'GoMushroom',
    condition: 'new',
    variants: [
      { sku: 'CH-ALC-50', variantTitle: { sl: 'Alkoholna', en: 'Alcohol-based' }, price: '31.90', availability: 'in stock' },
      { sku: 'CH-GLY-50', variantTitle: { sl: 'Brezalkoholna', en: 'Alcohol-free' }, price: '33.90', availability: 'in stock' },
    ],
  },
  {
    id: 'smrekovi-vrsicki-tinktura',
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
    additionalImageLinks: [],
    brand: 'GoMushroom',
    condition: 'new',
    variants: [
      { sku: 'SV-ALC-50', variantTitle: { sl: 'Alkoholna', en: 'Alcohol-based' }, price: '31.90', availability: 'in stock' },
      { sku: 'SV-GLY-50', variantTitle: { sl: 'Brezalkoholna', en: 'Alcohol-free' }, price: '33.90', availability: 'in stock' },
    ],
  },
];

// ── XML helpers ──────────────────────────────────────────────────────────────

export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildItem(product, variant, lang) {
  const title = `${product.title[lang]} - ${variant.variantTitle[lang]} 50 ml`;
  const productType = lang === 'en' ? 'Medicinal Mushrooms &gt; Tinctures' : 'Medicinske gobe &gt; Tinkture';
  const lines = [
    `    <item>`,
    `      <g:id>${esc(variant.sku)}</g:id>`,
    `      <g:item_group_id>${esc(product.id)}</g:item_group_id>`,
    `      <g:title>${esc(title)}</g:title>`,
    `      <g:description>${esc(product.description[lang])}</g:description>`,
    `      <g:link>${esc(product.link[lang])}</g:link>`,
    `      <g:image_link>${esc(product.imageLink)}</g:image_link>`,
  ];

  for (const img of (product.additionalImageLinks || [])) {
    lines.push(`      <g:additional_image_link>${esc(img)}</g:additional_image_link>`);
  }

  lines.push(`      <g:availability>${esc(variant.availability)}</g:availability>`);
  lines.push(`      <g:price>${esc(variant.price)} EUR</g:price>`);

  if (variant.salePrice) {
    lines.push(`      <g:sale_price>${esc(variant.salePrice)} EUR</g:sale_price>`);
    if (variant.salePriceFrom && variant.salePriceTo) {
      lines.push(`      <g:sale_price_effective_date>${esc(variant.salePriceFrom)}/${esc(variant.salePriceTo)}</g:sale_price_effective_date>`);
    }
  }

  lines.push(`      <g:condition>${esc(product.condition)}</g:condition>`);
  lines.push(`      <g:brand>${esc(product.brand)}</g:brand>`);
  lines.push(`      <g:mpn>${esc(variant.sku)}</g:mpn>`);
  lines.push(`      <g:product_type>${productType}</g:product_type>`);
  lines.push(`      <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Nutrition &gt; Vitamins &amp; Supplements</g:google_product_category>`);
  lines.push(`      <g:identifier_exists>false</g:identifier_exists>`);
  lines.push(`    </item>`);

  return lines.join('\n');
}

export function buildFeed(lang) {
  const items = PRODUCTS.flatMap(p => p.variants.map(v => buildItem(p, v, lang)));
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
