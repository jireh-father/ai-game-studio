// config.js - Game constants, difficulty, colors, SVGs
const COLORS = {
    primary: 0x00F5FF,
    warning: 0xFFB300,
    critical: 0xFF1744,
    steal: 0x00E676,
    white: 0xFFFFFF,
    bg: 0x0A0A1A,
    wall: 0x2D1B69,
    boss: 0xFFD700,
    uiText: 0xE0E0E0
};

const TIMER = {
    start: 10, drain: 1, inactivityDrain: 2,
    inactivityDelay: 5, reviveBonus: 5
};

const SCORING = {
    stealBase: 100, perfectBase: 200, bombDodge: 50,
    bossCrack: 500, stageClearBase: 300,
    chainThresholds: [3, 6, 10],
    chainMultipliers: [2, 3, 5],
    perfectZone: 0.15, stealZone: 0.40
};

const WALL = { growthBase: 3, crushThreshold: 0.15 };

const DIFFICULTY = [
    { minStage: 1,  speed: 120, spawnInterval: 1200, stealWindow: 300, bombChance: 0,    timeValues: [2, 3],       wallGrowth: 3 },
    { minStage: 4,  speed: 152, spawnInterval: 1080, stealWindow: 270, bombChance: 0.15, timeValues: [1, 2, 3],    wallGrowth: 4 },
    { minStage: 7,  speed: 184, spawnInterval: 920,  stealWindow: 240, bombChance: 0.25, timeValues: [1, 2, 3, 5], wallGrowth: 5 },
    { minStage: 11, speed: 216, spawnInterval: 760,  stealWindow: 200, bombChance: 0.35, timeValues: [1, 2, 3, 5], wallGrowth: 6 },
    { minStage: 16, speed: 280, spawnInterval: 500,  stealWindow: 150, bombChance: 0.40, timeValues: [1, 2, 3, 5], wallGrowth: 8 }
];

const SVG_STRINGS = {
    player: `<svg viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,20 Q20,2 30,20 L28,25 L12,25 Z" fill="#00F5FF" opacity="0.9"/>
        <rect x="14" y="25" width="12" height="18" rx="3" fill="#00F5FF" opacity="0.7"/>
        <circle cx="17" cy="18" r="2" fill="#FFFFFF"/>
        <circle cx="23" cy="18" r="2" fill="#FFFFFF"/>
        <rect x="26" y="28" width="10" height="3" rx="1" fill="#00F5FF" opacity="0.5"/>
    </svg>`,
    obstacle: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <polygon points="25,5 45,25 25,45 5,25" fill="none" stroke="#00E676" stroke-width="2"/>
        <polygon points="25,10 40,25 25,40 10,25" fill="#00E676" opacity="0.2"/>
        <circle cx="25" cy="25" r="8" fill="#00E676" opacity="0.3"/>
    </svg>`,
    bomb: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <polygon points="25,5 43,15 43,35 25,45 7,35 7,15" fill="#FF1744" opacity="0.3" stroke="#FF1744" stroke-width="2"/>
        <text x="25" y="30" text-anchor="middle" fill="#FF1744" font-size="18" font-weight="bold">-</text>
    </svg>`,
    boss: `<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
        <polygon points="35,5 65,35 35,65 5,35" fill="none" stroke="#FFD700" stroke-width="3"/>
        <polygon points="35,15 55,35 35,55 15,35" fill="#FFD700" opacity="0.15"/>
        <polygon points="35,22 48,35 35,48 22,35" fill="#FFD700" opacity="0.15"/>
        <polygon points="35,28 42,35 35,42 28,35" fill="#FFD700" opacity="0.3"/>
    </svg>`,
    particle: `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="4" fill="#FFFFFF"/>
    </svg>`
};

const GRADE_TABLE = [
    { min: 10000, grade: 'S', color: '#FFD700' },
    { min: 5000,  grade: 'A', color: '#00E676' },
    { min: 2500,  grade: 'B', color: '#00F5FF' },
    { min: 1000,  grade: 'C', color: '#FFB300' },
    { min: 0,     grade: 'D', color: '#FF1744' }
];
