#!/usr/bin/env node
/**
 * Porovná obrazovku, kterou remake složí, s videopamětí originálu.
 *
 *   ./tools/matchscreen.mjs [--verbose]
 *
 * Staví ji **skutečným kódem, který jde do prohlížeče** —
 * `app/screenComposer.js` nakrmený snímkem z `app/gameWorker.js` — a
 * porovnává ho bajt po bajtu se snímkem videopaměti běžícího originálu
 * (`build/ref/screen00600.scr`, dělá ho `tools/mkroom.py`).
 *
 * **Všech 6912 bajtů**: 6144 bitmapy a 768 atributů.
 *
 * ★ **Co tahle nula v M1 dokazuje a co ne.** Dokazuje, že cesta
 * originál → `data/screen.json` → `ScreenComposer` → videopaměť **nic
 * neztratí ani nepřidá**: ani řádek prohozený do lineárního pořadí, ani
 * atribut navíc, ani buňku posunutou o sloupec. Nedokazuje, že remake umí
 * nakreslit místnost — to se skládá ze zachyceného obrazu a je to provizorium
 * M1 (`ZADANI.md` §9, otázka 5).
 *
 * Až M2 najde formát místnosti, tenhle nástroj **zůstane a jeho referenční
 * snímek taky** — jen composer začne obrázek skládat z tabulek hry místo
 * z fotky. Nula se tím nesmí pokazit; to je na tom to cenné.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const REF = path.join(ROOT, 'build/ref/screen00600.scr');

function loadDataFile(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', name+'.json'), 'utf8'));
}

/** spustí gameWorker.js v atrapě workeru a vrátí jeho první snímek */
function workerFrame() {
  let frame = null;
  const sandbox = {
    console, performance: {now: () => Date.now()},
    setTimeout: () => 0, clearTimeout: () => {},
    postMessage: (message) => { if (!frame) { frame = message; } },
    importScripts() {},
  };
  sandbox.self = sandbox;
  sandbox.location = {search: ''};
  const context = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'app/gameWorker.js'), 'utf8'),
                  context, {filename: 'gameWorker.js'});
  sandbox.onmessage({data: {id: 'init', initData: {headless: true,
                                                   character: 'knight', seed: 1}}});
  return frame;
}

function offsetOf(y, col) {
  const third = y >> 6, charRow = (y >> 3) & 7, pix = y & 7;
  return (third << 11) | (pix << 8) | (charRow << 5) | col;
}

async function main() {
  const verbose = process.argv.includes('--verbose');
  if (!fs.existsSync(REF)) {
    console.error(`chybí ${REF} – spusť ./tools/mksnapshot.sh a ./tools/mkroom.py`);
    process.exit(2);
  }
  global.atob = (data) => Buffer.from(data, 'base64').toString('binary');
  await import(url.pathToFileURL(path.join(ROOT, 'app/svision/tools/nodeEnv.mjs')).href);
  const { ScreenComposer } = await import(
    url.pathToFileURL(path.join(ROOT, 'app/screenComposer.js')).href);
  const { ZXVideoRAM } = await import(
    url.pathToFileURL(path.join(ROOT, 'app/svision/js/platform/canvas2D/zx/zxVideoRAM.js')).href);

  const render = new ScreenComposer(loadDataFile('screen'));
  const videoRAM = new ZXVideoRAM();
  render.composeInto(videoRAM, workerFrame());

  const reference = fs.readFileSync(REF);
  let bitmapDiffs = 0, attrDiffs = 0;
  for (let index = 0; index < 6144; index++) {
    if (videoRAM.bytes[index] !== reference[index]) { bitmapDiffs++; }
  }
  for (let index = 6144; index < 6912; index++) {
    if (videoRAM.bytes[index] !== reference[index]) { attrDiffs++; }
  }
  if (verbose) {
    for (let row = 0; row < 24; row++) {
      let rowDiffs = 0;
      for (let col = 0; col < 32; col++) {
        for (let line = 0; line < 8; line++) {
          const at = offsetOf(row*8 + line, col);
          if (videoRAM.bytes[at] !== reference[at]) { rowDiffs++; }
        }
      }
      console.log(`  řádek ${String(row).padStart(2)}: ${rowDiffs} rozdílů v bitmapě`);
    }
  }
  console.log(`bitmapa  6144 kontrol, ${bitmapDiffs} rozdílů`);
  console.log(`atributy  768 kontrol, ${attrDiffs} rozdílů`);
  console.log(`celkem   6912 kontrol, **${bitmapDiffs+attrDiffs} rozdílů**`);
  process.exit(bitmapDiffs+attrDiffs ? 1 : 0);
}

main().catch((error) => { console.error(error); process.exit(2); });
