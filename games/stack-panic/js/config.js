// Stack Panic - Game Configuration

const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;

// Tower / Platform
const PLATFORM_START_WIDTH = 280;
const PLATFORM_MIN_WIDTH = 120;
const PLATFORM_HEIGHT = 30;
const PLATFORM_Y = 720;

// Block / Cell
const CELL_SIZE = 20;

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
const PERFECT_OVERHANG_MAX = 8;
const GREAT_OVERHANG_MAX = 25;
const PERFECT_STREAK_CAP = 5;

// Physics body limit
const MAX_PHYSICS_BODIES = 50;

// Tetromino definitions (7 standard shapes)
const TETROMINOES = [
    { name: 'I', cells: [[0,0],[1,0],[2,0],[3,0]], color: 0x00CED1 },
    { name: 'O', cells: [[0,0],[1,0],[0,1],[1,1]], color: 0xFFD700 },
    { name: 'T', cells: [[0,0],[1,0],[2,0],[1,1]], color: 0xAA44FF },
    { name: 'S', cells: [[1,0],[2,0],[0,1],[1,1]], color: 0x44CC44 },
    { name: 'Z', cells: [[0,0],[1,0],[1,1],[2,1]], color: 0xEE4444 },
    { name: 'L', cells: [[0,0],[0,1],[1,1],[2,1]], color: 0xFF8833 },
    { name: 'J', cells: [[2,0],[0,1],[1,1],[2,1]], color: 0x4488FF },
];

function rotateCells(cells, rotation) {
    let rotated = cells.map(([x, y]) => {
        let rx = x, ry = y;
        for (let r = 0; r < rotation; r++) {
            const tmp = rx;
            rx = -ry;
            ry = tmp;
        }
        return [rx, ry];
    });
    const minX = Math.min(...rotated.map(c => c[0]));
    const minY = Math.min(...rotated.map(c => c[1]));
    return rotated.map(([x, y]) => [x - minX, y - minY]);
}

function getRandomTetromino() {
    const type = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    const rotation = Math.floor(Math.random() * 4);
    const cells = rotateCells(type.cells, rotation);
    return { name: type.name, cells, color: type.color };
}

function cellCenter(cells) {
    const ax = cells.reduce((s, c) => s + c[0], 0) / cells.length;
    const ay = cells.reduce((s, c) => s + c[1], 0) / cells.length;
    return { ax, ay };
}

// Items
const ITEMS = {
    glue:   { name: 'GLUE',   desc: 'Next block sticks instantly (no sliding)',   label: 'GLU' },
    expand: { name: 'WIDE',   desc: 'Platform widens for 10 seconds',             label: 'WID' },
    slow:   { name: 'SLOW',   desc: 'Pendulum slows 50% for 8 seconds',           label: 'SLO' },
    bomb:   { name: 'BOMB',   desc: 'Remove the top block from the tower',         label: 'BOM' },
    skip:   { name: 'SKIP',   desc: 'Skip current block and get a new one',        label: 'SKP' },
    shrink: { name: 'TINY',   desc: 'Next block is a tiny 1x1 square',             label: 'TNY' },
};

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
    block: '#E8A838', background: '#1A1A2E', grid: '#252545',
    platform: '#4A4A6A', danger: '#FF3030', perfect: '#FFD700',
    uiText: '#FFFFFF', uiOverlay: 'rgba(0,0,0,0.53)', pendulumLine: '#888888',
};

// Stage generation
function generateStage(stageNum) {
    const s = stageNum;
    const hash = (i) => (((s * 2654435761 + i * 40503) & 0x7FFFFFFF) % 233280) / 233280;

    const blocksRequired = s <= 1 ? 5 : s <= 3 ? 7 : s <= 6 ? 10 : 12;

    let platformWidth = Math.max(PLATFORM_MIN_WIDTH, PLATFORM_START_WIDTH - (s - 1) * 10);
    let pendulumSpeed = Math.min(PENDULUM_BASE_SPEED * (1 + s * 0.06), PENDULUM_BASE_SPEED * 3.5);
    let frictionAir = 0.03;
    let restitution = 0.03;
    let windDrift = 0;
    let irregularChance = 0;
    let earthquakeChance = 0;
    let obstacles = [];
    let tiltRecovery = Math.max(2, 6 - s * 0.3);
    let traits = [];

    if (s === 1) {
        return { stageNum: s, blocksRequired, platformWidth, pendulumSpeed, frictionAir, restitution, windDrift, irregularChance, earthquakeChance, obstacles, tiltRecovery, traits };
    }

    const traitPool = [];
    if (s >= 2) traitPool.push('narrowPlatform', 'fastPendulum');
    if (s >= 3) traitPool.push('bouncyBlocks');
    if (s >= 4) traitPool.push('gustyWind');
    if (s >= 5) traitPool.push('obstacles');
    if (s >= 6) traitPool.push('floatyBlocks');
    if (s >= 8) traitPool.push('earthquakeZone');

    const numTraits = Math.min(traitPool.length, s <= 3 ? 1 : s <= 6 ? 2 : 3);
    const poolCopy = [...traitPool];
    const picked = [];
    for (let i = 0; i < numTraits && poolCopy.length > 0; i++) {
        const idx = Math.floor(hash(i) * poolCopy.length);
        picked.push(poolCopy.splice(idx, 1)[0]);
    }

    const intensity = Math.min(1, (s - 1) / 15);
    for (const trait of picked) {
        switch (trait) {
            case 'narrowPlatform':
                platformWidth = Math.max(PLATFORM_MIN_WIDTH, platformWidth - 30 - intensity * 40);
                traits.push('Narrow Platform'); break;
            case 'fastPendulum':
                pendulumSpeed *= 1.3 + intensity * 0.7;
                traits.push('Fast Pendulum'); break;
            case 'bouncyBlocks':
                restitution = 0.08 + intensity * 0.12;
                traits.push('Bouncy Blocks'); break;
            case 'floatyBlocks':
                frictionAir = Math.max(0.005, 0.015 - intensity * 0.01);
                traits.push('Floaty Blocks'); break;
            case 'gustyWind':
                windDrift = 8 + intensity * 18;
                traits.push('Gusty Wind'); break;
            case 'obstacles':
                const numObs = Math.min(3, 1 + Math.floor(s / 5));
                for (let i = 0; i < numObs; i++) {
                    const ox = (hash(i + 10) - 0.5) * platformWidth * 0.5;
                    obstacles.push({ x: GAME_WIDTH / 2 + ox, width: 14 + hash(i + 20) * 14, height: 16 + hash(i + 30) * 18 });
                }
                traits.push('Obstacles'); break;
            case 'earthquakeZone':
                earthquakeChance = 0.15 + intensity * 0.2;
                traits.push('Earthquake Zone'); break;
        }
    }

    return { stageNum: s, blocksRequired, platformWidth, pendulumSpeed, frictionAir, restitution, windDrift, irregularChance, earthquakeChance, obstacles, tiltRecovery, traits };
}
