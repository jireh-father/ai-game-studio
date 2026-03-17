// Flatline - Game Configuration
const COLORS = {
  ecgNormal: 0x00FF7F,
  ecgTachy: 0xFFA500,
  ecgCritical: 0xFF3333,
  background: 0x050A0E,
  backgroundHex: '#050A0E',
  windowFill: 0x00FF7F,
  windowAlpha: 0.15,
  windowBorder: 0x00FF7F,
  strikeRed: 0xFF2222,
  perfectGold: 0xFFD700,
  uiText: '#E8F4F8',
  uiTextHex: 0xE8F4F8,
  hudBg: 0x0A1520,
  falseBeat: 0x80FFBB,
  flatlineRed: 0xFF0000,
  gridLine: 0x0D2A1A
};

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const ECG_AREA_TOP = 48;
const ECG_AREA_BOTTOM = 560;
const ECG_Y = 304;
const PEAK_HEIGHT = 96;
const FALSE_PEAK_HEIGHT = 36;
const HUD_HEIGHT = 48;
const STRIKE_BAR_HEIGHT = 40;
const SCROLL_SPEED = 120; // px per second base

const SCORE = {
  good: 100,
  perfect: 200,
  earlyLate: 50,
  ignoreFalse: 50,
  streakBonus: 50,
  stageBonus: 500
};

const STREAK_THRESHOLDS = [
  { count: 5, multiplier: 1.5 },
  { count: 10, multiplier: 2.0 },
  { count: 20, multiplier: 3.0 }
];

const MAX_LIVES = 3;
const INTRO_DELAY_MS = 2000;
const STAGE_TRANSITION_MS = 1200;
const FLATLINE_ANIM_MS = 800;
const DEATH_TO_GAMEOVER_MS = 900;

// SVG Assets
const SVG_HEART_FULL = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 4C12 2 10.5 0 8 0C5.5 0 3 2 3 5C3 10 12 18 12 18C12 18 21 10 21 5C21 2 18.5 0 16 0C13.5 0 12 2 12 4Z" fill="#FF3333"/></svg>`;
const SVG_HEART_EMPTY = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 4C12 2 10.5 0 8 0C5.5 0 3 2 3 5C3 10 12 18 12 18C12 18 21 10 21 5C21 2 18.5 0 16 0C13.5 0 12 2 12 4Z" fill="none" stroke="#FF3333" stroke-width="1.5"/></svg>`;
const SVG_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect x="8" y="6" width="6" height="20" rx="1" fill="#E8F4F8"/><rect x="18" y="6" width="6" height="20" rx="1" fill="#E8F4F8"/></svg>`;
const SVG_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#050A0E"/><polyline points="0,16 8,16 12,16 14,4 16,28 18,12 20,20 22,16 32,16" stroke="#00FF7F" stroke-width="2" fill="none"/></svg>`;

// Waveform generation constants
const WAVEFORM = {
  segmentWidth: 200,
  baselineY: 0,
  pWaveHeight: -15,
  qrsHeight: -80,
  qrsDownHeight: 15,
  tWaveHeight: -18,
  falseWaveHeight: -30,
  lineWidth: 2.5
};

// Audio frequencies
const AUDIO = {
  goodTap: 880,
  perfectTap: [1100, 1320],
  earlyLateTap: 440,
  missBuzz: 180,
  falseBeatBuzz: 200,
  flatlineTone: 1000,
  stageAdvance: [660, 880],
  restChime: [880, 660, 440],
  streakArpeggio: [440, 550, 660, 880],
  uiClick: 4000,
  ambientDrone: 60
};
