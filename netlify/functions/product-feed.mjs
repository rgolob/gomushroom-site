// Netlify Functions v2 — samodejno servira na /meta-feed.xml

// ── Product catalog ─────────────────────────────────────────────────────────
// Posodobi ta seznam ob spremembi cen, razpoložljivosti ali novih izdelkih.
// Za popust dodaj varianti: salePrice, salePriceFrom, salePriceTo
// (datum v formatu ISO 8601+tz, npr. "2026-07-01T00:00+02:00/2026-07-31T23:59+02:00")
const PRODUCTS = [
  {
    id: 'reishi-tinktura',
    title: 'Reishi tinktura',
    description: 'Reishi tinktura 50 ml iz lastno pridelane gobe Ganoderma lucidum. Trojna ekstrakcija, majhne serije, lastna formulacija in testiran končni izdelek.',
    link: 'https://gomushroom.si/trgovina/reishi-tinktura/',
    imageLink: 'https://gomushroom.si/assets/shop/reishi-tinktura-50ml-gomushroom.webp',
    additionalImageLinks: [],
    brand: 'GoMushroom',
    condition: 'new',
    variants: [
      { sku: 'RE-ALC-50',  variantTitle: 'Alkoholna',     price: '31.90', availability: 'in stock' },
      { sku: 'RE-GLY-50',  variantTitle: 'Brezalkoholna', price: '33.90', availability: 'in stock' },
    ],
  },
  {
    id: 'resasti-bradovec-tinktura',
    title: 'Resasti bradovec tinktura',
    description: 'Resasti bradovec tinktura GoMushroom. Slovenska surovina iz Pohorske gobarne, lasten ekstrakcijski proces, majhne serije in transparenten pristop do kakovosti.',
    link: 'https://gomushroom.si/trgovina/resasti-bradovec-tinktura/',
    imageLink: 'https://gomushroom.si/assets/shop/resasti-bradovec-tinktura-50ml-gomushroom.webp',
    additionalImageLinks: [],
    brand: 'GoMushroom',
    condition: 'new',
    variants: [
      { sku: 'LM-ALC-50', variantTitle: 'Alkoholna',     price: '31.90', availability: 'in stock' },
      { sku: 'LM-GLY-50', variantTitle: 'Brezalkoholna', price: '33.90', availability: 'in stock' },
    ],
  },
  {
    id: 'chaga-tinktura',
    title: 'Chaga tinktura',
    description: 'Chaga tinktura GoMushroom. Surovina iz brezovih gozdov EU/izven EU, lasten ekstrakcijski proces, majhne serije in transparenten pristop do kakovosti.',
    link: 'https://gomushroom.si/trgovina/chaga-tinktura/',
    imageLink: 'https://gomushroom.si/assets/shop/chaga-tinktura-50ml-gomushroom.webp',
    additionalImageLinks: [],
    brand: 'GoMushroom',
    condition: 'new',
    variants: [
      { sku: 'CH-ALC-50', variantTitle: 'Alkoholna',     price: '31.90', availability: 'in stock' },
      { sku: 'CH-GLY-50', variantTitle: 'Brezalkoholna', price: '33.90', availability: 'in stock' },
    ],
  },
  {
    id: 'smrekovi-vrsicki-tinktura',
    title: 'Smrekovi vršički tinktura',
    description: 'Sezonski ekstrakt smrekovih vršičkov iz alkoholno-vodne ekstrakcije in vakuumskega koncentriranja. Naravni terpeni, fenolne spojine, vitamin C. Alkoholna ali brezalkoholna različica.',
    link: 'https://gomushroom.si/trgovina/smrekovi-vrsicki-tinktura/',
    imageLink: 'https://gomushroom.si/assets/shop/smrekovi-vrsicki-tinktura-50ml-gomushroom.webp',
    additionalImageLinks: [],
    brand: 'GoMushroom',
    condition: 'new',
    variants: [
      { sku: 'SV-ALC-50', variantTitle: 'Alkoholna',     price: '31.90', availability: 'in stock' },
      { sku: 'SV-GLY-50', variantTitle: 'Brezalkoholna', price: '33.90', availability: 'in stock' },
    ],
  },
];

// ── XML helpers ──────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildItem(product, variant) {
  const title = `${product.title} - ${variant.variantTitle} 50 ml`;
  const lines = [
    `    <item>`,
    `      <g:id>${esc(variant.sku)}</g:id>`,
    `      <g:item_group_id>${esc(product.id)}</g:item_group_id>`,
    `      <g:title>${esc(title)}</g:title>`,
    `      <g:description>${esc(product.description)}</g:description>`,
    `      <g:link>${esc(product.link)}</g:link>`,
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
  lines.push(`      <g:product_type>Medicinske gobe &gt; Tinkture</g:product_type>`);
  lines.push(`      <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Nutrition &gt; Vitamins &amp; Supplements</g:google_product_category>`);
  lines.push(`      <g:identifier_exists>false</g:identifier_exists>`);
  lines.push(`    </item>`);

  return lines.join('\n');
}

function buildFeed() {
  const items = PRODUCTS.flatMap(p => p.variants.map(v => buildItem(p, v)));
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">`,
    `  <channel>`,
    `    <title>GoMushroom</title>`,
    `    <link>https://gomushroom.si/</link>`,
    `    <description>GoMushroom product feed</description>`,
    ...items,
    `  </channel>`,
    `</rss>`,
  ].join('\n');
}

// ── Handler (Netlify Functions v2) ───────────────────────────────────────────

export default async () =>
  new Response(buildFeed(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });

export const config = {
  path: '/meta-feed.xml',
};
