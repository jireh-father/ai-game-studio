// config.js - Game constants, colors, grid math, difficulty tables, SVG strings

const COLORS = {
  bg: '#1A1A2E', gridBorder: '#16213E', cellEmpty: '#2D2D44',
  num1: '#FF6B6B', num2: '#4ECDC4', num3: '#FFE66D',
  num4: '#A8A4FF', num5: '#FF6B9D', num6: '#45B7AA',
  highSum: '#FFD700', megaSum: '#FFFFFF',
  textPrimary: '#FFFFFF', textDark: '#0F0F23',
  selected: '#00E5FF', danger: '#FF4444',
  frozen: '#87CEEB', uiPanel: '#000000CC',
  btnPrimary: '#4ECDC4', btnText: '#0F0F23'
};

const NUM_COLORS = {
  1: COLORS.num1, 2: COLORS.num2, 3: COLORS.num3,
  4: COLORS.num4, 5: COLORS.num5, 6: COLORS.num6
};
function getCellColor(v) {
  if (v >= 10) return COLORS.megaSum;
  if (v >= 7) return COLORS.highSum;
  return NUM_COLORS[v] || COLORS.highSum;
}
function getTextColor(v) {
  return (v === 3 || v >= 7) ? COLORS.textDark : COLORS.textPrimary;
}

const HEX = { radius: 32, width: 64, height: 55.4, hSpacing: 48, vSpacing: 55.4 };
const GRID = { rings: 2, totalCells: 19 };

// Generate all 19 axial coords for radius-2 hex grid
const GRID_CELLS = [];
for (let q = -2; q <= 2; q++) {
  for (let r = -2; r <= 2; r++) {
    if (Math.abs(q + r) <= 2) GRID_CELLS.push({ q, r });
  }
}

const ADJ_OFFSETS = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];

const WAVES = [
  null, // 1-indexed
  { interval: 5000, pool: [1,2,3], weights: [40,35,25], frozen: 0, wild: 0, bomb: 0 },
  { interval: 4500, pool: [1,2,3,4], weights: [30,30,25,15], frozen: 0, wild: 0, bomb: 0 },
  { interval: 4000, pool: [1,2,3,4,5], weights: [20,20,20,20,20], frozen: 0, wild: 0, bomb: 0 },
  { interval: 3500, pool: [1,2,3,4,5,6], weights: [16,16,17,17,17,17], frozen: 0, wild: 0, bomb: 0 },
  { interval: 3000, pool: [1,2,3,4,5,6], weights: [10,10,12,13,25,30], frozen: 10, wild: 0, bomb: 0 },
  { interval: 2500, pool: [1,2,3,4,5,6], weights: [8,8,10,12,30,32], frozen: 20, wild: 0, bomb: 0 },
  { interval: 2000, pool: [1,2,3,4,5,6], weights: [6,6,9,12,32,35], frozen: 20, wild: 5, bomb: 5 },
];

const SCORING = {
  baseMult: 10, chainBonus: 50, highSumThreshold: 8,
  highSumMult: 1.5, boardClearBonus: 500
};

const TIMING = {
  mergeAnim: 200, collapseSlide: 150, chainDelay: 100,
  spawnPop: 200, deathToRestart: 1760
};

const JUICE = {
  tapParticles: 6, tapScale: 1.15, tapScaleMs: 100,
  mergeParticles: 15, mergeScale: 1.4, mergeScaleMs: 200,
  mergeSrcParticles: 8, shakeIntensity: 0.003, shakeDuration: 100,
  chainParticlesBase: 20, chainParticlesStep: 5,
  chainShakeBase: 2, chainShakeStep: 2,
  chainZoomStep: 0.01,
  deathShake: 0.012, deathShakeDuration: 400,
  scoreFloatDist: 50, scoreFloatMs: 500,
  scorePunchScale: 1.3, scorePunchMs: 150
};

function makeHexSVG(fill, stroke, sw) {
  return `<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg"><polygon points="16,0 48,0 64,28 48,56 16,56 0,28" fill="${fill}" stroke="${stroke || COLORS.gridBorder}" stroke-width="${sw || 2}"/></svg>`;
}

const SVG_STRINGS = {
  hexEmpty: makeHexSVG(COLORS.cellEmpty),
  hexSelected: makeHexSVG(COLORS.cellEmpty, COLORS.selected, 3),
  hexInvalid: makeHexSVG(COLORS.danger, COLORS.danger, 3),
  hexFrozen: `<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg"><polygon points="16,0 48,0 64,28 48,56 16,56 0,28" fill="#87CEEB44" stroke="#87CEEB" stroke-width="2" stroke-dasharray="4,2"/><line x1="20" y1="14" x2="44" y2="42" stroke="#FFFFFF66" stroke-width="1"/><line x1="44" y1="14" x2="20" y2="42" stroke="#FFFFFF66" stroke-width="1"/></svg>`,
  hexBomb: `<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg"><polygon points="16,0 48,0 64,28 48,56 16,56 0,28" fill="#FF4444" stroke="#CC0000" stroke-width="2"/><circle cx="32" cy="28" r="14" fill="#222"/><circle cx="32" cy="28" r="10" fill="#FF4444"/><line x1="32" y1="10" x2="36" y2="4" stroke="#FFD700" stroke-width="2"/><circle cx="36" cy="3" r="3" fill="#FFD700"/></svg>`,
  hexWild: `<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="w" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FF6B6B"/><stop offset="25%" stop-color="#FFE66D"/><stop offset="50%" stop-color="#4ECDC4"/><stop offset="75%" stop-color="#A8A4FF"/><stop offset="100%" stop-color="#FF6B9D"/></linearGradient></defs><polygon points="16,0 48,0 64,28 48,56 16,56 0,28" fill="#2D2D44" stroke="url(#w)" stroke-width="3"/><text x="32" y="36" text-anchor="middle" font-family="Arial Black" font-size="28" font-weight="bold" fill="url(#w)">?</text></svg>`,
  particle: `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>`
};

// Generate colored hex SVGs for numbers 1-12
for (let n = 1; n <= 12; n++) {
  const fill = getCellColor(n);
  const tc = getTextColor(n);
  SVG_STRINGS['hex' + n] = `<svg viewBox="0 0 64 56" xmlns="http://www.w3.org/2000/svg"><polygon points="16,0 48,0 64,28 48,56 16,56 0,28" fill="${fill}" stroke="${COLORS.gridBorder}" stroke-width="2"/><text x="32" y="36" text-anchor="middle" font-family="Arial Black" font-size="22" font-weight="bold" fill="${tc}">${n}</text></svg>`;
}
