// Slingshot Stack - Configuration & Constants

const CONFIG = {
  GAME_WIDTH: 360,
  GAME_HEIGHT: 640,

  COLORS: {
    SKY_TOP: 0x87CEEB,
    SKY_BOTTOM: 0xFFF8DC,
    BLOCK_ORANGE: 0xFF6B35,
    BLOCK_TEAL: 0x00B4D8,
    BLOCK_GREEN: 0x7CB518,
    BLOCK_PINK: 0xE63988,
    SLINGSHOT_WOOD: 0x5C3D2E,
    SLINGSHOT_BAND: 0xE63946,
    GROUND: 0x606C38,
    GROUND_TOP: 0x7A8A4A,
    TOWER_BASE: 0x2B2D42,
    TEXT_DARK: '#1B1B1E',
    TEXT_GOLD: '#FFD700',
    DANGER: '#FF4444',
    WIND_ARROW: 0xFFFFFF,
    DUST: 0xD4C5A9,
    GOLD: 0xFFD700
  },

  BLOCK_STROKE: {
    0xFF6B35: 0xC44E1A,
    0x00B4D8: 0x0088A8,
    0x7CB518: 0x5A8A0F,
    0xE63988: 0xB82D6C
  },

  BLOCK_TYPES: {
    SQUARE: { w: 40, h: 40, color: 0xFF6B35, label: 'square' },
    RECT_WIDE: { w: 60, h: 25, color: 0x00B4D8, label: 'rect_wide' },
    RECT_TALL: { w: 25, h: 50, color: 0x00B4D8, label: 'rect_tall' },
    L_SHAPE: { w: 50, h: 50, color: 0x7CB518, label: 'l_shape' },
    T_SHAPE: { w: 60, h: 40, color: 0x7CB518, label: 't_shape' },
    ICE: { w: 40, h: 40, color: 0xE63988, label: 'ice' }
  },

  PHYSICS: {
    GRAVITY_Y: 2.0,
    BLOCK_DENSITY: 0.005,
    BLOCK_FRICTION: 0.8,
    ICE_FRICTION: 0.4,
    BLOCK_RESTITUTION: 0.1,
    AIR_FRICTION: 0.01,
    SLEEP_THRESHOLD: 60,
    MAX_LAUNCH_VELOCITY: 15,
    SETTLE_SPEED: 0.5,
    SETTLE_FRAMES: 30,
    MAX_BODIES: 50
  },

  SCORE: {
    LAND: 100,
    PERFECT: 250,
    HEIGHT_BONUS: 50,
    COMBO_STEP: 0.5,
    MAX_COMBO: 5,
    NEAR_MISS: 150
  },

  GAMEPLAY: {
    INACTIVITY_TIMEOUT: 30000,
    MAX_MISSES: 3,
    TRAJECTORY_DOTS: 10,
    COLLAPSE_THRESHOLD: 50,
    PERFECT_THRESHOLD: 10,
    CANCEL_DISTANCE: 15,
    GRAB_RADIUS: 40,
    STUCK_TIMEOUT: 5000,
    COLLAPSE_DELAY: 1000,
    SLINGSHOT_X: 70,
    SLINGSHOT_Y_OFFSET: 120
  },

  DIFFICULTY: {
    BLOCK_POOLS: [
      { max: 5, types: ['SQUARE'], weights: [1] },
      { max: 10, types: ['SQUARE', 'RECT_WIDE', 'RECT_TALL'], weights: [0.5, 0.25, 0.25] },
      { max: 15, types: ['SQUARE', 'RECT_WIDE', 'RECT_TALL'], weights: [0.4, 0.3, 0.3] },
      { max: 25, types: ['SQUARE', 'RECT_WIDE', 'RECT_TALL', 'L_SHAPE', 'T_SHAPE'], weights: [0.3, 0.2, 0.15, 0.2, 0.15] },
      { max: 40, types: ['SQUARE', 'RECT_WIDE', 'RECT_TALL', 'L_SHAPE', 'T_SHAPE', 'ICE'], weights: [0.2, 0.15, 0.15, 0.15, 0.15, 0.2] },
      { max: Infinity, types: ['SQUARE', 'RECT_WIDE', 'RECT_TALL', 'L_SHAPE', 'T_SHAPE', 'ICE'], weights: [0.15, 0.15, 0.15, 0.15, 0.15, 0.25] }
    ],
    SCALE: [
      { max: 5, scale: 1.0 },
      { max: 10, scale: 1.0 },
      { max: 15, scale: 0.95 },
      { max: 25, scale: 0.9 },
      { max: 40, scale: 0.8 },
      { max: Infinity, scale: 0.65 }
    ],
    TRAJECTORY_VISIBILITY: [
      { max: 10, pct: 1.0 },
      { max: 15, pct: 0.7 },
      { max: 25, pct: 0.5 },
      { max: 40, pct: 0.3 },
      { max: Infinity, pct: 0 }
    ]
  },

  STORAGE_PREFIX: 'slingshot_stack_'
};
