// Sum Sniper - Configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const MAX_STRIKES = 3;

const COLORS = {
    BG: '#0D1B2A',
    CELL: '#1A2B3C',
    CELL_BORDER: '#2E4A6B',
    NUM_NORMAL: '#E8F4FD',
    NUM_NEGATIVE: '#FF6B6B',
    NUM_MULTIPLIER: '#FFD700',
    SELECTED: '#00D4FF',
    ADJACENT: '#004455',
    TIMER_FULL: '#00D4FF',
    TIMER_EMPTY: '#FF3333',
    TARGET_BG: '#1A1040',
    TARGET_NUM: '#FFFFFF',
    STRIKE_ACTIVE: '#FF3333',
    STRIKE_EMPTY: '#2A2A2A',
    EXPLOSION_1: '#FF8C00',
    EXPLOSION_2: '#FFE066',
    COMBO: '#FFEE00',
    MISS_FLASH: '#FF0000',
    UI_BTN: '#4A1FA8',
    UI_TEXT: '#FFFFFF',
    SCORE_GOLD: '#FFD700'
};

const GRID = { COLS: 5, ROWS: 5, CELL_SIZE: 60, GAP: 4 };

const SCORE = {
    BASE: 100,
    CHAIN_MULT: [1.0, 1.0, 1.0, 1.5, 2.4],
    CHAIN_5_PLUS: 1.5,
    SPEED_BONUS_FAST: 75,
    SPEED_BONUS_MED: 30,
    COMBO_BONUS: [0, 0, 50, 100, 150],
    NEGATIVE_BONUS: 25
};

const DIFFICULTY = [
    { minStage: 1,  maxStage: 5,  timerMs: 8000, numLow: 1,  numHigh: 9,  minChain: 1, maxChain: 3, refreshCount: 25 },
    { minStage: 6,  maxStage: 10, timerMs: 7600, numLow: 1,  numHigh: 12, minChain: 2, maxChain: 4, refreshCount: 25 },
    { minStage: 11, maxStage: 15, timerMs: 7200, numLow: -3, numHigh: 15, minChain: 2, maxChain: 4, refreshCount: 25 },
    { minStage: 16, maxStage: 25, timerMs: 7000, numLow: -5, numHigh: 18, minChain: 2, maxChain: 5, refreshCount: 18 },
    { minStage: 26, maxStage: 40, timerMs: 6000, numLow: -5, numHigh: 20, minChain: 3, maxChain: 5, refreshCount: 15, multiplierTiles: 1 },
    { minStage: 41, maxStage: 60, timerMs: 5500, numLow: -5, numHigh: 20, minChain: 3, maxChain: 6, refreshCount: 12, multiplierTiles: 1, lockedTiles: 2 },
    { minStage: 61, maxStage: 9999, timerMs: 5000, numLow: -5, numHigh: 20, minChain: 3, maxChain: 6, refreshCount: 12, multiplierTiles: 2, lockedTiles: 3 }
];

function getDifficulty(stage) {
    for (let i = DIFFICULTY.length - 1; i >= 0; i--) {
        if (stage >= DIFFICULTY[i].minStage) return DIFFICULTY[i];
    }
    return DIFFICULTY[0];
}

function getTimerMs(stage) {
    return Math.max(5000, 8000 - Math.floor(stage / 5) * 200);
}

const SVG_STRINGS = {
    cell: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='60' height='60' rx='8' ry='8' fill='${COLORS.CELL}' stroke='${COLORS.CELL_BORDER}' stroke-width='2'/></svg>`,
    cellSelected: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='60' height='60' rx='8' ry='8' fill='#003344' stroke='${COLORS.SELECTED}' stroke-width='3'/><rect x='4' y='4' width='52' height='52' rx='6' ry='6' fill='none' stroke='${COLORS.SELECTED}' stroke-width='1' opacity='0.4'/></svg>`,
    cellAdjacent: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='60' height='60' rx='8' ry='8' fill='#002233' stroke='${COLORS.ADJACENT}' stroke-width='2' stroke-dasharray='4,2'/></svg>`,
    cellMultiplier: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='60' height='60' rx='8' ry='8' fill='#2A1800' stroke='${COLORS.NUM_MULTIPLIER}' stroke-width='2'/><polygon points='30,6 34,24 52,24 38,36 43,54 30,44 17,54 22,36 8,24 26,24' fill='${COLORS.NUM_MULTIPLIER}' opacity='0.3'/></svg>`,
    cellLocked: `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='60' height='60' rx='8' ry='8' fill='#111111' stroke='#444444' stroke-width='2'/><rect x='18' y='26' width='24' height='20' rx='3' fill='#555555'/><path d='M22,26 L22,20 Q30,12 38,20 L38,26' fill='none' stroke='#555555' stroke-width='3'/></svg>`,
    strikeActive: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='14' cy='14' r='12' fill='none' stroke='${COLORS.STRIKE_ACTIVE}' stroke-width='2'/><line x1='14' y1='2' x2='14' y2='26' stroke='${COLORS.STRIKE_ACTIVE}' stroke-width='2'/><line x1='2' y1='14' x2='26' y2='14' stroke='${COLORS.STRIKE_ACTIVE}' stroke-width='2'/><circle cx='14' cy='14' r='4' fill='${COLORS.STRIKE_ACTIVE}'/></svg>`,
    strikeEmpty: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='14' cy='14' r='12' fill='none' stroke='${COLORS.STRIKE_EMPTY}' stroke-width='2'/><line x1='14' y1='2' x2='14' y2='26' stroke='${COLORS.STRIKE_EMPTY}' stroke-width='2'/><line x1='2' y1='14' x2='26' y2='14' stroke='${COLORS.STRIKE_EMPTY}' stroke-width='2'/></svg>`,
    particle: `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><circle cx='6' cy='6' r='6' fill='${COLORS.EXPLOSION_1}'/></svg>`,
    particleGold: `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><circle cx='6' cy='6' r='6' fill='${COLORS.EXPLOSION_2}'/></svg>`
};
