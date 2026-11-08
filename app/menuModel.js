const { AbstractModel } = await import('./svision/js/abstractModel.js?ver='+window.srcVersion);
const { AbstractEntity } = await import('./svision/js/abstractEntity.js?ver='+window.srcVersion);
const { BorderEntity } = await import('./borderEntity.js?ver='+window.srcVersion);
const { TextEntity } = await import('./svision/js/platform/canvas2D/textEntity.js?ver='+window.srcVersion);
const { ButtonEntity } = await import('./svision/js/platform/canvas2D/buttonEntity.js?ver='+window.srcVersion);
const { MenuEntity } = await import('./svision/js/platform/canvas2D/menuEntity.js?ver='+window.srcVersion);
const { ZXPlayerNameEntity } = await import('./svision/js/platform/canvas2D/zx/zxPlayerNameEntity.js?ver='+window.srcVersion);
const { ZXVolumeEntity } = await import('./svision/js/platform/canvas2D/zx/zxVolumeEntity.js?ver='+window.srcVersion);
const { ZXSettingsEntity } = await import('./svision/js/platform/canvas2D/zx/zxSettingsEntity.js?ver='+window.srcVersion);
const { ZXWaitForAudioEventEntity } = await import('./svision/js/platform/canvas2D/zx/zxWaitForAudioEventEntity.js?ver='+window.srcVersion);
const { ZXColor } = await import('./svision/js/platform/canvas2D/zx/zxColor.js?ver='+window.srcVersion);
const { ZXDialogEntity } = await import('./svision/js/platform/canvas2D/zx/zxDialogEntity.js?ver='+window.srcVersion);
const { ZXDialogProperties } = await import('./svision/js/platform/canvas2D/zx/zxDialogProperties.js?ver='+window.srcVersion);
const { ZXVideoRAMEntity } = await import('./svision/js/platform/canvas2D/zx/zxVideoRAMEntity.js?ver='+window.srcVersion);
const { GameAreaEntity } = await import('./gameAreaEntity.js?ver='+window.srcVersion);
// begin code

/**
 * Main menu, the same structure as the other ZX remakes — with the two things
 * the original's own GAME SELECTION screen offers:
 *
 * - ★ **CHARACTER**: `4 KNIGHT`, `5 WIZARD`, `6 SERF`. Measured on the
 *   running original (tools/playtrace.py, frame 300), so it is fidelity, not
 *   an addition. The item cycles through the three in the original's order.
 * - ★ the controls, which live in **SETTINGS**: the original offers
 *   `1 KEYBOARD`, `2 KEMPSTON JOYSTICK`, `3 CURSOR   JOYSTICK`.
 *
 * ★ And what it does **not** offer: a two-player game. Unlike Sabre Wulf,
 * Jetpac and Lunar Jetman there is no `1 PLAYER GAME` / `2 PLAYER GAME` on
 * that screen, so the remake has one player and asks nothing.
 *
 * ? **HALL OF FAME** is here as in the sibling remakes, but whether the
 * original has one of its own is **not measured** (ZADANI chap. 9, question
 * 14). If it turns out to have one, this item is fidelity; if it does not, it
 * is a recorded deviation (ZADANI chap. 10) — either way the answer comes out
 * of the program, not out of this file.
 *
 * There is **one volume** (SOUNDS): one bus, one slider, one AudioContext
 * (R-024), until something shows the game plays a tune and a sound at once.
 *
 * What is the remake's own is the rest of the menu, the key remapping, the
 * options and the touch controls.
 *
 * The menu itself never touches the audio buses; items that need sound go
 * through ZXWaitForAudioEventEntity first when the browser wants a user
 * gesture.
 */
export class MenuModel extends AbstractModel {

