// config.js - Constants, colors, difficulty tables, SVG strings
const COLORS = {
    BALL: 0x00F5FF,
    BALL_HEX: '#00F5FF',
    WALL: 0x1E3A5F,
    WALL_GLOW: 0x4A9EFF,
    BG: 0x0A0E1A,
    BG_HEX: '#0A0E1A',
    GRID_LINE: 0x152238,
    SPIKE: 0xFF1493,
    SPIKE_GLOW: 0xFF3366,
    GEM: 0xFFD700,
    GEM_HEX: '#FFD700',
    GEM_GLOW: 0xFFEA80,
    EXIT: 0x39FF14,
    EXIT_HEX: '#39FF14',
    PHASE_ACTIVE: 0x9B30FF,
    PHASE_FADING: 0x4A1570,
    TIMER_FULL: 0x39FF14,
    TIMER_MID: 0xFFD700,
    TIMER_LOW: 0xFF1493,
    UI_TEXT: '#FFFFFF',
    UI_SHADOW: '#00F5FF',
    GHOST_TRAIL: 0x00F5FF,
    BOOST_AURA: 0x00FFFF,
    INACTIVITY: 0xFF0000,
    DANGER_HEX: '#FF1493'
};

const SCORING = {
    EXIT: 100, EXIT_STAR_BONUS: 50, GEM: 50, GEM_BOOSTED_MULT: 2,
    GHOST_BOOST: 25, GHOST_CHAIN_INC: 10, UNDER_PAR: 75,
    TIME_BONUS: 1, PHASE_DODGE: 30, PERFECT: 200
};

const GAME_CONFIG = {
    SWIPE_MIN_DIST: 40, SWIPE_MAX_TIME: 300,
    INACTIVITY_TIMEOUT: 10000, INACTIVITY_SPEED: 20,
    GHOST_TRAIL_DURATION: 8000, BOOST_DURATION: 500, BOOST_MULT: 1.8,
    DEATH_ANIM_MS: 500, DEATH_TOTAL_MS: 1500,
    STAR_DISPLAY_MS: 1500, MAX_DEATHS: 3,
    GAME_WIDTH: 390, GAME_HEIGHT: 700, HUD_HEIGHT: 48, TIMER_HEIGHT: 8
};

const DIFFICULTY = [
    // [gridSize, timer, spikes, phasingWalls, phaseCycle, movingSpikes, mSpikeSpeed, extraWallPct, ballSpeed, boostMult]
    [7, 30, 0, 0, 0,    0, 0,  25, 400, 1.8], // maze 1-3
    [7, 30, 2, 0, 0,    0, 0,  20, 400, 1.8], // maze 4-7
    [7, 25, 3, 2, 3000, 0, 0,  18, 450, 1.8], // maze 8-12
    [7, 25, 3, 3, 2500, 1, 40, 15, 450, 2.0], // maze 13-20
    [9, 20, 4, 4, 2000, 2, 50, 15, 500, 2.0], // maze 21-30
    [9, 18, 4, 5, 1500, 2, 60, 12, 500, 2.2], // maze 31-50
    [11,15, 5, 5, 1200, 3, 70, 10, 550, 2.2]  // maze 51+
];

function getDifficultyIndex(maze) {
    if (maze <= 3) return 0;
    if (maze <= 7) return 1;
    if (maze <= 12) return 2;
    if (maze <= 20) return 3;
    if (maze <= 30) return 4;
    if (maze <= 50) return 5;
    return 6;
}

function getDifficultyParams(maze) {
    const d = DIFFICULTY[getDifficultyIndex(maze)];
    const isRest = maze > 1 && maze % 10 === 0;
    return {
        gridSize: d[0], timer: d[1] + (isRest ? 5 : 0),
        spikes: Math.max(0, d[2] - (isRest ? 1 : 0)),
        phasingWalls: d[3], phaseCycle: d[4],
        movingSpikes: d[5], mSpikeSpeed: d[6],
        extraWallPct: d[7], ballSpeed: d[8], boostMult: d[9],
        isRest: isRest, gemCount: maze <= 3 ? 2 : 3
    };
}

const SVG_STRINGS = {
    BALL: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="none" stroke="#00F5FF" stroke-width="1" opacity="0.4"/><circle cx="12" cy="12" r="8" fill="#00F5FF"/><circle cx="10" cy="10" r="3" fill="#FFFFFF" opacity="0.6"/></svg>',
    GEM: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><polygon points="10,1 19,10 10,19 1,10" fill="#FFD700" stroke="#FFEA80" stroke-width="1"/><polygon points="10,5 15,10 10,15 5,10" fill="#FFEA80" opacity="0.5"/></svg>',
    SPIKE: '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><polygon points="10,0 12,8 20,10 12,12 10,20 8,12 0,10 8,8" fill="#FF1493" stroke="#FF3366" stroke-width="0.5"/><circle cx="10" cy="10" r="2" fill="#FF3366" opacity="0.8"/></svg>',
    EXIT: '<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="12" fill="none" stroke="#39FF14" stroke-width="2" opacity="0.6"/><circle cx="14" cy="14" r="8" fill="none" stroke="#39FF14" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="14" cy="14" r="4" fill="#39FF14" opacity="0.5"/></svg>',
    STAR: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#FFD700" stroke="#FFEA80" stroke-width="0.5"/></svg>',
    STAR_EMPTY: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.4"/></svg>'
};

const BALL_SKINS = [
    { name: 'Default', stars: 0, color: '#00F5FF' },
    { name: 'Pulse', stars: 15, color: '#FF8C00' },
    { name: 'Plasma', stars: 40, color: '#39FF14' },
    { name: 'Nova', stars: 75, color: '#FF69B4' },
    { name: 'Void', stars: 120, color: '#9B30FF' },
    { name: 'Prismatic', stars: 200, color: '#FFFFFF' }
];
