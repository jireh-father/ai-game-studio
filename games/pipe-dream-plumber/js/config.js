// config.js - Constants, colors, difficulty, SVG strings, pipe catalog

const COLORS = {
  pipeMetal: '#B0BEC5', pipeOutline: '#37474F',
  bgKitchen: '#FFF8E1', bgBathroom: '#E0F7FA', bgBasement: '#ECEFF1',
  water: '#4FC3F7', danger: '#EF5350', success: '#66BB6A',
  uiText: '#1A237E', uiBg: '#FFFFFF', accent: '#FFB300',
  trayBg: '#CFD8DC', obstacle: '#8D6E63',
  coffee: '#795548', toilet: '#FAFAFA', sprinkler: '#4CAF50',
  waterRed: '#EF5350', waterGreen: '#66BB6A', waterYellow: '#FFEE58'
};

const WATER_COLORS = ['#4FC3F7', '#EF5350', '#66BB6A', '#FFEE58'];

const SCORING = {
  drainConnect: 200, pipePlaced: 10, specialActivated: 50,
  stageClear: 500, speedBonus: 100, noFloodClear: 300, bossBonus: 1000
};

// Directions: TOP=0, RIGHT=1, BOTTOM=2, LEFT=3
const DIR = { TOP: 0, RIGHT: 1, BOTTOM: 2, LEFT: 3 };
const DIR_DR = [[-1,0],[0,1],[1,0],[0,-1]];
const OPP = [2, 3, 0, 1];

// Pipe connections: array of open directions
const PIPE_DEFS = {
  STRAIGHT:  { conns: [[DIR.LEFT, DIR.RIGHT]], rotStates: 2, color: COLORS.pipeMetal },
  L_BEND:    { conns: [[DIR.BOTTOM, DIR.RIGHT]], rotStates: 4, color: COLORS.pipeMetal },
  T_JUNCTION:{ conns: [[DIR.LEFT, DIR.RIGHT, DIR.BOTTOM]], rotStates: 4, color: COLORS.pipeMetal },
  CROSS:     { conns: [[DIR.TOP, DIR.RIGHT, DIR.BOTTOM, DIR.LEFT]], rotStates: 1, color: COLORS.pipeMetal },
  COFFEE:    { conns: [[DIR.LEFT, DIR.RIGHT]], rotStates: 2, color: COLORS.coffee, special: 'coffee' },
  TOILET:    { conns: [[DIR.LEFT, DIR.RIGHT]], rotStates: 2, color: COLORS.toilet, special: 'toilet' },
  SPRINKLER: { conns: [[DIR.LEFT, DIR.RIGHT, DIR.BOTTOM]], rotStates: 4, color: COLORS.sprinkler, special: 'sprinkler' }
};

function getConnections(pipeType, rotation) {
  const base = PIPE_DEFS[pipeType].conns[0];
  return base.map(d => (d + rotation) % 4);
}

function hasConnection(pipeType, rotation, dir) {
  return getConnections(pipeType, rotation).includes(dir);
}

const FLOOD_RATE = 0.05; // 5% per second
const INACTIVITY_TIMEOUT = 10000;

const ROOM_THEMES = [
  { name: 'Kitchen', bg: COLORS.bgKitchen },
  { name: 'Bathroom', bg: COLORS.bgBathroom },
  { name: 'Basement', bg: COLORS.bgBasement }
];

const ROOM_HUMOR = [
  'Toilet to Kitchen sink??', 'Bathtub drains to fridge!',
  'Washing machine to shower!', 'Hot tub to dishwasher!',
  'Garden hose to toilet!', 'Fish tank to coffee maker!'
];

