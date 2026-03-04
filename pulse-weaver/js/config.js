// Game constants and configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 680;
const TOP_BAR_HEIGHT = 56;
const BOTTOM_BAR_HEIGHT = 56;
const PLAY_AREA_TOP = TOP_BAR_HEIGHT;
const PLAY_AREA_BOTTOM = GAME_HEIGHT - BOTTOM_BAR_HEIGHT;
const PLAY_AREA_HEIGHT = PLAY_AREA_BOTTOM - PLAY_AREA_TOP;

const PULSE_SPEED = 200; // px/s
const MAX_PATH_LENGTH = 800;
const MIN_PATH_LENGTH = 50;
const ELEMENT_RADIUS = 28;
const ELEMENT_COLLISION_RADIUS = 32;
const PATH_SAMPLE_INTERVAL = 5; // px min between path points
const PATH_MAX_LENGTH_STAGE_31 = 600;
const PATH_MAX_LENGTH_STAGE_51 = 400;

const HINT_TRIGGER_ATTEMPTS = 5;
const REST_STAGE_INTERVAL = 5;
const SPECIAL_STAGE_INTERVAL = 10;

const COLORS = {
  background: 0xF0F4FF,
  backgroundAlt: 0xF8FBFF,
  pulseLine: 0xFFFFFF,
  pulseGlow: 0x7FFFD4,
  uiBackground: 0x1A237E,
  uiAccent: 0x7FFFD4,
  uiText: 0xECEFF1,
  uiTextDim: 0x90A4AE,
  scoreText: 0xECEFF1,
  comboBadge: 0xFFD700,
  targetRing: 0xFFFFFF,
  targetRingGlow: 0x7FFFD4,
  steam: 0xCFD8DC,
  plasma: 0x9C27B0,
  blizzard: 0x00BCD4,
};

const ELEMENT_TYPES = [
  { id: 'fire',      name: 'Fire',      color: 0xFF6B35, glowColor: 0xFFB347, shapeType: 'star',    audioFreq: 150 },
  { id: 'water',     name: 'Water',     color: 0x4FC3F7, glowColor: 0x81D4FA, shapeType: 'wave',    audioFreq: 400 },
  { id: 'ice',       name: 'Ice',       color: 0xE3F2FD, glowColor: 0xB3E5FC, shapeType: 'hex',     audioFreq: 1200 },
  { id: 'lightning', name: 'Lightning', color: 0xFFD600, glowColor: 0xFFF176, shapeType: 'bolt',    audioFreq: 800 },
  { id: 'void',      name: 'Void',      color: 0x4A148C, glowColor: 0x7B1FA2, shapeType: 'circle',  audioFreq: 80 },
  { id: 'earth',     name: 'Earth',     color: 0x795548, glowColor: 0xA1887F, shapeType: 'mound',   audioFreq: 80 },
  { id: 'wind',      name: 'Wind',      color: 0xB2DFDB, glowColor: 0x80CBC4, shapeType: 'spiral',  audioFreq: 600 },
  { id: 'crystal',   name: 'Crystal',   color: 0xF8BBD0, glowColor: 0xF48FB1, shapeType: 'shard',   audioFreq: 1600 },
];

const ELEMENT_MAP = {};
ELEMENT_TYPES.forEach(e => { ELEMENT_MAP[e.id] = e; });

// Transformation rules: [fromType, context(prev)] -> result
const TRANSFORM_ALONE = {
  fire:      { result: 'ember',   name: 'Ember',   blocked: false },
  water:     { result: 'mist',    name: 'Mist',    remove: true },
  ice:       { result: 'frost',   name: 'Frost',   blocksPulse: true },
  lightning: { result: 'charge',  name: 'Charge',  comboBoost: true },
  void:      { result: 'null',    name: 'Null',    remove: true },
  earth:     { result: 'stone',   name: 'Stone',   blocked: false },
  wind:      { result: 'breeze',  name: 'Breeze',  deflect: 30 },
  crystal:   { result: 'shard',   name: 'Shard',   splitPulse: 2 },
};

