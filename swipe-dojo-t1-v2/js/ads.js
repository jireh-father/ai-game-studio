// Swipe Dojo - Audio Synth + Ad Stubs
'use strict';

class AudioSynth {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.musicPlaying = false;
    this.musicBPM = 90;
    this.musicTimer = null;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.masterGain = null;
    this.musicGain = null;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.25;
      this.musicGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) { /* silent fail */ }
  }

  _playTone(freq, duration, type, gain, dest) {
    if (!this.initialized || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(gain || 0.3, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(env);
    env.connect(dest || this.masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  _playNoise(duration, gain, dest) {
    if (!this.initialized || !this.sfxEnabled) return;
    const t = this.ctx.currentTime;
    const bufSize = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain || 0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(env);
    env.connect(dest || this.masterGain);
    src.start(t);
    src.stop(t + duration);
  }

  playBlock(quality, comboCount) {
    if (!this.initialized || !this.sfxEnabled) return;
    const pitch = 1 + (comboCount || 0) * 0.016;
    if (quality === 'perfect') {
      this._playTone(800 * pitch, 0.12, 'square', 0.25);
      this._playTone(200 * pitch, 0.15, 'sine', 0.35);
      this._playNoise(0.06, 0.2);
    } else if (quality === 'good') {
      this._playTone(500 * pitch, 0.1, 'triangle', 0.2);
      this._playTone(180 * pitch, 0.12, 'sine', 0.25);
    } else {
      this._playTone(300 * pitch, 0.08, 'triangle', 0.15);
    }
  }

  playMiss() {
    if (!this.initialized || !this.sfxEnabled) return;
    this._playTone(200, 0.2, 'sawtooth', 0.25);
    this._playTone(120, 0.25, 'sine', 0.3);
  }

  playEnemyDeath() {
    if (!this.initialized || !this.sfxEnabled) return;
    this._playTone(440, 0.12, 'square', 0.2);
    setTimeout(() => this._playTone(554, 0.12, 'square', 0.2), 100);
    setTimeout(() => this._playTone(660, 0.2, 'square', 0.25), 200);
  }

  playStageClear() {
    if (!this.initialized || !this.sfxEnabled) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.15, 'square', 0.2), i * 120);
    });
  }

  playDeath() {
    if (!this.initialized || !this.sfxEnabled) return;
    this._playTone(200, 0.4, 'sawtooth', 0.35);
    this._playTone(80, 0.8, 'sine', 0.4);
    this._playNoise(0.3, 0.15);
  }

  playLifeLost() {
    if (!this.initialized || !this.sfxEnabled) return;
    this._playTone(300, 0.15, 'sawtooth', 0.2);
    this._playTone(150, 0.25, 'sine', 0.3);
  }

  playArrowSpawn(dir) {
    if (!this.initialized || !this.sfxEnabled) return;
    const freqs = { UP: 880, DOWN: 220, LEFT: 440, RIGHT: 660 };
    this._playTone(freqs[dir] || 440, 0.08, 'sine', 0.1);
  }

  playComboMilestone(combo) {
    if (!this.initialized || !this.sfxEnabled) return;
    const base = 600 + Math.min(combo, 30) * 10;
    this._playTone(base, 0.1, 'sine', 0.2);
    this._playTone(base * 1.25, 0.15, 'sine', 0.2);
  }

  playGameOver() {
    if (!this.initialized || !this.sfxEnabled) return;
    this._playTone(180, 0.4, 'sine', 0.35);
    setTimeout(() => this._playTone(100, 0.8, 'sine', 0.3), 300);
  }

  playRageStart() {
    if (!this.initialized || !this.sfxEnabled) return;
    this._playTone(220, 0.15, 'sawtooth', 0.3);
    setTimeout(() => this._playTone(330, 0.15, 'sawtooth', 0.3), 80);
    setTimeout(() => this._playTone(440, 0.2, 'sawtooth', 0.35), 160);
    this._playNoise(0.15, 0.15);
  }

  startMusic(bpm) {
    if (!this.initialized || !this.musicEnabled || this.musicPlaying) return;
    this.musicBPM = bpm || 90;
    this.musicPlaying = true;
    this._scheduleMusic();
  }

  _scheduleMusic() {
    if (!this.musicPlaying) return;
    const interval = 60000 / this.musicBPM / 2;
    let beat = 0;
    this.musicTimer = setInterval(() => {
      if (!this.musicPlaying || !this.musicEnabled) return;
      const step = beat % 8;
      if (step === 0 || step === 4) {
        this._playKick();
      }
      if (step % 2 === 1) {
        this._playHihat();
      }
      if (step === 2 || step === 6) {
        this._playBass();
      }
      beat++;
    }, interval);
  }

  _playKick() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.25);
    env.gain.setValueAtTime(0.6, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(env);
    env.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  _playHihat() {
    if (!this.initialized) return;
    this._playNoise(0.05, 0.08, this.musicGain);
  }

  _playBass() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env);
    env.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  setBPM(bpm) {
    this.musicBPM = bpm;
    if (this.musicPlaying) {
      this.stopMusic();
      this.startMusic(bpm);
    }
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  duckMusic() {
    if (this.musicGain) this.musicGain.gain.value = 0.05;
  }

  unduckMusic() {
    if (this.musicGain) this.musicGain.gain.value = 0.25;
  }
}

// Singleton audio
const audioSynth = new AudioSynth();

// Ad stubs (POC)
function showInterstitial(cb) {
  if (cb) cb(true);
}

function showRewarded(cb) {
  if (cb) cb(true);
}
