// Echo Dodge - Configuration & Constants
const COLORS = {
  player: 0x00FFFF,
  playerGlow: 0x00CCCC,
  trail: 0xCC44FF,
  trailFade: 0x661188,
  enemy: 0xFF3366,
  enemyPulse: 0xFF8800,
  bg: 0x080810,
  grid: 0x0D0D1A,
  hud: '#E0E0FF',
  uiBg: '#0A0A20',
  accent: '#FFD700',
  accentHex: 0xFFD700,
  deathTitle: '#FF3366',
  playerHex: '#00FFFF'
};

const TRAIL = {
  LIFETIME_BASE_MS: 2500,
  SEGMENT_INTERVAL_MS: 50,
  POOL_SIZE: 200,
  MIN_MOVE_DIST: 8,
  COLLISION_RADIUS: 8,
  NEAR_MISS_PX: 20
};

const ENEMY = {
  BASE_SPEED: 90,
  SPEED_SCALE: 4,
  MAX_SPEED: 200,
  COLLISION_RADIUS: 14,
  TARGET_UPDATE_MS: 100,
  SPAWN_PADDING: 40,
  SPAWN_MIN_DIST: 150
};

const STAGE = {
  DURATION_BASE: 8,
  DURATION_MAX: 20,
  MAX_ENEMIES: 4,
  REST_INTERVAL: 10,
  REST_DURATION_REDUCTION: 3
};

const SCORE = {
  SURVIVE_PER_SEC: 10,
  NEAR_MISS: 25,
  ENEMY_KILL: 50,
  STAGE_CLEAR_MULT: 100,
  STREAK_WINDOW_MS: 3000,
  STREAK_MULT: 2
};

const INACTIVITY_DEATH_MS = 25000;

const PLAYER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="none" stroke="#00CCCC" stroke-width="2" opacity="0.4"/>
  <circle cx="16" cy="16" r="10" fill="#00FFFF" opacity="0.9"/>
  <circle cx="13" cy="13" r="3" fill="#FFFFFF" opacity="0.6"/>
</svg>`;

const TRAIL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
  <circle cx="6" cy="6" r="5" fill="#CC44FF" opacity="0.85"/>
  <circle cx="6" cy="6" r="2" fill="#EE88FF" opacity="0.6"/>
</svg>`;

const ENEMY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <polygon points="14,2 26,14 14,26 2,14" fill="#FF3366" opacity="0.9"/>
  <polygon points="14,7 21,14 14,21 7,14" fill="#FF6688" opacity="0.5"/>
  <circle cx="14" cy="14" r="3" fill="#FFFFFF" opacity="0.7"/>
</svg>`;

const ENEMY_PULSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="12" fill="none" stroke="#FF8800" stroke-width="2" opacity="0.6"/>
  <polygon points="14,2 22,6 26,14 22,22 14,26 6,22 2,14 6,6" fill="#FF8800" opacity="0.85"/>
  <circle cx="14" cy="14" r="4" fill="#FFCC44" opacity="0.8"/>
</svg>`;

const PARTICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="3" fill="#CC44FF"/>
</svg>`;

const PARTICLE_ENEMY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="3" fill="#FF3366"/>
</svg>`;
