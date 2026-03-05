// Balloon Pump Panic - Configuration & Constants

const COLORS = {
    calm: 0x4FC3F7,
    warning: 0xFF8A65,
    danger: 0xEF5350,
    critical: 0xC62828,
    bg: 0xFFF8E1,
    bgBottom: 0xE8EAF6,
    pumpZone: 0xECEFF1,
    success: 0x66BB6A,
    explosion: 0xFF6D00,
    escape: 0x90CAF9,
    uiText: 0x263238,
    uiAccent: 0x7E57C2,
    streak: 0xFFD600,
    white: 0xFFFFFF,
    redFlash: 0xEF5350,
    gold: 0xFFD600
};

const SCORING = {
    zones: [
        { min: 0, max: 49, base: 10, mult: 1.0, label: 'SAFE' },
        { min: 50, max: 69, base: 25, mult: 1.5, label: 'RISKY!' },
        { min: 70, max: 89, base: 50, mult: 2.0, label: 'DANGER!' },
        { min: 90, max: 94, base: 100, mult: 3.0, label: 'DANGER!' },
        { min: 95, max: 99, base: 150, mult: 5.0, label: 'PERFECT!' }
    ],
    streakBonus: 10
};

const GAME_CONFIG = {
    width: 360,
    height: 640,
    lives: 3,
    idleTimeout: 5000,
    pumpZoneRatio: 0.4,
    minTapInterval: 50,
    balloonTapDebounce: 100,
    deathRestartDelay: 600
};

const SVG_STRINGS = {
    balloon: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="100" viewBox="0 0 60 100">
        <ellipse cx="30" cy="35" rx="25" ry="32" fill="#4FC3F7" stroke="#29B6F6" stroke-width="2"/>
        <ellipse cx="20" cy="22" rx="8" ry="12" fill="rgba(255,255,255,0.3)" transform="rotate(-15,20,22)"/>
        <polygon points="27,66 30,72 33,66" fill="#29B6F6"/>
        <path d="M30,72 Q28,82 32,92 Q28,97 30,100" fill="none" stroke="#90A4AE" stroke-width="1.5"/>
    </svg>`,
    pump: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
        <rect x="25" y="10" width="30" height="40" rx="4" fill="#78909C" stroke="#546E7A" stroke-width="2"/>
        <rect x="20" y="0" width="40" height="12" rx="3" fill="#B0BEC5" stroke="#78909C" stroke-width="2"/>
        <rect x="36" y="48" width="8" height="12" fill="#546E7A"/>
    </svg>`,
    shard: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
        <polygon points="6,0 12,12 0,12" fill="#FF6D00" opacity="0.9"/>
    </svg>`,
    confetti: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
        <rect x="0" y="0" width="8" height="8" rx="1" fill="#66BB6A"/>
    </svg>`,
    life: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="28" viewBox="0 0 20 28">
        <ellipse cx="10" cy="10" rx="9" ry="11" fill="#EF5350"/>
        <polygon points="8,20 10,24 12,20" fill="#C62828"/>
    </svg>`,
    lifeEmpty: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="28" viewBox="0 0 20 28">
        <ellipse cx="10" cy="10" rx="9" ry="11" fill="#546E7A" opacity="0.3"/>
        <polygon points="8,20 10,24 12,20" fill="#37474F" opacity="0.3"/>
    </svg>`,
    particle: `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6">
        <circle cx="3" cy="3" r="3" fill="#FFFFFF"/>
    </svg>`
};

const CONFETTI_COLORS = [0x66BB6A, 0x4FC3F7, 0xFFD600, 0xFF8A65, 0x7E57C2];

const STORAGE_KEYS = {
    highScore: 'balloon-pump-panic_high_score',
    gamesPlayed: 'balloon-pump-panic_games_played',
    highestStage: 'balloon-pump-panic_highest_stage',
    settings: 'balloon-pump-panic_settings',
    totalPopped: 'balloon-pump-panic_total_balloons_popped'
};

function loadStorage(key, fallback) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch(e) { return fallback; }
}
function saveStorage(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}
