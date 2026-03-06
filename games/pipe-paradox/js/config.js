// config.js - Game constants, colors, grid params, rule definitions, SVG strings
const CONFIG = {
  COLORS: {
    BG: '#0A1628',
    GRID: '#1A3A5C',
    PIPE_NORMAL: '#B87333',
    PIPE_WARN: '#FF8C00',
    PIPE_CRITICAL: '#FF0000',
    FLOW: '#00E5FF',
    SOURCE: '#00E676',
    DRAIN: '#FFD600',
    UI_TEXT: '#FFFFFF',
    UI_ACCENT: '#4FC3F7',
    RULE_CARD_BG: '#1E2D3D',
    DANGER: '#FF1744',
    STREAK: '#FFD700',
    DARK_SLATE: '#1E2D3D'
  },
  GRID: { cols: 6, rows: 8, cellSize: 56 },
  GAME: { width: 390, height: 600 },
  HUD_HEIGHT: 48,
  BOTTOM_BAR_HEIGHT: 64,
  DIFFICULTY: {
    BASE_FLOW_SPEED: 1.0,
    BASE_PRESSURE_RATE: 20,     // % per second
    PRESSURE_DECAY: 10,          // % per second when routed
    BASE_RULE_TIMER: 5.0,
    INACTIVITY_THRESHOLD: 8000,  // ms
    INACTIVITY_PRESSURE_MULT: 2,
    OVERFLOW_FILL_TIME: 5,       // seconds to fill from 0 to 100
    LONG_PRESS_MS: 400,
    TAP_DEBOUNCE_MS: 100
  },
  SCORE: {
    FLOW_REACH_DRAIN: 100,
    LONG_ROUTE_MULT: 1.5,
    LONG_ROUTE_MIN: 6,
    SURVIVE_SHIFT: 50,
    CLEAN_SHIFT_MULT: 2,
    CLEAR_ALL_DRAINS: 500,
    STREAK_BONUS: 25,
    STREAK_MAX: 10
  },
  PIPE_TYPES: ['empty', 'straight', 'elbow', 'tjunction', 'cross'],
  // Connections: [top, right, bottom, left] - 1=open, 0=closed
  PIPE_CONNECTIONS: {
    empty:     [[0,0,0,0]],
    straight:  [[0,1,0,1],[1,0,1,0]],
    elbow:     [[1,1,0,0],[0,1,1,0],[0,0,1,1],[1,0,0,1]],
    tjunction: [[1,1,0,1],[1,1,1,0],[0,1,1,1],[1,0,1,1]],
    cross:     [[1,1,1,1]]
  },
  RULES: [
    { id: 0, name: 'NORMAL', icon: '-', desc: 'Standard flow rules', unlock: 0 },
    { id: 1, name: 'REVERSE FLOW', icon: 'R', desc: 'Sources and drains swap', unlock: 1 },
    { id: 2, name: 'GRAVITY PULL', icon: 'G', desc: 'Flow prefers downward', unlock: 1 },
    { id: 3, name: 'ANTI-GRAVITY', icon: 'A', desc: 'Flow prefers upward', unlock: 1 },
    { id: 4, name: 'T-BLOCKADE', icon: 'T', desc: 'T-junctions become dead ends', unlock: 4 },
    { id: 5, name: 'CROSS COLLAPSE', icon: 'X', desc: 'Cross pipes lose 2 paths', unlock: 7 },
    { id: 6, name: 'SPEED SURGE', icon: 'S', desc: 'Flow speed doubles', unlock: 10 },
    { id: 7, name: 'PRESSURE WAVE', icon: 'P', desc: 'All pipes start at 50%', unlock: 13 },
    { id: 8, name: 'FOG OF FLOW', icon: 'F', desc: 'Flow becomes invisible', unlock: 16 },
    { id: 9, name: 'MIRROR FLIP', icon: 'M', desc: 'Grid flips horizontally', unlock: 19 }
  ],
  SVG: {
    straight: `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="20" width="56" height="16" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/><rect x="0" y="24" width="56" height="8" fill="#CD853F" opacity="0.4"/></svg>`,
    elbow: `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><path d="M28 0 L28 28 L56 28" stroke="#B87333" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 0 L28 28 L56 28" stroke="#CD853F" stroke-width="8" fill="none" opacity="0.4" stroke-linecap="round"/></svg>`,
    tjunction: `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="20" width="56" height="16" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/><rect x="20" y="0" width="16" height="28" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/><rect x="24" y="0" width="8" height="28" fill="#CD853F" opacity="0.4"/></svg>`,
    cross: `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="20" width="56" height="16" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/><rect x="20" y="0" width="16" height="56" rx="3" fill="#B87333" stroke="#8B5A2B" stroke-width="2"/><circle cx="28" cy="28" r="10" fill="#A0522D"/></svg>`,
    source: `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="20" fill="#00E676" opacity="0.3"/><circle cx="28" cy="28" r="14" fill="#00E676"/><circle cx="28" cy="28" r="8" fill="#FFFFFF" opacity="0.6"/><text x="28" y="33" text-anchor="middle" fill="#0A1628" font-size="14" font-weight="bold">S</text></svg>`,
    drain: `<svg width="56" height="56" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="20" fill="#FFD600" opacity="0.3"/><circle cx="28" cy="28" r="14" fill="#FFD600"/><circle cx="28" cy="28" r="8" fill="#0A1628"/><text x="28" y="33" text-anchor="middle" fill="#FFD600" font-size="14" font-weight="bold">D</text></svg>`,
    particle: `<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="4" fill="#00E5FF"/></svg>`
  }
};

// Global game state
const GameState = {
  score: 0,
  highScore: parseInt(localStorage.getItem('pipe_paradox_high_score') || '0'),
  overflows: 0,
  streak: 0,
  cycleNumber: 0,
  gamesPlayed: parseInt(localStorage.getItem('pipe_paradox_games_played') || '0'),
  bestCycles: parseInt(localStorage.getItem('pipe_paradox_best_cycles') || '0'),
  soundEnabled: true,
  reset() {
    this.score = 0;
    this.overflows = 0;
    this.streak = 0;
    this.cycleNumber = 0;
  },
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pipe_paradox_high_score', this.highScore);
    }
    if (this.cycleNumber > this.bestCycles) {
      this.bestCycles = this.cycleNumber;
      localStorage.setItem('pipe_paradox_best_cycles', this.bestCycles);
    }
    this.gamesPlayed++;
    localStorage.setItem('pipe_paradox_games_played', this.gamesPlayed);
  }
};

// Global sound manager
const SoundManager = {
  ctx: null,
  init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} },
  play(type) {
    if (!GameState.soundEnabled || !this.ctx) return;
    try {
      const ctx = this.ctx, now = ctx.currentTime;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const s = { place:[800,400,0.08,'square'], remove:[300,150,0.12,'sine'], overflow:[200,50,0.4,'sawtooth'],
        ruleWarn:[400,1200,0.5,'sawtooth'], ruleShift:[100,2000,0.3,'sawtooth'], score:[1200,1200,0.1,'sine'], gameOver:[800,200,0.8,'sine'] };
      const p = s[type]; if(!p) return;
      osc.type = p[3]; osc.frequency.setValueAtTime(p[0],now); osc.frequency.linearRampToValueAtTime(p[1],now+p[2]);
      gain.gain.setValueAtTime(0.15,now); gain.gain.linearRampToValueAtTime(0,now+p[2]);
      osc.start(now); osc.stop(now+p[2]);
    } catch(e) {}
  }
};
