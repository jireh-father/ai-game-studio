// Zeno's Dash - Game Configuration
const COLORS = {
  bg: '#0A0A0F',
  track: '#1A1A2E',
  player: '#00D4FF',
  playerOutline: '#00FFFF',
  pursuer: '#FF0066',
  pursuerGlow: '#FF66AA',
  finishLine: '#FFFFFF',
  closeZone: '#FFD700',
  closeZoneAlert: '#FF4400',
  gapText: '#CCCCFF',
  hud: '#FFFFFF',
  hudBg: 'rgba(10,10,15,0.8)',
  particleCyan: '#00D4FF',
  particleGold: '#FFD700',
  death: '#FF0066'
};

const GAME_WIDTH = 460;
const GAME_HEIGHT = 600;
const TRACK_Y = 350;
const TRACK_HEIGHT = 6;
const TRACK_LEFT = 30;
const FINISH_LINE_X = 430;
const PURSUER_START_OFFSET = 300; // px behind player

const SCORE = {
  stageBase: 100,
  efficiencyBonus: 10,
  speedBonus: 5,
  comboMultiplier: 1.5,
  comboRequirement: 3
};

const INACTIVITY_TIMEOUT = 25000; // ms

// SVG Assets - all with explicit width/height
const SVG_PLAYER = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="6" y="8" width="20" height="16" rx="4" fill="#00D4FF" stroke="#00FFFF" stroke-width="2"/>
  <circle cx="16" cy="6" r="5" fill="#00D4FF" stroke="#00FFFF" stroke-width="2"/>
  <line x1="2" y1="12" x2="6" y2="12" stroke="#00FFFF" stroke-width="1.5" opacity="0.6"/>
  <line x1="1" y1="16" x2="6" y2="16" stroke="#00FFFF" stroke-width="1.5" opacity="0.4"/>
  <line x1="2" y1="20" x2="6" y2="20" stroke="#00FFFF" stroke-width="1.5" opacity="0.6"/>
</svg>`;

const SVG_PURSUER = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <polygon points="4,32 18,2 32,32" fill="#FF0066" stroke="#FF66AA" stroke-width="2"/>
  <polygon points="10,28 18,10 26,28" fill="#FF66AA" opacity="0.5"/>
  <circle cx="14" cy="22" r="2" fill="#FFFFFF"/>
  <circle cx="22" cy="22" r="2" fill="#FFFFFF"/>
</svg>`;

const SVG_FINISH = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="80" viewBox="0 0 8 80">
  <rect x="2" y="0" width="4" height="80" fill="#FFFFFF" opacity="0.9"/>
</svg>`;

const SVG_ARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <polygon points="2,5 10,5 10,2 14,8 10,14 10,11 2,11" fill="#CCCCFF" opacity="0.8"/>
</svg>`;

// Background palettes for milestone stages
const BG_PALETTES = [
  '#0A0A0F', '#0A0A1F', '#0F0A1A', '#0A0F0F', '#0F0A0A'
];

function getStageParams(n) {
  const startGap = Math.min(200 + (n - 1) * 80, 800);
  const pursuerSpeed = Math.min(20 + (n - 1) * 8, 120);
  const closeEnough = Math.max(25 - (n - 1) * 2, 10);
  const phantomChance = n >= 11 ? 0.20 : 0.0;
  const randomVariance = n >= 16 ? 0.20 : 0.0;

  let finalGap = startGap;
  let finalSpeed = pursuerSpeed;
  if (randomVariance > 0) {
    const seed = n * 7919 + Date.now() % 100000;
    const pseudoRand = ((Math.sin(seed) * 10000) % 1 + 1) % 1;
    const pseudoRand2 = ((Math.sin(seed + 1) * 10000) % 1 + 1) % 1;
    finalGap *= (1 + (pseudoRand - 0.5) * 2 * randomVariance);
    finalSpeed *= (1 + (pseudoRand2 - 0.5) * 2 * randomVariance);
  }

  return { startGap: finalGap, pursuerSpeed: finalSpeed, closeEnough, phantomChance };
}

function getParTaps(startGap, closeEnough) {
  return Math.ceil(Math.log2(startGap / closeEnough));
}

function isMilestoneStage(n) {
  return n % 5 === 0;
}
