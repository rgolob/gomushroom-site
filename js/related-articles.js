// GoMushroom — dinamični sorodnih članki
(function(){
  var ARTICLES = [
    {
      url: '/znanje/kaj-je-ekstrakcija/',
      title: 'Kaj je ekstrakcija?',
      desc: 'Kako se spojine prenesejo iz gobnega materiala v tekočino in zakaj metoda ekstrakcije opredeljuje končni produkt.',
    },
    {
      url: '/znanje/trojna-ekstrakcija/',
      title: 'Trojna ekstrakcija medicinskih gob',
      desc: 'Zakaj en sam ekstrakcijski postopek ni dovolj in kako večstopenjska ekstrakcija zajame širši spekter spojin.',
    },
    {
      url: '/znanje/ultrazvocna-ekstrakcija/',
      title: 'Ultrazvočna ekstrakcija medicinskih gob',
      desc: 'Kako ultrazvok z akustično kavitacijo izboljša masni prenos in učinkovitost ekstrakcije bioaktivnih spojin.',
    },
    {
      url: '/znanje/vakuumsko-koncentriranje/',
      title: 'Vakuumsko koncentriranje ekstraktov',
      desc: 'Zakaj je odstranjevanje topila ključen korak po ekstrakciji in kako vpliva na kakovost končnega ekstrakta.',
    },
    {
      url: '/znanje/beta-glukani/',
      title: 'Beta-glukani: kaj pomenijo in zakaj % ni dovolj',
      desc: 'Zakaj sama vsebnost beta-glukanov še ne pove celotne kakovosti ekstrakta medicinskih gob.',
    },
  ];

  function render(){
    var el = document.getElementById('related-articles-grid');
    if(!el) return;
    // normalize current path to always end with /
    var path = (window.location.pathname + '/').replace(/\/\/$/, '/');
    var related = ARTICLES.filter(function(a){ return a.url !== path; });
    if(!related.length) return;
    el.innerHTML = related.map(function(a){
      return '<a class="article-card article-card--bg" href="' + a.url + '">'
        + '<strong>' + a.title + '</strong>'
        + '<p>' + a.desc + '</p>'
        + '</a>';
    }).join('');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
