// ── PRIJAVA V SUPABASE ─────────────────────────────────────────────────────
// Skupni modul za zasebni aplikaciji (zaloga, materiali).
//
// Doslej je prijava primerjala zgostitev gesla, zapisano v sami strani, in
// postavila zastavico v localStorage. To zaklene vmesnik, ne pa podatkov: kdor
// iz izvorne kode prebere publishable kljuc, bere vse tabele mimo aplikacije.
// Prava prijava pomeni, da vsak zahtevek nosi zeton prijavljenega uporabnika,
// tabele pa so zascitene z RLS.
//
// Modul samo pripravi zeton in ga vpise v skupno glavo, ki jo aplikaciji ze
// uporabljata pri vsakem zahtevku. Dokler v bazi RLS ni vklopljen, aplikacija
// dela enako kot prej - zato ga je mogoce namestiti brez tveganja in RLS
// prizgati sele potem, ko je prijava preverjeno v redu.
window.GMAuth = (function () {
  const KLJUC = 'gm_sb_session';
  // Zeton osvezimo nekaj minut pred potekom; ce cakamo na 401, je zahtevek ze
  // padel in uporabnik vidi napako namesto podatkov.
  const PRED_POTEKOM_MS = 5 * 60 * 1000;

  let cfg = null;      // {url, anonKey, headers, onState}
  let seja = null;     // {access_token, refresh_token, expires_at, email}
  let casovnik = null;

  const beri = () => { try { return JSON.parse(localStorage.getItem(KLJUC) || 'null'); } catch (e) { return null; } };
  const pisi = s => { try { s ? localStorage.setItem(KLJUC, JSON.stringify(s)) : localStorage.removeItem(KLJUC); } catch (e) {} };

  // Brez seje ostane v glavi publishable kljuc - tako aplikacija dela naprej
  // tudi pred vklopom Auth, le da ni zascitena. Da to ne ostane neopazno,
  // stanje sporocimo aplikaciji, ki izpise opozorilo.
  function uporabiZeton() {
    if (!cfg) return;
    cfg.headers.Authorization = 'Bearer ' + (seja ? seja.access_token : cfg.anonKey);
    if (typeof cfg.onState === 'function') cfg.onState(stanje());
  }

  function shrani(odgovor, email) {
    seja = {
      access_token: odgovor.access_token,
      refresh_token: odgovor.refresh_token,
      // expires_in je v sekundah od zdaj; expires_at vrne Supabase kot epoch v
      // sekundah, ni pa zajamcen - zato racunamo sami.
      expires_at: Date.now() + (Number(odgovor.expires_in) || 3600) * 1000,
      email: email || odgovor.user?.email || seja?.email || '',
    };
    pisi(seja);
    uporabiZeton();
    razporediOsvezitev();
  }

  function pozabi() {
    seja = null; pisi(null);
    clearTimeout(casovnik); casovnik = null;
    uporabiZeton();
  }

  async function klic(pot, telo, zZetonom) {
    const r = await fetch(`${cfg.url}/auth/v1/${pot}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.anonKey,
        // Odjava mora povedati, katero sejo zapira, zato nosi uporabnikov
        // zeton; prijava in osvezitev sta brez njega.
        ...(zZetonom && seja ? { Authorization: 'Bearer ' + seja.access_token } : {}),
      },
      body: JSON.stringify(telo),
    });
    const t = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(t.error_description || t.msg || t.error || `HTTP ${r.status}`), { status: r.status, telo: t });
    return t;
  }

  function razporediOsvezitev() {
    clearTimeout(casovnik);
    if (!seja) return;
    const cez = Math.max(5000, seja.expires_at - Date.now() - PRED_POTEKOM_MS);
    casovnik = setTimeout(() => { osvezi(); }, cez);
  }

  async function osvezi() {
    if (!seja?.refresh_token) return false;
    try {
      shrani(await klic('token?grant_type=refresh_token', { refresh_token: seja.refresh_token }), seja.email);
      return true;
    } catch (e) {
      // Zavrnjen refresh pomeni, da seje ni vec - takrat je posteno zahtevati
      // ponovno prijavo, ne pa tiho delati naprej s publishable kljucem.
      console.warn('GMAuth: osvezitev seje ni uspela', e.message);
      pozabi();
      return false;
    }
  }

  function stanje() {
    return seja
      ? { prijavljen: true, email: seja.email, potece: seja.expires_at }
      : { prijavljen: false, email: '', potece: 0 };
  }

  return {
    // headers je isti objekt, ki ga aplikacija podaja vsakemu fetchu; zeton
    // vanj vpisujemo na mestu, zato ga ni treba loviti po vseh klicnih mestih.
    async init(nastavitve) {
      cfg = nastavitve;
      seja = beri();
      if (seja && seja.expires_at - Date.now() < PRED_POTEKOM_MS) {
        uporabiZeton();          // zacasno, da glava ni prazna med osvezitvijo
        await osvezi();
      } else {
        uporabiZeton();
        razporediOsvezitev();
      }
      // Po vrnitvi iz ozadja je casovnik lahko zamudil; takrat preverimo sproti.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && seja && seja.expires_at - Date.now() < PRED_POTEKOM_MS) osvezi();
      });
      return stanje();
    },

    async prijava(email, geslo) {
      shrani(await klic('token?grant_type=password', { email, password: geslo }), email);
      return stanje();
    },

    async odjava() {
      if (seja) { try { await klic('logout', {}, true); } catch (e) {} }
      pozabi();
    },

    osvezi,
    stanje,
    prijavljen: () => !!seja,
  };
})();
