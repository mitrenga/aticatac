const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { AbstractEntity } = await import('./svision/js/abstractEntity.js?ver='+window.srcVersion);
const { BorderEntity } = await import('./borderEntity.js?ver='+window.srcVersion);
const { ZXVideoRAMEntity } = await import('./svision/js/platform/canvas2D/zx/zxVideoRAMEntity.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
const { ButtonEntity } = await import('./svision/js/platform/canvas2D/buttonEntity.js?ver='+window.srcVersion);
const { GameAreaEntity } = await import('./gameAreaEntity.js?ver='+window.srcVersion);
const { ZXColor } = await import('./svision/js/platform/canvas2D/zx/zxColor.js?ver='+window.srcVersion);
// begin code

/**
 * ABOUT GAME as a screen of its own — the original's game selection screen
 * (ATICATAC GAME SELECTION: the castle picture with the items on it) with the panel above
 * it and the about text and its buttons laid over the black middle of the
 * screen. Until 2026-09-07 it was a dialog over the menu (AboutEntity);
 * it became a screen so that the prelude can play under it.
 *
 * ★ The copyright line sits on the bottom row, where the original's own menu screen has it ($6283) — and
 * **the music plays here too**: $B3EC starts MusicData_GameComplete through PlayAudio_WaitKey
 * ($BD51), the variant that reads the keyboard between the notes and returns
 * at the first key. So the prelude stops on **any** input — a key, a mouse
 * button, a touch or a gamepad button — before the input reaches whatever it
 * was aimed at, and it does not start again.
 *
 * The menu is silent (menuModel.js), so this is the first place the browser
 * has had its gesture; the menu asks for it through ZXWaitForAudioEventEntity
 * before it opens this screen.
 *
 * The title bar keeps the dialog's counter: five clicks on it show the game
 * statistics from the server, five more the system information, five more the
 * text again. CLOSE (Escape, GamepadExit) goes back to the menu, MORE INFO
 * (Enter, GamepadOK) opens the about page.
 */
export class AboutModel extends AbstractModel {

  constructor(app) {
    super(app);
    this.id = 'AboutModel';

    this.screenEntity = null;
    this.gameInfoEntity = null;
    this.titleEntity = null;
    this.subtitleEntity = null;
    this.copyrightEntity = null;
    this.aboutEntity = null;
    this.musicPlaying = false;

    // the about panel over the middle of the screen, clear of the scroll on
    // the right, 4 px kept free on either side as the menu does
    // (menuModel.js)
    this.panelX = 36;
    this.panelY = 42;
    this.panelWidth = 184;
    this.panelHeight = 126;
    this.panelBkColor = ZXColor.black;

    this.aboutText = 'ATIC ATAC IS A REMAKE OF THE 1983 ULTIMATE PLAY THE GAME CLASSIC FOR THE 48K ZX SPECTRUM.\n' +
                    'YOU ARE LOCKED IN A HAUNTED CASTLE AS A KNIGHT, A WIZARD OR A SERF. THE WAY OUT IS THE FRONT ' +
                    'DOOR, AND IT TAKES A KEY IN THREE PIECES - SOMEWHERE IN THE ROOMS, PAST WHATEVER LIVES IN ' +
                    'THEM, WHILE THE ROAST CHICKEN THAT IS YOUR HEALTH RUNS DOWN.\n' +
                    'THE HIGH SCORES ARE KEPT IN THE HALL OF FAME ON THE SERVER.';
    this.statsText = 'error:\nstatistics data not available!';
    this.clickCounter = 0;
  } // constructor

  newBorderEntity() {
    // no X in the border: CLOSE and the ESC of the panel go back to the menu
    return new BorderEntity(false, false);
  } // newBorderEntity

  init() {
    super.init();

    this.borderEntity.bkColor = ZXColor.black;
    this.desktopEntity.bkColor = ZXColor.black;

    // the game's own picture under the panel
    // from localStorage at once, or from the server when it is missing there
    // (R-062)
    this.loadDataFiles(['screen'], (files, error) => {
      if (this.app.model !== this) {
        return;
      }
      this.screenEntity = GameAreaEntity.panelScreen(this);
      if (this.screenEntity) {
        // ★ the copyright line of the original's own menu screen, where it has
        // it: the bottom row, bright white ($6283 prints it at $B800, i.e. row
        // 23, from the string at $6040)
        this.copyrightEntity = new TextEntity(this.desktopEntity, this.app.fonts.zxFonts8x8Mono, 0, 23*8, 32*8, 8, '©1983 A.C.G. ALL RIGHTS RESERVED', ZXColor.brightWhite, ZXColor.black, {align: 'center'});
        this.desktopEntity.addEntity(this.copyrightEntity);
      } else {
        this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.zxFonts8x8, 0, 8*8, this.desktopWidth, 8, 'ATIC ATAC', ZXColor.brightWhite, false, {align: 'center'}));
        this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.fonts5x5, 8, 8*8+16, this.desktopWidth-16, 40,
          'GAME DATA MISSING (data/sprites.json). RUN tools/dumpsprites.py.', ZXColor.brightGreen, false, {align: 'center', textWrap: true}));
      }
    });

    // the about text and the buttons, over the middle of the frame
    this.aboutEntity = new AbstractEntity(this.desktopEntity, this.panelX, this.panelY, this.panelWidth, this.panelHeight, false, ZXColor.black);
    this.desktopEntity.addEntity(this.aboutEntity);
    var w = this.panelWidth, h = this.panelHeight;
    this.aboutEntity.addEntity(new ButtonEntity(this.aboutEntity, this.app.fonts.fonts5x5, 0, 0, w, 9, 'ABOUT GAME', {id: 'clickLabel'}, [], ZXColor.brightRed, false, {align: 'center', topMargin: 2, member: 'titleBar', hoverColor: ZXColor.black, clickColor: ZXColor.black}));
    this.aboutEntity.addEntity(new AbstractEntity(this.aboutEntity, 1, 9, w-2, h-10, false, this.panelBkColor));
    this.aboutEntity.addEntity(new TextEntity(this.aboutEntity, this.app.fonts.fonts5x5, 1, 9, w-2, h-25, this.aboutText, ZXColor.brightWhite, false, {align: 'justify', textWrap: true, margin: 2, member: 'aboutText'}));
    this.aboutEntity.addEntity(new ButtonEntity(this.aboutEntity, this.app.fonts.fonts5x5, 3, h-16, 54, 13, 'MORE INFO', {id: 'openAboutURL'}, ['Enter', 'GamepadOK'], ZXColor.brightWhite, ZXColor.green, {align: 'center', margin: 4}));
    this.aboutEntity.addEntity(new ButtonEntity(this.aboutEntity, this.app.fonts.fonts5x5, w-39, h-16, 36, 13, 'CLOSE', {id: 'closeAbout'}, ['Escape', 'GamepadExit'], ZXColor.brightWhite, ZXColor.blue, {align: 'center', margin: 4}));

    this.fetchData('stats.db', false, {});

    this.sendEvent(0, {id: 'openAudioBus', bus: 'sounds', options: {muted: this.app.muted.sounds}});

    // ★ the prelude of the original's game selection screen: $B3EC plays
    // MusicData_GameComplete through PlayAudio_WaitKey ($BD51), thirty seconds
    // of Bach until the player touches the controls (data/music.json).
    // An event, not a direct playMusic(): openAudioBus goes through the event
    // queue and playSound on a bus not yet open is silent.
    this.sendEvent(0, {id: 'playSound', bus: 'sounds', sound: 'music:gameComplete', options: {waitKey: true}});
    this.musicPlaying = true;

    this.app.stack.flashState = false;
    this.sendEvent(330, {id: 'changeFlashState'});
  } // init

  shutdown() {
    super.shutdown();
    this.sendEvent(0, {id: 'stopAllAudioBuses'});
  } // shutdown

  setData(data) {
    this.statsText = '';
    Object.entries(data.data).forEach(([periodKey, periodValue]) => {
      this.statsText += periodKey + ': [';
      Object.entries(periodValue).forEach(([key, value]) => {
        this.statsText += key + ':' + value + ', ';
      });
      this.statsText = this.statsText.slice(0, -2) + ']\n';
    });
  } // setData

  errorData(error) {
  } // errorData

  /**
   * Cuts the prelude off, once. Every input on this screen ends it, the way
   * PlayAudio_WaitKey ($BD51) ends it in the original.
   * @returns {void}
   */
  stopMusic() {
    if (this.musicPlaying) {
      this.musicPlaying = false;
      this.sendEvent(0, {id: 'stopAudioBus', bus: 'sounds'});
    }
  } // stopMusic

  /**
   * Switches the panel between the about text, the statistics and the system
   * information, by the count of clicks on the title bar.
   * @returns {void}
   */
  updateAbout() {
    switch (Math.floor(this.clickCounter/5)) {
      case 1:
        this.sendEvent(0, {id: 'updateEntity', member: 'titleBar', text: 'GAME STATS'});
        this.sendEvent(0, {id: 'updateEntity', member: 'aboutText', text: this.statsText});
        break;
      case 2:
        this.sendEvent(0, {id: 'updateEntity', member: 'titleBar', text: 'SYSTEM INFO'});
        var ipLabelSeparator = ' ';
        if (window.clientIP.indexOf(':') >= 0) {
          ipLabelSeparator = '\n';
        }
        var sysInfoText =
          'version: ' + this.app.version + '\n' +
          'element: ' + this.app.element.clientWidth + ' x ' + this.app.element.clientHeight + '\n' +
          'canvas: ' + this.app.element.width + ' x ' + this.app.element.height + '\n' +
          'ratio: ' + this.app.layout.ratio + '\n' +
          'ip:' + ipLabelSeparator + window.clientIP + '\n';
        this.sendEvent(0, {id: 'updateEntity', member: 'aboutText', text: sysInfoText});
        break;
      default:
        this.sendEvent(0, {id: 'updateEntity', member: 'titleBar', text: 'ABOUT GAME'});
        this.sendEvent(0, {id: 'updateEntity', member: 'aboutText', text: this.aboutText});
        break;
    }
  } // updateAbout

  handleEvent(event) {
    // ★ before the entities get it: any input — a key, Mouse1, Touch, a
    // gamepad button (all of them arrive as keyPress) — cuts the prelude off,
    // whatever button it was aimed at.
    if (event.id == 'keyPress') {
      this.stopMusic();
    }

    if (super.handleEvent(event)) {
      return true;
    }

    switch (event.id) {
      case 'changeFlashState':
        this.app.stack.flashState = !this.app.stack.flashState;
        this.sendEvent(330, {id: 'changeFlashState'});
        return true;

      case 'closeAbout':
        this.app.setModel('MenuModel');
        return true;

      case 'openAboutURL':
        window.location.href = 'about';
        return true;

      case 'clickLabel':
        if (this.clickCounter < 14) {
          this.clickCounter++;
        } else {
          this.clickCounter = 0;
        }
        if (this.clickCounter%5 == 0) {
          this.updateAbout();
        }
        return true;

      case 'resizeModel':
        if (this.clickCounter > 9) {
          this.updateAbout();
        }
        return false;

      case 'errorAudioBus':
        this.app.showErrorMessage(event.error, 'reopen');
        return true;
    }

    return false;
  } // handleEvent

  loopModel(timestamp) {
    super.loopModel(timestamp);

    if (this.desktopEntity.modalEntity) {
      this.desktopEntity.modalEntity.loopEntity(timestamp);
    }

    this.drawModel();
  } // loopModel

} // AboutModel
