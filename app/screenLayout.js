// begin code

/**
 * Geometry of the Atic Atac screen, measured on the original rather than off
 * a photograph (sources/docs/screen_layout.md).
 *
 * The screen is the plain ZX Spectrum one: 256x192 pixels, attributes in 8x8
 * cells. Unlike Jetpac and Lunar Jetman, whose panels sit across the top,
 * Atic Atac keeps its status display **on the right**: a drawn scroll of
 * parchment with TIME, SCORE, the roast chicken and the lives on it.
 *
 * ★ Measured on three frames taken off the running original in three
 * different rooms (tools/playtrace.py, tools/mkroom.py): character columns
 * 24-31 are the panel and columns 0-23 the room. Column 24 is the same in
 * every frame down to the byte — it is the left edge of the scroll — and
 * columns 0-23 change completely when the room changes.
 *
 * ? Whether the game holds those two as one picture or two is **not measured
 * yet** (M2). The remake composes both into one video memory, which is what
 * the machine has; the split here is a measured boundary, not a claim about
 * the program's own structure.
 */
export const ScreenLayout = {

  WIDTH: 256,
  HEIGHT: 192,

  CELL: 8,
  COLS: 32,
  ROWS: 24,

  // ★ columns 24-31: the scroll, measured on three frames in three rooms
  PANEL_COL: 24,
  PANEL_COLS: 8,
  PANEL_WIDTH: 64,

  // ★ columns 0-23, all 24 character rows: the room
  PLAY_COL: 0,
  PLAY_COLS: 24,
  PLAY_WIDTH: 192,
  PLAY_ROWS: 24,

  // black behind everything: the game clears the screen to zero between rooms
  ATTR_SCREEN: 0x00,

  // 50.08 Hz — 69888 T states per frame on a 3.5 MHz Z80 (hw_notes.md).
  //
  // ★ Whether the original is tied to the frame at all is **not measured
  // yet** (ZADANI chap. 9, question 4). Sabre Wulf turned out to take two
  // frames per pass; Jetpac turned out not to wait for the frame at all
  // (0.568 long passes per frame). Atic Atac is by the same author and the
  // same year as Jetpac and **neither may apply**, so M1 ticks at the
  // interrupt rate and everything measured later is written down **per
  // pass**, never per frame. The day the cadence is measured, that is a
  // change of time base rather than a re-measurement.
  FRAME_RATE: 3500000/69888

}; // ScreenLayout
