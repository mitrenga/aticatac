#!/usr/bin/env node
/**
 * Projde celou smyčku workeru bez prohlížeče.
 *
 *   ./tools/runworker.mjs [--frames N] [--verbose]
 *
 * `app/gameWorker.js` se spustí v atrapě prostředí workeru (postMessage,
 * setTimeout, importScripts) v režimu `headless`, kde tiká na vyžádání,
 * a projde se celý protokol z `app/WORKER-PROTOCOL.md`: `init`, `controls`,
 * `tick`, `pause`, `continue` a `reset`.
 *
 * Kontroluje se:
 *
 * - worker odpoví na `init` snímkem a v něm je panel i stav ovládání,
 * - **volba postavy dorazí až do workeru** a neznámá se zahodí (★ originál
 *   nabízí KNIGHT, WIZARD a SERF a nic jiného),
 * - tik posouvá počítadlo průchodů o jeden,
 * - stav ovládání dorazí celý, **včetně dvou směrů naráz** — vlevo a nahoru
 *   je úhlopříčka, ne spor,
 * - `pause` zastaví a `continue` rozjede, `reset` zahodí stav,
 * - **seed se opravdu propisuje**: dva běhy s týmž seedem dají tentýž stav.
 *   To je podmínka regresu (`../METHODOLOGY.md`) — dokud worker nikým nehýbe,
 *   kontroluje se aspoň, že ta cesta drží.
 *
 * ★ **M1: worker nikým nehýbe**, takže se tu nekontroluje žádný pohyb. Chůze
 * je M3 a dorazí s `tools/matchphysics.mjs`. Nekontroluje se ani tvar tabulky
 * entit: **tabulka originálu zatím není nalezená** (M2), a kontrolovat tvar,
 * který jsme si vymysleli, by bylo horší než nekontrolovat nic.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import vm from 'node:vm';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

const CHARACTERS = ['knight', 'wizard', 'serf'];

function startWorker(onMessage) {
  const sandbox = {
    console,
    performance: {now: () => Date.now()},
    setTimeout: () => 0,
    clearTimeout: () => {},
    postMessage: onMessage,
    importScripts(name) {
      const file = name.split('?')[0];
      vm.runInContext(fs.readFileSync(path.join(ROOT, 'app', file), 'utf8'), context,
                      {filename: file});
    },
  };
  sandbox.self = sandbox;
  sandbox.location = {search: ''};
  const context = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'app/gameWorker.js'), 'utf8'), context,
                  {filename: 'gameWorker.js'});
  return {
    send(message) { sandbox.onmessage({data: message}); },
    context: sandbox,
  };
}

let checks = 0, failures = 0;
function check(condition, label) {
  checks++;
  if (!condition) {
    failures++;
    console.log('  CHYBA: '+label);
  }
}

function run(seed, frames, character, verbose) {
  const messages = [];
  const worker = startWorker((message) => {
    messages.push(message);
    if (verbose) { console.log(JSON.stringify(message).slice(0, 200)); }
  });
  worker.send({id: 'init', initData: {headless: true, character: character,
                                      seed: seed, hiScore: 0}});
  for (let step = 0; step < frames; step++) {
    worker.send({id: 'tick'});
  }
  return {worker, messages};
}

function main() {
  const args = process.argv.slice(2);
  const frames = args.includes('--frames')
    ? parseInt(args[args.indexOf('--frames')+1], 10) : 100;
  const verbose = args.includes('--verbose');

  const {worker, messages} = run(1, frames, 'knight', verbose);

  const first = messages[0];
  check(first && first.id === 'frame', 'init odpovědělo snímkem');
  check(first && first.panel !== undefined, 'snímek nese panel');
  check(first && first.controls !== undefined, 'snímek nese stav ovládání');
  check(first && Array.isArray(first.entities), 'snímek nese pole entit');
  check(first && first.panel.lives === null,
        'životy jsou null, protože kolik jich originál dává, změřené není');

  // postava dorazí až do workeru a neznámá se zahodí
  CHARACTERS.forEach((name) => {
    const frame = run(1, 1, name, false).messages[0];
    check(frame.panel.character === name, `postava ${name} dorazila do workeru`);
  });
  const fallback = run(1, 1, 'dragon', false).messages[0];
  check(fallback.panel.character === CHARACTERS[0],
        'neznámá postava se zahodí a zůstane výchozí');

  // tik posouvá průchod o jeden
  const last = messages[messages.length-1];
  check(last.pass === frames, `${frames} tiků = ${frames} průchodů (je ${last.pass})`);

  // ovládání dorazí celé, i dva směry naráz
  worker.send({id: 'controls', left: true, up: true, fire: true});
  worker.send({id: 'tick'});
  const controls = messages[messages.length-1].controls;
  check(controls.left && controls.up && controls.fire && !controls.right,
        'stav ovládání dorazil celý, včetně úhlopříčky');

  // pause / continue / reset
  const before = messages.length;
  worker.send({id: 'pause'});
  worker.send({id: 'continue'});
  worker.send({id: 'tick'});
  check(messages.length === before+1, 'pause a continue nerozbijí tikání');
  worker.send({id: 'reset'});
  worker.send({id: 'tick'});
  check(messages.length === before+1, 'reset zastaví headless tikání');

  // seed: tentýž seed dá tentýž stav; jiný projde protokolem
  const a = run(12345, 10, 'wizard', false).messages;
  const b = run(12345, 10, 'wizard', false).messages;
  const c = run(99999, 10, 'wizard', false).messages;
  const state = (msgs) => JSON.stringify(msgs[msgs.length-1]);
  check(state(a) === state(b), 'tentýž seed dá tentýž stav');
  check(state(c).length > 0, 'jiný seed projde protokolem');

  console.log(`${checks} kontrol, **${failures} chyb**`);
  process.exit(failures ? 1 : 0);
}

main();
