const GAME_WIDTH = 360;
const GAME_HEIGHT = 740;

const COLORS = {
    BG: '#0D1B2A',
    TABLE: '#2D6A4F',
    SKIN: '#F4A261',
    ORGAN_ACTIVE: '#52B788',
    ORGAN_FAKE: '#E63946',
    METER_LOW: '#FFD60A',
    METER_HIGH: '#FF4136',
    METER_BG: '#2B2D42',
    HUD_TEXT: '#F8F9FA',
    HEART_FULL: '#EF476F',
    HEART_EMPTY: '#6C757D',
    NOSE: '#FFAFCC',
    BTN_PRIMARY: '#06D6A0',
    BTN_SECONDARY: '#495057',
    COMBO: '#FFD60A',
    DANGER: '#FF4136',
    DARK_NAVY: 0x0D1B2A,
    DARK_NAVY_HEX: '#0D1B2A'
};

const SCORE_VALUES = {
    ORGAN_HIT: 100,
    DANGER_BONUS: 50,
    STAGE_CLEAR: 500
};

const COMBO_THRESHOLDS = [
    { streak: 3, mult: 1.5 },
    { streak: 5, mult: 2.0 },
    { streak: 8, mult: 3.0 }
];

const ORGAN_POSITIONS = [
    { x: 130, y: 340, name: 'heart' },
    { x: 210, y: 335, name: 'lung_r' },
    { x: 110, y: 370, name: 'lung_l' },
    { x: 180, y: 395, name: 'stomach' },
    { x: 240, y: 375, name: 'kidney' },
    { x: 150, y: 415, name: 'appendix' }
];

const NOSE_TAP_DEBOUNCE = 150;
const SNORE_EFFECT_DELAY = 1200;
const MAX_SCORE_DISPLAY = 9999999;

const PATIENT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="280" viewBox="0 0 320 280">
  <rect x="0" y="140" width="320" height="60" fill="#2D6A4F" rx="8"/>
  <rect x="30" y="80" width="260" height="130" fill="#F4A261" rx="40" stroke="#C67C3B" stroke-width="3"/>
  <circle cx="60" cy="100" r="50" fill="#F4A261" stroke="#C67C3B" stroke-width="3"/>
  <path d="M42 95 Q50 90 58 95" stroke="#5C3D11" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M62 95 Q70 90 78 95" stroke="#5C3D11" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="60" cy="112" r="14" fill="#FFAFCC" stroke="#D4A5B8" stroke-width="2"/>
  <circle cx="55" cy="114" r="4" fill="#E8899A"/>
  <circle cx="65" cy="114" r="4" fill="#E8899A"/>
  <line x1="30" y1="130" x2="290" y2="130" stroke="#C67C3B" stroke-width="2" stroke-dasharray="8,4"/>
  <rect x="80" y="148" width="200" height="60" fill="#5B9BD5" rx="4" opacity="0.8"/>
</svg>`;

const ORGAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <circle cx="30" cy="30" r="28" fill="#52B788" opacity="0.3"/>
  <path d="M30 50 C10 35 5 20 15 13 C22 8 28 12 30 18 C32 12 38 8 45 13 C55 20 50 35 30 50Z" fill="#52B788" stroke="#2D6A4F" stroke-width="2"/>
  <ellipse cx="22" cy="22" rx="6" ry="4" fill="white" opacity="0.4" transform="rotate(-20,22,22)"/>
</svg>`;

const ORGAN_LUNG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <circle cx="30" cy="30" r="28" fill="#52B788" opacity="0.3"/>
  <ellipse cx="30" cy="30" rx="20" ry="22" fill="#52B788" stroke="#2D6A4F" stroke-width="2"/>
  <path d="M30 12 L30 48" stroke="#2D6A4F" stroke-width="2"/>
  <ellipse cx="24" cy="24" rx="5" ry="3" fill="white" opacity="0.4"/>
</svg>`;

const ORGAN_STOMACH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <circle cx="30" cy="30" r="28" fill="#52B788" opacity="0.3"/>
  <path d="M20 15 Q15 30 20 42 Q30 55 40 42 Q48 30 40 18 Q30 10 20 15Z" fill="#52B788" stroke="#2D6A4F" stroke-width="2"/>
  <ellipse cx="26" cy="22" rx="5" ry="3" fill="white" opacity="0.4"/>
</svg>`;

const FAKE_ORGAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <circle cx="30" cy="30" r="28" fill="#E63946" opacity="0.25"/>
  <ellipse cx="30" cy="30" rx="22" ry="18" fill="#E63946" stroke="#A4202A" stroke-width="2"/>
  <line x1="20" y1="20" x2="40" y2="40" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <line x1="40" y1="20" x2="20" y2="40" stroke="white" stroke-width="3" stroke-linecap="round"/>
</svg>`;

const SCALPEL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20" viewBox="0 0 80 20">
  <rect x="0" y="6" width="48" height="8" fill="#ADB5BD" rx="3"/>
  <rect x="44" y="2" width="6" height="16" fill="#6C757D" rx="1"/>
  <path d="M50 10 L80 3 L76 10 L80 17 Z" fill="#E9ECEF"/>
</svg>`;

const ZZZ_CLOUD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80">
  <ellipse cx="60" cy="35" rx="55" ry="28" fill="white" stroke="#ADB5BD" stroke-width="2"/>
  <circle cx="25" cy="60" r="8" fill="white" stroke="#ADB5BD" stroke-width="2"/>
  <circle cx="15" cy="70" r="5" fill="white" stroke="#ADB5BD" stroke-width="2"/>
  <text x="60" y="43" text-anchor="middle" font-size="22" font-weight="bold" fill="#0D1B2A" font-family="monospace">ZZZ!</text>
</svg>`;

const HEART_FULL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path d="M12 21 C5 15 2 11 2 7 C2 4 4.5 2 7 2 C9 2 11 3.5 12 5 C13 3.5 15 2 17 2 C19.5 2 22 4 22 7 C22 11 19 15 12 21Z" fill="#EF476F" stroke="#C43D5E" stroke-width="1"/>
</svg>`;

const HEART_EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path d="M12 21 C5 15 2 11 2 7 C2 4 4.5 2 7 2 C9 2 11 3.5 12 5 C13 3.5 15 2 17 2 C19.5 2 22 4 22 7 C22 11 19 15 12 21Z" fill="#6C757D" stroke="#495057" stroke-width="1"/>
</svg>`;

const NOSE_HIGHLIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <circle cx="40" cy="40" r="36" fill="#FFAFCC" opacity="0.3" stroke="#FFAFCC" stroke-width="2" stroke-dasharray="6,4"/>
  <circle cx="40" cy="40" r="14" fill="#FFAFCC" stroke="#D4A5B8" stroke-width="2"/>
  <circle cx="35" cy="42" r="4" fill="#E8899A"/>
  <circle cx="45" cy="42" r="4" fill="#E8899A"/>
</svg>`;

const PARTICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="white"/>
</svg>`;

const PARTICLE_GREEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#52B788"/>
</svg>`;

const PARTICLE_PINK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#FFAFCC"/>
</svg>`;

const PARTICLE_GOLD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#FFD60A"/>
</svg>`;
