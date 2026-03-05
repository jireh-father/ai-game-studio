// config.js - Game constants, colors, difficulty tables, SVG strings

const COLORS = {
  RUNNER: 0x00B4D8,
  WALL: 0xE63946,
  BAR: 0xF4A261,
  GAP: 0x2A9D8F,
  BG: 0xF1FAEE,
  GROUND: 0x457B9D,
  TEXT: 0x1D3557,
  COMBO_GLOW: 0xFFD700,
  STUMBLE_FLASH: 0xFF0000,
  WHITE: 0xFFFFFF
};

const COLORS_HEX = {
  RUNNER: '#00B4D8',
  WALL: '#E63946',
  BAR: '#F4A261',
  GAP: '#2A9D8F',
  BG: '#F1FAEE',
  GROUND: '#457B9D',
  TEXT: '#1D3557',
  COMBO_GLOW: '#FFD700',
  WHITE: '#FFFFFF'
};

const SCORING = {
  PERFECT_POINTS: 150,
  GOOD_POINTS: 100,
  COMBO_BONUS: 50,
  STAGE_CLEAR: 200,
  PERFECT_THRESHOLD: 0.5 // within 50% of center = perfect
};

const COMBO_THRESHOLDS = { TRAIL: 10, COLOR_SHIFT: 20, PARTICLE_DOUBLE: 30 };
const LIVES_MAX = 3;
const INACTIVITY_TIMEOUT = 3000;
const RUNNER_X_RATIO = 0.22;
const GROUND_HEIGHT_RATIO = 0.78;
const RUNNER_SPEED_BASE = 200;

const OBSTACLE_TYPES = ['wall', 'bar', 'gap'];
const STAGE_UNLOCK = { wall: 1, bar: 4, gap: 7 };

const SVG_RUNNER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48">
  <circle cx="16" cy="8" r="6" fill="#00B4D8"/>
  <rect x="12" y="14" width="8" height="16" rx="3" fill="#00B4D8"/>
  <rect x="8" y="30" width="6" height="14" rx="2" fill="#0096B7" transform="rotate(-20 11 30)"/>
  <rect x="18" y="30" width="6" height="14" rx="2" fill="#0096B7" transform="rotate(15 21 30)"/>
  <rect x="6" y="16" width="5" height="10" rx="2" fill="#0096B7" transform="rotate(30 8 16)"/>
  <rect x="21" y="16" width="5" height="10" rx="2" fill="#0096B7" transform="rotate(-20 23 16)"/>
</svg>`;

const SVG_WALL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 40">
  <rect x="2" y="0" width="20" height="40" rx="2" fill="#E63946" stroke="#C1121F" stroke-width="2"/>
  <line x1="12" y1="4" x2="12" y2="36" stroke="#C1121F" stroke-width="1" opacity="0.3"/>
</svg>`;

const SVG_BAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 28">
  <rect x="2" y="8" width="4" height="20" fill="#E76F51"/>
  <rect x="54" y="8" width="4" height="20" fill="#E76F51"/>
  <rect x="0" y="0" width="60" height="8" rx="4" fill="#F4A261" stroke="#E76F51" stroke-width="1.5"/>
</svg>`;

const SVG_GAP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 10">
  <rect x="0" y="0" width="10" height="10" fill="#2A9D8F"/>
  <rect x="50" y="0" width="10" height="10" fill="#2A9D8F"/>
  <polygon points="20,5 25,2 25,8" fill="#2A9D8F" opacity="0.5"/>
  <polygon points="40,5 35,2 35,8" fill="#2A9D8F" opacity="0.5"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#00B4D8"/>
</svg>`;

const SVG_LIFE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 24">
  <circle cx="8" cy="5" r="4" fill="#00B4D8"/>
  <rect x="5" y="9" width="6" height="10" rx="2" fill="#00B4D8"/>
  <rect x="3" y="19" width="4" height="5" rx="1" fill="#00B4D8"/>
  <rect x="9" y="19" width="4" height="5" rx="1" fill="#00B4D8"/>
</svg>`;

const SVG_LIFE_EMPTY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 24">
  <circle cx="8" cy="5" r="4" fill="#AAA" opacity="0.3"/>
  <rect x="5" y="9" width="6" height="10" rx="2" fill="#AAA" opacity="0.3"/>
  <rect x="3" y="19" width="4" height="5" rx="1" fill="#AAA" opacity="0.3"/>
  <rect x="9" y="19" width="4" height="5" rx="1" fill="#AAA" opacity="0.3"/>
</svg>`;
