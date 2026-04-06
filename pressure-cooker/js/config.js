// Pressure Cooker - Game Configuration
const COLORS = {
  chamberBody: '#2A3A4A',
  chamberBorder: '#4A6A8A',
  fillLow: '#F5D76E',
  fillMid: '#E8721A',
  fillHigh: '#E8251A',
  fillCritical: '#FFFFFF',
  hotBorder: '#FF8C00',
  lockedOverlay: '#1A1A2A',
  multiplierBorder: '#9B59B6',
  background: '#0D1A26',
  hudText: '#E8F4FF',
  timerBar: '#00CFFF',
  dangerText: '#FF3333',
  ventFlash: '#AADDFF',
  nearMiss: '#FFDD00',
  clutchGold: '#FFD700',
  explosion: '#FF6B00',
  explosionRed: '#FF2222',
  deathFlash: '#CC0000',
  scoreFloat: '#FFFFFF',
  stageBonus: '#00CFFF'
};

const SCORE_VALUES = {
  perSecond: 10,
  perSecondAllBelow50Mult: 2,
  stageClearBase: 200,
  stageClearCleanMult: 1.5,
  nearMiss: 50,
  nearMissChainMult: 2,
  cascadeSurvived: 25,
  clutchMultiplier: 2,
  clutchDuration: 4000
};

const DIFFICULTY = {
  baseFillRate: 8,
  fillRateGrowth: 0.3,
  baseStageDuration: 15000,
  stageDurationDecay: 150,
  minStageDuration: 8000,
  fillRateVarianceBase: 0.1,
  fillRateVarianceGrowth: 0.012,
  maxFillRateVariance: 0.5,
  lockedCycleDuration: 8000,
  restStageInterval: 7,
  restFillRateReduction: 0.85,
  nearMissThreshold: 85,
  clutchThreshold: 75,
  clutchChainRequired: 3,
  inactivityDeathMs: 25000
};

const LAYOUT = {
  hudHeight: 60,
  timerHeight: 14,
  chamberGap: 12,
  chamberConfigs: {
    3: { cols: 3, rows: 1, w: 100, h: 200 },
    4: { cols: 4, rows: 1, w: 80, h: 200 },
    5: { cols: 5, rows: 1, w: 70, h: 200 },
    6: { cols: 3, rows: 2, w: 100, h: 140 },
    7: { cols: 4, rows: 2, w: 85, h: 140 }
  }
};

const SVG_STRINGS = {
  chamber: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="160" viewBox="0 0 80 160">' +
    '<rect x="4" y="4" width="72" height="152" rx="8" ry="8" fill="#2A3A4A" stroke="#4A6A8A" stroke-width="3"/>' +
    '<line x1="10" y1="110" x2="70" y2="110" stroke="#4A6A8A" stroke-width="1" opacity="0.6"/>' +
    '<line x1="10" y1="62" x2="70" y2="62" stroke="#4A6A8A" stroke-width="1" opacity="0.6"/>' +
    '<line x1="10" y1="22" x2="70" y2="22" stroke="#E8251A" stroke-width="1.5" opacity="0.8"/>' +
    '<circle cx="40" cy="14" r="6" fill="none" stroke="#4A6A8A" stroke-width="2"/>' +
    '<line x1="34" y1="14" x2="46" y2="14" stroke="#4A6A8A" stroke-width="2"/>' +
    '</svg>',
  hotOverlay: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="160" viewBox="0 0 80 160">' +
    '<rect x="2" y="2" width="76" height="156" rx="9" ry="9" fill="none" stroke="#FF8C00" stroke-width="4" opacity="0.9"/>' +
    '</svg>',
  lockedOverlay: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="160" viewBox="0 0 80 160">' +
    '<rect x="4" y="4" width="72" height="152" rx="8" fill="#1A1A2A" opacity="0.75"/>' +
    '<rect x="28" y="72" width="24" height="18" rx="3" fill="#4A6A8A"/>' +
    '<path d="M31 72 Q31 62 40 62 Q49 62 49 72" fill="none" stroke="#4A6A8A" stroke-width="3"/>' +
    '</svg>',
  multiplierOverlay: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="160" viewBox="0 0 80 160">' +
    '<rect x="2" y="2" width="76" height="156" rx="9" ry="9" fill="none" stroke="#9B59B6" stroke-width="4" opacity="0.9"/>' +
    '</svg>',
  particle: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">' +
    '<circle cx="4" cy="4" r="4" fill="#FF6B00"/></svg>',
  particleWhite: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">' +
    '<circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>',
  particleRed: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">' +
    '<circle cx="4" cy="4" r="4" fill="#FF2222"/></svg>',
  steam: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="12" viewBox="0 0 4 12">' +
    '<ellipse cx="2" cy="6" rx="2" ry="6" fill="#FFFFFF" opacity="0.4"/></svg>'
};
