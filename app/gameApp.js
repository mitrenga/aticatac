const { Version } = await import('./version.js?ver='+window.srcVersion);
const { AbstractApp } = await import('./svision/js/abstractApp.js?ver='+window.srcVersion);
const { AudioManager } = await import('./audioManager.js?ver='+window.srcVersion);
const { ZXFonts8x8 } = await import('./svision/js/platform/canvas2D/zx/zxFonts8x8.js?ver='+window.srcVersion);
const { Fonts5x5 } = await import('./svision/js/platform/canvas2D/fonts5x5.js?ver='+window.srcVersion);
const { Fonts3x3 } = await import('./svision/js/platform/canvas2D/fonts3x3.js?ver='+window.srcVersion);
const { ZXResetModel } = await import('./svision/js/platform/canvas2D/zx/zxResetModel.js?ver='+window.srcVersion);
const { MenuModel } = await import('./menuModel.js?ver='+window.srcVersion);
const { AboutModel } = await import('./aboutModel.js?ver='+window.srcVersion);
const { HallOfFameModel } = await import('./hallOfFameModel.js?ver='+window.srcVersion);
const { GameModel } = await import('./gameModel.js?ver='+window.srcVersion);
const { GameOverModel } = await import('./gameOverModel.js?ver='+window.srcVersion);
const { TapeLoadingModel } = await import('./tapeLoadingModel.js?ver='+window.srcVersion);
const { ZXErrorEntity } = await import('./svision/js/platform/canvas2D/zx/zxErrorEntity.js?ver='+window.srcVersion);
const { Tool } = await import('./svision/js/tool.js?ver='+window.srcVersion);
const { ZXColor } = await import('./svision/js/platform/canvas2D/zx/zxColor.js?ver='+window.srcVersion);
// begin code

/**
 * Atic Atac application shell (M1 skeleton, built on the Lunar Jetman and
 * Sabre Wulf ones — the same company, the same machine, the same discipline,
 * and a ZX game on ZXPlatform).
 * LoadingModel -> MenuModel -> GameModel (the game) -> GameOverModel, plus
 * TapeLoadingModel, HallOfFameModel and AboutModel off the menu.
 *
 * ★ **LOAD TAPE is one of the ways to start**, not a decoration: the tape
 * carries a SCREEN$ block (`ATSP`, 6912 bytes at $4000) and the remake loads
 * that picture for real, byte by byte, because the sound *is* those bytes
 * (tapeLoadingModel.js, data/loading.json, ZADANI chap. 1).
 *
 * What the original's own GAME SELECTION screen offers is ★ measured, read
 * off the running original (tools/playtrace.py, frame 300):
 *
 * - `1 KEYBOARD`, `2 KEMPSTON JOYSTICK`, `3 CURSOR   JOYSTICK`
 * - `4 KNIGHT`, `5 WIZARD`, `6 SERF`
 * - `0 START GAME`, and `(C)1983 A.C.G. ALL RIGHTS RESERVED` along the bottom
 *
 * Two things follow from that and both are the original's, not the remake's:
 * **there is no two-player game** (so the remake offers none either), and
 * **the character is a choice the player makes before the game starts**.
 *
 * ? Which keys the KEYBOARD option then reads is **not measured yet**
 * (ZADANI chap. 9): that is M0 work on the program itself. Until it is read,
 * the remake's defaults are the arrows and SPACE, as in the sibling remakes,
 * and **every key comes from SETTINGS** — nothing is accepted beside the
 * configured keys, so the remap dialog always tells the truth.
 *
 * ? Whether the game has music, and what its sounds are, is **not measured**
 * (M6). Until then there is one bus and one volume, as in Sabre Wulf (R-024).
 *
 * ? Whether the original has a hall of fame of its own is **not measured**
 * either (ZADANI chap. 9, question 14). The remake has one, as the siblings
 * do; the day the original's own is found, it becomes fidelity, and if there
 * is none, this one is a deviation and goes in ZADANI chap. 10.
 */
export class GameApp extends AbstractApp {

  /**
   * ★ The original's GAME SELECTION has no two-player game — the remake has
   * one player and nothing to choose (tools/playtrace.py, frame 300).
   */
  static get PLAYERS() { return [1]; }

  /** ★ the original's own choice: 4 KNIGHT / 5 WIZARD / 6 SERF */
  static get CHARACTERS() { return ['knight', 'wizard', 'serf']; }

