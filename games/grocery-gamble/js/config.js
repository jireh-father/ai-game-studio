// Grocery Gamble - Configuration & Constants
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const COLORS = {
    primary: 0x2ECC71,
    secondary: 0x95A5A6,
    background: 0xF5F5F0,
    danger: 0xE74C3C,
    amber: 0xF39C12,
    gold: 0xF1C40F,
    text: 0x2C3E50,
    uiBg: 0xECF0F1,
    cashierSkin: 0xD4A96A,
    beltDark: 0x7F8C8D,
    white: 0xFFFFFF
};

const HEX = {
    primary: '#2ECC71', secondary: '#95A5A6', background: '#F5F5F0',
    danger: '#E74C3C', amber: '#F39C12', gold: '#F1C40F',
    text: '#2C3E50', uiBg: '#ECF0F1', beltDark: '#7F8C8D'
};

const SCORING = {
    perfect: 300, perfectBonus: 50,
    good: 150, accepted: 80,
    noAlarmStage: 500, zeroSuspicionStage: 200,
    fragileBonus: 100,
    comboThresholds: [3, 5, 8],
    comboMultipliers: [1.2, 1.5, 2.0]
};

const OVERFLOW_THRESHOLD = 12000;
const OVERFLOW_WARNING = 6000;
const SUSPICION_DRAIN_RATE = 2;
const SUSPICION_PER_MISS = 33;
const SUSPICION_DRAIN_ON_HIT = 5;
const MAX_ALARMS = 3;
const INACTIVITY_DEATH = 25000;

const ITEM_TYPES = [
    { key: 'apple', label: 'Apple', minWeight: 150, maxWeight: 250, isFragile: false, sizeCategory: 'small', stageUnlock: 1 },
    { key: 'bread', label: 'Bread', minWeight: 300, maxWeight: 500, isFragile: false, sizeCategory: 'medium', stageUnlock: 1 },
    { key: 'can', label: 'Can', minWeight: 200, maxWeight: 400, isFragile: false, sizeCategory: 'small', stageUnlock: 1 },
    { key: 'watermelon', label: 'Watermelon', minWeight: 100, maxWeight: 200, isFragile: false, sizeCategory: 'large', stageUnlock: 4, deceptive: true },
    { key: 'honey', label: 'Honey Jar', minWeight: 400, maxWeight: 600, isFragile: false, sizeCategory: 'small', stageUnlock: 4, deceptive: true },
    { key: 'eggs', label: 'Eggs', minWeight: 250, maxWeight: 350, isFragile: true, sizeCategory: 'medium', stageUnlock: 6 },
    { key: 'bottle', label: 'Glass Bottle', minWeight: 350, maxWeight: 550, isFragile: true, sizeCategory: 'medium', stageUnlock: 6 },
    { key: 'milk', label: 'Milk', minWeight: 450, maxWeight: 650, isFragile: false, sizeCategory: 'medium', stageUnlock: 1 },
    { key: 'chips', label: 'Chips Bag', minWeight: 80, maxWeight: 180, isFragile: false, sizeCategory: 'large', stageUnlock: 4, deceptive: true }
];

const SVG_SCALE = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80"><rect x="10" y="30" width="180" height="40" rx="6" fill="#95A5A6"/><rect x="20" y="20" width="160" height="20" rx="4" fill="#BDC3C7"/><rect x="70" y="0" width="60" height="22" rx="3" fill="#2C3E50"/><rect x="74" y="3" width="52" height="16" rx="2" fill="#1ABC9C"/></svg>`;

const SVG_CASHIER_NORMAL = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="90" viewBox="0 0 60 90"><rect x="10" y="45" width="40" height="45" rx="5" fill="#2980B9"/><rect x="18" y="55" width="24" height="10" rx="2" fill="#ECF0F1"/><ellipse cx="30" cy="32" rx="18" ry="20" fill="#D4A96A"/><circle cx="23" cy="30" r="3" fill="#2C3E50"/><circle cx="37" cy="30" r="3" fill="#2C3E50"/><line x1="23" y1="42" x2="37" y2="42" stroke="#2C3E50" stroke-width="2"/></svg>`;

const SVG_CASHIER_ANGRY = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="90" viewBox="0 0 60 90"><rect x="10" y="45" width="40" height="45" rx="5" fill="#2980B9"/><rect x="18" y="55" width="24" height="10" rx="2" fill="#ECF0F1"/><ellipse cx="30" cy="32" rx="18" ry="20" fill="#D4A96A"/><line x1="18" y1="27" x2="28" y2="31" stroke="#2C3E50" stroke-width="2.5"/><line x1="42" y1="27" x2="32" y2="31" stroke="#2C3E50" stroke-width="2.5"/><circle cx="23" cy="31" r="2.5" fill="#2C3E50"/><circle cx="37" cy="31" r="2.5" fill="#2C3E50"/><path d="M23,44 Q30,38 37,44" stroke="#2C3E50" stroke-width="2" fill="none"/></svg>`;

