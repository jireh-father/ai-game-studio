// Torque Tower - Main Entry Point (MUST BE LOADED LAST)

// Global game state
window.GameState = {
  highScore: parseInt(localStorage.getItem('torque-tower-high') || '0', 10),
  gamesPlayed: 0,
  soundEnabled: localStorage.getItem('torque-tower-sound') !== 'false'
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Register all SVG textures once
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

// Phaser configuration
const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.bgNum,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 1.2 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  input: {
    activePointers: 2
  }
};

const game = new Phaser.Game(phaserConfig);

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());
