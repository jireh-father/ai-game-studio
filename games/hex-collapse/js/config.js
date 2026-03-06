// config.js — Game constants, colors, SVG strings, hex math, difficulty tables
const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  BG_COLOR: '#1A1A2E',
  HEX_FILL: '#FFFFFF',
  HEX_STROKE: '#3A3A5C',
  HEX_R2: 28,
  HEX_R3: 22,
  IDLE_TIMEOUT: 30000,
  PERFECT_CLEAR_BONUS: 500,
  HUD_HEIGHT: 48,
  PREVIEW_HEIGHT: 80,
  PROGRESS_HEIGHT: 32
};

const NUMBER_COLORS = {
  1: '#4A9EFF', 2: '#2EC4B6', 3: '#7BC950',
  4: '#FFD166', 5: '#FF8C42', 6: '#FF4081'
};

const SPECIAL_COLORS = {
  bomb: '#E63946', mirror: '#C0C0C0', void: '#7B2FBE'
};

const COLORS = {
  accent: '#00E5FF', danger: '#FF1744', gold: '#FFD700',
  uiText: '#FFFFFF', dimText: '#3A3A5C'
};

const HEX_MATH = {
  SQRT3: Math.sqrt(3),
  DIRS: [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]
};

// SVG strings
const SVG_HEX = (w, h, fill, stroke) =>
  `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">` +
  `<polygon points="${w/2},0 ${w*0.966},${h*0.25} ${w*0.966},${h*0.75} ${w/2},${h} ${w*0.034},${h*0.75} ${w*0.034},${h*0.25}" ` +
  `fill="${fill}" stroke="${stroke}" stroke-width="2"/></svg>`;

const SVG_HEX_BOMB = (w, h) =>
  `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">` +
  `<polygon points="${w/2},0 ${w*0.966},${h*0.25} ${w*0.966},${h*0.75} ${w/2},${h} ${w*0.034},${h*0.75} ${w*0.034},${h*0.25}" ` +
  `fill="#E63946" stroke="#3A3A5C" stroke-width="2"/>` +
  `<circle cx="${w/2}" cy="${h/2}" r="${w*0.2}" fill="#1A1A2E"/>` +
  `<line x1="${w/2}" y1="${h*0.18}" x2="${w/2}" y2="${h*0.32}" stroke="#FFD700" stroke-width="3" stroke-linecap="round"/></svg>`;

const SVG_TRIANGLE = `<svg width="16" height="14" viewBox="0 0 16 14" xmlns="http://www.w3.org/2000/svg">` +
  `<polygon points="8,0 16,14 0,14" fill="#FFFFFF" opacity="0.9"/></svg>`;

const SCORE_VALUES = {
  basePer: 10,
  perfectClear: 500,
  bombFlat: 50
};

const DIFFICULTY_TABLE = [
  // stage: [boardRadius, numberPool, specialChance, collapseTarget, autoFillInterval, lowNumBias]
  { radius: 2, pool: [1,2,3,4], special: 0, target: 5, autoFill: 3000, bias: 0.60 },       // 1
  { radius: 2, pool: [1,2,3,4], special: 0, target: 7, autoFill: 3000, bias: 0.58 },       // 2
  { radius: 2, pool: [1,2,3,4], special: 0, target: 10, autoFill: 3000, bias: 0.55 },      // 3
  { radius: 2, pool: [1,2,3,4,5,6], special: 0, target: 12, autoFill: 2700, bias: 0.50 },  // 4
  { radius: 2, pool: [1,2,3,4,5,6], special: 0, target: 15, autoFill: 2700, bias: 0.48 },  // 5
  { radius: 2, pool: [1,2,3,4,5,6], special: 0, target: 18, autoFill: 2700, bias: 0.45 },  // 6
  { radius: 3, pool: [1,2,3,4,5,6], special: 0.03, target: 20, autoFill: 2400, bias: 0.45 },// 7
  { radius: 3, pool: [1,2,3,4,5,6], special: 0.06, target: 22, autoFill: 2400, bias: 0.43 },// 8
  { radius: 3, pool: [1,2,3,4,5,6], special: 0.09, target: 25, autoFill: 2400, bias: 0.40 },// 9
  { radius: 3, pool: [1,2,3,4,5,6], special: 0.12, target: 28, autoFill: 2000, bias: 0.38 } // 10
];

function getDifficultyForStage(stage) {
  if (stage <= 0) stage = 1;
  if (stage <= DIFFICULTY_TABLE.length) return DIFFICULTY_TABLE[stage - 1];
  const last = DIFFICULTY_TABLE[DIFFICULTY_TABLE.length - 1];
  return {
    radius: 3,
    pool: [1,2,3,4,5,6],
    special: Math.min(0.15, last.special + (stage - DIFFICULTY_TABLE.length) * 0.01),
    target: Math.min(50, 28 + (stage - 10) * 3),
    autoFill: Math.max(1000, last.autoFill - (stage - 10) * 100),
    bias: Math.max(0.33, last.bias - (stage - 10) * 0.01)
  };
}

// Global game state (must be available to all modules)
const GameState = {
  score: 0,
  highScore: parseInt(localStorage.getItem('hex_collapse_high_score') || '0'),
  stage: 1,
  collapses: 0,
  chainCount: 0,
  bestChain: 0,
  gamesPlayed: parseInt(localStorage.getItem('hex_collapse_games_played') || '0'),
  settings: JSON.parse(localStorage.getItem('hex_collapse_settings') || '{"sound":true,"vibration":true}')
};
