// Slingshot Stack - Phaser Init, Boot Scene, SVG Textures

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Generate SVG textures
    const svgs = {
      particle: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="4" fill="#FFFFFF"/></svg>`
    };

    const textures = {};
    for (const [key, svg] of Object.entries(svgs)) {
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

// Phaser Config
const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.GAME_WIDTH,
    height: CONFIG.GAME_HEIGHT,
    min: { width: 280, height: 480 },
    max: { width: 428, height: 926 }
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: CONFIG.PHYSICS.GRAVITY_Y },
      enableSleeping: true,
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  backgroundColor: '#87CEEB',
  render: {
    antialias: true,
    pixelArt: false
  },
  input: {
    activePointers: 1
  }
};

// Handle visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const game = window.gameInstance;
    if (game && game.scene) {
      const gs = game.scene.getScene('GameScene');
      if (gs && gs.scene.isActive() && !gs.isPaused) {
        gs.togglePause();
      }
    }
  }
});

// Init
window.gameInstance = new Phaser.Game(phaserConfig);
