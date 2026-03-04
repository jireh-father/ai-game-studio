// Wrecking Swing - Main Entry Point

// SVG Textures
const SVG_TEXTURES = {
  particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#FF6D00"/></svg>`,
  chainParticle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#00E5FF"/></svg>`
};

// Sound Manager (Web Audio API)
class SoundManager {
  static ctx = null;

  static init() {
    if (SoundManager.ctx) return;
    try {
      SoundManager.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { /* silent */ }
  }

  static play(name, param) {
    if (!window.WS.settings.sound) return;
    SoundManager.init();
    if (!SoundManager.ctx) return;
    const ctx = SoundManager.ctx;
    const now = ctx.currentTime;

    switch (name) {
      case 'release': SoundManager.tone(180, 120, 0.15, 'square', -60); break;
      case 'blockHit': {
        const pitch = 1 + (param || 0) * 0.08;
        SoundManager.noise(0.2, 0.08 * pitch);
        SoundManager.tone(200 * pitch, 100, 0.12, 'square');
        break;
      }
      case 'armorHit': SoundManager.tone(120, 300, 0.15, 'sawtooth'); break;
      case 'stageClear': SoundManager.melody([293, 370, 440], 0.15, 200); break;
      case 'perfectClear': SoundManager.melody([440, 370, 293, 370, 523], 0.15, 160); break;
      case 'autoRelease': SoundManager.tone(200, 400, 0.1, 'sawtooth', -80); break;
      case 'uiTap': SoundManager.tone(600, 80, 0.06, 'sine'); break;
      case 'idleWarning': SoundManager.tone(300, 100, 0.08, 'square'); break;
    }
  }

  static tone(freq, dur, vol, type, bend) {
    const ctx = SoundManager.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (bend) osc.frequency.linearRampToValueAtTime(freq + bend, ctx.currentTime + dur / 1000);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur / 1000);
  }

  static noise(dur, vol) {
    const ctx = SoundManager.ctx;
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(gain).connect(ctx.destination);
    src.start();
  }

  static melody(freqs, vol, interval) {
    freqs.forEach((f, i) => {
      setTimeout(() => SoundManager.tone(f, 200, vol, 'sine'), i * interval);
    });
  }
}

// Boot Scene - register textures
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    const textures = {};
    for (const [key, svg] of Object.entries(SVG_TEXTURES)) {
      textures[key] = `data:image/svg+xml;base64,${btoa(svg)}`;
    }
    let pending = 0;
    const total = Object.keys(textures).length;
    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.scene.start('MenuScene');
  }
}

// Global state
window.WS = {
  score: 0,
  stage: 1,
  swingsLeft: CONFIG.SWING_COUNT,
  highScore: parseInt(localStorage.getItem('wrecking-swing_high_score') || '0'),
  settings: JSON.parse(localStorage.getItem('wrecking-swing_settings') || '{"sound":true,"music":true,"vibration":true}')
};

function saveSettings() {
  localStorage.setItem('wrecking-swing_settings', JSON.stringify(window.WS.settings));
}

// Unlock audio on first interaction
document.addEventListener('pointerdown', function unlock() {
  SoundManager.init();
  document.removeEventListener('pointerdown', unlock);
}, { once: true });

// Phaser game config
const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: CONFIG.HEX.BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: CONFIG.PHYSICS.GRAVITY },
      debug: false,
      positionIterations: 10,
      velocityIterations: 10
    }
  },
  scene: [BootScene, MenuScene, GameScene, StageEndScene, GameOverScene]
};

// Visibility change - pause
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.game) {
    window.game.scene.scenes.forEach(s => {
      if (s.scene.isActive() && s.matter && s.matter.world) {
        s.matter.world.pause();
      }
    });
  }
});

// Start
window.game = new Phaser.Game(gameConfig);
