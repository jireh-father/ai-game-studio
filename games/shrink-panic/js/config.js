// Shrink Panic - Configuration
const CONFIG = {
  COLORS: {
    VIEWPORT_BORDER: 0x00FFFF,
    BG_ACTIVE: 0x0A0E27,
    VOID: 0x000000,
    NORMAL_TARGET: 0x39FF14,
    SMALL_TARGET: 0xFF1493,
    DECOY_TARGET: 0xDC143C,
    FLEETING_TARGET: 0xFFD700,
    EXPAND_ENERGY: 0x00BFFF,
    SCORE_TEXT: 0xFFFFFF,
    DANGER_FLASH: 0xFF0000,
    HUD_BG: 0x0A0E27
  },
  COLORS_HEX: {
    VIEWPORT_BORDER: '#00FFFF',
    NORMAL_TARGET: '#39FF14',
    SMALL_TARGET: '#FF1493',
    DECOY_TARGET: '#DC143C',
    FLEETING_TARGET: '#FFD700',
    EXPAND_ENERGY: '#00BFFF',
    SCORE_TEXT: '#FFFFFF',
    DANGER: '#FF0000'
  },
  SCORING: {
    BASE_SCORE: 100,
    EDGE_BONUS: 200,
    COMBO_INCREMENT: 50,
    EXPAND_BONUS: 300,
    SURVIVAL_PER_SEC: 10,
    EDGE_THRESHOLD: 20
  },
  GAMEPLAY: {
    EXPAND_COST: 5,
    EXPAND_RECOVERY: 0.15,
    MISS_PENALTY: 0.20,
    MISS_MAX: 3,
    IDLE_THRESHOLD: 2000,
    IDLE_MULTIPLIER: 3,
    DOUBLE_TAP_THRESHOLD: 300,
    COMBO_WINDOW: 800,
    MIN_VIEWPORT: 30,
    VIEWPORT_MARGIN: 50,
    HUD_HEIGHT: 44
  },
  DIFFICULTY: [
    { time: 0,  shrinkRate: 3, lifespan: 2500, spawnInterval: 1200, maxTargets: 3, types: ['normal'] },
    { time: 10, shrinkRate: 4, lifespan: 2200, spawnInterval: 950,  maxTargets: 4, types: ['normal','small'] },
    { time: 20, shrinkRate: 5, lifespan: 2000, spawnInterval: 700,  maxTargets: 5, types: ['normal','small','decoy'] },
    { time: 30, shrinkRate: 6, lifespan: 1800, spawnInterval: 550,  maxTargets: 6, types: ['normal','small','decoy','fleeting'] },
    { time: 45, shrinkRate: 7, lifespan: 1500, spawnInterval: 400,  maxTargets: 8, types: ['normal','small','decoy','fleeting'] }
  ],
  TARGET_TYPES: {
    normal:   { size: 48, points: 100, color: 0x39FF14, hex: '#39FF14' },
    small:    { size: 32, points: 100, color: 0xFF1493, hex: '#FF1493' },
    decoy:    { size: 48, points: -1,  color: 0xDC143C, hex: '#DC143C' },
    fleeting: { size: 40, points: 250, color: 0xFFD700, hex: '#FFD700' }
  }
};

const SVG = {
  NORMAL_TARGET: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#39FF14" opacity="0.9"/><circle cx="24" cy="24" r="12" fill="#0A0E27"/><circle cx="24" cy="24" r="6" fill="#39FF14"/></svg>',
  SMALL_TARGET: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#FF1493" opacity="0.9"/><circle cx="16" cy="16" r="7" fill="#0A0E27"/></svg>',
  DECOY_TARGET: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#DC143C" opacity="0.9"/><line x1="14" y1="14" x2="34" y2="34" stroke="#0A0E27" stroke-width="4"/><line x1="34" y1="14" x2="14" y2="34" stroke="#0A0E27" stroke-width="4"/></svg>',
  FLEETING_TARGET: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><polygon points="20,2 25,15 39,15 28,24 32,38 20,30 8,38 12,24 1,15 15,15" fill="#FFD700"/></svg>',
  ENERGY_ICON: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" fill="#00BFFF"/></svg>',
  PARTICLE: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>'
};

const STORAGE_KEYS = {
  HIGH_SCORE: 'shrink_panic_high_score',
  GAMES_PLAYED: 'shrink_panic_games_played',
  BEST_TIME: 'shrink_panic_best_time',
  BEST_COMBO: 'shrink_panic_best_combo',
  SOUND: 'shrink_panic_sound'
};
