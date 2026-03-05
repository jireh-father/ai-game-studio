// config.js - Game constants, colors, SVGs, difficulty tables

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const PALETTE = {
    BG: 0x0A0E1A,
    BG_HEX: '#0A0E1A',
    ROAD: '#1A1E2E',
    ROAD_HEX: 0x1A1E2E,
    ROAD_MARK: '#E8E8E8',
    TAXI: '#FFD600',
    TAXI_HEX: 0xFFD600,
    TAXI_STROKE: '#B8960A',
    BUILDING: '#2A3050',
    BUILDING_HEX: 0x2A3050,
    TARGET: '#00E5FF',
    TARGET_HEX: 0x00E5FF,
    BULLSEYE: '#FF2D7B',
    BULLSEYE_HEX: 0xFF2D7B,
    INNER: '#FF8C00',
    INNER_HEX: 0xFF8C00,
    OUTER: '#4DB6AC',
    OUTER_HEX: 0x4DB6AC,
    PASSENGER: '#FFFFFF',
    DRIFT: '#FF6B00',
    DRIFT_HEX: 0xFF6B00,
    DANGER: '#FF1744',
    DANGER_HEX: 0xFF1744,
    SCORE: '#FFFFFF',
    COMBO: '#FFD700',
    COMBO_HEX: 0xFFD700,
    OVERLAY: '#000000',
    WHITE_HEX: 0xFFFFFF
};

const SCORE_VALUES = {
    BULLSEYE: 150,
    GOOD: 100,
    OK: 50,
    NEAR_MISS: 20,
    MISS: 0,
    PERFECT_DRIFT: 30,
    STAGE_CLEAR: 200
};

const BASE_SPEED = 120;
const INACTIVITY_DEATH_MS = 8000;
const OVERDRIFT_MARGIN = 0.18;
const COMBO_CAP = 17;
const COMBO_MULT_PER = 0.15;
const MAX_LIVES = 3;
const DRIFT_WINDOW_MIN_MS = 500;

// SVG asset strings
const SVG_TAXI = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24">
  <rect x="2" y="2" width="36" height="20" rx="4" fill="#FFD600" stroke="#B8960A" stroke-width="2"/>
  <rect x="6" y="4" width="12" height="8" rx="2" fill="#4DB6AC" opacity="0.7"/>
  <rect x="22" y="4" width="12" height="8" rx="2" fill="#4DB6AC" opacity="0.5"/>
  <circle cx="4" cy="6" r="2" fill="#FFFFFF"/>
  <circle cx="4" cy="18" r="2" fill="#FFFFFF"/>
  <rect x="16" y="8" width="8" height="8" rx="2" fill="#FF8C00"/>
</svg>`;

const SVG_PASSENGER = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
  <circle cx="6" cy="4" r="3" fill="#FFFFFF" stroke="#CCCCCC" stroke-width="1"/>
  <rect x="3" y="7" width="6" height="5" rx="2" fill="#FF2D7B"/>
</svg>`;

const SVG_TARGET = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect x="0" y="0" width="80" height="80" rx="4" fill="#2A3050" stroke="#00E5FF" stroke-width="2"/>
  <circle cx="40" cy="40" r="35" fill="#4DB6AC" opacity="0.4"/>
  <circle cx="40" cy="40" r="22" fill="#FF8C00" opacity="0.5"/>
  <circle cx="40" cy="40" r="10" fill="#FF2D7B"/>
</svg>`;

const SVG_BUILDING = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect x="0" y="0" width="60" height="60" rx="2" fill="#2A3050" stroke="#3A4060" stroke-width="1"/>
  <rect x="8" y="8" width="8" height="8" fill="#1A1E2E"/>
  <rect x="24" y="8" width="8" height="8" fill="#445080"/>
  <rect x="44" y="8" width="8" height="8" fill="#1A1E2E"/>
  <rect x="8" y="24" width="8" height="8" fill="#445080"/>
  <rect x="24" y="24" width="8" height="8" fill="#1A1E2E"/>
  <rect x="44" y="24" width="8" height="8" fill="#445080"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#FFFFFF"/>
</svg>`;

// Game state (global, persisted across scenes)
const GameState = {
    score: 0,
    stage: 1,
    lives: MAX_LIVES,
    combo: 0,
    highScore: 0,
    highStage: 0,
    gamesPlayed: 0,
    settings: { sound: true, music: true, vibration: true },
    init() {
        this.highScore = parseInt(localStorage.getItem('taxi-drift-stack_high_score') || '0');
        this.highStage = parseInt(localStorage.getItem('taxi-drift-stack_highest_stage') || '0');
        this.gamesPlayed = parseInt(localStorage.getItem('taxi-drift-stack_games_played') || '0');
        try {
            const s = JSON.parse(localStorage.getItem('taxi-drift-stack_settings'));
            if (s) this.settings = s;
        } catch(e) {}
    },
    save() {
        localStorage.setItem('taxi-drift-stack_high_score', this.highScore);
        localStorage.setItem('taxi-drift-stack_highest_stage', this.highStage);
        localStorage.setItem('taxi-drift-stack_games_played', this.gamesPlayed);
        localStorage.setItem('taxi-drift-stack_settings', JSON.stringify(this.settings));
    },
    reset() {
        this.score = 0;
        this.stage = 1;
        this.lives = MAX_LIVES;
        this.combo = 0;
    },
    getComboMult() {
        return 1 + Math.min(this.combo, COMBO_CAP) * COMBO_MULT_PER;
    }
};
