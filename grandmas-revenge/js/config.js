// === COLOR PALETTE ===
const COL = {
  BG: '#FFF8E7', PLAYER: '#5BC8F5', GRANDMA: '#9B59B6', DANGER: '#E74C3C',
  SKIN: '#FDBCB4', ACCENT: '#F39C12', HP_FULL: '#E74C3C', HP_EMPTY: '#BDC3C7',
  FLOOR: '#8B6914', UI_BG: '#FEFEFE', TEXT: '#2C3E50', WHITE: '#FFFFFF'
};

// === LAYOUT ===
const GAME_W = 390, GAME_H = 780;
const LANE_X = [80, 195, 310];
const PLAYER_Y_RATIO = 0.75;
const GRANDMA_Y = 130;
const FLOOR_Y_RATIO = 0.83;

// === TIMING ===
const INVINCIBILITY_MS = 500;
const DODGE_COOLDOWN_MS = 300;
const STAGE_START_GRACE_MS = 1200;
const INACTIVITY_MS = 3000;
const SWIPE_THRESHOLD = 30;
const DOUBLE_SWIPE_MS = 200;

// === SCORING ===
const SCORE = {
  DODGE_SLIPPER: 50, DODGE_REMOTE: 75, DODGE_POT: 100, DODGE_GRANDMA: 200,
  SURVIVAL_PER_SEC: 10, STAGE_CLEAR_BASE: 100, CLOSE_CALL_BONUS: 25,
  CLOSE_CALL_DIST: 20
};

// === HP ===
const MAX_HP = 5;

// === SVG ASSETS ===
const SVG_PLAYER = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="0 0 40 60">
  <rect x="10" y="22" width="20" height="22" rx="4" fill="#5BC8F5" stroke="#2C3E50" stroke-width="2"/>
  <circle cx="20" cy="14" r="12" fill="#FDBCB4" stroke="#2C3E50" stroke-width="2"/>
  <circle cx="15" cy="13" r="2.5" fill="#2C3E50"/><circle cx="25" cy="13" r="2.5" fill="#2C3E50"/>
  <path d="M14 18 Q20 22 26 18" stroke="#2C3E50" stroke-width="1.5" fill="none"/>
  <rect x="11" y="42" width="8" height="14" rx="3" fill="#8B6914" stroke="#2C3E50" stroke-width="1.5"/>
  <rect x="21" y="42" width="8" height="14" rx="3" fill="#8B6914" stroke="#2C3E50" stroke-width="1.5"/>
