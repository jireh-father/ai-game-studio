// Escalator Chaos - Configuration & Constants
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const COLORS = {
  BG: 0x1A1A2E,
  ESCALATOR_LEFT: 0xE94560,
  ESCALATOR_RIGHT: 0x0F3460,
  ESCALATOR_STEPS: 0x533483,
  CORRECT_FLASH: 0x57CC99,
  WRONG_FLASH: 0xFF6B6B,
  UI_TEXT: '#EAEAEA',
  SCORE_BG: 'rgba(0,0,0,0.6)',
  OVERFLOW_FILL: 0xE94560,
  OVERFLOW_BG: 0x16213E,
  COMMUTER_SKIN: '#F4A261',
  SUIT_NORMAL: '#2D6A4F',
  SUIT_TOURIST: '#E9C46A',
  SUIT_CONFUSED: '#E76F51',
  SUIT_SPRINT: '#90E0EF',
  SUIT_VIP: '#FFD700'
};

const COMMUTER_TYPES = {
  normal:   { suit: COLORS.SUIT_NORMAL,   speed: 60 },
  tourist:  { suit: COLORS.SUIT_TOURIST,  speed: 60 },
  confused: { suit: COLORS.SUIT_CONFUSED, speed: 60 },
  sprint:   { suit: COLORS.SUIT_SPRINT,   speed: 160 },
  vip:      { suit: COLORS.SUIT_VIP,      speed: 60 }
};

const LAYOUT = {
  QUEUE_TOP: 80,
  SWIPE_ZONE_TOP: 280,
  SWIPE_ZONE_BOTTOM: 420,
  OVERFLOW_Y: 480,
  ESCALATOR_LEFT_X: 85,
  ESCALATOR_RIGHT_X: 275,
  ESCALATOR_Y: 520,
  ESCALATOR_W: 165,
  ESCALATOR_H: 200,
  COMMUTER_SIZE: 48,
  COMMUTER_H: 60
};

const SCORING = {
  CORRECT_BASE: 10,
  STAGE_CLEAR: 100,
  WRONG_PENALTY: 0,
  OVERFLOW_PENALTY: -20,
  VIP_MULTIPLIER: 3,
  VIP_WRONG_PENALTY: -50,
  STREAK_DIVISOR: 5,
  MAX_MULTIPLIER: 5
};

const TIMING = {
  INACTIVITY_DEATH: 12000,
  DEATH_SHAKE_MS: 500,
  OVERLAY_FADE_MS: 200,
  STAGE_BANNER_MS: 600,
  SWIPE_THRESHOLD_X: 30,
  SWIPE_THRESHOLD_Y: 50,
  MAX_OVERFLOW: 5,
  CORRECT_PER_STAGE: 10
};

function buildSVG(type) {
  const cfg = COMMUTER_TYPES[type] || COMMUTER_TYPES.normal;
  const suit = cfg.suit;
  const skin = COLORS.COMMUTER_SKIN;
  let extra = '';
  if (type === 'tourist') {
    extra = `<rect x="16" y="15" width="16" height="10" rx="2" fill="#555" stroke="#333" stroke-width="1"/>
             <circle cx="24" cy="20" r="4" fill="#88f" opacity="0.5"/>`;
  } else if (type === 'vip') {
    extra = `<rect x="18" y="38" width="12" height="8" rx="1" fill="#8B6914"/>
             <circle cx="24" cy="4" r="6" fill="none" stroke="#FFD700" stroke-width="1.5"/>`;
  } else if (type === 'sprint') {
    extra = `<line x1="2" y1="30" x2="10" y2="26" stroke="#90E0EF" stroke-width="1.5" opacity="0.6"/>
             <line x1="2" y1="38" x2="10" y2="34" stroke="#90E0EF" stroke-width="1.5" opacity="0.4"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
    <circle cx="24" cy="10" r="10" fill="${skin}"/>
    <rect x="14" y="22" width="20" height="24" rx="3" fill="${suit}"/>
    <rect x="8" y="24" width="6" height="16" rx="2" fill="${suit}"/>
    <rect x="34" y="24" width="6" height="16" rx="2" fill="${suit}"/>
    <rect x="14" y="46" width="8" height="14" rx="2" fill="#2C3E50"/>
    <rect x="26" y="46" width="8" height="14" rx="2" fill="#2C3E50"/>
    ${extra}
  </svg>`;
}

function buildConfusedSVG() {
  return buildSVG('confused');
}

function buildParticleSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
    <circle cx="4" cy="4" r="4" fill="${color}"/>
  </svg>`;
}

function buildArrowSVG(dir, color) {
  const arrow = dir === 'up' ? 'M12 4 L22 16 L16 16 L16 28 L8 28 L8 16 L2 16 Z'
    : 'M12 28 L2 16 L8 16 L8 4 L16 4 L16 16 L22 16 Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
    <path d="${arrow}" fill="${color}"/>
  </svg>`;
}
