const { ZXVideoRAM } = await import('./svision/js/platform/canvas2D/zx/zxVideoRAM.js?ver='+window.srcVersion);
const { ScreenLayout } = await import('./screenLayout.js?ver='+window.srcVersion);
// begin code

/**
 * Builds the Atic Atac screen — all 6912 bytes of it — out of what the
 * original drew.
 *
 * What the machine is (the video memory, the ULA's interleaved addressing,
 * `poke`/`peek`, turning bytes plus attributes into pixels) is svision's
 * ZXVideoRAM (R-003). What is left here is the game's own drawing.
 *
 * ★ **In M1 that drawing is: put back the picture the original drew.**
 * data/screen.json is the starting room and the panel captured off the
 * running original (tools/mkroom.py) — the room by a majority vote over 144
 * samples, so that whatever moves loses the vote, and the panel out of one
 * single frame, because TIME and SCORE run and a per-byte majority of digits
 * would be a number that never stood on the screen.
 *
 * That is temporary and deliberate. **How a room is described in the program
 * is the first question of M2** (ZADANI chap. 9, question 5), and composing a
 * room out of data that has not been measured would mean inventing it.
 * Nothing is redrawn even so: every byte here is a byte of the original's own
 * video memory.
 *
 * When M2 knows the format, this class keeps its shape — `composeInto` will
 * build the room out of the game's own tables instead of out of a captured
 * picture, and tools/matchscreen.mjs will go on checking the result against
 * the original byte for byte.
 *
 * Free of DOM dependencies, so the offline tools render with this very code
 * (R-001).
 */
export class ScreenComposer {

  /**
   * @param {Object} scene - The parsed data/screen.json: the static screen
   *        captured off the original (tools/mkroom.py).
   */
  constructor(scene) {
    if (!scene || !scene.play || !scene.panel) {
      throw new Error('game data missing (data/screen.json)');
    }
    this.panelColumn = scene.panelColumn === undefined ? ScreenLayout.PANEL_COL
                                                       : scene.panelColumn;
    this.play = {
      area: {col: 0, row: 0, cols: this.panelColumn, rows: ScreenLayout.ROWS},
      bitmap: ZXVideoRAM.decode(scene.play.bitmap),
      attributes: ZXVideoRAM.decode(scene.play.attributes)
    };
    this.panel = {
      area: {col: this.panelColumn, row: 0,
             cols: ScreenLayout.COLS-this.panelColumn, rows: ScreenLayout.ROWS},
      bitmap: ZXVideoRAM.decode(scene.panel.bitmap),
      attributes: ZXVideoRAM.decode(scene.panel.attributes)
    };
  } // constructor

  /**
   * The room, as the original left it. Everything else is drawn over this.
   * @param {ZXVideoRAM} videoRAM - The video memory to draw into.
   */
  drawRoom(videoRAM) {
    videoRAM.setLinear(this.play.area, this.play.bitmap, this.play.attributes);
  } // drawRoom

  /**
   * The scroll on the right: TIME, SCORE, the chicken and the lives.
   *
   * ? In M1 it is the captured picture, digits and all. What the panel is
   * made of — where the digits sit, which glyphs print them, how the chicken
   * shrinks — is M2/M4, and until it is measured the remake shows the
   * original's own bytes rather than a panel of its own devising.
   * @param {ZXVideoRAM} videoRAM - The video memory to draw into.
   * @param {Object} [state] - The 'frame' message of the worker.
   */
  drawPanel(videoRAM, state) {
    videoRAM.setLinear(this.panel.area, this.panel.bitmap, this.panel.attributes);
  } // drawPanel

  /**
   * The whole screen: the room, the panel, and — from M3 on — whatever the
   * worker says is standing on it.
   * @param {ZXVideoRAM} videoRAM - The video memory to draw into.
   * @param {Object} [state] - The 'frame' message of the worker.
   */
  composeInto(videoRAM, state) {
    videoRAM.clear(0, ScreenLayout.ATTR_SCREEN);
    this.drawRoom(videoRAM);
    this.drawPanel(videoRAM, state);
    // The entities go here. **Nothing is drawn in M1 on purpose**: what they
    // look like is M2 (sprites out of the program) and how they move is
    // M3-M5. A placeholder drawn now would be the one thing this project
    // does not do.
    return videoRAM;
  } // composeInto

  /**
   * The screen the menu, the hall of fame and the about page sit on.
   * @param {ZXVideoRAM} videoRAM - The video memory to draw into.
   */
  clearScreen(videoRAM) {
    this.composeInto(videoRAM, {});
  } // clearScreen

} // ScreenComposer
