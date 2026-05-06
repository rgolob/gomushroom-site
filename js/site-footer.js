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
      <a href="/trgovina/">Trgovina</a>
      <a href="/qc/tezke-kovine/">Kakovost</a>
    `;

  const tags = isEn
    ? `Medicinal mushroom tinctures · Reishi · Chaga · Lion’s Mane · triple extraction · ultrasound-assisted extraction · vacuum concentration · small batches · traceability`
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
      
      <p class="footer-copy">
        © <span id="year"></span> GoMushroom — Rok Golob. ${rights}
      </p>
    </div>
  `;

  const yearEl = footer.querySelector("#year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
