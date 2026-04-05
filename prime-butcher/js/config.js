// Prime Butcher — config.js

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const PLAY_AREA_TOP = 10;
const PLAY_AREA_BOTTOM = 580;
const PLAY_AREA_HEIGHT = PLAY_AREA_BOTTOM - PLAY_AREA_TOP;
const HUD_HEIGHT = 60;
const BLOCK_WIDTH = 80;
const BLOCK_HEIGHT = 60;
const BOSS_WIDTH = 120;
const BOSS_HEIGHT = 90;
const MIN_SWIPE_DIST = 40;
const MAX_SWIPE_TIME = 400;
const COMBO_WINDOW = 2000;
const COMBO_MAX_MULTI = 3.5;
const STAGE_DURATION = 30;
const REST_STAGE_DURATION = 15;
const INACTIVITY_TIMEOUT = 25000;

const COLORS = {
  bg: 0x1A1A2E,
  compositeBlock: '#F5F0E8',
  compositeBlockHex: 0xF5F0E8,
  primeBlock: '#A8D8EA',
  primeBlockHex: 0xA8D8EA,
  blockText: '#2C3E50',
  sliceTrail: 0xFF6B35,
  factorBurst: 0xFFD93D,
  stackDanger: 0xE84393,
  dangerBorder: 0xFF2D6B,
  hudBg: 0x16213E,
  hudText: '#FFFFFF',
  comboText: '#F9C74F',
  ceilingLine: 0xFF0000,
  bossBlock: '#8B2635',
  bossBlockHex: 0x8B2635
};

const SCORE_VALUES = {
  cutBase: 100,
  threeFactorBase: 250,
  primeDissolve: 20,
  speedBonus: 50,
  stageClear: 500,
  comboLink: 100,
  wrongCutPenalty: -10
};

// Difficulty parameters by stage range
const DIFFICULTY = [
  { minStage: 1,  maxStage: 5,  speed: 70,  spawnInterval: 2000, maxSimult: 2, compositeRatio: 0.35, threePrimeChance: 0 },
  { minStage: 6,  maxStage: 10, speed: 85,  spawnInterval: 1600, maxSimult: 3, compositeRatio: 0.45, threePrimeChance: 0 },
  { minStage: 11, maxStage: 15, speed: 100, spawnInterval: 1200, maxSimult: 4, compositeRatio: 0.50, threePrimeChance: 0.05 },
  { minStage: 16, maxStage: 20, speed: 110, spawnInterval: 1000, maxSimult: 5, compositeRatio: 0.55, threePrimeChance: 0.05 },
  { minStage: 21, maxStage: 30, speed: 120, spawnInterval: 850,  maxSimult: 6, compositeRatio: 0.60, threePrimeChance: 0.10 },
  { minStage: 31, maxStage: 50, speed: 130, spawnInterval: 720,  maxSimult: 7, compositeRatio: 0.65, threePrimeChance: 0.10 },
  { minStage: 51, maxStage: 999,speed: 140, spawnInterval: 600,  maxSimult: 8, compositeRatio: 0.70, threePrimeChance: 0.15 }
];

// Number ceiling per stage
function getNumberCeiling(stage) {
  return Math.min(20 + stage * 8, 500);
}

// SVG strings
const SVG_COMPOSITE_BLOCK = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">' +
  '<rect x="2" y="2" width="76" height="56" rx="6" ry="6" fill="#F5F0E8" stroke="#D4C5A9" stroke-width="2"/>' +
  '<rect x="4" y="4" width="72" height="52" rx="4" ry="4" fill="none" stroke="#E8DFCC" stroke-width="1"/></svg>';

const SVG_PRIME_BLOCK = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">' +
  '<rect x="2" y="2" width="76" height="56" rx="6" ry="6" fill="#A8D8EA" stroke="#7EC8E3" stroke-width="2"/>' +
  '<circle cx="68" cy="12" r="8" fill="#5BA4CF"/>' +
  '<text x="68" y="16" text-anchor="middle" font-size="9" fill="#FFFFFF" font-family="Arial" font-weight="bold">P</text></svg>';

const SVG_BOSS_BLOCK = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90" viewBox="0 0 120 90">' +
  '<rect x="2" y="2" width="116" height="86" rx="8" ry="8" fill="#8B2635" stroke="#C0392B" stroke-width="3"/>' +
  '<line x1="60" y1="10" x2="55" y2="45" stroke="#FF6B35" stroke-width="2" opacity="0.6"/>' +
  '<line x1="55" y1="45" x2="65" y2="80" stroke="#FF6B35" stroke-width="2" opacity="0.6"/></svg>';

const SVG_PARTICLE = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">' +
  '<circle cx="4" cy="4" r="4" fill="#FFD93D"/></svg>';

const SVG_PARTICLE_BLUE = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">' +
  '<circle cx="4" cy="4" r="4" fill="#A8D8EA"/></svg>';
