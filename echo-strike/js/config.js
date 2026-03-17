// Echo Strike - Configuration & Constants
const COLORS = {
  BG: '#0A0A0F',
  TARGET_DIM: '#1A1A3E',
  TARGET_BRIGHT: '#E8F4FF',
  TARGET_RING: '#00D4FF',
  ECHO_GHOST: '#00FFEE',
  ECHO_FIRE: '#00FFEE',
  WALL_DANGER: '#FF4422',
  WALL_GLOW: '#FF0000',
  HUD_TEXT: '#FFFFFF',
  COMBO_ACCENT: '#FFD700',
  MISS_FLASH: '#FF2200',
  PERFECT_HIT: '#88FF44',
  HIGH_SCORE: '#FFD700',
  FAST_PULSER: '#FF6600',
  DECOY: '#AA00FF'
};

const COLORS_INT = {
  TARGET_RING: 0x00D4FF,
  ECHO_GHOST: 0x00FFEE,
  WALL_DANGER: 0xFF4422,
  WALL_GLOW: 0xFF0000,
  WALL_EXPAND: 0x00FF44,
  MISS_FLASH: 0xFF2200,
  PERFECT_HIT: 0x88FF44,
  COMBO_ACCENT: 0xFFD700,
  BG: 0x0A0A0F,
  WHITE: 0xFFFFFF,
  RED_FLASH: 0xFF0000
};

const SCORING = {
  BASE_HIT: 100,
  ECHO_HIT: 250,
  PERFECT_BONUS: 50,
  ECHO_COMBO_BONUS: 100,
  COMBO_TIERS: [
    { min: 0, mult: 1 },
    { min: 5, mult: 1.5 },
    { min: 10, mult: 2 },
    { min: 15, mult: 3 }
  ]
};

const WALL_CONFIG = {
  INITIAL_MARGIN: 0,
  MISS_PENALTY_BASE: 22,
  ECHO_PUSH_BACK: 10,
  DANGER_THRESHOLD: 100,
  AD_PUSH_BACK: 100,
  INACTIVITY_THRESHOLD_MS: 5000,
  INACTIVITY_CONTRACT_PX: 8,
  INACTIVITY_INTERVAL_MS: 500,
  TIME_CONTRACT_PX: 3,
  TIME_CONTRACT_INTERVAL_MS: 1500
};

const ECHO_CONFIG = {
  DELAY_MS: 2000,
  HIT_RADIUS: 44,
  MAX_QUEUE: 20
};

const STAGE_CONFIG = {
  HITS_PER_STAGE_BASE: 3,
  HITS_PER_STAGE_CAP: 15,
  REST_STAGE_INTERVAL: 10,
  REST_DIFFICULTY_REDUCTION: 0.15
};

const SVG_STRINGS = {
  target: `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88">
  <circle cx="44" cy="44" r="42" fill="none" stroke="#00D4FF" stroke-width="2" opacity="0.6"/>
  <circle cx="44" cy="44" r="36" fill="#1A1A3E" stroke="#00D4FF" stroke-width="1.5"/>
  <line x1="44" y1="24" x2="44" y2="64" stroke="#00D4FF" stroke-width="1" opacity="0.4"/>
  <line x1="24" y1="44" x2="64" y2="44" stroke="#00D4FF" stroke-width="1" opacity="0.4"/>
  <circle cx="44" cy="44" r="5" fill="#00D4FF" opacity="0.8"/>
</svg>`,
  fastPulser: `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88">
  <polygon points="44,2 86,76 2,76" fill="none" stroke="#FF6600" stroke-width="2" opacity="0.5"/>
  <circle cx="44" cy="44" r="34" fill="#1A0A0E" stroke="#FF6600" stroke-width="1.5"/>
  <circle cx="44" cy="44" r="5" fill="#FF6600" opacity="0.9"/>
</svg>`,
  decoy: `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88">
  <circle cx="44" cy="44" r="36" fill="#150015" stroke="#AA00FF" stroke-width="1.5"/>
  <line x1="28" y1="28" x2="60" y2="60" stroke="#AA00FF" stroke-width="2" opacity="0.6"/>
  <line x1="60" y1="28" x2="28" y2="60" stroke="#AA00FF" stroke-width="2" opacity="0.6"/>
  <circle cx="44" cy="44" r="5" fill="#AA00FF" opacity="0.7"/>
</svg>`,
  echoGhost: `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88">
  <circle cx="44" cy="44" r="38" fill="none" stroke="#00FFEE" stroke-width="2" stroke-dasharray="8 6" opacity="0.5"/>
  <circle cx="44" cy="44" r="8" fill="#00FFEE" opacity="0.3"/>
</svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#00D4FF"/>
</svg>`,
  particleWhite: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#FFFFFF"/>
</svg>`,
  particleLime: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#88FF44"/>
</svg>`
};

const CONFIG = {
  GAME_WIDTH: 360,
  GAME_HEIGHT: 640,
  HUD_HEIGHT: 40,
  TARGET_POOL_SIZE: 8,
  MAX_PARTICLES: 120,
  INACTIVITY_CHECK_MS: 500
};
