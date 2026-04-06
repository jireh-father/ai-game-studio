// Lag Shot - Game Configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const HUD_HEIGHT = 48;
const LAG_DELAY_MS = 1000;

const COLORS = {
  player: '#00FFFF',
  ghost: '#00FFFF',
  enemyBasic: '#FF4444',
  enemyFast: '#FF8800',
  enemySplitter: '#CC44FF',
  enemyShield: '#FFCC00',
  enemyZigzag: '#FF2299',
  bullet: '#FFFFFF',
  background: '#0A0A0F',
  grid: '#111133',
  hudText: '#FFFFFF',
  hudBg: '#0D0D1A',
  combo: '#FFEE00',
  dangerFlash: '#FF0000',
  gold: '#FFCC00'
};

const COLORS_INT = {
  player: 0x00FFFF,
  enemyBasic: 0xFF4444,
  enemyFast: 0xFF8800,
  enemySplitter: 0xCC44FF,
  enemyShield: 0xFFCC00,
  enemyZigzag: 0xFF2299,
  white: 0xFFFFFF
};

const SCORE_VALUES = {
  killBase: 100,
  combo2x: 150,
  combo3x: 200,
  predictionBonus: 50,
  waveClear: 500,
  comboWindow: 1500
};

const ENEMY_TYPES = {
  basic: { key: 'enemy-basic', color: COLORS_INT.enemyBasic, hp: 1 },
  fast: { key: 'enemy-fast', color: COLORS_INT.enemyFast, hp: 1 },
  splitter: { key: 'enemy-splitter', color: COLORS_INT.enemySplitter, hp: 1, splits: true },
  shield: { key: 'enemy-shield', color: COLORS_INT.enemyShield, hp: 2 },
  zigzag: { key: 'enemy-zigzag', color: COLORS_INT.enemyZigzag, hp: 1, zigzag: true }
};

const BULLET_SPEED = 600;
const MAX_ENEMIES_ON_SCREEN = 5;
const DOUBLE_TAP_WINDOW = 250;
const COMBO_DISPLAY_DURATION = 1500;
const WAVE_SPAWN_DELAY = 1200;
const WAVE_FORCE_TIMER = 8000;
const INACTIVITY_DEATH_MS = 25000;
const DEATH_OVERLAP_DIST = 20;

const SVG_STRINGS = {
  player: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="none" stroke="#00FFFF" stroke-width="1.5" opacity="0.4"/>
    <polygon points="12,3 21,12 12,21 3,12" fill="#00FFFF"/>
    <polygon points="12,7 17,12 12,17 7,12" fill="#AAFFFF"/>
  </svg>`,
  'player-ghost': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <polygon points="12,3 21,12 12,21 3,12" fill="none" stroke="#00FFFF" stroke-width="1.5" opacity="0.5"/>
    <polygon points="12,7 17,12 12,17 7,12" fill="#00FFFF" opacity="0.2"/>
  </svg>`,
  bullet: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="3.5" fill="#FFFFFF"/>
    <circle cx="4" cy="4" r="2" fill="#00FFFF"/>
  </svg>`,
  'enemy-basic': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="9" fill="#FF4444"/>
    <circle cx="10" cy="10" r="5" fill="#FF8888"/>
    <circle cx="10" cy="6" r="2" fill="#FFAAAA"/>
  </svg>`,
  'enemy-fast': `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
    <polygon points="9,1 17,9 13,9 13,17 5,17 5,9 1,9" fill="#FF8800"/>
    <polygon points="9,5 14,9 11,9 11,14 7,14 7,9 4,9" fill="#FFBB44"/>
  </svg>`,
  'enemy-splitter': `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <polygon points="11,2 20,6.5 20,15.5 11,20 2,15.5 2,6.5" fill="#CC44FF"/>
    <polygon points="11,6 17,9.5 17,14.5 11,17 5,14.5 5,9.5" fill="#EE88FF"/>
    <circle cx="8" cy="11" r="1.5" fill="white" opacity="0.8"/>
    <circle cx="14" cy="11" r="1.5" fill="white" opacity="0.8"/>
  </svg>`,
  'enemy-splitter-child': `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
    <polygon points="6,1 11,3.5 11,8.5 6,11 1,8.5 1,3.5" fill="#CC44FF" opacity="0.7"/>
  </svg>`,
  'enemy-shield': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="none" stroke="#FFCC00" stroke-width="2.5"/>
    <circle cx="12" cy="12" r="7" fill="#FFCC00"/>
    <circle cx="12" cy="12" r="4" fill="#FFEE88"/>
  </svg>`,
  'enemy-zigzag': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <polygon points="10,1 12,7 18,5 14,10 19,14 13,13 12,19 10,14 7,19 7,13 1,14 6,10 2,5 8,7" fill="#FF2299"/>
    <circle cx="10" cy="10" r="3" fill="#FF88CC"/>
  </svg>`,
  grid: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <rect width="40" height="40" fill="none"/>
    <line x1="0" y1="0" x2="40" y2="0" stroke="#111133" stroke-width="0.5"/>
    <line x1="0" y1="0" x2="0" y2="40" stroke="#111133" stroke-width="0.5"/>
  </svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6">
    <circle cx="3" cy="3" r="3" fill="#FFFFFF"/>
  </svg>`
};
