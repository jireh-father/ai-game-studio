// Echo Thief - Configuration & Constants
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const HUD_HEIGHT = 58;
const PLAY_AREA_TOP = HUD_HEIGHT;
const PLAY_AREA_BOTTOM = GAME_HEIGHT;
const PLAY_AREA_HEIGHT = PLAY_AREA_BOTTOM - PLAY_AREA_TOP;

const WAVE_RADIUS = 20;
const CREATURE_RADIUS = 16;
const CONTACT_DISTANCE = WAVE_RADIUS + CREATURE_RADIUS;
const WAVE_MIN_SPEED = 3;
const WAVE_MAX_SPEED = 8;

const NOISE_DECAY_PER_SECOND = 0.5;
const SILENCE_DRAIN_PER_SECOND = 8;
const STAGE_DURATION = 15;

const COLORS = {
    BG: 0x0A0E1A,
    BG_HEX: '#0A0E1A',
    WAVE: '#00E5FF',
    WAVE_HEX: 0x00E5FF,
    WAVE_GLOW: '#80F4FF',
    CREATURE: '#FFB347',
    CREATURE_HEX: 0xFFB347,
    CREATURE_LOUD: '#FF4500',
    CREATURE_LOUD_HEX: 0xFF4500,
    CREATURE_PULSE: '#FFF5CC',
    SILENCE: '#1A1040',
    SILENCE_EDGE: '#4B3B8C',
    SILENCE_HEX: 0x1A1040,
    SILENCE_EDGE_HEX: 0x4B3B8C,
    METER_LOW: 0x44FF88,
    METER_MID: 0xFFE033,
    METER_HIGH: 0xFF6600,
    METER_CRITICAL: 0xFF1111,
    UI_TEXT: '#E8EFFF',
    UI_TEXT_HEX: 0xE8EFFF,
    HUD_BG: 0x0A0E1A,
    GOLD: '#FFD700',
    GOLD_HEX: 0xFFD700
};

const SCORE_VALUES = {
    SURVIVE_PER_SEC: 10,
    SILENCE_ENTER: 50,
    SILENCE_PER_SEC: 10,
    STAGE_COMPLETE_BASE: 200,
    STAGE_COMPLETE_BONUS: 20,
    CHAIN_SILENCE: 500,
    CLOSE_CALL: 100
};

const SVG_STRINGS = {
    wave: `<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="30" fill="none" stroke="#80F4FF" stroke-width="2" opacity="0.4"/>
  <circle cx="32" cy="32" r="22" fill="none" stroke="#00E5FF" stroke-width="3" opacity="0.7"/>
  <circle cx="32" cy="32" r="12" fill="#00E5FF" opacity="0.9"/>
  <circle cx="32" cy="32" r="4" fill="#FFFFFF"/>
</svg>`,
    creature: `<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="24" cy="24" rx="22" ry="20" fill="#FFB347" opacity="0.2"/>
  <ellipse cx="24" cy="26" rx="16" ry="14" fill="#FFB347" opacity="0.85"/>
  <path d="M17 22 Q20 19 23 22" fill="none" stroke="#7A4000" stroke-width="2" stroke-linecap="round"/>
  <path d="M25 22 Q28 19 31 22" fill="none" stroke="#7A4000" stroke-width="2" stroke-linecap="round"/>
  <text x="30" y="14" font-size="8" fill="#FFD580" opacity="0.7">z</text>
</svg>`,
    'creature-loud': `<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="23" fill="none" stroke="#FF4500" stroke-width="2" opacity="0.6"/>
  <ellipse cx="24" cy="26" rx="16" ry="14" fill="#FF6633" opacity="0.9"/>
  <path d="M16 22 Q20 18 24 22" fill="none" stroke="#7A0000" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M24 22 Q28 18 32 22" fill="none" stroke="#7A0000" stroke-width="2.5" stroke-linecap="round"/>
</svg>`,
    silence: `<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="60" rx="58" ry="55" fill="#1A1040" opacity="0.5"/>
  <ellipse cx="60" cy="60" rx="48" ry="45" fill="#0D0820" opacity="0.8"/>
  <ellipse cx="60" cy="60" rx="58" ry="55" fill="none" stroke="#4B3B8C" stroke-width="2" opacity="0.6"/>
</svg>`,
    'star-dot': `<svg width="4" height="4" xmlns="http://www.w3.org/2000/svg">
  <circle cx="2" cy="2" r="1.5" fill="#E8EFFF" opacity="0.3"/>
</svg>`,
    particle: `<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="4" r="3" fill="#00E5FF"/>
</svg>`,
    'particle-amber': `<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="4" r="3" fill="#FFB347"/>
</svg>`
};

// Global game state
const GameState = {
    highScore: 0,
    gamesPlayed: 0,
    currentScore: 0,
    currentStage: 1,
    hasUsedContinue: false,
    deathCount: 0
};

function loadSettings() {
    try {
        GameState.highScore = parseInt(localStorage.getItem('echo-thief_high_score') || '0', 10);
        GameState.gamesPlayed = parseInt(localStorage.getItem('echo-thief_games_played') || '0', 10);
    } catch (e) { /* localStorage unavailable */ }
}

function saveSettings() {
    try {
        localStorage.setItem('echo-thief_high_score', String(GameState.highScore));
        localStorage.setItem('echo-thief_games_played', String(GameState.gamesPlayed));
    } catch (e) { /* localStorage unavailable */ }
}