</svg>`;

function makeGrandmaSVG(tier) {
  let eyes = '', mouth = '', extras = '';
  const base = `<ellipse cx="40" cy="65" rx="30" ry="32" fill="#9B59B6" stroke="#2C3E50" stroke-width="2.5"/>
    <circle cx="30" cy="60" r="4" fill="#E74C3C" opacity="0.6"/><circle cx="45" cy="70" r="4" fill="#E74C3C" opacity="0.6"/>
    <circle cx="35" cy="75" r="3" fill="#F39C12" opacity="0.6"/>
    <circle cx="40" cy="22" r="18" fill="#FDBCB4" stroke="#2C3E50" stroke-width="2.5"/>
    <ellipse cx="40" cy="7" rx="14" ry="9" fill="#8B7355" stroke="#2C3E50" stroke-width="2"/>
    <rect x="24" y="17" width="12" height="8" rx="3" fill="none" stroke="#2C3E50" stroke-width="1.5"/>
    <rect x="44" y="17" width="12" height="8" rx="3" fill="none" stroke="#2C3E50" stroke-width="1.5"/>
    <line x1="36" y1="21" x2="44" y2="21" stroke="#2C3E50" stroke-width="1.5"/>`;
  if (tier <= 1) {
    eyes = `<circle cx="30" cy="21" r="2" fill="#2C3E50"/><circle cx="50" cy="21" r="2" fill="#2C3E50"/>`;
    mouth = `<path d="M32 28 Q40 30 48 28" stroke="#2C3E50" stroke-width="2" fill="none"/>`;
    extras = `<circle cx="68" cy="18" r="4" fill="#DDD" opacity="0.5"/>`;
  } else if (tier === 2) {
    eyes = `<line x1="27" y1="21" x2="33" y2="21" stroke="#2C3E50" stroke-width="2.5"/><line x1="47" y1="21" x2="53" y2="21" stroke="#2C3E50" stroke-width="2.5"/>`;
    mouth = `<line x1="32" y1="29" x2="48" y2="29" stroke="#2C3E50" stroke-width="2"/>`;
    extras = `<circle cx="22" cy="28" r="5" fill="#E74C3C" opacity="0.3"/><circle cx="58" cy="28" r="5" fill="#E74C3C" opacity="0.3"/>`;
  } else if (tier === 3) {
    eyes = `<circle cx="30" cy="21" r="1.2" fill="#2C3E50"/><circle cx="50" cy="21" r="1.2" fill="#2C3E50"/>`;
    mouth = `<rect x="32" y="27" width="16" height="4" rx="1" fill="#2C3E50"/>`;
    extras = `<circle cx="60" cy="12" r="3" fill="#5BC8F5" opacity="0.6"/><circle cx="64" cy="8" r="2" fill="#5BC8F5" opacity="0.4"/>`;
  } else if (tier === 4) {
    eyes = `<circle cx="30" cy="21" r="3" fill="#E74C3C"/><circle cx="50" cy="21" r="3" fill="#E74C3C"/>`;
    mouth = `<ellipse cx="40" cy="30" rx="8" ry="5" fill="#2C3E50"/>`;
    extras = '';
  } else if (tier === 5) {
    eyes = `<circle cx="30" cy="21" r="3.5" fill="#E74C3C"/><circle cx="50" cy="21" r="3.5" fill="#E74C3C"/>`;
    mouth = `<ellipse cx="40" cy="31" rx="10" ry="6" fill="#2C3E50"/>`;
    extras = '';
  } else {
    eyes = `<circle cx="30" cy="21" r="3.5" fill="#F39C12"/><circle cx="50" cy="21" r="3.5" fill="#F39C12"/>`;
    mouth = `<ellipse cx="40" cy="31" rx="10" ry="6" fill="#2C3E50"/><line x1="34" y1="28" x2="37" y2="34" stroke="white" stroke-width="1.5"/><line x1="46" y1="28" x2="43" y2="34" stroke="white" stroke-width="1.5"/>`;
    extras = '';
  }
  const arm = `<line x1="68" y1="50" x2="78" y2="38" stroke="#FDBCB4" stroke-width="8" stroke-linecap="round"/>`;
  const brows_angry = tier >= 2
    ? `<line x1="26" y1="17" x2="34" y2="15" stroke="#2C3E50" stroke-width="2.5"/><line x1="46" y1="15" x2="54" y2="17" stroke="#2C3E50" stroke-width="2.5"/>`
    : `<line x1="26" y1="15" x2="34" y2="17" stroke="#2C3E50" stroke-width="2"/><line x1="46" y1="17" x2="54" y2="15" stroke="#2C3E50" stroke-width="2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" viewBox="0 0 80 100">${base}${brows_angry}${eyes}${mouth}${arm}${extras}</svg>`;
}

const SVG_GRANDMA = {};
for (let t = 1; t <= 6; t++) SVG_GRANDMA[t] = makeGrandmaSVG(t);

const SVG_SLIPPER = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="18" viewBox="0 0 30 18">
  <ellipse cx="15" cy="12" rx="14" ry="6" fill="#E74C3C" stroke="#2C3E50" stroke-width="1.5"/>
  <ellipse cx="12" cy="8" rx="8" ry="5" fill="#FF6B6B" stroke="#2C3E50" stroke-width="1.5"/>
  <path d="M4 8 Q8 4 16 5 Q20 5 22 8" stroke="#FFF" stroke-width="2" fill="none"/>
</svg>`;

const SVG_REMOTE = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="40" viewBox="0 0 14 40">
  <rect x="2" y="2" width="10" height="36" rx="4" fill="#2C3E50" stroke="#7F8C8D" stroke-width="1.5"/>
  <rect x="4" y="6" width="6" height="4" rx="1" fill="#5BC8F5"/>
  <circle cx="7" cy="16" r="2" fill="#E74C3C"/>
  <circle cx="7" cy="23" r="1.5" fill="#7F8C8D"/><circle cx="7" cy="29" r="1.5" fill="#7F8C8D"/>
