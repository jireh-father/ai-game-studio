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

  // Screen crack overlay
  CRACK_POOL_MAX: 12,
  CRACK_FADE_MS: 250,
  CRACK_SHATTER_OUT_MS: 120,
  CRACK_SHATTER_BACK_MS: 80,
  CRACK_SHATTER_DIST: 8,

  // Achievement multiplier
  ACHIEVEMENT_MULT_EACH: 0.1,
  ACHIEVEMENT_MULT_MAX: 1.0,
  ACHIEVEMENT_TOAST_MS: 1500,

  // Daily challenge tiers
  DAILY_BRONZE_WAVE: 3,
  DAILY_SILVER_WAVE: 5,
  DAILY_SILVER_MAX_BALLS: 10,
  DAILY_GOLD_WAVE: 8,
  DAILY_GOLD_MAX_TIME: 90000,

  // Daily modifiers
  DAILY_MODS: [
    { id: 'tiny_panels', label: 'Tiny Panels', panelScale: 0.7 },
    { id: 'heavy_shards', label: 'Heavy Shards', shardGravMult: 2 },
    { id: 'double_cascade', label: 'Double Cascade', shardCountMult: 2 },
    { id: 'speed_shatter', label: 'Speed Shatter', shardSpeedMult: 1.8 },
    { id: 'fragile_glass', label: 'Fragile Glass', allHp1: true },
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
function playAchievement() { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 100, 'sine', 0.12), i*80)); }

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'glass_breaker', title: 'Glass Breaker', stat: 'total_shards', target: 100 },
  { id: 'demolisher', title: 'Demolisher', stat: 'total_shards', target: 500 },
  { id: 'obliterator', title: 'Obliterator', stat: 'total_shards', target: 2000 },
  { id: 'chain_starter', title: 'Chain Starter', stat: 'total_cascades', target: 25 },
  { id: 'cascade_king', title: 'Cascade King', stat: 'total_cascades', target: 100 },
  { id: 'survivor', title: 'Survivor', stat: 'total_waves', target: 50 },
  { id: 'endurance', title: 'Endurance', stat: 'total_waves', target: 200 },
  { id: 'deep_chain', title: 'Deep Chain', stat: 'max_chain', target: 5 },
  { id: 'abyss_chain', title: 'Abyss Chain', stat: 'max_chain', target: 8 },
  { id: 'regular', title: 'Regular', stat: 'total_games', target: 10 },
];

// Meta progression manager (localStorage-backed)
const MetaProgress = {
  _key: 'shatter-chain_meta',
  _data: null,

  load() {
    try { this._data = JSON.parse(localStorage.getItem(this._key)); } catch(e) {}
    if (!this._data) this._data = { total_shards:0, total_cascades:0, total_waves:0, total_games:0, max_chain:0, unlocked:[], streak:0, last_play_date:'', daily_stars:0, daily_history:{}, daily_balls_used:0, daily_elapsed:0 };
    return this._data;
  },

  save() { try { localStorage.setItem(this._key, JSON.stringify(this._data)); } catch(e) {} },

  get data() { if (!this._data) this.load(); return this._data; },

  addShards(n) { this.data.total_shards += n; this.save(); },
  addCascade() { this.data.total_cascades++; this.save(); },
  addWaves(n) { this.data.total_waves += n; this.save(); },
  addGame() { this.data.total_games++; this.save(); },
  updateMaxChain(d) { if (d > this.data.max_chain) { this.data.max_chain = d; this.save(); } },

  getScoreMultiplier() {
    const count = this.data.unlocked ? this.data.unlocked.length : 0;
    return 1 + Math.min(count * CFG.ACHIEVEMENT_MULT_EACH, CFG.ACHIEVEMENT_MULT_MAX);
  },

  checkAchievements() {
    const newly = [];
    for (const a of ACHIEVEMENTS) {
      if (this.data.unlocked.includes(a.id)) continue;
      const val = this.data[a.stat] || 0;
      if (val >= a.target) { this.data.unlocked.push(a.id); newly.push(a); }
    }
    if (newly.length) this.save();
    return newly;
  },

  getNextAchievement() {
    let best = null, bestPct = -1;
    for (const a of ACHIEVEMENTS) {
      if (this.data.unlocked.includes(a.id)) continue;
      const pct = Math.min((this.data[a.stat] || 0) / a.target, 0.99);
      if (pct > bestPct) { bestPct = pct; best = a; }
    }
    return best;
  },

  checkStreak() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.data.last_play_date === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    this.data.streak = this.data.last_play_date === yesterday ? this.data.streak + 1 : 1;
    this.data.last_play_date = today;
    this.save();
  },

  getDailySeed() { const d = new Date(); return parseInt('' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0')); },
  getDailyMod() { return CFG.DAILY_MODS[this.getDailySeed() % 5]; },

  getDailyKey() { return 'daily_' + this.getDailySeed(); },
  getDailyResult() { return this.data.daily_history[this.getDailyKey()] || null; },
  saveDailyResult(stars, tiers) { this.data.daily_history[this.getDailyKey()] = { stars, tiers }; this.data.daily_stars += stars; this.save(); },

  getLast7Days() {
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = 'daily_' + parseInt('' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0'));
      results.push({ date: d.toISOString().slice(5, 10), result: this.data.daily_history[key] || null });
    }
    return results;
  },
};
