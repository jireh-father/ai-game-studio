// config.js — Game constants for Magma Flow
const CONFIG = {
  // Physics
  GRAVITY: 400,
  LAVA_RADIUS: 8,
  PARTICLE_RATE: 20, // particles per second per source
  HARDEN_VELOCITY: 10,
  HARDEN_TIME: 3000,
  PARTICLE_POOL_SIZE: 200,

  // Walls
  MAX_WALLS: 5,
  WALL_WIDTH: 6,
  WALL_COLLISION_WIDTH: 18,
  WALL_MAX_LENGTH: 200,
  WALL_MIN_LENGTH: 20,
  WALL_SNAP: 8,
  WALL_RESTITUTION: 0.6,

  // Timing
  COUNTDOWN_MS: 1000,
  IDLE_LIMIT: 10000,
  IDLE_WARN: 8000,
  STAGE_TRANSITION: 800,
  DEATH_ANIM: 1200,
  STAGE_CLEAR_PERCENT: 0.95,

  // Colors
  COL_BG: 0x1A0A00,
  COL_BG_TOP: 0x0D0D0D,
  COL_LAVA_HOT: 0xFF4500,
  COL_LAVA_WARM: 0xFF8C00,
  COL_LAVA_COOL: 0x8B0000,
  COL_LAVA_HARD: 0x444444,
  COL_WALL: 0x00FFFF,
  COL_WALL_GLOW: 0x004444,
  COL_TARGET_RIM: 0xFFD700,
  COL_TARGET_INNER: 0xCC4400,
  COL_TARGET_ACTIVE: 0xFF6600,
  COL_OBSTACLE: 0x5C4033,
  COL_HUD_BG: 0x000000,
  COL_SCORE: '#FFFFFF',
  COL_TIMER_WARN: '#FF3333',
  COL_COMBO: '#FFFF00',

  // Difficulty scaling
  getTimeLimit: (n) => Math.max(10, 20 - (n - 1) * 0.5),
  getFlowRate: (n) => 120 + (n - 1) * 6,
  getMaxWalls: (n) => n >= 21 ? 3 : n >= 16 ? 4 : 5,
  getWallTTL: (n) => Math.max(2500, 5000 - (n - 1) * 100),
  getTargetWidth: (n) => Math.max(40, 80 - (n - 1) * 2),
  getSourceCount: (n) => n <= 6 ? 1 : n <= 15 ? 2 : 3,
  getTargetCount: (n) => n <= 6 ? 1 : n >= 21 ? 3 : 2,
  hasObstacles: (n) => n >= 11,
  hasMovingTargets: (n) => n >= 4,

  // Combo multipliers
  COMBO_MULTS: [1.0, 1.0, 1.2, 1.5, 2.0],
  getComboMult: (streak) => {
    if (streak >= 4) return 2.0;
    return CONFIG.COMBO_MULTS[streak] || 1.0;
  }
};
