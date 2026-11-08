# Protokol mezi `gameModel.js` a `gameWorker.js`

Worker drží herní stav a tiká; model do něj posílá jen vstupy a kreslí to,
co dostane zpátky.

## ? Stav je zatím tenký, a je to schválně

Lunar Jetman měl v M1 ve workeru rovnou **tabulku entit originálu** —
dvacet čtyři záznamů po dvaceti čtyřech bajtech — protože jeho hlavní smyčka
už byla nalezená. **Atic Ataku nalezená není** (30 209 B kódu, `ZADANI.md`
§1), takže worker drží jen to, co potřebuje protokol:

| klíč | obsah |
|---|---|
| `pass` | počítadlo průchodů |
| `character` | ★ `knight` / `wizard` / `serf` — volba z `GAME SELECTION` originálu |
| `score`, `hiScore` | skóre; ? formát skóre originálu je M2 |
| `lives` | ? **kolik životů originál dává, změřené není** — proto `null` |
| `entities` | ? prázdné: tabulka entit originálu je M2 |
| `controls` | `left`, `right`, `up`, `down`, `fire` |
| `sounds` | co se má přehrát (M6) |

Až M2 najde tabulku hry, `entities` dostane **tvar originálu** — bajty tak,
jak je drží on — ne tvar, který bychom si mezitím vymysleli. To je ten důvod,
proč tu teď žádný není.

## ★ Tik je 50,08 Hz

Frekvence přerušení ULA (69 888 T-stavů na snímek).

? **Jestli je originál na snímek vůbec vázaný, změřené není** (`ZADANI.md`
§9, otázka 4). Sabre Wulf měl průchod na dva snímky, Jetpac na snímek nečekal
vůbec a měl dvě kola s různou kadencí (0,568 dlouhého kola na snímek). Atic
Atac je od téhož autora z téhož roku jako Jetpac a **nemusí platit ani
jedno**. Proto se všechno měřené v M3–M5 zapisuje **na průchod**, ne na
snímek: až se kadence změří, je to výměna časové osy, ne přeměření fyziky.

## Model → worker

| zpráva | pole | význam |
|---|---|---|
| `init` | `initData: {headless, character, hiScore, seed}` | start nové hry. `headless: true` tiká jen na vyžádání zprávou `tick` (pro `tools/runworker.mjs`). |
| `controls` | `left`, `right`, `up`, `down`, `fire` (boolean) | úplný stav ovládání; posílá se při každé změně a **celý** — vlevo a nahoru naráz je úhlopříčka, ne spor. |
| `pause` | – | zastaví tikání. |
| `continue` | – | pokračuje. |
| `tick` | – | jeden průchod v režimu `headless`. |
| `reset` | – | zahodí stav. |

### `initData`

| klíč | obsah |
|---|---|
| `character` | ★ `knight`, `wizard` nebo `serf` — volba z menu originálu (`4 KNIGHT` / `5 WIZARD` / `6 SERF`, změřeno `tools/playtrace.py`). ? Čím se od sebe liší, je M3/M4. |
| `hiScore` | nejvyšší skóre. ? Jestli má originál vlastní síň slávy, změřené **není** (`ZADANI.md` §9, otázka 14) — do té doby je tabulka na serveru přídavek remaku. |
| `seed` | **semínko generátoru náhody** — od začátku, ne dodatečně (`../STANDARDS.md`). Bez něj se průlet nedá zopakovat a regres nemá o co opřít otisk. |

**Dvou hráčů si tu nevšimneš schválně**: ★ originál dvouhráčovou hru
nenabízí (jeho `GAME SELECTION` má tři ovládání, tři postavy a `START GAME`,
nic víc).

### ★ Náhoda

`Math.random()` v herní logice **nikdy** (`../METHODOLOGY.md`). Worker má
seedovaný xorshift (`nextRand`) a **dosaditelný zdroj**: `match*` nástroje
ho vymění a sypou do něj hodnoty nahrané z originálu „call by call".

? Kde bere náhodu originál, změřené zatím není. Sabre Wulf měl `LD A,R`
a mixér, Jetpac zvedal počítadlo po každé entitě a jednou za dlouhé kolo do
něj přimíchal obnovovací registr **a bajt ze Spectrovské ROM**. Až se to
u Atic Ataku najde, reprodukuje se **mixér i prahy přesně** a nahradí se jen
vstupní entropie. ? A najde se: rozmístění se mezi hrami mění (`ZADANI.md`
§4, pravidlo 9).

## Worker → model

| zpráva | pole | význam |
|---|---|---|
| `frame` | `pass`, `entities[]`, `panel`, `controls`, `sounds[]` | jeden průchod. Posílá se po každém tiku. |
| `gameOver` | `score` | konec hry (M4). |
| `error` | `message` | chybějící data nebo rozbitý stav. |

### `frame`

| klíč | obsah |
|---|---|
| `pass` | počítadlo průchodů. |
| `entities[]` | ? zatím prázdné pole (viz výš). |
| `panel` | `{score, hiScore, lives, character}`. ? `lives` je zatím `null` — kolik životů originál dává, změřené není, a panel se kreslí z jeho vlastních bajtů, ne z čísla, které bychom si vymysleli. |
| `controls` | stav ovládání, jak ho worker vidí. |
| `sounds[]` | co se má přehrát (M6). Zatím vždycky prázdné. |

## Stav

**M1: worker tiká, drží stav a nikým nehýbe.** Popis místnosti je M2, chůze
M3, pravidla hradu M4, nepřátelé M5, zvuk M6 — a každý z nich dorazí
s vlastním `match*` nástrojem.

Hlídá to `tools/runworker.mjs`: projde celý protokol bez prohlížeče a
kontroluje, že tik, pauza, ovládání i semínko dělají to, co je tady napsané.