// SVG strings for all textures
const SVG = {
  cell: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="1" y="1" width="46" height="46" fill="#ECEFF1" stroke="#B0BEC5" stroke-width="1" rx="2"/></svg>`,
  straight: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="0" y="16" width="48" height="16" fill="#B0BEC5" stroke="#37474F" stroke-width="2" rx="2"/><rect x="0" y="20" width="48" height="8" fill="#90A4AE" opacity="0.5"/></svg>`,
  lbend: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M24,48 L24,24 L48,24" fill="none" stroke="#B0BEC5" stroke-width="14" stroke-linejoin="round"/><path d="M24,48 L24,24 L48,24" fill="none" stroke="#37474F" stroke-width="16" stroke-linejoin="round" opacity="0.15"/></svg>`,
  tjunction: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="0" y="16" width="48" height="16" fill="#B0BEC5" stroke="#37474F" stroke-width="2"/><rect x="16" y="16" width="16" height="32" fill="#B0BEC5" stroke="#37474F" stroke-width="2"/></svg>`,
  cross: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="0" y="16" width="48" height="16" fill="#B0BEC5" stroke="#37474F" stroke-width="2"/><rect x="16" y="0" width="16" height="48" fill="#B0BEC5" stroke="#37474F" stroke-width="2"/></svg>`,
  coffee: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="0" y="16" width="48" height="16" fill="#795548" stroke="#37474F" stroke-width="2" rx="2"/><ellipse cx="24" cy="12" rx="6" ry="4" fill="#8D6E63"/><path d="M20,12 Q24,4 28,12" fill="none" stroke="#BCAAA4" stroke-width="1.5" opacity="0.7"/></svg>`,
  toilet: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="0" y="16" width="48" height="16" fill="#FAFAFA" stroke="#37474F" stroke-width="2" rx="4"/><ellipse cx="24" cy="24" rx="10" ry="7" fill="#E0E0E0" stroke="#37474F" stroke-width="1"/><rect x="22" y="10" width="4" height="8" fill="#90A4AE" rx="1"/></svg>`,
  sprinkler: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="0" y="20" width="48" height="12" fill="#4CAF50" stroke="#37474F" stroke-width="2" rx="2"/><circle cx="24" cy="14" r="5" fill="#66BB6A" stroke="#37474F" stroke-width="1.5"/><line x1="24" y1="9" x2="20" y2="4" stroke="#4FC3F7" stroke-width="1.5"/><line x1="24" y1="9" x2="28" y2="4" stroke="#4FC3F7" stroke-width="1.5"/></svg>`,
  source: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="0" y="8" width="20" height="32" fill="#1565C0" stroke="#37474F" stroke-width="2" rx="3"/><polygon points="20,16 32,24 20,32" fill="#4FC3F7"/></svg>`,
  drain: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="28" y="8" width="20" height="32" fill="#37474F" stroke="#263238" stroke-width="2" rx="3"/><circle cx="38" cy="24" r="6" fill="#263238"/><path d="M35,21 Q38,24 35,27 M38,20 Q41,24 38,28" fill="none" stroke="#546E7A" stroke-width="1"/></svg>`,
  obstacle: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect x="4" y="4" width="40" height="40" fill="#8D6E63" stroke="#5D4037" stroke-width="2" rx="4"/><line x1="12" y1="4" x2="12" y2="44" stroke="#5D4037" stroke-width="1" opacity="0.3"/><line x1="36" y1="4" x2="36" y2="44" stroke="#5D4037" stroke-width="1" opacity="0.3"/></svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="3" fill="#B0BEC5"/></svg>`,
  waterDrop: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="3" fill="#4FC3F7"/></svg>`,
  wrench: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M6,18 L10,14 L14,18 L10,22Z" fill="#FFB300" stroke="#F57F17" stroke-width="1"/><rect x="9" y="4" width="4" height="12" fill="#FFB300" stroke="#F57F17" stroke-width="1" rx="1"/></svg>`
};

const PIPE_SVG_MAP = {
  STRAIGHT: 'straight', L_BEND: 'lbend', T_JUNCTION: 'tjunction',
  CROSS: 'cross', COFFEE: 'coffee', TOILET: 'toilet', SPRINKLER: 'sprinkler'
};

const TRAY_WEIGHTS = {
  early:  { STRAIGHT: 50, L_BEND: 30, T_JUNCTION: 20 },
  mid:    { STRAIGHT: 35, L_BEND: 25, T_JUNCTION: 20, CROSS: 10, COFFEE: 10 },
  late:   { STRAIGHT: 25, L_BEND: 20, T_JUNCTION: 20, CROSS: 10, COFFEE: 8, TOILET: 9, SPRINKLER: 8 }
};
