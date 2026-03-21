// config.js - Game constants, colors, difficulty, SVG assets

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 760;

const COLORS = {
    BG: '#050A0F',
    GRID_BG: '#0A1628',
    CIRCUIT: '#0D2137',
    TILE_BASE: '#0E2240',
    TILE_INNER: '#071624',
    CYAN: '#00E5FF',
    GREEN: '#39FF14',
    ORANGE: '#FF6B00',
    PURPLE: '#B24BF3',
    RED: '#FF1744',
    FLASH_WHITE: '#E0FFFF',
    ERROR_RED: '#FF1744',
    TIMER_FULL: '#00E5FF',
    TIMER_CRITICAL: '#FF1744',
    TIMER_BG: '#112233',
    HUD_TEXT: '#E0F7FA',
    HUD_ACCENT: '#00E5FF',
    STREAK_HOT: '#FF9100',
    STREAK_CHAIN: '#FF6B00',
    STREAK_OVERLOAD: '#FF3D00',
    STREAK_GOD: '#FFD700',
    STAGE_CLEAR: '#CCFF00',
    GAME_OVER: '#FF1744',
    POWER_GOLD: '#FFD700',
    MENU_BG: '#070D17',
    BTN_FILL: '#0D2F5A',
    BTN_BORDER: '#00E5FF',
    BTN_TEXT: '#E0F7FA'
};

const CATEGORY_COLORS = [COLORS.CYAN, COLORS.GREEN, COLORS.ORANGE, COLORS.PURPLE, COLORS.RED];
const CATEGORY_NAMES = ['cyan', 'green', 'orange', 'purple', 'red'];

const TILE_SIZES = { 3: 80, 4: 72, 5: 60 };
const TILE_GAP = 4;

const STREAK_THRESHOLDS = [3, 6, 10, 15];
const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 3.0, 5.0];
const STREAK_NAMES = ['', 'HOT', 'CHAIN', 'OVERLOAD', 'GOD MODE'];
const STREAK_COLORS = ['#00E5FF', '#FF9100', '#FF6B00', '#FF3D00', '#FFD700'];

const SCORE_VALUES = {
    correctTap: 100,
    sameColorBonus: 50,
    stageClear: 500,
    categoryBonus: 1000,
    perfectStage: 1000,
    bombActivate: 200,
    bombPerTile: 50,
    challengeBonus: 2000
};

const MODIFIER_TYPES = ['MIRROR', 'ROTATION', 'GHOST', 'DECOY', 'DRIFT'];

const STAGE_RULES = ['NORMAL', 'REVERSE', 'ODD_ONLY', 'EVEN_ONLY', 'GAPS', 'REVERSE_GAPS', 'ODD_REVERSE', 'EVEN_GAPS'];

const RULE_COLORS = {
    NORMAL: { border: '#00E5FF', bg: '#050A0F', label: '' },
    REVERSE: { border: '#FF6B00', bg: '#1A0800', label: 'REVERSE' },
    ODD_ONLY: { border: '#39FF14', bg: '#001A00', label: 'ODD ONLY' },
    EVEN_ONLY: { border: '#B24BF3', bg: '#0D001A', label: 'EVEN ONLY' },
    GAPS: { border: '#FF1744', bg: '#1A0005', label: 'GAPS' },
    REVERSE_GAPS: { border: '#FF6B00', bg: '#1A0005', label: 'REVERSE + GAPS' },
    ODD_REVERSE: { border: '#39FF14', bg: '#1A0800', label: 'ODD REVERSE' },
    EVEN_GAPS: { border: '#B24BF3', bg: '#1A0005', label: 'EVEN + GAPS' }
};

const RULE_INTRO_STAGES = {
    NORMAL: 1, REVERSE: 8, GAPS: 12, ODD_ONLY: 15, EVEN_ONLY: 18,
    REVERSE_GAPS: 25, ODD_REVERSE: 30, EVEN_GAPS: 35
};

const FONT_FAMILY = "'Courier New', Courier, monospace";

