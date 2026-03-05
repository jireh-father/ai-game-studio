// Conveyor Crunch - Configuration & Constants
const CONFIG = {
  WIDTH: 390,
  HEIGHT: 700,
  BG_COLOR: 0x1A1A2E
};

const COLORS = {
  BG: '#1A1A2E',
  BELT: '#5C6370',
  BELT_RIDGE: '#3E4451',
  BIN_BG: '#2C3E50',
  ITEM_RED: '#E74C3C',
  ITEM_BLUE: '#3498DB',
  ITEM_GREEN: '#2ECC71',
  ITEM_YELLOW: '#F1C40F',
  SHADE_RED: '#E88E8E',
  SHADE_BLUE: '#85C1E9',
  SHADE_GREEN: '#82E0AA',
  SHADE_YELLOW: '#F9E154',
  DECOY: '#95A5A6',
  UI_TEXT: '#FFFFFF',
  DANGER: '#C0392B',
  REWARD: '#F39C12',
  SUCCESS: '#27AE60'
};

const COLOR_NAMES = {
  '#E74C3C': 'RED', '#3498DB': 'BLUE', '#2ECC71': 'GREEN', '#F1C40F': 'YELLOW',
  '#E88E8E': 'RED', '#85C1E9': 'BLUE', '#82E0AA': 'GREEN', '#F9E154': 'YELLOW'
};

const BASE_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F1C40F'];
const SHADE_VARIANTS = {
  '#E74C3C': '#E88E8E', '#3498DB': '#85C1E9',
  '#2ECC71': '#82E0AA', '#F1C40F': '#F9E154'
};

const SCORING = {
  BASE_SORT: 100,
  SPEED_BONUS: 50,
  SPEED_WINDOW: 500,
  PERFECT_STAGE: 500,
  RUSH_BONUS: 1000,
  DECOY_BONUS: 150,
  COMBO_MAX: 10
};

const GAME = {
  MAX_STRIKES: 3,
  MAX_PILE: 5,
  ITEMS_PER_STAGE: 10,
  RUSH_ITEMS: 15,
  INACTIVITY_TIMEOUT: 3000,
  BELT_Y: 380,
  BELT_HEIGHT: 70,
  ITEM_SIZE: 50,
  SWIPE_THRESHOLD: 30,
  SWIPE_MAX_TIME: 500,
  BIN_WIDTH: 70,
  BIN_HEIGHT: 90,
  ITEM_SPAWN_X: 420,
  PILE_X: 40,
  BASE_SPEED: 60
};

const SVGS = {
  itemCircle: (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><circle cx="25" cy="25" r="22" fill="${color}" stroke="#FFF" stroke-width="2"/><circle cx="18" cy="20" r="3" fill="rgba(255,255,255,0.4)"/></svg>`,
  itemSquare: (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect x="5" y="5" width="40" height="40" rx="6" fill="${color}" stroke="#FFF" stroke-width="2"/><rect x="10" y="10" width="12" height="8" rx="2" fill="rgba(255,255,255,0.3)"/></svg>`,
  itemTriangle: (color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon points="25,5 47,45 3,45" fill="${color}" stroke="#FFF" stroke-width="2"/></svg>`,
  decoy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><circle cx="25" cy="25" r="22" fill="#95A5A6" stroke="#FFF" stroke-width="2"/><line x1="15" y1="15" x2="35" y2="35" stroke="#FFF" stroke-width="3"/><line x1="35" y1="15" x2="15" y2="35" stroke="#FFF" stroke-width="3"/></svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>`,
  belt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 70"><rect x="0" y="0" width="400" height="70" fill="#5C6370" rx="4"/><line x1="0" y1="18" x2="400" y2="18" stroke="#3E4451" stroke-width="2" stroke-dasharray="20,10"/><line x1="0" y1="52" x2="400" y2="52" stroke="#3E4451" stroke-width="2" stroke-dasharray="20,10"/></svg>`
};

const STORAGE_KEYS = {
  HIGH_SCORE: 'conveyor-crunch_high_score',
  GAMES_PLAYED: 'conveyor-crunch_games_played',
  HIGHEST_STAGE: 'conveyor-crunch_highest_stage',
  SOUND: 'conveyor-crunch_sound'
};

function getStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch(e) { return fallback; }
}
function setStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}
