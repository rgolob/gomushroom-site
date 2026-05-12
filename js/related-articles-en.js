// GoMushroom — dynamic related articles (EN)
(function(){
  var ARTICLES = [
    {
      url: '/en/learn/what-is-extraction/',
      title: 'What Is Extraction?',
      desc: 'How compounds move from raw mushroom material into liquid, and why solvent, temperature and structure all matter.',
    },
    {
      url: '/en/learn/triple-extraction/',
      title: 'Triple Extraction of Medicinal Mushrooms',
      desc: 'Why one method is not enough and how multi-stage extraction captures a broader spectrum of compounds.',
    },
    {
      url: '/en/learn/ultrasonic-extraction/',
      title: 'Ultrasonic Extraction of Medicinal Mushrooms',
      desc: 'How acoustic cavitation improves mass transfer and supports more efficient extraction from the mushroom matrix.',
    },
    {
      url: '/en/learn/vacuum-concentration/',
      title: 'Vacuum Concentration of Extracts',
      desc: 'Why solvent removal is a critical step in producing a concentrated, usable extract.',
    },
    {
      url: '/en/learn/beta-glucans/',
      title: 'Beta-Glucans: What the Numbers Really Mean',
      desc: 'Why a single percentage does not tell the whole story of extract quality.',
    },
  ];

  function render(){
    var el = document.getElementById('related-articles-grid');
    if(!el) return;
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
