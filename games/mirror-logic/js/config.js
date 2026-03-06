// Mirror Logic - Configuration & Constants

const COLORS = {
  BG: '#0A0E1A',
  GRID_LINE: '#1A2040',
  GRID_HIGHLIGHT: '#2A3060',
  LASER: '#FF2244',
  LASER_BLUE: '#2288FF',
  MIRROR: '#C0C8D8',
  MIRROR_EDGE: '#FFFFFF',
  TARGET: '#44FF88',
  TARGET_HIT: '#FFD700',
  WALL: '#333344',
  WALL_BOMB: '#FF4444',
  TIMER_NORMAL: '#FFFFFF',
  TIMER_WARNING: '#FF8800',
  TIMER_CRITICAL: '#FF2244',
  UI_TEXT: '#E0E4EC',
  EMITTER: '#FF0044',
  PRISM: '#00FFCC',
  SUCCESS: '#44FF88',
  EXPLOSION_1: '#FF4444',
  EXPLOSION_2: '#FF8800',
  EXPLOSION_3: '#FFD700'
};

const GRID = {
  MIN_CELL: 48,
  MAX_CELL: 64,
  HUD_TOP: 48,
  HUD_BOTTOM: 56,
  PADDING: 20
};

const DIFFICULTY = {
  getParams(stage) {
    if (stage <= 5) return { cols: 5, rows: 6, targets: Math.min(2 + Math.floor(stage / 3), 3), walls: Math.min(Math.floor(stage / 4), 1), mirrors: 3 + Math.floor(stage / 3), timer: 25, wallBombs: 0 };
    if (stage <= 12) return { cols: 5, rows: 7, targets: Math.min(3 + Math.floor((stage - 5) / 4), 4), walls: Math.min(1 + Math.floor((stage - 5) / 3), 2), mirrors: 4 + Math.floor((stage - 5) / 3), timer: 25, wallBombs: stage >= 8 ? 1 : 0 };
    if (stage <= 20) return { cols: 6, rows: 7, targets: Math.min(4 + Math.floor((stage - 12) / 4), 5), walls: Math.min(2 + Math.floor((stage - 12) / 3), 3), mirrors: 5 + Math.floor((stage - 12) / 3), timer: 22, wallBombs: 1 };
    if (stage <= 30) return { cols: 6, rows: 8, targets: Math.min(5 + Math.floor((stage - 20) / 5), 6), walls: Math.min(3 + Math.floor((stage - 20) / 3), 5), mirrors: 6 + Math.floor((stage - 20) / 4), timer: 20, wallBombs: 2 };
    return { cols: 6, rows: 8, targets: Math.min(6 + Math.floor((stage - 30) / 5), 7), walls: Math.min(4 + Math.floor((stage - 30) / 4), 6), mirrors: 7 + Math.floor((stage - 30) / 5), timer: 18, wallBombs: 2 };
  },
  isRestStage(s) { return s > 1 && s % 5 === 0 && s % 10 !== 0; },
  isBossStage(s) { return s > 1 && s % 10 === 0; }
};

const SCORING = {
  TARGET_HIT: 100,
  CONSECUTIVE_BONUS: 50,
  STAGE_CLEAR: 200,
  TIME_BONUS_PER_SEC: 10,
  PERFECT_BONUS: 300,
  SPEED_BONUS: 150,
  SPEED_THRESHOLD: 15,
  BOSS_BONUS: 500,
  STREAK_THRESHOLDS: { 3: 1.5, 5: 2.0, 10: 3.0 }
};

const TIMER = { WARNING: 8, CRITICAL: 4 };

const DIRECTIONS = { UP: { dx: 0, dy: -1 }, DOWN: { dx: 0, dy: 1 }, LEFT: { dx: -1, dy: 0 }, RIGHT: { dx: 1, dy: 0 } };
const DIR_LIST = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

function makeSVG(content, w = 40, h = 40) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${content}</svg>`;
}

const SVG = {
  mirror45: makeSVG('<rect x="2" y="2" width="36" height="36" rx="3" fill="#1A2040" stroke="#333344" stroke-width="1"/><line x1="6" y1="34" x2="34" y2="6" stroke="#C0C8D8" stroke-width="4" stroke-linecap="round"/><line x1="8" y1="32" x2="32" y2="8" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>'),
  mirror135: makeSVG('<rect x="2" y="2" width="36" height="36" rx="3" fill="#1A2040" stroke="#333344" stroke-width="1"/><line x1="6" y1="6" x2="34" y2="34" stroke="#C0C8D8" stroke-width="4" stroke-linecap="round"/><line x1="8" y1="8" x2="32" y2="32" stroke="#FFFFFF" stroke-width="1" opacity="0.4"/>'),
  emitter: makeSVG('<rect x="4" y="8" width="32" height="24" rx="4" fill="#331122" stroke="#FF0044" stroke-width="2"/><circle cx="32" cy="20" r="5" fill="#FF2244"/><circle cx="32" cy="20" r="3" fill="#FF4466"/><rect x="8" y="14" width="18" height="12" rx="2" fill="#220011"/>'),
  wall: makeSVG('<rect x="2" y="2" width="36" height="36" rx="2" fill="#333344" stroke="#444466" stroke-width="1"/><line x1="2" y1="14" x2="38" y2="14" stroke="#444466" stroke-width="1"/><line x1="2" y1="26" x2="38" y2="26" stroke="#444466" stroke-width="1"/>'),
  wallBomb: makeSVG('<rect x="2" y="2" width="36" height="36" rx="2" fill="#441111" stroke="#FF4444" stroke-width="2"/><line x1="10" y1="10" x2="30" y2="30" stroke="#FF4444" stroke-width="2"/><line x1="30" y1="10" x2="10" y2="30" stroke="#FF4444" stroke-width="2"/>'),
  cell: makeSVG('<rect x="1" y="1" width="38" height="38" fill="#0A0E1A" stroke="#1A2040" stroke-width="1"/>'),
  targetHit: makeSVG('<circle cx="18" cy="18" r="14" fill="#FFD700" opacity="0.4"/><circle cx="18" cy="18" r="10" fill="#FFD700" opacity="0.7"/><circle cx="18" cy="18" r="6" fill="#FFD700"/>', 36, 36),
  particle: makeSVG('<circle cx="4" cy="4" r="4" fill="#FFFFFF"/>', 8, 8)
};

function makeTargetSVG(n) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="#44FF88" opacity="0.3"/><circle cx="18" cy="18" r="10" fill="#44FF88" opacity="0.6"/><circle cx="18" cy="18" r="6" fill="#44FF88"/><text x="18" y="23" text-anchor="middle" fill="#0A0E1A" font-size="14" font-weight="bold">${n}</text></svg>`;
}

for (let i = 1; i <= 7; i++) SVG['target_' + i] = makeTargetSVG(i);
