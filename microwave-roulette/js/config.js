// Microwave Roulette - Configuration & Constants
const CONFIG = {
  WIDTH: 360,
  HEIGHT: 640,
  BG: 0xFFF8E1,
  COLORS: {
    TEAL: 0x00BFA5,
    ORANGE: 0xFF6D00,
    CREAM: 0xFFF8E1,
    RED: 0xFF1744,
    GREEN: 0x00E676,
    GOLD: 0xFFD600,
    CHARCOAL: 0x263238,
    GRAY: 0xECEFF1,
    DARK_BLUE: 0x1A237E,
    MID_BLUE: 0x283593,
    PANEL: 0xB2DFDB,
    WHITE: 0xFFFFFF,
  },
  HEX: {
    TEAL: '#00BFA5',
    ORANGE: '#FF6D00',
    RED: '#FF1744',
    GREEN: '#00E676',
    GOLD: '#FFD600',
    CHARCOAL: '#263238',
    WHITE: '#FFFFFF',
    CREAM: '#FFF8E1',
  },
  INACTIVITY_MS: 8000,
  LIVES: 3,
  COMBO_CAP: 16,
  COMBO_MULT_PER: 0.25,
  COMBO_MAX_MULT: 5,
  SCORE: {
    PERFECT: 300,
    GOOD: 150,
    NEAR_MISS: 50,
    MULTI_ZONE_BONUS: 500,
    BOSS_CLEAR: 1000,
    NEW_ITEM: 200,
  },
  TIMER: {
    BASE_SPEED: 1.0,       // rev/sec
    SPEED_INC: 0.015,      // per stage
    MAX_SPEED: 2.5,
    BASE_ARC: 90,          // degrees
    ARC_DEC: 1.5,          // per stage
    MIN_ARC: 15,
  },
  STORAGE_PREFIX: 'microwave-roulette_',
};

const ITEM_DB = [
  // Common Food (stage 1-5)
  { name: 'Frozen Burrito', cat: 'common', minStage: 1, maxStage: 5 },
  { name: 'Leftover Pizza', cat: 'common', minStage: 1, maxStage: 5 },
  { name: 'Cup Noodles', cat: 'common', minStage: 1, maxStage: 8 },
  { name: 'Popcorn', cat: 'common', minStage: 1, maxStage: 10 },
  { name: 'Hot Dog', cat: 'common', minStage: 1, maxStage: 10 },
  // Odd Food (stage 6-10)
  { name: 'Entire Watermelon', cat: 'odd', minStage: 6, maxStage: 15 },
  { name: 'Frozen Turkey', cat: 'odd', minStage: 6, maxStage: 15 },
  { name: '3-Day-Old Sushi', cat: 'odd', minStage: 6, maxStage: 15 },
  { name: 'Mystery Leftovers', cat: 'odd', minStage: 6, maxStage: 20 },
  // Non-Food (stage 11-20)
  { name: 'Smartphone', cat: 'nonfood', minStage: 11, maxStage: 25 },
  { name: 'Tin Foil Ball', cat: 'nonfood', minStage: 11, maxStage: 25 },
  { name: 'CD Collection', cat: 'nonfood', minStage: 11, maxStage: 30 },
  { name: 'Rubber Duck', cat: 'nonfood', minStage: 11, maxStage: 30 },
  { name: 'Soap Bar', cat: 'nonfood', minStage: 11, maxStage: 30 },
  // Absurd (stage 21-35)
  { name: 'Live Grenade', cat: 'absurd', minStage: 21, maxStage: 40 },
  { name: 'Laptop', cat: 'absurd', minStage: 21, maxStage: 40 },
  { name: 'Fish Tank', cat: 'absurd', minStage: 21, maxStage: 45 },
  { name: 'Bowling Ball', cat: 'absurd', minStage: 21, maxStage: 45 },
  { name: 'Lava Lamp', cat: 'absurd', minStage: 21, maxStage: 50 },
  // Legendary (stage 36+)
  { name: 'The Sun (mini)', cat: 'legendary', minStage: 36, maxStage: 999 },
  { name: 'Black Hole Nugget', cat: 'legendary', minStage: 36, maxStage: 999 },
  { name: 'Antimatter Sandwich', cat: 'legendary', minStage: 41, maxStage: 999 },
  { name: 'Time Crystal', cat: 'legendary', minStage: 46, maxStage: 999 },
  // Boss items
  { name: 'Golden Egg', cat: 'boss', minStage: 10, maxStage: 999, bossType: 'hold' },
  { name: 'Ice Block', cat: 'boss', minStage: 20, maxStage: 999, bossType: 'rapid' },
  { name: 'Dynamite Bundle', cat: 'boss', minStage: 30, maxStage: 999, bossType: 'triple' },
];

const ITEM_COLORS = {
  common: { fill: 0xFFAB40, stroke: 0xE65100 },
  odd: { fill: 0x7C4DFF, stroke: 0x4A148C },
  nonfood: { fill: 0x40C4FF, stroke: 0x01579B },
  absurd: { fill: 0xFF4081, stroke: 0x880E4F },
  legendary: { fill: 0xFFD600, stroke: 0xFF6F00 },
  boss: { fill: 0xFF1744, stroke: 0xB71C1C },
};

const CATEGORY_NAMES = {
  common: 'Common Food',
  odd: 'Weird Food',
  nonfood: 'Non-Food',
  absurd: 'Absurd',
  legendary: 'Legendary',
  boss: 'Boss Items',
};
