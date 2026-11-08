// begin code

/**
 * Atic Atac game worker.
 *
 * It keeps the game state, the clock and the protocol (WORKER-PROTOCOL.md);
 * the model only sends it the controls and draws what comes back.
 *
 * ★ **M1: the worker ticks, holds the state and moves nobody.** That is not a
 * gap, it is the method. How a room is described is M2, how anybody walks is
 * M3, the rules of the castle are M4, the enemies M5 and the sound M6 — each
 * arrives with its own `match*` tool that compares it with the original. A
 * handler written here before it was read out of the program would be an
 * unmeasured number in the game, which is the one thing this project does not
 * do (../METHODOLOGY.md).
 *
 * ? **The shape of the state is deliberately thin**, and thinner than Lunar
 * Jetman's: that remake could lay out twenty-four records of twenty-four
 * bytes on the first day, because its main loop had already been found.
 * Atic Atac's has not (30 209 bytes, ZADANI chap. 1), so the worker keeps
 * what the protocol needs and nothing else. The day M2 finds the game's own
 * table, `entities` takes its shape — bytes and all, as the original holds
 * them — rather than a shape we invented in the meantime.
 *
 * ★ The tick is the ULA interrupt rate, 50.08 Hz. ? Whether the original is
 * tied to the frame at all is **not measured** (ZADANI chap. 9, question 4):
 * Sabre Wulf took two frames per pass, Jetpac did not wait for the frame at
 * all. Everything measured later is therefore written down **per pass**,
 * never per frame — the day the cadence is measured, that is a change of time
 * base rather than a re-measurement.
 */

var TICK_MS = 1000*69888/3500000;     // 50.08 Hz, the ULA interrupt rate

/**
 * ★ The original's three characters, in the order of its own GAME SELECTION
 * screen (tools/playtrace.py, frame 300). ? What differs between them is not
 * measured yet (ZADANI chap. 9, question 8); the worker carries the choice so
 * that there is somewhere for the answer to land.
 */
var CHARACTERS = ['knight', 'wizard', 'serf'];

var state = null;
var timer = 0;
var lastTime = false;
var accumulator = 0;

/**
 * The source of randomness — **injectable from the first line of the
 * project**, not bolted on afterwards (../STANDARDS.md).
 *
 * `Math.random()` cannot be seeded, so a run made with it cannot be repeated
 * and a regression has no fingerprint to compare against
 * (../METHODOLOGY.md). This is a plain 32 bit xorshift fed by the seed of the
 * `init` message; `match*` tools replace `nextRand` wholesale and push the
 * values recorded off the original back in, call by call.
 *
 * ? Where the original takes its randomness from is **not measured yet**.
 * Sabre Wulf used `LD A,R` through a mixer; Jetpac turned out to bump a
 * counter after every entity and to stir in the refresh register **and a byte
 * of the Spectrum ROM**. When Atic Atac's is read, the mixer and its
 * thresholds are reproduced exactly and only the entropy going in is replaced
 * by this — ? and the game does randomise (its rooms differ between games),
 * so there will be one to find.
 */
var randState = 1;

function seedRand(seed) {
  randState = (seed >>> 0) || 1;
} // seedRand

function nextRand() {
  randState ^= randState << 13; randState >>>= 0;
  randState ^= randState >>> 17;
  randState ^= randState << 5;  randState >>>= 0;
  return randState & 0xFF;
} // nextRand

function reset() {
  clearTimeout(timer);
  timer = 0;
  lastTime = false;
  accumulator = 0;
  seedRand(1);
  state = {
    running: false, paused: false, headless: false,
    pass: 0,
    character: CHARACTERS[0],
    score: 0,
    hiScore: 0,
    seed: 1,
    // ? how many lives the original gives, and what the roast chicken in its
    // panel counts down, is **not measured** (ZADANI chap. 4) — so nothing is
    // asserted here and the panel is drawn out of the original's own bytes
    lives: null,
    // ? the game's own entity table is M2; until then there is nothing to
    // carry and an invented table would be worse than an empty one
    entities: [],
    controls: {left: false, right: false, up: false, down: false, fire: false},
    sounds: []
  };
} // reset

/**
 * The frame the model draws.
 * @returns {Object} The 'frame' message.
 */
function frame() {
  return {
    id: 'frame',
    pass: state.pass,
    entities: state.entities,
    panel: {
      score: state.score,
      hiScore: state.hiScore,
      lives: state.lives,
      character: state.character
    },
    controls: state.controls,
    sounds: state.sounds.splice(0, state.sounds.length)
  };
} // frame

/**
 * One pass over the entities — one tick.
 *
 * **M1 moves nobody**, see the comment at the top of the file.
 */
function pass() {
  state.pass++;
  postMessage(frame());
} // pass

function schedule() {
  if (!state.running || state.paused || state.headless) {
    return;
  }
  timer = setTimeout(() => {
    var now = Date.now();
    if (lastTime === false) {
      lastTime = now;
    }
    accumulator += now - lastTime;
    lastTime = now;
    // catch up rather than drift, but never run away with it after a stall
    var steps = Math.min(Math.floor(accumulator/TICK_MS), 4);
    accumulator -= steps*TICK_MS;
    for (var step = 0; step < steps; step++) {
      pass();
    }
    schedule();
  }, TICK_MS);
} // schedule

onmessage = function(event) {
  var message = event.data;
  switch (message.id) {

    case 'init':
      reset();
      var initData = message.initData || {};
      state.headless = !!initData.headless;
      state.hiScore = initData.hiScore || 0;
      state.seed = initData.seed || 1;
      if (CHARACTERS.indexOf(initData.character) >= 0) {
        state.character = initData.character;
      }
      seedRand(state.seed);
      state.running = true;
      postMessage(frame());
      schedule();
      break;

    case 'controls':
      Object.keys(state.controls).forEach((key) => {
        if (key in message) {
          state.controls[key] = !!message[key];
        }
      });
      break;

    case 'pause':
      state.paused = true;
      clearTimeout(timer);
      lastTime = false;
      break;

    case 'continue':
      state.paused = false;
      lastTime = false;
      accumulator = 0;
      schedule();
      break;

    case 'tick':
      if (state.headless) {
        pass();
      }
      break;

    case 'reset':
      reset();
      break;

  } // switch
}; // onmessage

reset();
