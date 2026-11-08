#!/usr/bin/env python3
"""Vytáhne z běžícího originálu **statickou** podobu startovní místnosti.

    ./tools/mkroom.py [--out data/screen.json]

Princip je převzatý ze `sabrewulf/tools/mkroom.py` (a před ním underwurlde):
hra se spustí v simulátoru jako v `playtrace.py`, projde se úvodní obrazovka
`GAME SELECTION` a v pravidelných rozestupech se ukládá celý obraz videopaměti.
Co se hýbe (postava, nepřátelé, ubývající kuře), je na každém místě jen zlomek
snímků, takže **většinový hlas přes bajty** vrátí to, co se nehýbe — čistou
kulisu místnosti. Nic se nedokresluje, výstupem jsou **skutečné bajty
videopaměti originálu**.

Dvě části obrazovky se přitom berou jinak, a je to schválně:

- **hrací plocha** (znakové sloupce 0–23, tedy 192 × 192 px) — většinovým
  hlasem, protože přes ni chodí postava a nepřátelé
- **panel** (sloupce 24–31, tedy pergamen `Scroll` vpravo) — **z jednoho
  vybraného snímku**, ne hlasováním. V panelu běží čas a skóre, takže
  „nejčastější hodnota bajtu" by dala číslici, která na obrazovce nikdy
  nebyla naráz se zbytkem. Jeden snímek je naproti tomu skutečný stav stroje
  v jednom okamžiku.

**Je to provizorium M1**, přesně jako u sourozenců: formát místnosti zatím
není známý (`ZADANI.md` §9.5, M2). Až ho M2 bude znát, přestane být tenhle
soubor zdrojem obrázku a zůstane jako **nezávislá kontrola** — většinový hlas
nad pixely originálu o formátu nepředpokládá nic.
"""
import argparse, base64, json, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
RETRO = os.path.join(HERE, '..', 'app', 'svision', 'tools', 'retro')
sys.path.insert(0, os.path.join(RETRO, '..', '..', 'sources', 'skoolkit'))
sys.path.insert(0, RETRO)
sys.path.insert(0, HERE)

from scr2png import scr_to_rgb, write_png                       # noqa: E402
from playtrace import KEYS, ROWS                                # noqa: E402
from skoolkit.snapshot import Snapshot                          # noqa: E402
from skoolkit.simulator import Simulator                        # noqa: E402
from skoolkit.simutils import from_snapshot                     # noqa: E402
from skoolkit.trace import Tracer                               # noqa: E402
try:
    from skoolkit.csimulator import CSimulator
except ImportError:                                             # pragma: no cover
    CSimulator = None

# ★ Úvodní obrazovka originálu (změřeno playtrace.py, snímek 300):
# 1 KEYBOARD / 2 KEMPSTON JOYSTICK / 3 CURSOR JOYSTICK /
# 4 KNIGHT / 5 WIZARD / 6 SERF / 0 START GAME
SCRIPT = [(320, 330, '1'),      # KEYBOARD
          (360, 370, '4'),      # KNIGHT
          (400, 410, '0')]      # START GAME
SAMPLE_FROM, SAMPLE_TO, SAMPLE_STEP = 470, 900, 3
PANEL_FRAME = 600               # ze kterého snímku se bere panel

PANEL_COL = 24                  # ★ pergamen zabírá sloupce 24–31 (192–255 px)
COLS = 32


def screen_offset(y):
    """Offset pixelového řádku y (0–191) v 6912B obrazu."""
    third, char_row, pix = y >> 6, (y >> 3) & 7, y & 7
    return (third << 11) | (pix << 8) | (char_row << 5)


def split(scr):
    """(hrací plocha, panel) jako dvojice (bitmapa po řádcích, atributy)."""
    play_b, panel_b = bytearray(), bytearray()
    for y in range(192):
        base = screen_offset(y)
        play_b += scr[base:base + PANEL_COL]
        panel_b += scr[base + PANEL_COL:base + COLS]
    play_a, panel_a = bytearray(), bytearray()
    for r in range(24):
        base = 6144 + r * COLS
        play_a += scr[base:base + PANEL_COL]
        panel_a += scr[base + PANEL_COL:base + COLS]
    return (bytes(play_b), bytes(play_a)), (bytes(panel_b), bytes(panel_a))


def majority(samples):
    """Po bajtech nejčastější hodnota – co se nehýbe, to vyhraje."""
    out = bytearray(len(samples[0]))
    for i in range(len(out)):
        out[i] = Counter(s[i] for s in samples).most_common(1)[0][0]
    return bytes(out)