  constructor(platform, importPath, wsURL, devModeName, appIconSprite) {
    super(platform, 'bodyApp', importPath, wsURL);

    this.worker = new Worker(this.importPath+'/gameWorker.js?ver='+window.srcVersion);
    this.worker.onmessage = (event) => {
      if (this.model) {
        this.model.handleWorkerMessage(event);
      }
    };

    this.version = Version;
    this.devModeName = devModeName;
    this.appIconSprite = appIconSprite;

    this.audioManager = new AudioManager(this);
    // one switch for both buses: the music follows the sounds (menuModel.js)
    this.muted = {sounds: false};

    // ★ These are the **remake's** fonts — menus, dialogs, settings — and
    // they are svision's, ZX ROM font and all. Whether the **game's own**
    // screen is printed with the ROM font or with a character set of its own
    // is ? **not measured yet** (ZADANI chap. 3): Sabre Wulf and Jetpac turned
    // out to use the ROM font, Lunar Jetman its own set at $D347, so neither
    // answer may be assumed here. Until M1's panel measurement settles it,
    // the game screen is drawn out of the original's own captured bytes and
    // nothing here is used for it.
    this.fonts = {
      zxFonts8x8Mono: new ZXFonts8x8(this, false),
      zxFonts8x8: new ZXFonts8x8(this, true),
      zxFonts8x8Keys: new ZXFonts8x8(this, false),
      zxFonts8x8Title: new ZXFonts8x8(this, true),
      fonts5x5: new Fonts5x5(this),
      fonts3x3: new Fonts3x3(this)
    };
    // the name of the game in the panel (GameInfoEntity.gameTitle): the font
    // of Cimmerjan (1993, Sindicato del Software), svision/fonts/cimmerjan.ch8.hex.txt
    this.fonts.zxFonts8x8Title.setFontsData('0000000000000000181818181800180000363624000000000000000000000000000000000000000000626408102646000038603762623C000018306000000000000C181818180C000030181818183000000000000000000000000000000000000000000000181830000000007E00000000000000000030300000000000000000003C6E6E76763C000018381818183C00003C660E3C707E00003C660C06663C00000C1C2C4C7E0C00007C607C06663C00003C607C66663C00007E060C0C181800003C663C66663C00003C66663E063C00000018180018180000001818001818300000000000000000000000047E0400000000000000000000003C660C1800180000000000000000005C7666667E667600DC76667C6676DC000E3240C0C2E67C00E070686C6666FC00FE60FC60607AC600C67A6060FC6060000E3060C6CEF66E00C0606C7E7666C2003818181818183C007618189898D87000E66870786C64F6007030303030323E0044EEFED6D6D64400CCD6D6E6C4C8DE001C3666C6C67C3800F86C66766C60F0003E6CCCDC6C0C1E00EE72666C786CE6003C66603C86C67C00EE3C7060666C3800F62646CED6D66600E6646868707060003462C2CADA7E2400C66C3838386CC600CCCE4E3606CC78007E460C1830627E000018001818181818DFCCD3E3C6C8D6000018001830663C00000000000000000000000000000000FF0000000000000000003E6646464E3600006E76647C667C00003E626060623E00780C3E6666663C00003C666C7E603E00006E726060F86060003A6E663E26663C00606C7666646E000C00381818181C00003E0606664E3C0000666468786C66003030303030303C00005A756D696A6B00005C766262646E0000003E6363633E00006C7666667C606000366E666E3E0606006C76666C786E00003C603C06663C000030FE6060623C0000662666466E36000076366262663C0000EB6BCBDBD36D0000663C18183C660000666426361C7800007E060C18307E00309F3FFF00FFFFFF3E5C766262646E0066006626466E360000000000000000003C429DB1B19D423C');
    // the keycap font of the on-screen keyboard (ZXPlayerNameEntity), the same
    // glyphs as in the other games
    this.fonts.zxFonts8x8Keys.setFontsData('00000000000000000010101010001000002424000000000014147E28FC505000107C507C14547C1042A44810244A8400001028102A443A00000810000000000000182020202018000030080808083000000014083E081400000008083E0808000000000000080810000000003E00000000000000001818000204081020408000007C4C5454647C000018280808083E00007C440438407C00007C441804447C00001828487E081C00007C407C04447C00007C407C44447C00007C440810101000007C443844447C00007C44447C047C000000001000001000000010000010102000000408100804000000003E003E00000000100804081000007C441C100010003C42BD85BDA5BE78003C42427E42E70000FC427C4242FC00007E424040427E0000FE42424242FE0000FE42784042FE0000FE42784040E000007E42404E427E0000E7427E4242E700007C101010107C00007E08080848780000E648705844E60000E040404242FE0000C3665A4242E70000C762524A46E700007E424242427E0000FE42427E40E000007E424242527E0800FE42427E44E700007E407E02427E0000FE92101010380000CE444444447E0000E742424224180000D7929292926C0000EE44382844EE0000EE442810103800007E440810227E001C10101010101C0000004020100804003808080808083800001038541010100000000000000000FF003C247020207C0000007C047C447E00C0407C4444447C0000007C4440407C000C047C4444447E0000007C447C407C003C2470202020700000007C44447C047CC0407C444444E6001000701010107C000800380808084878C0404C506058CC007010101010107C000000FC545454D6000000FC444444E60000007C4444447C0000007E22223E207000007C44447C040600007C242020700000007C407C04FC0000207820202038000000CC4444447E000000CE44442838000000D65454547E000000C6281028C6000000CC44447C047C00007E4418227E00000E083008080E0000080808080808000070100C1010700000142800000000003C4299A1A199423C');
    // Extra glyphs + hard/short spaces live in the game (svision core fonts are ASCII + normal space).
    this.fonts.fonts5x5.addGlyphs({
      'Ⓥ': {width: 3, data: [[0,2,1,1], [0,3,1,1], [1,4,1,1], [2,3,1,1], [2,2,1,1]]},
      // devModeName banner decoration
      '◢': {width: 4, data: [[4,0,1,1], [3,1,2,1], [2,2,3,1], [1,3,4,1], [0,4,5,1]]},
      '◤': {width: 4, data: [[0,0,5,1], [0,1,4,1], [0,2,3,1], [0,3,2,1], [0,4,1,1]]}
    });
    this.fonts.fonts5x5.addSpace('␣', {width: 2, breaking: false, stretch: true});

    this.fonts.zxFonts8x8.addGlyphs('‗⋅', '000000000000F8F80000000030000000');
    // the 16 x 16 close cross of the panel button (GameInfoEntity.pauseButton):
    // a bold X, symmetric about both axes, in four 8 x 8 quarters — top left,
    // top right, bottom left, bottom right — set as two lines of two glyphs
    this.fonts.zxFonts8x8Mono.addGlyphs('◰◳◱◲', '3078FC7E3F1F0F070C1E3F7EFCF8F0E0070F1F3F7EFC7830E0F0F8FC7E3F1E0C');
    this.fonts.zxFonts8x8.addSpace('␣', {width: 3, breaking: false, stretch: false});
    this.fonts.zxFonts8x8.addSpace('▭', {width: 4, breaking: false, stretch: false});

    // ★ The original offers KEYBOARD, KEMPSTON JOYSTICK and CURSOR JOYSTICK
    // (its own GAME SELECTION screen). ? Which keys the keyboard option reads
    // is not measured yet (M0), so the remake's defaults are the arrow keys
    // and SPACE, as in the sibling remakes (getControls()), and
    // **every key comes from SETTINGS** — nothing is accepted beside the
    // configured keys, so the remap dialog always tells the truth. The mouse
    // is not offered for the game: it serves the buttons and the menu.
    this.controlsOptions = {
      keyboard: {
        device: 'keyboard',
        keys: [
          {action: 'left', label: 'WALK LEFT'},
          {action: 'right', label: 'WALK RIGHT'},
          {action: 'up', label: 'WALK UP'},
          {action: 'down', label: 'WALK DOWN'},
          {action: 'fire', label: 'WEAPON'},
          {action: 'sounds', label: 'MUTE SOUNDS'}
        ]
      },
      gamepads: {
        device: 'gamepads',
        keys: [
          {action: 'left', label: 'WALK LEFT', eventKey: 'GamepadLeft'},
          {action: 'right', label: 'WALK RIGHT', eventKey: 'GamepadRight'},
          {action: 'up', label: 'WALK UP', eventKey: 'GamepadUp'},
          {action: 'down', label: 'WALK DOWN', eventKey: 'GamepadDown'},
          {action: 'fire', label: 'WEAPON', eventKey: 'GamepadFire'},
          // the buttons of the menu, the dialogs and the tape loading listen
          // to GamepadOK (like manicminer, jetsetwilly)
          {action: 'ok', label: 'OK', eventKey: 'GamepadOK'},
          {action: 'exit', label: 'EXIT', eventKey: 'GamepadExit'}
        ]
      },
      // ★ Touch controls are part of M1, not of a later milestone. That is the
      // lesson of Underwurlde, where they were put off and left a hole (M5b),
      // confirmed by Sabre Wulf and Jetpac.
      //
      // One half of the screen is a **stick** — all eight directions, because
      // ? the original walks in eight and a diagonal is two of them held
      // together — the other a **weapon button**. Which half is which is the
      // left-handed / right-handed choice in SETTINGS; that is all `types`
      // says.
      touchscreen: {
        device: 'touchscreen',
        types: {
          // ★ default is the weapon on the left and the stick on the right;
          // the first key is also the fallback for a broken cookie
          keys: [
            'leftWeapon',
            'rightWeapon'
          ],
          rightWeapon: {
            left: {half: 'stick', sprite: 'stick'},
            right: {half: 'weapon', sprite: 'weapon'}
          },
          leftWeapon: {
            left: {half: 'weapon', sprite: 'weapon'},
            right: {half: 'stick', sprite: 'stick'}
          }
        },
        // What each half does. `rect` is a fraction of that half
        // ([x, y, width, height]), so the layout does not depend on how big
        // the half happens to be — a phone gets the same thing upright and on
        // its side.
        halves: {
          // ? the stick is **both axes**: the original walks in eight
          // directions, and a diagonal is two of them held at once
          stick: {
            icon: 'stick',
            zones: [
              {rect: [0, 0, 1, 1], type: 'joystick', control: 'both',
               actions: {left: 'left', right: 'right', up: 'up', down: 'down'}}
            ]
          },
          weapon: {
            icon: 'weapon',
            zones: [
              {rect: [0, 0, 1, 1], type: 'button', action: 'fire'}
            ]
          }
        },
        // A short tap has to be seen by the worker: it reads the controls once
        // per pass of the main loop (50.08 Hz), so even the briefest tap is
        // held at least this long.
        tapHoldTime: 120,
        // how far the finger has to move before the stick changes direction
        joystickStep: 10,
        icons: {
          // the four arrows for the stick are a control glyph of the svision
          // family (the same one the sibling remakes use)
          stick: {
            compressedSpriteData: 'lP101300N0E2P0111030Z051012320B0P020N0601234561718191AB9BCDB1BDCB9BA19181716543210'
          },
          weapon: {
            // ? **A plain button, on purpose.** Sabre Wulf puts its own sword
            // here and Lunar Jetman its own Jetman, because both had their
            // sprites out of the program by then. Atic Atac's are M2, and
            // each of the three characters throws something of its own, so
            // there is nothing to put here yet that would be the game's.
            // A disc is the remake's own furniture, like the stick glyph —
            // when M2 reads the sprites, the character's own weapon replaces
            // it. Drawn on the same 39x23 canvas as the stick glyph so both
            // icons take the same room in the border.
            width: 39, height: 23, frames: 1, directions: 1,
            sprite: [[
              '---------------------------------------',
              '---------------------------------------',
              '---------------------------------------',
              '---------------##########--------------',
              '-------------##############------------',
              '------------################-----------',
              '-----------##################----------',
              '----------####################---------',
              '----------####################---------',
              '---------######################--------',
              '---------######################--------',
              '---------######################--------',
              '---------######################--------',
              '---------######################--------',
              '----------####################---------',
              '----------####################---------',
              '-----------##################----------',
              '------------################-----------',
              '-------------##############------------',
              '---------------##########--------------',
              '---------------------------------------',
              '---------------------------------------',
              '---------------------------------------'
            ]]
          }
        }
      }
    };

    this.controls = {
      keyboard: this.getControls('keyboard'),
      touchscreen: this.getControls('touchscreen'),
      gamepads: this.getControls('gamepads')
    };

    this.players = GameApp.PLAYERS[0];
    // ★ the original's own choice, and the only one it offers besides the
    // controls: KNIGHT, WIZARD or SERF. ? What actually differs between them
    // is not measured yet (ZADANI chap. 9, question 8) — the worker carries
    // the choice through so that the day it is measured there is a place for
    // it to land.
    this.character = Tool.readCookie('character', GameApp.CHARACTERS[0]);
    // ? how many lives the original gives is **not measured** — nothing is
    // asserted, and the panel is drawn from the original's own picture rather
    // than from a number we made up (M1)
    this.lives = null;
    this.score = 0;
    this.score2 = 0;
    this.hiScore = 0;
    this.player = 1;
    this.level = 0;
    // ★ the seed of the game's randomness, settled before the worker starts
    // so that a run can be repeated and a regression has a fingerprint
    // (../METHODOLOGY.md, ../STANDARDS.md). It is a field rather than a
    // constant because tools/runworker.js and the regression pass their own.
    this.gameSeed = 1;
    this.playerName = Tool.readCookie('playerName', '');
    this.globalData = false;
    this.id = 'GameApp';
    this.fetchDataId = '';
    this.setModel('LoadingModel');
    this.loadAppData();
  } // constructor

