// Shatter Chain - Configuration & Constants

const CFG = {
  WIDTH: 360,
  HEIGHT: 740,
  ARENA_TOP: 52,
  ARENA_HEIGHT: 380,
  LAUNCH_ZONE_TOP: 432,
  HUD_HEIGHT: 44,
  TIMER_BAR_H: 8,

  // Ball
  BALL_RADIUS: 14,
  BALL_SPEED_MIN: 4,
  BALL_SPEED_MAX: 16,
  BALL_DRAG_MIN: 15,

  // Timer
  TIMER_DEFAULT: 15000,
  TIMER_LATE: 12000,
  TIMER_WARNING: 5000,
  TIMER_LATE_WAVE: 36,

  // Scoring
  CHAIN_SCORE: [100, 200, 400, 800],
  WAVE_CLEAR_BONUS: 500,
  PERFECT_CASCADE_BONUS: 2000,
  SPEED_BONUS: 1000,
  SPEED_BONUS_TIME: 5000,

  // Physics body limit
  MAX_BODIES: 200,
  SHARD_LIFESPAN: 2000,
  SHARD_BASE_COUNT: 4,

  // Collision categories
  CAT_BALL: 0x0001,
  CAT_GLASS: 0x0002,
  CAT_SHARD: 0x0004,
  CAT_WALL: 0x0008,
  CAT_BARRIER: 0x0010,

  // Colors
  COLOR: {
    BG: 0x1A1A2E,
    BG_HEX: '#1A1A2E',
    BORDER: 0x16213E,
    BALL: 0xC0C0C8,
    BALL_HI: 0xE8E8F0,
    GLASS: 0xA8D8EA,
    GLASS_HI: 0xD4EFFA,
    REINFORCED: 0x4A90B8,
    ARMORED: 0x2A4A6B,
    SHARD: 0xE8F6FF,
    DANGER: 0xE94560,
    DANGER_HEX: '#E94560',
    SCORE: 0xFFD700,
    SCORE_HEX: '#FFD700',
    CASCADE: 0x00FFFF,
    CASCADE_HEX: '#00FFFF',
    BARRIER: 0x5A5A6A,
    CLEAR: 0x39FF14,
    CLEAR_HEX: '#39FF14',
    WHITE: 0xFFFFFF,
    WHITE_HEX: '#FFFFFF',
    UI_BG: 'rgba(10,10,30,0.85)',
    FAIL_BG: 'rgba(139,0,0,0.80)',
  },

  // Chain depth colors for floating text
  CHAIN_COLORS: ['#FFFFFF', '#FFD700', '#FFA500', '#00FFFF', '#00FFFF'],

  // Fusion Timer
  FUSION_INTERVAL: 4000,
  FUSION_WARN_TIME: 2000,
  FUSION_PROXIMITY: 50,
  FUSION_SHARD_BONUS: 3,
  FUSION_SIZE_MULT: 1.4,
  FUSION_WARN_COLOR: 0xFF8C00,
  FUSION_GLOW_COLOR: 0xFF6347,

  // Gravity Flip Zones
  GRAV_ZONE_HEIGHT: 16,
  GRAV_ZONE_COLOR: 0x9B59B6,
  GRAV_ZONE_ALPHA: 0.25,
  GRAV_ZONE_DAMPING: -0.9,
  GRAV_ZONE_SPARK_COUNT: 6,

  // Ball Personality
  BALL_IDLE_TIMEOUT: 3000,
  BALL_IDLE_HOP: -8,
  BALL_IDLE_HOP_DUR: 150,
  BALL_IMPACT_SQUASH_MS: 60,
  BALL_SPIN_DEG: 720,
  BALL_SPIN_MS: 400,
  BALL_CLEAR_PULSE: 1.3,
};

// Matter.js physics config
const MATTER_CFG = {
  gravity: { x: 0, y: 0.4 },
  enableSleeping: false,
};

const BALL_BODY = {
  frictionAir: 0.005,
  friction: 0.1,
  restitution: 0.6,
  label: 'ball',
  collisionFilter: { category: CFG.CAT_BALL, mask: CFG.CAT_GLASS | CFG.CAT_WALL | CFG.CAT_BARRIER },
};

const GLASS_BODY = {
  isStatic: true,
  friction: 0,
  label: 'glass',
  collisionFilter: { category: CFG.CAT_GLASS, mask: CFG.CAT_BALL | CFG.CAT_SHARD | CFG.CAT_BARRIER },
};

const SHARD_BODY = {
  frictionAir: 0.02,
  friction: 0.3,
  restitution: 0.3,
  label: 'shard',
  collisionFilter: { category: CFG.CAT_SHARD, mask: CFG.CAT_GLASS | CFG.CAT_WALL },
};

const BARRIER_BODY = {
  isStatic: true,
  friction: 0.1,
  restitution: 0.8,
  label: 'barrier',
  collisionFilter: { category: CFG.CAT_BARRIER, mask: CFG.CAT_BALL | CFG.CAT_GLASS },
};

// Audio
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, dur, type, vol) {
  if (window.GameState && !window.GameState.settings.sound) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur / 1000));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (dur / 1000));
  } catch (e) {}
}

function playShatter(chainDepth) {
  const baseFreq = 2000 * Math.pow(1.2, Math.min(chainDepth, 4));
  playTone(baseFreq, 250, 'sine', 0.12);
  // noise burst
  try {
    const ctx = getAudioCtx();
    const bufSize = ctx.sampleRate * 0.08;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch (e) {}
  // chain chime
  if (chainDepth > 0) {
    const chimeFreqs = [400, 600, 900, 1400];
    playTone(chimeFreqs[Math.min(chainDepth - 1, 3)], 150, 'sine', 0.1);
  }
}

function playLaunch() { playTone(800, 120, 'sine', 0.1); setTimeout(() => playTone(400, 60, 'sine', 0.08), 60); }
function playWaveClear() { [293, 369, 440, 587].forEach((f, i) => setTimeout(() => playTone(f, 120, 'sine', 0.12), i * 100)); }
function playWaveFail() { [293, 220, 146].forEach((f, i) => setTimeout(() => playTone(f, 180, 'sine', 0.15), i * 180)); }
function playBallLost() { playTone(400, 100, 'sine', 0.08); setTimeout(() => playTone(200, 100, 'sine', 0.06), 80); }
function playClick() { playTone(800, 20, 'square', 0.05); }
function playPerfectCascade() { [261, 329, 392, 523].forEach((f, i) => setTimeout(() => playTone(f, 80, 'sine', 0.15), i * 80)); }
function playHighScore() { [261,329,392,329,392,523].forEach((f,i) => setTimeout(() => playTone(f, 100, 'sine', 0.12), i*120)); }
function playTimerTick() { playTone(1200, 30, 'sine', 0.04); }
function playReinforcedHit() { playTone(100, 150, 'sine', 0.15); }
function playFusion() { playTone(200, 300, 'sine', 0.12); }
function playGravFlip() {
  try {
    const ctx = getAudioCtx();
    if (!window.GameState || !window.GameState.settings.sound) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}
