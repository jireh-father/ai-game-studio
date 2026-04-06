const COLORS = {
  bgDeep: '#0D1B2A',
  bgMid: '#1B2838',
  hudBar: 0x0D1B2A,
  hudText: '#F8F9FA',
  livesOn: '#E63946',
  livesOff: '#3A3A3A',
  bomb: '#1A1A2E',
  bombFuse: '#FF6B35',
  comboGold: '#FFD166',
  comboRed: '#E63946',
  splatOverlay: '#E63946',
  perfect: '#FFD166',
  white: '#F8F9FA',
  btnPlay: '#E63946',
  btnSecondary: '#1B2838',
  btnResume: '#52B788',
  btnRestart: '#E9C46A',
  btnContinue: '#7209B7',
  btnMuted: '#3A3A3A'
};

const SCORE_VALUES = { base: 10, perfectStage: 50, bombAvoided: 5 };

const COMBO_MULTIPLIERS = [1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 5, 5, 5, 5, 5, 5];

const MAX_LIVES = 3;
const INACTIVITY_TIMEOUT = 25000;

const FOOD_TYPES = [
  { key: 'tomato', unlockStage: 1, splatColor: 0xC1121F,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="26" r="18" fill="#E63946"/><ellipse cx="18" cy="19" rx="5" ry="3" fill="#FF6B6B" opacity="0.6"/><rect x="22" y="7" width="4" height="8" fill="#52B788" rx="2"/><ellipse cx="20" cy="10" rx="5" ry="2" fill="#52B788" transform="rotate(-30 20 10)"/><ellipse cx="28" cy="10" rx="5" ry="2" fill="#52B788" transform="rotate(30 28 10)"/></svg>` },
  { key: 'burger', unlockStage: 1, splatColor: 0x8B4513,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="48" viewBox="0 0 56 48"><ellipse cx="28" cy="14" rx="22" ry="12" fill="#C68642"/><ellipse cx="28" cy="11" rx="18" ry="8" fill="#D4A76A"/><ellipse cx="22" cy="10" rx="2" ry="1" fill="#A0522D"/><ellipse cx="30" cy="8" rx="2" ry="1" fill="#A0522D"/><ellipse cx="36" cy="11" rx="2" ry="1" fill="#A0522D"/><ellipse cx="28" cy="22" rx="24" ry="5" fill="#52B788"/><ellipse cx="28" cy="28" rx="22" ry="6" fill="#5C3317"/><ellipse cx="28" cy="36" rx="22" ry="10" fill="#C68642"/></svg>` },
  { key: 'watermelon', unlockStage: 4, splatColor: 0xD62828,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="44" viewBox="0 0 52 44"><path d="M4 40 Q26 0 48 40 Z" fill="#52B788"/><path d="M7 40 Q26 5 45 40 Z" fill="#DDEECC"/><path d="M10 40 Q26 10 42 40 Z" fill="#D62828"/><ellipse cx="22" cy="30" rx="2" ry="3" fill="#1A1A2E" transform="rotate(-10 22 30)"/><ellipse cx="30" cy="28" rx="2" ry="3" fill="#1A1A2E" transform="rotate(10 30 28)"/><ellipse cx="26" cy="24" rx="2" ry="3" fill="#1A1A2E"/></svg>` },
  { key: 'pizza', unlockStage: 10, splatColor: 0xE76F51,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="52" viewBox="0 0 48 52"><path d="M4 50 Q24 0 44 50 Z" fill="#E9C46A"/><path d="M8 50 Q24 6 40 50 Z" fill="#E76F51"/><path d="M11 50 Q24 12 37 50 Z" fill="#FFD166"/><circle cx="24" cy="32" r="5" fill="#C1121F"/><circle cx="18" cy="42" r="4" fill="#C1121F"/><circle cx="30" cy="42" r="4" fill="#C1121F"/></svg>` },
  { key: 'cake', unlockStage: 15, splatColor: 0xF72585,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="56" viewBox="0 0 52 56"><rect x="6" y="24" width="40" height="28" rx="4" fill="#F72585"/><ellipse cx="26" cy="24" rx="20" ry="6" fill="#FFFFFF"/><ellipse cx="14" cy="27" rx="3" ry="5" fill="#FFFFFF"/><ellipse cx="38" cy="26" rx="3" ry="5" fill="#FFFFFF"/><rect x="23" y="10" width="6" height="14" rx="3" fill="#7209B7"/><ellipse cx="26" cy="8" rx="3" ry="5" fill="#FFD166"/><ellipse cx="26" cy="6" rx="2" ry="3" fill="#FF6B35"/></svg>` },
  { key: 'sushi', unlockStage: 20, splatColor: 0x2EC4B6,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="36" viewBox="0 0 48 36"><ellipse cx="24" cy="22" rx="20" ry="12" fill="#2EC4B6"/><ellipse cx="24" cy="18" rx="18" ry="10" fill="#FFFFFF"/><ellipse cx="24" cy="14" rx="14" ry="7" fill="#E76F51"/><rect x="10" y="18" width="28" height="4" fill="#2EC4B6" rx="2"/></svg>` },
  { key: 'egg', unlockStage: 25, splatColor: 0xFFD166,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><ellipse cx="20" cy="28" rx="16" ry="18" fill="#EFEFEF"/><ellipse cx="20" cy="24" rx="10" ry="10" fill="#FFD166"/><ellipse cx="17" cy="21" rx="3" ry="2" fill="#FFE599" opacity="0.6"/></svg>` }
];

const BOMB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="52" viewBox="0 0 48 52"><circle cx="24" cy="30" r="18" fill="#1A1A2E"/><ellipse cx="17" cy="23" rx="5" ry="4" fill="#2D3561" opacity="0.7"/><rect x="22" y="12" width="4" height="6" fill="#8B4513"/><circle cx="24" cy="10" r="4" fill="#FF6B35"/><text x="24" y="35" text-anchor="middle" font-size="14" fill="#FFD166" font-weight="bold">!</text></svg>`;

function getDifficulty(stageNum) {
  var isRest = stageNum > 0 && stageNum % 10 === 0;
  var s = isRest ? stageNum - 1 : stageNum;
  return {
    itemCount: isRest ? Math.round(Math.min(5 + Math.floor(s * 0.8), 30) * 0.8)
                      : Math.min(5 + Math.floor(s * 0.8), 30),
    spawnInterval: Math.max(2000 - s * 35, 400) * (isRest ? 1.3 : 1),
    approachTime: Math.max(2500 - s * 30, 600) * (isRest ? 1.3 : 1),
    bombFreq: (isRest || stageNum < 7) ? 0 : Math.min(1 + Math.floor(stageNum / 8), 4),
    maxSimultaneous: Math.min(1 + Math.floor(stageNum / 10), 4),
    isRest: isRest
  };
}
