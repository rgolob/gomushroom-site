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
      url: '/en/learn/triple-extraction/',
      title: 'Triple Extraction: Why One Method Is Not Enough',
      desc: 'Why a single extraction method is not sufficient for medicinal mushrooms and how multi-stage extraction enables a broader spectrum of compounds.',
    },
    {
      url: '/en/learn/ultrasonic-extraction/',
      title: 'Ultrasonic Extraction of Medicinal Mushrooms',
      desc: 'How ultrasonic extraction improves mass transfer, opens the mushroom matrix and supports more efficient extraction of bioactive compounds.',
    },
    {
      url: '/en/learn/vacuum-concentration/',
      title: 'Vacuum Concentration of Mushroom Extracts',
      desc: 'Vacuum concentration is a critical step in medicinal mushroom extraction. Why large solvent volumes require careful concentration under reduced pressure.',
    },
    {
      url: '/en/learn/beta-glucans/',
      title: 'Beta-Glucans in Mushrooms: Not Just a Number',
      desc: 'What beta-glucans are in medicinal mushrooms, why their structure matters for extract quality, and why a single percentage on a certificate is not enough.',
    },
    {
      url: '/en/learn/reishi-research/',
      title: 'What Does Research Say About Reishi?',
      desc: 'What research shows for the immune system, sleep and gut microbiota — and where the data is still limited.',
    },
    {
      url: '/en/learn/chaga-research/',
      title: 'What Does Research Say About Chaga?',
      desc: 'Chaga from birch: antioxidant compounds, betulinic acid, digestive protection. What research actually shows — and where the data is still limited.',
    },
    {
      url: '/en/learn/lions-mane-research/',
      title: 'What Does Research Say About Lion\'s Mane?',
      desc: 'A review of hericenones, erinacines, NGF, cognitive function and nerve regeneration research.',
    },
    {
      url: '/en/learn/spruce-bud-extract/',
      title: 'Spruce Bud Extract: Beyond a Classic Tincture',
      desc: 'Most people know spruce buds as syrup. Why a controlled hydroethanolic extraction process is fundamentally different.',
    },
    {
      url: '/en/learn/spruce-bud-research/',
      title: 'What Does Research Say About Spruce Buds?',
      desc: 'A review of phenolic compounds, terpenes and what laboratory research actually shows — and where the data is limited.',
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
