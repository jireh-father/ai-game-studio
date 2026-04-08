// Number Baseball Pro - Config
const GAME_WIDTH = 400;
const GAME_HEIGHT = 720;

const PALETTE = {
  bg: 0x0a0e1a,
  bgWorried: 0x2a1a3e,
  bgCritical: 0x3a1020,
  bgSpeed: 0x3a1a05,
  bgBoss: 0x1a1405,
  bgForbidden: 0x260806,
  bgAmnesia: 0x1a1d26,
  bgLiar: 0x260818,
  panel: 0x1a2238,
  panelLight: 0x2a3556,
  border: 0x3d5a80,
  text: 0xffffff,
  textDim: 0x8a96b8,
  accent: 0x4cc9f0,
  accentGold: 0xffd166,
  strike: 0xffd700,
  ball: 0x4cc9f0,
  miss: 0x444444,
  out: 0x6c757d,
  success: 0x06d6a0,
  danger: 0xff5a5f,
  keypadBg: 0x1f2942,
  keypadActive: 0x4cc9f0,
  forbidden: 0xff2a3a,
  // Temperatures
  tempBurning: 0xff3030,
  tempWarm: 0xff9030,
  tempCool: 0x70c0ff,
  tempFreezing: 0x3060ff,
};

const COLORS_HEX = {
  text: '#ffffff', dim: '#8a96b8', accent: '#4cc9f0', gold: '#ffd166',
  strike: '#ffd700', ball: '#4cc9f0', miss: '#666666',
  success: '#06d6a0', danger: '#ff5a5f',
  burning: '#ff3030', warm: '#ff9030', cool: '#70c0ff', freezing: '#3060ff',
  forbidden: '#ff2a3a', amnesia: '#a0a8b8', liar: '#ff4080', boss: '#ffd700', speed: '#ff8020'
};

const SCORE = {
  base: 100,
  perStage: 50,
  perAttempt: 30,
  perSecond: 4,
  perfectBonus: 200,
};

const INACTIVITY_DEATH_MS = 30000;

const GameState = {
  score: 0,
  stage: 1,
  totalGuesses: 0,
  totalTime: 0,
  bestScore: 0,
  bestStage: 0,
  powerups: [], // array of strings: 'reveal','time','ghost','strike_boost'
  reset() {
    this.score = 0; this.stage = 1; this.totalGuesses = 0; this.totalTime = 0;
    this.powerups = [];
  },
  loadBest() {
    try {
      this.bestScore = parseInt(localStorage.getItem('nbp_best_score') || '0', 10);
      this.bestStage = parseInt(localStorage.getItem('nbp_best_stage') || '0', 10);
    } catch (e) {}
  },
  saveBest() {
    try {
      if (this.score > this.bestScore) localStorage.setItem('nbp_best_score', String(this.score));
      if (this.stage > this.bestStage) localStorage.setItem('nbp_best_stage', String(this.stage));
      this.loadBest();
    } catch (e) {}
  },
  addScore(n) { this.score = Math.max(0, this.score + n); }
};
