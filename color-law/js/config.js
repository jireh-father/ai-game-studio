// config.js - Game constants, law definitions, colors, difficulty tables
const GAME_WIDTH = 360;
const GAME_HEIGHT = 780;

const COLORS = {
  BG: '#1A1A2E', ZONE_A: '#E84855', ZONE_B: '#4B8BBE', ZONE_C: '#5FAD56',
  ZONE_D: '#9B59B6', ZONE_E: '#E67E22', ZONE_BORDER: '#FFFFFF',
  STAGING_BG: '#2D2D44', LAW_TEXT: '#FFD700', NEXT_LAW: '#FFD70080',
  EXPLOSION: '#FF6B35', SUCCESS: '#00E5FF', HUD: '#FFFFFF',
  WARNING: '#FF0000', PENALTY: '#DC143C', OUTLINE: '#111111'
};

const SHAPE_COLORS = [
  { name: 'Red', hex: '#FF4444', unlock: 1 },
  { name: 'Blue', hex: '#4488FF', unlock: 1 },
  { name: 'Green', hex: '#44DD44', unlock: 1 },
  { name: 'Yellow', hex: '#FFCC00', unlock: 7 }
];

const SHAPE_TYPES = [
  { name: 'Circle', unlock: 1 },
  { name: 'Square', unlock: 4 },
  { name: 'Triangle', unlock: 4 }
];

const SIZES = [
  { name: 'Big', scale: 1.5, unlock: 11 },
  { name: 'Small', scale: 0.7, unlock: 11 }
];

const PATTERNS = [
  { name: 'Solid', unlock: 1 },
  { name: 'Striped', unlock: 16 }
];

const LAW_TYPES = { COLOR: 0, SHAPE: 1, SIZE: 2, PATTERN: 3, COMPOUND: 4 };

const SCORE = {
  CORRECT: 10, CORRECT_BONUS: 5, SURVIVE: 25, SURVIVE_BONUS: 10,
  PERFECT: 100, WRONG: -5
};

const COMBO_TIERS = [
  { at: 5, mult: 1.5 }, { at: 10, mult: 2.0 }, { at: 15, mult: 2.5 }
];

const MAX_EXPLOSIONS = 5;
const INACTIVITY_MS = 8000;
const INACTIVITY_FAST_SPAWN = 500;
const MAX_STAGING_DEFAULT = 4;
const SWIPE_THRESHOLD = 40;
const TAP_THRESHOLD = 15;
const LAW_WARN_DURATION = 2000;

const ZONE_NAMES_3 = ['LEFT', 'CENTER', 'RIGHT'];
const ZONE_NAMES_4 = ['FAR LEFT', 'LEFT', 'RIGHT', 'FAR RIGHT'];
const ZONE_NAMES_5 = ['A', 'B', 'C', 'D', 'E'];

const ZONE_COLORS = [COLORS.ZONE_A, COLORS.ZONE_B, COLORS.ZONE_C, COLORS.ZONE_D, COLORS.ZONE_E];

function makeSVG(type, color, striped) {
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">';
  if (type === 'Circle') {
    svg += `<circle cx="25" cy="25" r="22" fill="${color}" stroke="#111111" stroke-width="3"/>`;
  } else if (type === 'Square') {
    svg += `<rect x="3" y="3" width="44" height="44" rx="4" fill="${color}" stroke="#111111" stroke-width="3"/>`;
  } else {
    svg += `<polygon points="25,3 47,47 3,47" fill="${color}" stroke="#111111" stroke-width="3"/>`;
  }
  if (striped) {
    svg += '<line x1="8" y1="15" x2="42" y2="15" stroke="#FFFFFF" stroke-width="2" opacity="0.4"/>';
    svg += '<line x1="8" y1="25" x2="42" y2="25" stroke="#FFFFFF" stroke-width="2" opacity="0.4"/>';
    svg += '<line x1="8" y1="35" x2="42" y2="35" stroke="#FFFFFF" stroke-width="2" opacity="0.4"/>';
  }
  svg += '</svg>';
  return svg;
}

const GAVEL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect x="15" y="2" width="10" height="22" rx="2" fill="#8B7355" stroke="#111" stroke-width="2"/>
  <rect x="5" y="22" width="30" height="8" rx="3" fill="#A0845C" stroke="#111" stroke-width="2"/>
  <rect x="12" y="32" width="16" height="6" rx="2" fill="#666" stroke="#111" stroke-width="1"/>
</svg>`;

const PARTICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>`;

const SKULL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <circle cx="12" cy="10" r="9" fill="#444" stroke="#111" stroke-width="1.5"/>
  <circle cx="8" cy="9" r="2.5" fill="#111"/><circle cx="16" cy="9" r="2.5" fill="#111"/>
  <rect x="10" y="14" width="4" height="4" rx="1" fill="#111"/>
  <rect x="8" y="19" width="8" height="3" rx="1" fill="#444" stroke="#111" stroke-width="1"/>
</svg>`;

const SKULL_ACTIVE_SVG = SKULL_SVG.replace(/fill="#444"/g, 'fill="#DC143C"');

// Global game state (must be in config.js so all scripts can access it)
const GameState = {
  score: 0, highScore: 0, explosions: 0, combo: 0,
  bestCombo: 0, stage: 1, gamesPlayed: 0
};
