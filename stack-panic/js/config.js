// Stack Panic - Game Configuration
// All constants, colors, difficulty tables

const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;

// Tower / Platform
const PLATFORM_START_WIDTH = 280;
const PLATFORM_MIN_WIDTH = 120;
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
const PENDULUM_BASE_SPEED = 2.0;
const PENDULUM_MAX_ANGLE = 55 * Math.PI / 180;
const IDLE_DROP_TIMEOUT = 8000;
const TAP_COOLDOWN = 150;
const TIME_PRESSURE_THRESHOLD = 4000;

// Tilt System
const TILT_PER_MISS = 15;
const TILT_MAX = 45;
const TILT_WARNING_THRESHOLD = 30;

// Scoring
const SCORE_NORMAL = 100;
const SCORE_GREAT = 200;
const SCORE_PERFECT = 500;
const SCORE_STREAK_BONUS = 1000;
const PERFECT_OVERHANG_MAX = 5;
const GREAT_OVERHANG_MAX = 20;
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
    obstacle: 0xCC4444,
    obstacleShadow: 0x992222,
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

// Stage generation - infinite stages with varied difficulty
function generateStage(stageNum) {
    const s = stageNum;
    // Deterministic pseudo-random per stage
    const hash = (i) => (((s * 2654435761 + i * 40503) & 0x7FFFFFFF) % 233280) / 233280;

    // Blocks required to clear stage
    const blocksRequired = s <= 1 ? 5 : s <= 3 ? 7 : s <= 6 ? 10 : 12;

    // Base values (get slightly harder each stage)
    let platformWidth = Math.max(PLATFORM_MIN_WIDTH, PLATFORM_START_WIDTH - (s - 1) * 10);
    let pendulumSpeed = Math.min(PENDULUM_BASE_SPEED * (1 + s * 0.06), PENDULUM_BASE_SPEED * 3.5);
    let frictionAir = 0.03;
    let restitution = 0.03;
    let windDrift = 0;
    let irregularChance = 0;
    let earthquakeChance = 0;
    let blockWidth = Math.max(BLOCK_MIN_WIDTH, BLOCK_BASE_WIDTH - s * 1.5);
    let obstacles = [];
    let tiltRecovery = Math.max(2, 6 - s * 0.3);
    let traits = [];

    // Stage 1: tutorial, no traits
    if (s === 1) {
        return {
            stageNum: s, blocksRequired, platformWidth, pendulumSpeed,
            frictionAir, restitution, windDrift, irregularChance,
            earthquakeChance, blockWidth, obstacles, tiltRecovery, traits
        };
    }

    // Trait pool expands with stages
    const traitPool = [];
    if (s >= 2) traitPool.push('narrowPlatform', 'fastPendulum');
    if (s >= 3) traitPool.push('bouncyBlocks');
    if (s >= 4) traitPool.push('gustyWind', 'oddShapes');
    if (s >= 5) traitPool.push('obstacles');
    if (s >= 6) traitPool.push('floatyBlocks');
    if (s >= 8) traitPool.push('earthquakeZone');

    // Pick 1-3 traits depending on stage
    const numTraits = Math.min(traitPool.length, s <= 3 ? 1 : s <= 6 ? 2 : 3);
    const poolCopy = [...traitPool];
    const picked = [];
    for (let i = 0; i < numTraits && poolCopy.length > 0; i++) {
        const idx = Math.floor(hash(i) * poolCopy.length);
        picked.push(poolCopy.splice(idx, 1)[0]);
    }

    // Apply trait effects
    const intensity = Math.min(1, (s - 1) / 15);
    for (const trait of picked) {
        switch (trait) {
            case 'narrowPlatform':
                platformWidth = Math.max(PLATFORM_MIN_WIDTH, platformWidth - 30 - intensity * 40);
                traits.push('Narrow Platform');
                break;
            case 'fastPendulum':
                pendulumSpeed *= 1.3 + intensity * 0.7;
                traits.push('Fast Pendulum');
                break;
            case 'bouncyBlocks':
                restitution = 0.08 + intensity * 0.12;
                traits.push('Bouncy Blocks');
                break;
            case 'floatyBlocks':
                frictionAir = Math.max(0.005, 0.015 - intensity * 0.01);
                traits.push('Floaty Blocks');
                break;
            case 'gustyWind':
                windDrift = 8 + intensity * 18;
                traits.push('Gusty Wind');
                break;
            case 'oddShapes':
                irregularChance = 0.25 + intensity * 0.35;
                blockWidth = Math.max(BLOCK_MIN_WIDTH, blockWidth - 8);
                traits.push('Odd Shapes');
                break;
            case 'obstacles':
                const numObs = Math.min(3, 1 + Math.floor(s / 5));
                for (let i = 0; i < numObs; i++) {
                    const ox = (hash(i + 10) - 0.5) * platformWidth * 0.5;
                    obstacles.push({
                        x: GAME_WIDTH / 2 + ox,
                        width: 14 + hash(i + 20) * 14,
                        height: 16 + hash(i + 30) * 18
                    });
                }
                traits.push('Obstacles');
                break;
            case 'earthquakeZone':
                earthquakeChance = 0.15 + intensity * 0.2;
                traits.push('Earthquake Zone');
                break;
        }
    }

    return {
        stageNum: s, blocksRequired, platformWidth, pendulumSpeed,
        frictionAir, restitution, windDrift, irregularChance,
        earthquakeChance, blockWidth, obstacles, tiltRecovery, traits
    };
}
