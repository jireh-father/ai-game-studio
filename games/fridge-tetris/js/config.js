// Game constants and configuration
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GRID_COLS = 4;
const GRID_ROWS = 5;
const CELL_SIZE = 72;
const HUD_HEIGHT = 56; // top HUD + timer bar
const BOTTOM_BAR_HEIGHT = 56;
const GRID_START_Y = HUD_HEIGHT + 8;
const GRID_START_X = (GAME_WIDTH - GRID_COLS * CELL_SIZE) / 2;

const WAVE_TIMER_BASE = 3000;
const WAVE_TIMER_MIN = 1200;
const WAVE_TIMER_DECAY = 100;

const COLOR = {
  FRIDGE_BG: 0xF0F8FF,
  FRIDGE_ACCENT: 0xB0C4DE,
  PLAYER: 0xFF8C42,
  PLAYER_ACCENT: 0xFFB273,
  SAFE_ZONE: 0x90EE90,
  DANGER_ZONE: 0xFF4444,
  SMELL_FILL: 0xADFF2F,
  SMELL_BG: 0x3A3A3A,
  TIMER_FILL: 0x00CED1,
  TIMER_URGENT: 0xFF2020,
  EXPIRY: 0xFF6B35,
  SCORE_TEXT: 0x1A1A2E,
  UI_BG: 0xFFF8E7,
  UI_ACCENT: 0xE63946,
  UI_SECONDARY: 0xF4A261,
  FOOD_DAIRY: 0xFFFDD0,
  FOOD_PRODUCE: 0x52B788,
  FOOD_CONDIMENT: 0xC1121F,
  FOOD_FROZEN: 0xADE8F4,
  FOOD_HEAVY: 0x8B5E3C,
  HUD_BG: 0x1A1A2E,
  WHITE: 0xFFFFFF,
  GOLD: 0xFFD700,
  GREEN: 0x52B788,
};

const SCORE_VALUES = {
  waveFront: 100,
  waveMid: 50,
  waveBack: 20,
  expiryClear: 30,
  smellDefuse: 75,
  speedBonusPerHalfSec: 10,
  interactionBonus: 15,
};

const FRIDGE_POINTS_RATE = {
  earlyWave: 5,
  lateWave: 8,
  dailyBonus: 50,
};

// Difficulty tiers by wave range
const DIFFICULTY_TIERS = [
  { waveMin: 1,  waveMax: 5,  itemCount: [3,5],   largeItemPct: 0,  expiryCount: 0, smellRate: 0,  timerMs: 3000 },
  { waveMin: 6,  waveMax: 15, itemCount: [6,10],  largeItemPct: 15, expiryCount: 2, smellRate: 5,  timerMs: 2250 },
  { waveMin: 16, waveMax: 30, itemCount: [10,14], largeItemPct: 25, expiryCount: 4, smellRate: 10, timerMs: 1800 },
  { waveMin: 31, waveMax: 50, itemCount: [14,17], largeItemPct: 35, expiryCount: 5, smellRate: 15, timerMs: 1400 },
  { waveMin: 51, waveMax: 999,itemCount: [16,18], largeItemPct: 40, expiryCount: 6, smellRate: 20, timerMs: 1200 },
];

// Item type definitions
const ITEM_TYPES = {
  MILK:       { id: 'milk',      color: 0xFFFDD0, label: 'Milk',      size: [1,1], emoji: '🥛', wave: 1  },
  YOGURT:     { id: 'yogurt',    color: 0xFFF5E4, label: 'Yogurt',    size: [1,1], emoji: '🥣', wave: 1  },
  JUICE:      { id: 'juice',     color: 0xFFD700, label: 'Juice',     size: [1,2], emoji: '🧃', wave: 1  },
  CONDIMENT:  { id: 'condiment', color: 0xC1121F, label: 'Ketchup',   size: [1,1], emoji: '🍅', wave: 6  },
  VEGETABLE:  { id: 'vegetable', color: 0x52B788, label: 'Veggie',    size: [1,1], emoji: '🥦', wave: 1  },
  FROZEN:     { id: 'frozen',    color: 0xADE8F4, label: 'Frozen',    size: [1,1], emoji: '🧊', wave: 11 },
  HOT:        { id: 'hot',       color: 0xFF6B35, label: 'Leftovers', size: [1,1], emoji: '🍱', wave: 11 },
  WATERMELON: { id: 'watermelon',color: 0x8B5E3C, label: 'Watermelon',size: [2,2], emoji: '🍉', wave: 16 },
  CHEESE:     { id: 'cheese',    color: 0xFFD700, label: 'Cheese',    size: [1,1], emoji: '🧀', wave: 1  },
};

