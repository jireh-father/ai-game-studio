// audio.js — Web Audio API synthesis, all sounds generated procedurally

const AudioManager = {
  ctx: null,
  masterGain: null,
  musicGain: null,
  sfxGain: null,
  musicNodes: [],
  musicInterval: null,
  initialized: false,

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.3;
      this.musicGain.connect(this.masterGain);
      this.initialized = true;
    } catch (e) { console.warn('AudioManager init failed:', e); }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  _osc(type, freq, duration, gainVal, delay) {
    if (!this.initialized || !SettingsManager.sound) return;
    const t = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gainVal || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(t);
    o.stop(t + duration);
  },

  _noise(duration, gainVal, delay) {
    if (!this.initialized || !SettingsManager.sound) return;
    const t = this.ctx.currentTime + (delay || 0);
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gainVal || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration);
  },

  playSlapSound(comboCount) {
    const pitchMod = 1 + Math.min(0.5, (comboCount || 0) * 0.05);
    this._osc('square', 800 * pitchMod, 0.08, 0.25);
    this._osc('sine', 200, 0.05, 0.2, 0.08);
  },

  playSlapMovingSound(comboCount) {
    const pitchMod = 1 + Math.min(0.5, (comboCount || 0) * 0.05);
    this._osc('square', 800 * pitchMod, 0.08, 0.25);
    this._osc('sine', 200, 0.05, 0.2, 0.08);
    this._noise(0.1, 0.12, 0.02);
  },

  playSmashSound() {
    this._osc('square', 1200, 0.06, 0.3);
    this._osc('sine', 400, 0.12, 0.2, 0.06);
  },

  playMufflerSound() {
    if (!this.initialized || !SettingsManager.sound) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1000, t);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.3);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + 0.3);
  },

  playRingComplete() {
    this._osc('square', 440, 0.2, 0.35);
  },

  playAlarmRing(id) {
    // Short ring tick — called periodically, not looping
    this._osc('triangle', 880, 0.05, 0.1);
    this._osc('triangle', 1108, 0.05, 0.08, 0.05);
  },

  playStageClear() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => this._osc('sine', f, 0.08, 0.2, i * 0.08));
  },

  playGameOver() {
    const notes = [440, 349, 293];
    notes.forEach((f, i) => this._osc('triangle', f, 0.15, 0.3, i * 0.15));
  },

  playComboSound(combo) {
    if (combo >= 20) {
      [880, 990, 1100, 1210, 1320].forEach((f, i) => this._osc('sine', f, 0.06, 0.15, i * 0.06));
    } else if (combo >= 10) {
      [880, 1100, 1320].forEach((f, i) => this._osc('sine', f, 0.07, 0.15, i * 0.07));
    } else if (combo >= 5) {
      this._osc('sine', 880, 0.08, 0.15);
      this._osc('sine', 1320, 0.08, 0.15, 0.08);
    }
  },

  playNewHighScore() {
    const scale = [523, 587, 659, 698, 784, 880, 988, 1046];
    scale.forEach((f, i) => this._osc('sine', f, 0.06, 0.2, i * 0.06));
    // Sparkle
    for (let i = 0; i < 4; i++) {
      this._osc('sine', 1500 + Math.random() * 1500, 0.04, 0.1, 0.5 + i * 0.08);
    }
  },

  playIdleWarning() {
    for (let i = 0; i < 8; i++) {
      const t = i * (0.125 - i * 0.01);
      this._osc('square', 600, 0.03, 0.15, t);
    }
  },

  playUIClick() {
    this._osc('sine', 400, 0.04, 0.15);
  },

  startMusic(bpm) {
    if (!this.initialized || !SettingsManager.music) return;
    this.stopMusic();
    const interval = (60 / bpm) * 1000;
    let beat = 0;
    this.musicInterval = setInterval(() => {
      if (!SettingsManager.music) return;
      const t = this.ctx.currentTime;
      // Bass pulse
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.value = beat % 4 === 0 ? 65 : 55;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(this.musicGain);
      o.start(t); o.stop(t + 0.2);
      // Hi-hat
      if (beat % 2 === 0 || Math.random() > 0.5) {
        this._musicNoise(0.04, 0.06);
      }
      beat++;
    }, interval);
  },

  _musicNoise(dur, vol) {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const sz = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, sz, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 8000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp); hp.connect(g); g.connect(this.musicGain);
    src.start(t); src.stop(t + dur);
  },

  updateMusicTempo(bpm) {
    if (this.musicInterval) {
      this.stopMusic();
      this.startMusic(bpm);
    }
  },

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  },

  pauseAll() {
    if (this.masterGain) this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
  },

  resumeAll() {
    if (this.masterGain) this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
  },

  vibrate(pattern) {
    if (SettingsManager.vibration && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  },
};
