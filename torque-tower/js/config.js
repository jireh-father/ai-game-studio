// Torque Tower - Configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const COLORS = {
  bg: '#0D1117',
  bgNum: 0x0D1117,
  standardBlock: '#4A90D9',
  narrowBlock: '#F5A623',
  heavyBlock: '#7B8FA1',
  lightBlock: '#50E3C2',
  perfectGlow: '#FFFFFF',
  badFlash: '#FF4444',
  tiltSafe: '#00C9A7',
  tiltWarn: '#FF8C00',
  tiltDanger: '#FF2222',
  platform: '#2C3E50',
  hudText: '#E8EAF0',
  uiBg: '#1A1F2E',
  accent: '#00D4FF'
};

const TILT_THRESHOLDS = { warning: 35, danger: 60, collapse: 85 };
const TOLERANCE = { perfect: 5, good: 15, bad: 25 };
const BLOCKS_PER_STAGE = 5;
const INTER_BLOCK_DELAY = 400;
const INACTIVITY_TIMEOUT = 25000;

const SCORE_VALUES = {
  perfect: 100, good: 50, bad: 10, veryBad: 0,
  stageBonus: 200, stageBonusPerStage: 50,
  perfectStage: 500, milestone: 250, milestoneEvery: 10
};

const TAP_IMPULSE = 45; // deg/s per tap
const HOLD_TORQUE = 30; // deg/s continuous

const BLOCK_TYPES = {
  standard: { key: 'standard', width: 60, height: 20, torqueMult: 1, color: COLORS.standardBlock },
  narrow:   { key: 'narrow',   width: 30, height: 20, torqueMult: 1, color: COLORS.narrowBlock },
  heavy:    { key: 'heavy',    width: 60, height: 20, torqueMult: 0.5, color: COLORS.heavyBlock },
  light:    { key: 'light',    width: 60, height: 20, torqueMult: 2, color: COLORS.lightBlock }
};

const SVG_STRINGS = {
  standard: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="20" viewBox="0 0 60 20"><rect x="1" y="1" width="58" height="18" rx="2" ry="2" fill="#4A90D9" stroke="#2A5FA0" stroke-width="2"/><rect x="28" y="8" width="4" height="4" fill="#2A5FA0" opacity="0.6"/></svg>',
  narrow: '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 30 20"><rect x="1" y="1" width="28" height="18" rx="2" ry="2" fill="#F5A623" stroke="#C47D0E" stroke-width="2"/><rect x="13" y="8" width="4" height="4" fill="#C47D0E" opacity="0.6"/></svg>',
  heavy: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="20" viewBox="0 0 60 20"><rect x="1" y="1" width="58" height="18" rx="2" ry="2" fill="#7B8FA1" stroke="#4A5F70" stroke-width="2"/><line x1="10" y1="5" x2="10" y2="15" stroke="#4A5F70" stroke-width="2"/><line x1="20" y1="5" x2="20" y2="15" stroke="#4A5F70" stroke-width="2"/><line x1="40" y1="5" x2="40" y2="15" stroke="#4A5F70" stroke-width="2"/><line x1="50" y1="5" x2="50" y2="15" stroke="#4A5F70" stroke-width="2"/></svg>',
  light: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="20" viewBox="0 0 60 20"><rect x="1" y="1" width="58" height="18" rx="2" ry="2" fill="#50E3C2" stroke="#28A888" stroke-width="2"/><circle cx="15" cy="10" r="2" fill="#28A888" opacity="0.6"/><circle cx="30" cy="10" r="2" fill="#28A888" opacity="0.6"/><circle cx="45" cy="10" r="2" fill="#28A888" opacity="0.6"/></svg>',
  platform: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20" viewBox="0 0 200 20"><rect x="0" y="0" width="200" height="20" fill="#2C3E50"/><line x1="10" y1="0" x2="10" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="30" y1="0" x2="30" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="50" y1="0" x2="50" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="70" y1="0" x2="70" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="90" y1="0" x2="90" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="110" y1="0" x2="110" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="130" y1="0" x2="130" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="150" y1="0" x2="150" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="170" y1="0" x2="170" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/><line x1="190" y1="0" x2="190" y2="20" stroke="#1A2535" stroke-width="1" opacity="0.5"/></svg>',
  particle: '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 6 6"><rect width="6" height="6" fill="#FFFFFF"/></svg>'
};

function normalizeAngle(radians) {
  let deg = (radians * 180 / Math.PI) % 360;
  if (deg > 180) deg -= 360;
  if (deg < -180) deg += 360;
  return deg;
}
