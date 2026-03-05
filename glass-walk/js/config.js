// Glass Walk - Configuration & Constants
const COLORS = {
  safeGlass: 0xE8F0FE,
  safeGlow: 0x80D8FF,
  fakeGlass: 0xFFF8E1,
  crackLine: 0x455A64,
  background: 0x0D1B2A,
  bridgeFrame: 0x37474F,
  danger: 0xFF1744,
  reward: 0xFFD600,
  uiText: 0xFFFFFF,
  timerGreen: 0x66BB6A,
  timerYellow: 0xFFC107,
  timerRed: 0xFF1744,
  timerOrange: 0xFF6D00,
  overlay: 0x000000
};

const SCORE = {
  safeStep: 100,
  quickBonus: 50,
  perfectBonus: 100,
  milestoneBonus: 200,
  quickThreshold: 2000,
  perfectThreshold: 1000,
  streakMultipliers: { 3: 1.5, 6: 2.0, 10: 3.0 }
};

const DIFFICULTY = {
  baseLives: 3,
  standingTimer: 6,
  inactivityTimeout: 30000,
  flashBase: 0.8,
  flashDecay: 0.03,
  flashMin: 0.2,
  cueBase: 1.0,
  cueDecay: 0.035,
  cueMin: 0.15,
  restEvery: 8,
  restCueBoost: 0.2,
  restFlashBoost: 0.2,
  milestoneEvery: 5,
  maxSamePosition: 2
};

const TIER = {
  1: { stages: [1, 5], panels: 2, cue: 'cracks', desc: 'Obvious cracks' },
  2: { stages: [6, 9], panels: 2, cue: 'density', desc: 'Crack density' },
  3: { stages: [10, 14], panels: 3, cue: 'glow', desc: 'Inner glow' },
  4: { stages: [15, 19], panels: 3, cue: 'weight', desc: 'Weight pressure' },
  5: { stages: [20, 999], panels: 3, cue: 'shift', desc: 'Pattern shift' }
};

const SVG = {};
SVG.player = `<svg viewBox="0 0 30 50" xmlns="http://www.w3.org/2000/svg">
  <circle cx="15" cy="8" r="6" fill="#ECEFF1" stroke="#37474F" stroke-width="1.5"/>
  <line x1="15" y1="14" x2="15" y2="32" stroke="#ECEFF1" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="15" y1="20" x2="6" y2="26" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
  <line x1="15" y1="20" x2="24" y2="26" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
  <line x1="15" y1="32" x2="8" y2="45" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
  <line x1="15" y1="32" x2="22" y2="45" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
</svg>`;

SVG.heart = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF1744"/>
</svg>`;

SVG.heartEmpty = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#37474F" stroke="#546E7A" stroke-width="1"/>
</svg>`;

SVG.shard = `<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
  <polygon points="0,6 6,0 12,8" fill="#E8F0FE" fill-opacity="0.8" stroke="#B0BEC5" stroke-width="0.5"/>
</svg>`;

SVG.particle = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="4" r="3" fill="#80D8FF"/>
</svg>`;

SVG.goldParticle = `<svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="4" r="3" fill="#FFD600"/>
</svg>`;

const GRADE_TABLE = [
  { min: 3000, grade: 'S', color: '#FFD600' },
  { min: 2000, grade: 'A', color: '#80D8FF' },
  { min: 1200, grade: 'B', color: '#66BB6A' },
  { min: 600, grade: 'C', color: '#FFC107' },
  { min: 0, grade: 'D', color: '#FF6D00' }
];

function getGrade(score) {
  for (const g of GRADE_TABLE) {
    if (score >= g.min) return g;
  }
  return GRADE_TABLE[GRADE_TABLE.length - 1];
}

const LS_KEYS = {
  highScore: 'glass-walk_high_score',
  highRow: 'glass-walk_high_row',
  gamesPlayed: 'glass-walk_games_played',
  sound: 'glass-walk_sound'
};

function lsGet(key, def) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : def; }
  catch (e) { return def; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}
