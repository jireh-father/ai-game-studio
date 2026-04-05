// Paradox Panic - Game Configuration
const COLORS = {
  background: 0x0D1117,
  backgroundHex: '#0D1117',
  cardFace: 0xFFFFFF,
  cardText: '#1A1A2E',
  cardBorder: 0x8892A4,
  trueHint: 0x00D084,
  trueHex: '#00D084',
  falseHint: 0xFF4757,
  falseHex: '#FF4757',
  paradox: 0x8B5CF6,
  paradoxHex: '#8B5CF6',
  paradoxLight: '#A78BFA',
  strike: 0xFF6B35,
  strikeHex: '#FF6B35',
  comboGold: 0xFFD700,
  comboGoldHex: '#FFD700',
  scoreText: '#FFFFFF',
  speedBonus: '#00D2FF',
  uiBg: 0x161B22,
  uiBgHex: '#161B22',
  white: 0xFFFFFF
};

const GAME_CONFIG = {
  maxStack: 5,
  maxStrikes: 3,
  wrongParadoxPenalty: 2,
  swipeMinX: 60,
  swipeMaxY: 40,
  paradoxDebounceMs: 500,
  inactivityDeathMs: 25000,
  correctPerStage: 10
};

const SCORING = {
  correctBase: 100,
  paradoxBase: 300,
  speedFast: 50,
  speedSuperFast: 100,
  wrongParadox: -50,
  comboMultipliers: [1, 1, 1.5, 2.0, 3.0] // index = combo count, 4+ = 3.0
};

const DIFFICULTY = {
  stages: [
    { minStage: 0,  interval: 5000, paradoxChance: 0.10, speedFast: 3000, speedSuper: 1500 },
    { minStage: 3,  interval: 4500, paradoxChance: 0.18, speedFast: 3000, speedSuper: 1500 },
    { minStage: 5,  interval: 4000, paradoxChance: 0.22, speedFast: 2500, speedSuper: 1200 },
    { minStage: 8,  interval: 3500, paradoxChance: 0.28, speedFast: 2000, speedSuper: 1000 },
    { minStage: 13, interval: 3000, paradoxChance: 0.32, speedFast: 1500, speedSuper: 800  },
    { minStage: 21, interval: 3000, paradoxChance: 0.35, speedFast: 1500, speedSuper: 800  }
  ]
};

const CARD_WIDTH = 300;
const CARD_HEIGHT = 120;

// SVG Strings - all with explicit width/height
const SVG_STRINGS = {
  card: `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
    <rect x="2" y="2" width="${CARD_WIDTH-4}" height="${CARD_HEIGHT-4}" rx="12" ry="12" fill="#FFFFFF" stroke="#8892A4" stroke-width="2"/>
  </svg>`,
  cardGreen: `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
    <rect x="2" y="2" width="${CARD_WIDTH-4}" height="${CARD_HEIGHT-4}" rx="12" ry="12" fill="#FFFFFF" stroke="#00D084" stroke-width="4"/>
  </svg>`,
  cardRed: `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
    <rect x="2" y="2" width="${CARD_WIDTH-4}" height="${CARD_HEIGHT-4}" rx="12" ry="12" fill="#FFFFFF" stroke="#FF4757" stroke-width="4"/>
  </svg>`,
  cardPurple: `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
    <rect x="2" y="2" width="${CARD_WIDTH-4}" height="${CARD_HEIGHT-4}" rx="12" ry="12" fill="#FFFFFF" stroke="#8B5CF6" stroke-width="4"/>
  </svg>`,
  cardGold: `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
    <rect x="2" y="2" width="${CARD_WIDTH-4}" height="${CARD_HEIGHT-4}" rx="12" ry="12" fill="#FFFFFF" stroke="#FFD700" stroke-width="4"/>
  </svg>`,
  strikeFilled: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="8" fill="#FF6B35" stroke="#FF4757" stroke-width="2"/>
  </svg>`,
  strikeEmpty: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="8" fill="none" stroke="#8892A4" stroke-width="2"/>
  </svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4" fill="#FFFFFF"/>
  </svg>`,
  particleGreen: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4" fill="#00D084"/>
  </svg>`,
  particleRed: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4" fill="#FF4757"/>
  </svg>`,
  particlePurple: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4" fill="#8B5CF6"/>
  </svg>`,
  particleGold: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4" fill="#FFD700"/>
  </svg>`
};

// Audio Manager (Web Audio API only — no Howler.js)
const AudioManager = {
  ctx: null,
  muted: false,
  init() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  play(freq, dur, type, vol) {
    if (this.muted || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + dur);
  },
  playChord(freqs, dur, type, vol) {
    freqs.forEach(f => this.play(f, dur, type, vol || 0.08));
  }
};
