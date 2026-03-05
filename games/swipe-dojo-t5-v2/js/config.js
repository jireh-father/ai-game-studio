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

// Swipe trail config
const TRAIL = {
  MAX_POINTS: 15,
  LINE_WIDTH: 4,
  FADE_MS: 300,
  PARTICLES_PER_SEGMENT: 3,
  PARTICLE_SPEED_MIN: 40,
  PARTICLE_SPEED_MAX: 120,
  PARTICLE_LIFE: 250
};

// Multi-arrow burst config
const BURST = {
  MIN_STAGE: 8,
  CHANCE: 0.15,
  MIN_ARROWS: 2,
  MAX_ARROWS: 3,
  GAP_MS: 250,
  BONUS_PER_ARROW: 50
};

// Bass drop config
const BASS_DROP = {
  SILENCE_MS: 150,
  FREQ: 60,
  DECAY_MS: 0.2,
  GAIN: 0.6
};

// Arrow approach animation config
const ARROW_APPROACH = {
  START_SCALE: 0.3,
  DURATION_MS: 350,
  EASE: 'Back.easeOut'
};

// Reactive music layer thresholds
const MUSIC_LAYERS = {
  MELODY_COMBO: 10,
  PAD_COMBO: 20,
  ARPEGGIO_COMBO: 30
};

const STORAGE_KEYS = {
  HIGH_SCORE: 'swipe-dojo_high_score',
  GAMES_PLAYED: 'swipe-dojo_games_played',
  HIGHEST_STAGE: 'swipe-dojo_highest_stage',
  SETTINGS: 'swipe-dojo_settings',
  TOTAL_SCORE: 'swipe-dojo_total_score'
};
