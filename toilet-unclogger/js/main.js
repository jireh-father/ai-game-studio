// Toilet Unclogger - Main Entry Point & Boot Scene
const GameState = {
  highScore: 0,
  gamesPlayed: 0,
  highestStage: 0,
  totalScore: 0,
  settings: { sound: true, music: true, vibration: true },
  audioCtx: null,

  load() {
    try {
      this.highScore = parseInt(localStorage.getItem('toilet_unclogger_high_score')) || 0;
      this.gamesPlayed = parseInt(localStorage.getItem('toilet_unclogger_games_played')) || 0;
      this.highestStage = parseInt(localStorage.getItem('toilet_unclogger_highest_stage')) || 0;
      this.totalScore = parseInt(localStorage.getItem('toilet_unclogger_total_score')) || 0;
      const s = localStorage.getItem('toilet_unclogger_settings');
      if (s) this.settings = JSON.parse(s);
    } catch (e) { /* localStorage unavailable */ }
  },

  save() {
    try {
      localStorage.setItem('toilet_unclogger_high_score', this.highScore);
      localStorage.setItem('toilet_unclogger_games_played', this.gamesPlayed);
      localStorage.setItem('toilet_unclogger_highest_stage', this.highestStage);
      localStorage.setItem('toilet_unclogger_total_score', this.totalScore);
      localStorage.setItem('toilet_unclogger_settings', JSON.stringify(this.settings));
    } catch (e) { /* localStorage unavailable */ }
  },

  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { console.warn('Web Audio not available'); }
  }
};

// Sound synthesis via Web Audio API
const SFX = {
  play(type) {
    if (!GameState.settings.sound || !GameState.audioCtx) return;
    const ctx = GameState.audioCtx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (type === 'perfect') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      osc.connect(gain); gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      // noise burst
      this._noiseBurst(ctx, gain, now, 0.08, 0.15);
    } else if (type === 'good') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 330;
      osc.connect(gain); gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now); osc.stop(now + 0.12);
    } else if (type === 'offbeat') {
      const osc = ctx.createOscillator();
      osc.type = 'square'; osc.frequency.value = 80;
      osc.connect(gain); gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'miss') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      osc.connect(gain); gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'clog_clear') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
      osc.connect(gain); gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      this._noiseBurst(ctx, gain, now + 0.1, 0.15, 0.2);
    } else if (type === 'overflow') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
      osc.connect(gain); gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
      this._noiseBurst(ctx, gain, now, 0.3, 0.5);
    } else if (type === 'stage_clear') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);
      osc.connect(gain); gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'combo') {
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator();
        const g2 = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 500 + i * 200;
        o.connect(g2); g2.connect(ctx.destination);
        g2.gain.setValueAtTime(0.15, now + i * 0.06);
        g2.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.1);
        o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.1);
      }
    } else if (type === 'tap') {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = 800;
      osc.connect(gain); gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    }
  },

  _noiseBurst(ctx, dest, start, vol, dur) {
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.01, start + dur);
    src.connect(g); g.connect(dest);
    src.start(start); src.stop(start + dur);
  },

  vibrate(ms) {
    if (GameState.settings.vibration && navigator.vibrate) navigator.vibrate(ms);
  }
};

// Boot scene - generate textures
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    // Generate particle texture
    const pg = this.make.graphics({ add: false });
    pg.fillStyle(0xFFFFFF); pg.fillCircle(4, 4, 4);
    pg.generateTexture('particle', 8, 8); pg.destroy();
    // Generate plunger texture
    const plg = this.make.graphics({ add: false });
    plg.fillStyle(CONFIG.COLORS.WOOD_BROWN);
    plg.fillRect(14, 0, 12, 60);
    plg.fillStyle(CONFIG.COLORS.PLUNGER_RED);
    plg.fillCircle(20, 70, 20);
    plg.fillRect(0, 55, 40, 16);
    plg.generateTexture('plunger', 40, 90); plg.destroy();

    GameState.load();
    this.scene.start('TitleScene');
  }
}

// Phaser config
const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: CONFIG.COLORS.TILE_BG,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, MenuScene, GameScene, GameOverScene],
  input: { activePointers: 1 },
  render: { antialias: true, pixelArt: false },
};

window.addEventListener('load', () => {
  new Phaser.Game(phaserConfig);
});

// Pause on tab switch
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const game = Phaser.GAMES && Phaser.GAMES[0];
    if (game) {
      const gs = game.scene.getScene('GameScene');
      if (gs && gs.scene.isActive()) gs.pauseGame && gs.pauseGame();
    }
  }
});
