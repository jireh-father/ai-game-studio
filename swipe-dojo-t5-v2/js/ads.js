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
    // Reactive music layer state
    this.melodyActive = false;
    this.padActive = false;
    this.arpeggioActive = false;
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
      // Reactive layers
      if (step === 3 && this.melodyActive) this._playMelody();
      if (step === 0 && this.padActive) this._playPad();
      if (step === 5 && this.arpeggioActive) this._playArpeggio();
      beat++;
    }, interval);
  }

  _playKick() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime, osc = this.ctx.createOscillator(), env = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.25);
    env.gain.setValueAtTime(0.6, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(env); env.connect(this.musicGain); osc.start(t); osc.stop(t + 0.25);
  }
  _playHihat() { if (this.initialized) this._playNoise(0.05, 0.08, this.musicGain); }
  _playBass() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime, osc = this.ctx.createOscillator(), env = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(80, t);
    env.gain.setValueAtTime(0.3, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env); env.connect(this.musicGain); osc.start(t); osc.stop(t + 0.15);
  }

  bassDrop() {
    if (!this.initialized || !this.sfxEnabled) return;
    const t = this.ctx.currentTime, sg = this.masterGain.gain.value, sm = this.musicGain.gain.value;
    this.masterGain.gain.setValueAtTime(0, t); this.musicGain.gain.setValueAtTime(0, t);
    const se = t + BASS_DROP.SILENCE_MS / 1000;
    this.masterGain.gain.setValueAtTime(sg, se); this.musicGain.gain.setValueAtTime(sm, se);
    const osc = this.ctx.createOscillator(), env = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(BASS_DROP.FREQ, se);
    env.gain.setValueAtTime(BASS_DROP.GAIN, se);
    env.gain.exponentialRampToValueAtTime(0.001, se + BASS_DROP.DECAY_MS);
    osc.connect(env); env.connect(this.ctx.destination); osc.start(se); osc.stop(se + BASS_DROP.DECAY_MS);
  }
  updateMusicLayers(combo) {
    if (!this.initialized || !this.musicEnabled) return;
    this.melodyActive = combo >= MUSIC_LAYERS.MELODY_COMBO;
    this.padActive = combo >= MUSIC_LAYERS.PAD_COMBO;
    this.arpeggioActive = combo >= MUSIC_LAYERS.ARPEGGIO_COMBO;
  }
  _playMelody() {
    if (!this.initialized || !this.melodyActive) return;
    const notes = [440, 523, 587, 659, 523, 440];
    this._playTone(notes[Math.floor(Math.random() * notes.length)], 0.12, 'triangle', 0.08, this.musicGain);
  }
  _playPad() {
    if (!this.initialized || !this.padActive) return;
    const t = this.ctx.currentTime, osc = this.ctx.createOscillator(), env = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(220, t);
    env.gain.setValueAtTime(0.04, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(env); env.connect(this.musicGain); osc.start(t); osc.stop(t + 0.4);
  }
  _playArpeggio() {
    if (!this.initialized || !this.arpeggioActive) return;
    [330, 440, 554, 659].forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.06, 'square', 0.04, this.musicGain), i * 40);
    });
  }

  setBPM(bpm) {
    this.musicBPM = bpm;
    if (this.musicPlaying) { this.stopMusic(); this.startMusic(bpm); }
  }
  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
  duckMusic() { if (this.musicGain) this.musicGain.gain.value = 0.05; }
  unduckMusic() { if (this.musicGain) this.musicGain.gain.value = 0.25; }
}
const audioSynth = new AudioSynth();
function showInterstitial(cb) { if (cb) cb(true); }
function showRewarded(cb) { if (cb) cb(true); }
