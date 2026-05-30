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
  return { ok: r.ok, status: r.status };
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
    for (const filePath of paths) {
      const file = await ghGet(token, filePath);
      const original = Buffer.from(file.content, 'base64').toString('utf-8');

      if (!original.includes('noindex')) {
        results.push({ path: filePath, status: 'already_published' });
        continue;
      }

      const updated = original.replace(/noindex,nofollow/g, 'index,follow');
      const res = await ghPut(token, filePath, updated, file.sha, `Objavi: ${filePath}`);
      results.push({ path: filePath, status: res.ok ? 'published' : 'error', code: res.status });
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, results }) };
  } catch (err) {
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
