// Lag Shot - Web Audio API Sound Manager
class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      this.enabled = false;
    }
  }

  _ensureCtx() {
    if (!this.initialized) this.init();
    if (!this.enabled || !this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  _osc(type, freq, endFreq, duration, gain) {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) o.frequency.linearRampToValueAtTime(endFreq, t + duration);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.linearRampToValueAtTime(0, t + duration);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + duration + 0.01);
  }

  _noise(duration, gain) {
    if (!this._ensureCtx()) return;
    const t = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.linearRampToValueAtTime(0, t + duration);
    src.connect(g).connect(this.ctx.destination);
    src.start(t);
    src.stop(t + duration + 0.01);
  }

  playMove() {
    this._osc('sine', 800, 200, 0.08, 0.3);
  }

  playShoot() {
    this._osc('sawtooth', 400, 100, 0.12, 0.4);
  }

  playHit() {
    this._osc('square', 300, 300, 0.08, 0.35);
  }

  playEnemyDeath(comboCount) {
    const pitchMult = 1 + (comboCount || 0) * 0.15;
    this._noise(0.06, 0.3);
    this._osc('sine', 200 * pitchMult, 50 * pitchMult, 0.18, 0.4);
  }

  playPlayerDeath() {
    this._osc('sine', 600, 50, 0.5, 0.5);
  }

  playWaveClear() {
    this._osc('sine', 400, 800, 0.3, 0.4);
  }

  playComboMilestone() {
    this._osc('sine', 1200, 1200, 0.1, 0.45);
  }

  playButton() {
    this._noise(0.03, 0.2);
  }

  playPrediction() {
    this._osc('sine', 520, 260, 0.12, 0.35);
  }
}

const audioManager = new AudioManager();
