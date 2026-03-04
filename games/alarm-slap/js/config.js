// config.js — Game constants, difficulty tables, color palette, score values

const CONFIG = {
  GAME_WIDTH: 360,
  GAME_HEIGHT: 640,

  COLORS: {
    BG_DARK: 0x1A1A2E,
    SURFACE: 0x8B5E3C,
    ALARM_STATIONARY: 0xF5C518,
    ALARM_MOVING: 0xFF6B00,
    ALARM_MUFFLER: 0xC0C0C0,
    RING_BAR: 0xFF2222,
    NOISE_SAFE: 0x44CC44,
    NOISE_WARN: 0xFF8800,
    NOISE_CRIT: 0xFF0000,
    UI_TEXT: 0xFFFFFF,
    UI_BG: 0x0D0D1A,
    COMBO_TEXT: 0xFFD700,
    HEX: {
      BG_DARK: '#1A1A2E',
      SURFACE: '#8B5E3C',
      ALARM_STAT: '#F5C518',
      ALARM_MOVE: '#FF6B00',
      ALARM_MUFF: '#C0C0C0',
      RING: '#FF2222',
      SAFE: '#44CC44',
      WARN: '#FF8800',
      CRIT: '#FF0000',
      WHITE: '#FFFFFF',
      UI_BG: '#0D0D1A',
      GOLD: '#FFD700',
    }
  },

  SCORE: {
    SLAP_STATIONARY: 100,
    SLAP_MOVING: 150,
    SMASH: 300,
    MUFFLER: 50,
    STAGE_CLEAR_BASE: 500,
    STAGE_CLEAR_PER: 100,
  },

  COMBO_THRESHOLDS: [
    { min: 5, mult: 2 },
    { min: 10, mult: 3 },
    { min: 20, mult: 5 },
    { min: 30, mult: 7 },
  ],

  NOISE_PER_ALARM: 8,
  IDLE_TIMEOUT_MS: 5000,
  IDLE_WARN_MS: 4000,
  IDLE_NOISE_PENALTY: 30,
  MUFFLER_DRAIN: 20,

  ALARM_POOL_SIZE: 8,
  ALARM_HIT_RADIUS: 44,
  SWIPE_MIN_DIST: 15,
  SWIPE_DIR_TOLERANCE: 45, // degrees
  DOUBLE_TAP_MS: 150,

  HUD_TOP_HEIGHT: 56,
  HUD_BOTTOM_HEIGHT: 48,

  ALARM_TYPES: {
    STATIONARY: 0,
    SLOW_MOVER: 1,
    FAST_MOVER: 2,
    BOUNCER: 3,
    SPLITTER: 4,
    MUFFLER: 5,
  },
};

// SVG strings for alarm clock textures
const SVG = {
  ALARM_STATIONARY: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="8" fill="#F5C518" stroke="#222" stroke-width="2"/>
    <circle cx="50" cy="14" r="8" fill="#F5C518" stroke="#222" stroke-width="2"/>
    <circle cx="32" cy="36" r="24" fill="#F5C518" stroke="#222" stroke-width="3"/>
    <circle cx="32" cy="36" r="18" fill="#FFFDE7" stroke="#222" stroke-width="1.5"/>
    <line x1="32" y1="36" x2="32" y2="22" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="32" y1="36" x2="44" y2="30" stroke="#222" stroke-width="2" stroke-linecap="round"/>
    <circle cx="32" cy="36" r="2.5" fill="#222"/>
    <ellipse cx="22" cy="60" rx="6" ry="4" fill="#F5C518" stroke="#222" stroke-width="1.5"/>
    <ellipse cx="42" cy="60" rx="6" ry="4" fill="#F5C518" stroke="#222" stroke-width="1.5"/>
  </svg>`,

  ALARM_MOVING: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="8" fill="#FF6B00" stroke="#222" stroke-width="2"/>
    <circle cx="50" cy="14" r="8" fill="#FF6B00" stroke="#222" stroke-width="2"/>
    <circle cx="32" cy="36" r="24" fill="#FF6B00" stroke="#222" stroke-width="3"/>
    <circle cx="32" cy="36" r="18" fill="#FFF0E0" stroke="#222" stroke-width="1.5"/>
    <rect x="22" y="26" width="8" height="3" rx="1" fill="#222" transform="rotate(-15 26 27.5)"/>
    <rect x="34" y="26" width="8" height="3" rx="1" fill="#222" transform="rotate(15 38 27.5)"/>
    <line x1="32" y1="36" x2="32" y2="24" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="32" y1="36" x2="42" y2="32" stroke="#222" stroke-width="2" stroke-linecap="round"/>
    <circle cx="32" cy="36" r="2.5" fill="#222"/>
    <ellipse cx="22" cy="60" rx="6" ry="4" fill="#FF6B00" stroke="#222" stroke-width="1.5"/>
    <ellipse cx="42" cy="60" rx="6" ry="4" fill="#FF6B00" stroke="#222" stroke-width="1.5"/>
  </svg>`,

  ALARM_MUFFLER: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="36" r="28" fill="none" stroke="#88DDFF" stroke-width="4" opacity="0.4"/>
    <circle cx="14" cy="14" r="8" fill="#C0C0C0" stroke="#555" stroke-width="2"/>
    <circle cx="50" cy="14" r="8" fill="#C0C0C0" stroke="#555" stroke-width="2"/>
    <circle cx="32" cy="36" r="24" fill="#C0C0C0" stroke="#555" stroke-width="3"/>
    <circle cx="32" cy="36" r="18" fill="#E8E8E8" stroke="#555" stroke-width="1.5"/>
    <text x="22" y="40" font-size="14" font-weight="bold" fill="#555">ZZZ</text>
    <ellipse cx="22" cy="60" rx="6" ry="4" fill="#C0C0C0" stroke="#555" stroke-width="1.5"/>
    <ellipse cx="42" cy="60" rx="6" ry="4" fill="#C0C0C0" stroke="#555" stroke-width="1.5"/>
  </svg>`,

  BACKGROUND: `<svg viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="640" fill="#1A1A2E"/>
    <rect x="0" y="520" width="360" height="120" fill="#8B5E3C" rx="0"/>
    <line x1="0" y1="540" x2="360" y2="538" stroke="#7A5030" stroke-width="1" opacity="0.6"/>
    <line x1="0" y1="570" x2="360" y2="568" stroke="#7A5030" stroke-width="1" opacity="0.6"/>
    <rect x="160" y="590" width="40" height="10" rx="3" fill="#6B4423" stroke="#5A3318" stroke-width="1"/>
    <rect x="120" y="60" width="120" height="160" rx="8" fill="#1C2951" stroke="#2A3A6A" stroke-width="3"/>
    <line x1="180" y1="60" x2="180" y2="220" stroke="#2A3A6A" stroke-width="2"/>
    <line x1="120" y1="140" x2="240" y2="140" stroke="#2A3A6A" stroke-width="2"/>
    <circle cx="160" cy="100" r="25" fill="#FFFDE7" opacity="0.3"/>
  </svg>`,
};
