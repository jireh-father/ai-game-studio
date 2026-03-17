const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_X = 80;
const PLAYER_Y = 300;
const MAGNET_RADIUS = 160;
const CATCH_RADIUS = 60;
const STARTING_LIVES = 3;
const KNIFE_POOL_SIZE = 8;
const WAVES_PER_STAGE = 5;

const COLORS = {
  primary: 0x00B4FF,
  secondary: 0xC8D4E0,
  bg: 0x1A1E2A,
  danger: 0xFF2244,
  cursed: 0x8B2FC9,
  reward: 0xFFD700,
  uiText: 0xE8EDF2,
  uiBg: 0x0F1320,
  heartFull: 0xFF2244,
  heartEmpty: 0x3A3F50,
  warning: 0xFFAA00,
  dangerRing: 0xFF4400
};

const COLORS_HEX = {
  primary: '#00B4FF',
  secondary: '#C8D4E0',
  bg: '#1A1E2A',
  danger: '#FF2244',
  cursed: '#8B2FC9',
  reward: '#FFD700',
  uiText: '#E8EDF2',
  uiBg: '#0F1320'
};

const SCORE_VALUES = {
  catchBase: 100,
  comboBonus: [0, 0, 50, 150, 300],
  cursedDodge: 150,
  stageBonus: 50,
  perfectWave: 50
};

const PLAYER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="72" viewBox="0 0 48 72">
  <rect x="16" y="28" width="16" height="28" rx="4" fill="#4A90D9"/>
  <circle cx="24" cy="20" r="12" fill="#F5C89A"/>
  <rect x="2" y="28" width="14" height="6" rx="3" fill="#4A90D9"/>
  <circle cx="4" cy="31" r="7" fill="#00B4FF" opacity="0.9"/>
  <rect x="32" y="30" width="12" height="6" rx="3" fill="#4A90D9"/>
  <rect x="16" y="54" width="6" height="16" rx="3" fill="#2E4070"/>
  <rect x="26" y="54" width="6" height="16" rx="3" fill="#2E4070"/>
</svg>`;

const KNIFE_SVG_NORMAL = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="10" viewBox="0 0 56 10">
  <polygon points="0,5 16,0 56,3 56,7 16,10" fill="#C8D4E0"/>
  <line x1="16" y1="1" x2="54" y2="3.5" stroke="#FFFFFF" stroke-width="1" opacity="0.6"/>
  <rect x="36" y="2" width="18" height="6" rx="2" fill="#6B4226"/>
  <line x1="40" y1="2" x2="40" y2="8" stroke="#4A2E18" stroke-width="1.5"/>
  <line x1="46" y1="2" x2="46" y2="8" stroke="#4A2E18" stroke-width="1.5"/>
</svg>`;

const KNIFE_SVG_CURSED = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="10" viewBox="0 0 56 10">
  <polygon points="0,5 16,0 56,3 56,7 16,10" fill="#C0B4D8"/>
  <line x1="16" y1="1" x2="54" y2="3.5" stroke="#D0B0FF" stroke-width="1" opacity="0.5"/>
  <rect x="36" y="2" width="18" height="6" rx="2" fill="#6B4226"/>
  <line x1="40" y1="2" x2="40" y2="8" stroke="#4A2E18" stroke-width="1.5"/>
  <line x1="46" y1="2" x2="46" y2="8" stroke="#4A2E18" stroke-width="1.5"/>
</svg>`;

const PARTICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <rect width="8" height="3" rx="1" fill="#C8D4E0"/>
</svg>`;

const PARTICLE_GOLD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <rect width="8" height="3" rx="1" fill="#FFD700"/>
</svg>`;

function getDifficulty(stage) {
  const s = stage;
  return {
    knifeCount: Math.min(1 + Math.floor(s / 5), 4),
    baseSpeed: Math.min(150 + s * 12, 520),
    speedVariance: s >= 21 ? 0.3 : 0,
    cursedChance: s < 6 ? 0 : Math.min(0.08 + (s - 6) * 0.012, 0.40),
    waveInterval: Math.max(2400 - s * 40, 600),
    angleVariance: s < 11 ? 0 : (s < 16 ? 15 : 25),
    catchWindow: Math.max(600 - s * 10, 180)
  };
}
