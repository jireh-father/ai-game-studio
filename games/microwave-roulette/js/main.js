// Microwave Roulette - Main Entry Point
const GameState = {
  highScore: 0,
  gamesPlayed: 0,
  highestStage: 0,
  cookbook: [],
  settings: { sound: true, music: true, vibration: true },
  totalScore: 0,

  load() {
    try {
      const p = CONFIG.STORAGE_PREFIX;
      this.highScore = parseInt(localStorage.getItem(p + 'high_score')) || 0;
      this.gamesPlayed = parseInt(localStorage.getItem(p + 'games_played')) || 0;
      this.highestStage = parseInt(localStorage.getItem(p + 'highest_stage')) || 0;
      this.totalScore = parseInt(localStorage.getItem(p + 'total_score')) || 0;
      const cb = localStorage.getItem(p + 'cookbook');
      this.cookbook = cb ? JSON.parse(cb) : [];
      const st = localStorage.getItem(p + 'settings');
      if (st) this.settings = JSON.parse(st);
    } catch (e) {
      // localStorage unavailable, use defaults
    }
  },

  save() {
    try {
      const p = CONFIG.STORAGE_PREFIX;
      localStorage.setItem(p + 'high_score', this.highScore);
      localStorage.setItem(p + 'games_played', this.gamesPlayed);
      localStorage.setItem(p + 'highest_stage', this.highestStage);
      localStorage.setItem(p + 'total_score', this.totalScore);
      localStorage.setItem(p + 'cookbook', JSON.stringify(this.cookbook));
      localStorage.setItem(p + 'settings', JSON.stringify(this.settings));
    } catch (e) {
      // localStorage unavailable
    }
  },
};

// Load saved state
GameState.load();
AdManager.init();

// Boot scene to initialize textures
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    this.scene.start('MenuScene');
  }
}

// Phaser game configuration
const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: CONFIG.COLORS.CREAM,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    min: { width: 320, height: 480 },
    max: { width: 428, height: 926 },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  input: {
    activePointers: 3,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};

const game = new Phaser.Game(gameConfig);