  getControls(device) {
    var result = {};

    switch (device) {
      case 'keyboard':
        // The defaults of the remake: the arrows and SPACE, as in the sibling
        // remakes. ? **Which keys the original itself reads is not measured**
        // (ZADANI chap. 9): its menu offers KEYBOARD, but what that means in
        // its own code is M0 work. When it is read, it becomes a preset in
        // SETTINGS — the defaults here do not change, because they are what a
        // player expects and what the siblings use.
        result = {left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp',
                  down: 'ArrowDown', fire: ' ', sounds: 'S'};
        break;
      case 'touchscreen':
        result = {supported: false, type: 'leftWeapon'};
        break;
      case 'gamepads':
        result = {supported: false, devices: {}};
        break;
    }

    switch (device) {
      case 'keyboard':
      case 'touchscreen':
        var cfgString = Tool.readCookie(device, false);
        if (cfgString !== false) {
          try {
            var cfg = JSON.parse(cfgString);
            Object.keys(cfg).forEach((item) => {
              result[item] = cfg[item];
              if (device == 'touchscreen' && !(result[item] in this.controlsOptions.touchscreen.types)) {
                result[item] = this.controlsOptions.touchscreen.types.keys[0];
              }
            });
          } catch (error) {
            console.error(error.message);
          }
        }
        break;
      case 'gamepads':
        var devicesString = Tool.readCookie('gamepads', false);
        if (devicesString !== false) {
          try {
            var devices = JSON.parse(devicesString);
          } catch (error) {
            console.error(error.message);
          } finally {
            if (Array.isArray(devices)) {
              devices.forEach((id) => {
                var deviceString = Tool.readCookie(id, false);
                if (deviceString !== false) {
                  try {
                    var device = JSON.parse(deviceString);
                  } catch (error) {
                    console.error(error.message);
                  } finally {
                    result.devices[id] = device;
                  }
                }
              });
            }
          }
        }
        break;
    }
    return result;
  } // getControls

