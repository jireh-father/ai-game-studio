// config.js — Game constants, colors, SVG assets, difficulty parameters

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const DEADLINE_Y = 80;
const PRIORITY_INDICATOR_Y = 92;
const BUBBLES_PER_ROW = 7;
const BUBBLE_SIZE = 48;
const BUBBLE_CELL = Math.floor(GAME_WIDTH / BUBBLES_PER_ROW); // ~51px
const SPAWN_Y = GAME_HEIGHT + BUBBLE_SIZE;
const MAX_STRIKES = 3;
const INACTIVITY_TIMEOUT = 25000;

const COLORS = {
  BG: '#F5F5F0',
  DEADLINE: '#E53935',
  GRAY: '#90A4AE',
  RED: '#EF5350',
  BLUE: '#1E88E5',
  YELLOW: '#FDD835',
  SILVER: '#CFD8DC',
  POPPED_FILL: '#ECEFF1',
  HUD_BG: '#FFFFFF',
  HUD_TEXT: '#212121',
  COMBO: '#FF6F00',
  UI_BUTTON: '#1E88E5',
  UI_BUTTON_TEXT: '#FFFFFF',
  STRIKE_ACTIVE: '#E53935',
  STRIKE_LOST: '#9E9E9E',
  ROW_BONUS: '#43A047',
  SUBTITLE: '#757575',
  GOLD: '#F9A825'
};

const SCORE = {
  POP: 10,
  ROW_CLEAR: 100,
  STAGE_CLEAR: 200,
  COMBO_5: 50,
  COMBO_10: 150,
  SILVER_BONUS: 50
};

// Section 11 difficulty values (overrides Section 3)
function getScrollSpeed(stage) {
  if (stage <= 2) return 80;
  if (stage <= 5) return 95;
  if (stage <= 10) return 110;
  if (stage <= 20) return 130;
  if (stage <= 35) return 150;
  return Math.min(170 + (stage - 36) * 2, 190);
}

function getSpawnDelay(stage) {
  if (stage <= 2) return 400;
  if (stage <= 5) return 380;
  if (stage <= 10) return 360;
  if (stage <= 20) return 320;
  if (stage <= 35) return 290;
  return 260;
}

function getRowCount(stage) {
  // Rest stages reduce by 1
  const isRest = stage % 10 === 0 && stage > 0;
  const base = Math.min(4 + Math.floor(stage / 3), 8);
  return isRest ? Math.max(base - 1, 3) : base;
}

function getColorCount(stage) {
  if (stage <= 2) return 1;
  if (stage <= 5) return 2;
  return 3;
}

function getBonusChance(stage) {
  if (stage < 11) return 0;
  if (stage <= 35) return 0.10;
  return 0.15;
}

function getBlinkChance(stage) {
  if (stage < 21) return 0;
  if (stage <= 35) return 0.15;
  return 0.20;
}

function isDoubleRowSpawn(stage) {
  return stage >= 36;
}

function isRestStage(stage) {
  return stage % 10 === 0 && stage > 0;
}

// SVG strings — all include explicit width/height
const SVG_STRINGS = {
  bubble_gray: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="12" ry="12" fill="#90A4AE" stroke="#546E7A" stroke-width="2"/><ellipse cx="18" cy="14" rx="8" ry="5" fill="rgba(255,255,255,0.45)"/></svg>',
  bubble_red: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="12" ry="12" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/><ellipse cx="18" cy="14" rx="8" ry="5" fill="rgba(255,255,255,0.45)"/></svg>',
  bubble_blue: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="12" ry="12" fill="#1E88E5" stroke="#0D47A1" stroke-width="2"/><ellipse cx="18" cy="14" rx="8" ry="5" fill="rgba(255,255,255,0.45)"/></svg>',
  bubble_yellow: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="12" ry="12" fill="#FDD835" stroke="#F57F17" stroke-width="2"/><ellipse cx="18" cy="14" rx="8" ry="5" fill="rgba(255,255,255,0.45)"/></svg>',
  bubble_silver: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="12" ry="12" fill="#CFD8DC" stroke="#78909C" stroke-width="2"/><ellipse cx="18" cy="14" rx="8" ry="5" fill="rgba(255,255,255,0.55)"/><text x="24" y="32" text-anchor="middle" font-size="14" fill="#37474F">$</text></svg>',
  bubble_popped: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="2" y="2" width="44" height="44" rx="12" ry="12" fill="#ECEFF1" stroke="#B0BEC5" stroke-width="1" stroke-dasharray="4,3"/></svg>',
  strike_active: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="12" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/><ellipse cx="10" cy="10" rx="4" ry="2.5" fill="rgba(255,255,255,0.4)"/></svg>',
  strike_lost: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="12" fill="none" stroke="#9E9E9E" stroke-width="2"/></svg>',
  particle: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>'
};

const BUBBLE_COLOR_MAP = {
  gray: 'bubble_gray',
  red: 'bubble_red',
  blue: 'bubble_blue',
  yellow: 'bubble_yellow',
  silver: 'bubble_silver'
};

const BUBBLE_HEX_MAP = {
  gray: COLORS.GRAY,
  red: COLORS.RED,
  blue: COLORS.BLUE,
  yellow: COLORS.YELLOW,
  silver: COLORS.SILVER
};
