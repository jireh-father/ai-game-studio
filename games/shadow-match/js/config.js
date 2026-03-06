// Shadow Match - Configuration
const COLORS = {
    SKY_TOP: '#F4A460',
    SKY_BOTTOM: '#E8651A',
    SKY_DARK: '#1A0A2E',
    SHADOW: '#2C2137',
    SHADOW_GRID: '#9B8EC4',
    PIECE_FILL: '#FFB347',
    PIECE_PLACED: '#FF6B6B',
    PIECE_OUTLINE: '#5C3A21',
    STREAK_FIRE: '#FFD700',
    HUD_TEXT: '#FFF8E7',
    HUD_BG: '#1A0A2E',
    DANGER: '#FF3B3B',
    SUCCESS: '#2ECC71',
    DRIFT_BAR_BG: '#333333',
    DRIFT_BAR_FILL: '#FF8C42',
    PIECE_HIGHLIGHT: '#FFE0A0'
};

const COLORS_INT = {
    SKY_TOP: 0xF4A460,
    SKY_BOTTOM: 0xE8651A,
    SKY_DARK: 0x1A0A2E,
    SHADOW: 0x2C2137,
    SHADOW_GRID: 0x9B8EC4,
    PIECE_FILL: 0xFFB347,
    PIECE_PLACED: 0xFF6B6B,
    PIECE_OUTLINE: 0x5C3A21,
    STREAK_FIRE: 0xFFD700,
    HUD_TEXT: 0xFFF8E7,
    HUD_BG: 0x1A0A2E,
    DANGER: 0xFF3B3B,
    SUCCESS: 0x2ECC71,
    DRIFT_BAR_BG: 0x333333,
    DRIFT_BAR_FILL: 0xFF8C42
};

const GRID = {
    CELL_SIZE: 40,
    COLS: 8,
    ROWS: 8,
    OFFSET_X: 54,
    OFFSET_Y: 100
};

const SCORING = {
    PIECE_PLACED: 50,
    SHADOW_COMPLETE: 200,
    PER_PIECE_BONUS: 30,
    PERFECT_BONUS: 150,
    SPEED_BONUS: 100,
    REST_BONUS: 500,
    BOSS_BONUS: 1000
};

const TIMING = {
    BOUNCE_DURATION: 200,
    SNAP_DURATION: 80,
    SHADOW_LURCH: 60,
    INACTIVITY_THRESHOLD: 10000,
    INACTIVITY_ACCEL: 8,
    ROTATE_DURATION: 120,
    DEATH_DELAY: 600,
    STAGE_DELAY: 500
};

const STREAK_CAP = 10;
const REST_STAGE_INTERVAL = 10;
const BOSS_STAGE_INTERVAL = 15;
const COLLECTION_TOTAL = 30;
const TRAY_Y = 540;
const TRAY_HEIGHT = 200;
const DRIFT_BAR_Y = 488;
const SHADOW_ESCAPE_X = 428;
const DRAG_THRESHOLD = 8;
const SNAP_MAGNET = 35;

