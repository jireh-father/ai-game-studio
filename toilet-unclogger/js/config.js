// Toilet Unclogger - Configuration & Constants
const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  COLORS: {
    PORCELAIN: 0xF5F0E8,
    WATER_CLEAN: 0x4FC3F7,
    WATER_DIRTY: 0x8D6E3F,
    DANGER_RED: 0xFF5252,
    PLUNGER_RED: 0xE53935,
    BEAT_GREEN: 0x76FF03,
    GOOD_YELLOW: 0xFFD740,
    TILE_BG: 0xE3F2FD,
    DARK_SLATE: 0x263238,
    GOLD: 0xFFD600,
    WOOD_BROWN: 0x795548,
    STROKE_GRAY: 0xBDBDBD,
  },
  CSS_COLORS: {
    PORCELAIN: '#F5F0E8',
    WATER_CLEAN: '#4FC3F7',
    WATER_DIRTY: '#8D6E3F',
    DANGER_RED: '#FF5252',
    PLUNGER_RED: '#E53935',
    BEAT_GREEN: '#76FF03',
    GOOD_YELLOW: '#FFD740',
    TILE_BG: '#E3F2FD',
    DARK_SLATE: '#263238',
    GOLD: '#FFD600',
  },
  SCORING: {
    PERFECT_HIT: 100,
    GOOD_HIT: 50,
    OFF_BEAT: 10,
    CLOG_CLEAR_BASE: 500,
    CLOG_CLEAR_STAGE_BONUS: 50,
    MULTI_TOILET_BONUS: 200,
    STREAK_PERCENT: 10,
    STREAK_INTERVAL: 10,
    GOLDEN_COMBO: 20,
    GOLDEN_DURATION: 3000,
  },
  WATER: {
    BASE_RISE: 2,
    RISE_PER_STAGE: 0.3,
    MAX_RISE: 12,
    MISS_SURGE: 2,
    IDLE_TIMEOUT: 6000,
    CONTINUE_DRAIN: 50,
    START_LEVEL: 15,
  },
  BEAT: {
    PERFECT_BASE: 150,
    GOOD_BASE: 250,
    WINDOW_SHRINK: 2,
    MIN_PERFECT: 80,
    MIN_GOOD: 140,
    BASE_BPM: 60,
    BPM_PER_STAGE: 4,
    MAX_BPM: 180,
  },
  COMBO: {
    EFFECT_INTERVAL: 5,
    GOLDEN_THRESHOLD: 20,
  },
  TAP_DEBOUNCE: 50,
  SWIPE_THRESHOLD: 50,
  SWIPE_TIME: 300,
};

// Clog tiers: basic, varied, hold, complex, urgent
const CLOG_TIERS = {
  BASIC: 'basic',
  VARIED: 'varied',
  HOLD: 'hold',
  COMPLEX: 'complex',
  URGENT: 'urgent',
};

