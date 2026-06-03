(async () => {
  const shell = document.querySelector('.article-shell');
  if (!shell) return;

  const lang = document.documentElement.lang || 'sl';
  const currentPath = location.pathname.replace(/([^/])$/, '$1/');

  let articles;
  try {
    const r = await fetch('/data/published-articles.json');
    if (!r.ok) return;
    articles = await r.json();
  } catch { return; }

  for (const art of articles) {
    const v = art[lang];
    if (!v || !v.publishedAt || !v.url || v.url === currentPath) continue;
    for (const phrase of (v.phrases || [])) {
      if (linkFirst(shell, phrase, v.url)) break;
    }
  }
})();

function linkFirst(root, phrase, url) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement.closest('h1,h2,h3,h4,a,.article-references,.article-faq,.article-kicker,figcaption,.article-caption'))
        return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) {
    const idx = node.textContent.indexOf(phrase);
    if (idx === -1) continue;
    const a = document.createElement('a');
    a.href = url;
    a.textContent = phrase;
    const frag = document.createDocumentFragment();
    if (idx > 0) frag.appendChild(document.createTextNode(node.textContent.slice(0, idx)));
    frag.appendChild(a);
    const tail = node.textContent.slice(idx + phrase.length);
    if (tail) frag.appendChild(document.createTextNode(tail));
    node.parentElement.replaceChild(frag, node);
    return true;
  }
  return false;
}
