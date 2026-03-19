// Stack Quake - Configuration
const GAME_WIDTH = 400;
const GAME_HEIGHT = 640;

const COLORS = {
  BLOCK: '#E84855',
  BLOCK_HIGHLIGHT: '#FF8B94',
  BLOCK_SHADOW: '#B5202D',
  TOWER: '#3A86FF',
  TOWER_HIGHLIGHT: '#74AAFF',
  TOWER_SHADOW: '#1A5ECC',
  PERFECT_FLASH: '#FFD60A',
  BG: '#0D0D0D',
  DANGER: '#FF6B35',
  UI_TEXT: '#F0EFF4',
  UI_BG: '#1A1A2E',
  SHAKE_RED: '#FF0054',
  WIDTH_RESTORE: '#06D6A0',
  SLICE_FRAGMENT: '#2A6AEE'
};

const BLOCK_WIDTH = 80;
const BLOCK_HEIGHT = 28;
const FLOOR_HEIGHT = 24;
const PLATFORM_START_WIDTH = 320;
const PLATFORM_MIN_WIDTH = 60;
const PERFECT_RANGE_PX = 5;
const NEAR_PERFECT_RANGE_PX = 15;
const WIDTH_RESTORE_PERCENT = 0.10;
const AUTO_DROP_MS = 5000;
const INACTIVITY_DEATH_MS = 25000;

const BASE_BLOCK_SPEED = 1.5;
const SPEED_INCREMENT = 0.03;
const MAX_BLOCK_SPEED = 5.0;

const QUAKE_BASE_AMPLITUDE = 8;
const QUAKE_AMPLITUDE_PER_FLOOR = 0.4;
const QUAKE_MAX_AMPLITUDE = 60;
const QUAKE_BASE_FREQ = 0.003;
const QUAKE_FREQ_INCREMENT = 0.00005;
const QUAKE_MAX_FREQ = 0.007;

const SCORE_PLACE = 100;
const SCORE_PERFECT = 500;
const SCORE_NEAR = 250;
const SCORE_ALTITUDE_BONUS = 10;
const SCORE_WIDTH_BONUS = 50;
const PERFECT_COMBO_INCREMENT = 100;
const PERFECT_COMBO_CAP = 1500;

const QUAKE_PATTERNS = { SINE: 0, RANDOM: 1, DOUBLE: 2 };

const SVG_BLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="28" viewBox="0 0 80 28">
  <rect x="0" y="0" width="80" height="28" fill="${COLORS.BLOCK}" rx="2"/>
  <rect x="2" y="2" width="76" height="3" fill="${COLORS.BLOCK_HIGHLIGHT}" rx="1"/>
  <rect x="2" y="23" width="76" height="3" fill="${COLORS.BLOCK_SHADOW}" rx="1"/>
</svg>`;

const SVG_GROUND = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="24" viewBox="0 0 360 24">
  <rect x="0" y="0" width="360" height="24" fill="${COLORS.TOWER}" rx="2"/>
  <rect x="2" y="2" width="356" height="3" fill="${COLORS.TOWER_HIGHLIGHT}" rx="1"/>
  <rect x="2" y="19" width="356" height="3" fill="${COLORS.TOWER_SHADOW}" rx="1"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <rect x="0" y="0" width="8" height="8" fill="#FFFFFF" rx="1"/>
</svg>`;
