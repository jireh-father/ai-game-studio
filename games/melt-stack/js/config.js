// Melt Stack - Game Configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const BLOCK_HEIGHT = 40;
const INITIAL_WIDTH = 240;
const PERFECT_TOLERANCE = 2;
const FREEZE_DURATION = 1000;
const HIT_STOP_MS = 80;
const DEATH_DELAY_MS = 1200;
const BLOCKS_PER_STAGE = 10;
const INACTIVITY_DEATH_MS = 25000;

const BLOCK_COLORS = [0xFF6B6B, 0xFFE66D, 0x4ECDC4, 0xC77DFF, 0x95E06C];

const PALETTE = {
  bg: 0x1A1A2E,
  bgHex: '#1A1A2E',
  melt: 0xFF9500,
  meltCore: 0xFF3B00,
  text: 0xFFFFFF,
  hudBg: 0x000000,
  perfectFlash: 0x00CFFF,
  freezeTint: 0x00CFFF,
  danger: 0xFF9500,
  buttonBg: 0xFF6B6B,
  buttonAlt: 0x4ECDC4
};

const SCORE_VALUES = {
  normal: 10,
  perfect: 50,
  streakBonus: 10,
  stageMilestone: 100
};

const SVG_STRINGS = {
  meltGlow: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="80" viewBox="0 0 360 80">
    <defs><radialGradient id="mg" cx="50%" cy="100%" r="60%">
      <stop offset="0%" stop-color="#FF3B00" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#FF9500" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#FF9500" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="360" height="80" fill="url(#mg)"/>
  </svg>`,

  drip: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16">
    <ellipse cx="4" cy="4" rx="4" ry="4" fill="#FF9500" opacity="0.9"/>
    <polygon points="0,4 8,4 4,16" fill="#FF9500" opacity="0.9"/>
  </svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <polygon points="16,0 20,12 32,12 22,19 26,32 16,24 6,32 10,19 0,12 12,12"
             fill="#00CFFF" opacity="0.95"/>
  </svg>`,

  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="4" fill="#FFFFFF"/>
  </svg>`
};

const GameState = {
  score: 0,
  stage: 1,
  blocksDropped: 0,
  perfectStreak: 0,
  bestScore: parseInt(localStorage.getItem('melt-stack_high_score') || '0'),
  bestStage: parseInt(localStorage.getItem('melt-stack_best_stage') || '0'),
  soundEnabled: localStorage.getItem('melt-stack_settings.sound') !== 'false',

  reset() {
    this.score = 0;
    this.stage = 1;
    this.blocksDropped = 0;
    this.perfectStreak = 0;
  },

  addScore(pts) {
    const mult = this.perfectStreak >= 3 ? 1.5 : 1;
    this.score += Math.floor(pts * mult);
  },

  saveBest() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('melt-stack_high_score', this.bestScore.toString());
    }
    if (this.stage > this.bestStage) {
      this.bestStage = this.stage;
      localStorage.setItem('melt-stack_best_stage', this.bestStage.toString());
    }
  }
};
