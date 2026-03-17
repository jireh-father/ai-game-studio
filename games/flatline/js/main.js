// Flatline - Main Entry Point (MUST load last)

// Global Game State
const GameState = {
  score: 0,
  stage: 1,
  strikes: 0,
  streak: 0,
  highScore: parseInt(localStorage.getItem('flatline_high_score')) || 0,
  gamesPlayed: parseInt(localStorage.getItem('flatline_games_played')) || 0,
  audioCtx: null,
  settings: {
    sound: true,
    music: true,
    vibration: true
  },
  reset() {
    this.score = 0;
    this.stage = 1;
    this.strikes = 0;
    this.streak = 0;
    this.gamesPlayed++;
    localStorage.setItem('flatline_games_played', this.gamesPlayed);
  }
};

// Boot Scene - register all textures
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      heartFull: `data:image/svg+xml;base64,${btoa(SVG_HEART_FULL)}`,
      heartEmpty: `data:image/svg+xml;base64,${btoa(SVG_HEART_EMPTY)}`,
      pauseIcon: `data:image/svg+xml;base64,${btoa(SVG_PAUSE)}`
    };

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

// Phaser Game Configuration
const gameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.backgroundHex,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene, HUDScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  input: {
    activePointers: 1
  }
};

// Initialize
const game = new Phaser.Game(gameConfig);

// Prevent touch scrolling
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Resize handler
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

// Initialize Ad Manager
AdManager.init();
