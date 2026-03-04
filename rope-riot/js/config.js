const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  BG_COLOR: 0x0A0A12,
  COLORS: {
    PLAYER: 0x00FFFF,
    PLAYER_STROKE: 0x00AAAA,
    ROPE: 0xFFE600,
    ROPE_GLOW: 0xFFFF00,
    PLATFORM: 0x3A4A6B,
    PLATFORM_EDGE: 0x6B7DA0,
    PLATFORM_HIGHLIGHT: 0x8899BB,
    ENEMY_WALKER: 0xFF4444,
    ENEMY_RUNNER: 0xFF8800,
    ENEMY_JUMPER: 0xAA44FF,
    ENEMY_SHIELDED: 0xAAAAAA,
    ENEMY_EXPOSED: 0xCC2222,
    ENEMY_SPLITTER: 0xFF44AA,
    PIT: 0x000000,
    UI_TEXT: 0xFFFFFF,
    UI_ACCENT: 0xFFD700,
    PARTICLE_HIT: 0xFFFFAA,
    PARTICLE_DEATH: 0x00FFEE,
    DANGER: 0xFF0000
  },
  PHYSICS: {
    ROPE_LENGTH: 180,
    ROPE_FORCE_BASE: 0.08,
    ROPE_SEGMENTS: 12,
    ROPE_MIN_DRAG: 60,
    GRAVITY: 500,
    PLAYER_DODGE_DIST: 40,
    PLAYER_DODGE_COOLDOWN: 400,
    ENEMY_HIT_MIN_VELOCITY: 400,
    TAP_THRESHOLD: 150
  },
  TIMING: {
    INACTIVITY_WARN: 9000,
    INACTIVITY_DEATH: 12000,
    DEATH_EFFECT_MS: 400,
    STAGE_TRANSITION_MS: 300,
    GRACE_PERIOD_MS: 2000
  },
  SCORING: {
    KILL: 100,
    MULTIKILL_MULT: 1.5,
    WAVE_NODODGE: 500,
    STAGE_CLEAR_MULT: 200,
    COMBO_INCREMENT: 0.25,
    COMBO_MAX: 3.0
  },
  ENEMY_TYPES: {
    WALKER: 'walker',
    RUNNER: 'runner',
    JUMPER: 'jumper',
    SHIELDED: 'shielded',
    SPLITTER: 'splitter'
  },
  STORAGE_KEYS: {
    HIGH_SCORE: 'rope-riot_high_score',
    GAMES_PLAYED: 'rope-riot_games_played',
    HIGHEST_STAGE: 'rope-riot_highest_stage',
    SETTINGS: 'rope-riot_settings'
  }
};

// SVG string definitions for all game textures
const SVG = {
  player: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="40">
    <circle cx="12" cy="10" r="9" fill="#00FFFF" stroke="#00AAAA" stroke-width="2"/>
    <circle cx="8" cy="9" r="2" fill="#003344"/>
    <circle cx="16" cy="9" r="2" fill="#003344"/>
    <rect x="3" y="18" width="18" height="22" rx="4" fill="#00FFFF" stroke="#00AAAA" stroke-width="2"/>
    <circle cx="21" cy="26" r="3" fill="#FFE600"/>
  </svg>`,
  walker: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="32">
    <circle cx="10" cy="9" r="8" fill="#FF4444" stroke="#AA2222" stroke-width="2"/>
    <circle cx="7" cy="8" r="2" fill="#440000"/>
    <circle cx="13" cy="8" r="2" fill="#440000"/>
    <line x1="5" y1="5" x2="8" y2="7" stroke="#440000" stroke-width="2"/>
    <line x1="15" y1="5" x2="12" y2="7" stroke="#440000" stroke-width="2"/>
    <rect x="3" y="16" width="14" height="16" rx="3" fill="#FF4444" stroke="#AA2222" stroke-width="2"/>
  </svg>`,
  runner: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="32">
    <g transform="skewX(-10)">
      <circle cx="10" cy="8" r="7" fill="#FF8800" stroke="#AA5500" stroke-width="2"/>
      <circle cx="7" cy="7" r="2" fill="#442200"/>
      <circle cx="13" cy="7" r="2" fill="#442200"/>
      <rect x="4" y="14" width="12" height="18" rx="3" fill="#FF8800" stroke="#AA5500" stroke-width="2"/>
    </g>
  </svg>`,
  jumper: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="28">
    <circle cx="11" cy="11" r="11" fill="#AA44FF" stroke="#6600CC" stroke-width="2"/>
    <circle cx="7" cy="10" r="2.5" fill="#110022"/>
    <circle cx="15" cy="10" r="2.5" fill="#110022"/>
    <polyline points="5,22 7,26 9,22 11,26 13,22" stroke="#AA44FF" stroke-width="2" fill="none"/>
    <polyline points="11,22 13,26 15,22 17,26 19,22" stroke="#AA44FF" stroke-width="2" fill="none"/>
  </svg>`,
  shielded: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32">
    <rect x="2" y="2" width="20" height="28" rx="2" fill="none" stroke="#AAAAAA" stroke-width="3"/>
    <circle cx="12" cy="10" r="8" fill="#AAAAAA" stroke="#888888" stroke-width="2"/>
    <circle cx="9" cy="9" r="2" fill="#333333"/>
    <circle cx="15" cy="9" r="2" fill="#333333"/>
    <rect x="5" y="17" width="14" height="15" rx="3" fill="#AAAAAA" stroke="#888888" stroke-width="2"/>
  </svg>`,
  exposed: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32">
    <circle cx="12" cy="10" r="8" fill="#CC2222" stroke="#AA0000" stroke-width="2"/>
    <circle cx="9" cy="9" r="2" fill="#440000"/>
    <circle cx="15" cy="9" r="2" fill="#440000"/>
    <rect x="5" y="17" width="14" height="15" rx="3" fill="#CC2222" stroke="#AA0000" stroke-width="2"/>
  </svg>`,
  splitter: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
    <polygon points="10,0 20,10 10,20 0,10" fill="#FF44AA" stroke="#AA0066" stroke-width="2"/>
    <circle cx="7" cy="10" r="2" fill="#440022"/>
    <circle cx="13" cy="10" r="2" fill="#440022"/>
  </svg>`,
  splitterSmall: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
    <polygon points="6,0 12,6 6,12 0,6" fill="#FF44AA" stroke="#AA0066" stroke-width="1.5"/>
  </svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
    <circle cx="4" cy="4" r="4" fill="#FFFFAA"/>
  </svg>`,
  particleCyan: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
    <circle cx="4" cy="4" r="4" fill="#00FFEE"/>
  </svg>`,
  particleGold: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
    <circle cx="4" cy="4" r="4" fill="#FFD700"/>
  </svg>`
};
