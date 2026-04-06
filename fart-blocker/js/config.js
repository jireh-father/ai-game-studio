// config.js — Game constants, colors, SVGs, difficulty tables

const COLORS = {
  fleshPink: '#FFCBA4',
  stressRed: '#E63946',
  safeGreen: '#2DC653',
  warningYellow: '#FFD60A',
  dangerOrange: '#FF6B35',
  criticalRed: '#E63946',
  bgPurple: '#7B5EA7',
  npcGray: '#9E9E9E',
  uiBg: '#1A1A2E',
  uiText: '#F5F5F5',
  sweatBlue: '#74B9FF',
  white: '#FFFFFF',
  black: '#000000'
};

const SCENARIO_NAMES = ['YOGA CLASS', 'ELEVATOR', 'WEDDING', 'LIBRARY', 'SPACE STATION'];
const SCENARIO_BACKGROUNDS = ['#7B5EA7', '#B0BEC5', '#FFF9C4', '#795548', '#0D1B2A'];

const SCORE_VALUES = {
  stageSurvived: 100,   // × stage_number
  closeCall: 50,
  perfectStage: 200,
  crampSurvived: 30,
  npcSaved: 25,
  speedBonusPerSec: 10,
  rhythmBonus: 40,
  comboMultiplier: 1.5
};

const STORAGE_KEYS = {
  highScore: 'fart-blocker_high_score',
  soundOn: 'fart-blocker_sound',
  musicOn: 'fart-blocker_music'
};

const DIFFICULTY_BASE = {
  initialLives: 3,
  basePressureFillRate: 11,   // % per second at stage 1
  baseTapReduction: 12,       // % per tap at stage 1
  baseTimer: 12,              // seconds at stage 1
  baseCrampThreshold: 5,      // taps per 500ms
  baseCrampDuration: 3000,    // ms
  inputGracePeriod: 200,      // ms at stage start
  inactivityDeathMs: 25000
};

// SVG strings — all with explicit width/height attributes

const SVG_PLAYER = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
  <circle cx="30" cy="18" r="16" fill="${COLORS.fleshPink}" stroke="#333" stroke-width="2"/>
  <circle cx="24" cy="16" r="3" fill="#333"/>
  <circle cx="36" cy="16" r="3" fill="#333"/>
  <path d="M 22 24 Q 30 20 38 24" stroke="#333" stroke-width="2" fill="none"/>
  <rect x="16" y="34" width="28" height="32" rx="4" fill="#3A86FF" stroke="#333" stroke-width="2"/>
  <rect x="18" y="64" width="10" height="16" rx="3" fill="#4A4A6A"/>
  <rect x="32" y="64" width="10" height="16" rx="3" fill="#4A4A6A"/>
  <path d="M 16 40 Q 6 44 8 52" stroke="${COLORS.fleshPink}" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M 44 40 Q 54 44 52 52" stroke="${COLORS.fleshPink}" stroke-width="8" stroke-linecap="round" fill="none"/>
</svg>`;

const SVG_PLAYER_STRESSED = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
  <circle cx="30" cy="18" r="16" fill="#FF6B6B" stroke="#333" stroke-width="2"/>
  <line x1="20" y1="13" x2="28" y2="19" stroke="#333" stroke-width="2.5"/>
  <line x1="28" y1="13" x2="20" y2="19" stroke="#333" stroke-width="2.5"/>
  <line x1="32" y1="13" x2="40" y2="19" stroke="#333" stroke-width="2.5"/>
  <line x1="40" y1="13" x2="32" y2="19" stroke="#333" stroke-width="2.5"/>
  <ellipse cx="30" cy="26" rx="6" ry="4" fill="#333"/>
  <rect x="16" y="34" width="28" height="32" rx="4" fill="#3A86FF" stroke="#333" stroke-width="2"/>
  <rect x="18" y="64" width="10" height="16" rx="3" fill="#4A4A6A"/>
  <rect x="32" y="64" width="10" height="16" rx="3" fill="#4A4A6A"/>
</svg>`;

