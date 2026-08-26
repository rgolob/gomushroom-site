import tomllib, re, json, glob, os, sys, xml.etree.ElementTree as ET
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
n=0
def t(c,o,d=''):
    global n
    print(('  ok   ' if c else '  NAPAKA ')+o+('' if c else ' :: '+str(d)))
    if not c: n+=1

red=tomllib.load(open('netlify.toml','rb'))['redirects']
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
root=ET.parse('sitemap.xml').getroot()
locs=[e.text.replace('https://gomushroom.si','') for e in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]

# 1. Noben URL iz sitemapa ne sme biti preusmerjen drugam.
prizadeti=[r['from'] for r in red if r['from'] in locs]
t(not prizadeti,'noben URL iz sitemapa ni preusmerjen drugam',prizadeti)

# 2. Vsak URL iz sitemapa mora imeti svojo datoteko.
manjka=[u for u in locs if not os.path.exists('.'+u+'index.html')]
t(not manjka,'vsak URL iz sitemapa ima svojo stran',manjka)

# 3. Nobena stran iz sitemapa ne sme biti noindex.
noind=[u for u in locs if 'noindex' in open('.'+u+'index.html',encoding='utf-8').read()]
t(not noind,'nobena stran iz sitemapa ni noindex',noind)

# 4. Canonical mora kazati nase.
slabi=[]
for u in locs:
    h=open('.'+u+'index.html',encoding='utf-8').read()
    m=re.search(r'<link rel="canonical" href="([^"]+)"',h)
    if not m or m.group(1)!='https://gomushroom.si'+u: slabi.append((u,m.group(1) if m else None))
t(not slabi,'canonical vsake strani kaze nase',slabi)

# 5. Hreflang mora biti vzajemen in ne sme kazati na preusmerjen URL.
odpreusm={r['from'] for r in red}
napake=[]
for u in locs:
    h=open('.'+u+'index.html',encoding='utf-8').read()
    for lang,href in re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="https://gomushroom\.si([^"]+)"',h):
        if href in odpreusm: napake.append((u,lang,href,'kaze na preusmerjen URL'))
        elif not os.path.exists('.'+href+'index.html'): napake.append((u,lang,href,'ni strani'))
        elif lang in ('sl','en'):
            d=open('.'+href+'index.html',encoding='utf-8').read()
            if 'https://gomushroom.si'+u not in d: napake.append((u,lang,href,'ni vzajemen'))
t(not napake,'hreflang je vzajemen in kaze na dosegljive strani',napake)

# 6. Naslov: ime izdelka pred blagovno znamko.
slabnaslov=[]
for u in locs:
    if '/trgovina/' not in u and '/shop/' not in u: continue
    naslov=re.search(r'<title>([^<]*)</title>',open('.'+u+'index.html',encoding='utf-8').read()).group(1)
    if naslov.strip().startswith('GoMushroom'): slabnaslov.append((u,naslov))
t(not slabnaslov,'naslovi izdelkov se zacnejo z izdelkom, ne z znamko',slabnaslov)

# 7. Lastnost mora pripadati svojemu tipu. Semrush je nasel inLanguage na
#    Product - ta lastnost sodi na CreativeWork (Article, WebPage, Collection),
#    ne na izdelek. Jezik strani povesta <html lang> in hreflang, zato na
#    Productu ni izgube.
SAMO_CREATIVEWORK={'inLanguage','articleBody','wordCount','headline','datePublished',
                   'dateModified','author','articleSection'}
CREATIVEWORK={'Article','NewsArticle','BlogPosting','WebPage','CollectionPage',
              'ItemPage','AboutPage','FAQPage','TechArticle','Report'}
napacne=[]
for u in locs:
    h=open('.'+u+'index.html',encoding='utf-8').read()
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>',h,re.S):
        try: d=json.loads(m)
        except json.JSONDecodeError as e:
            napacne.append((u,'neveljaven JSON: '+str(e)[:60])); continue
        for node in (d.get('@graph') or [d]):
            if not isinstance(node,dict): continue
            tip=node.get('@type')
            if tip in CREATIVEWORK: continue
            for p in SAMO_CREATIVEWORK & set(node):
                napacne.append((u,f'{p} na {tip}'))
t(not napacne,'lastnosti pripadajo svojemu tipu v strukturiranih podatkih',napacne)

# 8. Trgovina mora v HTML nasteti vse izdelke. Mreza jih izrise iz baze, zato je
#    bila prazna - iskalnik in bralnik brez JavaScripta nista videla nobenega
#    izdelka. Staticni seznam se zlahka razide s sitemapom, ko pride nov izdelek.
for trgovina in ('/trgovina/','/en/shop/'):
    h=open('.'+trgovina+'index.html',encoding='utf-8').read()
    mreza=re.search(r'<section class="shop-grid".*?</section>',h,re.S)
    povezave={m for m in re.findall(r'href="(/[^"]+/)"',mreza.group(0))} if mreza else set()
    pricakovane={u for u in locs if u.startswith(trgovina) and u!=trgovina}
    t(povezave==pricakovane,f'{trgovina} nasteje vse izdelke iz sitemapa',
      f'manjka {sorted(pricakovane-povezave)}, odvec {sorted(povezave-pricakovane)}')

# 9. robots.txt ne sme nicesar zapirati.
rt=open('robots.txt',encoding='utf-8').read()
t('Disallow: /' not in rt.replace('Disallow: /\n','X') or 'Disallow:' not in rt,
  'robots.txt ne zapira spletisca',rt.strip().replace('\n',' | '))
t('sitemap.xml' in rt.lower(),'robots.txt navaja sitemap')

print(('\n%d NAPAK'%n) if n else '\nvse ok')
sys.exit(1 if n else 0)
