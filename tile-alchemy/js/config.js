// config.js - Constants, colors, alchemy table, SVG strings, difficulty tables

const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  GRID_SIZE: 5,
  CELL_SIZE: 56,
  CELL_GAP: 4,
  CELL_STEP: 60,
  GRID_OFFSET_X: 32,
  GRID_OFFSET_Y: 80,
  VOID_DEATH_THRESHOLD: 19,
  IDLE_TIMEOUT: 12000,
  IDLE_RAPID_INTERVAL: 500,
  PURE_CRYSTAL_FREQUENCY: 5,
  CHAIN_DELAY: 300,
  GRAVITY_DURATION: 180,
  MERGE_FLASH_DURATION: 150,
  STAGE_CLEAR_PAUSE: 1500,
};

const COLORS = {
  BG: 0x0D0B1E,
  CELL_BG: 0x1A1435,
  CELL_STROKE: 0x3D2E6B,
  FIRE: 0xFF6B2B,
  WATER: 0x2B9DFF,
  EARTH: 0x4CAF50,
  AIR: 0x80DEEA,
  LIGHTNING: 0xFFD740,
  MAGMA: 0xE64A19,
  ICE: 0xB3E5FC,
  STORM: 0x9C27B0,
  MUD: 0x795548,
  STEAM: 0xCFD8DC,
  OBSIDIAN: 0x1A0033,
  BLIZZARD: 0xE8F5FE,
  TORNADO: 0x006064,
  PHILOSOPHER: 0xFFD700,
  VOID: 0x0A0A0A,
  VOID_PULSE: 0x8B00FF,
  PURE_CRYSTAL: 0xF0F0FF,
  SELECTION: 0xFFD700,
  UI_TEXT: 0xE8E0F0,
  UI_ACCENT: 0xFFB300,
  DANGER: 0xFF1744,
  SUCCESS: 0x00E676,
};

const ELEMENT_DEFS = {
  fire:       { color: COLORS.FIRE,       symbol: '\u2666', tier: 0 },
  water:      { color: COLORS.WATER,      symbol: '\u25CF', tier: 0 },
  earth:      { color: COLORS.EARTH,      symbol: '\u25B2', tier: 0 },
  air:        { color: COLORS.AIR,        symbol: '\u223F', tier: 0 },
  lightning:  { color: COLORS.LIGHTNING,   symbol: '\u26A1', tier: 0 },
  magma:      { color: COLORS.MAGMA,      symbol: '\u2600', tier: 1 },
  ice:        { color: COLORS.ICE,        symbol: '\u2744', tier: 1 },
  storm:      { color: COLORS.STORM,      symbol: '\u2608', tier: 1 },
  mud:        { color: COLORS.MUD,        symbol: '\u2588', tier: 1 },
  steam:      { color: COLORS.STEAM,      symbol: '\u2601', tier: 1 },
  obsidian:   { color: COLORS.OBSIDIAN,   symbol: '\u25C6', tier: 2 },
  blizzard:   { color: COLORS.BLIZZARD,   symbol: '\u2746', tier: 2 },
  tornado:    { color: COLORS.TORNADO,    symbol: '\u00A7', tier: 2 },
  philosopher:{ color: COLORS.PHILOSOPHER, symbol: '\u2605', tier: 3 },
  void:       { color: COLORS.VOID,       symbol: '\u2620', tier: -1 },
  pure:       { color: COLORS.PURE_CRYSTAL,symbol: '\u25C7', tier: -2 },
};

const ALCHEMY_TABLE = [
  { inputA: 'fire',    inputB: 'earth',    result: 'magma',   tier: 1 },
  { inputA: 'water',   inputB: 'air',      result: 'ice',     tier: 1 },
  { inputA: 'fire',    inputB: 'air',      result: 'storm',   tier: 1 },
  { inputA: 'earth',   inputB: 'water',    result: 'mud',     tier: 1 },
  { inputA: 'fire',    inputB: 'water',    result: 'steam',   tier: 1 },
  { inputA: 'lightning', inputB: 'water',  result: 'storm',   tier: 1 },
  { inputA: 'lightning', inputB: 'earth',  result: 'magma',   tier: 1 },
  { inputA: 'magma',   inputB: 'ice',      result: 'obsidian', tier: 2 },
  { inputA: 'storm',   inputB: 'mud',      result: 'tornado', tier: 2 },
  { inputA: 'ice',     inputB: 'storm',    result: 'blizzard', tier: 2 },
  { inputA: 'obsidian', inputB: 'blizzard', result: 'philosopher', tier: 3 },
  { inputA: 'obsidian', inputB: 'tornado', result: 'philosopher', tier: 3 },
];

const SCORE_VALUES = {
  MERGE_TIER: [50, 100, 200, 500],
  CLEANSE_PER_TILE: 30,
  MASS_CLEANSE_BONUS: 200,
  MASS_CLEANSE_THRESHOLD: 5,
  BOARD_SURVIVAL_BONUS: 10,
  STAGE_CLEAR_BONUS: 500,
};

function lookupMerge(a, b) {
  if (a === 'pure' && b === 'void') return '__cleanse__';
  if (a === 'void' && b === 'pure') return '__cleanse__';
  for (let i = 0; i < ALCHEMY_TABLE.length; i++) {
    const r = ALCHEMY_TABLE[i];
    if ((r.inputA === a && r.inputB === b) || (r.inputA === b && r.inputB === a)) {
      return r.result;
    }
  }
  return null;
}

const SVG_TILE = (color) => `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="52" height="52" rx="8" ry="8" fill="${color}" stroke="#3D2E6B" stroke-width="2"/></svg>`;

const SVG_VOID = `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="52" height="52" rx="8" ry="8" fill="#0A0A0A" stroke="#8B00FF" stroke-width="2"/><circle cx="20" cy="22" r="5" fill="#8B00FF" opacity="0.6"/><circle cx="36" cy="22" r="5" fill="#8B00FF" opacity="0.6"/><path d="M16 38 C22 32, 34 32, 40 38" fill="none" stroke="#8B00FF" stroke-width="2" opacity="0.6"/></svg>`;

const SVG_PURE = `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="52" height="52" rx="8" ry="8" fill="#F0F0FF" stroke="#FFD700" stroke-width="3"/><polygon points="28,8 36,20 36,36 28,48 20,36 20,20" fill="#E8EAF6" stroke="#B388FF" stroke-width="1.5"/></svg>`;

const SVG_EMPTY = `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="52" height="52" rx="8" ry="8" fill="#1A1435" stroke="#3D2E6B" stroke-width="1.5"/></svg>`;

const TILE_COLORS_HEX = {
  fire: '#FF6B2B', water: '#2B9DFF', earth: '#4CAF50', air: '#80DEEA',
  lightning: '#FFD740', magma: '#E64A19', ice: '#B3E5FC', storm: '#9C27B0',
  mud: '#795548', steam: '#CFD8DC', obsidian: '#1A0033', blizzard: '#E8F5FE',
  tornado: '#006064', philosopher: '#FFD700',
};