const SVG_NPC_YOGA = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <circle cx="25" cy="14" r="12" fill="${COLORS.fleshPink}" stroke="#333" stroke-width="1.5"/>
  <line x1="16" y1="10" x2="22" y2="12" stroke="#333" stroke-width="2"/>
  <line x1="34" y1="10" x2="28" y2="12" stroke="#333" stroke-width="2"/>
  <circle cx="20" cy="14" r="2" fill="#333"/>
  <circle cx="30" cy="14" r="2" fill="#333"/>
  <line x1="20" y1="19" x2="30" y2="19" stroke="#333" stroke-width="1.5"/>
  <rect x="14" y="26" width="22" height="26" rx="4" fill="#9B59B6"/>
  <rect x="16" y="50" width="8" height="14" rx="3" fill="#9B59B6"/>
  <rect x="26" y="50" width="8" height="14" rx="3" fill="#9B59B6"/>
</svg>`;

const SVG_NPC_ELEVATOR = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <circle cx="25" cy="14" r="12" fill="${COLORS.fleshPink}" stroke="#333" stroke-width="1.5"/>
  <circle cx="20" cy="14" r="2" fill="#333"/>
  <circle cx="30" cy="14" r="2" fill="#333"/>
  <line x1="20" y1="20" x2="30" y2="20" stroke="#333" stroke-width="1.5"/>
  <rect x="14" y="26" width="22" height="26" rx="4" fill="#607D8B"/>
  <rect x="16" y="50" width="8" height="14" rx="3" fill="#37474F"/>
  <rect x="26" y="50" width="8" height="14" rx="3" fill="#37474F"/>
</svg>`;

const SVG_NPC_WEDDING = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="70" viewBox="0 0 50 70">
  <circle cx="25" cy="14" r="12" fill="${COLORS.fleshPink}" stroke="#333" stroke-width="1.5"/>
  <circle cx="20" cy="14" r="2" fill="#333"/>
  <circle cx="30" cy="14" r="2" fill="#333"/>
  <path d="M 20 19 Q 25 22 30 19" stroke="#333" stroke-width="1.5" fill="none"/>
  <rect x="12" y="26" width="26" height="30" rx="4" fill="#F5F5F5" stroke="#DDD" stroke-width="1"/>
  <rect x="16" y="54" width="8" height="14" rx="3" fill="#F5F5F5"/>
  <rect x="26" y="54" width="8" height="14" rx="3" fill="#F5F5F5"/>
</svg>`;

const SVG_CLOUD_PUFF = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16">
  <ellipse cx="12" cy="10" rx="10" ry="6" fill="#B0C4DE" opacity="0.7"/>
  <circle cx="8" cy="8" r="5" fill="#B0C4DE" opacity="0.7"/>
  <circle cx="16" cy="7" r="6" fill="#B0C4DE" opacity="0.7"/>
</svg>`;

const SVG_SWEAT = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="12" viewBox="0 0 8 12">
  <ellipse cx="4" cy="7" rx="3" ry="5" fill="${COLORS.sweatBlue}" opacity="0.8"/>
</svg>`;

const SVG_LIFE = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <circle cx="10" cy="10" r="9" fill="${COLORS.safeGreen}" stroke="#1A8040" stroke-width="1.5"/>
  <path d="M 7 10 L 9 12 L 14 7" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

const SVG_LIFE_LOST = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <circle cx="10" cy="10" r="9" fill="#555" stroke="#333" stroke-width="1.5"/>
  <line x1="7" y1="7" x2="13" y2="13" stroke="#888" stroke-width="2"/>
  <line x1="13" y1="7" x2="7" y2="13" stroke="#888" stroke-width="2"/>
</svg>`;

const NPC_KEYS_BY_SCENARIO = [
  ['npcYoga'],
  ['npcElevator', 'npcElevator', 'npcElevator', 'npcElevator'],
  ['npcWedding', 'npcWedding'],
  ['npcYoga'],
  ['npcElevator', 'npcElevator']
];
