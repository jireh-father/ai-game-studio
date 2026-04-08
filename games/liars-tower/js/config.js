// Liar's Tower — Game constants, SVG assets, difficulty tables
const GAME_W = 400;
const GAME_H = 700;

const COLORS = {
  bg: 0x1A1A2E,
  slate: 0x2E4057,
  gold: 0xF5C518,
  crimson: 0xCC2936,
  parchment: 0xF4E9CD,
  ink: 0x1A1A1A,
  offwhite: 0xE8E8E8,
  crack: 0xFF6B35,
  blue: 0x00B4D8,
  yellow: 0xFFE66D,
};

const SCORE = {
  base: 100,
  stageBonus: 500,
  pivotal: 200,
  comboMax: 8,
};

const STAGE_LEN = 5;
const MAX_SHAKES = 3;
const INACTIVITY_MS = 25000;
const SOLVER_MAX_ITER = 500;

// Fall time (ms) per stage
function getFallTime(stage) {
  return Math.max(2000, 4000 - (stage - 1) * 100);
}
// Statement tier 0=self, 1=direct, 2=indirect, 3=group
// FIX: Stages 1-3 use DIRECT references only (tier 1) to avoid self-reference ambiguity
function getTier(stage) {
  if (stage <= 3) return 1;      // direct reference only
  if (stage <= 6) return 1;      // direct
  if (stage <= 9) return 2;      // indirect
  if (stage <= 12) return 3;     // group
  return 3;
}

// ==== SVG ASSETS ====
const SVG_KNIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="80" viewBox="0 0 72 80">
<path d="M36 4 L64 20 L64 52 Q64 72 36 78 Q8 72 8 52 L8 20 Z" fill="#2E4057" stroke="#F5C518" stroke-width="3"/>
<rect x="20" y="32" width="12" height="5" rx="2" fill="#F5C518"/>
<rect x="40" y="32" width="12" height="5" rx="2" fill="#F5C518"/>
<polygon points="24,12 30,4 36,12 42,4 48,12" fill="#F5C518"/>
<path d="M30 48 L36 58 L42 48" fill="none" stroke="#F5C518" stroke-width="2"/>
</svg>`;

const SVG_LIAR = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="80" viewBox="0 0 72 80">
<ellipse cx="36" cy="44" rx="28" ry="34" fill="#1A1A2E" stroke="#CC2936" stroke-width="3"/>
<ellipse cx="36" cy="22" rx="22" ry="20" fill="#0D0D1A"/>
<ellipse cx="36" cy="28" rx="6" ry="8" fill="#CC2936"/>
<ellipse cx="36" cy="28" rx="3" ry="4" fill="#1A1A1A"/>
<path d="M22 56 Q36 52 50 56" fill="none" stroke="#CC2936" stroke-width="2"/>
</svg>`;

const SVG_TILE_KNIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="36" viewBox="0 0 200 36">
<rect x="2" y="2" width="196" height="32" rx="6" fill="#2E4057" stroke="#F5C518" stroke-width="2"/>
<line x1="16" y1="10" x2="16" y2="26" stroke="#F5C518" stroke-width="3"/>
<line x1="10" y1="18" x2="22" y2="18" stroke="#F5C518" stroke-width="2"/>
<text x="100" y="23" text-anchor="middle" font-size="13" fill="#F5C518" font-family="monospace" font-weight="bold">KNIGHT</text>
</svg>`;

const SVG_TILE_LIAR = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="36" viewBox="0 0 200 36">
<rect x="2" y="2" width="196" height="32" rx="6" fill="#2E4057" stroke="#CC2936" stroke-width="2"/>
<ellipse cx="16" cy="18" rx="8" ry="6" fill="none" stroke="#CC2936" stroke-width="2"/>
<ellipse cx="13" cy="16" rx="2" ry="2" fill="#CC2936"/>
<ellipse cx="19" cy="16" rx="2" ry="2" fill="#CC2936"/>
<text x="100" y="23" text-anchor="middle" font-size="13" fill="#CC2936" font-family="monospace" font-weight="bold">LIAR</text>
</svg>`;

const SVG_CRACK = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<path d="M12 2 L7 12 L11 12 L6 22 L17 10 L13 10 Z" fill="#FF6B35" stroke="#1A1A1A" stroke-width="1"/>
</svg>`;

const SVG_CRACK_EMPTY = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<circle cx="12" cy="12" r="9" fill="none" stroke="#555" stroke-width="2"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
<circle cx="4" cy="4" r="4" fill="#FFFFFF"/>
</svg>`;
