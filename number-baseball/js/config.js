// Number Baseball - Config
const GAME_WIDTH = 400;
const GAME_HEIGHT = 720;

const PALETTE = {
  bg: 0x0a0e1a,
  bgAccent: 0x141a2e,
  panel: 0x1a2238,
  panelLight: 0x2a3556,
  border: 0x3d5a80,
  text: 0xffffff,
  textDim: 0x8a96b8,
  accent: 0x4cc9f0,
  accentGold: 0xffd166,
  strike: 0xff5a5f,
  ball: 0x4cc9f0,
  out: 0x6c757d,
  success: 0x06d6a0,
  danger: 0xff5a5f,
  keypadBg: 0x1f2942,
  keypadActive: 0x4cc9f0,
};

const COLORS_HEX = {
  text: '#ffffff', dim: '#8a96b8', accent: '#4cc9f0', gold: '#ffd166',
  strike: '#ff5a5f', ball: '#4cc9f0', success: '#06d6a0', danger: '#ff5a5f'
};

// Difficulty curve — infinite stages
function getStageConfig(stage) {
  // Stage 1: 3 digits, 12 attempts, 100s
  // Each stage: digits +0 every 2 stages (max 6), attempts -1 (min 6), time -8s (min 30s)
  let digits = Math.min(3 + Math.floor((stage - 1) / 3), 6);
  let attempts = Math.max(12 - Math.floor((stage - 1) / 1), 6);
  let timeSec = Math.max(100 - (stage - 1) * 8, 30);
  return { digits, attempts, timeSec };
}

const SCORE = {
  base: 100,
  perStage: 50,
  remainingAttempt: 30,
  remainingSecond: 4,
  perfectBonus: 200,
  hintCost: 50,
};

const INACTIVITY_DEATH_MS = 30000;

const GameState = {
  score: 0,
  stage: 1,
  totalGuesses: 0,
  totalTime: 0,
  bestScore: 0,
  bestStage: 0,
  reset() {
    this.score = 0; this.stage = 1; this.totalGuesses = 0; this.totalTime = 0;
  },
  loadBest() {
    try {
      this.bestScore = parseInt(localStorage.getItem('nb_best_score') || '0', 10);
      this.bestStage = parseInt(localStorage.getItem('nb_best_stage') || '0', 10);
    } catch (e) {}
  },
  saveBest() {
    try {
      if (this.score > this.bestScore) localStorage.setItem('nb_best_score', String(this.score));
      if (this.stage > this.bestStage) localStorage.setItem('nb_best_stage', String(this.stage));
      this.loadBest();
    } catch (e) {}
  },
  addScore(n) { this.score = Math.max(0, this.score + n); }
};
