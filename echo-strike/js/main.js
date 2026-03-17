// Echo Strike - Main Entry (BootScene + Phaser Config)
// MUST load LAST

// Global game state
window.GameState = {
  score: 0,
  highScore: parseInt(localStorage.getItem('echo-strike_high_score') || '0'),
  stage: 1,
  combo: 0,
  gamesPlayed: 0
};

AdsManager.init();

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    for (const [key, svg] of Object.entries(SVG_STRINGS)) {
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

const phaserConfig = {
  type: Phaser.AUTO,
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
  input: {
    activePointers: 2
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(phaserConfig);
