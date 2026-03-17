// Gravity Liar - Main Entry Point

// Global Game State
const GameState = {
  score: 0,
  stage: 1,
  lives: LIVES_MAX,
  streak: 0,
  gamesPlayed: 0,
  highScore: 0,
  bestStage: 0,
  pendingContinue: false,

  reset() {
    this.score = 0;
    this.stage = 1;
    this.lives = LIVES_MAX;
    this.streak = 0;
    this.pendingContinue = false;
    this.gamesPlayed++;
  },

  save() {
    try {
      localStorage.setItem('gravity-liar_high_score', this.highScore);
      localStorage.setItem('gravity-liar_best_stage', this.bestStage);
    } catch (e) {}
  },

  load() {
    try {
      this.highScore = parseInt(localStorage.getItem('gravity-liar_high_score')) || 0;
      this.bestStage = parseInt(localStorage.getItem('gravity-liar_best_stage')) || 0;
    } catch (e) {}
  }
};

// Boot Scene - register all textures once
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      ball: `data:image/svg+xml;base64,${btoa(SVG_BALL)}`,
      arrow: `data:image/svg+xml;base64,${btoa(SVG_ARROW)}`,
      arrow2: `data:image/svg+xml;base64,${btoa(SVG_ARROW2)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`,
      particleRed: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE_RED)}`,
      particleGold: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE_GOLD)}`
    };

    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.startGame();
        });
        this.textures.addBase64(key, src);
      }
    }

    if (pending === 0) this.startGame();
  }

  startGame() {
    GameState.load();
    this.scene.start('MenuScene');
  }
}

// Phaser Game Configuration
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0A0A0F',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, HelpScene, GameOverScene],
  input: {
    activePointers: 2
  }
};

// Prevent pull-to-refresh
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

const game = new Phaser.Game(config);
