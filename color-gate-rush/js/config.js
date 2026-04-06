// config.js — Color Gate Rush constants, colors, difficulty, audio, SVGs

const SCREEN = { WIDTH: 360, HEIGHT: 720, BALL_Y: 510 };

const COLORS = {
  RED:    { hex: 0xFF3355, css: '#FF3355', name: 'red',    freq: 440 },
  BLUE:   { hex: 0x3399FF, css: '#3399FF', name: 'blue',   freq: 528 },
  GREEN:  { hex: 0x33FF88, css: '#33FF88', name: 'green',  freq: 660 },
  YELLOW: { hex: 0xFFDD00, css: '#FFDD00', name: 'yellow', freq: 880 }
};

const COLOR_CYCLE = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

const BG_COLOR = 0x0A0A14;
const GATE_BODY_COLOR = 0x1A1A2E;
const GATE_BORDER_CSS = '#888899';
const UI_BG = '#10101E';
const UI_BUTTON = '#00FFCC';
const COMBO_COLOR = '#00FFFF';
const STAR_COLOR = 0xFFD700;

const JUICE = {
  TAP_SCALE: 1.25,
  TAP_SCALE_MS: 80,
  GATE_CLEAR_FLASH_MS: 100,
  TRAIL_LENGTH: 5,
  DEATH_SHAKE_PX: 0.015,
  DEATH_SHAKE_MS: 350,
  DEATH_FLASH_MS: 120,
  PARTICLE_COUNT: 18,
  PARTICLE_SPEED: 220,
  PARTICLE_LIFETIME: 600,
  SCORE_FLOAT_MS: 800,
  COMBO_FADE_MS: 1500,
  STAGE_CLEAR_MS: 300,
  HITSTOP_MS: 60,
  BALL_RADIUS: 14,
  GATE_OUTER_R: 100,
  GATE_INNER_R: 72,
  GATE_SPACING: 280
};

const DIFFICULTY = {
  baseSpeed: 120,
  speedPerStage: 8,
  maxSpeed: 320,
  baseGates: 8,
  maxGates: 20,
  baseArcGap: 80,
  arcGapReduction: 1.5,
  minArcGap: 40,
  rotationStart: 7,
  baseRotation: 30,
  rotationPerStage: 3,
  maxRotation: 120,
  gravityStart: 11,
  speedZoneStart: 16,
  chaosStart: 30,
  restStageInterval: 5
};

const SVG_STRINGS = {
  star: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" fill="#FFD700" stroke="#FFA500" stroke-width="1"/></svg>'
};

// Web Audio API helper
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function playTone(freq, duration, type, volume) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume || 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration / 1000));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (duration / 1000));
  } catch (e) {}
}

function playSweep(startFreq, endFreq, duration, type, volume) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + (duration / 1000));
    gain.gain.setValueAtTime(volume || 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration / 1000));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (duration / 1000));
  } catch (e) {}
}

const AUDIO = {
  playTap: function(colorKey) {
    const c = COLORS[colorKey];
    if (c) playTone(c.freq, 80, 'square', 0.3);
  },
  playGateClear: function(combo) {
    const offset = Math.min(combo * 50, 250);
    playSweep(600 + offset, 900 + offset, 120, 'sine', 0.4);
  },
  playDeath: function() {
    playSweep(440, 110, 400, 'sawtooth', 0.5);
  },
  playStageComplete: function() {
    const notes = [523, 659, 784, 1047];
    notes.forEach(function(f, i) {
      setTimeout(function() { playTone(f, 200, 'sine', 0.3); }, i * 50);
    });
  },
  playStar: function() {
    const notes = [800, 1200, 1600];
    notes.forEach(function(f, i) {
      setTimeout(function() { playTone(f, 100, 'sine', 0.35); }, i * 60);
    });
  },
  playHighScore: function() {
    const notes = [523, 659, 784, 880, 1047, 1320];
    notes.forEach(function(f, i) {
      setTimeout(function() { playTone(f, 150, 'sine', 0.3); }, i * 120);
    });
  },
  playUIClick: function() {
    playTone(800, 40, 'square', 0.2);
  }
};
