// audio.js — Web Audio API synthesis, music loop, all sfx generators

const AudioSystem = {
  ctx: null,
  sfxOn: true,
  musicOn: true,
  musicGain: null,
  musicInterval: null,
  initialized: false,

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) { /* no audio */ }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  _tone(freq, duration, type, volume, dest) {
    if (!this.ctx || !this.sfxOn) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.2;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(dest || this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  playTap() {
    if (!this.ctx || !this.sfxOn) return;
    const pitch = 880 * (0.95 + Math.random() * 0.1);
    this._tone(pitch, 0.08, 'sine', 0.15);
  },

  playCramp() {
    if (!this.ctx || !this.sfxOn) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 440;
    lfo.frequency.value = 12;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.value = 0.2;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(); lfo.start();
    osc.stop(this.ctx.currentTime + 0.3);
    lfo.stop(this.ctx.currentTime + 0.3);
  },

  playStartle() {
    this._tone(660, 0.15, 'triangle', 0.25);
  },

  playStageClear() {
    if (!this.ctx || !this.sfxOn) return;
    const notes = [523, 659, 784]; // C5 E5 G5
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.12, 'sine', 0.2), i * 110);
    });
  },

  playDisaster() {
    if (!this.ctx || !this.sfxOn) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.8);
    lfo.frequency.value = 8;
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.value = 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(); lfo.start();
    osc.stop(this.ctx.currentTime + 0.8);
    lfo.stop(this.ctx.currentTime + 0.8);
  },

  playGameOver() {
    if (!this.ctx || !this.sfxOn) return;
    const notes = [392, 330, 262, 220]; // G4 E4 C4 A3
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.2, 'sine', 0.2), i * 200);
    });
  },

  playNearMiss() {
    if (!this.ctx || !this.sfxOn) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
    }
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    gain.gain.value = 0.08;
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
  },

  playUIClick() {
    this._tone(1000, 0.04, 'sine', 0.1);
  },

  playHighScore() {
    if (!this.ctx || !this.sfxOn) return;
    const notes = [523, 587, 659, 784, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.15, 'sine', 0.18), i * 120);
    });
  },

  startMusic(bpm) {
    if (!this.ctx || !this.musicOn) return;
    this.stopMusic();
    const interval = 60000 / bpm / 2;
    const bassNotes = [130, 147, 165, 147]; // C3 D3 E3 D3
    let idx = 0;
    this.musicInterval = setInterval(() => {
      if (!this.musicOn) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = bassNotes[idx % bassNotes.length];
      gain.gain.value = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
      idx++;
    }, interval);
  },

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  },

  updateMusicBPM(bpm) {
    if (this.musicInterval) {
      this.stopMusic();
      this.startMusic(bpm);
    }
  },

  setVolume(sfx, music) {
    this.sfxOn = sfx;
    this.musicOn = music;
    if (!music) this.stopMusic();
    if (this.musicGain) {
      this.musicGain.gain.value = music ? 0.15 : 0;
    }
  }
};
