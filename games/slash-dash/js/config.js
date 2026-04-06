// Slash Dash - Configuration & Constants
const COLORS = {
  BG: '#0A0A0F',
  RED_ORB: '#FF2244',
  BLUE_ORB: '#00CCFF',
  POISON_ORB: '#44FF66',
  SLASH_TRAIL: '#FFAA33',
  ZEN_GLOW: '#88DDFF',
  STRIKE_ACTIVE: '#FFFFFF',
  STRIKE_SPENT: '#333344',
  SCORE_TEXT: '#FFFFFF',
  COMBO_GOLD: '#FFD700',
  STAGE_CLEAR: '#EEFFCC',
  UI_PANEL: '#1A1A2E',
  BTN_PRIMARY: '#3355FF',
  DANGER_ORANGE: '#FF6600',
  BTN_TEXT: '#FFFFFF'
};

const SCORE = {
  RED_SLASH: 100,
  BLUE_DODGE: 80,
  PERFECT_SLASH: 150,
  STAGE_CLEAR_MULT: 200,
  INVERSION_CLEAR_MULT: 400
};

const GAME = {
  CANVAS_W: 360,
  CANVAS_H: 640,
  HUD_H: 60,
  PLAYER_ZONE_Y: 480,
  MAX_STRIKES: 3,
  HOLD_THRESHOLD_MS: 80,
  SWIPE_MIN_PX: 80,
  SWIPE_MAX_MS: 300,
  PERFECT_SWIPE_MS: 200,
  PERFECT_DIST_PX: 20,
  OBJECTS_PER_STAGE: 10,
  INACTIVITY_LIMIT: 25000,
  COMBO_COLORS: { 3: '#FFD700', 6: '#FF8800', 9: '#FF2244', 12: '#FF00FF' }
};

function getSpeed(s) { return Math.min(180 + s * 15, 560); }
function getGapMs(s) { return Math.max(1200 - s * 25, 500); }
function getSimultChance(s) { return Math.min(Math.max((s - 7) * 0.12, 0), 0.75); }
function getPoisonChance(s) { if (s < 15) return 0; return Math.min((s - 15) * 0.05, 0.5); }
function isRestStage(s) { return s % 5 === 0; }
function getComboMultiplier(combo) {
  if (combo < 3) return 1;
  return 1 + Math.floor(combo / 3) * 0.5;
}

const SVG = {
  redOrb: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="#FF2244" opacity="0.9"/><circle cx="30" cy="30" r="18" fill="none" stroke="#FF6677" stroke-width="2"/><line x1="22" y1="22" x2="38" y2="38" stroke="#FF8899" stroke-width="2.5" stroke-linecap="round"/><line x1="38" y1="22" x2="22" y2="38" stroke="#FF8899" stroke-width="2.5" stroke-linecap="round"/></svg>',
  blueOrb: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="#00CCFF" opacity="0.85"/><circle cx="30" cy="30" r="18" fill="none" stroke="#88EEFF" stroke-width="2"/><circle cx="30" cy="30" r="10" fill="#88EEFF" opacity="0.6"/></svg>',
  poisonOrb: '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="#44FF66" opacity="0.85"/><circle cx="30" cy="30" r="18" fill="none" stroke="#AAFFBB" stroke-width="2"/><rect x="28" y="16" width="4" height="18" rx="2" fill="#003300"/><circle cx="30" cy="40" r="3" fill="#003300"/></svg>',
  fingerRing: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.7"/><circle cx="20" cy="20" r="6" fill="#FFFFFF" opacity="0.5"/></svg>',
  spark: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#FFAA33"/></svg>',
  sparkWhite: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#FFFFFF"/></svg>',
  strikeActive: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><line x1="14" y1="2" x2="14" y2="22" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><line x1="8" y1="10" x2="20" y2="10" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/><polygon points="12,22 16,22 14,26" fill="#AAAAAA"/></svg>',
  strikeSpent: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><line x1="14" y1="2" x2="14" y2="22" stroke="#333344" stroke-width="3" stroke-linecap="round"/><line x1="8" y1="10" x2="20" y2="10" stroke="#333344" stroke-width="2" stroke-linecap="round"/><polygon points="12,22 16,22 14,26" fill="#222233"/></svg>'
};

const GameState = {
  score: 0,
  highScore: 0,
  stage: 1,
  stageRecord: 0,
  strikes: 0,
  combo: 0,
  inversionActive: false,
  reset() {
    this.score = 0;
    this.stage = 1;
    this.strikes = 0;
    this.combo = 0;
    this.inversionActive = false;
  },
  loadHighScore() {
    this.highScore = parseInt(localStorage.getItem('slash-dash_high_score') || '0', 10);
    this.stageRecord = parseInt(localStorage.getItem('slash-dash_stage_record') || '0', 10);
  },
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('slash-dash_high_score', this.highScore);
    }
    if (this.stage > this.stageRecord) {
      this.stageRecord = this.stage;
      localStorage.setItem('slash-dash_stage_record', this.stageRecord);
    }
  }
};