  setModel(model) {
    if (model == 'MenuModel' && this.globalData === false) {
      // the fetch may still be pending or has failed: as a last resort try the
      // data cached in localStorage before bothering the user
      if (!this.loadGlobalDataFromStorage()) {
        this.showErrorMessage('Game data could not be loaded.', 'retry');
        return;
      }
    }
    var needResizeApp = false;
    var selectionItem = 0;
    if (this.model) {
      // where to put the menu cursor on the way back (menuModel.menuItems)
      if (this.model.id == 'TapeLoadingModel') {
        selectionItem = 6;
      } else if (this.model.id == 'AboutModel') {
        selectionItem = 7;
      } else if (this.model.id == 'HallOfFameModel') {
        selectionItem = 3;
      }
      this.model.shutdown();
      needResizeApp = true;
    }
    switch (model) {
      case 'LoadingModel':
        this.model = new ZXResetModel(this);
        break;
      case 'MenuModel':
        this.model = new MenuModel(this, selectionItem);
        break;
      case 'AboutModel':
        this.model = new AboutModel(this);
        break;
      case 'HallOfFameModel':
        this.model = new HallOfFameModel(this);
        break;
      case 'GameModel':
        this.model = new GameModel(this);
        break;
      case 'GameOverModel':
        this.model = new GameOverModel(this, 'MenuModel');
        break;
      case 'TapeLoadingModel':
        this.model = new TapeLoadingModel(this);
        break;
    } // switch
    this.model.init();
    if (needResizeApp) {
      this.resizeApp();
    }
  } // setModel

