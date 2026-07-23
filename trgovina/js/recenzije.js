// GoMushroom — Recenzije in IG akcije
// Vgradljiva skripta za produktne strani
(function(){
'use strict';

const SB_URL='https://rjscfndegqxuefffsedf.supabase.co';
const SB_KEY='sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa';
const SB_H={'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY};

const LANG=document.documentElement.lang==='en'?'en':'sl';
const T={
  sl:{
    h2:'Ocene strank', loading:'Nalagam ocene…', writeReview:'Napiši recenzijo',
    reviewSub:pct=>` — za vsako potrjeno oceno prejmete ${pct}% popust`,
    ratingLabel:'Ocena', starLabel:(i)=>`${i} zvezd${i===1?'a':i<5?'e':''}`, starsHint:'Izberite oceno',
    starsHintLevels:['','Slabo','Povprečno','Dobro','Zelo dobro','Odlično'],
    namePh:'Vaše ime *', emailPh:'E-mail (za kupon) *', titlePh:'Naslov recenzije', bodyPh:'Vaša izkušnja z izdelkom *',
    submitReview:'Pošlji recenzijo', sending:'Pošiljam…',
    igShare:'Deli na Instagramu', igSub:'— zasluži dodaten popust, sodeluj z nami na @gomushroom.si',
    igHandlePh:'@IG uporabniško ime *', igLinkPh:'Povezava do objave (neobvezno)',
    igSubmit:'Pošlji zahtevo', igCancel:'Prekliči',
    fillRequired:'Izpolnite vsa obvezna polja in izberite oceno.', fillRequiredIg:'Izpolnite vsa obvezna polja.',
    reviewSuccess:pct=>`✅ Hvala za recenzijo! Po pregledu boste na e-mail prejeli ${pct}% kupon za naslednji nakup.`,
    igSuccess:pct=>`✅ Zahteva poslana! Po preverjanju boste na e-mail prejeli ${pct}% kupon.`,
    sendError:'Napaka pri pošiljanju. Poskusite znova.', genericError:'Napaka. Poskusite znova.',
    noReviews:'Še ni ocen. Bodite prvi, ki delite izkušnjo!',
    anonymous:'Anonimno', reviewWord:n=>n===1?'recenzija':n<5?'recenzije':'recenzij',
    showMore:n=>`Prikaži vse recenzije (${n}) ↓`, dateLocale:'sl-SI',
    ig:[
      {id:'follow',  label:'Sledi profilu @gomushroom.si',       hint:'Sledi nam na Instagramu'},
      {id:'story',   label:'Označi nas v Instagram zgodbi',       hint:'@gomushroom.si v story + pošlji screenshot'},
      {id:'objavaLnk',label:'Ustvari objavo z linkom do profila',hint:'Objava z linkom na @gomushroom.si'},
      {id:'objavaTag',label:'Označi nas v objavi z našim produktom',hint:'Označi @gomushroom.si + #gomushroom'},
    ]
  },
  en:{
    h2:'Customer reviews', loading:'Loading reviews…', writeReview:'Write a review',
    reviewSub:pct=>` — get a ${pct}% discount for every approved review`,
    ratingLabel:'Rating', starLabel:(i)=>`${i} star${i===1?'':'s'}`, starsHint:'Select a rating',
    starsHintLevels:['','Poor','Average','Good','Very good','Excellent'],
    namePh:'Your name *', emailPh:'Email (for the coupon) *', titlePh:'Review title', bodyPh:'Your experience with the product *',
    submitReview:'Submit review', sending:'Sending…',
    igShare:'Share on Instagram', igSub:'— earn an extra discount, engage with us on @gomushroom.si',
    igHandlePh:'@IG username *', igLinkPh:'Link to the post (optional)',
    igSubmit:'Send request', igCancel:'Cancel',
    fillRequired:'Fill in all required fields and choose a rating.', fillRequiredIg:'Fill in all required fields.',
    reviewSuccess:pct=>`✅ Thanks for your review! Once approved, you'll receive a ${pct}% coupon by email for your next purchase.`,
    igSuccess:pct=>`✅ Request sent! Once verified, you'll receive a ${pct}% coupon by email.`,
    sendError:'Error sending. Please try again.', genericError:'Error. Please try again.',
    noReviews:'No reviews yet. Be the first to share your experience!',
    anonymous:'Anonymous', reviewWord:n=>n===1?'review':'reviews',
    showMore:n=>`Show all reviews (${n}) ↓`, dateLocale:'en-IE',
    ig:[
      {id:'follow',  label:'Follow @gomushroom.si',       hint:'Follow us on Instagram'},
      {id:'story',   label:'Tag us in an Instagram story', hint:'@gomushroom.si in your story + send a screenshot'},
      {id:'objavaLnk',label:'Create a post linking to our profile',hint:'Post with a link to @gomushroom.si'},
      {id:'objavaTag',label:'Tag us in a post with our product',hint:'Tag @gomushroom.si + #gomushroom'},
    ]
  }
}[LANG];

const DEFAULTS={recenzijaPct:10,igFollowPct:5,igStoryPct:10,igObjavaLnk:15,igObjavaTag:20};
let cfg=Object.assign({},DEFAULTS);

function igActions(){
  const pctById={follow:cfg.igFollowPct,story:cfg.igStoryPct,objavaLnk:cfg.igObjavaLnk,objavaTag:cfg.igObjavaTag};
  return T.ig.map(a=>Object.assign({},a,{pct:pctById[a.id]}));
}

async function loadSettings(){
  try{
    const r=await fetch(`${SB_URL}/rest/v1/gm_settings?key=eq.recenzijeNastavitve&select=value`,{headers:SB_H});
    if(!r.ok)return;
    const rows=await r.json();
    if(rows.length){
      const val=typeof rows[0].value==='string'?JSON.parse(rows[0].value):rows[0].value;
      Object.assign(cfg,val);
    }
  }catch{}
}

async function init(){
  const mount=document.getElementById('gm-recenzije');
  if(!mount)return;
  injectStyles();
  await loadSettings();
  const slug=(typeof PRODUCT_SLUG!=='undefined'?PRODUCT_SLUG:null)||
             document.getElementById('add-to-cart-btn')?.dataset.slug||'produkt';
  const productName=document.querySelector('.product-title')?.textContent?.trim()||slug;
  mount.innerHTML=buildHTML();
  bindEvents(slug,productName);
  loadReviews(slug);
}

function buildHTML(){
  return`<div class="gmr-wrap">
  <h2 class="gmr-h2">${T.h2}</h2>

  <div id="gmr-list"><div class="gmr-loading">${T.loading}</div></div>

  <!-- Recenzija -->
  <details class="gmr-card gmr-details">
    <summary class="gmr-details-sum">
      <span class="gmr-card-icon">✍️</span>
      <span>
        <strong class="gmr-h3">${T.writeReview}</strong>
        <span class="gmr-sub">${T.reviewSub(cfg.recenzijaPct)}</span>
      </span>
    </summary>
    <form id="gmr-form" novalidate style="margin-top:1.1rem">
      <div class="gmr-stars" role="group" aria-label="${T.ratingLabel}">
        ${[1,2,3,4,5].map(i=>`<button type="button" class="gmr-star" data-v="${i}" aria-label="${T.starLabel(i)}">★</button>`).join('')}
        <span class="gmr-stars-hint">${T.starsHint}</span>
      </div>
      <input type="hidden" id="gmr-rating" value="0">
      <div class="gmr-fields">
        <input class="gmr-input" type="text" id="gmr-name" placeholder="${T.namePh}" autocomplete="name">
        <input class="gmr-input" type="email" id="gmr-email" placeholder="${T.emailPh}" autocomplete="email">
        <input class="gmr-input" type="text" id="gmr-title" placeholder="${T.titlePh}">
        <textarea class="gmr-input gmr-ta" id="gmr-body" placeholder="${T.bodyPh}" rows="4"></textarea>
      </div>
      <button type="submit" class="gmr-btn-submit">${T.submitReview}</button>
      <div id="gmr-msg" class="gmr-msg"></div>
    </form>
  </details>

  <!-- Instagram -->
  <details class="gmr-card gmr-ig-card gmr-details">
    <summary class="gmr-details-sum">
      <span class="gmr-card-icon">📸</span>
      <span>
        <strong class="gmr-h3">${T.igShare}</strong>
        <span class="gmr-sub"> ${T.igSub}</span>
      </span>
    </summary>
    <div class="gmr-ig-actions" style="margin-top:1.1rem">
      ${igActions().map(a=>`
      <div class="gmr-ig-row">
        <div class="gmr-ig-info">
          <span class="gmr-ig-label">${a.label}</span>
          <span class="gmr-ig-hint">${a.hint}</span>
        </div>
        <button type="button" class="gmr-ig-btn" data-id="${a.id}" data-pct="${a.pct}">+${a.pct}% →</button>
      </div>`).join('')}
    </div>
    <form id="gmr-ig-form" class="gmr-ig-form" style="display:none" novalidate>
      <p id="gmr-ig-selected" class="gmr-ig-selected"></p>
      <input type="hidden" id="gmr-ig-id">
      <input type="hidden" id="gmr-ig-pct">
      <div class="gmr-fields">
        <input class="gmr-input" type="text" id="gmr-ig-name" placeholder="${T.namePh}" autocomplete="name">
        <input class="gmr-input" type="email" id="gmr-ig-email" placeholder="${T.emailPh}" autocomplete="email">
        <input class="gmr-input" type="text" id="gmr-ig-handle" placeholder="${T.igHandlePh}">
        <input class="gmr-input" type="url" id="gmr-ig-link" placeholder="${T.igLinkPh}">
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button type="submit" class="gmr-btn-submit">${T.igSubmit}</button>
        <button type="button" id="gmr-ig-cancel" class="gmr-btn-cancel">${T.igCancel}</button>
      </div>
      <div id="gmr-ig-msg" class="gmr-msg"></div>
    </form>
  </details>
</div>`;
}

function bindEvents(slug,productName){
  // Stars
  let sel=0;
  document.querySelectorAll('.gmr-star').forEach(btn=>{
    btn.addEventListener('mouseover',()=>paintStars(+btn.dataset.v));
    btn.addEventListener('mouseout',()=>paintStars(sel));
    btn.addEventListener('click',()=>{
      sel=+btn.dataset.v;
      document.getElementById('gmr-rating').value=sel;
      paintStars(sel);
      document.querySelector('.gmr-stars-hint').textContent=T.starsHintLevels[sel]||'';
    });
  });

  // Review form
  document.getElementById('gmr-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const rating=+document.getElementById('gmr-rating').value;
    const name=document.getElementById('gmr-name').value.trim();
    const email=document.getElementById('gmr-email').value.trim();
    const title=document.getElementById('gmr-title').value.trim();
    const body=document.getElementById('gmr-body').value.trim();
    const msg=document.getElementById('gmr-msg');
    if(!name||!email||!body||rating<1){
      showMsg(msg,T.fillRequired,'err');return;
    }
    const btn=e.target.querySelector('.gmr-btn-submit');
    btn.disabled=true;btn.textContent=T.sending;
    try{
      const r=await fetch(`${SB_URL}/rest/v1/gm_reviews`,{
        method:'POST',headers:{...SB_H,'Prefer':'return=minimal'},
        body:JSON.stringify({name,email,rating,title:title||null,body,
          product_id:slug,product_name:productName,
          status:'pending',coupon_pct:cfg.recenzijaPct,
          created_at:new Date().toISOString()})
      });
      if(r.ok||r.status===201){
        document.getElementById('gmr-form').innerHTML=
          `<div class="gmr-success">${T.reviewSuccess(cfg.recenzijaPct)}</div>`;
      } else throw new Error('HTTP '+r.status);
    }catch{
      showMsg(msg,T.sendError,'err');
      btn.disabled=false;btn.textContent=T.submitReview;
    }
  });

  // IG buttons
  document.querySelectorAll('.gmr-ig-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id=btn.dataset.id,pct=+btn.dataset.pct;
      const a=igActions().find(x=>x.id===id);
      document.getElementById('gmr-ig-id').value=id;
      document.getElementById('gmr-ig-pct').value=pct;
      document.getElementById('gmr-ig-selected').textContent=a.hint+' → +'+pct+'% popust';
      document.getElementById('gmr-ig-form').style.display='';
      document.getElementById('gmr-ig-form').scrollIntoView({behavior:'smooth',block:'nearest'});
    });
  });
  document.getElementById('gmr-ig-cancel').addEventListener('click',()=>{
    document.getElementById('gmr-ig-form').style.display='none';
  });
  document.getElementById('gmr-ig-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const id=document.getElementById('gmr-ig-id').value;
    const pct=+document.getElementById('gmr-ig-pct').value;
    const name=document.getElementById('gmr-ig-name').value.trim();
    const email=document.getElementById('gmr-ig-email').value.trim();
    const handle=document.getElementById('gmr-ig-handle').value.trim();
    const link=document.getElementById('gmr-ig-link').value.trim();
    const msg=document.getElementById('gmr-ig-msg');
    if(!name||!email||!handle){showMsg(msg,T.fillRequiredIg,'err');return;}
    const a=igActions().find(x=>x.id===id);
    const btn=e.target.querySelector('.gmr-btn-submit');
    btn.disabled=true;btn.textContent=T.sending;
    try{
      const r=await fetch(`${SB_URL}/rest/v1/gm_reviews`,{
        method:'POST',headers:{...SB_H,'Prefer':'return=minimal'},
        body:JSON.stringify({
          name,email,rating:5,
          title:a.label,
          body:`IG: ${handle}${link?'\nLink: '+link:''}`,
          product_id:'ig-'+id,
          product_name:'📸 Instagram: '+a.label,
          status:'pending',coupon_pct:pct,
          created_at:new Date().toISOString()
        })
      });
      if(r.ok||r.status===201){
        document.getElementById('gmr-ig-form').innerHTML=
          `<div class="gmr-success">${T.igSuccess(pct)}</div>`;
      } else throw new Error('HTTP '+r.status);
    }catch{
      showMsg(msg,T.genericError,'err');
      btn.disabled=false;btn.textContent=T.igSubmit;
    }
  });
}

