// Gravity Waiter - Configuration & Constants

const CONFIG = {
    WIDTH: 360,
    HEIGHT: 760,

    // Colors
    COLOR: {
        TRAY: '#C0C0C0',
        TRAY_RIM: '#888888',
        TRAY_HIGHLIGHT: '#E8E8E8',
        TRAY_HANDLE: '#E63946',
        PLATE: '#FFF8F0',
        PLATE_RIM: '#CCCCCC',
        FISH: '#FA8072',
        CAKE: '#FFB6C1',
        CAKE_MID: '#FFC8D2',
        CAKE_TOP: '#FFD8E0',
        BOWL: '#1A1A2E',
        BG_WALL: '#F5DEB3',
        BG_SKY: '#87CEEB',
        FLOOR_RED: '#CC2200',
        FLOOR_WHITE: '#FFFAFA',
        ACCENT: '#E63946',
        WARNING: '#00B4FF',
        BUMP_FLASH: '#FFD700',
        TEXT: '#2D2D2D',
        HUD_BG: 'rgba(0,0,0,0.65)',
        STRIKE_ACTIVE: '#E63946',
        STRIKE_LOST: '#888888',
        REST_TINT: '#90EE90',
        DANGER_RED: '#E63946',
        GOLD: '#FFD700',
        MENU_GREEN: '#27AE60',
        MENU_ORANGE: '#E67E22',
        MENU_DARK: '#2C3E50',
        MENU_GRAY: '#555555'
    },

    FOOD_COLORS: ['#FF6B6B', '#98D8C8', '#F7DC6F', '#D7BDE2'],

    // Physics
    GRAVITY_STRENGTH: 980,
    DISH_FRICTION: 0.88,
    TRAY_DAMPING: 0.92,
    DRAG_SENSITIVITY: 0.3,
    MAX_DRAG_PER_FRAME: 40,
    TRAY_MAX_LEAN: 45,
    CASCADE_ANGLE: 60,
    CASCADE_TIME: 1500,
    TRAY_WIDTH: 200,
    TRAY_HEIGHT: 18,
    TRAY_Y: 520,

    // Strikes
    MAX_STRIKES: 3,

    // Scoring
    SCORE: {
        ROTATION_SURVIVED: 10,
        PER_SECOND: 1,
        BUMP_SURVIVED: 15,
        MILESTONE: 50,
        DISH_ADDED: 5,
        PERFECT_ROTATION: 20,
        PERFECT_CHAIN_BONUS: 100
    },

    PERFECT_ANGLE_THRESHOLD: 5,
    CHAIN_BREAK_ANGLE: 15,

    // Stage
    ROTATIONS_PER_STAGE: 5,
    BASE_ROTATION_INTERVAL: 7000,
    MIN_ROTATION_INTERVAL: 3000,
    ROTATION_DECAY: 150,
    BASE_SPAWN_INTERVAL: 5000,
    MIN_SPAWN_INTERVAL: 2500,
    SPAWN_DECAY: 100,
    BASE_WARNING_DURATION: 600,
    MIN_WARNING_DURATION: 300,
    WARNING_DECAY: 10,

    // Dish types
    DISH: {
        PLATE:  { key: 'plate',  w: 60,  h: 12, weight: 1.0, unlock: 1  },
        FISH:   { key: 'fish',   w: 80,  h: 20, weight: 1.2, unlock: 4  },
        CAKE:   { key: 'cake',   w: 70,  h: 55, weight: 0.8, unlock: 7  },
        BOWL:   { key: 'bowl',   w: 50,  h: 50, weight: 3.0, unlock: 11 }
    },

    // Inactivity
    INACTIVITY_TIMEOUT: 30000
};

// SVG Strings - all include explicit width/height
const SVG = {};

SVG.TRAY = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="28" viewBox="0 0 200 28">
  <rect x="0" y="0" width="200" height="18" rx="9" ry="9" fill="#C0C0C0" stroke="#888888" stroke-width="2"/>
  <rect x="4" y="3" width="192" height="5" rx="3" ry="3" fill="#E8E8E8" opacity="0.7"/>
  <rect x="90" y="16" width="20" height="10" rx="3" fill="#E63946" stroke="#AA1122" stroke-width="1.5"/>
</svg>`;

SVG.PLATE = function(foodColor) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="12" viewBox="0 0 60 12">
  <ellipse cx="30" cy="6" rx="30" ry="6" fill="#FFF8F0" stroke="#CCCCCC" stroke-width="2"/>
  <ellipse cx="30" cy="6" rx="25" ry="4" fill="none" stroke="#DDDDDD" stroke-width="1"/>
  <ellipse cx="30" cy="4" rx="12" ry="4" fill="${foodColor}"/>
</svg>`;
};

SVG.FISH = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20" viewBox="0 0 80 20">
  <ellipse cx="40" cy="10" rx="40" ry="10" fill="#FFF8F0" stroke="#CCCCCC" stroke-width="2"/>
  <ellipse cx="40" cy="8" rx="22" ry="7" fill="#FA8072"/>
  <polygon points="62,8 72,2 72,14" fill="#FA8072"/>
  <circle cx="22" cy="7" r="2" fill="#2D2D2D"/>
</svg>`;

SVG.CAKE = `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="55" viewBox="0 0 70 55">
  <rect x="0" y="40" width="70" height="15" rx="3" fill="#FFB6C1" stroke="#FF91A0" stroke-width="1.5"/>
  <rect x="8" y="22" width="54" height="18" rx="3" fill="#FFC8D2" stroke="#FF91A0" stroke-width="1.5"/>
  <rect x="18" y="8" width="34" height="14" rx="3" fill="#FFD8E0" stroke="#FF91A0" stroke-width="1.5"/>
  <path d="M33,4 C33,1 35,0 35,3 C35,0 37,1 37,4 L35,8 Z" fill="#E63946"/>
</svg>`;

SVG.BOWL = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
  <circle cx="25" cy="25" r="25" fill="#1A1A2E" stroke="#333355" stroke-width="2"/>
  <circle cx="20" cy="18" r="4" fill="#333355"/>
  <circle cx="30" cy="16" r="4" fill="#333355"/>
  <circle cx="25" cy="26" r="4" fill="#333355"/>
  <ellipse cx="15" cy="12" rx="6" ry="4" fill="#FFFFFF" opacity="0.2"/>
</svg>`;

SVG.STRIKE_ACTIVE = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12" viewBox="0 0 24 12">
  <ellipse cx="12" cy="6" rx="11" ry="5" fill="#E63946" stroke="#AA1122" stroke-width="1"/>
</svg>`;

SVG.STRIKE_LOST = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12" viewBox="0 0 24 12">
  <ellipse cx="12" cy="6" rx="11" ry="5" fill="#888888" stroke="#666666" stroke-width="1"/>
  <line x1="6" y1="3" x2="12" y2="9" stroke="#FFFFFF" stroke-width="1.5"/>
  <line x1="14" y1="2" x2="18" y2="10" stroke="#FFFFFF" stroke-width="1.5"/>
</svg>`;

SVG.PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <polygon points="4,0 8,8 0,8" fill="#FFFFFF"/>
</svg>`;
