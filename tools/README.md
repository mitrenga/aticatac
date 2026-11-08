# tools/

Nástroje remaku. Platí pro ně `../../STANDARDS.md` a metodika
`dump*` → `trace*` → `match*` z `../../METHODOLOGY.md`:

- **`dump*` / `mk*`** vytáhnou z originálu data a uloží je do `../data/`
- **`trace*`** nahrají z běžícího originálu záznam, proti kterému se měří
- **`match*`** porovnají remake s originálem a **vypíšou počet kontrol
  a počet rozdílů**. Milník je hotový, když je rozdílů nula.

Python nástroje potřebují **SkoolKit** vendorovaný ve svision
(`app/svision/sources/skoolkit`, R-008), JS nástroje umí načíst soubory
aplikace přes shim `app/svision/tools/nodeEnv.mjs` (R-001).

## Kazeta a obraz paměti

| nástroj | co dělá |
|---|---|
| `aticlib.py` | **jediné místo, kde je napsané, co je na kazetě** a jak se z ní skládá obraz paměti. Čte TZX, rozmíchá kód smyčkou `RRD` (`descramble()`), vrátí obraz RAM (`memory_image()`). Ostatní nástroje to berou odsud. |
| `tapinfo.py` | rozebere kazetu blok po bloku; `--basic` vypíše i zavaděč v BASICu. Výstup je zapsaný v `../sources/docs/tape_layout.md`. |
| `mksnapshot.sh` | z kazety udělá snapshot (`build/aticatac.z80`) a surovou RAM (`build/aticatac.bin`) přes `tap2sna.py`. |
| `matchdescramble.py` | ★ **30 209 kontrol, 0 rozdílů** — replika rozmíchávací smyčky proti paměti simulátoru. Porovná i s cizím dumpem `.z80` (informativně: má vyřezanou ochranu). |

## Obrazovka

| nástroj | co dělá |
|---|---|
| `mkscreen.py` | `.scr` → `../data/loading.json` (videopaměť tak, jak leží ve stroji). |
| `matchloading.py` | ★ **20 736 kontrol, 0 rozdílů** — kazeta, `.scr`, `data/loading.json` a paměť simulátoru jsou tentýž obrázek. |
| `playtrace.py` | spustí hru v simulátoru, odsimuluje stisky kláves, uloží snímky (`.png` + `.scr`), volitelně mapu pokrytí kódu (`--map`) a celou RAM (`--dump`). |
| `mkroom.py` | z běhu originálu vytáhne statickou podobu startovní místnosti a panelu → `../data/screen.json` + referenční snímek pro `matchscreen.mjs`. |
| `matchscreen.mjs` | ★ **6912 kontrol, 0 rozdílů** — obrazovka složená **skutečným kódem z prohlížeče** (`app/screenComposer.js`) proti videopaměti originálu. |

## Worker

| nástroj | co dělá |
|---|---|
| `runworker.mjs` | ★ **15 kontrol, 0 chyb** — projde celý protokol workeru bez prohlížeče (`app/WORKER-PROTOCOL.md`): tik, ovládání, pauza, reset a **propsání semínka**. |

## Co přibude

`dumpsprites.py`, `dumprooms.py`, `dumpfont.py`, `dumptext.py` (M2),
`tracephysics.py` + `matchphysics.mjs` (M3), `tracesound.py` +
`matchsound.mjs` (M6), `regress.mjs` (zapojení do `svtool regress --all`).
**Žádný z nich nevznikne dřív, než bude co měřit.**
