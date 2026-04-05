// Monty's Goats - Configuration
const COLORS = {
  primary: 0x1E90FF,
  secondary: 0x9B30FF,
  background: 0x0D0D1A,
  danger: 0xFF2D55,
  reward: 0xFFD700,
  goatAccent: 0x32CD32,
  uiText: 0xFFFFFF,
  uiBackground: 0x1A1A2E,
  neutralDoor: 0x8E8E93,
  timerFull: 0x00CED1,
  switchBtn: 0x1E90FF,
  stayBtn: 0x555566
};

const COLORS_HEX = {
  primary: '#1E90FF',
  danger: '#FF2D55',
  reward: '#FFD700',
  goatAccent: '#32CD32',
  uiText: '#FFFFFF',
  background: '#0D0D1A'
};

const DIFFICULTY = {
  timerByRange: [
    { min: 1, max: 5, timer: 8 },
    { min: 6, max: 15, timer: 7 },
    { min: 16, max: 30, timer: 6.5 },
    { min: 31, max: 50, timer: 5.5 },
    { min: 51, max: Infinity, timer: 5 }
  ],
  lieFrequency: [
    { min: 1, max: 5, freq: 0 },
    { min: 6, max: 10, freq: 0.6 },
    { min: 11, max: 20, freq: 0.8 },
    { min: 21, max: Infinity, freq: 0.9 }
  ],
  hintAccuracy: [
    { min: 11, max: 15, accuracy: 0.7 },
    { min: 16, max: 25, accuracy: 0.5 },
    { min: 26, max: Infinity, accuracy: 0.3 }
  ]
};

const LIE_POOL = [
  { id: 0, text: "IT'S 50/50 NOW!", isTrueAdvice: false },
  { id: 1, text: "SWITCHING NEVER WINS!", isTrueAdvice: false },
  { id: 2, text: "STAY! THE MATH SAYS STAY!", isTrueAdvice: false },
  { id: 3, text: "I WOULD SWITCH IF I WERE YOU!", isTrueAdvice: true },
  { id: 4, text: "THE GOAT TOLD ME YOUR DOOR IS WRONG!", isTrueAdvice: false },
  { id: 5, text: "STATISTICS: 99% OF CHAMPIONS STAY!", isTrueAdvice: false },
  { id: 6, text: "...", isTrueAdvice: null },
  { id: 7, text: "WAIT, WHICH DOOR DID YOU PICK AGAIN?", isTrueAdvice: false }
];

const SCORE_VALUES = {
  correctSwitch: 100,
  correctStay: 200,
  quickBonus: 50,
  correctStayLie: 300,
  correctSwitch4Door: 150,
  correctBlitz: 125
};

const COMBO_THRESHOLDS = [
  { streak: 3, multiplier: 2 },
  { streak: 5, multiplier: 3 },
  { streak: 8, multiplier: 5 }
];

const ROUND_END_DELAY = 300;
const ROUND_SETUP_DELAY = 200;
const INACTIVITY_TIMEOUT = 25000;

// SVG Assets - all with explicit width/height
const SVG_DOOR_CLOSED = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="160" viewBox="0 0 100 160">
  <rect x="5" y="0" width="90" height="155" rx="4" fill="#5A5A60"/>
  <rect x="10" y="5" width="80" height="145" rx="3" fill="#8E8E93"/>
  <rect x="18" y="14" width="64" height="58" rx="2" fill="#A0A0A6"/>
  <rect x="18" y="82" width="64" height="58" rx="2" fill="#A0A0A6"/>
  <circle cx="72" cy="88" r="6" fill="#FFD700"/>
</svg>`;

const SVG_DOOR_SELECTED = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="160" viewBox="0 0 100 160">
  <rect x="5" y="0" width="90" height="155" rx="4" fill="#5A5A60" stroke="#1E90FF" stroke-width="4"/>
  <rect x="10" y="5" width="80" height="145" rx="3" fill="#4A90E2"/>
  <rect x="18" y="14" width="64" height="58" rx="2" fill="#5BA0F0"/>
  <rect x="18" y="82" width="64" height="58" rx="2" fill="#5BA0F0"/>
  <circle cx="72" cy="88" r="6" fill="#FFD700"/>
</svg>`;

