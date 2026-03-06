// config.js - Game constants, colors, tile definitions, SVG strings

const COLORS = {
  BACKGROUND: 0x0A1F0A,
  BG_HEX: '#0A1F0A',
  GRID_LINE: '#1A3A2A',
  WIRE_INACTIVE: '#B87333',
  WIRE_ACTIVE: '#FFE44D',
  CURRENT_GLOW: '#FFFFAA',
  SOURCE: '#00FF88',
  BULB_UNLIT: '#665522',
  BULB_LIT: '#FFD700',
  LOCKED: '#778899',
  DANGER: '#FF6622',
  UI_TEXT: '#FFFFFF',
  UI_ACCENT: '#00DDFF',
  LIVES_HEART: '#FF3344',
  TILE_BG: '#0D2B0D',
  WIRE_HIGHLIGHT: '#D4924A',
  TIMER_GREEN: '#00FF88',
  TIMER_YELLOW: '#FFE44D',
  TIMER_RED: '#FF3344'
};

const TILE_TYPES = { STRAIGHT: 0, ELBOW: 1, T_JUNCTION: 2, CROSS: 3 };

// Connections: [top, right, bottom, left]
const TILE_CONNECTIONS = {
  [TILE_TYPES.STRAIGHT]: {
    0: [false, true, false, true],
    1: [true, false, true, false]
  },
  [TILE_TYPES.ELBOW]: {
    0: [false, true, true, false],
    1: [false, false, true, true],
    2: [true, false, false, true],
    3: [true, true, false, false]
  },
  [TILE_TYPES.T_JUNCTION]: {
    0: [false, true, true, true],
    1: [true, false, true, true],
    2: [true, true, false, true],
    3: [true, true, true, false]
  },
  [TILE_TYPES.CROSS]: {
    0: [true, true, true, true]
  }
};

const SCORE_VALUES = {
  STAGE_CLEAR_BASE: 100,
  STAGE_CLEAR_PER_STAGE: 50,
  TIME_BONUS_PER_SEC: 10,
  PERFECT_BONUS: 200,
  SPEED_BONUS: 150,
  SPEED_BONUS_THRESHOLD: 3,
  STREAK_THRESHOLDS: [
    { streak: 3, mult: 1.5 },
    { streak: 5, mult: 2.0 },
    { streak: 10, mult: 3.0 }
  ]
};

const GAME_CONFIG = {
  INITIAL_LIVES: 3,
  MAX_STREAK_MULT: 3.0,
  TAP_DEBOUNCE: 100,
  GRID_APPEAR_DELAY: 500,
  DEATH_EFFECT_DURATION: 600,
  DEATH_TO_RESTART: 1500
};

function getDifficultyParams(stage) {
  let gridSize, speed, countdown, scrambleCount, lockedCount;
  const isRest = stage % 10 === 0 && stage > 0;
  const isBoss = stage % 15 === 0 && stage > 0;
  if (stage <= 5) {
    gridSize = 4; speed = 1.0; countdown = 15; scrambleCount = 2 + Math.floor(stage / 3);
    lockedCount = 0;
  } else if (stage <= 15) {
    gridSize = 5; speed = 1.5; countdown = 13;
    scrambleCount = 3 + Math.floor(stage / 3); lockedCount = 0;
  } else if (stage <= 30) {
    gridSize = 5; speed = 2.0; countdown = 11;
    scrambleCount = 4 + Math.floor(stage / 3); lockedCount = Math.min(2, Math.floor((stage - 10) / 10));
  } else if (stage <= 50) {
    gridSize = 6; speed = Math.min(3.0, 2.5 + (stage - 30) * 0.025); countdown = 9;
    scrambleCount = 6 + Math.floor(stage / 5); lockedCount = Math.min(3, Math.floor((stage - 20) / 10));
  } else {
    gridSize = 6; speed = Math.min(3.5, 3.0 + (stage - 50) * 0.025); countdown = 7;
    scrambleCount = 8 + Math.floor(stage / 5); lockedCount = 3;
  }
  scrambleCount = Math.min(scrambleCount, Math.floor(gridSize * gridSize * 0.6));
  if (isRest) { scrambleCount = Math.max(2, scrambleCount - 2); countdown += 3; }
  if (isBoss) { scrambleCount += 2; countdown = Math.max(5, countdown - 2); }
  return { gridSize, speed, countdown, scrambleCount, lockedCount, isRest, isBoss };
}

