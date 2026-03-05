// Shockwave Hop - Configuration & Constants

const COLORS = {
  primary: 0x00E5FF,
  secondary: 0xFF00E5,
  bg: 0x0A0E27,
  danger: 0xFF3D00,
  reward: 0xFFD700,
  uiText: 0xFFFFFF,
  uiBg: '#0A0E27CC',
  platform: 0x2A3A5C,
  platformHighlight: 0x3A5A8C,
  dangerLight: 0xFF6E40,
  dangerLighter: 0xFFAB91
};

const COLORS_HEX = {
  primary: '#00E5FF',
  secondary: '#FF00E5',
  bg: '#0A0E27',
  danger: '#FF3D00',
  reward: '#FFD700',
  uiText: '#FFFFFF',
  dangerLight: '#FF6E40'
};

const GAME = {
  width: 360,
  height: 640,
  lives: 3,
  jumpHeight: 120,
  jumpDuration: 600,
  jumpCooldown: 800,
  inactivityTimeout: 4000,
  invincibilityDuration: 500,
  counterShockwaveSpeed: 300,
  counterShockwaveMaxRadius: 150,
  platformY: 540,
  platformHeight: 8,
  playerStartX: 180,
  deathAnimDelay: 600
};

const SCORING = {
  ringClear: 100,
  comboBonus: 50,
  orbDestroy: 50,
  orbMultiBonus: 2,
  stageClear: 200,
  stageBonusAfter5: 100,
  perfectClear: 500,
  megaRing: 500
};

const RING = {
  baseSpeed: 80,
  speedPerStage: 8,
  maxSpeed: 200,
  baseSpawnDelay: 1200,
  delayReductionPerStage: 40,
  minSpawnDelay: 500,
  hitRadius: 15,
  lineWidth: 3,
  minLineWidth: 1
};

const SVG_STRINGS = {
  player: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
    <rect x="10" y="16" width="12" height="20" rx="4" fill="#00E5FF"/>
    <circle cx="16" cy="10" r="8" fill="#00E5FF"/>
    <circle cx="13" cy="9" r="2" fill="#0A0E27"/>
    <circle cx="19" cy="9" r="2" fill="#0A0E27"/>
    <rect x="10" y="34" width="5" height="12" rx="2" fill="#00E5FF"/>
    <rect x="17" y="34" width="5" height="12" rx="2" fill="#00E5FF"/>
    <circle cx="16" cy="24" r="20" fill="#00E5FF" opacity="0.1"/>
  </svg>`,
  hazardOrb: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
    <circle cx="10" cy="10" r="8" fill="#FF3D00"/>
    <circle cx="10" cy="10" r="5" fill="#FF6E40"/>
    <circle cx="8" cy="8" r="2" fill="#FFAB91"/>
  </svg>`,
  spike: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20" width="40" height="20">
    <polygon points="0,20 10,2 20,20" fill="#FF3D00"/>
    <polygon points="10,20 20,0 30,20" fill="#FF3D00"/>
    <polygon points="20,20 30,2 40,20" fill="#FF3D00"/>
  </svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
    <path d="M10 17 C4 12, 0 8, 3 4 C5 1, 10 3, 10 6 C10 3, 15 1, 17 4 C20 8, 16 12, 10 17Z" fill="#00E5FF"/>
  </svg>`,
  heartEmpty: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
    <path d="M10 17 C4 12, 0 8, 3 4 C5 1, 10 3, 10 6 C10 3, 15 1, 17 4 C20 8, 16 12, 10 17Z" fill="none" stroke="#00E5FF" stroke-width="1.5" opacity="0.4"/>
  </svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <circle cx="4" cy="4" r="4" fill="#00E5FF"/>
  </svg>`,
  particleOrange: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <circle cx="4" cy="4" r="4" fill="#FF6E40"/>
  </svg>`,
  particleGold: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8" height="8">
    <circle cx="4" cy="4" r="4" fill="#FFD700"/>
  </svg>`
};

const STORAGE_KEYS = {
  highScore: 'shockwave-hop_high_score',
  gamesPlayed: 'shockwave-hop_games_played',
  highestStage: 'shockwave-hop_highest_stage',
  settings: 'shockwave-hop_settings',
  totalScore: 'shockwave-hop_total_score'
};
