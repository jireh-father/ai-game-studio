// ads.js - Stub ad hooks + Web Audio synth

function showInterstitial(cb) { if (cb) cb(true); }
function showRewarded(cb) { if (cb) cb(true); }

class AudioSynth {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch(e) {}
  }

  _play(freq, dur, type, vol, detune) {
    if (!this.initialized || !GameState.settings.sound) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      if (detune) osc.detune.value = detune;
      gain.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch(e) {}
  }

  playSwipe(dir) {
    const pitchMap = { UP: 700, DOWN: 350, LEFT: 480, RIGHT: 550 };
    this._play(pitchMap[dir] || 500, 0.08, 'sine', 0.1);
  }

  playSurvive(combo) {
    const pitch = 600 + combo * 30;
    this._play(Math.min(pitch, 1200), 0.1, 'sine', 0.12);
  }

  playPerfect() {
    this._play(1200, 0.12, 'sine', 0.15);
    setTimeout(() => this._play(1500, 0.08, 'sine', 0.1), 50);
  }

  playHit() {
    this._play(150, 0.18, 'sawtooth', 0.2);
    this._play(80, 0.12, 'square', 0.15, -20);
  }

  playDeath() {
    this._play(100, 0.35, 'sawtooth', 0.25);
    setTimeout(() => this._play(60, 0.35, 'sawtooth', 0.2), 150);
    setTimeout(() => this._play(40, 0.3, 'square', 0.15), 300);
  }

  playStageClear() {
    this._play(523, 0.15, 'sine', 0.15);
    setTimeout(() => this._play(659, 0.15, 'sine', 0.15), 120);
    setTimeout(() => this._play(784, 0.2, 'sine', 0.18), 240);
  }

  playRotation() {
    this._play(200, 0.4, 'triangle', 0.12);
    this._play(300, 0.3, 'sine', 0.08);
  }

  playComboMilestone(combo) {
    const base = 700 + Math.min(combo, 15) * 40;
    this._play(base, 0.12, 'sine', 0.18);
    setTimeout(() => this._play(base + 200, 0.1, 'sine', 0.12), 80);
  }

  playWarning() {
    this._play(400, 0.08, 'square', 0.1);
  }
}

const audioSynth = new AudioSynth();
