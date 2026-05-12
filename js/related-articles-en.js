// GoMushroom — dynamic related articles (EN)
// Only include published (non-noindex) articles
(function(){
  var ARTICLES = [
    {
      url: '/en/learn/what-is-extraction/',
      title: 'What Is Extraction?',
      desc: 'How compounds move from solid material into liquid, and why solvent choice, temperature and structure all determine the final extract.',
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
