// Swipe Dojo - Game Configuration
'use strict';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const SWIPE_MIN_DIST = 30;
const INACTIVITY_DEATH_MS = 15000;

const PALETTE = {
  bg: 0x0D0F1A,
  bgHex: '#0D0F1A',
  player: '#F0EDE0',
  playerFill: 0xF0EDE0,
  playerOutline: '#D4A017',
  playerOutlineFill: 0xD4A017,
  enemy: '#C0392B',
  enemyFill: 0xC0392B,
  enemyOutline: '#7B241C',
  enemyOutlineFill: 0x7B241C,
  arrowUp: 0x00F5FF,
  arrowDown: 0xFF00AA,
  arrowLeft: 0x39FF14,
  arrowRight: 0xFF6B00,
  arrowUpHex: '#00F5FF',
  arrowDownHex: '#FF00AA',
  arrowLeftHex: '#39FF14',
  arrowRightHex: '#FF6B00',
  dangerFlash: 0xFF0000,
  successFlash: 0xFFFFFF,
  uiText: '#F5F5F5',
  uiTextFill: 0xF5F5F5,
  uiBg: 0x000000,
  comboGlow: 0xFFD700,
  comboGlowHex: '#FFD700',
  hpFull: 0x00FF88,
  hpLow: 0xFF3030,
  hpTrack: 0x1A1A2E,
  hpBorder: 0x444466
};

const DIRECTION_COLORS = {
  UP: PALETTE.arrowUp,
  DOWN: PALETTE.arrowDown,
  LEFT: PALETTE.arrowLeft,
  RIGHT: PALETTE.arrowRight
};

const DIRECTION_HEX = {
  UP: PALETTE.arrowUpHex,
  DOWN: PALETTE.arrowDownHex,
  LEFT: PALETTE.arrowLeftHex,
  RIGHT: PALETTE.arrowRightHex
};

const SCORE = {
  PERFECT_BLOCK: 100,
  GOOD_BLOCK: 60,
  LATE_BLOCK: 30,
  ENEMY_DEFEAT: 200,
  STAGE_CLEAR: 500,
  PERFECT_STAGE: 1000
};

const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const ENEMY_VARIANTS = ['basic', 'fast', 'tank', 'tricky', 'boss'];

const ENEMY_NAMES = [
  'Shadow Grunt', 'Iron Fist', 'Swift Blade', 'Dark Monk', 'Storm Sensei',
  'Red Claw', 'Night Striker', 'Stone Golem', 'Wind Dancer', 'Fire Lord',
  'Ghost Fang', 'Steel Viper', 'Frost Ronin', 'Thunder Palm', 'Void Walker',
  'Blade Widow', 'Sand Scorpion', 'Moon Reaper', 'Blood Hawk', 'Bone Crusher',
  'Silk Phantom', 'Ash Demon', 'Gold Mantis', 'Jade Serpent', 'Obsidian King',
  'Crystal Wraith', 'Ember Shogun', 'Thorn Samurai', 'Dusk Ninja', 'Dawn Master'
];

const VARIANT_COLORS = {
  basic: 0xC0392B,
  fast: 0x2980B9,
  tank: 0x7D3C98,
  tricky: 0xF39C12,
  boss: 0xE74C3C
};

const VARIANT_OUTLINES = {
  basic: 0x7B241C,
  fast: 0x1A5276,
  tank: 0x4A235A,
  tricky: 0xB7950B,
  boss: 0x922B21
};

const STORAGE_KEYS = {
  HIGH_SCORE: 'swipe-dojo_high_score',
  GAMES_PLAYED: 'swipe-dojo_games_played',
  HIGHEST_STAGE: 'swipe-dojo_highest_stage',
  SETTINGS: 'swipe-dojo_settings',
  TOTAL_SCORE: 'swipe-dojo_total_score',
  HIGHEST_BELT: 'swipe-dojo_highest_belt'
};

// Belt Rank Progression
const BELT_RANKS = [
  { name: 'White Belt', stage: 0, color: '#F0EDE0', fill: 0xF0EDE0, outline: '#D4A017', outlineFill: 0xD4A017 },
  { name: 'Yellow Belt', stage: 5, color: '#FFD700', fill: 0xFFD700, outline: '#B8960F', outlineFill: 0xB8960F },
  { name: 'Green Belt', stage: 10, color: '#39FF14', fill: 0x39FF14, outline: '#1B8A00', outlineFill: 0x1B8A00 },
  { name: 'Blue Belt', stage: 15, color: '#00AAFF', fill: 0x00AAFF, outline: '#005588', outlineFill: 0x005588 },
  { name: 'Brown Belt', stage: 25, color: '#8B4513', fill: 0x8B4513, outline: '#5C2D0E', outlineFill: 0x5C2D0E },
  { name: 'Black Belt', stage: 40, color: '#222222', fill: 0x222222, outline: '#FFD700', outlineFill: 0xFFD700 }
];

// Environment Themes
const ENVIRONMENTS = [
  { name: 'Training Dojo', stageMin: 1, stageMax: 9, bg: 0x0D0F1A, particleColor: 0x3344AA },
  { name: 'Forest Temple', stageMin: 10, stageMax: 19, bg: 0x1A1008, particleColor: 0xFF8C00 },
  { name: 'Mountain Shrine', stageMin: 20, stageMax: 29, bg: 0x1A0808, particleColor: 0xFF3030 },
  { name: 'Volcano Forge', stageMin: 30, stageMax: 39, bg: 0x140A1A, particleColor: 0xAA44FF },
  { name: 'Cloud Palace', stageMin: 40, stageMax: 999, bg: 0x081418, particleColor: 0x00F5FF }
];

// Rage Meter
const RAGE = {
  MAX: 100,
  GAIN_PERFECT: 25,
  GAIN_GOOD: 12,
  GAIN_LATE: 0,
  DECAY_PER_SEC: 5,
  SPECIAL_DAMAGE: 3,
  COOLDOWN_MS: 3000
};

// Swipe Trail
const TRAIL = {
  FADE_MS: 250,
  LINE_WIDTH: 4,
  MAX_POINTS: 30
};
