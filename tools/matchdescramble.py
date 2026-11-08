#!/usr/bin/env python3
"""Ověří, že `tools/aticlib.py` rozmíchá kód **přesně tak, jak to udělá stroj**.

    ./tools/matchdescramble.py

Kód Atic Ataku leží na kazetě zamíchaný: blok `0` se nahraje na `$5FFF`
a rozmíchá ho osmnáctibajtový blok `1` na `$5B80` smyčkou `RRD`
(`sources/docs/tape_layout.md`). Python replika téhle smyčky je
`aticlib.descramble()` a **musí se shodovat bajt po bajtu** s tím, co po
nahrání kazety zbude v paměti simulátoru – jinak stojí celá disassembly
a všechna extrakce dat na výmyslu.

Kontroluje se dvěma nezávislými cestami:

1. proti **paměti simulátoru** po nahrání kazety (`build/aticatac.bin`
   z `./tools/mksnapshot.sh`) – to je akceptační kritérium
2. proti **cizímu dumpu** `sources/tape/*.z80`, který nahrál někdo jiný na
   jiném stroji. Tenhle snapshot je z **běžící hry**, ne z okamžiku po
   nahrání, takže rozdíl v něm nemusí být chyba: hra si do své paměti píše.
   Čísla se proto tisknou zvlášť a **návratový kód se jimi neřídí**

Akceptační kritérium M0: 30 209 kontrol proti simulátoru, nula rozdílů.
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'app', 'svision', 'sources', 'skoolkit'))
import aticlib as A   # noqa: E402


def snapshot_ram(path):
    from skoolkit.snapshot import Snapshot
    return bytes(Snapshot.get(path).ram(-1))


def compare(name, ram, mine):
    lo, hi = A.CODE_LOAD - 0x4000, A.CODE_LOAD - 0x4000 + A.CODE_LEN
    diffs = [A.CODE_LOAD + i for i in range(A.CODE_LEN) if ram[lo + i] != mine[lo + i]]
    print('%-30s $%04X-$%04X: %d kontrol, **%d rozdílů**'
          % (name, A.CODE_LOAD, A.CODE_LOAD + A.CODE_LEN - 1, A.CODE_LEN, len(diffs)))
    for a in diffs[:8]:
        print('   $%04X: dump $%02X, aticlib $%02X'
              % (a, ram[a - 0x4000], mine[a - 0x4000]))
    if len(diffs) > 8:
        print('   … a dalších %d' % (len(diffs) - 8))
    return len(diffs)


def main():
    root = os.path.join(HERE, '..')
    snap = os.path.join(root, 'build', 'aticatac.bin')
    if not os.path.exists(snap):
        raise SystemExit('chybi %s – spust ./tools/mksnapshot.sh' % snap)
    mine = A.memory_image()

    rest = A.descramble_check()
    print('proud půlbajtů končí na konci bloku nulou: %s ($%X)'
          % ('ano' if rest == 0 else 'NE', rest))

    bad = compare('simulátor (z kazety)', open(snap, 'rb').read(), mine)

    if os.path.exists(A.SNAPSHOT):
        d = compare('cizí dump .z80 (běžící hra)', snapshot_ram(A.SNAPSHOT), mine)
        print('   ↑ jen informativní: snapshot je z rozehrané hry, ne z '
              'okamžiku po nahrání' if d else '')
    else:
        print('cizí dump .z80 tu není – přeskočeno')

    return 1 if bad or rest else 0


if __name__ == '__main__':
    sys.exit(main())
