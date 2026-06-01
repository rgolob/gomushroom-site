// GoMushroom — dinamični sorodni članki
// Dodaj URL samo ko je clanek objavljen (brez noindex)
(function(){
  var ARTICLES = [
    {
      url: '/znanje/kaj-je-ekstrakcija/',
      title: 'Kaj je ekstrakcija?',
      desc: 'Kako se spojine prenesejo iz trdne snovi v topilo in zakaj ima postopek ekstrakcije neposreden vpliv na sestavo končnega ekstrakta.',
    },
    {
      url: '/znanje/beta-glukani-medicinske-gobe/',
      title: 'Beta-glukani v medicinskih gobah: kaj pomenijo in zakaj % ni dovolj',
      desc: 'Kaj so beta-glukani v medicinskih gobah, zakaj njihova struktura vpliva na kakovost ekstrakta in zakaj sam odstotek na analizi ni dovolj.',
    },
    {
      url: '/znanje/ekstrakt-smrekovih-vrsickov/',
      title: 'Ekstrakt smrekovih vršičkov: zakaj pri GoMushroom ne gre za klasično tinkturo',
      desc: 'Smrekovi vršički so več kot sirup. Zakaj je nadzorovan hidroetanolni ekstrakcijski proces bistveno drugačen od tradicionalnih pripravkov.',
    },
  ];

  function render(){
    var el = document.getElementById('related-articles-grid');
    if(!el) return;
    var path = (window.location.pathname + '/').replace(/\/\/$/, '/');
    var related = ARTICLES.filter(function(a){ return a.url !== path; });
    var section = el.closest('section');
    if(!related.length) {
      if(section) section.style.display = 'none';
      return;
    }
    var shuffled = related.slice().sort(function(){ return Math.random() - 0.5; });
    var toShow = shuffled.slice(0, 2);
    el.innerHTML = toShow.map(function(a){
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
