// Stack Panic - Game Configuration
// All constants, colors, difficulty tables

const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;

// Tower / Platform
const PLATFORM_WIDTH = 200;
const PLATFORM_HEIGHT = 30;
const PLATFORM_Y = 720;

// Block
const BLOCK_BASE_WIDTH = 80;
const BLOCK_HEIGHT = 28;
const BLOCK_MIN_WIDTH = 40;
const BLOCK_RADIUS = 3;

// Pendulum
const PENDULUM_PIVOT_X = 195;
const PENDULUM_PIVOT_Y = 80;
const PENDULUM_ARM_LENGTH = 140;
const PENDULUM_BASE_SPEED = 2.0; // radians per second
const PENDULUM_MAX_ANGLE = 55 * Math.PI / 180;
const IDLE_DROP_TIMEOUT = 8000;
const TAP_COOLDOWN = 150;
const TIME_PRESSURE_THRESHOLD = 4000; // speedup if >4s between taps

// Tilt System
const TILT_PER_MISS = 15;
const TILT_MAX = 45;
const TILT_RECOVERY_PER_PERFECT = 4;
const TILT_RECOVERY_PER_GOOD = 2;
const TILT_WARNING_THRESHOLD = 30;

// Scoring
const SCORE_NORMAL = 100;
const SCORE_GREAT = 200;
const SCORE_PERFECT = 500;
const SCORE_TEETER = 50;
const SCORE_STREAK_BONUS = 1000;
const PERFECT_OVERHANG_MAX = 5;
const GREAT_OVERHANG_MAX = 20;
const PERFECT_STREAK_MULTIPLIER = 1.5;
const PERFECT_STREAK_CAP = 5;

// Physics body limit
const MAX_PHYSICS_BODIES = 50;

// Colors
const COLORS = {
    block: 0xE8A838,
    blockShadow: 0xB07820,
    blockHighlight: 0xF5D880,
    blockAccent1: 0xE85C38,
    blockAccent2: 0x4CAF50,
    background: 0x1A1A2E,
    grid: 0x252545,
    platform: 0x4A4A6A,
    platformHighlight: 0x6A6A8A,
    danger: 0xFF3030,
    perfect: 0xFFD700,
    uiText: 0xFFFFFF,
    pendulumLine: 0x888888,
};

const COLORS_HEX = {
    block: '#E8A838',
    blockShadow: '#B07820',
    blockHighlight: '#F5D880',
    blockAccent1: '#E85C38',
    blockAccent2: '#4CAF50',
    background: '#1A1A2E',
    grid: '#252545',
    platform: '#4A4A6A',
    danger: '#FF3030',
    perfect: '#FFD700',
    uiText: '#FFFFFF',
    uiOverlay: 'rgba(0,0,0,0.53)',
    pendulumLine: '#888888',
};

// Block color cycle
function getBlockColor(index) {
    if (index % 5 === 0 && index > 0) return COLORS.blockAccent2;
    if (index % 3 === 0 && index > 0) return COLORS.blockAccent1;
    return COLORS.block;
}

// Difficulty table by milestone
function getMilestoneParams(milestone) {
    const m = Math.max(1, milestone);
    const pendulumSpeed = Math.min(PENDULUM_BASE_SPEED * (1 + m * 0.08), PENDULUM_BASE_SPEED * 3.5);
    const blockWidth = Math.max(BLOCK_MIN_WIDTH, BLOCK_BASE_WIDTH - (m * 2));
    const earthquakeChance = m <= 3 ? 0 : Math.min(0.4, (m - 3) * 0.04);
    const windDrift = m <= 5 ? 0 : Math.min(25, (m - 5) * 3);
    const irregularChance = m <= 2 ? 0 : Math.min(0.6, (m - 2) * 0.08);
    const tiltRecovery = Math.max(2, 8 / m);

    return { pendulumSpeed, blockWidth, earthquakeChance, windDrift, irregularChance, tiltRecovery };
}