// SVG template functions for item types
const SVG_TEMPLATES = {
  player(expression) {
    const mouth = expression === 'happy'
      ? 'M 23 44 Q 30 50 37 44'
      : expression === 'horrified'
      ? 'M 25 46 Q 30 42 35 46 Q 30 52 25 46'
      : 'M 23 46 Q 30 42 37 46';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
      <rect x="4" y="10" width="52" height="44" rx="8" ry="8" fill="#FF8C42" stroke="#CC6A1A" stroke-width="2"/>
      <rect x="2" y="4" width="56" height="14" rx="6" ry="6" fill="#FFB273" fill-opacity="0.6" stroke="#FF8C42" stroke-width="1.5"/>
      <rect x="0" y="7" width="6" height="8" rx="2" fill="#CC6A1A"/>
      <rect x="54" y="7" width="6" height="8" rx="2" fill="#CC6A1A"/>
      <circle cx="20" cy="32" r="9" fill="white" stroke="#333" stroke-width="1.5"/>
      <circle cx="22" cy="33" r="4" fill="#1A1A2E"/>
      <circle cx="24" cy="31" r="1.5" fill="white"/>
      <circle cx="40" cy="32" r="9" fill="white" stroke="#333" stroke-width="1.5"/>
      <circle cx="42" cy="33" r="4" fill="#1A1A2E"/>
      <circle cx="44" cy="31" r="1.5" fill="white"/>
      <path d="${mouth}" stroke="#1A1A2E" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  },
  milk() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
      <rect x="8" y="12" width="44" height="44" rx="4" fill="#FFFDD0" stroke="#DDD8B8" stroke-width="2"/>
      <polygon points="8,12 30,2 52,12" fill="#F0EAB0" stroke="#DDD8B8" stroke-width="1.5"/>
      <circle cx="30" cy="34" r="12" fill="#EEE" stroke="#CCC" stroke-width="1"/>
      <ellipse cx="26" cy="32" rx="4" ry="5" fill="#555" opacity="0.5"/>
      <ellipse cx="35" cy="35" rx="3" ry="4" fill="#555" opacity="0.5"/>
      <text x="30" y="50" text-anchor="middle" font-size="8" fill="#888" font-family="sans-serif">MILK</text>
    </svg>`;
  },
  yogurt() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
      <rect x="10" y="18" width="40" height="38" rx="4" fill="#FFF5E4" stroke="#E8D5B7" stroke-width="2"/>
      <rect x="8" y="12" width="44" height="10" rx="5" fill="#E8D5B7" stroke="#CCC" stroke-width="1.5"/>
      <text x="30" y="28" text-anchor="middle" font-size="7" fill="#888" font-family="sans-serif">YOGURT</text>
      <circle cx="30" cy="40" r="8" fill="#FFB3BA" stroke="#FF8FA3" stroke-width="1"/>
      <text x="30" y="43" text-anchor="middle" font-size="7" fill="#CC3366" font-family="sans-serif">:)</text>
    </svg>`;
  },
  juice() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="120">
      <rect x="8" y="4" width="44" height="112" rx="6" fill="#FFD700" stroke="#CC9900" stroke-width="2"/>
      <rect x="10" y="6" width="40" height="20" rx="4" fill="#FFE566" stroke="#CC9900" stroke-width="1"/>
      <circle cx="30" cy="70" r="18" fill="#FF8C00" opacity="0.6"/>
      <text x="30" y="74" text-anchor="middle" font-size="9" fill="#CC4400" font-family="sans-serif">JUICE</text>
    </svg>`;
  },
  condiment() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
      <rect x="15" y="10" width="30" height="48" rx="6" fill="#C1121F" stroke="#8B0000" stroke-width="2"/>
      <rect x="22" y="4" width="16" height="10" rx="3" fill="#8B0000"/>
      <circle cx="30" cy="25" r="8" fill="#FF4444" stroke="#C1121F" stroke-width="1"/>
      <text x="30" y="28" text-anchor="middle" font-size="7" fill="white" font-family="sans-serif">K</text>
      <text x="30" y="44" text-anchor="middle" font-size="6" fill="#FF8888" font-family="sans-serif">KETCHUP</text>
    </svg>`;
  },
  vegetable() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
      <circle cx="30" cy="36" r="20" fill="#52B788" stroke="#2D6A4F" stroke-width="2"/>
      <ellipse cx="22" cy="20" rx="5" ry="12" fill="#40916C" transform="rotate(-20,22,20)"/>
      <ellipse cx="30" cy="16" rx="5" ry="14" fill="#40916C"/>
      <ellipse cx="38" cy="20" rx="5" ry="12" fill="#40916C" transform="rotate(20,38,20)"/>
    </svg>`;
  },
  frozen() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
      <rect x="6" y="6" width="48" height="48" rx="6" fill="#ADE8F4" stroke="#56CFE1" stroke-width="2"/>
      <line x1="10" y1="15" x2="50" y2="45" stroke="#90E0EF" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="15" y1="10" x2="45" y2="50" stroke="#90E0EF" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="50" y1="15" x2="10" y2="45" stroke="#90E0EF" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="30" cy="30" r="12" fill="#CAF0F8" opacity="0.7"/>
      <text x="30" y="34" text-anchor="middle" font-size="12" font-family="sans-serif">❄</text>
    </svg>`;
  },
  hot() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
      <rect x="4" y="20" width="52" height="38" rx="4" fill="#FF8C42" stroke="#CC5500" stroke-width="2"/>
      <rect x="2" y="14" width="56" height="10" rx="3" fill="#FFB273" stroke="#FF8C42" stroke-width="1.5"/>
      <path d="M20 12 Q22 6 24 12 Q26 6 28 12" stroke="#FF4444" stroke-width="2" fill="none"/>
      <path d="M32 12 Q34 6 36 12 Q38 6 40 12" stroke="#FF4444" stroke-width="2" fill="none"/>
      <text x="30" y="44" text-anchor="middle" font-size="7" fill="#663300" font-family="sans-serif">LEFTOVERS</text>
    </svg>`;
  },
  watermelon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <ellipse cx="60" cy="65" rx="50" ry="45" fill="#52B788" stroke="#2D6A4F" stroke-width="3"/>
      <ellipse cx="60" cy="65" rx="44" ry="39" fill="#FF6B6B"/>
      <ellipse cx="60" cy="65" rx="36" ry="32" fill="#FF8FA3"/>
      <circle cx="45" cy="58" r="4" fill="#1A1A2E"/>
      <circle cx="60" cy="72" r="4" fill="#1A1A2E"/>
      <circle cx="75" cy="58" r="4" fill="#1A1A2E"/>
      <circle cx="52" cy="75" r="4" fill="#1A1A2E"/>
      <circle cx="68" cy="75" r="4" fill="#1A1A2E"/>
    </svg>`;
  },
  cheese() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
      <polygon points="30,5 55,50 5,50" fill="#FFD700" stroke="#CC9900" stroke-width="2"/>
      <circle cx="25" cy="38" r="5" fill="#CC9900" opacity="0.6"/>
      <circle cx="38" cy="32" r="4" fill="#CC9900" opacity="0.6"/>
      <circle cx="32" cy="44" r="3" fill="#CC9900" opacity="0.6"/>
    </svg>`;
  },
};

function getSvgDataUrl(svgStr) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
}

function gridToScreen(col, row) {
  return {
    x: GRID_START_X + col * CELL_SIZE + CELL_SIZE / 2,
    y: GRID_START_Y + row * CELL_SIZE + CELL_SIZE / 2,
  };
}

function screenToGrid(x, y) {
  return {
    col: Math.floor((x - GRID_START_X) / CELL_SIZE),
    row: Math.floor((y - GRID_START_Y) / CELL_SIZE),
  };
}