// Combo recipes [prev, current] -> result
const COMBO_RECIPES = [
  { elements: ['fire', 'water'],     result: 'steam',       name: 'Steam',         color: 0xCFD8DC, score: 500, chord: [261, 329, 392] },
  { elements: ['water', 'fire'],     result: 'cancelled',   name: 'Cancelled',     color: 0xCFD8DC, score: 0,   chord: [] },
  { elements: ['fire', 'lightning'], result: 'plasma',      name: 'Plasma',        color: 0x9C27B0, score: 500, chord: [311, 392, 466] },
  { elements: ['ice', 'water'],      result: 'blizzard',    name: 'Blizzard',      color: 0x00BCD4, score: 500, chord: [220, 261, 329] },
  { elements: ['water', 'ice'],      result: 'melt',        name: 'Melt',          color: 0x4FC3F7, score: 500, chord: [392, 466, 587] },
  { elements: ['lightning', 'void'], result: 'singularity', name: 'Singularity',   color: 0x7B1FA2, score: 500, chord: [369, 466, 554] },
  { elements: ['void', 'fire'],      result: 'inferno',     name: 'Inferno',       color: 0xFF4500, score: 500, chord: [277, 329, 415] },
  { elements: ['earth', 'water'],    result: 'mud',         name: 'Mud',           color: 0x795548, score: 500, chord: [349, 440, 523] },
  { elements: ['wind', 'ice'],       result: 'blizzardstorm', name: 'Blizzard Storm', color: 0x00ACC1, score: 500, chord: [392, 466, 587] },
  { elements: ['crystal', 'lightning'], result: 'prism',   name: 'Prism',         color: 0xF48FB1, score: 500, chord: [523, 659, 784] },
];

// 3-element combos
const COMBO_3_RECIPES = [
  { elements: ['fire', 'water', 'earth'],       result: 'magmaflow',   name: 'Magma Flow',    color: 0xFF4500, score: 1500 },
  { elements: ['ice', 'water', 'wind'],         result: 'arcticstorm', name: 'Arctic Storm',  color: 0x00BCD4, score: 1500 },
  { elements: ['lightning', 'crystal', 'void'], result: 'collapse',    name: 'Collapse',      color: 0x4A148C, score: 1500 },
];

const SCORE_VALUES = {
  transform: 100,
  combo2: 500,
  combo3: 1500,
  stageComplete: 1000,
  speedBonus: 500,
  noRetry: 200,
  compactPath: 300,
};

const DIFFICULTY_TABLE = [
  { stageRange: [1, 5],   elementCount: [4, 6],   targetCount: [2, 3], pathLimit: null, timeLimit: null, movingCount: 0 },
  { stageRange: [6, 15],  elementCount: [6, 8],   targetCount: [3, 5], pathLimit: null, timeLimit: null, movingCount: 0 },
  { stageRange: [16, 30], elementCount: [8, 10],  targetCount: [5, 7], pathLimit: null, timeLimit: null, movingCount: 0 },
  { stageRange: [31, 50], elementCount: [10, 14], targetCount: [7, 10], pathLimit: 600, timeLimit: 4000, movingCount: 2 },
  { stageRange: [51, 999],elementCount: [14, 16], targetCount: [10, 12], pathLimit: 500, timeLimit: 3000, movingCount: 3 },
];

function getDifficulty(stage) {
  for (const d of DIFFICULTY_TABLE) {
    if (stage >= d.stageRange[0] && stage <= d.stageRange[1]) return d;
  }
  return DIFFICULTY_TABLE[DIFFICULTY_TABLE.length - 1];
}

function getElementConfig(id) {
  return ELEMENT_MAP[id] || ELEMENT_TYPES[0];
}

function findCombo(prevType, currType) {
  return COMBO_RECIPES.find(r => r.elements[0] === prevType && r.elements[1] === currType) || null;
}

function find3Combo(types) {
  if (types.length < 3) return null;
  const last3 = types.slice(-3);
  return COMBO_3_RECIPES.find(r =>
    r.elements[0] === last3[0] && r.elements[1] === last3[1] && r.elements[2] === last3[2]
  ) || null;
}