// Difficulty table: returns params for a given stage range
function getDifficultyParams(stage) {
    if (stage < 5) return { gridSize: 3, timeBudget: 10000, drainRate: 1000, refill: 600, wrongPenalty: 1500, colorCount: 1, powerCount: 0, modifierCount: 0 };
    if (stage < 13) return { gridSize: 4, timeBudget: 9000, drainRate: 1000, refill: 500, wrongPenalty: 1500, colorCount: Math.min(3, 2 + Math.floor((stage - 5) / 3)), powerCount: stage >= 10 ? Math.min(2, 1 + Math.floor((stage - 10) / 3)) : 0, modifierCount: 0 };
    if (stage < 26) return { gridSize: 5, timeBudget: 8000, drainRate: 1125, refill: 400, wrongPenalty: 1500, colorCount: Math.min(5, 3 + Math.floor((stage - 13) / 3)), powerCount: Math.min(2, 1 + Math.floor((stage - 13) / 5)), modifierCount: 1 };
    if (stage < 51) return { gridSize: 5, timeBudget: 7500, drainRate: 1333, refill: 350, wrongPenalty: 1750, colorCount: 5, powerCount: Math.min(3, 2 + Math.floor((stage - 26) / 10)), modifierCount: Math.min(2, 1 + Math.floor((stage - 26) / 12)) };
    return { gridSize: 5, timeBudget: 7000, drainRate: 1500, refill: 300, wrongPenalty: 2000, colorCount: 5, powerCount: 3, modifierCount: Math.min(3, 2 + Math.floor((stage - 51) / 10)) };
}

// SVG tile templates - color is parameterized
function makeTileSVG(borderColor) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#0E2240" stroke="${borderColor}" stroke-width="2"/>
  <rect x="0" y="0" width="8" height="2" fill="${borderColor}" rx="1"/>
  <rect x="0" y="0" width="2" height="8" fill="${borderColor}" rx="1"/>
  <rect x="52" y="0" width="8" height="2" fill="${borderColor}" rx="1"/>
  <rect x="58" y="0" width="2" height="8" fill="${borderColor}" rx="1"/>
  <rect x="0" y="58" width="8" height="2" fill="${borderColor}" rx="1"/>
  <rect x="0" y="52" width="2" height="8" fill="${borderColor}" rx="1"/>
  <rect x="52" y="58" width="8" height="2" fill="${borderColor}" rx="1"/>
  <rect x="58" y="52" width="2" height="8" fill="${borderColor}" rx="1"/>
  <rect x="8" y="8" width="44" height="44" rx="2" fill="#071624" opacity="0.8"/>
</svg>`;
}

const SVG_STRINGS = {
    tileCyan: makeTileSVG(COLORS.CYAN),
    tileGreen: makeTileSVG(COLORS.GREEN),
    tileOrange: makeTileSVG(COLORS.ORANGE),
    tilePurple: makeTileSVG(COLORS.PURPLE),
    tileRed: makeTileSVG(COLORS.RED),
    tilePower: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#1A1400" stroke="#FFD700" stroke-width="2.5"/>
  <rect x="0" y="0" width="10" height="2" fill="#FFD700" rx="1"/>
  <rect x="0" y="0" width="2" height="10" fill="#FFD700" rx="1"/>
  <rect x="50" y="0" width="10" height="2" fill="#FFD700" rx="1"/>
  <rect x="58" y="0" width="2" height="10" fill="#FFD700" rx="1"/>
  <rect x="0" y="58" width="10" height="2" fill="#FFD700" rx="1"/>
  <rect x="0" y="50" width="2" height="10" fill="#FFD700" rx="1"/>
  <rect x="50" y="58" width="10" height="2" fill="#FFD700" rx="1"/>
  <rect x="58" y="50" width="2" height="10" fill="#FFD700" rx="1"/>
  <rect x="8" y="8" width="44" height="44" rx="2" fill="#1A1000" opacity="0.9"/>
</svg>`,
    tileFaceDown: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#0E2240" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>
  <line x1="10" y1="20" x2="50" y2="20" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>
  <line x1="10" y1="28" x2="50" y2="28" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>
  <line x1="10" y1="36" x2="50" y2="36" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>
  <line x1="10" y1="44" x2="50" y2="44" stroke="#00E5FF" stroke-width="1" opacity="0.4"/>
  <text x="30" y="38" text-anchor="middle" font-family="monospace" font-size="20" fill="#00E5FF" opacity="0.5">?</text>
</svg>`,
    particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#00E5FF" rx="1"/></svg>`
};

const TEXTURE_KEYS = ['tileCyan', 'tileGreen', 'tileOrange', 'tilePurple', 'tileRed', 'tilePower', 'tileFaceDown', 'particle'];
const TILE_TEXTURE_BY_COLOR = ['tileCyan', 'tileGreen', 'tileOrange', 'tilePurple', 'tileRed'];

const POWER_TYPES = ['bomb', 'freeze', 'reveal'];
const POWER_WEIGHTS = [0.4, 0.4, 0.2];
const POWER_ICONS = { bomb: '\u26A1', freeze: '\u2744', reveal: '\uD83D\uDC41' };
