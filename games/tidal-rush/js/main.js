// Sound Manager - Web Audio API synthesis
const SoundManager = {
  ctx: null,
  initialized: false,

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {}
  },

  _isMuted() { return !getSettings().sound; },

  _osc(freq, dur, type, vol) {
    if (!this.ctx || this._isMuted()) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    g.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },

  _sweep(f1, f2, dur, type, vol) {
    if (!this.ctx || this._isMuted()) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },

  _noise(dur, vol) {
    if (!this.ctx || this._isMuted()) return;
    const bufSize = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(vol || 0.1, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(g).connect(this.ctx.destination);
    src.start();
  },

  playJump(isHold) {
    if (isHold) {
      this._sweep(280, 620, 0.18, 'sine', 0.12);
    } else {
      this._sweep(440, 880, 0.12, 'sine', 0.12);
    }
  },

  playLand() {
    this._noise(0.06, 0.08);
    this._osc(120, 0.08, 'sine', 0.1);
  },

  playSink() { this._sweep(200, 120, 0.4, 'sine', 0.06); },
  playNearMiss() { this._osc(1200, 0.06, 'sine', 0.15); },

  playCombo(count) {
    const pitch = 440 + Math.min(count, 5) * 100;
    this._osc(pitch, 0.1, 'sine', 0.12);
  },

  playStageClear() {
    this._osc(523.25, 0.5, 'sine', 0.1); // C5
    setTimeout(() => this._osc(659.25, 0.4, 'sine', 0.1), 100); // E5
    setTimeout(() => this._osc(783.99, 0.5, 'sine', 0.1), 200); // G5
  },

  playDeath() {
    this._noise(0.08, 0.2);
    this._sweep(600, 80, 0.5, 'sine', 0.2);
  },

  playBossSurge() { this._osc(60, 0.8, 'sine', 0.15); },
  playUITap() { this._osc(1000, 0.03, 'sine', 0.08); },

  ambientNode: null,
  startAmbient() {
    if (!this.ctx || this._isMuted() || this.ambientNode) return;
    const bufSize = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.05;
      b6 = w * 0.115926;
    }
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    src.loop = true;
    g.gain.setValueAtTime(0.04, this.ctx.currentTime);
    src.connect(g).connect(this.ctx.destination);
    src.start();
    this.ambientNode = { src, gain: g };
  },

  stopAmbient() {
    if (this.ambientNode) {
      try { this.ambientNode.src.stop(); } catch {}
      this.ambientNode = null;
    }
  }
};

// SVG definitions
const SVG_PLAYER = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32">
  <ellipse cx="12" cy="20" rx="5" ry="8" fill="#FFFFFF"/>
  <circle cx="12" cy="9" r="5" fill="#FFFFFF"/>
  <line x1="7" y1="18" x2="1" y2="13" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="17" y1="18" x2="21" y2="22" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="9" y1="26" x2="5" y2="32" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
  <line x1="15" y1="26" x2="19" y2="32" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
</svg>`;

function makePlatformSVG(w, type) {
  if (type === 'moving') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="18">
      <rect x="0" y="0" width="${w}" height="18" rx="4" ry="4" fill="#2EC4B6"/>
      <polygon points="4,9 10,5 10,13" fill="#1A8A84" opacity="0.7"/>
      <polygon points="${w-4},9 ${w-10},5 ${w-10},13" fill="#1A8A84" opacity="0.7"/>
    </svg>`;
  }
  if (type === 'crumble') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="18">
      <rect x="0" y="0" width="${w}" height="18" rx="4" ry="4" fill="#E9C46A"/>
      <line x1="${w*0.3}" y1="0" x2="${w*0.25}" y2="18" stroke="#C07A1A" stroke-width="1.5" opacity="0.8"/>
      <line x1="${w*0.65}" y1="0" x2="${w*0.7}" y2="18" stroke="#C07A1A" stroke-width="1.5" opacity="0.8"/>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="18">
    <rect x="0" y="0" width="${w}" height="18" rx="4" ry="4" fill="#F4A261"/>
    <rect x="3" y="2" width="${Math.max(w-6,1)}" height="3" rx="2" fill="#FFBA80" opacity="0.6"/>
  </svg>`;
}

// Boot Scene - preload all textures
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Player texture
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(SVG_PLAYER)}`
    };

    // Platform textures at various widths
    const widths = [36, 45, 55, 65, 70, 80, 85, 100, 120, 140];
    const types = ['normal', 'moving', 'crumble'];
    for (const t of types) {
      for (const w of widths) {
        const key = `platform-${t}`;
        if (!textures[key]) {
          textures[key] = `data:image/svg+xml;base64,${btoa(makePlatformSVG(w, t))}`;
        }
      }
    }
    // Use a single representative SVG per type; actual sizing done via setDisplaySize
    // Already covered: platform-normal, platform-moving, platform-crumble

    let pending = 0;
    const total = Object.keys(textures).length;
    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.scene.start('TitleScene');
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.scene.start('TitleScene');
  }
}

// Phaser game config
const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: CONFIG.COLORS.SKY_TOP,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TitleScene, MenuScene, GameScene, GameOverScene],
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

// Initialize game
const game = new Phaser.Game(gameConfig);

// Initialize ads
AdManager.init();
