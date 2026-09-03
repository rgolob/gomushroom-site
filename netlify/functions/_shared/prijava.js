// ── Kdo klice funkcijo ─────────────────────────────────────────────────────
//
// Netlify funkcije so javno dosegljive na svojem naslovu. CORS jih ne varuje —
// omejuje samo brskalnike, curl pa ne. Zato mora vsaka funkcija, ki lahko kaj
// posreduje navzven ali spremeni, sama preveriti, kdo jo klice.
//
// Zeton preverimo pri Supabase Auth. Sami ga ne razbiramo: podpis bi morali
// preveriti proti kljucu, ki ga tu nimamo, razbran brez preverjanja pa ne pove
// nicesar — vsak si lahko sestavi zeton, ki trdi karkoli.

const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
const SB_ANON = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';

// Vrne e-naslov prijavljenega uporabnika ali vrze napako.
async function preveriPrijavo(zeton) {
  const z = String(zeton || '').trim();
  if (z.length < 20) throw new Error('Manjka prijava');

  const r = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_ANON, Authorization: 'Bearer ' + z },
  });
  if (!r.ok) throw new Error('Prijava ni veljavna');

  const u = await r.json().catch(() => null);
  if (!u || !u.email) throw new Error('Prijava ni veljavna');
  return u.email;
}

// Zeton poisce v glavi Authorization ali v telesu zahtevka. Glava je pravo
// mesto, telo pa dopuscamo zato, ker nekateri klici zeton ze posiljajo tam.
function zetonIzZahtevka(event, telo) {
  const glava = event.headers?.authorization || event.headers?.Authorization || '';
  const izGlave = /^Bearer\s+(.+)$/i.exec(glava);
  if (izGlave) return izGlave[1].trim();
  return (telo && telo.zeton) ? String(telo.zeton) : '';
}

// Ali je prijava veljavna, brez metanja napake — za funkcije, ki imajo poleg
// prijavljene se drugo, ozjo pot za neprijavljene klicatelje.
async function jePrijavljen(zeton) {
  try { return await preveriPrijavo(zeton); }
  catch { return null; }
}

module.exports = { preveriPrijavo, jePrijavljen, zetonIzZahtevka };
