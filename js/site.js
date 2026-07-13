/* =========================
   HERO slider
========================= */
(function(){
  const hero = document.querySelector('.hero');
  if(!hero) return;

  const slides = Array.from(hero.querySelectorAll('.slides .slide'));
  const dots   = Array.from(hero.querySelectorAll('.dots .dot'));
  const prev   = hero.querySelector('.arrow.prev');
  const next   = hero.querySelector('.arrow.next');

  // guard: brez crasha, če ni slajdov ali se dots ne ujemajo
  if(slides.length < 2 || dots.length !== slides.length) return;

  let i = 0, t;

  const show = (n) => {
    slides[i].classList.remove('active');
    dots[i].classList.remove('active');

    i = (n + slides.length) % slides.length;

    slides[i].classList.add('active');
    dots[i].classList.add('active');
  };

  const auto = () => {
    clearInterval(t);
    t = setInterval(() => show(i + 1), 5500);
  };

  if(prev) prev.addEventListener('click', () => { show(i - 1); auto(); });
  if(next) next.addEventListener('click', () => { show(i + 1); auto(); });

  dots.forEach((d, idx) => {
    d.addEventListener('click', () => { show(idx); auto(); });
  });

  auto();
})();


/* =========================
   MOBILE NAV (hamburger)
========================= */
(function(){
  const header = document.getElementById('site-header');
  const btn = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  if(!header || !btn || !nav) return;

  function setOpen(open){
    header.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', ()=>{
    const open = !header.classList.contains('nav-open');
    setOpen(open);
  });

  // close when clicking a link (mobile)
  nav.addEventListener('click', (e)=>{
    const a = e.target.closest('a');
    if(!a) return;
    setOpen(false);
  });

  // close on outside click
  document.addEventListener('click', (e)=>{
    if(!header.classList.contains('nav-open')) return;
    if(header.contains(e.target)) return;
    setOpen(false);
  });

  // close on ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') setOpen(false);
  });
})();



/* =========================
   GALERIJA — desktop overlay / mobile fullscreen
========================= */
(function(){
  const items = Array.from(document.querySelectorAll('.g-item'));
  const backdrop = document.getElementById('gallery-backdrop');
  if(!items.length) return;

  const mobileOverlay = document.getElementById('g-mobile-overlay');
  const mobileClose   = document.getElementById('g-mobile-close');
  const mobileImg     = document.getElementById('g-mobile-img');
  const mobileTitle   = document.getElementById('g-mobile-title');
  const mobileText    = document.getElementById('g-mobile-text');

  function isDesktop(){
    return window.matchMedia && window.matchMedia('(min-width: 900px)').matches;
  }
  function isMobile(){
    return !isDesktop();
  }

  function closeMobileOverlay(){
    if(!mobileOverlay) return;
    mobileOverlay.classList.remove('is-open');
    mobileOverlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('gallery-open');
  }

  function openMobileOverlay(it){
    if(!mobileOverlay) return;
    const img = it.querySelector('img');
    const h4  = it.querySelector('h4') || it.querySelector('h3');
    const p   = it.querySelector('p');
    mobileImg.src   = img ? img.src : '';
    mobileImg.alt   = img ? img.alt : '';
    mobileTitle.textContent = h4 ? h4.textContent : '';
    mobileText.textContent  = p  ? p.textContent  : '';
    mobileOverlay.classList.add('is-open');
    mobileOverlay.setAttribute('aria-hidden','false');
    document.body.classList.add('gallery-open');
  }

  function closeAll(except){
    items.forEach(it => { if(it !== except) it.classList.remove('is-open'); });
    closeMobileOverlay();
  }

  function openItem(it){
    closeAll(it);
    it.classList.add('is-open');
    if(isMobile()) openMobileOverlay(it);
  }

  function closeItem(it){
    it.classList.remove('is-open');
    closeMobileOverlay();
  }

  items.forEach(it=>{
    const closeBtn = it.querySelector('.g-close');

    it.addEventListener('click', (e)=>{
      if(closeBtn && (e.target === closeBtn || closeBtn.contains(e.target))) return;
      const open = it.classList.contains('is-open');
      if(open) closeItem(it);
      else openItem(it);
    });

    if(closeBtn){
      closeBtn.addEventListener('click', (e)=>{
        e.stopPropagation();
        closeItem(it);
      });
    }

    it.setAttribute('tabindex','0');
    it.setAttribute('role','button');
    it.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.click(); }
    });
  });

  if(mobileClose) mobileClose.addEventListener('click', ()=>{ closeAll(); });
  if(backdrop) backdrop.addEventListener('click', ()=>closeAll());

  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') closeAll();
  });

  window.addEventListener('resize', ()=>{
    if(isDesktop()) closeMobileOverlay();
  });
})();