const SVG_DOOR_GOAT = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="160" viewBox="0 0 100 160">
  <rect x="5" y="0" width="90" height="155" rx="4" fill="#5A5A60" stroke="#32CD32" stroke-width="3"/>
  <rect x="10" y="5" width="80" height="145" rx="3" fill="#1A3D1A"/>
  <ellipse cx="50" cy="115" rx="28" ry="22" fill="#C8B89A"/>
  <circle cx="50" cy="82" r="18" fill="#C8B89A"/>
  <ellipse cx="35" cy="72" rx="8" ry="5" fill="#C8B89A"/>
  <ellipse cx="65" cy="72" rx="8" ry="5" fill="#C8B89A"/>
  <ellipse cx="44" cy="80" rx="4" ry="5" fill="#FFD700"/>
  <ellipse cx="56" cy="80" rx="4" ry="5" fill="#FFD700"/>
  <ellipse cx="44" cy="81" rx="2" ry="3" fill="#1A1A1A"/>
  <ellipse cx="56" cy="81" rx="2" ry="3" fill="#1A1A1A"/>
  <ellipse cx="50" cy="92" rx="9" ry="6" fill="#D4A0A0"/>
  <path d="M 38 66 Q 30 50 34 44" stroke="#8B7355" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M 62 66 Q 70 50 66 44" stroke="#8B7355" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="50" cy="102" rx="5" ry="8" fill="#A09070"/>
</svg>`;

const SVG_DOOR_CAR = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="160" viewBox="0 0 100 160">
  <defs><radialGradient id="sp"><stop offset="0%" stop-color="#FFD700" stop-opacity="0.3"/><stop offset="100%" stop-color="#1A1400" stop-opacity="0"/></radialGradient></defs>
  <rect x="5" y="0" width="90" height="155" rx="4" fill="#5A5A60" stroke="#FFD700" stroke-width="3"/>
  <rect x="10" y="5" width="80" height="145" rx="3" fill="#1A1400"/>
  <rect x="10" y="5" width="80" height="145" fill="url(#sp)"/>
  <rect x="20" y="100" width="60" height="25" rx="4" fill="#FFD700"/>
  <rect x="28" y="78" width="44" height="25" rx="6" fill="#FFE44D"/>
  <rect x="32" y="82" width="16" height="15" rx="2" fill="#87CEEB"/>
  <rect x="52" y="82" width="16" height="15" rx="2" fill="#87CEEB"/>
  <circle cx="32" cy="127" r="10" fill="#333"/>
  <circle cx="32" cy="127" r="5" fill="#666"/>
  <circle cx="68" cy="127" r="10" fill="#333"/>
  <circle cx="68" cy="127" r="5" fill="#666"/>
</svg>`;

const SVG_MONTY = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <rect x="15" y="32" width="30" height="22" rx="4" fill="#9B30FF"/>
  <polygon points="30,32 27,38 30,48 33,38" fill="#FFD700"/>
  <circle cx="30" cy="22" r="14" fill="#F4C28F"/>
  <ellipse cx="30" cy="10" rx="13" ry="6" fill="#3D2B1F"/>
  <circle cx="25" cy="21" r="2.5" fill="#1A1A1A"/>
  <circle cx="35" cy="21" r="2.5" fill="#1A1A1A"/>
  <path d="M 22 27 Q 30 34 38 27" stroke="#CC3300" stroke-width="2" fill="none" stroke-linecap="round"/>
  <rect x="36" y="26" width="4" height="10" rx="2" fill="#888"/>
  <circle cx="38" cy="25" r="3" fill="#AAA"/>
</svg>`;

const SVG_GOAT_BIG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <ellipse cx="40" cy="65" rx="30" ry="18" fill="#C8B89A"/>
  <circle cx="40" cy="32" r="22" fill="#C8B89A"/>
  <ellipse cx="24" cy="18" rx="9" ry="6" fill="#C8B89A"/>
  <ellipse cx="56" cy="18" rx="9" ry="6" fill="#C8B89A"/>
  <ellipse cx="34" cy="30" rx="5" ry="6" fill="#FFD700"/>
  <ellipse cx="46" cy="30" rx="5" ry="6" fill="#FFD700"/>
  <ellipse cx="34" cy="31" rx="2.5" ry="4" fill="#1A1A1A"/>
  <ellipse cx="46" cy="31" rx="2.5" ry="4" fill="#1A1A1A"/>
  <ellipse cx="40" cy="42" rx="11" ry="7" fill="#D4A0A0"/>
  <path d="M 27 12 Q 18 0 23 -6" stroke="#8B7355" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M 53 12 Q 62 0 57 -6" stroke="#8B7355" stroke-width="5" fill="none" stroke-linecap="round"/>
  <ellipse cx="40" cy="52" rx="6" ry="9" fill="#A09070"/>
</svg>`;

const SVG_PARTICLE = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
  <circle cx="4" cy="4" r="4" fill="#FFFFFF"/>
</svg>`;