  constructor(app, selectionItem) {
    super(app);
    this.id = 'MenuModel';

    // ★ coloured in the groups of the original's own GAME SELECTION screen
    // (tools/playtrace.py, frame 300): its heading is bright yellow, its
    // items bright cyan and the copyright line along the bottom bright
    // white. ? The exact attribute bytes are M1/M2 work — the colours here
    // are the groups, not a claim about $47 and $45.
    var game = ZXColor.brightYellow, choice = ZXColor.brightCyan, about = ZXColor.brightWhite;
    this.menuItems = [
      {t1: 'START GAME', event: {id: 'startGame', players: 1}, penColor: game},
      // ★ the original's own choice, and the only one besides the controls:
      // 4 KNIGHT / 5 WIZARD / 6 SERF on its GAME SELECTION screen
      {t1: 'CHARACTER', event: {id: 'setCharacter'}, penColor: game},
      {t1: 'PLAYER NAME', event: {id: 'setPlayerName'}, penColor: game},
      {t1: 'HALL OF FAME', event: {id: 'showHallOfFame'}, penColor: game},
      {t1: 'SOUNDS', event: {id: 'setSounds'}, penColor: choice},
      {t1: 'SETTINGS', event: {id: 'setSettings'}, penColor: choice},
      {t1: 'LOAD TAPE', event: {id: 'startTapeLoading'}, penColor: choice},
      {t1: 'ABOUT GAME', event: {id: 'showAbout'}, penColor: about}
    ];
    this.menuOptions = {
      fonts: this.app.fonts.zxFonts8x8,
      // the menu sits where the original's items are: under its heading,
      // from character row 5 down (measured on its GAME SELECTION screen)
      leftMargin: 4,
      rightMargin: 4,
      topMargin: 8,
      itemHeight: 12,
      t1LeftMargin: 3,
      t1TopMargin: 2,
      t2Width: 96,
      t2RightMargin: 3,
      t2TopMargin: 2,
      textColor: ZXColor.brightWhite,
      // the bar takes the colour of the selected item's group (selectionBarColor
      // false) and the text goes black on it
      selectionTextColor: ZXColor.black,
      selectionBarColor: false,
      hoverColor: '#333333ff',
      selectionHoverColor: false,
      clickColor: '#444444ff',
      selectionClickColor: false,
      selection: selectionItem
    };
    // the dialogs opened from the menu look like the ABOUT GAME panel
    // (aboutModel.js): a black window with the title in bright red over the
    // black middle of the screen. The contents come from svision and are
    // laid out for 200 x 124 px; the window has no frame, only the title bar,
    // so they get 192 x 117 — the right edge of the volume panel (MAX, +) and
    // of the keyboard loses up to 6 px, the bottom row moves up with the
    // height. It fills cells 4-27 in width and has the
    // title on the same row as the about panel (36, 42, 184 x 126), with the
    // same bottom edge at 168. What is not set here is the default of
    // ZXDialogProperties (the look of Manic Miner)
    this.dialogProperties = ZXDialogProperties.merge({
      x: 32,
      y: 42,
      width: 192,
      height: 126,
      frameWidth: 0,
      titleColor: ZXColor.brightRed,
      bkColor: ZXColor.black,
      theme: {
        penColor: ZXColor.brightWhite,
        valueColor: choice,
        selectionColor: game,
        selectionPenColor: ZXColor.black,
        hoverColor: '#333333ff',
        clickColor: '#444444ff',
        separatorColor: ZXColor.brightWhite,
        iconColor: ZXColor.brightCyan,
        sliderColor: ZXColor.brightWhite,
        keyboardButtonsBkColor: ZXColor.brightCyan,
        // the default keyboard is 194 px wide, the panel 192: the rows are shifted
        // by 7 instead of 9 and SPACE is 23 instead of 25, so the widest row is
        // exactly 192. `update` merges `buttons` key by key (the other keys stay)
        // and replaces `rows` whole
        keyboardLayout: {
          action: 'update',
          options: {
            rows: [{shiftX: 0}, {shiftX: 5}, {shiftX: 10}, {shiftX: 0}],
            buttons: {
              '⇧': {width: 19},
              ' ': {width: 21}
            }
          }
        }
      },
      // the remap dialog covers the whole settings window, its title bar
      // included: the contents start 9 px under the top of the window, so the
      // dialog sits at -9 and the contents must not clip it. It looks like the
      // settings window itself: no frame, black panel, the title in bright
      // red, the same colours inside
      clipsChildren: false,
      remapKeys: {
        x: 0,
        y: -9,
        width: 192,
        height: 126,
        frameWidth: 0,
        titleColor: ZXColor.brightRed,
        bkColor: ZXColor.black,
        theme: {
          penColor: ZXColor.brightWhite,
          valueColor: choice,
          // the field awaiting the key: black cursor on cyan
          selectionColor: ZXColor.cyan,
          selectionPenColor: ZXColor.black
        }
      },
      // the gesture for audio: the popup of the about panel, black on yellow
      waitForAudioEvent: {frameColor: ZXColor.black, bkColor: ZXColor.brightYellow, theme: {penColor: ZXColor.black}}
    });

    this.titleEntity = null;
    this.subtitleEntity = null;
    this.versionEntity = null;
    this.menuEntity = null;
    this.newVersionAvailable = false;
    // the window of the dialog open from the menu (openDialog), while it lasts
    this.dialogEntity = null;
    // the game's own picture under the menu (GameAreaEntity.panelScreen)
    this.screenEntity = null;
    this.gameInfoEntity = null;
  } // constructor

