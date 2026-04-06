// config.js — Ragdoll Rodeo constants, colors, SVG assets, difficulty params

const GAME_WIDTH = 400;
const GAME_HEIGHT = 700;

const COLORS = {
  bullRed: 0xC0392B,
  goldYellow: 0xF1C40F,
  arenaSand: 0xE8D5A3,
  hotOrange: 0xE67E22,
  brightGreen: 0x2ECC71,
  darkBrown: 0x3D2B1F,
  warmTan: 0xD4A76A,
  deepBlue: 0x2C3E50,
  denimBlue: 0x2980B9,
  saddleBrown: 0x8B6914,
  ropeTan: 0xC8A96A,
  white: 0xFFFFFF,
  black: 0x000000
};

const COLORS_HEX = {
  bullRed: '#C0392B', goldYellow: '#F1C40F', arenaSand: '#E8D5A3',
  hotOrange: '#E67E22', brightGreen: '#2ECC71', darkBrown: '#3D2B1F',
  warmTan: '#D4A76A', deepBlue: '#2C3E50', denimBlue: '#2980B9',
  saddleBrown: '#8B6914', ropeTan: '#C8A96A'
};

const SCORE = {
  perSecond: 10, reGrip: 50, nearMiss: 100, stageClear: 200,
  crowdCheer: 75, perfectMultiplier: 3, lowGripMultiplier: 2
};

const DIFFICULTY = {
  baseDrainPerSec: 25, // % per second
  baseRecoveryPerSec: 50,
  stages: [
    { maxStage: 2,  drainMult: 0.8,  regripWindow: 600, restGap: 1200, maxVel: 4,  patterns: ['buck'] },
    { maxStage: 5,  drainMult: 1.0,  regripWindow: 500, restGap: 1000, maxVel: 6,  patterns: ['buck','spin'] },
    { maxStage: 9,  drainMult: 1.2,  regripWindow: 400, restGap: 800,  maxVel: 9,  patterns: ['buck','spin','charge'] },
    { maxStage: 14, drainMult: 1.4,  regripWindow: 300, restGap: 500,  maxVel: 13, patterns: ['buck','spin','charge','jump'] },
    { maxStage: 19, drainMult: 1.6,  regripWindow: 300, restGap: 400,  maxVel: 15, patterns: ['buck','spin','charge','jump','stutter'] },
    { maxStage: 29, drainMult: 1.8,  regripWindow: 250, restGap: 300,  maxVel: 18, patterns: ['buck','spin','charge','jump','stutter'] },
    { maxStage: 999,drainMult: 2.2,  regripWindow: 150, restGap: 300,  maxVel: 18, patterns: ['buck','spin','charge','jump','stutter'] }
  ]
};

const BUCK_PATTERNS = {
  buck:    { duration: 800,  forceX: 0,   forceY: -1,  rotation: 0.05 },
  spin:    { duration: 1200, forceX: 0.4, forceY: -0.6, rotation: 0.15 },
  charge:  { duration: 1000, forceX: 1,   forceY: -0.3, rotation: 0.03 },
  jump:    { duration: 1400, forceX: 0,   forceY: -1.5, rotation: 0.08 },
  stutter: { duration: 600,  forceX: 0.2, forceY: -0.8, rotation: 0.1 }
};

function getSurvivalTime(stage) {
  if (stage <= 3) return 6;
  if (stage <= 8) return 8;
  if (stage <= 15) return 10;
  return 12;
}

function getDifficultyForStage(stage) {
  for (const d of DIFFICULTY.stages) {
    if (stage <= d.maxStage) return d;
  }
  return DIFFICULTY.stages[DIFFICULTY.stages.length - 1];
}

// SVG assets
const BULL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="70" viewBox="0 0 80 70">
<ellipse cx="40" cy="35" rx="32" ry="22" fill="#C0392B" stroke="#1a0a00" stroke-width="3"/>
<ellipse cx="10" cy="28" rx="14" ry="12" fill="#C0392B" stroke="#1a0a00" stroke-width="3"/>
<path d="M4 18 Q0 8 8 12" stroke="#F1C40F" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M16 16 Q20 6 12 10" stroke="#F1C40F" stroke-width="3" fill="none" stroke-linecap="round"/>
<ellipse cx="7" cy="26" rx="3" ry="2.5" fill="white" stroke="#1a0a00" stroke-width="1"/>
<circle cx="7" cy="26" r="1.5" fill="#1a0a00"/>
<path d="M4 22 L10 24" stroke="#1a0a00" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="3" cy="32" rx="3" ry="2" fill="none" stroke="#C0C0C0" stroke-width="2"/>
<rect x="18" y="52" width="8" height="14" rx="2" fill="#A0281E" stroke="#1a0a00" stroke-width="2"/>
<rect x="32" y="52" width="8" height="14" rx="2" fill="#A0281E" stroke="#1a0a00" stroke-width="2"/>
<rect x="50" y="52" width="8" height="12" rx="2" fill="#A0281E" stroke="#1a0a00" stroke-width="2"/>
<rect x="64" y="52" width="8" height="12" rx="2" fill="#A0281E" stroke="#1a0a00" stroke-width="2"/>
<path d="M72 28 Q85 20 80 35" stroke="#C0392B" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>`;

const COWBOY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="50" viewBox="0 0 32 50">
<rect x="6" y="16" width="20" height="24" rx="4" fill="#2980B9" stroke="#1a0a00" stroke-width="2"/>
<polygon points="16,20 18,25 23,25 19,28 20,33 16,30 12,33 13,28 9,25 14,25" fill="#F1C40F" stroke="#1a0a00" stroke-width="0.8"/>
<ellipse cx="16" cy="10" rx="10" ry="10" fill="#F5D0A9" stroke="#1a0a00" stroke-width="2"/>
<rect x="7" y="6" width="18" height="4" rx="2" fill="#8B6914" stroke="#1a0a00" stroke-width="1.5"/>
<rect x="9" y="0" width="14" height="8" rx="2" fill="#8B6914" stroke="#1a0a00" stroke-width="1.5"/>
<circle cx="12" cy="11" r="1.5" fill="#1a0a00"/>
<circle cx="20" cy="11" r="1.5" fill="#1a0a00"/>
<path d="M12 15 Q16 18 20 15" stroke="#1a0a00" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<rect x="0" y="18" width="7" height="18" rx="3" fill="#2980B9" stroke="#1a0a00" stroke-width="1.5"/>
<rect x="25" y="18" width="7" height="18" rx="3" fill="#2980B9" stroke="#1a0a00" stroke-width="1.5"/>
<rect x="8" y="38" width="7" height="12" rx="3" fill="#1A5276" stroke="#1a0a00" stroke-width="1.5"/>
<rect x="17" y="38" width="7" height="12" rx="3" fill="#1A5276" stroke="#1a0a00" stroke-width="1.5"/>
</svg>`;

const PARTICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#F1C40F"/></svg>`;
const DUST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#D4A76A"/></svg>`;
const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><polygon points="6,0 7.5,4.5 12,4.5 8.5,7.2 9.7,12 6,9 2.3,12 3.5,7.2 0,4.5 4.5,4.5" fill="#F1C40F"/></svg>`;

const GameState = {
  score: 0, stage: 1, highScore: 0, gamesPlayed: 0,
  streak: 0, gripPercent: 100, isGripping: false, gameOver: false,
  soundOn: true, lastInputTime: 0
};

function getHighScore() {
  return parseInt(localStorage.getItem('ragdoll-rodeo_high_score') || '0');
}
function setHighScore(s) {
  localStorage.setItem('ragdoll-rodeo_high_score', String(s));
}
