const COLORS = {
  bgDark: '#0A0A14',
  bgAccent: '#12103A',
  hammerHead: '#8C9BAF',
  hammerAccent: '#5B8FBF',
  rope: '#A89070',
  meteorNormal: '#E05C20',
  meteorCore: '#FFD060',
  meteorFire: '#CC2000',
  meteorIce: '#60CFFF',
  meteorGold: '#FFD700',
  basePlatform: '#5A5A6A',
  rubble: '#3A3A45',
  rubbleWarn: '#FF3030',
  hud: '#F0F0FF',
  comboText: '#FFEE44',
  uiBg: '#1A1A2E',
  uiButton: '#3A6FBF',
  danger: '#FF2020'
};

const HAMMER_ROPE_LENGTH = 280;
const PIVOT_Y = 40;
const BASE_Y = 720;
const RUBBLE_LAYER_HEIGHT = 12;
const MAX_RUBBLE_LAYERS = 30;
const INACTIVITY_TIMEOUT = 25000;

const SCORE_VALUES = { normal: 100, fire: 100, ice: 100, gold: 500, boss: 1000 };
const CLEAN_SWEEP_BONUS = (stage) => stage * 200;
const COMBO_BONUS = { 3: 50, 4: 100, 5: 150, 6: 200 };

const DIFFICULTY = [
  { meteorSpeed: 160, waveMin: 6, waveMax: 8, maxSimul: 1, spawnInterval: 2400 },
  { meteorSpeed: 220, waveMin: 8, waveMax: 11, maxSimul: 2, spawnInterval: 1600 },
  { meteorSpeed: 300, waveMin: 10, waveMax: 14, maxSimul: 3, spawnInterval: 1000 },
  { meteorSpeed: 400, waveMin: 12, waveMax: 17, maxSimul: 4, spawnInterval: 700 },
  { meteorSpeed: 480, waveMin: 14, waveMax: 18, maxSimul: 4, spawnInterval: 650 },
  { meteorSpeed: 520, waveMin: 15, waveMax: 19, maxSimul: 5, spawnInterval: 620 },
  { meteorSpeed: 560, waveMin: 15, waveMax: 20, maxSimul: 5, spawnInterval: 600 }
];

const SVG_STRINGS = {
  hammer: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><ellipse cx="40" cy="40" rx="36" ry="28" fill="#8C9BAF"/><ellipse cx="40" cy="26" rx="30" ry="10" fill="#B0C4D8" opacity="0.6"/><ellipse cx="40" cy="52" rx="30" ry="8" fill="#4A5A6A" opacity="0.7"/><ellipse cx="40" cy="40" rx="36" ry="28" fill="none" stroke="#5B8FBF" stroke-width="3"/><rect x="36" y="8" width="8" height="12" rx="2" fill="#A89070"/></svg>`,
  meteor_normal: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#E05C20" opacity="0.8"/><circle cx="24" cy="24" r="18" fill="#C04010"/><circle cx="24" cy="24" r="10" fill="#FFD060" opacity="0.9"/><line x1="14" y1="18" x2="22" y2="28" stroke="#80200A" stroke-width="2"/><line x1="28" y1="16" x2="20" y2="32" stroke="#80200A" stroke-width="1.5"/></svg>`,
  meteor_fire: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#FF4400" opacity="0.7"/><circle cx="24" cy="24" r="18" fill="#CC2000"/><circle cx="24" cy="24" r="9" fill="#FF8800" opacity="0.9"/><ellipse cx="16" cy="12" rx="4" ry="8" fill="#FF6600" opacity="0.7" transform="rotate(-20,16,12)"/><ellipse cx="32" cy="10" rx="3" ry="7" fill="#FF6600" opacity="0.6" transform="rotate(15,32,10)"/><circle cx="24" cy="24" r="20" fill="none" stroke="#FF8800" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
  meteor_ice: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#60CFFF" opacity="0.5"/><circle cx="24" cy="24" r="18" fill="#2090C0"/><circle cx="24" cy="24" r="10" fill="#A0E8FF" opacity="0.8"/><line x1="24" y1="10" x2="24" y2="38" stroke="#E0F8FF" stroke-width="2"/><line x1="10" y1="24" x2="38" y2="24" stroke="#E0F8FF" stroke-width="2"/><line x1="14" y1="14" x2="34" y2="34" stroke="#E0F8FF" stroke-width="1.5"/><line x1="34" y1="14" x2="14" y2="34" stroke="#E0F8FF" stroke-width="1.5"/></svg>`,
  meteor_gold: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#FFD700" opacity="0.6"/><circle cx="24" cy="24" r="18" fill="#E6B800"/><circle cx="24" cy="24" r="10" fill="#FFFAAA" opacity="0.95"/><polygon points="24,8 26,20 38,20 28,27 32,40 24,32 16,40 20,27 10,20 22,20" fill="#FFD700" opacity="0.7"/></svg>`,
  meteor_boss: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="#880020" opacity="0.6"/><circle cx="40" cy="40" r="32" fill="#600010"/><circle cx="40" cy="40" r="28" fill="none" stroke="#AA2020" stroke-width="4"/><circle cx="40" cy="40" r="20" fill="none" stroke="#AA2020" stroke-width="3"/><circle cx="40" cy="40" r="14" fill="#FF4040" opacity="0.8"/><circle cx="40" cy="40" r="36" fill="none" stroke="#FF6060" stroke-width="2" opacity="0.5"/></svg>`,
  base: `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="40" viewBox="0 0 360 40"><rect x="0" y="0" width="360" height="40" rx="4" fill="#5A5A6A"/><rect x="0" y="0" width="360" height="8" rx="4" fill="#7A7A8A"/><rect x="0" y="32" width="360" height="8" rx="0" fill="#3A3A4A"/><circle cx="20" cy="20" r="5" fill="#3A3A4A"/><circle cx="340" cy="20" r="5" fill="#3A3A4A"/><circle cx="180" cy="20" r="5" fill="#3A3A4A"/></svg>`,
  rubble: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="20" viewBox="0 0 32 20"><polygon points="2,18 8,4 18,2 28,6 30,16 20,20 8,20" fill="#3A3A45"/><polygon points="2,18 8,4 18,2" fill="#4A4A55" opacity="0.5"/></svg>`,
  pivot: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#8C9BAF"/><circle cx="12" cy="12" r="6" fill="#5B8FBF"/><circle cx="12" cy="12" r="3" fill="#F0F0FF"/></svg>`,
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>`
};

const GameState = {
  score: 0,
  stage: 1,
  rubbleLayers: 0,
  comboChain: 0,
  highScore: parseInt(localStorage.getItem('meteor-slammer_high_score') || '0'),
  gamesPlayed: parseInt(localStorage.getItem('meteor-slammer_games') || '0'),
  sfxOn: true,
  musicOn: true,
  continueUsed: false,
  reset() {
    this.score = 0;
    this.stage = 1;
    this.rubbleLayers = 0;
    this.comboChain = 0;
    this.continueUsed = false;
  },
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('meteor-slammer_high_score', String(this.highScore));
      return true;
    }
    return false;
  }
};