function paintStars(n){
  document.querySelectorAll('.gmr-star').forEach(b=>b.classList.toggle('on',+b.dataset.v<=n));
}

function showMsg(el,txt,type){el.textContent=txt;el.className='gmr-msg '+type;}

async function loadReviews(slug){
  try{
    const r=await fetch(`${SB_URL}/rest/v1/gm_reviews?product_id=eq.${slug}&status=eq.approved&order=created_at.desc&limit=20`,{headers:SB_H});
    if(!r.ok)return;
    const rows=await r.json();
    renderReviews(rows);
  }catch{}
}

function renderReviews(rows){
  const el=document.getElementById('gmr-list');
  if(!el)return;
  if(!rows.length){
    el.innerHTML=`<div class="gmr-empty">${T.noReviews}</div>`;
    return;
  }
  const INITIAL=3;
  const avg=(rows.reduce((s,r)=>s+(r.rating||0),0)/rows.length).toFixed(1);
  const stars=n=>'★'.repeat(Math.round(n))+'☆'.repeat(5-Math.round(n));
  const fmt=iso=>new Date(iso).toLocaleDateString(T.dateLocale,{year:'numeric',month:'long',day:'numeric'});
  const itemHtml=r=>`<div class="gmr-item">
      <div class="gmr-item-hdr">
        <span class="gmr-item-stars">${'★'.repeat(r.rating||0)}${'☆'.repeat(5-(r.rating||0))}</span>
        <strong class="gmr-item-name">${esc(r.name||T.anonymous)}</strong>
        <span class="gmr-item-date">${fmt(r.created_at)}</span>
      </div>
      ${r.title?`<div class="gmr-item-title">${esc(r.title)}</div>`:''}
      <div class="gmr-item-body">${esc(r.body||'')}</div>
    </div>`;
  el.innerHTML=`
    <div class="gmr-summary">
      <span class="gmr-avg">${avg}</span>
      <span class="gmr-avg-stars">${stars(avg)}</span>
      <span class="gmr-avg-count">${rows.length} ${T.reviewWord(rows.length)}</span>
    </div>
    <div id="gmr-items">${rows.slice(0,INITIAL).map(itemHtml).join('')}</div>
    ${rows.length>INITIAL?`<button class="gmr-show-more" id="gmr-show-more">${T.showMore(rows.length)}</button>`:''}`;
  if(rows.length>INITIAL){
    document.getElementById('gmr-show-more').addEventListener('click',()=>{
      document.getElementById('gmr-items').innerHTML+=rows.slice(INITIAL).map(itemHtml).join('');
      document.getElementById('gmr-show-more').remove();
    });
  }
}

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function injectStyles(){
  if(document.getElementById('gmr-styles'))return;
  const s=document.createElement('style');
  s.id='gmr-styles';
  s.textContent=`
.gmr-wrap{width:100%;padding:1rem 0 3rem;font-family:inherit;box-sizing:border-box}
.gmr-h2{font-size:1.45rem;font-weight:700;color:var(--brand,#2b0a39);margin:0 0 1.5rem;letter-spacing:var(--ls-h2,-.022em)}
.gmr-h3{font-size:1rem;font-weight:600;color:var(--brand,#2b0a39);margin:0 0 .2rem}
.gmr-sub{font-size:.85rem;color:var(--muted,#6b726d);margin:0}
.gmr-card{background:var(--card,#fff);border:1px solid var(--line,#e6e9e6);border-radius:12px;padding:1.5rem;margin-bottom:1.25rem}
.gmr-ig-card{background:#faf7f3}
.gmr-card-hdr{display:flex;gap:.9rem;align-items:flex-start;margin-bottom:1.25rem}
.gmr-card-icon{font-size:1.4rem;line-height:1;flex-shrink:0;margin-top:.1rem}
.gmr-stars{display:flex;align-items:center;gap:.15rem;margin-bottom:.9rem}
.gmr-star{background:none;border:none;cursor:pointer;font-size:1.6rem;color:#d4c4a8;padding:0;line-height:1;transition:color .1s}
.gmr-star.on{color:#b18556}
.gmr-stars-hint{font-size:.78rem;color:var(--muted,#6b726d);margin-left:.4rem}
.gmr-fields{display:flex;flex-direction:column;gap:.6rem;margin-bottom:.9rem}
.gmr-input{width:100%;padding:.65rem .8rem;border:1px solid var(--line,#e6e9e6);border-radius:8px;font-family:inherit;font-size:.9rem;background:#fff;color:var(--fg,#101311);box-sizing:border-box;outline:none;transition:border-color .15s}
.gmr-input:focus{border-color:var(--accent,#b18556)}
.gmr-ta{resize:vertical;min-height:90px}
.gmr-btn-submit{padding:.65rem 1.4rem;background:var(--brand,#2b0a39);color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:.9rem;font-weight:600;cursor:pointer;transition:opacity .15s}
.gmr-btn-submit:hover{opacity:.85}.gmr-btn-submit:disabled{opacity:.5;cursor:default}
.gmr-btn-cancel{padding:.65rem 1rem;background:none;border:1px solid var(--line,#e6e9e6);border-radius:8px;font-family:inherit;font-size:.9rem;cursor:pointer;color:var(--muted,#6b726d)}
.gmr-msg{font-size:.82rem;margin-top:.5rem;min-height:1em}
.gmr-msg.err{color:#c0392b}.gmr-msg.ok{color:#27ae60}
.gmr-success{padding:.8rem 1rem;background:#eef7f0;border:1px solid #a8d5b5;border-radius:8px;font-size:.88rem;color:#1a5c35}
.gmr-ig-actions{display:flex;flex-direction:column;gap:.6rem;margin-bottom:.75rem}
.gmr-ig-row{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.7rem .9rem;background:#fff;border:1px solid var(--line,#e6e9e6);border-radius:8px}
.gmr-ig-info{display:flex;flex-direction:column;gap:.15rem}
.gmr-ig-label{font-size:.88rem;font-weight:500;color:var(--fg,#101311)}
.gmr-ig-hint{font-size:.75rem;color:var(--muted,#6b726d)}
.gmr-ig-btn{flex-shrink:0;padding:.45rem .85rem;background:var(--accent,#b18556);color:#fff;border:none;border-radius:7px;font-family:inherit;font-size:.82rem;font-weight:600;cursor:pointer;white-space:nowrap;transition:opacity .15s}
.gmr-ig-btn:hover{opacity:.85}
.gmr-ig-selected{font-size:.88rem;font-weight:600;color:var(--brand,#2b0a39);margin:0 0 .9rem;padding:.6rem .8rem;background:#f0e8d8;border-radius:7px}
.gmr-ig-form{margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--line,#e6e9e6)}
.gmr-summary{display:flex;align-items:center;gap:.75rem;padding:.9rem 1rem;background:var(--card,#fff);border:1px solid var(--line,#e6e9e6);border-radius:10px;margin-bottom:1rem}
.gmr-avg{font-size:2.2rem;font-weight:700;color:var(--brand,#2b0a39);line-height:1}
.gmr-avg-stars{font-size:1.2rem;color:#b18556;letter-spacing:.05em}
.gmr-avg-count{font-size:.82rem;color:var(--muted,#6b726d)}
.gmr-item{padding:.9rem 0;border-bottom:1px solid var(--line,#e6e9e6)}
.gmr-item:last-child{border-bottom:none}
.gmr-item-hdr{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;margin-bottom:.35rem}
.gmr-item-stars{color:#b18556;font-size:.95rem;letter-spacing:.04em}
.gmr-item-name{font-size:.88rem;font-weight:600;color:var(--fg,#101311)}
.gmr-item-date{font-size:.75rem;color:var(--muted,#6b726d);margin-left:auto}
.gmr-item-title{font-size:.9rem;font-weight:600;color:var(--brand,#2b0a39);margin-bottom:.25rem}
.gmr-item-body{font-size:.88rem;color:var(--fg,#101311);line-height:1.55;white-space:pre-line}
.gmr-show-more{display:block;width:100%;margin:1rem 0 .5rem;padding:.65rem;background:none;border:1px solid var(--line,#e6e9e6);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:500;color:var(--brand,#2b0a39);cursor:pointer;transition:background .15s}
.gmr-show-more:hover{background:var(--card,#f9f7f4)}
.gmr-loading{color:var(--muted,#6b726d);font-size:.85rem;padding:.5rem 0}
.gmr-empty{font-size:.88rem;color:var(--muted,#6b726d);padding:.75rem 1rem;background:var(--card,#fff);border:1px solid var(--line,#e6e9e6);border-radius:10px;margin-bottom:1rem}
.gmr-details{padding:1.1rem 1.5rem}
.gmr-details-sum{display:flex;align-items:flex-start;gap:.9rem;cursor:pointer;list-style:none;outline:none}
.gmr-details-sum::-webkit-details-marker{display:none}
.gmr-details-sum::after{content:'＋';margin-left:auto;font-size:1.1rem;color:var(--muted,#6b726d);flex-shrink:0;line-height:1.4}
details[open] .gmr-details-sum::after{content:'−'}
@media(max-width:520px){
  .gmr-ig-row{flex-direction:column;align-items:flex-start}
  .gmr-ig-btn{align-self:flex-end}
}`;
  document.head.appendChild(s);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}
})();