// SVG strings
const SVG_STRINGS = {};
SVG_STRINGS.STRAIGHT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS.TILE_BG}" stroke="${COLORS.GRID_LINE}" stroke-width="1"/><rect x="0" y="24" width="64" height="16" rx="3" fill="${COLORS.WIRE_INACTIVE}"/><rect x="0" y="28" width="64" height="8" rx="2" fill="${COLORS.WIRE_HIGHLIGHT}" opacity="0.5"/></svg>`;
SVG_STRINGS.ELBOW = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS.TILE_BG}" stroke="${COLORS.GRID_LINE}" stroke-width="1"/><path d="M32 64 L32 32 L64 32" stroke="${COLORS.WIRE_INACTIVE}" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 64 L32 32 L64 32" stroke="${COLORS.WIRE_HIGHLIGHT}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/></svg>`;
SVG_STRINGS.T_JUNCTION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS.TILE_BG}" stroke="${COLORS.GRID_LINE}" stroke-width="1"/><path d="M0 32 L64 32 M32 32 L32 64" stroke="${COLORS.WIRE_INACTIVE}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M0 32 L64 32 M32 32 L32 64" stroke="${COLORS.WIRE_HIGHLIGHT}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.5"/></svg>`;
SVG_STRINGS.CROSS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS.TILE_BG}" stroke="${COLORS.GRID_LINE}" stroke-width="1"/><path d="M0 32 L64 32 M32 0 L32 64" stroke="${COLORS.WIRE_INACTIVE}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M0 32 L64 32 M32 0 L32 64" stroke="${COLORS.WIRE_HIGHLIGHT}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.5"/></svg>`;
SVG_STRINGS.SOURCE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS.TILE_BG}"/><circle cx="32" cy="32" r="20" fill="${COLORS.SOURCE}" opacity="0.3"/><circle cx="32" cy="32" r="14" fill="${COLORS.SOURCE}"/><circle cx="32" cy="32" r="8" fill="#AAFFCC"/><text x="32" y="38" text-anchor="middle" fill="#003311" font-size="16" font-weight="bold">S</text></svg>`;
SVG_STRINGS.BULB_UNLIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS.TILE_BG}"/><circle cx="32" cy="28" r="16" fill="${COLORS.BULB_UNLIT}" stroke="#998833" stroke-width="2"/><rect x="26" y="44" width="12" height="8" fill="#998833" rx="2"/></svg>`;
SVG_STRINGS.BULB_LIT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${COLORS.TILE_BG}"/><circle cx="32" cy="28" r="22" fill="${COLORS.BULB_LIT}" opacity="0.2"/><circle cx="32" cy="28" r="16" fill="${COLORS.BULB_LIT}" stroke="#FFEE88" stroke-width="2"/><circle cx="32" cy="28" r="8" fill="#FFFFCC"/><rect x="26" y="44" width="12" height="8" fill="#FFEE88" rx="2"/></svg>`;
SVG_STRINGS.LOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="20" y="30" width="24" height="18" rx="3" fill="${COLORS.LOCKED}" opacity="0.8"/><path d="M26 30 L26 24 Q26 16 32 16 Q38 16 38 24 L38 30" fill="none" stroke="${COLORS.LOCKED}" stroke-width="3" opacity="0.8"/><circle cx="32" cy="40" r="3" fill="#AABBCC"/></svg>`;
SVG_STRINGS.PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>`;
