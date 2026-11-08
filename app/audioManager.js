const { AbstractAudioManager } = await import('./svision/js/audio/abstractAudioManager.js?ver='+window.srcVersion);
const { AudioWorkletHandler } = await import('./svision/js/audio/audioWorkletHandler.js?ver='+window.srcVersion);
const { AudioScriptProcessorHandler } = await import('./svision/js/audio/audioScriptProcessorHandler.js?ver='+window.srcVersion);
const { AudioSilentHandler } = await import('./svision/js/audio/audioSilentHandler.js?ver='+window.srcVersion);
const { Tool } = await import('./svision/js/tool.js?ver='+window.srcVersion);
const { ZXMachineSounds } = await import('./svision/js/platform/canvas2D/zx/zxMachineSounds.js?ver='+window.srcVersion);
const { ZXVideoRAM } = await import('./svision/js/platform/canvas2D/zx/zxVideoRAM.js?ver='+window.srcVersion);
// begin code

/**
 * Audio manager. The original has a one-bit beeper on bit 4 of port $FE and no
 * sound chip, so every sound is a stream of pulse lengths played by the svision
 * pulse handlers — the same way the machine makes sound, not sampled.
 *
 * There is **one bus**, `sounds` (R-024): one slider, one bus, one
 * AudioContext, until something shows that the game plays a tune and a sound
 * at once.
 *
 * ★ **In M1 the only sounds here are the machine's**: the pilot tone, the
 * data blocks and the key click of the ROM (svision ZXMachineSounds), which is
 * what LOAD TAPE needs. The block that carries the loading screen is the real
 * one — 6912 bytes in the pulse format of the tape, so the picture is not an
 * animation of a load, it **is** the load.
 *
 * ? **The game's own sounds are M6 and nothing is faked until then.** Whether
 * Atic Atac has music at all is an open question (ZADANI chap. 9, question
 * 12); Sabre Wulf turned out to have four tunes, Jetpac and Lunar Jetman none.
 * When M6 reads the routines out of the program, this file gets a Beeper like
 * theirs — the routines run instruction by instruction and checked against
 * port $FE pulse for pulse — and `playFrame` starts making sound. A
 * placeholder sound now would be the one thing this project does not do.
 */
export class AudioManager extends AbstractAudioManager {

  constructor(app) {
    super(app);
    this.id = 'AudioManager';
    this.volume = {};
    this.volume.sounds = Math.min(10, Math.max(0, Math.round(Number(Tool.readCookie('audioBusSoundsLevel', 5)))));
    // the beeper of the game itself arrives in M6 (see the class comment)
    this.beeper = null;
  } // constructor

  /**
   * Reads a data file delivered with appData; see {@link Tool.loadDataFile}.
   * @param {string} key - The data file name without its extension.
   * @returns {Object|null} The parsed content, or null.
   */
  loadDataFile(key) {
    // through the model: a file its loadDataFiles() had to get from the
    // server is there, not in localStorage (R-062)
    var model = this.app.model;
    return model && model.loadDataFile ? model.loadDataFile(key) : Tool.loadDataFile(key);
  } // loadDataFile

  /**
   * The tape block that carries the loading screen — the real 6912 bytes of
   * it (data/loading.json), bit by bit in the pulse format of the tape, with
   * an event after every byte and one more when the block ends.
   *
   * TapeLoadingModel writes each of those bytes into the video memory as it
   * arrives, so the picture is not an animation of a load: it **is** the load,
   * and it takes exactly as long as the sound does.
   *
   * The pulses are the ROM's own lengths, so the block takes as long as
   * 6912 bytes really take — some thirty-seven seconds. Nothing is sped up:
   * a picture that loads faster than the tape can carry it would be an
   * animation again, which is the one thing this is not.
   *
   * @param {number} sampleRate - The audio context sample rate.
   * @param {number} level - Bus volume level.
   * @returns {Object|boolean} svision pulse data, or false with no data file.
   */
  tapeScreenDataSound(sampleRate, level) {
    var loading = this.loadDataFile('loading');
    if (!loading) {
      return false;
    }
    return ZXMachineSounds.tapeData(sampleRate, level,
      ZXVideoRAM.decode(loading.videoRAM),
      {byteEvent: 'tapeByte', endEvent: 'tapeBlockEnd'});
  } // tapeScreenDataSound

  createAudioHandler(bus, options) {
    var audioHandler = false;

    var volume = 0.0;
    switch (bus) {
      case 'sounds':
      case 'extra':
        volume = this.volumeLevel(this.volume.sounds);
        break;
    }

    if (options.audioSilentHandler != 'disable' && volume == 0.0) {
      return new AudioSilentHandler(this.app);
    }

    if (this.unsupportedAudioBus == false) {
      this.unsupportedAudioBus = Tool.readCookie('unsupportedAudioBus', false);
    }

    switch (this.unsupportedAudioBus) {
      case false:
        audioHandler = new AudioWorkletHandler(this.app);
        break;
      case 'AudioWorkletHandler':
        Tool.writeCookie('unsupportedAudioBus', 'AudioWorkletHandler');
        audioHandler = new AudioScriptProcessorHandler(this.app);
        break;
      case 'AudioScriptProcessorHandler':
        Tool.writeCookie('unsupportedAudioBus', 'AudioScriptProcessorHandler');
        audioHandler = new AudioSilentHandler(this.app);
        break;
    }

    if (bus in this.restartSounds) {
      this.app.model.sendEvent(1, {id: 'playSound', bus: bus, sound: this.restartSounds[bus].sound, options: this.restartSounds[bus].options});
    }

    return audioHandler;
  } // createAudioHandler

  audioData(bus, sound, options) {
    var data = super.audioData(bus, sound, options);
    if (data !== false) {
      return data;
    }

    var sampleRate = this.getSampleRate();
    var level = this.volumeLevel(this.volume.sounds);
    switch (sound) {
      case 'tapePilotToneSound': return ZXMachineSounds.tapePilotTone(sampleRate, level);
      case 'tapeRndDataSound': return ZXMachineSounds.tapeRndData(sampleRate, level);
      case 'tapeScreenDataSound': return this.tapeScreenDataSound(sampleRate, level);
      case 'keyboardSound': return ZXMachineSounds.keyClick(sampleRate, level);
    }
    // ? the game's own sounds are M6: until they are read out of the
    // program there is nothing to answer with, and nothing invents one
    return false;
  } // audioData

  volumeLevel(volume) {
    var levels = [0, 0.005, 0.01, 0.02, 0.04, 0.07, 0.1, 0.14, 0.18, 0.23, 0.29];
    return levels[volume];
  } // volumeLevel

  /**
   * One worker frame: what the game did in it, as sound.
   *
   * ? **M1 plays nothing.** The worker sends no sound events yet, because
   * which routine the game calls when is M6. The hook stays so that M6 has
   * somewhere to land, and so that the shape of the protocol
   * (WORKER-PROTOCOL.md) does not change under it.
   * @param {Object} frame - The 'frame' message from the worker.
   */
  playFrame(frame) {
  } // playFrame

} // AudioManager
