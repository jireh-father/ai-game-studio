// Rush Hour Dash - Configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 688;
const HUD_HEIGHT = 48;
const LANE_HEIGHT = 64;
const GAME_AREA_HEIGHT = 640;
const PLAYER_SIZE = 48;
const PLAYER_HITBOX = 40;

const COLORS = {
  player: 0x00E5FF,
  playerOutline: 0x0A1628,
  road: 0x2C2C3E,
  laneDivider: 0xFFFFFF,
  carA: 0xFF3B30,
  carB: 0xFF9500,
  bus: 0x5E35B1,
  taxi: 0xFFD600,
  motorbike: 0x76FF03,
  coin: 0xFFC107,
  deathWall: 0xFF1744,
  deathWallGlow: 0xFF6D00,
  hudBg: 0x1A1A2E,
  hudText: 0xFFFFFF,
  comboText: 0xE0F7FA,
  menuBg: 0x0D1B2A,
  buttonPrimary: 0x00E5FF,
  buttonText: 0x0A1628,
  danger: 0xFF1744
};

const COLORS_STR = {
  player: '#00E5FF', road: '#2C2C3E', coin: '#FFC107',
  deathWall: '#FF1744', hudBg: '#1A1A2E', menuBg: '#0D1B2A',
  buttonPrimary: '#00E5FF', buttonText: '#0A1628', white: '#FFFFFF',
  comboText: '#E0F7FA', danger: '#FF3B30', amber: '#FF9500',
  gold: '#FFD600'
};

const SCORE_VALUES = { HOP: 10, COIN: 50, MILESTONE: 100, STREAK_BONUS: 25 };
const SCROLL_BASE = 40;
const SCROLL_PER_HOP = 1.1;
const SCROLL_MAX = 130;
const COMBO_WINDOW = 500; // ms
const HOP_DURATION = 200;
const HOP_ARC_HEIGHT = 20;
const INACTIVITY_DEATH_MS = 25000;

const COMBO_MULTIPLIERS = { 2: 1.2, 5: 1.5, 10: 2.0 };

const VEHICLE_SIZES = {
  car_a: { w: 64, h: 32 },
  car_b: { w: 64, h: 32 },
  bus: { w: 96, h: 40 },
  taxi: { w: 64, h: 32 },
  motorbike: { w: 36, h: 20 }
};

const SVG_STRINGS = {
  player: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <rect x="12" y="8" width="24" height="28" rx="6" ry="6" fill="#00E5FF" stroke="#0A1628" stroke-width="2"/>
    <circle cx="24" cy="11" r="7" fill="#00E5FF" stroke="#0A1628" stroke-width="2"/>
    <rect x="6" y="14" width="8" height="5" rx="2" fill="#00E5FF" stroke="#0A1628" stroke-width="1.5"/>
    <rect x="34" y="14" width="8" height="5" rx="2" fill="#00E5FF" stroke="#0A1628" stroke-width="1.5"/>
    <rect x="14" y="34" width="7" height="8" rx="2" fill="#00B2CC" stroke="#0A1628" stroke-width="1.5"/>
    <rect x="27" y="34" width="7" height="8" rx="2" fill="#00B2CC" stroke="#0A1628" stroke-width="1.5"/>
  </svg>`,
  car_a: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32">
    <rect x="2" y="4" width="60" height="24" rx="5" fill="#FF3B30" stroke="#0A1628" stroke-width="2"/>
    <rect x="14" y="6" width="16" height="10" rx="2" fill="#B3E5FC" stroke="#0A1628" stroke-width="1"/>
    <rect x="34" y="6" width="14" height="10" rx="2" fill="#B3E5FC" stroke="#0A1628" stroke-width="1"/>
    <circle cx="10" cy="28" r="4" fill="#212121"/><circle cx="54" cy="28" r="4" fill="#212121"/>
    <circle cx="10" cy="4" r="4" fill="#212121"/><circle cx="54" cy="4" r="4" fill="#212121"/>
  </svg>`,
  car_b: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32">
    <rect x="2" y="4" width="60" height="24" rx="5" fill="#FF9500" stroke="#0A1628" stroke-width="2"/>
    <rect x="14" y="6" width="16" height="10" rx="2" fill="#B3E5FC" stroke="#0A1628" stroke-width="1"/>
    <rect x="34" y="6" width="14" height="10" rx="2" fill="#B3E5FC" stroke="#0A1628" stroke-width="1"/>
    <circle cx="10" cy="28" r="4" fill="#212121"/><circle cx="54" cy="28" r="4" fill="#212121"/>
    <circle cx="10" cy="4" r="4" fill="#212121"/><circle cx="54" cy="4" r="4" fill="#212121"/>
  </svg>`,
  bus: `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="40" viewBox="0 0 96 40">
    <rect x="2" y="2" width="92" height="36" rx="4" fill="#5E35B1" stroke="#0A1628" stroke-width="2"/>
    <rect x="10" y="7" width="12" height="10" rx="2" fill="#EDE7F6" stroke="#0A1628" stroke-width="1"/>
    <rect x="26" y="7" width="12" height="10" rx="2" fill="#EDE7F6" stroke="#0A1628" stroke-width="1"/>
    <rect x="42" y="7" width="12" height="10" rx="2" fill="#EDE7F6" stroke="#0A1628" stroke-width="1"/>
    <rect x="58" y="7" width="12" height="10" rx="2" fill="#EDE7F6" stroke="#0A1628" stroke-width="1"/>
    <rect x="74" y="7" width="12" height="10" rx="2" fill="#EDE7F6" stroke="#0A1628" stroke-width="1"/>
  </svg>`,
  taxi: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32">
    <rect x="2" y="4" width="60" height="24" rx="5" fill="#FFD600" stroke="#0A1628" stroke-width="2"/>
    <rect x="14" y="6" width="16" height="10" rx="2" fill="#B3E5FC" stroke="#0A1628" stroke-width="1"/>
    <rect x="34" y="6" width="14" height="10" rx="2" fill="#B3E5FC" stroke="#0A1628" stroke-width="1"/>
    <rect x="24" y="0" width="16" height="6" rx="2" fill="#FFD600" stroke="#0A1628" stroke-width="1"/>
    <circle cx="10" cy="28" r="4" fill="#212121"/><circle cx="54" cy="28" r="4" fill="#212121"/>
  </svg>`,
  motorbike: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="20" viewBox="0 0 36 20">
    <ellipse cx="18" cy="10" rx="16" ry="6" fill="#76FF03" stroke="#0A1628" stroke-width="1.5"/>
    <circle cx="18" cy="10" r="5" fill="#CCFF90" stroke="#0A1628" stroke-width="1"/>
  </svg>`,
  coin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#FFC107" stroke="#FF8F00" stroke-width="2"/>
    <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="#FF8F00" font-family="Arial">$</text>
  </svg>`
};

const GameState = {
  score: 0, hops: 0, stage: 1, combo: 0, comboMultiplier: 1.0,
  lastHopTime: 0, highScore: 0, isDead: false,
  reset() {
    this.score = 0; this.hops = 0; this.stage = 1;
    this.combo = 0; this.comboMultiplier = 1.0;
    this.lastHopTime = 0; this.isDead = false;
    this.highScore = parseInt(localStorage.getItem('rush-hour-dash_high_score') || '0', 10);
  },
  addScore(pts) {
    this.score += Math.floor(pts * this.comboMultiplier);
  },
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('rush-hour-dash_high_score', String(this.highScore));
      return true;
    }
    return false;
  }
};
