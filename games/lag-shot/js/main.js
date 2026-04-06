// Lag Shot - Main Entry / BootScene / Phaser Config

// Global game state
window.gameState = {
  highScore: parseInt(localStorage.getItem('lag-shot_high_score')) || 0,
  gamesPlayed: 0,
  sessionGameOvers: 0
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    for (const [key, svg] of Object.entries(SVG_STRINGS)) {
      textures[key] = 'data:image/svg+xml;base64,' + btoa(svg);
    }

    let pending = 0;
    const total = Object.keys(textures).length;
    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once('addtexture-' + key, () => {
          if (--pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.scene.start('MenuScene');
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
};

const game = new Phaser.Game(phaserConfig);

// Prevent context menu on long press
document.addEventListener('contextmenu', e => e.preventDefault());
// Prevent scroll
document.body.style.overflow = 'hidden';
// Orientation change handler
window.addEventListener('resize', () => game.scale.refresh());
