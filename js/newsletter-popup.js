// ── Popup za e-novice ──────────────────────────────────────────────────────
//
// Obiskovalec pusti e-naslov, v zameno dobi kodo za popust pri prvem nakupu.
// Kodo izda netlify/functions/newsletter-signup; tu ne nastaja nič, kar bi
// bilo vredno denarja.
//
// Kdaj se prikaze
// ───────────────
//   • sele po zamiku ali po dovolj prevrtene strani, nikoli takoj;
//   • sele ko je obiskovalec odgovoril na piskotno pasico, sicer bi se
//     prekrivali (pasica je na z-index 9999);
//   • ne v kosarici in ne na blagajni — kdor kupuje, naj kupi;
//   • ne, ce ga je ze zaprl (miruje nekaj dni) ali ce se je ze prijavil.
//
// Nastavitve pridejo iz gm_settings.enovicePopup, da se veljavnost, odstotek
// in casi dajo spreminjati brez objave nove razlicice strani.

(function () {
  'use strict';

  var SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co';
  var SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';

  var KLJUC_ZAPRT = 'gm_nl_zaprt';
  var KLJUC_PRIJAVLJEN = 'gm_nl_prijavljen';

  var PRIVZETO = {
    aktiven: true, pct: 10, veljavnostDni: 90,
    zamikSek: 25, scrollPct: 45, ponovnoCezDni: 7
  };

  var DROBNO = 'S prijavo se strinjate s prejemanjem e-novic GoMushroom. ' +
               'Odjavite se lahko kadarkoli. Več v Politiki zasebnosti.';

  // ── Pomozne ──────────────────────────────────────────────────────────────
  function preberi(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function zapisi(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // analytics.js definira gmTrack, ki sam preveri privolitev. Ce ga se ni
  // (nalozi se odlozeno), dogodek tiho izpustimo — brez lastnega gtag klica,
  // da privolitve ne obidemo mimo enega samega mesta, kjer se preverja.
  function sledi(ime, params) {
    if (typeof gmTrack === 'function') gmTrack(ime, params || {});
  }

  function jeVeljavenEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // ── Ali se sme prikazati ─────────────────────────────────────────────────
  function sePrikaze(nastavitve) {
    if (!nastavitve.aktiven) return false;
    if (preberi(KLJUC_PRIJAVLJEN)) return false;

    var zaprt = Number(preberi(KLJUC_ZAPRT) || 0);
    if (zaprt) {
      var mirujeDo = zaprt + (Number(nastavitve.ponovnoCezDni) || 7) * 86400000;
      if (Date.now() < mirujeDo) return false;
    }
    return true;
  }

  function jeNakupovalnaPot() {
    var p = location.pathname;
    return p.indexOf('/trgovina/kosarica') === 0 || p.indexOf('/trgovina/blagajna') === 0;
  }

  // Piskotna pasica je na z-index 9999 in bi nas prekrila. Cakamo, da
  // obiskovalec odgovori — takrat se pasica odstrani iz DOM.
  function piskotkiUrejeni() {
    if (preberi('gm_cookie_consent')) return true;
    return !document.getElementById('gm-cookie-banner');
  }

  // ── Nastavitve ───────────────────────────────────────────────────────────
  function naloziNastavitve() {
    return fetch(SB_URL + '/rest/v1/gm_settings?key=eq.enovicePopup&select=value', {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (vrstice) {
        if (!vrstice.length) return Object.assign({}, PRIVZETO);
        var v = vrstice[0].value;
        try { v = typeof v === 'string' ? JSON.parse(v) : v; } catch (e) { v = {}; }
        return Object.assign({}, PRIVZETO, v);
      })
      .catch(function () { return Object.assign({}, PRIVZETO); });
  }

  // ── Izris ────────────────────────────────────────────────────────────────
  function odpri(nastavitve) {
    if (document.getElementById('gm-nl')) return;

    var pct = Number(nastavitve.pct) || 10;

    var ovoj = document.createElement('div');
    ovoj.id = 'gm-nl';
    ovoj.className = 'gm-nl';
    ovoj.setAttribute('role', 'dialog');
    ovoj.setAttribute('aria-modal', 'true');
    ovoj.setAttribute('aria-labelledby', 'gm-nl-naslov');

    ovoj.innerHTML =
      '<div class="gm-nl-okno">' +
        '<button type="button" class="gm-nl-zapri" aria-label="Zapri">&times;</button>' +
        '<div id="gm-nl-vsebina">' +
          '<h2 class="gm-nl-naslov" id="gm-nl-naslov">' + pct + ' % za vaš prvi nakup</h2>' +
          '<p class="gm-nl-besedilo">Vpišite svoj e-mail in prejmite kodo za ' + pct +
            ' % popusta na prvo naročilo. Občasno vam bomo poslali tudi vsebine o gobah, ' +
            'ekstrakciji in novostih GoMushroom.</p>' +
          '<form class="gm-nl-vrsta" id="gm-nl-obrazec" novalidate>' +
            '<input type="text" class="gm-nl-med" id="gm-nl-med" name="website" ' +
              'tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<input type="email" class="gm-nl-vnos" id="gm-nl-email" name="email" ' +
              'placeholder="Vaš e-mail" autocomplete="email" required ' +
              'aria-label="Vaš e-mail">' +
            '<button type="submit" class="btn brand gm-nl-gumb" id="gm-nl-poslji">' +
              'Pridobi ' + pct + ' % popust</button>' +
          '</form>' +
          '<p class="gm-nl-napaka" id="gm-nl-napaka" role="alert" hidden></p>' +
          '<p class="gm-nl-drobno">S prijavo se strinjate s prejemanjem e-novic GoMushroom. ' +
            'Odjavite se lahko kadarkoli. Več v ' +
            '<a href="#" id="gm-nl-zasebnost">Politiki zasebnosti</a>.</p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(ovoj);
    requestAnimationFrame(function () { ovoj.classList.add('je-odprt'); });

    var email = ovoj.querySelector('#gm-nl-email');
    if (email) setTimeout(function () { email.focus(); }, 320);

    sledi('newsletter_popup_view', { source: 'first_purchase_popup' });

    // ── Zapiranje ──────────────────────────────────────────────────────────
    function zapri(razlog) {
      if (!document.getElementById('gm-nl')) return;
      zapisi(KLJUC_ZAPRT, String(Date.now()));
      sledi('newsletter_popup_close', { source: 'first_purchase_popup', method: razlog });
      ovoj.classList.remove('je-odprt');
      document.removeEventListener('keydown', naTipko);
      setTimeout(function () { ovoj.remove(); }, 300);
    }

    function naTipko(e) { if (e.key === 'Escape') zapri('escape'); }

    ovoj.querySelector('.gm-nl-zapri').addEventListener('click', function () { zapri('gumb'); });
    ovoj.addEventListener('click', function (e) { if (e.target === ovoj) zapri('ozadje'); });
    document.addEventListener('keydown', naTipko);

    // Politika zasebnosti ni samostojna stran, ampak predal, ki ga odpre
    // js/legal.js. Ce se ta se ni nalozil, raje ne naredimo nicesar, kot da
    // popup zapremo v prazno.
    ovoj.querySelector('#gm-nl-zasebnost').addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof gmShowLegal === 'function') gmShowLegal('politika-zasebnosti');
    });

    // ── Oddaja ─────────────────────────────────────────────────────────────
    ovoj.querySelector('#gm-nl-obrazec').addEventListener('submit', function (e) {
      e.preventDefault();

      var vnos = ovoj.querySelector('#gm-nl-email');
      var gumb = ovoj.querySelector('#gm-nl-poslji');
      var napaka = ovoj.querySelector('#gm-nl-napaka');
      var naslov = String(vnos.value || '').trim();

      function pokaziNapako(besedilo) {
        napaka.textContent = besedilo;
        napaka.hidden = false;
        vnos.setAttribute('aria-invalid', 'true');
      }

      napaka.hidden = true;
      vnos.removeAttribute('aria-invalid');

      if (!jeVeljavenEmail(naslov)) {
        pokaziNapako('Vpišite veljaven e-naslov.');
        vnos.focus();
        return;
      }

      gumb.disabled = true;
      gumb.textContent = 'Pošiljam…';

      fetch('/.netlify/functions/newsletter-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: naslov,
          website: ovoj.querySelector('#gm-nl-med').value,
          consentText: DROBNO
        })
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (o) {
          if (!o.ok) throw new Error(o.d && o.d.error ? o.d.error : 'Prijava ni uspela');

          // Ce je naslov ze prijavljen in njegova koda ne zivi vec, sporocila
          // ni bilo — takrat ne smemo trditi, da je koda na poti.
          var brezSporocila = !!(o.d && o.d.zePrijavljen);

          zapisi(KLJUC_PRIJAVLJEN, String(Date.now()));
          // E-naslova ne posiljamo v GA4 — samo, od kod je prijava prisla.
          sledi('newsletter_signup', { source: 'first_purchase_popup' });

          document.removeEventListener('keydown', naTipko);
          document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') { ovoj.classList.remove('je-odprt'); setTimeout(function () { ovoj.remove(); }, 300); }
          });

          ovoj.querySelector('#gm-nl-vsebina').innerHTML = brezSporocila
            ? '<div class="gm-nl-hvala">' +
                '<div class="gm-nl-ikona">&#x2714;&#xFE0F;</div>' +
                '<h2 class="gm-nl-naslov">Ta naslov je že prijavljen.</h2>' +
                '<p class="gm-nl-besedilo" style="margin-bottom:0">Koda, ki ste jo prejeli, ' +
                  'je bila že uporabljena ali je potekla. Pišite nam na ' +
                  '<a href="mailto:info@gomushroom.si" style="color:inherit">info@gomushroom.si</a> ' +
                  'in pogledamo, kaj se da narediti.</p>' +
              '</div>'
            : '<div class="gm-nl-hvala">' +
                '<div class="gm-nl-ikona">&#x2709;&#xFE0F;</div>' +
                '<h2 class="gm-nl-naslov">Hvala za prijavo.</h2>' +
                '<p class="gm-nl-besedilo" style="margin-bottom:0">Koda za ' + pct +
                  ' % popusta je že na poti v vaš e-poštni predal.</p>' +
              '</div>';

          // Zahvala se sama umakne; sporocilo o ze prijavljenem naslovu pa ne,
          // ker vsebuje e-naslov, ki si ga mora clovek prepisati.
          if (!brezSporocila) {
            setTimeout(function () {
              ovoj.classList.remove('je-odprt');
              setTimeout(function () { ovoj.remove(); }, 300);
            }, 4000);
          }
        })
        .catch(function (err) {
          gumb.disabled = false;
          gumb.textContent = 'Pridobi ' + pct + ' % popust';
          pokaziNapako(err.message === 'Failed to fetch'
            ? 'Povezava ni uspela. Poskusite znova.'
            : err.message);
        });
    });
  }

  // ── Sprozilca ────────────────────────────────────────────────────────────
  function pocakajInOdpri(nastavitve) {
    var sprozeno = false;
    var casPotekel = false;
    var cakalec = null;

    function sprozi() {
      if (sprozeno) return;
      if (!sePrikaze(nastavitve)) return;   // med cakanjem se je lahko prijavil
      if (!piskotkiUrejeni()) return;       // pasica se stoji — poskusimo kasneje
      sprozeno = true;
      window.removeEventListener('scroll', naPomik);
      clearInterval(cakalec);
      odpri(nastavitve);
    }

    function naPomik() {
      var visina = document.documentElement.scrollHeight - window.innerHeight;
      if (visina <= 0) return;
      var pct = (window.scrollY / visina) * 100;
      if (pct >= (Number(nastavitve.scrollPct) || 45)) sprozi();
    }

    window.addEventListener('scroll', naPomik, { passive: true });

    setTimeout(function () {
      casPotekel = true;
      sprozi();
    }, (Number(nastavitve.zamikSek) || 25) * 1000);

    // Ce je cas potekel, obiskovalec pa se ni odgovoril na piskotke, poskusimo
    // vsakih nekaj sekund se naprej, dokler pasice ni vec.
    cakalec = setInterval(function () {
      if (sprozeno) { clearInterval(cakalec); return; }
      if (casPotekel) sprozi();
    }, 3000);
  }

  function zacni() {
    // Domaca stran ima lang="sl-SI", vecina ostalih lang="sl" — zato predpona.
    if (String(document.documentElement.lang || '').toLowerCase().indexOf('sl') !== 0) return;
    if (jeNakupovalnaPot()) return;
    if (!sePrikaze(PRIVZETO)) return;  // hitri izhod, brez klica na bazo

    naloziNastavitve().then(function (nastavitve) {
      if (!sePrikaze(nastavitve)) return;
      pocakajInOdpri(nastavitve);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', zacni);
  } else {
    zacni();
  }
})();
