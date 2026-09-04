#!/usr/bin/env python3
# ── Ikone za domaci zaslon ─────────────────────────────────────────────────
#
#   python3 doc/ikone.py
#
# Skript iz logotipa izlusci gobo in jo za vsako aplikacijo prerise v njenih
# barvah. Zazenes ga samo, ce se logotip spremeni ali ce pride nova aplikacija;
# nastale PNG-je hranimo v repozitoriju.
#
# Zakaj PNG in ne SVG
# ───────────────────
# iOS za apple-touch-icon sprejme samo rastrsko sliko. Ko je bil tam SVG
# (data:image/svg+xml z emojijem), ga je Safari spregledal in je na domaci
# zaslon postavil posnetek strani namesto ikone.
#
# Zakaj vsaka aplikacija svojo barvo
# ──────────────────────────────────
# Na domacem zaslonu so ikone druga ob drugi in vse nosijo isti logotip. Ce
# se locijo samo po napisu pod ikono, jih je treba brati; razlicne podlage jih
# locijo ze na pogled.

import json
import os
from collections import deque

import numpy as np
from PIL import Image

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IZVOR = os.path.join(KOREN, 'assets', 'logo-square.webp')

# Barve v izvornem logotipu.
IZ_KLOBUK = (44, 10, 58)
IZ_SKRGE = (177, 133, 85)

# Pod to vrstico (v 512-piksleni sliki) se zacne rokopisni napis "GO mushroom".
# Ta se beta dotika in vanj zajeda, zato ga odrezemo, bet pa zakljucimo sami.
REZ = 344
ZAOBLITEV = 16

# barve: (podlaga, klobuk in bet, skrge)
APLIKACIJE = {
    'nadzor':    ((0x1a, 0x12, 0x09), (0xf0, 0xeb, 0xe3), (0xaf, 0x84, 0x55)),
    'zaloga':    ((0xf5, 0xf0, 0xe8), (0x2c, 0x0a, 0x3a), (0xb1, 0x85, 0x55)),
    'materiali': ((0x2c, 0x0a, 0x3a), (0xf5, 0xf0, 0xe8), (0xb1, 0x85, 0x55)),
    'marketing': ((0xaf, 0x84, 0x55), (0x2c, 0x0a, 0x3a), (0xf5, 0xf0, 0xe8)),
}

# Navadna ikona sme segati skoraj do roba, maskable pa mora ostati v sredinskem
# krogu (80 % stranice), ker jo Android obreze v poljubno obliko.
RAZLICICE = [(180, 0.62, 'ikona-180.png'), (192, 0.62, 'ikona-192.png'),
             (512, 0.62, 'ikona-512.png'), (512, 0.46, 'ikona-512-maskable.png')]


def poplavi(dovoljeno, zacetki):
    """Vse, kar je po stiriposedno povezano z zacetki in znotraj dovoljenega."""
    h, w = dovoljeno.shape
    vid = np.zeros_like(dovoljeno)
    q = deque()
    for y, x in zacetki:
        if dovoljeno[y, x] and not vid[y, x]:
            vid[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and dovoljeno[ny, nx] and not vid[ny, nx]:
                vid[ny, nx] = True
                q.append((ny, nx))
    return vid


def izlusci_gobo():
    """Iz logotipa vrne masko klobuka z betom in masko skrg."""
    im = Image.open(IZVOR).convert('RGB').resize((512, 512), Image.LANCZOS)
    a = np.array(im).astype(int)
    temno = np.abs(a - np.array(IZ_KLOBUK)).sum(2) < 120
    zlato = np.abs(a - np.array(IZ_SKRGE)).sum(2) < 120

    temno, zlato = temno[:REZ], zlato[:REZ]
    h, w = temno.shape

    # Goba je edina velika povezana pega; napis pod njo je s tem ze odrezan.
    goba = poplavi(temno | zlato, [(200, 256)])

    # Crke, ki lezijo cez bet, so v maski luknje. Ozadje poplavimo z zgornjega
    # in obeh stranskih robov — spodnji je rez skozi bet, ne zunanjost — in kar
    # ostane nedosezeno, je notranjost, ki jo zapolnimo.
    rob = ([(0, x) for x in range(w)]
           + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)])
    klobuk = (goba & temno) | (~goba & ~poplavi(~goba, rob))

    # Zlate so samo skrge — dve veliki pegi. Drobci so ostanki napisa "GO",
    # ki so pristali v betu; pobarvamo jih kot bet.
    skrge = np.zeros_like(klobuk)
    ostalo = goba & zlato & ~temno
    while ostalo.any():
        y, x = next(zip(*np.where(ostalo)))
        pega = poplavi(ostalo, [(y, x)])
        ostalo &= ~pega
        if pega.sum() > 500:
            skrge |= pega
        else:
            klobuk |= pega

    # Rez skozi bet zakljucimo z zaobljenim robom, da bet ne konca z ravno crto.
    xs = np.where(klobuk[h - 1])[0]
    sredina, polovica = (xs.min() + xs.max()) / 2.0, (xs.max() - xs.min()) / 2.0
    klobuk = np.vstack([klobuk, np.zeros((ZAOBLITEV, w), bool)])
    skrge = np.vstack([skrge, np.zeros((ZAOBLITEV, w), bool)])
    for i in range(ZAOBLITEV):
        s = polovica * (1 - ((i + 1) / ZAOBLITEV) ** 2) ** 0.5
        klobuk[h - 1 + i, int(round(sredina - s)):int(round(sredina + s)) + 1] = True

    ys, xs = np.where(klobuk | skrge)
    izrez = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    return klobuk[izrez], skrge[izrez]


def naredi(klobuk, skrge, barve, mapa):
    podlaga, bkl, bsk = barve
    sloj = np.zeros(klobuk.shape + (4,), 'uint8')
    sloj[klobuk] = (*bkl, 255)
    sloj[skrge] = (*bsk, 255)
    # Masko narisemo veckratno povecano in sele pomanjsamo, da so robovi gladki.
    znak = Image.fromarray(sloj, 'RGBA')
    znak = znak.resize((znak.width * 4, znak.height * 4), Image.NEAREST)

    for velikost, delez, ime in RAZLICICE:
        p = Image.new('RGBA', (velikost, velikost), (*podlaga, 255))
        v = int(velikost * delez)
        s = int(znak.width * v / znak.height)
        z = znak.resize((s, v), Image.LANCZOS)
        p.paste(z, ((velikost - s) // 2, (velikost - v) // 2), z)
        pot = os.path.join(KOREN, mapa, ime)
        p.convert('RGB').save(pot, optimize=True)
        print('%-40s %6d B' % (os.path.join(mapa, ime), os.path.getsize(pot)))


if __name__ == '__main__':
    klobuk, skrge = izlusci_gobo()
    for mapa, barve in APLIKACIJE.items():
        naredi(klobuk, skrge, barve, mapa)
