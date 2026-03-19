// config.js — Shrinking Stage constants and SVG assets

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const COLORS = {
  TILE_NORMAL: '#C8854A',
  TILE_GROUT: '#6B3F1E',
  TILE_WARNING: '#E05C1A',
  PERFORMER_BODY: '#F0EBE0',
  PERFORMER_ACCENT: '#CC2233',
  BACKGROUND: '#1A1410',
  HUD_BG: '#3D0B10',
  HUD_TEXT: '#FAF5E8',
  NEAR_MISS_FLASH: '#FFD700',
  DANGER_VIGNETTE: '#8B0000',
  STAGE_CLEAR: '#FFE566',
  COMBO_TEXT: '#FF8C00'
};

const GRID_CONFIG = {
  TILE_SIZE: 48,
  GROUT: 2,
  MAX_GRID: 7,
  MIN_GRID: 5,
  CLEAR_GRID: 3
};

const SCORE_VALUES = {
  SURVIVAL_TICK: 10,
  NEAR_MISS: 25,
  STAGE_CLEAR: 200,
  COMBO_BONUS: 50
};

const FORCE_PARAMS = {
  MAX_FORCE_BASE: 480,
  FORCE_SCALE_PER_STAGE: 12,
  FORCE_CAP: 720,
  SWIPE_DIVISOR: 200,
  TAP_FORCE_RATIO: 0.3
};

const IDLE_DEATH = {
  VELOCITY_THRESHOLD: 5,
  WARNING_TIME: 3000,
  DEATH_TIME: 5000
};

const NEAR_MISS_DIST = 40;
const COMBO_TIMEOUT = 5000;
const COMBO_MAX = 4;

// SVG asset strings — MUST have explicit width/height
const SVG_PERFORMER = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <ellipse cx="24" cy="30" rx="8" ry="10" fill="#F0EBE0"/>
  <circle cx="24" cy="16" r="7" fill="#F0EBE0"/>
  <rect x="18" y="4" width="12" height="8" rx="1" fill="#CC2233"/>
  <rect x="15" y="11" width="18" height="3" rx="1" fill="#CC2233"/>
  <polygon points="20,22 24,28 16,32" fill="#CC2233" opacity="0.8"/>
  <polygon points="28,22 24,28 32,32" fill="#CC2233" opacity="0.8"/>
  <rect x="19" y="38" width="4" height="8" rx="2" fill="#2A1A0A"/>
  <rect x="25" y="38" width="4" height="8" rx="2" fill="#2A1A0A"/>
</svg>`;

const SVG_TILE_NORMAL = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect x="2" y="2" width="60" height="60" rx="3" fill="#C8854A"/>
  <line x1="8" y1="10" x2="56" y2="10" stroke="#B07840" stroke-width="1" opacity="0.5"/>
  <line x1="8" y1="22" x2="56" y2="22" stroke="#B07840" stroke-width="1" opacity="0.4"/>
  <line x1="8" y1="34" x2="56" y2="34" stroke="#B07840" stroke-width="1" opacity="0.5"/>
  <line x1="8" y1="46" x2="56" y2="46" stroke="#B07840" stroke-width="1" opacity="0.3"/>
  <line x1="2" y1="2" x2="62" y2="2" stroke="#DFA060" stroke-width="2"/>
  <line x1="2" y1="2" x2="2" y2="62" stroke="#DFA060" stroke-width="2"/>
  <line x1="62" y1="2" x2="62" y2="62" stroke="#7A4820" stroke-width="2"/>
  <line x1="2" y1="62" x2="62" y2="62" stroke="#7A4820" stroke-width="2"/>
</svg>`;

const SVG_TILE_WARNING = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect x="2" y="2" width="60" height="60" rx="3" fill="#E05C1A"/>
  <line x1="8" y1="10" x2="56" y2="10" stroke="#C84010" stroke-width="1" opacity="0.5"/>
  <line x1="8" y1="22" x2="56" y2="22" stroke="#C84010" stroke-width="1" opacity="0.4"/>
  <line x1="8" y1="34" x2="56" y2="34" stroke="#C84010" stroke-width="1" opacity="0.5"/>
  <line x1="8" y1="46" x2="56" y2="46" stroke="#C84010" stroke-width="1" opacity="0.3"/>
  <line x1="2" y1="2" x2="62" y2="2" stroke="#FF8040" stroke-width="2"/>
  <line x1="2" y1="2" x2="2" y2="62" stroke="#FF8040" stroke-width="2"/>
  <line x1="62" y1="2" x2="62" y2="62" stroke="#A03000" stroke-width="2"/>
  <line x1="2" y1="62" x2="62" y2="62" stroke="#A03000" stroke-width="2"/>
</svg>`;

const SVG_STAR = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <polygon points="32,4 38,24 58,24 43,37 49,57 32,45 15,57 21,37 6,24 26,24"
           fill="#FFE566" stroke="#CC9900" stroke-width="2"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#FFD700"/>
</svg>`;

// Difficulty parameters by stage
function getDifficultyParams(stage) {
  const gridSize = Math.max(GRID_CONFIG.MAX_GRID - Math.floor(stage / 10), GRID_CONFIG.MIN_GRID);
  const removalInterval = Math.max(2000 - stage * 35, 900);
  const tilesPerCycle = Math.min(1 + Math.floor(stage / 7), 5);
  const friction = Math.max(0.85 - stage * 0.008, 0.55);
  const maxSpeed = Math.min(FORCE_PARAMS.MAX_FORCE_BASE + stage * FORCE_PARAMS.FORCE_SCALE_PER_STAGE, FORCE_PARAMS.FORCE_CAP);
  const centerRemoveChance = Math.min(stage * 0.01, 0.25);
  const isRestStage = (stage === 5 || stage === 10 || stage === 20);
  return {
    gridSize: isRestStage ? 7 : gridSize,
    removalInterval: isRestStage ? Math.floor(removalInterval * 1.2) : removalInterval,
    tilesPerCycle,
    friction,
    maxSpeed,
    centerRemoveChance
  };
}