def to_scr(play, panel):
    """Zpátky do 6912B obrazu – kvůli náhledu přes scr2png."""
    (pb, pa), (nb, na) = play, panel
    scr = bytearray(6912)
    for y in range(192):
        base = screen_offset(y)
        scr[base:base + PANEL_COL] = pb[y * PANEL_COL:(y + 1) * PANEL_COL]
        scr[base + PANEL_COL:base + COLS] = nb[y * (COLS - PANEL_COL):(y + 1) * (COLS - PANEL_COL)]
    for r in range(24):
        base = 6144 + r * COLS
        scr[base:base + PANEL_COL] = pa[r * PANEL_COL:(r + 1) * PANEL_COL]
        scr[base + PANEL_COL:base + COLS] = na[r * (COLS - PANEL_COL):(r + 1) * (COLS - PANEL_COL)]
    return bytes(scr)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('snapshot', nargs='?',
                    default=os.path.join(HERE, '..', 'build/aticatac.z80'))
    ap.add_argument('--out', default=os.path.join(HERE, '..', 'data/screen.json'))
    ap.add_argument('--png', default=os.path.join(HERE, '..', 'build/screen.png'))
    ap.add_argument('--ref', default=os.path.join(HERE, '..', 'build/ref'),
                    help='kam uložit referenční snímek pro tools/matchscreen.mjs')
    args = ap.parse_args()

    snapshot = Snapshot.get(args.snapshot)
    if snapshot is None:
        raise SystemExit('nelze nacist snapshot %s – spust ./tools/mksnapshot.sh'
                         % args.snapshot)
    cls = CSimulator or Simulator
    simulator = from_snapshot(cls, snapshot, {}, {'ay': [None] * 16},
                              {'fast_djnz': False, 'fast_ldir': False}, None)
    tracer = Tracer(simulator, snapshot.border, snapshot.out7ffd, snapshot.outfffd,
                    list(snapshot.ay), snapshot.outfe, True)
    simulator.set_tracer(tracer)

    samples, panel_scr = [], {}

    def draw(scr, frame, border, keyboard):
        for i in range(8):
            keyboard[i] = 0
        for start, end, key in SCRIPT:
            if start <= frame < end:
                row, bit = KEYS[key]
                keyboard[ROWS[row]] |= 1 << bit
        if SAMPLE_FROM <= frame <= SAMPLE_TO and (frame - SAMPLE_FROM) % SAMPLE_STEP == 0:
            samples.append(bytes(scr))
        if frame == PANEL_FRAME:
            panel_scr[frame] = bytes(scr)
        return frame < SAMPLE_TO + 10

    tracer.run(snapshot.pc, -1, 0, 0, True, draw, None, None, None, '$', '04X', '04X')
    if len(samples) < 20:
        raise SystemExit('malo vzorku (%d) – zkontroluj SCRIPT' % len(samples))
    if PANEL_FRAME not in panel_scr:
        raise SystemExit('snimek %d pro panel nedobehl' % PANEL_FRAME)

    plays = [split(s)[0] for s in samples]
    bitmap = majority([p[0] for p in plays])
    attrs = majority([p[1] for p in plays])

    # ★ Kontrola, že se během vzorkování nepřešlo do jiné místnosti.
    # Číslo aktuální místnosti v paměti zatím neznáme (to je M2), ale přechod
    # by byl vidět: vyměnil by se skoro celý obrázek. Nejhorší vzorek tedy
    # musí být pořád blízko většinovému výsledku.
    worst = max(sum(1 for a, b in zip(p[0], bitmap) if a != b) for p in plays)
    limit = len(bitmap) // 4
    print('nejhorší vzorek se od většiny liší v %d B z %d (mez %d)'
          % (worst, len(bitmap), limit))
    if worst > limit:
        raise SystemExit('během vzorkování se nejspíš změnila místnost – '
                         'zkontroluj SCRIPT a SAMPLE_*')

    panel = split(panel_scr[PANEL_FRAME])[1]

    data = {
        'note': 'Statická podoba startovní místnosti z běhu originálu '
                '(tools/mkroom.py). Hrací plocha většinovým hlasem přes '
                '%d vzorků, panel z jednoho snímku. Provizorium M1: formát '
                'místnosti zatím není známý (M2).' % len(samples),
        'width': 256, 'height': 192,
        'panelColumn': PANEL_COL,
        'samples': len(samples),
        'sampleFrames': [SAMPLE_FROM, SAMPLE_TO, SAMPLE_STEP],
        'panelFrame': PANEL_FRAME,
        'play': {'width': PANEL_COL * 8, 'height': 192,
                 'bitmap': base64.b64encode(bitmap).decode('ascii'),
                 'attributes': base64.b64encode(attrs).decode('ascii')},
        'panel': {'width': (COLS - PANEL_COL) * 8, 'height': 192,
                  'bitmap': base64.b64encode(panel[0]).decode('ascii'),
                  'attributes': base64.b64encode(panel[1]).decode('ascii')},
    }
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    print('%s (%d vzorků, hrací plocha %d B + %d B atributů, panel ze snímku %d)'
          % (args.out, len(samples), len(bitmap), len(attrs), PANEL_FRAME))

    scr = to_scr((bitmap, attrs), panel)
    os.makedirs(os.path.dirname(os.path.abspath(args.png)), exist_ok=True)
    write_png(args.png, scr_to_rgb(scr), 256, 2)
    print('náhled %s' % args.png)

    # referenční snímek pro tools/matchscreen.mjs: tentýž obraz, jak ho složil
    # originál — proti němu se poměřuje app/screenComposer.js
    os.makedirs(args.ref, exist_ok=True)
    ref = os.path.join(args.ref, 'screen%05d.scr' % PANEL_FRAME)
    open(ref, 'wb').write(scr)
    print('reference %s' % ref)


if __name__ == '__main__':
    main()
