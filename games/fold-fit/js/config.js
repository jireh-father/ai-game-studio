// Fold Fit - Configuration & Constants

const COLORS = {
  paper: '#F5F0E8',
  paperShadow: '#D4CFC7',
  foldLine: '#2C3E6B',
  tearLine: '#C0392B',
  target: '#5CA4A9',
  targetFill: 'rgba(92,164,169,0.2)',
  background: '#E8DCC8',
  success: '#D4A935',
  danger: '#E74C3C',
  uiText: '#2C2C2C',
  uiSecondary: '#8B7355',
  menuBg: '#1A2744',
  white: '#F5F0E8',
  combo: '#D4A935'
};

const COLORS_INT = {
  paper: 0xF5F0E8,
  paperShadow: 0xD4CFC7,
  foldLine: 0x2C3E6B,
  tearLine: 0xC0392B,
  target: 0x5CA4A9,
  background: 0xE8DCC8,
  success: 0xD4A935,
  danger: 0xE74C3C,
  uiText: 0x2C2C2C,
  uiSecondary: 0x8B7355,
  menuBg: 0x1A2744,
  white: 0xF5F0E8
};

const SCORING = {
  correctFold: 50,
  foldBonus: 10,
  stageClear: 100,
  perfectMultiplier: 1.5,
  speedBonusMax: 100,
  speedBonusFast: 5,
  speedBonusSlow: 15,
  comboStep: 0.5,
  comboMax: 4
};

const SIZES = {
  paperMinW: 200, paperMaxW: 280,
  targetSize: 100,
  touchTarget: 44,
  foldDetectDist: 40,
  minSwipeLen: 50,
  swipeAngleTolerance: 50
};

const DIFFICULTY = [
  { maxStage: 5,  timer: 20, folds: 1, distractors: 0, tears: 0, orderMatters: false, undo: true },
  { maxStage: 10, timer: 18, folds: 2, distractors: 0, tears: 0, orderMatters: false, undo: true },
  { maxStage: 20, timer: 16, folds: 3, distractors: 1, tears: 0, orderMatters: true, undo: false },
  { maxStage: 30, timer: 14, folds: 3, distractors: 2, tears: 0, orderMatters: true, undo: false },
  { maxStage: 50, timer: 12, folds: 4, distractors: 2, tears: 1, orderMatters: true, undo: false },
  { maxStage: Infinity, timer: 12, folds: 4, distractors: 3, tears: 1, orderMatters: true, undo: false }
];

const SVG_STRINGS = {
  crane: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><polygon points="32,4 48,28 56,20 52,36 64,32 48,44 52,60 32,48 12,60 16,44 0,32 12,36 8,20 16,28" fill="#D4A935" stroke="#2C2C2C" stroke-width="1.5"/><line x1="32" y1="4" x2="32" y2="48" stroke="#2C2C2C" stroke-width="0.5"/></svg>`,
  diamondFilled: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="#E74C3C" stroke="#2C2C2C" stroke-width="1"/></svg>`,
  diamondEmpty: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="#8B7355" stroke-width="1.5"/></svg>`,
  pause: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="8" y="6" width="6" height="20" rx="2" fill="#2C2C2C"/><rect x="18" y="6" width="6" height="20" rx="2" fill="#2C2C2C"/></svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" rx="1" fill="#F5F0E8"/></svg>`,
  goldParticle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#D4A935"/></svg>`
};

function getDifficulty(stage) {
  for (const d of DIFFICULTY) {
    if (stage <= d.maxStage) return d;
  }
  return DIFFICULTY[DIFFICULTY.length - 1];
}

function isRestStage(stage) {
  return stage > 0 && stage % 5 === 0;
}