  /**
   * How many players the game runs with. ★ The original offers only one, so
   * this is here for the shape the sibling remakes share rather than for a
   * choice anybody makes.
   * @param {number} [players] - 1.
   * @returns {number} The number of players in force.
   */
  setPlayers(players) {
    if (GameApp.PLAYERS.indexOf(players) >= 0) {
      this.players = players;
    }
    return this.players;
  } // setPlayers

  /**
   * Which of the original's three characters plays. Anything that is not one
   * of GameApp.CHARACTERS is ignored, so a missing parameter keeps the
   * current choice.
   * @param {string} [character] - 'knight', 'wizard' or 'serf'.
   * @returns {string} The character in force.
   */
  setCharacter(character) {
    if (GameApp.CHARACTERS.indexOf(character) >= 0) {
      this.character = character;
      Tool.writeCookie('character', character);
    }
    return this.character;
  } // setCharacter

  /**
   * Starts a new game.
   * @param {number} [players] - 1; without it the menu's choice stays.
   */
  startGame(players) {
    this.setPlayers(players);
    this.score = 0;
    this.score2 = 0;
    this.player = 1;
    this.level = 0;
    // ? how many lives the original gives is not measured (M4)
    this.lives = (this.globalData && this.globalData.lives) || null;
    // a fresh seed per game, so two runs differ — but a recorded one can be
    // replayed exactly (WORKER-PROTOCOL.md)
    this.gameSeed = (Date.now() & 0x7FFFFFFF) || 1;
    this.setModel('GameModel');
  } // startGame

