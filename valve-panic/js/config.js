// Valve Panic - Configuration & Constants
const CONFIG = {
    GAME_WIDTH: 360,
    GAME_HEIGHT: 640,

    COLORS: {
        BG: 0x2D3436,
        PIPE_BODY: 0x636E72,
        PIPE_INNER: 0x1a1a2e,
        DANGER: 0xFF4444,
        VALVE_ACTIVE: 0xFFFFFF,
        VALVE_IDLE: 0x95A5A6,
        SURGE_FLASH: 0xFF69B4,
        HUD_BG: 0x000000,
        UI_TEXT: '#FFFFFF',
        GOLD: '#FFD700',
        SURGE_COLOR: '#FF69B4'
    },

    PIPE_COLORS: [0xFF6B6B, 0x4ECDC4, 0xA8E6CF, 0xFFB347, 0xDDA0DD, 0xFDFD96],
    PIPE_COLOR_HEX: ['#FF6B6B', '#4ECDC4', '#A8E6CF', '#FFB347', '#DDA0DD', '#FDFD96'],

    PIPE: {
        WIDTH: 44,
        HEIGHT: 340,
        INNER_PAD: 4,
        VALVE_RADIUS: 18,
        VALVE_Y_OFFSET: 30,
        TOP_Y: 100,
        RIVET_R: 3
    },

    TIMING: {
        NEW_PIPE_INTERVAL: 10000,
        INACTIVITY_TIMEOUT: 5000,
        GRACE_PERIOD: 2000,
        BURST_DELAY: 700,
        MAX_PIPES: 6,
        START_PIPES: 2
    },

    DIFFICULTY: {
        BASE_FILL_RATE: 0.08,
        FILL_RATE_SCALE: 0.0012,
        FILL_RATE_CAP: 0.15,
        DRAIN_RATE_BASE: 0.25,
        DRAIN_RATE_DECAY: 0.0012,
        DRAIN_RATE_MIN: 0.18,
        SURGE_MULTIPLIER: 0.30,
        SAFE_THRESHOLD: 0.30,
        LINK_START_TIME: 30,
        LINK_SURGE_SHARE: 0.15,
        SLOW_ON_SPAWN: 0.80,
        SLOW_DURATION: 2000
    },

    SCORING: {
        PER_SECOND: 10,
        CLEAN_DRAIN: 50,
        COMBO_BONUS: 25,
        EMERGENCY_SAVE: 200,
        NEW_PIPE: 100,
        SURGE_PENALTY: -25
    },

    STORAGE_KEYS: {
        HIGH_SCORE: 'valve_panic_high_score',
        BEST_TIME: 'valve_panic_best_time',
        GAMES_PLAYED: 'valve_panic_games_played',
        SETTINGS: 'valve_panic_settings'
    }
};

// SVG strings for textures
const SVG = {
    PARTICLE: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>`,
    SPARK: `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6"><circle cx="3" cy="3" r="3" fill="#FFD700"/></svg>`,
    FRAGMENT: `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><polygon points="5,0 10,5 5,10 0,5" fill="#FF6B6B"/></svg>`,
    DROPLET: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="12"><ellipse cx="4" cy="7" rx="4" ry="5" fill="#4ECDC4"/></svg>`
};
