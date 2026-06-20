// ── GoMushroom Cookie Consent — Consent Mode v2 Advanced ──
// GDPR skladen cookie banner z GA4 integracijo

const GA_ID = 'G-L2PGE7VDHB';
const CONSENT_KEY = 'gm_cookie_consent';

// Consent Mode v2: inicializiraj dataLayer in nastavi privzeto stanje
// PRED nalaganjem GA skripta — obvezno za Advanced mode
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
window.gtag = gtag;

gtag('consent', 'default', {
  analytics_storage:  'denied',
  ad_storage:         'denied',
  ad_user_data:       'denied',
  ad_personalization: 'denied',
  wait_for_update:    500
});

function gmLoadGA() {
  if (window.gmIsGADisabled && window.gmIsGADisabled()) {
    console.log("GA disabled by DEV toggle");
    return;
  }
  if (document.getElementById('gm-ga-script')) return;
  const s1 = document.createElement('script');
  s1.id = 'gm-ga-script';
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s1);
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });
}

function gmGrantConsent() {
  gtag('consent', 'update', {
    analytics_storage:  'granted',
    ad_storage:         'granted',
    ad_user_data:       'granted',
    ad_personalization: 'granted'
  });
}

function gmGetConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}

function gmSetConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch {}
}

function gmAcceptAll() {
  gmSetConsent('all');
  gmGrantConsent();
  gmHideBanner();
  const s = document.createElement('script');
  s.src = '/js/meta-pixel.js';
  document.body.appendChild(s);
}

function gmAcceptNecessary() {
  gmSetConsent('necessary');
  gmHideBanner();
}

function gmHideBanner() {
  const b = document.getElementById('gm-cookie-banner');
  if (b) b.remove();
}

function gmShowBanner() {
  if (document.getElementById('gm-cookie-banner')) return;

  const isEn = window.location.pathname.startsWith('/en/');
  const t = isEn ? {
    title: '🍪 Cookies',
    text: '— We use analytics cookies (Google Analytics) to understand site traffic.',
    moreInfo: 'More info',
    moreInfoUrl: '/en/legal/cookie-policy/',
    necessary: 'Essential only',
    acceptAll: 'Accept all',
  } : {
    title: '🍪 Piškotki',
    text: '— Uporabljamo analitične piškotke (Google Analytics) za razumevanje obiskanosti strani.',
    moreInfo: 'Več info',
    moreInfoUrl: '/pravno/politika-piskotkov/',
    necessary: 'Samo nujne',
    acceptAll: 'Sprejmi vse',
  };

  const banner = document.createElement('div');
  banner.id = 'gm-cookie-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #1a1209;
    color: #f0ebe3;
    padding: 1rem 1.25rem;
    box-shadow: 0 -4px 24px rgba(0,0,0,.25);
    font-family: 'Jost', sans-serif;
    font-size: .82rem;
    line-height: 1.5;
  `;

  banner.innerHTML = `
    <div style="max-width:900px;margin:0 auto;display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">
        <span style="font-weight:600;color:#af8455">${t.title}</span>
        ${t.text}
        <a href="${t.moreInfoUrl}" style="color:#af8455;text-decoration:underline;white-space:nowrap">${t.moreInfo}</a>
      </div>
      <div style="display:flex;gap:.5rem;flex-shrink:0">
        <button onclick="gmAcceptNecessary()" style="
          padding:.45rem .9rem;
          border:1px solid rgba(240,235,227,.25);
          border-radius:999px;
          background:transparent;
          color:#f0ebe3;
          font-family:'Jost',sans-serif;
          font-size:.78rem;
          cursor:pointer;
          white-space:nowrap;
        ">${t.necessary}</button>
        <button onclick="gmAcceptAll()" style="
          padding:.45rem .9rem;
          border:none;
          border-radius:999px;
          background:#af8455;
          color:#1a1209;
          font-family:'Jost',sans-serif;
          font-size:.78rem;
          font-weight:600;
          cursor:pointer;
          white-space:nowrap;
        ">${t.acceptAll}</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);
}

// Init ob zagonu
(function() {
  // Advanced mode: GA vedno naloži — pošilja cookieless pinge za modeliranje
  // tudi pri zavrnitvi piškotkov (consent ostane denied, brez osebnih podatkov)
  gmLoadGA();

  const consent = gmGetConsent();
  if (consent === 'all') {
    gmGrantConsent();
  } else if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', gmShowBanner);
    } else {
      gmShowBanner();
    }
  }
  // consent === 'necessary' → GA teče v cookieless načinu, baner skrit
})();
