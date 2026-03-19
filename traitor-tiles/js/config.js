const CONFIG = {
  COLORS: {
    BG: 0x0A0E1A,
    TILE_SAFE: 0x1E2A45,
    TILE_BORDER: 0x2E4A7A,
    TILE_POISONED: 0x8B1A1A,
    TILE_POISONED_GLOW: 0xFF2233,
    TILE_PRE_POISON: 0x3D1A00,
    TILE_PRE_POISON_BORDER: 0xFF6600,
    PLAYER: 0x00E5FF,
    PLAYER_GLOW: 0x4DFFF5,
    GOAL: 0xFFD700,
    GOAL_GLOW: 0xFFA500,
    HUD_TEXT: '#E8EAF0',
    HUD_BG: 0x0D1525,
    WARNING_PULSE: 0xFF8C00,
    DANGER_FLASH: 0xCC0000,
    STAGE_CLEAR: 0x00CC44,
    DEATH_GOLD: 0xFFD700
  },

  TIMING: {
    GOAL_ADVANCE_BASE: 3000,
    GOAL_WARNING_MS: 600,
    MOVE_TWEEN_MS: 120,
    DEATH_DELAY_MS: 1800,
    STAGE_CLEAR_DELAY: 800,
    INPUT_LOCK_MS: 130,
    HIT_STOP_MOVE: 40,
    HIT_STOP_DEATH_POISON: 80,
    HIT_STOP_DEATH_GOAL: 60
  },

  SCORE: {
    STAGE_BASE: 100,
    STAGE_MULT: 20,
    SPEED_BONUS: 50,
    SPEED_THRESHOLD: 5000,
    EFFICIENCY_BONUS: 75,
    EFFICIENCY_THRESHOLD: 0.2,
    STREAK_BONUS: 25
  },

  STREAK_MULTIPLIERS: [1.0, 1.25, 1.5, 2.0],

  GRID: {
    BASE_WIDTH: 320,
    HUD_HEIGHT: 52,
    TIMER_BAR_HEIGHT: 40,
    GAP: 4,
    MIN_TILE_SIZE: 40
  },

  SVG_PLAYER: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#4DFFF5" stroke-width="2" opacity="0.4"/><circle cx="24" cy="24" r="14" fill="#00E5FF"/><circle cx="24" cy="24" r="6" fill="#0A0E1A"/><polygon points="24,6 20,14 28,14" fill="#00E5FF" opacity="0.8"/></svg>')}`,

  SVG_GOAL: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><polygon points="14,2 17,10 26,10 19,15 22,24 14,19 6,24 9,15 2,10 11,10" fill="#FFD700" stroke="#FFA500" stroke-width="1"/></svg>')}`,

  SVG_SKULL: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><ellipse cx="12" cy="10" rx="7" ry="7" fill="#FF2233" opacity="0.6"/><rect x="8" y="14" width="8" height="4" rx="1" fill="#FF2233" opacity="0.6"/><circle cx="9" cy="10" r="2" fill="#0A0E1A"/><circle cx="15" cy="10" r="2" fill="#0A0E1A"/></svg>')}`,

  SVG_WARNING: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 18,18 2,18" fill="none" stroke="#FF6600" stroke-width="1.5"/><line x1="10" y1="8" x2="10" y2="13" stroke="#FF6600" stroke-width="2"/><circle cx="10" cy="16" r="1" fill="#FF6600"/></svg>')}`,

  LS_KEY: 'traitor-tiles_high_score'
};