const PIECE_DEFS = [
    // 3-cell (trominoes)
    [[0,0],[1,0],[2,0]],           // 0: I-3
    [[0,0],[1,0],[1,1]],           // 1: L-3
    // 4-cell (tetrominoes)
    [[0,0],[1,0],[2,0],[3,0]],     // 2: I-4
    [[0,0],[1,0],[0,1],[1,1]],     // 3: O-4
    [[0,0],[1,0],[2,0],[1,1]],     // 4: T-4
    [[1,0],[2,0],[0,1],[1,1]],     // 5: S-4
    [[0,0],[1,0],[1,1],[2,1]],     // 6: Z-4
    [[0,0],[1,0],[2,0],[2,1]],     // 7: L-4
    [[0,0],[1,0],[2,0],[0,1]],     // 8: J-4
    // 5-cell (pentominoes)
    [[1,0],[0,1],[1,1],[2,1],[1,2]],   // 9: plus/X
    [[0,0],[1,0],[2,0],[3,0],[4,0]],   // 10: I-5
    [[0,0],[1,0],[2,0],[3,0],[3,1]],   // 11: L-5
    [[0,0],[0,1],[1,1],[1,2],[2,2]],   // 12: N-5
    [[0,0],[1,0],[0,1],[1,1],[0,2]],   // 13: P-5
    [[0,0],[1,0],[2,0],[1,1],[1,2]],   // 14: T-5
    [[0,0],[2,0],[0,1],[1,1],[2,1]],   // 15: U-5
    [[0,0],[0,1],[0,2],[1,2],[2,2]],   // 16: V-5
    [[0,0],[0,1],[1,1],[1,2],[2,2]],   // 17: W-5
    [[0,0],[1,0],[2,0],[3,0],[1,1]],   // 18: Y-5
    [[0,0],[1,0],[1,1],[1,2],[2,2]],   // 19: Z-5 (variant)
    [[0,0],[1,0],[2,0],[0,1],[0,2]],   // 20: J-5
    [[0,0],[1,0],[1,1],[2,1],[2,2]],   // 21: S-5
    [[0,0],[0,1],[1,1],[2,1],[2,0]],   // 22: C-5
    [[0,0],[1,0],[2,0],[2,1],[2,2]],   // 23: big-L
    [[1,0],[0,1],[1,1],[2,1],[0,2]],   // 24: F-5
    [[0,0],[1,0],[1,1],[0,2],[1,2]],   // 25
    [[0,0],[0,1],[1,1],[2,1],[2,2]],   // 26
    [[1,0],[2,0],[0,1],[1,1],[0,2]],   // 27
    [[0,0],[1,0],[0,1],[0,2],[1,2]],   // 28
    [[0,0],[1,0],[2,0],[0,1],[2,1]]    // 29
];

const SVG_BG = `<svg xmlns="http://www.w3.org/2000/svg" width="428" height="760" viewBox="0 0 428 760"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${COLORS.SKY_TOP}"/><stop offset="60%" stop-color="${COLORS.SKY_BOTTOM}"/><stop offset="100%" stop-color="${COLORS.SKY_DARK}"/></linearGradient></defs><rect width="428" height="760" fill="url(#sky)"/><circle cx="214" cy="60" r="30" fill="${COLORS.STREAK_FIRE}" opacity="0.4"/></svg>`;

const SVG_TRAY = `<svg xmlns="http://www.w3.org/2000/svg" width="428" height="200" viewBox="0 0 428 200"><rect width="428" height="200" rx="16" fill="${COLORS.HUD_BG}" opacity="0.8"/><rect x="2" y="2" width="424" height="196" rx="14" fill="none" stroke="${COLORS.SHADOW_GRID}" stroke-width="1" opacity="0.3"/></svg>`;

const SVG_FLAME = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path d="M12,0 C12,0 4,10 4,18 C4,24 8,28 12,32 C16,28 20,24 20,18 C20,10 12,0 12,0Z" fill="${COLORS.STREAK_FIRE}" stroke="${COLORS.DRIFT_BAR_FILL}" stroke-width="1"/><path d="M12,8 C12,8 8,14 8,20 C8,24 10,26 12,28 C14,26 16,24 16,20 C16,14 12,8 12,8Z" fill="${COLORS.PIECE_PLACED}" opacity="0.7"/></svg>`;

function getDifficultyParams(stage) {
    const driftSpeed = Math.min(0.3 + (stage - 1) * 0.04, 1.5);
    const pieceCount = Math.min(3 + Math.floor((stage - 1) / 3), 7);
    const distractorCount = stage < 16 ? 0 : (stage < 31 ? 1 : 2);
    const cellsPerPiece = stage < 6 ? 3 : (stage < 16 ? 4 : 4.5);
    return { driftSpeed, pieceCount, distractorCount, cellsPerPiece };
}