const SVG_ITEMS = {
    apple: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><ellipse cx="25" cy="28" rx="18" ry="20" fill="#E74C3C"/><line x1="25" y1="8" x2="25" y2="14" stroke="#27AE60" stroke-width="3" stroke-linecap="round"/><ellipse cx="33" cy="11" rx="6" ry="4" fill="#27AE60"/></svg>`,
    bread: `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="45" viewBox="0 0 70 45"><rect x="5" y="15" width="60" height="25" rx="8" fill="#E8C07D"/><ellipse cx="35" cy="15" rx="28" ry="12" fill="#F0D090"/><line x1="20" y1="20" x2="20" y2="35" stroke="#D4A96A" stroke-width="1.5"/><line x1="35" y1="20" x2="35" y2="35" stroke="#D4A96A" stroke-width="1.5"/><line x1="50" y1="20" x2="50" y2="35" stroke="#D4A96A" stroke-width="1.5"/></svg>`,
    can: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50"><rect x="5" y="8" width="30" height="34" rx="3" fill="#3498DB"/><ellipse cx="20" cy="8" rx="15" ry="5" fill="#5DADE2"/><ellipse cx="20" cy="42" rx="15" ry="5" fill="#2E86C1"/><rect x="8" y="18" width="24" height="12" rx="2" fill="#ECF0F1"/></svg>`,
    watermelon: `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="55" viewBox="0 0 70 55"><path d="M5,40 Q35,2 65,40 Z" fill="#27AE60"/><path d="M10,40 Q35,7 60,40 Z" fill="#EAFAF1"/><path d="M14,40 Q35,12 56,40 Z" fill="#E74C3C"/><ellipse cx="28" cy="30" rx="3" ry="2" fill="#2C3E50"/><ellipse cx="35" cy="26" rx="3" ry="2" fill="#2C3E50"/><ellipse cx="42" cy="30" rx="3" ry="2" fill="#2C3E50"/></svg>`,
    honey: `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="55" viewBox="0 0 45 55"><rect x="8" y="20" width="29" height="30" rx="5" fill="#F39C12"/><rect x="10" y="12" width="25" height="12" rx="3" fill="#E67E22"/><rect x="12" y="8" width="21" height="8" rx="2" fill="#E74C3C"/><ellipse cx="25" cy="32" rx="8" ry="4" fill="#F1C40F" opacity="0.5"/></svg>`,
    eggs: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="35" viewBox="0 0 60 35"><rect x="2" y="12" width="56" height="21" rx="4" fill="#F5CBA7"/><rect x="2" y="2" width="56" height="14" rx="4" fill="#FAD7A0"/><ellipse cx="14" cy="13" rx="7" ry="5" fill="#FDEBD0"/><ellipse cx="30" cy="13" rx="7" ry="5" fill="#FDEBD0"/><ellipse cx="46" cy="13" rx="7" ry="5" fill="#FDEBD0"/><circle cx="52" cy="5" r="4" fill="#E74C3C"/></svg>`,
    bottle: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="60" viewBox="0 0 30 60"><rect x="8" y="20" width="14" height="35" rx="3" fill="#85C1E9" opacity="0.8"/><rect x="10" y="10" width="10" height="12" rx="2" fill="#AED6F1"/><rect x="11" y="5" width="8" height="8" rx="1" fill="#5DADE2"/><ellipse cx="15" cy="35" rx="5" ry="8" fill="#D6EAF8" opacity="0.4"/></svg>`,
    milk: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="55" viewBox="0 0 40 55"><rect x="6" y="15" width="28" height="35" rx="3" fill="#FDFEFE"/><rect x="6" y="15" width="28" height="12" rx="3" fill="#3498DB"/><rect x="12" y="5" width="16" height="14" rx="2" fill="#FDFEFE"/><rect x="14" y="2" width="12" height="6" rx="2" fill="#E74C3C"/><rect x="10" y="32" width="20" height="8" rx="1" fill="#ECF0F1"/></svg>`,
    chips: `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60"><rect x="8" y="5" width="34" height="50" rx="5" fill="#F39C12"/><rect x="8" y="5" width="34" height="15" rx="5" fill="#E74C3C"/><rect x="12" y="25" width="26" height="18" rx="3" fill="#F7DC6F" opacity="0.6"/><circle cx="25" cy="34" rx="6" ry="6" fill="#E67E22" opacity="0.5"/></svg>`
};

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#F1C40F"/></svg>`;
const SVG_PARTICLE_RED = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#E74C3C"/></svg>`;

// Global game state
const GameState = {
    score: 0, stage: 1, alarmCount: 0, suspicion: 0,
    highScore: 0, gamesPlayed: 0, combo: 0,
    soundEnabled: true, adReviveUsed: false,
    reset() {
        this.score = 0; this.stage = 1; this.alarmCount = 0;
        this.suspicion = 0; this.combo = 0; this.adReviveUsed = false;
    }
};

// Load high score from localStorage
try {
    const saved = localStorage.getItem('grocery-gamble_high_score');
    if (saved) GameState.highScore = parseInt(saved, 10) || 0;
} catch(e) {}
