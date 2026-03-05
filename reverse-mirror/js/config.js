// config.js - Game constants, palette, difficulty, SVG assets
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const HUD_HEIGHT = 52;
const SWIPE_MIN_DIST = 25;
const INACTIVITY_DEATH_MS = 8000;
const INACTIVITY_WARN_MS = 6000;
const MOVE_DIST = 50;
const BODY_SIZE = 30;
const COMBO_MULTIPLIER_CAP = 3.0;
const COMBO_MULTIPLIER_STEP = 0.15;

const PALETTE = {
  bg: 0x0A0E1A,
  bgHex: '#0A0E1A',
  mirror: 0x88DDFF,
  mirrorHex: '#88DDFF',
  mirrorGlow: 0x44AADD,
  realChar: 0xFF6B6B,
  realCharHex: '#FF6B6B',
  realOutline: 0xCC3333,
  reflChar: 0x6BDFFF,
  reflCharHex: '#6BDFFF',
  reflOutline: 0x3399CC,
  obstacle: 0x445566,
  obstacleEdge: 0x667788,
  gapGlow: 0x66FF99,
  dangerFlash: 0xFF2020,
  perfectFlash: 0xFFFFFF,
  uiText: '#EEEEFF',
  uiTextHex: 0xEEEEFF,
  uiBg: 0x0A0E1A,
  comboGlow: '#FF44CC',
  comboGlowHex: 0xFF44CC,
  livesFull: 0x88DDFF,
  livesEmpty: 0x334455,
  white: '#FFFFFF',
  whiteHex: 0xFFFFFF
};

const SCORE = {
  OBSTACLE_SURVIVED: 50,
  PERFECT_CENTER: 150,
  STAGE_CLEAR: 300,
  NO_DAMAGE_CLEAR: 500,
  ROTATION_SURVIVED: 200
};

const SVG_REAL = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
  <polygon points="15,2 28,15 15,28 2,15" fill="#FF6B6B" stroke="#CC3333" stroke-width="2.5"/>
  <circle cx="15" cy="15" r="5" fill="#FFFFFF" opacity="0.6"/>
</svg>`;

const SVG_REFL = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
  <polygon points="15,2 28,15 15,28 2,15" fill="#6BDFFF" stroke="#3399CC" stroke-width="2.5"/>
  <circle cx="15" cy="15" r="5" fill="#FFFFFF" opacity="0.6"/>
  <line x1="10" y1="10" x2="12" y2="12" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>
  <line x1="18" y1="10" x2="20" y2="12" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>
</svg>`;

const SVG_LIFE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 16 20">
  <polygon points="8,0 16,10 8,20 0,10" fill="#88DDFF" stroke="#44AADD" stroke-width="1"/>
</svg>`;

const SVG_LIFE_EMPTY = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 16 20">
  <polygon points="8,0 16,10 8,20 0,10" fill="#334455" stroke="#445566" stroke-width="1"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="3" fill="#FFFFFF"/>
</svg>`;

const SVG_PARTICLE_CYAN = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="3" fill="#88DDFF"/>
</svg>`;

const SVG_PARTICLE_MAGENTA = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="3" fill="#FF44CC"/>
</svg>`;

// Global game state
const GameState = {
  score: 0,
  stage: 1,
  lives: 3,
  combo: 0,
  highScore: 0,
  highStage: 0,
  gamesPlayed: 0,
  stageDamaged: false,
  settings: { sound: true, music: true, vibration: true }
};

function loadGameState() {
  try {
    GameState.highScore = parseInt(localStorage.getItem('reverse-mirror_high_score')) || 0;
    GameState.highStage = parseInt(localStorage.getItem('reverse-mirror_highest_stage')) || 0;
    GameState.gamesPlayed = parseInt(localStorage.getItem('reverse-mirror_games_played')) || 0;
    const s = JSON.parse(localStorage.getItem('reverse-mirror_settings'));
    if (s) GameState.settings = s;
  } catch(e) {}
}

function saveGameState() {
  try {
    localStorage.setItem('reverse-mirror_high_score', GameState.highScore);
    localStorage.setItem('reverse-mirror_highest_stage', GameState.highStage);
    localStorage.setItem('reverse-mirror_games_played', GameState.gamesPlayed);
    localStorage.setItem('reverse-mirror_settings', JSON.stringify(GameState.settings));
  } catch(e) {}
}

function resetGameState() {
  GameState.score = 0;
  GameState.stage = 1;
  GameState.lives = 3;
  GameState.combo = 0;
  GameState.stageDamaged = false;
}
