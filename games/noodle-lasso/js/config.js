// config.js — Game constants, palette, difficulty, audio params

const PALETTE = {
  primary: '#E63946',
  secondary: '#FFB703',
  background: '#FFF8F0',
  floor: '#457B9D',
  reward: '#2DC653',
  textDark: '#1D1D1B',
  uiBg: '#FDDBB4',
  noodle: '#F4A261',
  dangerFlash: '#E63946'
};

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const LASSO_CONFIG = {
  baseRadius: 24,
  comboRadius: 44,
  stretchSpeed: 800,
  snapDuration: 150,
  extendDuration: 300,
  wobbleAmount: 15,
  strokeWidth: 4,
  comboStrokeWidth: 5
};

const CHEF_POS = { x: 180, y: 490 };
const BOWL_POS = { x: 180, y: 540 };
const FLOOR_Y = 560;
const SPAWN_Y = -30;
const HUD_TOP = 14;

const INGREDIENT_TYPES = [
  { id: 'tomato', color: '#E63946', points: 100, fallPattern: 'straight', unlockStage: 1 },
  { id: 'mushroom', color: '#C77DFF', points: 100, fallPattern: 'straight', unlockStage: 4 },
  { id: 'fish', color: '#457B9D', points: 100, fallPattern: 'zigzag', unlockStage: 8 },
  { id: 'pepper', color: '#FF6B35', points: 100, fallPattern: 'fast', unlockStage: 13 },
  { id: 'egg', color: '#FFF8F0', points: 100, fallPattern: 'straight', unlockStage: 21 },
  { id: 'goldstar', color: '#FFB703', points: 500, fallPattern: 'straight', unlockStage: 36 }
];

function getStageParams(stage) {
  const isRest = stage > 1 && stage % 10 === 0;
  const isGold = stage > 1 && stage % 15 === 0;
  let speed = Math.min(1.0 + (stage * 0.06), 3.0);
  let simCount = Math.min(1 + Math.floor(stage / 4), 6);
  let interval = Math.max(2400 - (stage * 40), 600);
  let quota = Math.min(8 + stage, 18);
  if (isRest) {
    speed *= 0.8;
    quota = Math.max(quota - 3, 5);
  }
  const types = INGREDIENT_TYPES.filter(t => t.unlockStage <= stage);
  return { speed, simCount, interval, quota, types, isRest, isGold };
}

const SCORE_VALUES = {
  singleCatch: 100,
  multiCatch: 200,
  speedBonus: 50,
  comboMultipliers: [1, 1, 1.5, 2.0, 3.0],
  stageClearBonus: function(stage) { return stage * 500; }
};

const IDLE_WARNING_MS = 10000;
const IDLE_DEATH_MS = 12000;
const MAX_MISSES = 3;
const DEATH_EFFECT_MS = 500;

// SVG definitions
const SVG = {};

SVG.chef = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="70">
  <ellipse cx="30" cy="55" rx="22" ry="18" fill="#FFFFFF" stroke="#1D1D1B" stroke-width="2"/>
  <circle cx="30" cy="30" r="18" fill="#FDDBB4" stroke="#1D1D1B" stroke-width="2"/>
  <rect x="14" y="8" width="32" height="6" rx="2" fill="#E63946"/>
  <rect x="18" y="2" width="24" height="10" rx="4" fill="#FFFFFF" stroke="#1D1D1B" stroke-width="1.5"/>
  <circle cx="24" cy="28" r="3" fill="#1D1D1B"/>
  <circle cx="36" cy="28" r="3" fill="#1D1D1B"/>
  <path d="M24 36 Q30 41 36 36" stroke="#1D1D1B" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

SVG.tomato = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <circle cx="16" cy="18" r="13" fill="#E63946" stroke="#1D1D1B" stroke-width="2"/>
  <path d="M12 8 Q16 2 20 8" stroke="#2DC653" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <line x1="16" y1="5" x2="16" y2="9" stroke="#2DC653" stroke-width="2"/>
</svg>`;

SVG.mushroom = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <ellipse cx="16" cy="14" rx="13" ry="10" fill="#C77DFF" stroke="#1D1D1B" stroke-width="2"/>
  <rect x="12" y="14" width="8" height="12" rx="2" fill="#FFF8F0" stroke="#1D1D1B" stroke-width="2"/>
  <circle cx="11" cy="12" r="3" fill="#FFFFFF" opacity="0.5"/>
</svg>`;

SVG.fish = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <ellipse cx="16" cy="16" rx="14" ry="8" fill="#457B9D" stroke="#1D1D1B" stroke-width="2"/>
  <polygon points="30,16 28,10 28,22" fill="#457B9D" stroke="#1D1D1B" stroke-width="1.5"/>
  <circle cx="8" cy="14" r="2" fill="#FFF8F0"/>
</svg>`;

SVG.pepper = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <path d="M16 4 Q24 10 20 28 Q16 32 12 28 Q8 10 16 4Z" fill="#FF6B35" stroke="#1D1D1B" stroke-width="2"/>
  <line x1="16" y1="2" x2="16" y2="6" stroke="#2DC653" stroke-width="2"/>
</svg>`;