const CLOGS = [
  // Basic tier (stages 1-3) - steady quarter notes
  { id: 'rubber_duck', name: 'Rubber Duck', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'sock', name: 'Sock', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'tennis_ball', name: 'Tennis Ball', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'banana', name: 'Banana', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'soap', name: 'Soap Bar', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'sponge', name: 'Sponge', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'toy_car', name: 'Toy Car', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'apple', name: 'Apple', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'flip_flop', name: 'Flip Flop', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  { id: 'hair_ball', name: 'Hair Ball', tier: CLOG_TIERS.BASIC, bpmMod: 1.0, beats: 8, rhythm: 'steady' },
  // Varied tier (stages 4-7)
  { id: 'pizza', name: 'Pizza Slice', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'syncopated' },
  { id: 'fish', name: 'Fish', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'syncopated' },
  { id: 'phone', name: 'Phone', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'alternating' },
  { id: 'book', name: 'Book', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'alternating' },
  { id: 'teddy', name: 'Teddy Bear', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'syncopated' },
  { id: 'alarm_clock', name: 'Alarm Clock', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'alternating' },
  { id: 'shoe', name: 'Shoe', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'syncopated' },
  { id: 'cactus', name: 'Cactus', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'alternating' },
  { id: 'pineapple', name: 'Pineapple', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'syncopated' },
  { id: 'baseball', name: 'Baseball', tier: CLOG_TIERS.VARIED, bpmMod: 1.1, beats: 10, rhythm: 'alternating' },
  // Hold tier (stages 8-12)
  { id: 'brick', name: 'Brick', tier: CLOG_TIERS.HOLD, bpmMod: 0.8, beats: 6, rhythm: 'hold' },
  { id: 'watermelon', name: 'Watermelon', tier: CLOG_TIERS.HOLD, bpmMod: 0.8, beats: 6, rhythm: 'hold' },
  { id: 'bowling_ball', name: 'Bowling Ball', tier: CLOG_TIERS.HOLD, bpmMod: 0.8, beats: 6, rhythm: 'hold' },
  { id: 'dumbbell', name: 'Dumbbell', tier: CLOG_TIERS.HOLD, bpmMod: 0.8, beats: 6, rhythm: 'hold' },
  { id: 'rock', name: 'Rock', tier: CLOG_TIERS.HOLD, bpmMod: 0.8, beats: 6, rhythm: 'hold' },
  // Complex tier (stages 13-20)
  { id: 'spaghetti', name: 'Spaghetti', tier: CLOG_TIERS.COMPLEX, bpmMod: 1.2, beats: 12, rhythm: 'triplet' },
  { id: 'rope', name: 'Rope', tier: CLOG_TIERS.COMPLEX, bpmMod: 1.2, beats: 12, rhythm: 'triplet' },
  { id: 'garden_hose', name: 'Garden Hose', tier: CLOG_TIERS.COMPLEX, bpmMod: 1.2, beats: 14, rhythm: 'mixed' },
  { id: 'chain', name: 'Chain', tier: CLOG_TIERS.COMPLEX, bpmMod: 1.2, beats: 12, rhythm: 'triplet' },
  { id: 'octopus', name: 'Octopus Toy', tier: CLOG_TIERS.COMPLEX, bpmMod: 1.2, beats: 14, rhythm: 'mixed' },
  // Urgent/Boss tier (stages 21+)
  { id: 'couch', name: 'Whole Couch', tier: CLOG_TIERS.URGENT, bpmMod: 1.0, beats: 24, rhythm: 'polyrhythm' },
  { id: 'toilet_in_toilet', name: 'Toilet in a Toilet', tier: CLOG_TIERS.URGENT, bpmMod: 1.0, beats: 24, rhythm: 'polyrhythm' },
  { id: 'kitchen_sink', name: 'Kitchen Sink', tier: CLOG_TIERS.URGENT, bpmMod: 1.0, beats: 24, rhythm: 'polyrhythm' },
];

function getTierForStage(stage) {
  if (stage <= 3) return [CLOG_TIERS.BASIC];
  if (stage <= 7) return [CLOG_TIERS.BASIC, CLOG_TIERS.VARIED];
  if (stage <= 12) return [CLOG_TIERS.BASIC, CLOG_TIERS.VARIED, CLOG_TIERS.HOLD];
  if (stage <= 20) return [CLOG_TIERS.BASIC, CLOG_TIERS.VARIED, CLOG_TIERS.HOLD, CLOG_TIERS.COMPLEX];
  return [CLOG_TIERS.BASIC, CLOG_TIERS.VARIED, CLOG_TIERS.HOLD, CLOG_TIERS.COMPLEX, CLOG_TIERS.URGENT];
}

function getActiveToilets(stage) {
  if (stage <= 7) return 1;
  if (stage <= 15) return 2;
  return 3;
}

function getClogsPerToilet(stage) {
  return Math.min(1 + Math.floor(stage / 5), 4);
}

function getStageBPM(stage) {
  return Math.min(CONFIG.BEAT.BASE_BPM + stage * CONFIG.BEAT.BPM_PER_STAGE, CONFIG.BEAT.MAX_BPM);
}

function getWaterRiseRate(stage) {
  return Math.min(CONFIG.WATER.BASE_RISE + stage * CONFIG.WATER.RISE_PER_STAGE, CONFIG.WATER.MAX_RISE);
}

function getPerfectWindow(stage) {
  return Math.max(CONFIG.BEAT.PERFECT_BASE - stage * CONFIG.BEAT.WINDOW_SHRINK, CONFIG.BEAT.MIN_PERFECT);
}

function getGoodWindow(stage) {
  return Math.max(CONFIG.BEAT.GOOD_BASE - stage * CONFIG.BEAT.WINDOW_SHRINK, CONFIG.BEAT.MIN_GOOD);
}

function isRestStage(stage) { return stage > 1 && stage % 5 === 0; }
function isBossStage(stage) { return stage > 1 && stage % 10 === 0; }
