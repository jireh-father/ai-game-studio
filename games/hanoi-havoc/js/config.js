const COLORS = {
  primary: 0xC8A96E,
  secondary: 0x5C2E0A,
  bg: 0x1A0F00,
  accent: 0xFFD700,
  danger: 0xFF2222,
  success: 0x4CAF50,
  text: 0xF5E6C8,
  uiBg: 0x2C1A0A,
  priest: 0x8B0000
};
const COLOR_HEX = {
  primary: '#C8A96E', secondary: '#5C2E0A', bg: '#1A0F00',
  accent: '#FFD700', danger: '#FF2222', success: '#4CAF50',
  text: '#F5E6C8', uiBg: '#2C1A0A', priest: '#8B0000'
};

const DISC_WIDTHS = [0, 56, 72, 88, 104, 120, 136, 152, 168];

function makeDiscSVG(size) {
  const w = DISC_WIDTHS[size];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="24" viewBox="0 0 ${w} 24">
    <rect x="2" y="2" width="${w-4}" height="20" rx="10" ry="10" fill="#C8A96E" stroke="#5C2E0A" stroke-width="2"/>
    <line x1="10" y1="6" x2="10" y2="18" stroke="#5C2E0A" stroke-width="1.5" opacity="0.5"/>
    <line x1="${w-10}" y1="6" x2="${w-10}" y2="18" stroke="#5C2E0A" stroke-width="1.5" opacity="0.5"/>
    <text x="${w/2}" y="17" text-anchor="middle" font-size="12" fill="#5C2E0A" font-family="monospace" font-weight="bold">${size}</text>
  </svg>`;
}

const DISC_SVGS = [null, makeDiscSVG(1), makeDiscSVG(2), makeDiscSVG(3), makeDiscSVG(4),
  makeDiscSVG(5), makeDiscSVG(6), makeDiscSVG(7), makeDiscSVG(8)];

const PEG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="200" viewBox="0 0 20 200">
  <rect x="8" y="0" width="4" height="180" fill="#C8A96E" stroke="#5C2E0A" stroke-width="1"/>
  <rect x="0" y="180" width="20" height="20" rx="3" fill="#5C2E0A"/>
</svg>`;

const PRIEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
  <polygon points="20,8 8,45 32,45" fill="#8B0000"/>
  <circle cx="20" cy="7" r="7" fill="#D4A96A"/>
  <line x1="16" y1="5" x2="18" y2="7" stroke="#000" stroke-width="1.5"/>
  <line x1="22" y1="5" x2="24" y2="7" stroke="#000" stroke-width="1.5"/>
  <line x1="32" y1="15" x2="36" y2="45" stroke="#5C2E0A" stroke-width="2"/>
  <circle cx="36" cy="13" r="3" fill="#FFD700"/>
</svg>`;

const BOLT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="60" viewBox="0 0 30 60">
  <polygon points="18,0 8,28 16,28 12,60 22,24 14,24" fill="#FFD700" stroke="#FF2222" stroke-width="1.5"/>
</svg>`;

const PARTICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" fill="#FFD700"/></svg>`;

const SCORE = { catch: 100, sequenceBonus: 150, stageClear: 500, closeCall: 200, redirect: 50 };

// Peg x positions (canvas 360 wide)
const PEG_X = [70, 180, 290];
const PEG_Y = 580;

function getStageParams(stage) {
  return {
    discCount: Math.min(3 + Math.floor(stage / 1.5), 8),
    fallSpeed: Math.min(150 + (stage - 1) * 15, 300),
    catchWindowMs: Math.max(3000 - (stage - 1) * 120, 1200),
    simultaneous: stage < 4 ? 1 : stage < 8 ? 2 : 3,
    labelVisibleMs: stage < 7 ? 99999 : Math.max(500 - (stage - 7) * 50, 200),
    pegSwayPx: stage >= 13 ? Math.min((stage - 13) * 5, 30) : 0
  };
}
