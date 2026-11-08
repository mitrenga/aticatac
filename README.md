ATIC ATAC
=====================
The 1983 classic, reborn for modern web browsers.

## About
Originally written in 1983 by Ultimate Play The Game for the 48K ZX Spectrum.
This will be a faithful remake based on the original ZX Spectrum version — not
an emulator and not a binary copy.

**Status: early** (M0 in progress, M1 done, 2026-09-17). The tape has been
taken apart, the scrambled code unscrambled and checked against a simulator
byte for byte, the loading screen is the real one off the tape, and the game
screen is the original's own picture — but **nothing moves yet**, because how
anybody moves has not been read out of the program. That is the method, not an
oversight: see `MILNIKY.md` for the numbers and `ZADANI.md` for what is
measured (★) and what is still a guess (?).

- 256×192 + border, integer scaling, `ZXPlatform`
- **LOAD TAPE**: the real loading screen off the tape, loaded byte by byte
- the original's own choice of character (knight, wizard, serf)
- keyboard, gamepad, touch

What is checked, and with how many checks:

| tool | result |
|---|---|
| `tools/matchdescramble.py` | 30 209 checks, 0 differences |
| `tools/matchloading.py` | 20 736 checks, 0 differences |
| `tools/matchscreen.mjs` | 6 912 checks, 0 differences |
| `tools/runworker.mjs` | 15 checks, 0 failures |

Still to come: the rooms and the graphics out of the program (M2), walking
(M3), the rules of the castle (M4), the enemies (M5), the sound (M6).

## Requirements
- PHP 8.1+
- nginx
- MySQL / MariaDB
- Node.js + terser, for building the bundle (`npm i -g terser`)
- es-check, for the ES2018 gate in `svtool verify` (`npm i -g es-check`)
- Python 3, only for the tools that extract and verify the data of the original

## Running it
1. `config/config.php` out of `config/config.php.sample`, database out of
   `config/createDB.sql`
2. the tape image into `sources/tape/` (see below), then
   `./tools/mksnapshot.sh` and `./tools/mkroom.py` to regenerate `data/`
3. serve the directory with nginx + PHP (`config/nginx.conf` is the sample)

The original tape image is copyrighted and is **not** part of this repository —
it is needed only to regenerate the game data, see `sources/README.md`.

## License
See the [LICENSE](LICENSE) file.
