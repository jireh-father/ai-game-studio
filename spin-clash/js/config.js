// config.js — Game constants, difficulty parameters, color palette

const CONFIG = {
    WIDTH: 360,
    HEIGHT: 640,
    CENTER_X: 180,
    CENTER_Y: 280,

    COLORS: {
        PLAYER: 0x00E5FF,
        DRIFTER: 0xFF4081,
        CHASER: 0xFF6D00,
        HEAVY: 0xAA00FF,
        BOUNCER: 0x00E676,
        BG: 0x0A0E1A,
        PLATFORM: 0x1A2340,
        PLATFORM_EDGE: 0xFFFFFF,
        SPIN_FULL: 0x00E5FF,
        SPIN_LOW: 0xFF1744,
        SCORE: 0xFFFFFF,
        COMBO: 0xFFD600,
        UI_BG: 0x0A0E1A,
    },

    PLATFORM: {
        BASE_RADIUS: 155,
        MIN_RADIUS: 105,
        SHRINK_PER_STAGE: 2.5,
    },

    PLAYER: {
        RADIUS: 18,
        MASS: 1.0,
        MAX_SPEED: 600,
        DRAG: 80,
        TRAIL_COUNT: 6,
        TRAIL_INTERVAL: 30,
    },

    ENEMY_TYPES: {
        DRIFTER: { radius: 16, mass: 0.8, speed: 40, hp: 1, color: 0xFF4081, name: 'drifter' },
        CHASER:  { radius: 16, mass: 0.7, speed: 70, hp: 1, color: 0xFF6D00, name: 'chaser' },
        HEAVY:   { radius: 26, mass: 2.0, speed: 25, hp: 2, color: 0xAA00FF, name: 'heavy' },
        BOUNCER: { radius: 18, mass: 0.9, speed: 50, hp: 1, color: 0x00E676, name: 'bouncer' },
    },

    LAUNCH_POWER: 4.5,
    MAX_DRAG_PX: 120,
    KNOCKBACK_MULTI: 1.8,
    KNOCKBACK_BASE: 450,
    HIT_STOP_MS: 50,
    HIT_STOP_GUARD_MS: 100,
    SLOW_MO_SCALE: 0.3,
    SLOW_MO_DURATION: 400,
    INACTIVITY_DEATH_MS: 15000,
    DEATH_ANIM_MS: 600,
    SPIN_REFILL_MS: 600,
    DRAG_THRESHOLD: 8,

    SCORE: {
        KILL: 100,
        STAGE_BONUS: 500,
        SPEED_KILL: 50,
        SPIN_BONUS: 200,
        CHAIN: 300,
    },

    COMBO_MULTIPLIERS: [1, 1, 1.5, 2, 3, 3, 3, 3],
};

// Hex color to CSS string helper
function hexToCSS(hex) {
    return '#' + hex.toString(16).padStart(6, '0');
}
