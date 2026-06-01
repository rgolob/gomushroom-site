const OWNER = 'rgolob';
const REPO = 'gomushroom-site';

const HEADERS = {
  'Access-Control-Allow-Origin': 'https://gomushroom.si',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function ghGet(token, path) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!r.ok) throw new Error(`GET ${path}: ${r.status}`);
  return r.json();
}

async function ghPut(token, path, content, sha, message) {
  const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), sha, branch: 'main' })
  });
  const json = await r.json();
  return { ok: r.ok, status: r.status, json };
}

function extractMeta(html) {
  const titleMatch = html.match(/<title>([^|<]+)/);
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    desc: descMatch ? descMatch[1].trim() : '',
  };
}

function getArticleUrl(filePath) {
  if (filePath.startsWith('znanje/') && filePath.endsWith('/index.html')) {
    const slug = filePath.slice('znanje/'.length, -'/index.html'.length);
    return `/znanje/${slug}/`;
  }
  if (filePath.startsWith('en/learn/') && filePath.endsWith('/index.html')) {
    const slug = filePath.slice('en/learn/'.length, -'/index.html'.length);
    return `/en/learn/${slug}/`;
  }
  return null;
}

function getRelatedArticlesPath(filePath) {
  if (filePath.startsWith('znanje/')) return 'js/related-articles.js';
  if (filePath.startsWith('en/learn/')) return 'js/related-articles-en.js';
  return null;
}

function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function addToRelatedArticles(token, rePath, url, title, desc) {
  const raFile = await ghGet(token, rePath);
  const content = Buffer.from(raFile.content, 'base64').toString('utf-8');

  if (content.includes(`url: '${url}'`)) return { status: 'already_present' };

  const entry = `    {\n      url: '${url}',\n      title: '${escapeJs(title)}',\n      desc: '${escapeJs(desc)}',\n    },\n`;

  // Insert before the closing of the ARTICLES array
  const marker = '\n  ];\n\n  function render';
  const idx = content.indexOf(marker);
  if (idx === -1) return { status: 'insert_failed' };

  const updated = content.slice(0, idx) + '\n' + entry + content.slice(idx);
  const res = await ghPut(token, rePath, updated, raFile.sha, `Dodaj ${url} v ${rePath}`);
  return { status: res.ok ? 'added' : 'error', code: res.status };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  const token = process.env.GITHUB_TOKEN;
  if (!token) return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'GITHUB_TOKEN ni nastavljen' }) };

  try {
    const { paths } = JSON.parse(event.body);
    if (!Array.isArray(paths) || !paths.length) throw new Error('paths mora biti array');

    const results = [];
    const publishedFiles = [];

    for (const filePath of paths) {
      const file = await ghGet(token, filePath);
      const original = Buffer.from(file.content, 'base64').toString('utf-8');

      if (!original.includes('noindex')) {
        results.push({ path: filePath, status: 'already_published' });
        continue;
      }

      const today = new Date().toISOString().split('T')[0];
      const updated = original
        .replace(/noindex,nofollow/g, 'index,follow')
        .replace(/"dateModified": "[^"]*"/g, `"dateModified": "${today}"`)
        .replace(/"datePublished": "[^"]*"/g, `"datePublished": "${today}"`);

      const res = await ghPut(token, filePath, updated, file.sha, `Objavi: ${filePath}`);
      if (res.ok) {
        results.push({ path: filePath, status: 'published' });
        publishedFiles.push({ path: filePath, html: original });
      } else {
        results.push({ path: filePath, status: 'error', code: res.status });
      }
    }

    // Update related-articles.js / related-articles-en.js for each published file
    const relatedResults = [];
    for (const { path: filePath, html } of publishedFiles) {
      const url = getArticleUrl(filePath);
      const rePath = getRelatedArticlesPath(filePath);
      if (!url || !rePath) continue;

      const { title, desc } = extractMeta(html);
      if (!title || !desc) continue;

      const rRes = await addToRelatedArticles(token, rePath, url, title, desc);
      relatedResults.push({ path: rePath, url, ...rRes });
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, results, relatedResults }) };
  } catch (err) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