  applyGlobalData(global) {
    // ? **There is no data/global.json yet** — it is a snapshot of the
    // original's own variables and there is nothing measured to snapshot
    // (M2/M4). The server therefore sends null for it, which is not an error:
    // it is the honest answer while the question is open. Everything here has
    // to survive that, so that the menu comes up and LOAD TAPE works.
    var data = global || {};
    this.globalData = data;
    this.lives = data.lives !== undefined ? data.lives : this.lives;
    // ? whether the original has a hall of fame of its own is not measured
    // (ZADANI chap. 9, question 14), so a preset HI out of the game's data
    // would be the remake's invention — there is none until then
    if (data.hiScore && !this.hiScore) {
      this.hiScore = data.hiScore;
    }
  } // applyGlobalData

  setGlobalData(data) {
    this.applyGlobalData(data.data.global);

    var files = {};
    Object.keys(data.data).forEach((key) => {
      if (key == 'hiScore') {
        // the server's hall of fame wins over the game's preset one, but only
        // when somebody has actually beaten it
        this.hiScore = Math.max(this.hiScore || 0, data.data[key] || 0);
      } else if (key != 'global') {
        files[key] = data.data[key];
      }
    });
    // global goes last; a full localStorage is cleared and tried once more
    // (R-062)
    this.saveAppDataToStorage(files, data.data.global || {});
  } // setGlobalData

  // Load the application data: from the server when online (which also refreshes
  // localStorage), or rehydrate the global data from localStorage when offline.
  loadAppData() {
    if (navigator.onLine) {
      this.fetchDataId = this.fetchData('appData.db', false, {}, this, 2000);
    } else {
      this.loadGlobalDataFromStorage();
    }
  } // loadAppData

  loadGlobalDataFromStorage() {
    var stored = localStorage.getItem(window.appPrefix+'.global');
    if (stored !== null) {
      try {
        this.applyGlobalData(JSON.parse(stored));
        return true;
      } catch (error) {
        console.error(error.message);
      }
    }
    return false;
  } // loadGlobalDataFromStorage

  setData(data) {
    this.setGlobalData(data);
  } // setData

  errorData(error) {
    // The network request failed (offline, unreachable server, or the fetch
    // timeout). Fall back to the data cached in localStorage; if none exists,
    // log it and let the MenuModel guard surface the error to the user.
    if (!this.loadGlobalDataFromStorage()) {
      console.error(error.message ? error.message : error);
      return;
    }
    if (this.model && this.model.id == 'ZXResetModel'
        && !this.model.events.some((queued) => queued.id == 'setMenuModel')
        && !this.model.desktopEntity.modalEntity) {
      this.setModel('MenuModel');
    }
  } // errorData

  showErrorMessage(message, action) {
    var topModalEntity = this.model.desktopEntity.topModalEntity();
    topModalEntity.addModalEntity(
      new ZXErrorEntity(
        topModalEntity,
        -topModalEntity.absoluteX(),
        -topModalEntity.absoluteY(),
        this.fonts.zxFonts8x8,
        message,
        action,
        ZXColor.white,
        ZXColor.red
      )
    );
  } // showErrorMessage

} // GameApp
