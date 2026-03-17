// Speed Dating Dodge — Game Configuration
const CONFIG = {
  // Colors
  COLOR_BG: '#FFF5E6',
  COLOR_PRIMARY: '#FF6B6B',
  COLOR_ADVENTURER: '#FF9F43',
  COLOR_HOMEBODY: '#54A0FF',
  COLOR_FOODIE: '#1DD1A1',
  COLOR_WORKAHOLIC: '#8395A7',
  COLOR_FREE_SPIRIT: '#A29BFE',
  COLOR_RED_FLAG: '#EE5A24',
  COLOR_CORRECT: '#6AB04C',
  COLOR_BUBBLE_BG: '#F8F9FA',
  COLOR_BUBBLE_BORDER: '#2C3A47',
  COLOR_TEXT: '#2C3A47',
  COLOR_TIMER_FILL: '#F9CA24',
  COLOR_TIMER_EMPTY: '#EE5A24',
  COLOR_HUD_BG: 'rgba(255,245,230,0.95)',
  COLOR_GOLD: '#F9CA24',

  // Scoring
  BASE_SCORE: 100,
  SPARK_BONUS: 500,
  SPEED_BONUS: 50,
  DATE_COMPLETE_BONUS: 300,
  LANDMINE_BONUS: 200,
  MAX_COMBO_MULTI: 4,
  SPARK_THRESHOLD: 3,

  // Lives
  MAX_FAILS: 3,

  // Swipe detection
  SWIPE_THRESHOLD_PX: 40,
  SWIPE_MAX_DURATION_MS: 400,
  INPUT_LOCK_MS: 300,

  // Timer per date range
  TIMER_TABLE: [
    { min: 1,  max: 5,  ms: 4000 },
    { min: 6,  max: 10, ms: 3500 },
    { min: 11, max: 15, ms: 3000 },
    { min: 16, max: 20, ms: 2500 },
    { min: 21, max: 25, ms: 2000 },
    { min: 26, max: 999, ms: 1500 }
  ],

  // Landmine percentage per date range
  LANDMINE_TABLE: [
    { min: 1,  max: 10, pct: 0.0 },
    { min: 11, max: 15, pct: 0.10 },
    { min: 16, max: 20, pct: 0.25 },
    { min: 21, max: 25, pct: 0.40 },
    { min: 26, max: 999, pct: 0.50 }
  ],

  // Questions per date
  QUESTIONS_TABLE: [
    { min: 1,  max: 10, count: 3 },
    { min: 11, max: 20, count: 4 },
    { min: 21, max: 999, count: 5 }
  ],

  // Personality types
  PERSONALITY_TYPES: ['Adventurer','Homebody','Foodie','Workaholic','Free Spirit'],
  PERSONALITY_COLORS: {
    'Adventurer': '#FF9F43',
    'Homebody': '#54A0FF',
    'Foodie': '#1DD1A1',
    'Workaholic': '#8395A7',
    'Free Spirit': '#A29BFE'
  },

  // Breather dates (every 5th) get +200ms
  BREATHER_BONUS_MS: 200,

  // Early dates only use these types
  EARLY_TYPES: ['Adventurer','Homebody'],
  EARLY_DATE_LIMIT: 5,

  // Used question rotation limit
  QUESTION_ROTATION: 10,

  // Avatar variants (8 color palettes for variety)
  AVATAR_VARIANTS: [
    { body:'#FFB3BA', eyes:'#2C3A47' },
    { body:'#BAFFC9', eyes:'#2C3A47' },
    { body:'#BAE1FF', eyes:'#2C3A47' },
    { body:'#FFFFBA', eyes:'#2C3A47' },
    { body:'#E8BAFF', eyes:'#2C3A47' },
    { body:'#FFD4BA', eyes:'#2C3A47' },
    { body:'#BAFFED', eyes:'#2C3A47' },
    { body:'#D4BAFF', eyes:'#2C3A47' }
  ]
};

