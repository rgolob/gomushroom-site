// Netlify Functions v2 — samodejno servira na /meta-feed.xml
// Katalog izdelkov (cene, opisi, linki) je v _shared/feed-products.mjs, deljen z /meta-feed-en.xml.

import { buildFeed } from './_shared/feed-products.mjs';

export default async () =>
  new Response(await buildFeed('sl'), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });

export const config = {
  path: '/meta-feed.xml',
};
