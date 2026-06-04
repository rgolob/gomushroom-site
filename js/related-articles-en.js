// GoMushroom — dynamic related articles (EN)
// Only include published (non-noindex) articles
(function(){
  var ARTICLES = [
    {
      url: '/en/learn/what-is-extraction/',
      title: 'What Is Extraction?',
      desc: 'How compounds move from solid material into liquid, and why solvent choice, temperature and structure all determine the final extract.',
    },
    {
      url: '/en/learn/spruce-bud-extract/',
      title: 'Spruce Bud Extract: Beyond a Classic Tincture',
      desc: 'Most people know spruce buds as syrup. Why a controlled hydroethanolic extraction process is fundamentally different.',
    },
    {
      url: '/en/learn/triple-extraction/',
      title: 'Triple Extraction of Medicinal Mushrooms: Alcohol, Water and Pressure in One Process',
      desc: 'Triple extraction of medicinal mushrooms combines alcohol, hot water and pressurised water extraction. Learn why a single method is often not enough.',
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
