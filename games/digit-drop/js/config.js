const COLORS = {
  BG: 0x0D1B2A,
  SLOT_EMPTY: 0x1C2D40,
  SLOT_FILLED: 0x162232,
  DIGIT_NORMAL: '#E8F4FD',
  DIGIT_HIGH: '#FFD700',
  DIGIT_POISON: '#FF3B3B',
  SLOT_BORDER: 0x2E5C8A,
  TARGET: '#8BAFC8',
  SCORE: '#39FF14',
  CRYSTAL: 0x00D4FF,
  CRYSTAL_BROKEN: 0x333344,
  STRIKE_FLASH: 0xFF3B3B,
  UI_TEXT: '#FFFFFF',
  STREAK: '#FF7F00',
  AUTOFILL_FLASH: 0xFFFF00,
  TIMER_BAR: 0x00D4FF,
  TIMER_LOW: 0xFF3B3B,
};

const TIMING = {
  DROP_TIMER_BASE_MS: 3000,
  DROP_TIMER_MIN_MS: 2500,
  DROP_TIMER_STEP: 50,
  HIT_STOP_MS: 40,
  SNAP_DURATION: 150,
  SCALE_PUNCH_DURATION: 180,
  ROUND_TRANSITION_MS: 500,
  GAME_OVER_DELAY_MS: 800,
  AUTOFILL_WARN_MS: 300,
};

const SLOTS = {
  MIN_SLOTS: 3,
  MAX_SLOTS: 7,
};

const SCORING = {
  BEAT_0_9: 100,
  BEAT_10_24: 200,
  BEAT_25_49: 400,
  BEAT_50_PLUS: 800,
  CLEAN_SWEEP_BONUS: 500,
  FULL_CONTROL_BONUS: 200,
  STREAK_LEVELS: [1.0, 1.5, 2.0, 2.0, 3.0],
};

const SVG = {
  DIGIT_TILE: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="8" ry="8" fill="none" stroke="#2E5C8A" stroke-width="2"/><rect x="4" y="4" width="56" height="56" rx="6" ry="6" fill="#1C2D40"/><line x1="10" y1="8" x2="54" y2="8" stroke="#3A7BD5" stroke-width="1" opacity="0.4"/></svg>`,
  DIGIT_TILE_POISON: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="8" ry="8" fill="none" stroke="#FF3B3B" stroke-width="2"/><rect x="4" y="4" width="56" height="56" rx="6" ry="6" fill="#2A1015"/><line x1="10" y1="8" x2="54" y2="8" stroke="#FF3B3B" stroke-width="1" opacity="0.4"/></svg>`,
  EMPTY_SLOT: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="0 0 64 80"><rect x="2" y="2" width="60" height="76" rx="6" ry="6" fill="#1C2D40" stroke="#2E5C8A" stroke-width="2" stroke-dasharray="6 4"/></svg>`,
  CRYSTAL: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><polygon points="12,2 22,10 22,22 12,30 2,22 2,10" fill="none" stroke="#00D4FF" stroke-width="1.5"/><polygon points="12,8 18,13 18,21 12,26 6,21 6,13" fill="#00D4FF" opacity="0.3"/></svg>`,
  CRYSTAL_BROKEN: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><polygon points="12,2 22,10 22,22 12,30 2,22 2,10" fill="none" stroke="#444455" stroke-width="1.5"/><polygon points="12,8 18,13 18,21 12,26 6,21 6,13" fill="#333344" opacity="0.3"/><line x1="12" y1="10" x2="18" y2="20" stroke="#555566" stroke-width="1"/><line x1="12" y1="10" x2="6" y2="22" stroke="#555566" stroke-width="1"/></svg>`,
  PARTICLE: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" rx="1" fill="#E8F4FD"/></svg>`,
  PARTICLE_GOLD: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" rx="1" fill="#FFD700"/></svg>`,
  PARTICLE_RED: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" rx="1" fill="#FF3B3B"/></svg>`,
};

const GameState = {
  score: 0,
  highScore: 0,
  strikes: 0,
  stage: 1,
  streak: 0,
  autoFillCount: 0,
  soundEnabled: true,
};

function loadHighScore() {
  try { GameState.highScore = parseInt(localStorage.getItem('digit-drop_high_score') || '0', 10); } catch(e) {}
}
function saveHighScore() {
  try { if (GameState.score > GameState.highScore) { GameState.highScore = GameState.score; localStorage.setItem('digit-drop_high_score', String(GameState.highScore)); } } catch(e) {}
}
function resetGameState() {
  GameState.score = 0;
  GameState.strikes = 0;
  GameState.stage = 1;
  GameState.streak = 0;
  GameState.autoFillCount = 0;
}
