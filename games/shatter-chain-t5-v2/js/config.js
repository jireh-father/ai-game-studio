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

  // Golden Panel Roulette
  GOLDEN_COLOR: 0xFFD700,
  GOLDEN_HEX: '#FFD700',
  ABSORBER_COLOR: 0x4A0A0A,
  GOLDEN_MULTIPLIER: 3,
  GOLDEN_MOVE_WAVE: 8,
  GOLDEN_MOVE_AMP: 40,
  GOLDEN_MOVE_PERIOD: 2000,

  // Bomb Glass
  BOMB_COLOR: 0xFF6B35,
  BOMB_HEX: '#FF6B35',
  BOMB_WAVE: 6,
  BOMB_RATIO: 0.08,
  BOMB_AOE_RADIUS: 80,
  BOMB_SIZE_W: 42,
  BOMB_SIZE_H: 32,

  // Ice Glass
  ICE_COLOR: 0x88DDFF,
  ICE_HEX: '#88DDFF',
  ICE_WAVE: 10,
  ICE_RATIO: 0.12,
  ICE_FREEZE_TIME: 1500,
  ICE_SHARD_SPEED_MULT: 0.5,

  // Achievements
  ACHIEVEMENTS: [
    { id: 'shards_100', label: 'Shard Storm', desc: '100 shards', stat: 'total_shards', target: 100 },
    { id: 'shards_500', label: 'Glass Hurricane', desc: '500 shards', stat: 'total_shards', target: 500 },
    { id: 'cascades_10', label: 'Chain Starter', desc: '10 cascades', stat: 'total_cascades', target: 10 },
    { id: 'cascades_50', label: 'Chain Master', desc: '50 cascades', stat: 'total_cascades', target: 50 },
    { id: 'waves_10', label: 'Wave Rider', desc: '10 waves', stat: 'total_waves', target: 10 },
    { id: 'waves_50', label: 'Wave Conqueror', desc: '50 waves', stat: 'total_waves', target: 50 },
    { id: 'games_5', label: 'Regular', desc: '5 games', stat: 'total_games', target: 5 },
    { id: 'games_20', label: 'Addict', desc: '20 games', stat: 'total_games', target: 20 },
    { id: 'chain_4', label: 'Deep Chain', desc: 'Chain depth 4', stat: 'max_chain', target: 4 },
    { id: 'chain_6', label: 'Infinite Chain', desc: 'Chain depth 6', stat: 'max_chain', target: 6 },
  ],
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
function playBombExplode() { playTone(150, 200, 'sine', 0.2); playTone(80, 300, 'sine', 0.15); }
function playIceFreeze() { playTone(2500, 300, 'sine', 0.1); }
function playGoldenHit() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 100, 'sine', 0.15), i * 60)); }
function playAbsorberConvert() { playTone(150, 300, 'sine', 0.2); playTone(100, 200, 'sine', 0.15); }
function playAchievement() { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, 80, 'sine', 0.12), i * 80)); }

// Achievement tracking system
const AchievementManager = {
  stats: null,
  unlocked: null,

  init() {
    this.stats = JSON.parse(localStorage.getItem('sc_ach_stats') || '{"total_shards":0,"total_cascades":0,"total_waves":0,"total_games":0,"max_chain":0}');
    this.unlocked = JSON.parse(localStorage.getItem('sc_ach_unlocked') || '[]');
  },

  addStat(key, value) {
    if (!this.stats) this.init();
    if (key === 'max_chain') {
      this.stats[key] = Math.max(this.stats[key] || 0, value);
    } else {
      this.stats[key] = (this.stats[key] || 0) + value;
    }
    localStorage.setItem('sc_ach_stats', JSON.stringify(this.stats));
  },

  checkUnlocks() {
    if (!this.stats) this.init();
    const newUnlocks = [];
    for (const ach of CFG.ACHIEVEMENTS) {
      if (this.unlocked.includes(ach.id)) continue;
      if (this.stats[ach.stat] >= ach.target) {
        this.unlocked.push(ach.id);
        newUnlocks.push(ach);
      }
    }
    if (newUnlocks.length > 0) {
      localStorage.setItem('sc_ach_unlocked', JSON.stringify(this.unlocked));
    }
    return newUnlocks;
  },

  getScoreMultiplier() {
    if (!this.unlocked) this.init();
    return Math.min(this.unlocked.length * 0.1, 1.0);
  },

  getNearestUnfinished() {
    if (!this.stats) this.init();
    let best = null, bestPct = -1;
    for (const ach of CFG.ACHIEVEMENTS) {
      if (this.unlocked.includes(ach.id)) continue;
      const pct = (this.stats[ach.stat] || 0) / ach.target;
      if (pct > bestPct) { bestPct = pct; best = ach; }
    }
    return best ? { ...best, progress: this.stats[best.stat] || 0 } : null;
  },
};
