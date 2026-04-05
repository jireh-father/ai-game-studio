// Birthday Bomb - Game Configuration

const COLORS = {
  primary: '#FF6B9D',
  secondary: '#FFD93D',
  background: '#FFF8F0',
  danger: '#FF3B30',
  reward: '#34C759',
  text: '#1C1C3A',
  uiBg: '#E8E0FF',
  partyRoom: '#F5E6D3',
  streakFlame: '#FF9500'
};

const SHIRT_COLORS = ['#FF6B9D', '#5AC8FA', '#34C759', '#FF9500', '#AF52DE', '#FF3B30'];

const SCORE_VALUES = {
  correctMatch: 200,
  correctNoMatch: 150,
  stageClear: 500,
  streakBonus: 100,
  perfectStage: 1000,
  nearMiss: 50,
  clutchMultiplier: 2,
  clutchThreshold: 5
};

const BIRTHDAY_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];

const BIRTHDAY_POOL = [];
for (let m = 0; m < 12; m++) {
  for (let d = 1; d <= DAYS_IN_MONTH[m]; d++) {
    BIRTHDAY_POOL.push(BIRTHDAY_MONTHS[m] + ' ' + d);
  }
}

function makePersonSVG(shirtColor, w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect x="2" y="2" width="${w-4}" height="${h-4}" rx="8" fill="#FFFFFF" stroke="#1C1C3A" stroke-width="2"/>
    <circle cx="${w/2}" cy="${h*0.35}" r="${w*0.23}" fill="#FFD93D" stroke="#1C1C3A" stroke-width="2"/>
    <circle cx="${w*0.42}" cy="${h*0.33}" r="${w*0.04}" fill="#1C1C3A"/>
    <circle cx="${w*0.58}" cy="${h*0.33}" r="${w*0.04}" fill="#1C1C3A"/>
    <path d="M${w*0.4} ${h*0.4} Q${w/2} ${h*0.47} ${w*0.6} ${h*0.4}" stroke="#1C1C3A" stroke-width="2" fill="none"/>
    <rect x="${w*0.23}" y="${h*0.58}" width="${w*0.54}" height="${h*0.32}" rx="5" fill="${shirtColor}" stroke="#1C1C3A" stroke-width="2"/>
  </svg>`;
}

const SVG_BOMB = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="60" viewBox="0 0 48 60">
  <path d="M28 8 Q36 2 40 10" stroke="#8B6914" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="40" cy="10" r="4" fill="#FF9500"/>
  <circle cx="22" cy="34" r="20" fill="#1C1C3A" stroke="#333" stroke-width="2"/>
  <ellipse cx="15" cy="26" rx="5" ry="4" fill="#444" opacity="0.6"/>
</svg>`;

const SVG_CAKE = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="4" y="16" width="24" height="12" rx="3" fill="#FF6B9D"/>
  <path d="M4 16 Q8 11 12 16 Q16 11 20 16 Q24 11 28 16" fill="#FFFFFF" stroke="none"/>
  <rect x="14" y="8" width="4" height="8" rx="1" fill="#FFD93D"/>
  <ellipse cx="16" cy="7" rx="2.5" ry="3.5" fill="#FF9500"/>
</svg>`;

const SVG_BURST = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <circle cx="10" cy="10" r="8" fill="#34C759" opacity="0.8"/>
</svg>`;

const SVG_BURST_RED = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <circle cx="10" cy="10" r="8" fill="#FF3B30" opacity="0.8"/>
</svg>`;

const SVG_CONFETTI = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
  <circle cx="6" cy="6" r="5" fill="#FFD93D"/>
</svg>`;
