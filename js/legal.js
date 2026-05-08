// ── GoMushroom Legal Modal ────────────────────────────────
// Vse pravne vsebine v enem fajlu, prikaz v modalu

const GM_LEGAL = {

  'cookies-policy': {
    title: 'Cookie Policy',
    lang: 'en',
    content: `
      <p>This page explains which cookies <strong>gomushroom.si</strong> uses and how you can manage them.</p>

      <h3>What are cookies?</h3>
      <p>Cookies are small text files stored in your browser when you visit a website. They allow the site to remember your preferences and settings.</p>

      <h3>Cookies we use</h3>
      <table class="gm-legal-table">
        <thead><tr><th>Name / source</th><th>Purpose</th><th>Type</th><th>Duration</th></tr></thead>
        <tbody>
          <tr><td><code>gm_cookie_consent</code></td><td>Stores your cookie preference</td><td>Necessary</td><td>1 year</td></tr>
          <tr><td><code>gomushroom_cart</code></td><td>Shopping cart contents</td><td>Necessary</td><td>Until cleared</td></tr>
          <tr><td>Google Analytics (<code>_ga</code>, <code>_ga_*</code>)</td><td>Anonymised analytics</td><td>Analytical</td><td>2 years</td></tr>
        </tbody>
      </table>

      <h3>Necessary cookies</h3>
      <p>Required for the cart and basic site functionality. No consent needed.</p>

      <h3>Analytical cookies</h3>
      <p>Google Analytics helps us understand how visitors use the site. All data is anonymised. These cookies are only loaded after your explicit consent.</p>

      <h3>Managing cookies</h3>
      <p>You can change your preference at any time:</p>
      <button onclick="localStorage.removeItem('gm_cookie_consent');location.reload()" class="gm-legal-btn">
        Reset cookie preferences
      </button>

      <h3>Contact</h3>
      <p><a href="mailto:info@gomushroom.si">info@gomushroom.si</a> · GoMushroom, Rok Golob s.p., Prapreče pri Straži 22, 8351 Straža, Slovenia</p>
      <p class="gm-legal-meta">Effective from: 7 May 2026</p>
    `
  },

  'privacy-policy': {
    title: 'Privacy Policy',
    lang: 'en',
    content: `
      <h3>Data controller</h3>
      <p><strong>GoMushroom, Rok Golob s.p.</strong><br>
      Prapreče pri Straži 22, 8351 Straža, Slovenia<br>
      VAT: SI20581041<br>
      <a href="mailto:info@gomushroom.si">info@gomushroom.si</a> · <a href="tel:+38631373836">+386 31 373 836</a></p>

      <h3>What data do we collect?</h3>
      <p>We collect only data necessary to fulfil your order: name, email, phone (optional), delivery address, and order details.</p>

      <h3>Purpose of processing</h3>
      <p>Your data is used exclusively to process and deliver your order, send order confirmation and invoice, communicate about your order, and fulfil legal obligations.</p>

      <h3>Legal basis</h3>
      <p>Processing is based on contractual necessity (order fulfilment) under Art. 6(1)(b) GDPR.</p>

      <h3>Data retention</h3>
      <p>Order data is retained for 10 years (accounting legislation). Analytics data for 26 months.</p>

      <h3>Data sharing</h3>
      <p>We do not sell your data. It is shared only with: Pošta Slovenije (delivery), Google Analytics (analytics, with consent), Supabase (storage, EU servers), Resend (transactional emails).</p>

      <h3>Your rights</h3>
      <p>Under GDPR you have the right to access, rectify, erase, restrict processing, and port your data. Submit requests to <a href="mailto:info@gomushroom.si">info@gomushroom.si</a>. You may also lodge a complaint with the <a href="https://www.ip-rs.si" target="_blank" rel="noopener">Slovenian Information Commissioner</a>.</p>

      <h3>Security</h3>
      <p>Data is protected with HTTPS. We do not store payment details — payment is by bank transfer only.</p>
      <p class="gm-legal-meta">Effective from: 7 May 2026</p>
    `
  },



  'politika-piskotkov': {
    lang: 'sl',
    title: 'Politika piškotkov',
    content: `
      <p>Ta stran pojasnjuje, katere piškotke uporablja <strong>gomushroom.si</strong> in kako jih upravljate.</p>

      <h3>Kaj so piškotki?</h3>
      <p>Piškotki so majhne besedilne datoteke, ki se shranijo v vašem brskalniku ob obisku spletne strani.</p>

      <h3>Katere piškotke uporabljamo?</h3>
      <table class="gm-legal-table">
        <thead><tr><th>Ime / vir</th><th>Namen</th><th>Vrsta</th><th>Trajanje</th></tr></thead>
        <tbody>
          <tr><td><code>gm_cookie_consent</code></td><td>Shrani vašo izbiro glede piškotkov</td><td>Nujen</td><td>1 leto</td></tr>
          <tr><td><code>gomushroom_cart</code></td><td>Vsebina košarice</td><td>Nujen</td><td>Do brisanja</td></tr>
          <tr><td>Google Analytics (<code>_ga</code>, <code>_ga_*</code>)</td><td>Analitika obiskanosti (anonimizirana)</td><td>Analitičen</td><td>2 leti</td></tr>
        </tbody>
      </table>

      <h3>Nujni piškotki</h3>
      <p>Potrebni za delovanje košarice in nastavitev. Za njihovo uporabo ne potrebujemo soglasja.</p>

      <h3>Analitični piškotki</h3>
      <p>Google Analytics nam pomaga razumeti obiskanost strani. Podatki so anonimizirani. Naložimo jih šele po vašem soglasju.</p>

      <h3>Upravljanje piškotkov</h3>
      <p>Svojo izbiro lahko kadar koli spremenite:</p>
      <button onclick="localStorage.removeItem('gm_cookie_consent');location.reload()" class="gm-legal-btn">
        Ponastavi nastavitve piškotkov
      </button>

      <h3>Kontakt</h3>
      <p><a href="mailto:info@gomushroom.si">info@gomushroom.si</a> · GoMushroom, Rok Golob s.p., Prapreče pri Straži 22, 8351 Straža</p>
      <p class="gm-legal-meta">Veljavno od: 7. maja 2026</p>
    `
  },

  'politika-zasebnosti': {
    lang: 'sl',
    title: 'Politika zasebnosti',
    content: `
      <h3>Upravljavec podatkov</h3>
      <p><strong>GoMushroom, Rok Golob s.p.</strong><br>
      Prapreče pri Straži 22, 8351 Straža<br>
      Davčna številka: SI20581041<br>
      <a href="mailto:info@gomushroom.si">info@gomushroom.si</a> · <a href="tel:+38631373836">031 373 836</a></p>

      <h3>Katere podatke zbiramo?</h3>
      <p>Zbiramo samo podatke nujno potrebne za izvedbo naročila: ime, e-mail, telefon (neobvezno), naslov za dostavo, vsebino naročila.</p>

      <h3>Namen obdelave</h3>
      <p>Podatke obdelujemo izključno za izvedbo in dostavo naročila, pošiljanje potrditve in predračuna, komunikacijo v zvezi z naročilom ter zakonske obveznosti.</p>

      <h3>Pravna podlaga</h3>
      <p>Obdelava temelji na pogodbenem razmerju (izvedba naročila) v skladu s 6. členom, točka (b) GDPR.</p>

      <h3>Hramba podatkov</h3>
      <p>Podatke o naročilih hranimo 10 let (računovodska zakonodaja). Analitične podatke 26 mesecev.</p>

      <h3>Deljenje podatkov</h3>
      <p>Podatkov ne prodajamo. Delijo se samo s: Pošto Slovenije (dostava), Google Analytics (analitika, ob soglasju), Supabase (hramba, EU strežniki), Resend (transakcijski e-maili).</p>

      <h3>Vaše pravice</h3>
      <p>Imate pravico do dostopa, popravka, izbrisa, omejitve obdelave in prenosljivosti podatkov. Zahtevo pošljite na <a href="mailto:info@gomushroom.si">info@gomushroom.si</a>. Pritožbo lahko vložite pri <a href="https://www.ip-rs.si" target="_blank" rel="noopener">Informacijskemu pooblaščencu RS</a>.</p>

      <h3>Varnost</h3>
      <p>Podatke varujemo z HTTPS šifriranjem. Plačilnih podatkov ne shranjujemo — plačilo poteka prek bančnega nakazila.</p>
      <p class="gm-legal-meta">Veljavno od: 7. maja 2026</p>
    `
  },

  'pogoji-poslovanja': {
    lang: 'sl',
    title: 'Pogoji poslovanja',
    content: `
      <h3>1. Prodajalec</h3>
      <p><strong>GoMushroom, Rok Golob s.p.</strong><br>
      Prapreče pri Straži 22, 8351 Straža · SI20581041<br>
      <a href="mailto:info@gomushroom.si">info@gomushroom.si</a> · <a href="tel:+38631373836">031 373 836</a></p>

      <h3>2. Izdelki</h3>
      <p>GoMushroom prodaja tinkture medicinskih gob kot prehranska dopolnila v majhnih serijah iz lastno pridelanih surovin. Prehranska dopolnila niso zdravila. Pred uporabo se posvetujte z zdravnikom.</p>

      <h3>3. Naročilo</h3>
      <p>Naročilo oddate v spletni trgovini. Po oddaji prejmete potrditveni e-mail s predračunom. Naročilo je zavezujoče po oddaji. Pridržujemo si pravico do zavrnitve v primeru napake v ceni ali razpoložljivosti.</p>

      <h3>4. Cene in plačilo</h3>
      <p>Cene so v evrih in so končne (GoMushroom ni zavezanec za DDV). Plačilo poteka z bančnim nakazilom. Naročilo obdelamo po prejemu plačila.</p>

      <h3>5. Dostava</h3>
      <p>Dostavljamo po vsej Sloveniji prek Pošte Slovenije. Poštnina: 3,90 € — pri naročilu nad 60 € brezplačno. Čas dostave: 2–4 delovne dni po potrditvi plačila. Dostava v tujino trenutno ni na voljo.</p>

      <h3>6. Vračila in odstop od pogodbe</h3>
      <div class="gm-legal-highlight">
        <strong>Kratko:</strong> Neodprte izdelke vrnete v 14 dneh brez razloga. Kupnino vrnemo v 14 dneh od prejema vračila.
      </div>
      <p>Pravica do odstopa v <strong>14 dneh</strong> od prejema blaga brez navedbe razloga. Obvestite nas pisno na <a href="mailto:info@gomushroom.si">info@gomushroom.si</a>.</p>
      <ol>
        <li>Pišite na <a href="mailto:info@gomushroom.si">info@gomushroom.si</a> ali pokličite <a href="tel:+38631373836">031 373 836</a></li>
        <li>Povejte številko naročila in razlog vračila</li>
        <li>Blago pošljite na: <strong>GoMushroom, Prapreče pri Straži 22, 8351 Straža</strong></li>
      </ol>
      <ul>
        <li>Izdelek mora biti <strong>neodprt in nepoškodovan</strong> v originalni embalaži</li>
        <li>Pravica ne velja za odprte ali delno uporabljene izdelke</li>
        <li>Stroške vračilne pošiljke nosi kupec</li>
      </ul>
      <p>Kupnino vrnemo v <strong>14 dneh</strong> od prejema vrnjenega blaga. Poštnine ne vračamo.</p>
      <p>Za poškodovano ali napačno blago nas kontaktirajte v 48 urah od prejema z opisom in fotografijo — prevzamemo vse stroške in pošljemo nadomestni izdelek ali vrnemo kupnino.</p>

      <h3>7. Reklamacije</h3>
      <p>Reklamacijo sporočite na <a href="mailto:info@gomushroom.si">info@gomushroom.si</a> ali 031 373 836. Rešimo jo v 8 delovnih dneh.</p>

      <h3>8. Reševanje sporov</h3>
      <p>Morebitne spore rešujemo sporazumno. Potrošnik lahko vloži pritožbo prek <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">platforme EU za spletno reševanje sporov</a>.</p>
      <p class="gm-legal-meta">Veljavno od: 7. maja 2026</p>
    `
  }

};

