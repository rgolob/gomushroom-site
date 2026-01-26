    // HERO slider
    (function(){
      const hero=document.querySelector('.hero');
      const slides=[...hero.querySelectorAll('.slide')];
      const dots=[...hero.querySelectorAll('.dot')];
      const prev=hero.querySelector('.arrow.prev');
      const next=hero.querySelector('.arrow.next');
      let i=0,t;
      const show=n=>{
        slides[i].classList.remove('active');
        dots[i].classList.remove('active');
        i=(n+slides.length)%slides.length;
        slides[i].classList.add('active');
        dots[i].classList.add('active');
      };
      const auto=()=>{clearInterval(t);t=setInterval(()=>show(i+1),5500)};
      prev && (prev.onclick=()=>{show(i-1);auto()});
      next && (next.onclick=()=>{show(i+1);auto()});
      dots.forEach((d,idx)=>d.onclick=()=>{show(idx);auto()});
      auto();
    })();

    // MOBILE NAV (hamburger)
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

    // STORITVE — klik prikaže full-width panel pod karticami
    (function(){
      const grid = document.getElementById('services-grid');
      const cards = [...grid.querySelectorAll('.card.service')];
      const panel = document.getElementById('service-detail');
      const panelContent = panel.querySelector('.content');
      const templates = {
        ekstrakcije: document.getElementById('tpl-ekstrakcije'),
        gojenje:     document.getElementById('tpl-gojenje'),
        botanicne:   document.getElementById('tpl-botanicne'),
      };

      function openPanel(key, card){
        cards.forEach(c=>c.classList.toggle('is-active', c===card));
        grid.classList.add('has-open');
        const tpl = templates[key];
        if(!tpl) return;
        panelContent.innerHTML = '';
        panelContent.appendChild(tpl.content.cloneNode(true));
        panel.classList.add('is-open');

        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
        requestAnimationFrame(()=>{
          const panelTop = panel.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: panelTop - headerHeight - 10, behavior: 'smooth' });
        });
      }

      function closePanel(){
        cards.forEach(c=>c.classList.remove('is-active'));
        grid.classList.remove('has-open');
        panel.classList.remove('is-open');
        panelContent.innerHTML = '';
      }

      cards.forEach(card=>{
        card.addEventListener('click', (e)=>{
          if((e.target.tagName||'').toLowerCase()==='a') return;
          const key = card.getAttribute('data-service');
          if(card.classList.contains('is-active')) closePanel();
          else openPanel(key, card);
        });
        card.setAttribute('tabindex','0');
        card.setAttribute('role','button');
        card.addEventListener('keydown', e=>{
          if(e.key==='Enter'||e.key===' ') { e.preventDefault(); card.click(); }
        });
      });

      document.addEventListener('keydown', e=>{
        if(e.key==='Escape') closePanel();
      });
    })();

    // GALERIJA — "lock" overlay on desktop; on phone expand the clicked figure fullscreen (same element, no separate modal)
    (function(){
      const items=[...document.querySelectorAll('.g-item')];
      const backdrop = document.getElementById('gallery-backdrop');

      function isMobile(){
        return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
      }

      function closeAll(except){
        items.forEach(it=>{ if(it!==except) it.classList.remove('is-open'); });
        document.body.classList.remove('gallery-open');
      }

      function openItem(it){
        closeAll(it);
        it.classList.add('is-open');
        if(isMobile()) document.body.classList.add('gallery-open');
      }

      function closeItem(it){
        it.classList.remove('is-open');
        document.body.classList.remove('gallery-open');
      }

      items.forEach(it=>{
        const closeBtn = it.querySelector('.g-close');

        it.addEventListener('click', (e)=>{
          // če klikneš close gumb, zapri
          if(e.target === closeBtn) return;
          const open=it.classList.contains('is-open');
          if(open) closeItem(it);
          else openItem(it);
        });

        closeBtn?.addEventListener('click', (e)=>{
          e.stopPropagation();
          closeItem(it);
        });

        it.setAttribute('tabindex','0');
        it.setAttribute('role','button');
        it.addEventListener('keydown', e=>{
          if(e.key==='Enter'||e.key===' ') { e.preventDefault(); it.click(); }
        });
      });

      backdrop?.addEventListener('click', ()=>closeAll());

      document.addEventListener('keydown', e=>{
        if(e.key==='Escape') closeAll();
      });

      window.addEventListener('resize', ()=>{
        // če se spremeni breakpoint, očisti fullscreen stanje
        if(!isMobile()) document.body.classList.remove('gallery-open');
      });
    })();

    // REFERENCE – hover + click, open one at a time
    (function(){
      const refs=[...document.querySelectorAll('.card.ref')];
      function closeAll(except){
        refs.forEach(c=>{
          if(c!==except){
            c.classList.remove('is-open');
            c.setAttribute('aria-expanded','false');
          }
        });
      }
      function toggle(card){
        const open=card.classList.contains('is-open');
        if(open){
          card.classList.remove('is-open');
          card.setAttribute('aria-expanded','false');
        } else {
          closeAll(card);
          card.classList.add('is-open');
          card.setAttribute('aria-expanded','true');
          if(window.innerWidth<900){
            card.scrollIntoView({behavior:'smooth',block:'center'});
          }
        }
      }
      refs.forEach(card=>{
        card.addEventListener('click',e=>{
          const t=(e.target.tagName||'').toLowerCase();
          if(t==='a') return;
          toggle(card);
        });
        card.setAttribute('tabindex','0');
        card.setAttribute('role','button');
        card.addEventListener('keydown',e=>{
          if(e.key==='Enter'||e.key===' '){
            e.preventDefault(); toggle(card);
          }
        });
      });
    })();

    // O MENI — drawer/modal
    (function(){
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

          const clean = window.location.pathname + window.location.search;
          history.replaceState(null, '', clean);

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

      overlay?.addEventListener('click', closeModal);
      closeBtn?.addEventListener('click', closeModal);
      xBtn?.addEventListener('click', closeModal);

      document.addEventListener('keydown', (e)=>{
        if(!modal.classList.contains('is-open')) return;

        if(e.key === 'Escape'){
          e.preventDefault();
          closeModal();
          return;
        }

        if(e.key === 'Tab'){
          const focusables = [...modal.querySelectorAll(focusableSelector)]
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

      if(window.location.hash === '#o-meni'){
        openModal();
      } else {
        setOpenState(false);
      }
    })();

document.querySelectorAll('.card.service').forEach(card => {
  const img = card.querySelector('.media img');
  if (!img) return;
  const src = img.currentSrc || img.src;
  card.style.setProperty('--card-img', `url("${src}")`);
});

(function () {
  const GA_ID = "G-L2PGE7VDHB";
  let loaded = false;

  function loadGA() {
    if (loaded) return;
    loaded = true;

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
  }

  // po prvi interakciji
  ["scroll","click","touchstart","keydown"].forEach(evt => {
    window.addEventListener(evt, loadGA, { once: true, passive: true });
  });

  // fallback po 4s
  setTimeout(loadGA, 4000);
})();
