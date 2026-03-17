// Flatline - Audio System (Web Audio API synthesis)
const AudioSystem = {
  ctx: null,
  flatlineOsc: null,

  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { console.warn('No Web Audio'); }
    }
    return this.ctx;
  },

  play(type) {
    if (!this.ctx || !GameState.settings.sound) return;
    try {
      const ctx = this.ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      if (type === 'good') {
        this._blip('sine', AUDIO.goodTap + Math.floor(GameState.streak / 5) * 50, 0.3, 0.085);
      } else if (type === 'perfect') {
        const freq = AUDIO.perfectTap[0] + Math.floor(GameState.streak / 5) * 50;
        [freq, freq * 1.2].forEach((f, i) => {
          this._blip('sine', f, 0.25, 0.105, i * 0.02);
        });
      } else if (type === 'earlyLate') {
        this._blip('sine', AUDIO.earlyLateTap, 0.2, 0.065);
      } else if (type === 'miss') {
        this._blip('sawtooth', AUDIO.missBuzz, 0.3, 0.2);
      } else if (type === 'falseBeat') {
        this._blip('square', AUDIO.falseBeatBuzz, 0.3, 0.15);
      } else if (type === 'flatline') {
        this._playFlatline(now);
      } else if (type === 'stageAdvance') {
        AUDIO.stageAdvance.forEach((f, i) => {
          this._blip('sine', f, 0.2, 0.08, i * 0.08);
        });
      }
    } catch (e) { /* audio error */ }
  },

  _blip(waveType, freq, vol, dur, delay) {
    const ctx = this.ctx;
    const now = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveType;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  },

  _playFlatline(now) {
    const ctx = this.ctx;
    this.flatlineOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    this.flatlineOsc.type = 'sine';
    this.flatlineOsc.frequency.value = AUDIO.flatlineTone;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.6);
    gain.gain.linearRampToValueAtTime(0, now + 2);
    this.flatlineOsc.connect(gain).connect(ctx.destination);
    this.flatlineOsc.start(now);
    this.flatlineOsc.stop(now + 2);
  },

  stopFlatline() {
    if (this.flatlineOsc) {
      try { this.flatlineOsc.stop(); } catch (e) {}
      this.flatlineOsc = null;
    }
  }
};