/* =========================
   REFERENCE – open one at a time
========================= */
(function(){
  const refs = Array.from(document.querySelectorAll('.card.ref'));
  if(!refs.length) return;

  function closeAll(except){
    refs.forEach(c=>{
      if(c !== except){
        c.classList.remove('is-open');
        c.setAttribute('aria-expanded','false');
      }
    });
  }

  function toggle(card){
    const open = card.classList.contains('is-open');
    if(open){
      card.classList.remove('is-open');
      card.setAttribute('aria-expanded','false');
    } else {
      closeAll(card);
      card.classList.add('is-open');
      card.setAttribute('aria-expanded','true');
      if(window.innerWidth < 900){
        card.scrollIntoView({behavior:'smooth', block:'center'});
      }
    }
  }

  refs.forEach(card=>{
    card.addEventListener('click', e=>{
      const t = (e.target.tagName || '').toLowerCase();
      if(t === 'a') return;
      toggle(card);
    });

    card.setAttribute('tabindex','0');
    card.setAttribute('role','button');
    card.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        toggle(card);
      }
    });
  });
})();


/* =========================
   O MENI — modal injection
   Injects modal HTML on pages that don't have it (e.g. /znanje/, articles)
========================= */
(function(){
  if(document.getElementById('about-modal')) return;
  const isSL = !(document.documentElement.lang||'').startsWith('en');

  const sl = {
    drawerLabel:'O meni', title:'O meni', closeLabel:'Zapri', closeBtn:'Zapri',
    p1:`Moje ime je <strong>Rok Golob</strong> in stojim za projektom <strong>GoMushroom</strong>.
        Po izobrazbi sem "skoraj kemijski tehnolog" — študij <strong>kemijske tehnologije</strong> je ostal malo
        <strong>brez pike na i</strong>. Ampak ravno način razmišljanja, ki ga prinese kemija in tehnologija procesov,
        je nekaj, kar me spremlja vsak dan: logika korakov, razumevanje topil, mase, pretokov in predvsem spoštovanje do detajlov.`,
    p2:`Že skoraj <strong>20 let</strong> delam v <strong>analitskem laboratoriju</strong> — in v analitiki
        <strong>še vedno delam tudi danes</strong>, v svoji redni službi. Analitika te hitro "vzgoji":
        rezultat je dober samo, če je <strong>ponovljiv</strong>, če je metoda smiselna, če razumeš vzorčenje, matriko
        in če imaš urejene zapise. Tam ni prostora za približke. In ravno ta disciplina je tudi razlog,
        da GoMushroom ni nastal kot hiter trend, ampak kot projekt, ki stoji na praksi in na sistemu.`,
    p3:`GoMushroom je zrasel iz radovednosti in iz želje, da bi izvlečke delal tako, kot bi si jih sam želel:
        brez napihnjenih obljub, z jasno logiko procesa in s fokusom na stabilnosti. Majhne serije mi omogočajo,
        da imam nadzor nad detajli — od surovine do končne stekleničke — in da vsako serijo postavim tako,
        da je primerljiva s prejšnjo.`,
    p4:`Najbolj me vleče "inženirski del" zgodbe: kako proces postaviti tako, da je učinkovit,
        nežen do občutljivih spojin in hkrati ponovljiv. Ko se vse sestavi — surovina, postopek,
        kontrolne točke, meritve in zapisi — dobiš izdelek, ki ni odvisen od sreče, ampak od sistema.
        To je tudi bistvo GoMushroom.`,
    pills:`<span class="pill">~20 let analitike</span>
           <span class="pill accent">Še vedno zaposlen v analitiki</span>
           <span class="pill">Procesna logika</span>
           <span class="pill accent">Sledljivost &amp; zapisi</span>
           <span class="pill">Majhne serije</span>`,
    focusH:'Fokus',
    f1:'<strong>Doslednost:</strong> rezultat je dober samo, če je ponovljiv.',
    f2:'<strong>Transparentnost:</strong> jasni koraki, brez praznih obljub.',
    f3:'<strong>Stabilnost:</strong> fokus na kontrolnih točkah skozi proces.',
    f4:'<strong>Butično:</strong> majhne serije, ročna kontrola in detajli.',
    email:'E-pošta'
  };

  const en = {
    drawerLabel:'About', title:'About', closeLabel:'Close', closeBtn:'Close',
    p1:`My name is <strong>Rok Golob</strong> and I'm the person behind <strong>GoMushroom</strong>.
        I'm "almost" a chemical engineer — I studied <strong>chemical engineering</strong> but never put the final dot on the i.
        Still, the way of thinking that chemistry and process engineering bring — logic of steps, understanding solvents, mass flows,
        and respect for details — is what I use every day.`,
    p2:`I've spent nearly <strong>20 years</strong> working in an <strong>analytical laboratory</strong> —
        and I still work in analytics today in my regular job. Analytics trains you fast:
        a result is only good if it's <strong>repeatable</strong>, if the method makes sense, if you understand sampling and matrix effects,
        and if your records are in order. There's no room for approximations. That discipline is exactly why GoMushroom
        wasn't built as a quick trend — but as a system-based project grounded in practice.`,
    p3:`GoMushroom grew out of curiosity and the desire to make extracts the way I would want them myself:
        without inflated claims, with a clear process logic, and with a focus on stability. Small batches let me control details —
        from raw material to the final bottle — and set each batch so it's comparable to the previous one.`,
    p4:`What pulls me the most is the "engineering" part: how to design a process that is efficient, gentle to sensitive compounds,
        and still repeatable. When everything comes together — raw material, procedure, control points, measurements and records —
        you get a product that doesn't depend on luck, but on a system. That's the essence of GoMushroom.`,
    pills:`<span class="pill">~20 years in analytics</span>
           <span class="pill accent">Still working in analytics</span>
           <span class="pill">Process logic</span>
           <span class="pill accent">Traceability &amp; records</span>
           <span class="pill">Small batches</span>`,
    focusH:'Focus',
    f1:'<strong>Consistency:</strong> a result is only good if it\'s repeatable.',
    f2:'<strong>Transparency:</strong> clear steps, no empty promises.',
    f3:'<strong>Stability:</strong> focus on control points throughout the process.',
    f4:'<strong>Boutique:</strong> small batches, manual control and details.',
    email:'Email'
  };

  const t = isSL ? sl : en;

  const html = `
  <div class="about-modal" id="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title" aria-hidden="true">
    <div class="about-overlay" id="about-overlay" tabindex="-1"></div>
    <div class="about-drawer" role="document" aria-label="${t.drawerLabel}">
      <div class="about-top">
        <div class="ttl">
          <strong id="about-title">${t.title}</strong>
          <span>Rok Golob — GoMushroom</span>
        </div>
        <button class="icon-btn" type="button" id="about-x" aria-label="${t.closeLabel}">×</button>
      </div>
      <div class="about-scroll" id="about-scroll">
        <div class="about-card">
          <div class="about-hero"><div class="about-ph"><img src="/assets/rok.webp" alt="Rok"></div></div>
          <div class="about-body">
            <h3>Rok Golob — GoMushroom</h3>
            <p>${t.p1}</p>
            <p>${t.p2}</p>
            <p>${t.p3}</p>
            <p>${t.p4}</p>
            <div class="pill-row">${t.pills}</div>
            <div class="about-actions">
              <button class="btn ghost" type="button" id="about-close">${t.closeBtn}</button>
              <a class="btn brand" href="https://wa.me/message/3U7XJG5NK3IPN1" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a class="btn ghost" href="mailto:info@gomushroom.si">${t.email}</a>
            </div>
          </div>
        </div>
        <div class="about-card">
          <div class="about-body">
            <h3>${t.focusH}</h3>
            <ul class="meta" style="margin:0;padding-left:0;list-style:none">
              <li class="li-icon"><svg class="ico"><use href="#i-shield"/></svg>${t.f1}</li>
              <li class="li-icon"><svg class="ico"><use href="#i-shield"/></svg>${t.f2}</li>
              <li class="li-icon"><svg class="ico"><use href="#i-shield"/></svg>${t.f3}</li>
              <li class="li-icon"><svg class="ico"><use href="#i-drop"/></svg>${t.f4}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
})();

/* =========================
   O MENI — drawer/modal
========================= */
document.addEventListener('DOMContentLoaded', function(){
  const link = document.getElementById('nav-about');
  const modal = document.getElementById('about-modal');
  const overlay = document.getElementById('about-overlay');
  const closeBtn = document.getElementById('about-close');
  const xBtn = document.getElementById('about-x');
  const scrollEl = document.getElementById('about-scroll');

  if(!link || !modal) return;

  let lastFocus = null;
  let prevOverflow = '';

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function setOpenState(isOpen){
    if(isOpen){
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden','false');
      link.setAttribute('aria-expanded','true');

      prevOverflow = document.documentElement.style.overflow || '';
      document.documentElement.style.overflow = 'hidden';

      if(scrollEl) scrollEl.scrollTop = 0;

      requestAnimationFrame(()=>{
        const first = modal.querySelector(focusableSelector);
        (first || xBtn || closeBtn || modal).focus?.();
      });

      history.replaceState(null, '', '#o-meni');
    } else {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden','true');
      link.setAttribute('aria-expanded','false');

      document.documentElement.style.overflow = prevOverflow;

      // hash pobriši samo, če je res odprt modal preko #o-meni
      if (window.location.hash === '#o-meni') {
        const clean = window.location.pathname + window.location.search;
        history.replaceState(null, '', clean);
      }

      if(lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }
  }

  function openModal(){
    lastFocus = document.activeElement;
    setOpenState(true);
  }

  function closeModal(){
    setOpenState(false);
  }

  link.addEventListener('click', (e)=>{
    e.preventDefault();
    openModal();
  });

  if(overlay) overlay.addEventListener('click', closeModal);
  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  if(xBtn) xBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e)=>{
    if(!modal.classList.contains('is-open')) return;

    if(e.key === 'Escape'){
      e.preventDefault();
      closeModal();
      return;
    }

    if(e.key === 'Tab'){
      const focusables = Array.from(modal.querySelectorAll(focusableSelector))
        .filter(el => el.offsetParent !== null);

      if(focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if(e.shiftKey && document.activeElement === first){
        e.preventDefault();
        last.focus();
      } else if(!e.shiftKey && document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    }
  });

  // začetno stanje brez brisanja drugih hash povezav
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
  link.setAttribute('aria-expanded','false');

  if(window.location.hash === '#o-meni'){
    openModal();
  }
});

/* =========================
   SERVICES — panel under cards (EN homepage)
========================= */
(function(){
  const grid  = document.getElementById('services-grid');
  const panel = document.getElementById('service-detail');
  if(!grid || !panel) return;

  const panelContent = panel.querySelector('.content');
  if(!panelContent) return;

  const cards = Array.from(grid.querySelectorAll('.card.service'));
  if(!cards.length) return;

  const templates = {
    ekstrakcije: document.getElementById('tpl-ekstrakcije'),
    gojenje:     document.getElementById('tpl-gojenje'),
    botanicne:   document.getElementById('tpl-botanicne'),
  };

  function openPanel(key, card){
    cards.forEach(c => c.classList.toggle('is-active', c === card));
    grid.classList.add('has-open');

    const tpl = templates[key];
    if(!tpl || !tpl.content) return;

    panelContent.innerHTML = '';
    panelContent.appendChild(tpl.content.cloneNode(true));

    const closeRow = document.createElement('div');
    closeRow.className = 'service-detail-close';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '× Close';
    closeBtn.addEventListener('click', () => closePanel(true));
    closeRow.appendChild(closeBtn);
    panelContent.appendChild(closeRow);

    panel.classList.add('is-open');

    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    requestAnimationFrame(()=>{
      const panelTop = panel.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: panelTop - headerHeight - 10, behavior: 'smooth' });
    });
  }

  function closePanel(scrollBack = false){
    const activeCard = grid.querySelector('.card.service.is-active');
    cards.forEach(c => c.classList.remove('is-active'));
    grid.classList.remove('has-open');
    panel.classList.remove('is-open');
    panelContent.innerHTML = '';
    if (scrollBack && activeCard) {
      const headerH = document.querySelector('#site-header')?.offsetHeight || 60;
      window.scrollTo({ top: activeCard.getBoundingClientRect().top + window.scrollY - headerH - 16, behavior: 'smooth' });
    }
  }

  cards.forEach(card=>{
    card.addEventListener('click', (e)=>{
      if((e.target.tagName || '').toLowerCase() === 'a') return;

      const key = card.getAttribute('data-service');
      if(card.classList.contains('is-active')) closePanel();
      else openPanel(key, card);
    });

    card.setAttribute('tabindex','0');
    card.setAttribute('role','button');
    card.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') closePanel();
  });
})();

/* =========================
   Card image CSS var (safety)
========================= */
(function(){
  const cards = document.querySelectorAll('.card.service');
  if(!cards.length) return;

  cards.forEach(card => {
    const img = card.querySelector('.media img');
    if(!img) return;
    const src = img.currentSrc || img.src;
    if(!src) return;
    card.style.setProperty('--card-img', `url("${src}")`);
  });
})();


/* =========================
   QC tezke kovine
========================= */
  (function () {
    const root = document.getElementById('qc-tezke-kovine');
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll('.qc-tab[role="tab"]'));
    const panels = Array.from(root.querySelectorAll('.qc-panel[role="tabpanel"]'));

    function activateTab(tab) {
      const targetId = tab.getAttribute('aria-controls');
      const targetPanel = root.querySelector('#' + CSS.escape(targetId));
      if (!targetPanel) return;

      // Update tabs
      tabs.forEach(t => {
        const isActive = (t === tab);
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        // roving tabindex for accessibility
        t.tabIndex = isActive ? 0 : -1;
      });

      // Update panels
      panels.forEach(p => {
        const isActive = (p === targetPanel);
        p.classList.toggle('is-active', isActive);
        p.hidden = !isActive;
      });
    }

    // Click
    tabs.forEach(tab => {
      tab.addEventListener('click', () => activateTab(tab));

      // Keyboard navigation (Left/Right/Home/End)
      tab.addEventListener('keydown', (e) => {
        const idx = tabs.indexOf(tab);
        if (idx === -1) return;

        let nextIdx = null;
        if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
        if (e.key === 'ArrowLeft')  nextIdx = (idx - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') nextIdx = 0;
        if (e.key === 'End')  nextIdx = tabs.length - 1;

        if (nextIdx !== null) {
          e.preventDefault();
          tabs[nextIdx].focus();
          activateTab(tabs[nextIdx]);
        }
      });
    });

    // Ensure initial state is consistent
    const initial = root.querySelector('.qc-tab.is-active') || tabs[0];
    if (initial) activateTab(initial);
  })();

/* =========================
   Article notice (new article)
========================= */
(function(){
  // ── CONFIG — posodobi ob vsakem novem članku ──────────────────
  const NOTICE = {
    id:   'gm_notice_v4',   // povečaj za ponastavitev pri vsakem novem članku
    days: 7,                // koliko dni je obvestilo vidno
    sl: {
      label: 'Nov članek',
      title: 'Trojna ekstrakcija medicinskih gob: alkohol, voda in tlak v enem postopku',
      url:   '/znanje/trojna-ekstrakcija/',
      cta:   'Preberi →'
    },
    en: {
      label: 'New article',
      title: 'Triple extraction of medicinal mushrooms: alcohol, water and pressure in one process',
      url:   '/en/learn/triple-extraction/',
      cta:   'Read →'
    }
  };
  // ─────────────────────────────────────────────────────────────

  const stored = localStorage.getItem(NOTICE.id);
  if (stored === 'dismissed') return;

  const now = Date.now();
  if (stored) {
    if (now - parseInt(stored, 10) > NOTICE.days * 86400000) return;
  } else {
    localStorage.setItem(NOTICE.id, now.toString());
  }

  const isEn = (document.documentElement.lang || '').startsWith('en');
  const t = isEn ? NOTICE.en : NOTICE.sl;

  if (window.location.pathname === t.url) return;

  const el = document.createElement('div');
  el.className = 'article-notice';
  el.setAttribute('role', 'complementary');
  el.innerHTML =
    '<div class="article-notice__icon" aria-hidden="true">📄</div>' +
    '<div class="article-notice__body">' +
      '<p class="article-notice__label">' + t.label + '</p>' +
      '<p class="article-notice__title">' + t.title + '</p>' +
      '<a class="article-notice__link" href="' + t.url + '">' + t.cta + '</a>' +
    '</div>' +
    '<button class="article-notice__close" type="button" aria-label="Zapri">×</button>';

  el.querySelector('.article-notice__close').addEventListener('click', function(){
    localStorage.setItem(NOTICE.id, 'dismissed');
    el.style.cssText += ';opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s';
    setTimeout(function(){ el.remove(); }, 220);
  });

  setTimeout(function(){ document.body.appendChild(el); }, 1200);
})();


/* =========================
   Članki  — progress bar
========================= */
document.addEventListener("scroll", function () {
  const article = document.querySelector(".article-shell");
  const progress = document.querySelector(".reading-progress");

  if (!article || !progress) return;

  const articleTop = article.offsetTop;
  const articleHeight = article.offsetHeight;
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;

  const start = articleTop;
  const end = articleTop + articleHeight - windowHeight;

  let percent = ((scrollY - start) / (end - start)) * 100;
  percent = Math.max(0, Math.min(100, percent));

  progress.style.width = percent + "%";
});


/* =========================
   GA4 — scroll depth na člankih
========================= */
(function () {
  if (!document.querySelector('.article-shell')) return;

  const milestones = [25, 50, 75, 100];
  const fired = new Set();

  document.addEventListener('scroll', function () {
    if (!window.gtag) return;

    const article = document.querySelector('.article-shell');
    if (!article) return;

    const articleTop = article.offsetTop;
    const articleHeight = article.offsetHeight;
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const end = articleTop + articleHeight - windowHeight;

    let pct = ((scrollY - articleTop) / (end - articleTop)) * 100;
    pct = Math.max(0, Math.min(100, pct));

    for (const m of milestones) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        gtag('event', 'scroll_depth', { percent_scrolled: m });
      }
    }
  }, { passive: true });
})();


/* =========================
   GA4 — outbound link kliki
========================= */
document.addEventListener('click', function (e) {
  if (!window.gtag) return;
  const a = e.target.closest('a[href]');
  if (!a) return;
  try {
    const url = new URL(a.href);
    if (url.hostname && url.hostname !== location.hostname) {
      gtag('event', 'click', {
        event_category: 'outbound',
        event_label: a.href,
        transport_type: 'beacon'
      });
    }
  } catch {}
});

// Agregatna ocena strank (GoMushroom tinkture) - samo stevilka, brez citatov
(function () {
  const mount = document.getElementById('gm-home-rating');
  if (!mount) return;
  const SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
  const SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
  fetch(`${SB_URL}/rest/v1/gm_reviews?status=eq.approved&select=rating`, {
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
  })
    .then(r => r.ok ? r.json() : [])
    .then(rows => {
      if (!rows || !rows.length) return;
      const avg = rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length;
      const full = Math.round(avg);
      const stars = '★'.repeat(full) + '☆'.repeat(5 - full);
      const label = rows.length === 1 ? 'oceno' : rows.length < 5 ? 'ocene' : 'ocen';
      mount.innerHTML = `<span class="stars">${stars}</span><span class="avg">${avg.toFixed(1)}</span><span class="count">${rows.length} ${label} strank</span>`;
      mount.classList.add('is-visible');
    })
    .catch(() => {});
})();
