document.addEventListener("DOMContentLoaded", () => {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  const path = window.location.pathname;
  const isEn = path.startsWith("/en/");

  const footerNav = isEn
    ? `
      <a href="/en/">Home</a>
      <a href="/en/learn/">Learn</a>
      <a href="/en/qc/heavy-metals/">Quality</a>
    `
    : `
      <a href="/">Domov</a>
      <a href="/znanje/">Znanje</a>
      <a href="/qc/tezke-kovine/">Kakovost</a>
      <a href="/trgovina/">Trgovina</a>
    `;

  const tags = isEn
    ? `Medicinal mushroom tinctures · Reishi · Chaga · Lion's Mane · triple extraction · ultrasound-assisted extraction · vacuum concentration · small batches · traceability`
    : `Tinkture medicinskih gob · Reishi · Chaga · Resasti bradovec · trojna ekstrakcija · ultrazvočna ekstrakcija · vakuumsko koncentriranje · male serije · sledljivost`;

  const rights = isEn
    ? `All rights reserved.`
    : `Vse pravice pridržane.`;

  const footerMeta = isEn
  ? `GoMushroom, mushroom cultivation, Rok Golob s.p. · Prapreče pri Straži 22 · 8351 Straža · Slovenia`
  : `GoMushroom, pridelava gob, Rok Golob s.p. · Prapreče pri Straži 22 · 8351 Straža · Slovenija`;

  const signature = isEn
  ? `GoMushroom is not a product. It is a process.`
  : `GoMushroom ni produkt. Je proces.`;

  const legalLinks = isEn
    ? `<a href="#" onclick="gmShowLegal('cookie-policy');return false">Cookie Policy</a>
       <a href="#" onclick="gmShowLegal('privacy-policy');return false">Privacy Policy</a>`
    : path.startsWith('/trgovina/')
    ? `<a href="#" onclick="gmShowLegal('politika-piskotkov');return false">Politika piškotkov</a>
       <a href="#" onclick="gmShowLegal('politika-zasebnosti');return false">Politika zasebnosti</a>
       <a href="#" onclick="gmShowLegal('pogoji-poslovanja');return false">Pogoji poslovanja</a>`
     : `<a href="#" onclick="gmShowLegal('politika-piskotkov');return false">Politika piškotkov</a>
        <a href="#" onclick="gmShowLegal('politika-zasebnosti');return false">Politika zasebnosti</a>`;

  footer.className = "site-footer";

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-social" aria-label="Social media">
        <a href="https://wa.me/message/3U7XJG5NK3IPN1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><span>Wa</span></a>
        <a href="https://www.facebook.com/go.mushroomm" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><span>Fb</span></a>
        <a href="https://www.instagram.com/go.mushroom?igsh=bG1pMXRtbWprNThk&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span>IG</span></a>
        <a href="mailto:info@gomushroom.si" aria-label="Email"><span>@</span></a>
      </div>

      <nav class="footer-nav" aria-label="Footer navigation">
        ${footerNav}
      </nav>

      <p class="footer-tags">
        ${tags}
      </p>

      <p class="footer-meta">
        ${footerMeta}
      </p>

      <div class="footer-line" aria-hidden="true"></div>

      <p class="footer-signature">${signature}</p>

      <nav class="footer-legal" aria-label="Pravni dokumenti">
        ${legalLinks}
      </nav>

      <p class="footer-copy">
        © <span id="year"></span> GoMushroom — Rok Golob. ${rights}
      </p>
    </div>
  `;

  const yearEl = footer.querySelector("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

 function loadScriptOnce(src, callback) {
    if (document.querySelector(`script[src="${src}"]`)) {
      if (callback) callback();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.defer = true;

    if (callback) {
      script.onload = callback;
    }

    document.body.appendChild(script);
  }

  loadScriptOnce("/js/legal.js");
  loadScriptOnce("/js/ga-dev-toggle.js", () => {
    loadScriptOnce("/js/cookie-consent.js");
  });

  if (localStorage.getItem('gm_cookie_consent') === 'all') {
    loadScriptOnce("/js/meta-pixel.js");
  }

  // GA4. Doslej se je nalozil samo v trgovini, ker so ga potrebovali le
  // ecommerce eventi. Odkar dogodke posilja tudi popup za e-novice, ki se
  // prikaze predvsem na domaci strani in clankih, mora biti povsod - sicer
  // gmTrack tam ne obstaja in dogodki tiho izginejo. Sama datoteka je majhna
  // in brez privolitve ne posilja nicesar.
  loadScriptOnce("/js/analytics.js");

  // Popup za e-novice zaenkrat samo na slovenski strani. Sam preveri se, ali
  // je obiskovalec ze prijavljen, ali ga je zaprl in ali je odgovoril na
  // piskotno pasico; tu izlocimo le kosarico in blagajno, kjer bi motil nakup.
  // Vecina slovenskih strani ima lang="sl", nekatere (med njimi domaca) pa
  // lang="sl-SI" - zato predpona in ne enakost.
  if (document.documentElement.lang.toLowerCase().startsWith("sl") &&
      !path.startsWith("/trgovina/kosarica") &&
      !path.startsWith("/trgovina/blagajna") &&
      // Kdor se ravnokar odjavlja, ne potrebuje vabila k prijavi.
      !path.startsWith("/odjava")) {
    loadScriptOnce("/js/newsletter-popup.js");
  }
});
