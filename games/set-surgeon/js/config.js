// Set Surgeon - Game Configuration
const CONFIG = {
  GAME_WIDTH: 390,
  GAME_HEIGHT: 700,

  COLORS: {
    BG: '#F8FAFC',
    CIRCLE_A: '#FF6B6B',
    CIRCLE_B: '#4ECDC4',
    CIRCLE_C: '#FFE66D',
    HOVER: '#C3B1E1',
    CORRECT: '#2ECC71',
    WRONG: '#E74C3C',
    TIMER_ACTIVE: '#F39C12',
    TIMER_CRITICAL: '#E74C3C',
    HUD_BG: '#2D3436',
    HUD_TEXT: '#FFFFFF',
    BUTTON: '#00B894',
    STREAK: '#FDCB6E',
    ELEMENT_STROKE: '#2D3436'
  },

  CIRCLES: {
    A: { x: 148, y: 230, r: 110 },
    B: { x: 242, y: 230, r: 110 },
    C: { x: 195, y: 310, r: 110 }
  },

  REGION_CENTERS: {
    A_ONLY: { x: 100, y: 200 },
    B_ONLY: { x: 290, y: 200 },
    C_ONLY: { x: 195, y: 390 },
    AB: { x: 195, y: 185 },
    AC: { x: 130, y: 300 },
    BC: { x: 260, y: 300 },
    ABC: { x: 195, y: 260 }
  },

  SCORE: {
    FIRST_TRY: 100,
    SECOND_TRY: 50,
    THIRD_TRY: 20,
    SPEED_FAST: 30,
    SPEED_MED: 10,
    ROUND_PERFECT: 200,
    STREAK_3: 1.5,
    STREAK_6: 2.0,
    STREAK_10: 3.0,
    SPEED_FAST_MS: 2000,
    SPEED_MED_MS: 4000
  },

  DIFFICULTY: [
    { minRound: 1,  maxRound: 5,  tier: 1, elements: 4, timer: 6000, hintTime: 2000 },
    { minRound: 6,  maxRound: 10, tier: 2, elements: 5, timer: 6000, hintTime: 1000 },
    { minRound: 11, maxRound: 20, tier: 3, elements: 6, timer: 5000, hintTime: 0 },
    { minRound: 21, maxRound: 35, tier: 4, elements: 7, timer: 5000, hintTime: 0 },
    { minRound: 36, maxRound: 999, tier: 5, elements: 8, timer: 4000, hintTime: 0 }
  ],

  LIVES: 3,
  SPAWN_Y: 580,
  ELEMENT_SIZE: 40,
  HUD_HEIGHT: 52
};

// SVG strings for element types
const SVG_STRINGS = {
  redCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="#FF6B6B" stroke="#2D3436" stroke-width="2"/></svg>`,
  blueTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><polygon points="20,4 36,36 4,36" fill="#4ECDC4" stroke="#2D3436" stroke-width="2"/></svg>`,
  greenSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect x="4" y="4" width="32" height="32" fill="#2ECC71" stroke="#2D3436" stroke-width="2"/></svg>`,
  yellowPentagon: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><polygon points="20,4 36,14 30,34 10,34 4,14" fill="#FFE66D" stroke="#2D3436" stroke-width="2"/></svg>`,
  purpleStar: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><polygon points="20,3 24,14 36,14 27,21 30,33 20,26 10,33 13,21 4,14 16,14" fill="#C3B1E1" stroke="#2D3436" stroke-width="2"/></svg>`,
  lifeFull: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="20" rx="2" fill="#FFFFFF"/><rect x="2" y="9" width="20" height="6" rx="2" fill="#FFFFFF"/></svg>`,
  lifeEmpty: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="20" rx="2" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.3"/><rect x="2" y="9" width="20" height="6" rx="2" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.3"/></svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>`
};

// Shape type definitions
const SHAPES = {
  CIRCLE: { name: 'circle', color: '#FF6B6B', texture: 'redCircle', pointy: false, sides: 0, round: true },
  TRIANGLE: { name: 'triangle', color: '#4ECDC4', texture: 'blueTriangle', pointy: true, sides: 3, round: false },
  SQUARE: { name: 'square', color: '#2ECC71', texture: 'greenSquare', pointy: false, sides: 4, round: false },
  PENTAGON: { name: 'pentagon', color: '#FFE66D', texture: 'yellowPentagon', pointy: false, sides: 5, round: false },
  STAR: { name: 'star', color: '#C3B1E1', texture: 'purpleStar', pointy: true, sides: 5, round: false }
};

const SHAPE_LIST = [SHAPES.CIRCLE, SHAPES.TRIANGLE, SHAPES.SQUARE, SHAPES.PENTAGON, SHAPES.STAR];
const COLOR_NAMES = { '#FF6B6B': 'red', '#4ECDC4': 'blue', '#2ECC71': 'green', '#FFE66D': 'yellow', '#C3B1E1': 'purple' };

// Global game state
const GameState = {
  score: 0,
  round: 1,
  lives: CONFIG.LIVES,
  streak: 0,
  multiplier: 1.0,
  highScore: 0,
  gamesPlayed: 0,
  soundOn: true,
  lastInputTime: Date.now()
};

// Load high score from localStorage
try {
  const saved = localStorage.getItem('set-surgeon_high_score');
  if (saved) GameState.highScore = parseInt(saved, 10) || 0;
} catch (e) {}
