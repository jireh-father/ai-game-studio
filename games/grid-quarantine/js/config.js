// ============================================================
// config.js - Constants, colors, SVGs, difficulty tables
// ============================================================

const COLORS = {
    BACKGROUND: 0x0A0E1A,
    BACKGROUND_HEX: '#0A0E1A',
    GRID_LINE: 0x1E2A3A,
    EMPTY_CELL: 0x141E2E,
    EMPTY_HOVER: 0x2A3A4E,
    WALL: 0x00E5FF,
    WALL_HEX: '#00E5FF',
    WALL_GLOW: 0x00E5FF,
    INFECTION_BASIC: 0x39FF14,
    INFECTION_DIAGONAL: 0xFFD600,
    INFECTION_JUMPER: 0xB388FF,
    INFECTION_SPLITTER: 0xFF1744,
    INFECTION_ACCELERATOR: 0xFF6D00,
    INFECTION_DORMANT: 0x4E6E58,
    DANGER: 0xFF1744,
    HUD_TEXT: 0xFFFFFF,
    HUD_SECONDARY: 0xB0BEC5,
    SUCCESS: 0x00E676,
    LIFE_ACTIVE: 0xFF1744,
    LIFE_EMPTY: 0x4A1A1A,
    SUPPLY_FILL: 0x00E5FF,
    SUPPLY_EMPTY: 0x263238,
    SUPPLY_LOW: 0xFF6D00,
    UI_BUTTON: 0x00E5FF,
    UI_BUTTON_HEX: '#00E5FF',
    OVERLAY_BG: 0x000000,
    PERFECT_GOLD: 0xFFD600,
    SUCCESS_HEX: '#00E676',
    DANGER_HEX: '#FF1744',
};

const GRID = {
    SIZES: [6, 8, 10, 12],
    CELL_MIN_PX: 32,
    CELL_MAX_PX: 48,
    PADDING: 20,
    HUD_HEIGHT: 48,
    SUPPLY_HEIGHT: 52,
};

const CELL_STATES = {
    EMPTY: 0,
    WALL: 1,
    INFECTED: 2,
};

const MUTATION_TYPES = {
    BASIC: 'basic',
    DIAGONAL: 'diagonal',
    JUMPER: 'jumper',
    SPLITTER: 'splitter',
    ACCELERATOR: 'accelerator',
    DORMANT: 'dormant',
};

const MUTATION_COLORS = {
    basic: COLORS.INFECTION_BASIC,
    diagonal: COLORS.INFECTION_DIAGONAL,
    jumper: COLORS.INFECTION_JUMPER,
    splitter: COLORS.INFECTION_SPLITTER,
    accelerator: COLORS.INFECTION_ACCELERATOR,
    dormant: COLORS.INFECTION_DORMANT,
};

const SCORING = {
    CELL_CONTAINED: 10,
    STAGE_CLEAR_BASE: 100,
    EFFICIENCY_PER_WALL: 20,
    PERFECT: 200,
    MUTATION_SURVIVED: 50,
    COMBO_BONUS: 50,
    EDGE_BREACH_PENALTY: -50,
};

const TIMING = {
    SPREAD_BASE: 2000,
    SPREAD_MIN: 1000,
    WALL_PLACE_ANIM: 150,
    DEATH_DELAY: 600,
    STAGE_TRANSITION: 600,
    COMBO_WINDOW: 2000,
    INACTIVITY_WARN: 6000,
    DOUBLE_TAP: 300,
    TAP_COOLDOWN: 100,
    DORMANT_TICKS: 3,
};

// Difficulty table: [stageMin, stageMax, gridSize, infectMin, infectMax, wallBase, spreadInterval, mutationSlots]
const DIFFICULTY = [
    { min: 1,  max: 3,  grid: 6,  infectMin: 1, infectMax: 1, walls: 16, spread: 2000, mutations: 0 },
    { min: 4,  max: 5,  grid: 6,  infectMin: 1, infectMax: 2, walls: 14, spread: 1800, mutations: 0 },
    { min: 6,  max: 8,  grid: 8,  infectMin: 2, infectMax: 2, walls: 18, spread: 1600, mutations: 1 },
    { min: 9,  max: 10, grid: 8,  infectMin: 2, infectMax: 3, walls: 16, spread: 1500, mutations: 1 },
    { min: 11, max: 15, grid: 8,  infectMin: 3, infectMax: 3, walls: 16, spread: 1400, mutations: 2 },
    { min: 16, max: 20, grid: 10, infectMin: 3, infectMax: 4, walls: 22, spread: 1300, mutations: 3 },
    { min: 21, max: 30, grid: 10, infectMin: 4, infectMax: 4, walls: 20, spread: 1200, mutations: 4 },
    { min: 31, max: 40, grid: 12, infectMin: 4, infectMax: 5, walls: 28, spread: 1100, mutations: 5 },
    { min: 41, max: 9999, grid: 12, infectMin: 5, infectMax: 5, walls: 26, spread: 1000, mutations: 6 },
];

const WALL_SURPLUS = [8, 6, 5, 5, 5, 4, 3, 3, 3];

const JUICE = {
    WALL_SCALE_OVERSHOOT: 1.15,
    INFECTION_PULSE_SCALE: 1.08,
    INFECTION_PULSE_DUR: 600,
    CAMERA_SHAKE_WALL: 1.5,
    CAMERA_SHAKE_BREACH: 8,
    BREACH_SHAKE_DUR: 300,
    CLEAR_ZOOM: 1.03,
    PARTICLE_WALL_COUNT: 6,
    PARTICLE_BREACH_COUNT: 12,
    PARTICLE_CLEAR_COUNT: 20,
};

const STORAGE_KEYS = {
    HIGH_SCORE: 'gq_high_score',
    GAMES_PLAYED: 'gq_games_played',
    HIGHEST_STAGE: 'gq_highest_stage',
    TOTAL_CONTAINED: 'gq_total_infections_contained',
    TOTAL_WALLS: 'gq_total_walls_placed',
    PERFECT_STAGES: 'gq_perfect_stages',
    SETTINGS: 'gq_settings',
};

const SVG_STRINGS = {
    LIFE_ACTIVE: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#FF1744" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#FF1744"/><circle cx="12" cy="5" r="2.5" fill="#FF1744"/><circle cx="6" cy="16" r="2.5" fill="#FF1744"/><circle cx="18" cy="16" r="2.5" fill="#FF1744"/></svg>',
    LIFE_EMPTY: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#4A1A1A" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#4A1A1A"/><circle cx="12" cy="5" r="2.5" fill="#4A1A1A"/><circle cx="6" cy="16" r="2.5" fill="#4A1A1A"/><circle cx="18" cy="16" r="2.5" fill="#4A1A1A"/></svg>',
    PAUSE_ICON: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="5" y="3" width="5" height="18" rx="1" fill="#B0BEC5"/><rect x="14" y="3" width="5" height="18" rx="1" fill="#B0BEC5"/></svg>',
};
