#!/usr/bin/env python3
"""Vpise ocene izdelkov v staticni HTML.

Zvezdice v Googlu izhajajo iz aggregateRating v strukturiranih podatkih. Tega
doslej v HTML ni bilo nikjer - dodal ga je sele product-page.js po nalaganju
strani. Google JavaScript sicer izvaja, a v drugem, zamaknjenem prehodu, ki ni
zanesljiv: zato je zvezdice dobil Reishi, ostali izdelki pa ne, ceprav imajo
ocene enako prikazane.

Skripta prebere odobrene ocene iz Supabase in jih zapise v Product schemo vseh
strani izdelkov, slovenskih in angleskih. Stevilka je s tem v HTML ze ob prvem
obisku iskalnika. product-page.js jo ob nalaganju se vedno prepise s svezo, tako
da obiskovalec vidi tocno stanje tudi med dvema zagonoma skripte.

Pozeni jo, ko pride kaksna ocena, in objavi spremembo:

    python3 doc/osvezi-ocene.py          # zapise
    python3 doc/osvezi-ocene.py --preveri  # samo pove, kaj bi se spremenilo

Zahteva dostop do interneta (Supabase).
"""
import json
import os
import re
import sys
import urllib.request

SB_URL = 'https://rjscfndegqxuefffsedf.supabase.co'
SB_KEY = 'sb_publishable_uehiNqcxrZNZb7dF6wnYcA_Xqxf3eqa'

# Slug je isti za slovensko in anglesko stran - ocene izdelka niso vezane na
# jezik. Vzet je iz data-slug na gumbu "dodaj v kosarico", da sta vir ocen tu in
# v product-page.js ista stvar.
KOREN = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


def strani_izdelkov():
    """Poisce vse strani izdelkov in slug, ki ga uporablja product-page.js."""
    najdene = []
    for mapa in ('trgovina', 'en/shop'):
        pot = os.path.join(KOREN, mapa)
        if not os.path.isdir(pot):
            continue
        for ime in sorted(os.listdir(pot)):
            f = os.path.join(pot, ime, 'index.html')
            if not os.path.exists(f):
                continue
            h = open(f, encoding='utf-8').read()
            m = re.search(r'data-slug="([^"]+)"', h)
            if m:
                najdene.append((os.path.relpath(f, KOREN), m.group(1)))
    return najdene


def ocene(slug):
    """Odobrene ocene tega izdelka - isti filter kot v product-page.js."""
    url = (f'{SB_URL}/rest/v1/gm_reviews?product_id=eq.{slug}'
           '&status=eq.approved&select=rating')
    zahteva = urllib.request.Request(url, headers={
        'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY})
    with urllib.request.urlopen(zahteva, timeout=30) as odgovor:
        vrstice = json.load(odgovor)
    ocenjene = [r.get('rating') or 0 for r in vrstice]
    if not ocenjene:
        return None
    # Enako zaokrozevanje kot injectReviewSchema, sicer bi se staticna in
    # izrisana vrednost razlikovali za desetinko in bi bilo videti kot napaka.
    return {'@type': 'AggregateRating',
            'ratingValue': f'{sum(ocenjene) / len(ocenjene):.1f}',
            'reviewCount': len(ocenjene)}


def zapisi(pot, agg, samo_preveri):
    """Vstavi aggregateRating v Product schemo strani. Vrne opis spremembe."""
    polna = os.path.join(KOREN, pot)
    h = open(polna, encoding='utf-8').read()
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>',
                         h, re.S):
        try:
            d = json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
        if d.get('@type') != 'Product':
            continue
        staro = d.get('aggregateRating')
        if staro == agg:
            return None
        if agg is None:
            d.pop('aggregateRating', None)
        else:
            d['aggregateRating'] = agg
        if not samo_preveri:
            nov = ('<script type="application/ld+json">\n'
                   + json.dumps(d, ensure_ascii=False, indent=2)
                   + '\n  </script>')
            open(polna, 'w', encoding='utf-8').write(
                h[:m.start()] + nov + h[m.end():])
        prej = f"{staro['ratingValue']} ({staro['reviewCount']})" if staro else '—'
        zdaj = f"{agg['ratingValue']} ({agg['reviewCount']})" if agg else '—'
        return f'{prej} → {zdaj}'
    return 'NAPAKA: na strani ni Product scheme'


def main():
    samo_preveri = '--preveri' in sys.argv
    strani = strani_izdelkov()
    if not strani:
        print('Ni strani izdelkov.')
        return 1
    predpomnilnik, spremenjenih, napak = {}, 0, 0
    for pot, slug in strani:
        if slug not in predpomnilnik:
            try:
                predpomnilnik[slug] = ocene(slug)
            except Exception as e:
                print(f'  NAPAKA  {slug}: {e}')
                napak += 1
                continue
        agg = predpomnilnik[slug]
        sprememba = zapisi(pot, agg, samo_preveri)
        if sprememba is None:
            print(f'  ostaja  {pot}')
        elif sprememba.startswith('NAPAKA'):
            print(f'  NAPAKA  {pot}: {sprememba}')
            napak += 1
        else:
            print(f'  {"bi se spremenil" if samo_preveri else "zapisano"}  '
                  f'{pot}  {sprememba}')
            spremenjenih += 1
    print(f'\n{spremenjenih} strani, {napak} napak')
    if not samo_preveri and spremenjenih:
        print('Objavi spremembo, da jo iskalnik vidi.')
    return 1 if napak else 0


if __name__ == '__main__':
    sys.exit(main())
