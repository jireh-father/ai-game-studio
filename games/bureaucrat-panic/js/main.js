// main.js — BootScene (texture registration), Phaser.Game init — LOADS LAST

// Global game state
window.GameState = {
  highScore: 0,
  gamesPlayed: 0,
  sessionDeaths: 0,
  continuedThisSession: false,
  soundOn: true
};

// Load from localStorage
try {
  const stored = localStorage.getItem('bureaucrat-panic_high_score');
  if (stored) window.GameState.highScore = parseInt(stored, 10) || 0;
} catch (e) {}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    for (const [key, svgStr] of Object.entries(SVG_STRINGS)) {
      textures[key] = 'data:image/svg+xml;base64,' + btoa(svgStr);
    }

    const keys = Object.keys(textures);
    let pending = 0;
    const total = keys.length;

    if (total === 0) {
      this.scene.start('MenuScene');
      return;
    }

    for (const key of keys) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once('addtexture-' + key, () => {
          pending--;
          if (pending <= 0) {
            this.scene.start('MenuScene');
          }
        });
        this.textures.addBase64(key, textures[key]);
      }
    }

    if (pending === 0) {
      this.scene.start('MenuScene');
    }
  }
}

// Phaser configuration
const gameConfig = {
  type: Phaser.AUTO,
  width: DIMS.width,
  height: DIMS.height,
  parent: 'game-container',
  backgroundColor: COLORS.officeCream,
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

// Create game
const game = new Phaser.Game(gameConfig);