SVG.egg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <ellipse cx="16" cy="18" rx="11" ry="13" fill="#FFF8F0" stroke="#1D1D1B" stroke-width="2"/>
  <ellipse cx="16" cy="20" rx="6" ry="6" fill="#FFB703"/>
</svg>`;

SVG.goldstar = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <polygon points="16,2 19,11 29,11 21,17 24,26 16,20 8,26 11,17 3,11 13,11"
           fill="#FFB703" stroke="#E63946" stroke-width="2"/>
</svg>`;

SVG.heartFull = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
  <path d="M12 21 C12 21 2 14 2 8 C2 4.7 4.7 2 8 2 C9.7 2 11.3 2.8 12 4 C12.7 2.8 14.3 2 16 2 C19.3 2 22 4.7 22 8 C22 14 12 21 12 21Z"
        fill="#E63946" stroke="#1D1D1B" stroke-width="1.5"/>
</svg>`;

SVG.heartEmpty = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
  <path d="M12 21 C12 21 2 14 2 8 C2 4.7 4.7 2 8 2 C9.7 2 11.3 2.8 12 4 C12.7 2.8 14.3 2 16 2 C19.3 2 22 4.7 22 8 C22 14 12 21 12 21Z"
        fill="#555" stroke="#1D1D1B" stroke-width="1.5"/>
</svg>`;

SVG.particle = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
  <circle cx="4" cy="4" r="4" fill="#FFB703"/>
</svg>`;

SVG.particleWhite = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">
  <circle cx="4" cy="4" r="4" fill="#FFFFFF"/>
</svg>`;

// Audio synthesis helper
const AudioManager = {
  ctx: null,
  enabled: true,
  musicEnabled: true,

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  play(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.connect(this.ctx.destination);

    if (type === 'whoosh') {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(200, now);
      o.frequency.linearRampToValueAtTime(800, now + 0.15);
      g.gain.setValueAtTime(0.15, now);
      g.gain.linearRampToValueAtTime(0, now + 0.15);
      o.connect(g); o.start(now); o.stop(now + 0.15);
    } else if (type === 'catch') {
      // noise burst + sine pop
      const bufLen = this.ctx.sampleRate * 0.08;
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.2, now);
      ng.gain.linearRampToValueAtTime(0, now + 0.08);
      noise.connect(ng); ng.connect(this.ctx.destination);
      noise.start(now); noise.stop(now + 0.08);
      const o = this.ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = 600;
      g.gain.setValueAtTime(0.2, now + 0.05);
      g.gain.linearRampToValueAtTime(0, now + 0.2);
      o.connect(g); o.start(now + 0.05); o.stop(now + 0.2);
    } else if (type === 'miss') {
      const o = this.ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = 120;
      g.gain.setValueAtTime(0.25, now);
      g.gain.linearRampToValueAtTime(0, now + 0.2);
      o.connect(g); o.start(now); o.stop(now + 0.2);
    } else if (type === 'combo') {
      const o = this.ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.12, now);
      g.gain.linearRampToValueAtTime(0, now + 0.1);
      o.connect(g); o.start(now); o.stop(now + 0.1);
    } else if (type === 'stageClear') {
      [523, 659, 784].forEach((freq, i) => {
        const o = this.ctx.createOscillator();
        const sg = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        sg.gain.setValueAtTime(0.15, now + i * 0.15);
        sg.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.2);
        o.connect(sg); sg.connect(this.ctx.destination);
        o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.2);
      });
    } else if (type === 'gameOver') {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(400, now);
      o.frequency.linearRampToValueAtTime(200, now + 0.8);
      const lfo = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      lfo.frequency.value = 6; lfoG.gain.value = 30;
      lfo.connect(lfoG); lfoG.connect(o.frequency);
      lfo.start(now); lfo.stop(now + 0.8);
      g.gain.setValueAtTime(0.2, now);
      g.gain.linearRampToValueAtTime(0, now + 0.8);
      o.connect(g); o.start(now); o.stop(now + 0.8);
    } else if (type === 'click') {
      const o = this.ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = 800;
      g.gain.setValueAtTime(0.1, now);
      g.gain.linearRampToValueAtTime(0, now + 0.06);
      o.connect(g); o.start(now); o.stop(now + 0.06);
    } else if (type === 'goldCatch') {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(1200, now);
      o.frequency.linearRampToValueAtTime(2400, now + 0.3);
      g.gain.setValueAtTime(0.12, now);
      g.gain.linearRampToValueAtTime(0, now + 0.3);
      o.connect(g); o.start(now); o.stop(now + 0.3);
    } else if (type === 'warning') {
      for (let i = 0; i < 4; i++) {
        const o = this.ctx.createOscillator();
        const wg = this.ctx.createGain();
        o.type = 'square'; o.frequency.value = 800;
        wg.gain.setValueAtTime(0.08, now + i * 0.5);
        wg.gain.linearRampToValueAtTime(0, now + i * 0.5 + 0.1);
        o.connect(wg); wg.connect(this.ctx.destination);
        o.start(now + i * 0.5); o.stop(now + i * 0.5 + 0.1);
      }
    }
  }
};
