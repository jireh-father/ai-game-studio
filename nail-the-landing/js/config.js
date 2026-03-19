const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const COLORS = {
    PRIMARY: 0x2563EB,
    GOLD: 0xF59E0B,
    PLATFORM: 0x1E293B,
    SKY_TOP: 0x0EA5E9,
    SKY_BOTTOM: 0x0369A1,
    GROUND: 0xCBD5E1,
    DANGER: 0xDC2626,
    GOOD: 0x10B981,
    UI_WHITE: 0xFFFFFF,
    UI_DARK: 0x334155,
    UI_BG: 0x0F172A,
    DARK_BLUE: 0x1E40AF
};

const DIFFICULTY = {
    BASE_HEIGHT: 300,
    HEIGHT_INCREMENT: 15,
    MAX_HEIGHT: 650,
    BASE_SPEED: 180,
    SPEED_INCREMENT: 8,
    MAX_SPEED: 480
};

const SCORE = {
    PERFECT_BASE: 100,
    GOOD_BASE: 50,
    COMBO_BONUS_INTERVAL: 5,
    COMBO_BONUS_POINTS: 500,
    HEIGHT_BONUS_RATE: 10
};

const SWEET_SPOT = {
    INITIAL: 50,
    PERFECT_EXPAND: 2,
    BAD_SHRINK: 4,
    MIN: 8,
    MAX: 60
};

const PLATFORM_Y_FRAC = 0.86;
const PLATFORM_WIDTH = 200;
const PLATFORM_HEIGHT = 20;
const CHARACTER_HEIGHT = 70;
const CHARACTER_WIDTH = 40;
const MAX_LIVES = 3;
const INACTIVITY_TIMEOUT = 25000;

const SVG_PLAYER = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="70" viewBox="0 0 40 70">
  <circle cx="20" cy="10" r="8" fill="#2563EB" stroke="#1E40AF" stroke-width="2"/>
  <line x1="20" y1="18" x2="20" y2="44" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/>
  <line x1="20" y1="26" x2="8" y2="36" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="20" y1="26" x2="32" y2="36" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="20" y1="44" x2="10" y2="62" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="20" y1="44" x2="30" y2="62" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="10" y1="62" x2="4" y2="68" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>
  <line x1="30" y1="62" x2="36" y2="68" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const SVG_PLAYER_STUCK = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="70" viewBox="0 0 40 70">
  <circle cx="20" cy="10" r="8" fill="#2563EB" stroke="#1E40AF" stroke-width="2"/>
  <line x1="20" y1="18" x2="20" y2="42" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/>
  <line x1="20" y1="26" x2="4" y2="22" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="20" y1="26" x2="36" y2="22" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="20" y1="42" x2="10" y2="52" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="10" y1="52" x2="6" y2="66" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="20" y1="42" x2="30" y2="52" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="30" y1="52" x2="34" y2="66" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const SVG_PLATFORM = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20" viewBox="0 0 200 20">
  <rect x="0" y="4" width="200" height="16" rx="4" fill="#1E293B"/>
  <rect x="0" y="4" width="200" height="3" rx="2" fill="#334155"/>
  <line x1="30" y1="6" x2="30" y2="10" stroke="#475569" stroke-width="1.5"/>
  <line x1="60" y1="6" x2="60" y2="10" stroke="#475569" stroke-width="1.5"/>
  <line x1="90" y1="6" x2="90" y2="10" stroke="#475569" stroke-width="1.5"/>
  <line x1="110" y1="6" x2="110" y2="10" stroke="#475569" stroke-width="1.5"/>
  <line x1="140" y1="6" x2="140" y2="10" stroke="#475569" stroke-width="1.5"/>
  <line x1="170" y1="6" x2="170" y2="10" stroke="#475569" stroke-width="1.5"/>
</svg>`;

const SVG_SPLAT = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
  <ellipse cx="40" cy="45" rx="36" ry="12" fill="#2563EB" opacity="0.9"/>
  <circle cx="10" cy="35" r="5" fill="#2563EB" opacity="0.7"/>
  <circle cx="70" cy="32" r="4" fill="#2563EB" opacity="0.7"/>
  <circle cx="20" cy="28" r="3" fill="#2563EB" opacity="0.6"/>
  <circle cx="62" cy="26" r="3.5" fill="#2563EB" opacity="0.6"/>
  <circle cx="40" cy="22" r="4" fill="#2563EB" opacity="0.5"/>
  <line x1="40" y1="20" x2="40" y2="10" stroke="#F59E0B" stroke-width="2" opacity="0.8"/>
  <line x1="40" y1="20" x2="28" y2="12" stroke="#F59E0B" stroke-width="2" opacity="0.8"/>
  <line x1="40" y1="20" x2="52" y2="12" stroke="#F59E0B" stroke-width="2" opacity="0.8"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#F59E0B"/>
</svg>`;

const SVG_PARTICLE_GREEN = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#10B981"/>
</svg>`;

const SVG_PARTICLE_BLUE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#1E40AF"/>
</svg>`;

const LS_KEY = 'nail-the-landing_high_score';
