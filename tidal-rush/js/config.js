const CONFIG = {
  WIDTH: 360,
  HEIGHT: 700,
  GRAVITY: 980,
  INACTIVITY_DEATH_SECONDS: 10,
  INACTIVITY_WARN_SECONDS: 7,
  PLATFORM_HEIGHT: 18,
  PLAYER_WIDTH: 24,
  PLAYER_HEIGHT: 32,
  MAX_POOL_SIZE: 15,
  WATER_START_Y: 750,
  SHORT_JUMP: -480,
  MAX_JUMP: -680,
  HOLD_THRESHOLD_MS: 200,
  CAMERA_LEAD_X: 100,

  COLORS: {
    PLAYER: '#FFFFFF',
    PLATFORM_NORMAL: '#F4A261',
    PLATFORM_NORMAL_HIGHLIGHT: '#FFBA80',
    PLATFORM_MOVING: '#2EC4B6',
    PLATFORM_MOVING_ARROW: '#1A8A84',
    PLATFORM_CRUMBLE: '#E9C46A',
    PLATFORM_CRUMBLE_CRACK: '#C07A1A',
    PLATFORM_SINKING: '#C1440E',
    WATER_SURFACE: '#0077B6',
    WATER_BODY: '#023E8A',
    WATER_FOAM: '#ADE8F4',
    SKY_TOP: '#FF6B35',
    SKY_BOTTOM: '#F7931E',
    DANGER: '#E63946',
    HUD_TEXT: '#FFFFFF',
    HUD_BG: 'rgba(0,0,0,0.6)',
    COMBO: '#FFD700',
    DEBRIS: '#C07A1A'
  },

  SCORE: {
    PLATFORM_LAND: 10,
    STAGE_CLEAR: 100,
    NEAR_MISS: 25,
    PERFECT_LAND: 15,
    WATER_SURVIVED: 5
  },

  DIFFICULTY: [
    { // stage 1-3
      maxStage: 3,
      runSpeed: 120,
      platformMinW: 80, platformMaxW: 140,
      gapMin: 40, gapMax: 70,
      waterRise: 12,
      sinkMs: 1200,
      movingChance: 0, crumbleChance: 0
    },
    { // stage 4-8
      maxStage: 8,
      runSpeed: 160,
      platformMinW: 65, platformMaxW: 120,
      gapMin: 55, gapMax: 90,
      waterRise: 20,
      sinkMs: 900,
      movingChance: 0, crumbleChance: 0
    },
    { // stage 9-15
      maxStage: 15,
      runSpeed: 200,
      platformMinW: 55, platformMaxW: 100,
      gapMin: 65, gapMax: 110,
      waterRise: 30,
      sinkMs: 700,
      movingChance: 0.3, crumbleChance: 0
    },
    { // stage 16-25
      maxStage: 25,
      runSpeed: 220,
      platformMinW: 45, platformMaxW: 85,
      gapMin: 70, gapMax: 130,
      waterRise: 40,
      sinkMs: 400,
      movingChance: 0.4, crumbleChance: 0.25
    },
    { // stage 26-40
      maxStage: 40,
      runSpeed: 240,
      platformMinW: 40, platformMaxW: 75,
      gapMin: 75, gapMax: 140,
      waterRise: 50,
      sinkMs: 350,
      movingChance: 0.5, crumbleChance: 0.35
    },
    { // stage 41+
      maxStage: Infinity,
      runSpeed: 260,
      platformMinW: 36, platformMaxW: 70,
      gapMin: 80, gapMax: 150,
      waterRise: 60,
      sinkMs: 300,
      movingChance: 0.6, crumbleChance: 0.5
    }
  ],

  STORAGE_KEYS: {
    HIGH_SCORE: 'tidal-rush_high_score',
    GAMES_PLAYED: 'tidal-rush_games_played',
    HIGHEST_STAGE: 'tidal-rush_highest_stage',
    SETTINGS: 'tidal-rush_settings',
    TOTAL_SCORE: 'tidal-rush_total_score'
  }
};

function getDifficultyForStage(stageNum) {
  for (const d of CONFIG.DIFFICULTY) {
    if (stageNum <= d.maxStage) return d;
  }
  return CONFIG.DIFFICULTY[CONFIG.DIFFICULTY.length - 1];
}

function getStorage(key, defaultVal) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : defaultVal;
  } catch { return defaultVal; }
}

function setStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function getSettings() {
  return getStorage(CONFIG.STORAGE_KEYS.SETTINGS, { sound: true, music: true, vibration: true });
}
