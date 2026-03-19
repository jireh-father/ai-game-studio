// main.js — BootScene, GameState, Phaser config (LOADS LAST)

// Global game state
window.GameState = {
  currentStage: 1,
  score: 0,
  highScore: parseInt(localStorage.getItem('shrinking-stage_high_score') || '0', 10),
  highestStage: parseInt(localStorage.getItem('shrinking-stage_highest_stage') || '0', 10),
  gamesPlayed: 0,
  continueUsed: false,
  soundEnabled: true,
  musicEnabled: true
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Loading text
    const loadText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Loading...', {
      fontSize: '20px', fontFamily: 'Georgia, serif', fill: COLORS.HUD_TEXT
    }).setOrigin(0.5);

    const textures = {
      'performer': `data:image/svg+xml;base64,${btoa(SVG_PERFORMER)}`,
      'tile-normal': `data:image/svg+xml;base64,${btoa(SVG_TILE_NORMAL)}`,
      'tile-warning': `data:image/svg+xml;base64,${btoa(SVG_TILE_WARNING)}`,
      'star': `data:image/svg+xml;base64,${btoa(SVG_STAR)}`,
      'particle': `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`
    };

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) {
            loadText.destroy();
            this.scene.start('MenuScene');
          }
        });
        this.textures.addBase64(key, src);
      }
    }

    if (pending === 0) {
      loadText.destroy();
      this.scene.start('MenuScene');
    }
  }
}

// Phaser game configuration
const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 1
  },
  scene: [BootScene, MenuScene, HowToPlayScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(phaserConfig);