</svg>`;

const SVG_POT = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="45" viewBox="0 0 50 45">
  <ellipse cx="25" cy="28" rx="20" ry="16" fill="#2C3E50" stroke="#7F8C8D" stroke-width="2"/>
  <ellipse cx="25" cy="14" rx="22" ry="6" fill="#3D3D3D" stroke="#7F8C8D" stroke-width="2"/>
  <ellipse cx="25" cy="10" rx="5" ry="4" fill="#7F8C8D" stroke="#2C3E50" stroke-width="1.5"/>
  <circle cx="18" cy="5" r="4" fill="white" opacity="0.8"/><circle cx="32" cy="3" r="5" fill="white" opacity="0.8"/>
  <rect x="2" y="22" width="8" height="5" rx="2.5" fill="#7F8C8D" stroke="#2C3E50" stroke-width="1.5"/>
</svg>`;

const SVG_GRANDMA_BALL = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <circle cx="30" cy="30" r="28" fill="#9B59B6" stroke="#2C3E50" stroke-width="2.5"/>
  <circle cx="30" cy="22" r="12" fill="#FDBCB4" stroke="#2C3E50" stroke-width="2"/>
  <line x1="24" y1="20" x2="28" y2="22" stroke="#2C3E50" stroke-width="2"/>
  <line x1="32" y1="22" x2="36" y2="20" stroke="#2C3E50" stroke-width="2"/>
  <circle cx="26" cy="23" r="1.5" fill="#2C3E50"/><circle cx="34" cy="23" r="1.5" fill="#2C3E50"/>
  <path d="M26 27 Q30 29 34 27" stroke="#2C3E50" stroke-width="1.5" fill="none"/>
</svg>`;

const SVG_HEART_FULL = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
  <path d="M9 16 C4 11 1 8 1 5 C1 2.5 3 1 5.5 1 C7 1 8.5 2 9 3.5 C9.5 2 11 1 12.5 1 C15 1 17 2.5 17 5 C17 8 14 11 9 16Z" fill="#E74C3C" stroke="#C0392B" stroke-width="1"/>
</svg>`;

const SVG_HEART_EMPTY = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
  <path d="M9 16 C4 11 1 8 1 5 C1 2.5 3 1 5.5 1 C7 1 8.5 2 9 3.5 C9.5 2 11 1 12.5 1 C15 1 17 2.5 17 5 C17 8 14 11 9 16Z" fill="#BDC3C7" stroke="#95A5A6" stroke-width="1"/>
</svg>`;

// Particle texture
const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#F39C12"/></svg>`;
const SVG_DUST = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="#BDC3C7"/></svg>`;
const SVG_STAR = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 6.2,3.5 10,3.5 7,5.8 8,10 5,7.5 2,10 3,5.8 0,3.5 3.8,3.5" fill="#F39C12"/></svg>`;

// === PROJECTILE CONFIG ===
const PROJ_TYPES = {
  slipper:  { key: 'slipper', w: 30, h: 18, ease: 'Sine.easeIn', scoreKey: 'DODGE_SLIPPER', hitText: 'BONK!', hitShake: 4, hitStop: 16 },
  remote:   { key: 'remote', w: 14, h: 40, ease: 'Linear', scoreKey: 'DODGE_REMOTE', hitText: 'CRACK!', hitShake: 6, hitStop: 32 },
  pot:      { key: 'pot', w: 50, h: 45, ease: 'Quad.easeIn', scoreKey: 'DODGE_POT', hitText: 'CLANG!', hitShake: 10, hitStop: 48, shockwave: true },
  grandma_ball: { key: 'grandma_ball', w: 60, h: 60, ease: 'Sine.easeIn', scoreKey: 'DODGE_GRANDMA', hitText: 'SPLAT!', hitShake: 16, hitStop: 64, screenFlash: true }
};

// === ANGER TIERS ===
function getAngerTier(stage) {
  if (stage <= 3) return 1;
  if (stage <= 6) return 2;
  if (stage <= 9) return 3;
  if (stage <= 12) return 4;
  if (stage <= 19) return 5;
  return 6;
}