// ── Določi sorodne dokumente glede na stran in kontekst ──
function gmGetRelatedDocs(currentSlug) {
  const path = window.location.pathname;
  const isEn = path.startsWith('/en/');
  const isTrgovine = path.startsWith('/trgovina/');

  let allowedSlugs;
  if (isEn) {
    allowedSlugs = ['cookies-policy', 'privacy-policy'];
  } else if (isTrgovine) {
    allowedSlugs = ['politika-piskotkov', 'politika-zasebnosti', 'pogoji-poslovanja'];
  } else {
    allowedSlugs = ['politika-piskotkov', 'politika-zasebnosti'];
  }

  return Object.entries(GM_LEGAL).filter(([k]) => allowedSlugs.includes(k));
}

// ── Drawer panel iz desne ────────────────────────────────
function gmShowLegal(slug) {
  const doc = GM_LEGAL[slug];
  if (!doc) return;

  document.getElementById('gm-legal-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'gm-legal-modal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:9000;
    display:flex;justify-content:flex-end;
    background:rgba(10,6,3,0);
    transition:background .3s ease;
  `;

  modal.innerHTML = `
    <div id="gm-legal-drawer" style="
      background:#faf8f5;
      width:min(480px,100vw);
      height:100%;
      display:flex;
      flex-direction:column;
      transform:translateX(100%);
      transition:transform .35s cubic-bezier(.32,.72,0,1);
      box-shadow:-24px 0 80px rgba(10,6,3,.18);
    ">
      <!-- Header -->
      <div style="
        display:flex;justify-content:space-between;align-items:center;
        padding:1.25rem 1.5rem;
        border-bottom:1px solid rgba(43,11,57,.07);
        background:#fff;
        flex-shrink:0;
      ">
        <div>
          <div style="font-size:.58rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#af8455;margin-bottom:.2rem">Pravni dokumenti</div>
          <div style="font-size:1.05rem;font-weight:700;color:#2b0b39;letter-spacing:-.02em">${doc.title}</div>
        </div>
        <button id="gm-legal-close" style="
          width:36px;height:36px;border-radius:50%;
          border:1px solid rgba(43,11,57,.1);
          background:rgba(43,11,57,.04);
          color:rgba(43,11,57,.6);
          font-size:.85rem;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:.18s;flex-shrink:0;
        ">✕</button>
      </div>

      <!-- Vsebina -->
      <div style="
        flex:1;overflow-y:auto;
        padding:1.5rem;
        -webkit-overflow-scrolling:touch;
        scroll-behavior:smooth;
      " class="gm-legal-content">
        ${doc.content}
      </div>

      <!-- Navigacija spodaj -->
      <div style="
        padding:1rem 1.5rem;
        border-top:1px solid rgba(43,11,57,.06);
        background:#fff;
        flex-shrink:0;
      ">
        <div style="font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(43,11,57,.35);margin-bottom:.6rem">Drugi dokumenti</div>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap">
          ${gmGetRelatedDocs(slug).filter(([k]) => k !== slug).map(([k, v]) =>
            `<button onclick="gmShowLegal('${k}')" style="
              font-size:.72rem;padding:.35rem .8rem;
              border:1px solid rgba(43,11,57,.12);
              border-radius:999px;background:white;
              color:rgba(43,11,57,.6);cursor:pointer;
              font-family:inherit;transition:.18s;
            " onmouseover="this.style.background='#2b0b39';this.style.color='#f0ebe3'"
               onmouseout="this.style.background='white';this.style.color='rgba(43,11,57,.6)'"
            >${v.title}</button>`
          ).join('')}
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Animacija odpiranja
  requestAnimationFrame(() => {
    modal.style.background = 'rgba(10,6,3,.45)';
    document.getElementById('gm-legal-drawer').style.transform = 'translateX(0)';
  });

  // Zapri
  function gmCloseLegal() {
    modal.style.background = 'rgba(10,6,3,0)';
    document.getElementById('gm-legal-drawer').style.transform = 'translateX(100%)';
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 350);
  }

  modal.addEventListener('click', e => { if (e.target === modal) gmCloseLegal(); });
  document.getElementById('gm-legal-close').addEventListener('click', gmCloseLegal);

  // Escape tipka
  const onKey = e => { if (e.key === 'Escape') { gmCloseLegal(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
}

// ── CSS ───────────────────────────────────────────────────
const gmLegalStyle = document.createElement('style');
gmLegalStyle.textContent = `
  .gm-legal-content { font-family: Georgia, serif; font-size: .88rem; line-height: 1.8; color: rgba(43,11,57,.82); }
  .gm-legal-content h3 { font-size: .95rem; font-weight: 700; color: #2b0b39; margin: 1.25rem 0 .35rem; padding-bottom: .25rem; border-bottom: 1px solid rgba(43,11,57,.06); }
  .gm-legal-content p { margin: 0 0 .75rem; }
  .gm-legal-content a { color: #2b0b39; text-underline-offset: 3px; }
  .gm-legal-content a:hover { color: #af8455; }
  .gm-legal-content ul, .gm-legal-content ol { margin: 0 0 .75rem 1.25rem; }
  .gm-legal-content li { margin-bottom: .25rem; }
  .gm-legal-content code { font-size: .82em; background: rgba(43,11,57,.06); padding: .1em .35em; border-radius: 4px; }
  .gm-legal-content table.gm-legal-table { width:100%;border-collapse:collapse;font-size:.78rem;margin:.5rem 0 1rem;border-radius:10px;overflow:hidden;border:1px solid rgba(43,11,57,.08) }
  .gm-legal-table th { background:rgba(43,11,57,.04);padding:.45rem .65rem;text-align:left;font-size:.62rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(43,11,57,.5);border-bottom:1px solid rgba(43,11,57,.08) }
  .gm-legal-table td { padding:.5rem .65rem;border-bottom:1px solid rgba(43,11,57,.05);vertical-align:top }
  .gm-legal-table tr:last-child td { border-bottom:none }
  .gm-legal-highlight { background:rgba(175,132,85,.1);border-left:3px solid #af8455;padding:.75rem 1rem;border-radius:0 8px 8px 0;margin:.5rem 0 1rem;font-size:.85rem }
  .gm-legal-btn { padding:.5rem 1rem;background:#2b0b39;color:#f0ebe3;border:none;border-radius:999px;font-family:inherit;font-size:.82rem;cursor:pointer;margin:.5rem 0 }
  .gm-legal-meta { font-size:.72rem;color:rgba(43,11,57,.4);margin-top:1.5rem;padding-top:.75rem;border-top:1px solid rgba(43,11,57,.06) }
`;
document.head.appendChild(gmLegalStyle);
