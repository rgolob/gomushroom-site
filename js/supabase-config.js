// GoMushroom – Supabase konfiguracija
// Naloži ta file PRVI v vsakem HTML-ju, pred vsemi ostalimi skripti!
// <script src="/js/supabase-config.js"></script>

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';

// Helper funkcija za Supabase fetch klice
async function sbFetch(endpoint, options = {}) {
  const url = `${SB_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    }
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res.json();
}