// SVG Templates
const SVG = {
  avatar: function(color, mouth) {
    const m = mouth === 'angry'
      ? '<path d="M 42 78 Q 60 66 78 78" stroke="#2C3A47" stroke-width="4" fill="none" stroke-linecap="round"/>'
      : '<path d="M 42 72 Q 60 86 78 72" stroke="#2C3A47" stroke-width="4" fill="none" stroke-linecap="round"/>';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="50" fill="${color}" opacity="0.9"/>
      <circle cx="45" cy="52" r="7" fill="#2C3A47"/>
      <circle cx="75" cy="52" r="7" fill="#2C3A47"/>
      <circle cx="48" cy="49" r="2.5" fill="#FFF"/>
      <circle cx="78" cy="49" r="2.5" fill="#FFF"/>
      ${m}
      <circle cx="30" cy="68" r="8" fill="#FF6B6B" opacity="0.3"/>
      <circle cx="90" cy="68" r="8" fill="#FF6B6B" opacity="0.3"/>
    </svg>`;
  },

  heartFull: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <path d="M14 24 C14 24 3 16 3 9 C3 5.5 6 3 9 3 C11 3 13 4.5 14 6 C15 4.5 17 3 19 3 C22 3 25 5.5 25 9 C25 16 14 24 14 24Z" fill="#FF6B6B"/>
  </svg>`,

  heartBroken: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <path d="M14 24 C14 24 3 16 3 9 C3 5.5 6 3 9 3 C11 3 13 4.5 14 6 C15 4.5 17 3 19 3 C22 3 25 5.5 25 9 C25 16 14 24 14 24Z" fill="#8395A7" opacity="0.5"/>
    <line x1="14" y1="6" x2="10" y2="18" stroke="#2C3A47" stroke-width="2"/>
    <line x1="10" y1="18" x2="16" y2="24" stroke="#2C3A47" stroke-width="2"/>
  </svg>`,

  iconAdventurer: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#FF9F43" stroke="#2C3A47" stroke-width="2"/>
    <polygon points="16,6 19,16 16,26 13,16" fill="#FFF" opacity="0.9"/>
    <polygon points="6,16 16,13 26,16 16,19" fill="#2C3A47" opacity="0.7"/>
  </svg>`,

  iconHomebody: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#54A0FF" stroke="#2C3A47" stroke-width="2"/>
    <polygon points="16,6 26,15 24,15 24,26 8,26 8,15 6,15" fill="#FFF" opacity="0.9"/>
  </svg>`,

  iconFoodie: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#1DD1A1" stroke="#2C3A47" stroke-width="2"/>
    <rect x="14" y="6" width="4" height="20" rx="2" fill="#FFF"/>
    <rect x="10" y="6" width="2" height="10" rx="1" fill="#FFF"/>
    <rect x="20" y="6" width="2" height="10" rx="1" fill="#FFF"/>
  </svg>`,

  iconWorkaholic: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#8395A7" stroke="#2C3A47" stroke-width="2"/>
    <rect x="8" y="13" width="16" height="11" rx="2" fill="#FFF" opacity="0.9"/>
    <rect x="12" y="10" width="8" height="5" rx="1" fill="none" stroke="#FFF" stroke-width="2"/>
  </svg>`,

  iconFreeSpirit: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#A29BFE" stroke="#2C3A47" stroke-width="2"/>
    <polygon points="16,6 18.5,13 26,13 20,18 22.5,26 16,21 9.5,26 12,18 6,13 13.5,13" fill="#FFF" opacity="0.9"/>
  </svg>`,

  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="3.5" fill="#F9CA24"/>
  </svg>`,

  particleGreen: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="3.5" fill="#6AB04C"/>
  </svg>`,

  particleRed: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
    <circle cx="4" cy="4" r="3.5" fill="#EE5A24"/>
  </svg>`
};

// SFX via Web Audio API
const SFX = {
  _ctx: null,
  _enabled: true,
  getCtx() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  },
  play(type, pitchMod) {
    if (!this._enabled) return;
    const ctx = this.getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const pm = pitchMod || 1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    switch(type) {
      case 'correct':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523 * pm, now);
        osc.frequency.setValueAtTime(659 * pm, now + 0.05);
        osc.frequency.setValueAtTime(784 * pm, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'wrong':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'spark':
        osc.type = 'sine';
        [523,659,784,880,1047].forEach((f,i) => {
          osc.frequency.setValueAtTime(f * pm, now + i * 0.07);
        });
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
        break;
      case 'heartbreak':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'gameover':
        osc.type = 'sawtooth';
        [392,349,311,262].forEach((f,i) => {
          osc.frequency.setValueAtTime(f, now + i * 0.18);
        });
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now); osc.stop(now + 0.8);
        break;
      case 'whoosh':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
        break;
      case 'dateComplete':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
    }
  }
};
