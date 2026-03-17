// Gravity Liar - Configuration & Constants
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const HUD_HEIGHT = 48;
const ARENA_TOP = HUD_HEIGHT + 8;

const COLORS = {
  bg: 0x0A0A0F, wallColor: 0x1A1A2E, ball: 0x00E5FF, ballGlow: 0x00B8D4,
  arrowTruth: 0x00FF88, arrowNeutral: 0xE8E8F0, arrowSecond: 0xFFB300,
  deathZone: 0xFF1744, deathSpikes: 0xB71C1C, deathGlow: 0xFF5252,
  scoreText: '#FFFFFF', stageText: '#B0BEC5', livesOn: 0x00E5FF, livesOff: 0x263238,
  comboBar: 0xFFD600, hudBg: 0x0D0D17, streakText: '#FFD600', lieFlash: 0xCE93D8,
  restGlow: 0x00FF88, correctTap: 0x00E5FF, riskyTap: 0xFF5252,
  gameOver: '#FF1744', newBest: '#FFD600'
};

const WALL_W = 8;
const BALL_RADIUS = 12;
const IMPULSE_X = 220;
const BOUNCE = 0.7;
const RAMP_RATE = 0.15;
const RAMP_INTERVAL = 8000;
const MAX_GRAVITY = 400;
const MAX_BALL_SPEED = 120;
const LIVES_MAX = 3;

const SCORE_SURVIVE_SEC = 10;
const SCORE_CORRECT_TAP = 50;
const SCORE_STAGE_CLEAR = 200;
const SCORE_FIRST_ATTEMPT = 300;
const SCORE_LIE_SWITCH = 75;
const COMBO_THRESHOLDS = [5, 10, 15];
const COMBO_MULTIPLIERS = [1.5, 2.0, 3.0];

// SVG Assets
const SVG_BALL = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#00B8D4" opacity="0.25"/>
  <circle cx="24" cy="24" r="18" fill="#00E5FF" opacity="0.6"/>
  <circle cx="24" cy="24" r="12" fill="#00E5FF"/>
  <circle cx="19" cy="19" r="4" fill="#FFFFFF" opacity="0.5"/>
</svg>`;

const SVG_ARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect x="36" y="8" width="8" height="48" fill="#E8E8F0"/>
  <polygon points="24,52 56,52 40,72" fill="#E8E8F0"/>
</svg>`;

const SVG_ARROW2 = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect x="36" y="8" width="8" height="48" fill="#FFB300"/>
  <polygon points="24,52 56,52 40,72" fill="#FFB300"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#00E5FF"/>
</svg>`;

const SVG_PARTICLE_RED = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#FF1744"/>
</svg>`;

const SVG_PARTICLE_GOLD = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#FFD600"/>
</svg>`;

// LIE_TABLE: degrees of lie offset per stage (0=truth, 90/180/270=rotated)
const LIE_TABLE = [
  0, 0, 0, 90, 180, 270, 90,
  0, 90, 180,
  0, 270,
  180, 0, 90, 180, 270, 0, 90, 180
];

// Audio helper using WebAudio
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type, duration, vol) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) {}
}

function playTapSound() { playTone(440, 'sine', 80, 0.15); }
function playWrongTapSound() { playTone(220, 'square', 100, 0.1); }
function playBounceSound() { playTone(880, 'sine', 50, 0.05); }
function playLieSwitchSound() {
  playTone(523, 'sine', 100, 0.12);
  setTimeout(() => playTone(659, 'sine', 100, 0.12), 100);
}
function playDeathSound() { playTone(110, 'square', 350, 0.2); }
function playStageClearSound() {
  playTone(523, 'sine', 150, 0.12);
  setTimeout(() => playTone(659, 'sine', 150, 0.12), 150);
  setTimeout(() => playTone(784, 'sine', 200, 0.12), 300);
}
function playGameOverSound() {
  playTone(392, 'sine', 250, 0.12);
  setTimeout(() => playTone(330, 'sine', 250, 0.12), 250);
  setTimeout(() => playTone(262, 'sine', 300, 0.12), 500);
}
function playStreakSound(n) { playTone(600 + n * 20, 'sine', 60, 0.08); }
function playStreakBreakSound() { playTone(300, 'triangle', 80, 0.08); }
function playUIClick() { playTone(1000, 'sine', 30, 0.06); }
