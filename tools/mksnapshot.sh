#!/bin/sh
# Z kazety udělá snapshot a obraz RAM. Potřebuje sources/tape/*.tzx (mimo git,
# viz sources/tape/README.md) a SkoolKit v app/svision/sources/skoolkit (R-008).
#
# Kazeta je standardní ROM rychlostí a bez Speedlocku, ale kód **je zamíchaný**
# (RRD smyčka na $5B80, viz sources/docs/tape_layout.md). Simulované nahrání
# v tap2sna.py ten descrambler doopravdy provede, takže snapshot je už
# rozmíchaný — a právě proto se hodí jako nezávislá kontrola toho, co počítá
# tools/aticlib.py.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SK="$ROOT/app/svision/sources/skoolkit"
TAPE="$ROOT/sources/tape/Atic Atac (1983)(Ultimate).tzx"
mkdir -p "$ROOT/build"
[ -f "$TAPE" ] || { echo "chybi $TAPE - viz sources/tape/README.md"; exit 1; }
PYTHONPATH="$SK" python3 "$SK/skoolkit-10.1.data/scripts/tap2sna.py" \
    --start 0x6000 "$TAPE" "$ROOT/build/aticatac.z80"
PYTHONPATH="$SK" python3 - "$ROOT" <<'PY'
import sys
sys.path.insert(0, sys.argv[1] + '/tools')
from skoolkit.snapshot import Snapshot
import aticlib as A
root = sys.argv[1]
ram = bytes(Snapshot.get(root + '/build/aticatac.z80').ram(-1))
open(root + '/build/aticatac.bin', 'wb').write(ram)
mine = A.memory_image()
lo = A.CODE_LOAD - 0x4000
hi = lo + A.CODE_LEN
d = sum(1 for a, b in zip(ram[lo:hi], mine[lo:hi]) if a != b)
print('RAM $4000-$FFFF: %d B; rozmichany kod $5FFF-$D67F souhlasi s '
      'tools/aticlib.py: %d kontrol, %d rozdilu' % (len(ram), A.CODE_LEN, d))
PY
