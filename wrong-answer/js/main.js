// main.js — Phaser init, BootScene, GameState, localStorage

const GameState = {
  score: 0,
  stage: 1,
  streak: 0,
  bestStreak: 0,
  highScore: 0,
  bestStage: 0,
  gameOverCount: 0,
  continueUsed: false,
  sessionSeed: 0,
  soundEnabled: true,
  musicEnabled: true,
  usedIndices: new Set(),

  reset() {
    this.score = 0;
    this.stage = 1;
    this.streak = 0;
    this.bestStreak = 0;
    this.continueUsed = false;
    this.sessionSeed = Math.floor(Math.random() * 10000) + Date.now() % 100000;
    this.usedIndices = new Set();
  }
};

const LocalStorage = {
  load() {
    try {
      GameState.highScore = parseInt(localStorage.getItem('wrong-answer_high_score')) || 0;
      GameState.bestStage = parseInt(localStorage.getItem('wrong-answer_best_stage')) || 0;
      const snd = localStorage.getItem('wrong-answer_sound');
      if (snd !== null) GameState.soundEnabled = snd === 'true';
    } catch (e) { /* localStorage unavailable */ }
  },
  save() {
    try {
      localStorage.setItem('wrong-answer_high_score', GameState.highScore);
      localStorage.setItem('wrong-answer_best_stage', GameState.bestStage);
      localStorage.setItem('wrong-answer_sound', GameState.soundEnabled);
    } catch (e) { /* localStorage unavailable */ }
  }
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      brain: `data:image/svg+xml;base64,${btoa(SVG.BRAIN)}`,
      streakBadge: `data:image/svg+xml;base64,${btoa(SVG.STREAK_BADGE)}`
    };

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.boot();
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.boot();
  }

  boot() {
    LocalStorage.load();
    ADS.init();
    this.scene.start('MenuScene');
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(phaserConfig);