  newBorderEntity() {
    return new BorderEntity(false, false);
  } // newBorderEntity

  init() {
    super.init();

    this.borderEntity.bkColor = ZXColor.black;
    this.desktopEntity.bkColor = ZXColor.black;

    // ★ The original's own menu screen is `ATICATAC GAME SELECTION` with its
    // three control options, its three characters and START GAME under them,
    // on black (measured, tools/playtrace.py frame 300). The remake's menu is
    // its own — the same items plus what a browser game needs — and it sits
    // on the game's own picture, drawn into video memory by the same composer
    // the game uses.
    // from localStorage at once, or from the server when it is missing there
    // (R-062)
    this.loadDataFiles(['screen'], (files, error) => {
      if (this.app.model !== this) {
        return;
      }
      if (!files) {
        this.app.showErrorMessage(error ? error.message : 'Game data could not be loaded.', 'restart');
      }
      this.screenEntity = GameAreaEntity.panelScreen(this);
      if (!this.screenEntity) {
        this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.zxFonts8x8, 0, 8*8, this.desktopWidth, 8, 'ATIC ATAC', ZXColor.brightWhite, false, {align: 'center'}));
        this.desktopEntity.addEntity(new TextEntity(this.desktopEntity, this.app.fonts.fonts5x5, 8, 8*8+16, this.desktopWidth-16, 40,
          'GAME DATA MISSING (data/screen.json). RUN tools/mksnapshot.sh AND tools/mkroom.py.', ZXColor.brightGreen, false, {align: 'center', textWrap: true}));
      }
    });
    // the menu window over the game's picture, clear of the scroll on the
    // right (screenLayout.js: the panel is columns 24-31)
    this.menuEntity = new MenuEntity(this.desktopEntity, 36, 42, 184, 126, this.desktopEntity.bkColor, this.menuOptions, this, this.getMenuData);
    this.desktopEntity.addEntity(this.menuEntity);

    // the version, centred in the ZX font on the bottom band; still a button,
    // because a newer version on the server turns it into UPGRADE !
    var versionText = 'v'+this.app.version;
    var versionWidth = 14*8;                            // fourteen cells, centred
    this.versionEntity = new ButtonEntity(this.desktopEntity, this.app.fonts.zxFonts8x8Mono, (this.desktopWidth-versionWidth)/2, 176, versionWidth, 8, versionText, {id: 'upgradeApp'}, [], ZXColor.brightWhite, ZXColor.black, {align: 'center'});
    this.desktopEntity.addEntity(this.versionEntity);
    // suppress the hover/click colors resolved in init(), so the button always
    // looks like plain text
    this.versionEntity.hoverColor = false;
    this.versionEntity.clickColor = false;
    this.checkServerVersion();


    // Menu je **němé**, a to schválně: prohlížeč pustí zvuk až po gestu
    // uživatele, a do menu se přijde hned po načtení stránky, kdy žádné gesto
    // ještě být nemuselo. Sběrnice se proto zavřou a zvuk začíná až o patro
    // níž, za položkou menu, kterou hráč zvolil — tam už gesto proběhlo a
    // ZXWaitForAudioEventEntity si ho v handleEvent umí vyžádat. Preludium
    // originálu hraje pod ABOUT GAME (aboutModel.js); hall of fame je němá
    // jako menu.
    // the flash clock of the ZX attributes (app.stack.flashState, 330 ms like
    // the ROM's 16 frames): the blinking cursor of the remap dialog and of the
    // player name input reads it, so the menu has to keep it going like every
    // other model
    this.app.stack.flashState = false;
    this.sendEvent(330, {id: 'changeFlashState'});

    this.sendEvent(0, {id: 'closeAllAudioBuses'});
  } // init


  checkServerVersion() {
    var receiver = {
      id: this.id+'Version',
      fetchDataId: '',
      setData: (data) => {
        if (data.data.version && data.data.version !== 'unknown' && data.data.version !== this.app.version) {
          this.newVersionAvailable = true;
          // not over the copyright line of an open dialog; showVersion() puts
          // UPGRADE ! there when the dialog closes
          if (this.dialogEntity === null) {
            this.showVersion();
          }
        }
      },
      errorData: () => {}
    };
    receiver.fetchDataId = this.app.fetchData('version.db', false, {}, receiver);
  } // checkServerVersion

  getMenuData(self, key, row) {
    switch (key) {

      case 'numberOfItems':
        return self.menuItems.length;

      case 't2':
        switch (row) {
          case 1:
            return self.app.character.toUpperCase();
          case 2:
            return self.app.playerName;
          case 4:
            return self.volumeText(self.app.audioManager.volume.sounds);
        }
        break;

      default:
        if (key in self.menuItems[row]) {
          return self.menuItems[row][key];
        }
        break;

    }
    return '';
  } // getMenuData

  /**
   * The level as the volume dialog words it (VolumeControl.levelText): OFF,
   * 10%..90%, MAX.
   * @param {number} volume - A slider's 0-10.
   * @returns {string}
   */
  volumeText(volume) {
    return ZXVolumeEntity.levelText(volume);
  } // volumeText

  /**
   * Opens a dialog from the menu: the window with the title (ZXDialogEntity)
   * over the middle of the screen, placed and coloured by the dialog
   * properties, and the contents the factory makes for it, as the modal of
   * the desktop.
   * @param {string} title - The text of the title bar.
   * @param {Function} contentFactory - Called with the window, returns the contents entity.
   */
  openDialog(title, contentFactory) {
    var p = this.dialogProperties;
    this.dialogEntity = new ZXDialogEntity(this.desktopEntity, p.x, p.y, p.width, p.height, title, p, contentFactory);
    this.desktopEntity.addModalEntity(this.dialogEntity);
    // while the dialog is open the bottom band shows the copyright line of the
    // original's screen instead of the version, like the hall of fame and the
    // about screen do; the version comes back when the dialog closes
    // (handleEvent, 'destroy' of the window)
    this.versionEntity.setText('© 1983  A.C.G.');
    this.versionEntity.setPenColor(ZXColor.brightWhite);
  } // openDialog

  /**
   * Puts the version back on the bottom band: the version number, or UPGRADE !
   * in red when the server has a newer one.
   */
  showVersion() {
    if (this.newVersionAvailable) {
      this.versionEntity.setText('UPGRADE !');
      this.versionEntity.setPenColor(ZXColor.brightRed);
    } else {
      this.versionEntity.setText('v'+this.app.version);
      this.versionEntity.setPenColor(ZXColor.brightWhite);
    }
  } // showVersion

  /**
   * Asks for the browser's gesture for audio before an action that plays
   * sound: ZXWaitForAudioEventEntity in a window without a title, centred on
   * the screen, coloured by the `waitForAudioEvent` dialog properties.
   * @param {string} continueEvent - The event sent when the gesture comes.
   */
  openWaitForAudioEvent(continueEvent) {
    var p = this.dialogProperties.waitForAudioEvent;
    this.desktopEntity.addModalEntity(new ZXDialogEntity(this.desktopEntity, 66, 77, 124, 41, false, p, (dialog) => new ZXWaitForAudioEventEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, continueEvent, p)));
  } // openWaitForAudioEvent

  handleEvent(event) {
    // the dialog's window closing — the desktop removes it in super.handleEvent
    // and returns true, so the version has to come back before that
    if (event.id == 'destroy' && event.entity === this.dialogEntity) {
      this.dialogEntity = null;
      this.showVersion();
    }
    if (super.handleEvent(event)) {
      return true;
    }

    switch (event.id) {
      case 'startGame':
        this.app.setPlayers(event.players);
        if (!this.app.playerName.length) {
          this.openDialog('PLAYER NAME', (dialog) => new ZXPlayerNameEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, true, this.dialogProperties));
          return true;
        } else {
          if (this.app.inputEventsManager.needEventForAudio()) {
            this.openWaitForAudioEvent('startGame2');
            return true;
          }
        }
      case 'startGame2':
        // straight into the game: the original's game selection screen **is**
        // this menu, so there is no title screen in between
        this.app.startGame();
        return true;

      case 'setCharacter':
        // ★ the original's three characters, in its own order (KNIGHT,
        // WIZARD, SERF). The item cycles rather than opening a dialog: there
        // are three of them and the original picks one with a single key.
        var characters = this.app.constructor.CHARACTERS;
        this.app.setCharacter(characters[(characters.indexOf(this.app.character)+1)%characters.length]);
        return true;

      case 'setPlayerName':
        this.openDialog('PLAYER NAME', (dialog) => new ZXPlayerNameEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, false, this.dialogProperties));
        return true;

      case 'showHallOfFame':
        // a screen of its own (hallOfFameModel.js); silent, so no gesture for
        // audio is needed on the way
        this.app.setModel('HallOfFameModel');
        return true;

      case 'setSounds':
        // ? the sample is the machine's key click, because the game's own
        // sounds are M6 and there is nothing of the original to play yet
        // (audioManager.js). When M6 reads them, one of them takes this place.
        this.openDialog('SOUNDS', (dialog) => new ZXVolumeEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, 'sounds', 'audioBusSoundsLevel', 'keyboardSound', this.dialogProperties));
        return true;

      case 'setSettings':
        this.openDialog('SETTINGS', (dialog) => new ZXSettingsEntity(dialog, dialog.innerX, dialog.innerY, dialog.innerWidth, dialog.innerHeight, this.app.controlsOptions, this.dialogProperties));
        return true;

      case 'startTapeLoading':
        if (this.app.inputEventsManager.needEventForAudio()) {
          this.openWaitForAudioEvent('startTapeLoading2');
          return true;
        }
      case 'startTapeLoading2':
        this.app.setModel('TapeLoadingModel');
        return true;

      case 'showAbout':
        // a screen of its own with the prelude under it (aboutModel.js), so
        // the browser's gesture for audio is asked for first, as for the game
        if (this.app.inputEventsManager.needEventForAudio()) {
          this.openWaitForAudioEvent('showAbout2');
          return true;
        }
      case 'showAbout2':
        this.app.setModel('AboutModel');
        return true;

      case 'upgradeApp':
        if (this.newVersionAvailable) {
          this.app.upgradeApp();
        }
        return true;

      case 'changeFlashState':
        this.app.stack.flashState = !this.app.stack.flashState;
        this.sendEvent(330, {id: 'changeFlashState'});
        return true;
    }

    return false;
  } // handleEvent

  loopModel(timestamp) {
    super.loopModel(timestamp);

    if (this.desktopEntity.modalEntity) {
      this.desktopEntity.modalEntity.loopEntity(timestamp);
    } else if (this.menuEntity) {
      // a player's name too long for its column ping-pongs
      this.menuEntity.loopEntity(timestamp);
    }

    this.drawModel();
  } // loopModel

} // MenuModel
