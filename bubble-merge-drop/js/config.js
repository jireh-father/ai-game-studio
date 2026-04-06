// config.js — Game constants, colors, SVG strings, difficulty tables
window.CONFIG = {
  GAME_WIDTH: 360,
  GAME_HEIGHT: 680,
  CONTAINER: { x: 30, y: 90, width: 300, height: 530 },
  DANGER_Y: 100,
  BASE_RADIUS: 20,
  FORCED_DROP_BASE: 3.0,
  FLOOR_RISE_BASE: 0.5,
  INACTIVITY_DEATH: 25000,
  GRACE_PERIOD: 3000,
  BODY_LIMIT: 42,
  SURVIVAL_INTERVAL: 15000,

  COLORS: {
    RED: '#FF4757', BLUE: '#1E90FF', GREEN: '#2ED573',
    YELLOW: '#FFA502', PURPLE: '#A855F7'
  },
  COLOR_KEYS: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'],
  COLOR_TINTS: {
    RED: 0xFF4757, BLUE: 0x1E90FF, GREEN: 0x2ED573,
    YELLOW: 0xFFA502, PURPLE: 0xA855F7
  },

  TIER_SIZES: [1.0, 1.3, 1.7, 2.2, 2.8],
  TIER_NAMES: ['small', 'medium', 'large', 'giant', 'super'],

  SCORE_VALUES: { MERGE_S: 10, MERGE_M: 30, MERGE_L: 100, MERGE_G: 300, MERGE_SUPER: 500, SURVIVAL: 25, BOMB_CLEAR: 5 },
  COMBO_MULTIPLIERS: [1, 1, 1.5, 2, 2, 3],
  CHAIN_BONUS: 50,

  LEVELS: [
    { duration: 60, colors: 4, bombChance: 0, rainbowChance: 0, driftRange: 0, floorRiseInterval: 2.0, forcedDropTimer: 3.0, radiusMult: 1.0 },
    { duration: 60, colors: 4, bombChance: 0.10, rainbowChance: 0, driftRange: 0, floorRiseInterval: 1.5, forcedDropTimer: 3.0, radiusMult: 1.1 },
    { duration: 60, colors: 4, bombChance: 0.10, rainbowChance: 0.05, driftRange: 15, floorRiseInterval: 1.2, forcedDropTimer: 3.0, radiusMult: 1.2 },
    { duration: 60, colors: 5, bombChance: 0.10, rainbowChance: 0.05, driftRange: 15, floorRiseInterval: 1.0, forcedDropTimer: 2.5, radiusMult: 1.3 },
    { duration: 9999, colors: 5, bombChance: 0.12, rainbowChance: 0.08, driftRange: 20, floorRiseInterval: 0.8, forcedDropTimer: 2.0, radiusMult: 1.4 }
  ],

  UI: {
    BG: '#1A1A2E', HUD_BG: '#16213E', TEXT: '#FFFFFF',
    COMBO_TEXT: '#FFD700', DANGER: '#FF4757', WALL: '#AAAAFF',
    BUTTON_GREEN: '#2ED573', BUTTON_GREY: '#57606F'
  },

  SVG: {
    BUBBLE: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#FFFFFF" opacity="0.95"/><ellipse cx="22" cy="20" rx="9" ry="6" fill="#FFFFFF" opacity="0.45" transform="rotate(-30 22 20)"/><circle cx="30" cy="30" r="28" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="2"/></svg>`,
    BOMB: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="32" r="24" fill="#2F3542"/><path d="M30 8 Q36 2 40 6" stroke="#FF6B35" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="6" r="3" fill="#FFD700"/><ellipse cx="23" cy="24" rx="7" ry="4" fill="#FFFFFF" opacity="0.3" transform="rotate(-30 23 24)"/><circle cx="24" cy="33" r="4" fill="#FFFFFF" opacity="0.7"/><circle cx="36" cy="33" r="4" fill="#FFFFFF" opacity="0.7"/></svg>`,
    RAINBOW: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#FFFFFF"/><polygon points="30,12 34,24 47,24 37,32 41,44 30,36 19,44 23,32 13,24 26,24" fill="#FFD700" opacity="0.85"/><ellipse cx="22" cy="20" rx="8" ry="5" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 22 20)"/></svg>`,
    PARTICLE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#FFFFFF"/></svg>`
  }
};
