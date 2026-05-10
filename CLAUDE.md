# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoMushroom is a static e-commerce website for medicinal mushroom tinctures, serving Slovenian and English markets. No build system or package manager is used — it is plain HTML, CSS, and vanilla JavaScript deployed on Netlify.

## Development Commands

There is no build step. To develop locally:

```bash
# Serve the site locally (Python, available on most systems)
python3 -m http.server 8080

# Or with Node.js if installed
npx serve .
```

The only server-side component is the Netlify Function at `netlify/functions/send-email.js`. To test it:

```bash
# Requires Netlify CLI
npm install -g netlify-cli
netlify dev
```

`RESEND_API_KEY` must be set as an environment variable (in Netlify dashboard or a local `.env` file) for the email function to work.

## Architecture

### Static + Serverless

- All pages are pre-written `.html` files — there is no templating or SSG.
- JavaScript files in `/js/` are plain ES modules loaded via `<script type="module">`.
- The sole backend is `netlify/functions/send-email.js`, which processes checkout form submissions using the Resend API.

### Data & E-commerce (Supabase)

Product data is fetched client-side from Supabase. The public (read-only) Supabase URL and key are intentionally hardcoded across several JS files:

- URL: `https://rjscfndegqxuefffsedf.supabase.co`
- Key prefix: `sb_publishable_...`

Key Supabase tables: `gm_products`, `gm_product_variants`, `gm_variant_stock_status`, `gm_settings`, `gm_discounts`.

### Shopping Cart

Cart state is stored in `localStorage` under the key `gomushroom_cart`. Components communicate cart changes via:
- `storage` events (cross-tab sync)
- Custom `cart:updated` DOM events (same-tab sync)

The cart badge in headers listens for both events.

### Checkout Flow

1. `/trgovina/` — shop grid (renders from Supabase)
2. `/trgovina/{product}/` — product detail page
3. `/trgovina/kosarica/` — cart review
4. `/trgovina/blagajna/` — checkout form → POSTs to Netlify Function → Resend email

### Analytics

`/js/analytics.js` wraps GA4 e-commerce events (`view_item`, `add_to_cart`, `purchase`, etc.). **All GA4 calls are gated on cookie consent**: events only fire when `localStorage.getItem('gm_cookie_consent') === 'all'`. Do not call GA4 functions directly; always go through `analytics.js`.

### Bilingual Structure

| Language   | Root path | Shop path    | Articles path |
|------------|-----------|--------------|---------------|
| Slovenian  | `/`       | `/trgovina/` | `/znanje/`    |
| English    | `/en/`    | —            | `/en/learn/`  |

Language switching is URL-based. `site-header.js` maps hash anchors between language variants.

## Key Files

| File | Role |
|------|------|
| `css/site.css` | Global design system; CSS custom properties (colors, spacing) |
| `js/site.js` | Hero slider, mobile nav, service detail panels |
| `js/shop.js` | Renders shop product grid from Supabase |
| `js/product-page.js` | Product variant selection, add-to-cart logic |
| `js/cart.js` | Cart read/write helpers (localStorage) |
| `js/blagajna.js` | Checkout form, discount application, order submission |
| `js/analytics.js` | All GA4 e-commerce tracking |
| `js/cookie-consent.js` | GDPR cookie banner |
| `netlify/functions/send-email.js` | Order email handler (server-side) |
| `trgovina/data/products.json` | Static fallback product data |

## CSS Conventions

Custom properties defined in `css/site.css `:

```css
--bg: #f7f8f7       /* page background */
--fg: #101311       /* body text */
--brand: #2b0a39    /* primary brand color (deep purple) */
--accent: #b18556   /* accent color (bronze) */
--line: #e6e9e6     /* borders/dividers */
--card: #ffffff     /* card surfaces */
```

Max content width is `1180px`. Layout uses CSS Grid and Flexbox — no utility framework.

## Conventions

- **Language**: UI copy and most code comments are in Slovenian. Variable and function names are English.
- **No TypeScript**: all JS is plain ES2020+.
- **No tests**: there is no test suite.
- **CORS**: `send-email.js` restricts `Access-Control-Allow-Origin` to `https://gomushroom.si`. Update this if testing from a different origin.
- **Deployment**: pushing to the main branch auto-deploys via Netlify. There is no staging environment defined in config.
