// main.js - BootScene, Phaser config - LOADS LAST

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Register all SVG textures once
    const svgs = CONFIG.SVG;
    const entries = Object.entries(svgs);
    let pending = 0;
    const total = entries.length;

    const onAllLoaded = () => {
      this.scene.start('MenuScene');
    };

    for (const [key, svgStr] of entries) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) onAllLoaded();
        });
        this.textures.addBase64(key, `data:image/svg+xml;base64,${btoa(svgStr)}`);
      }
    }

    if (pending === 0) onAllLoaded();
  }
}

// Phaser game config
const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.GAME.width,
  height: CONFIG.GAME.height,
  backgroundColor: CONFIG.COLORS.BG,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, HelpScene]
};

// Create game instance
const game = new Phaser.Game(gameConfig);

// Handle resize + orientation recovery
window.addEventListener('resize', () => {
  if (game && game.scale) {
    game.scale.refresh();
  }
});

// Safety net: refresh Phaser scale manager when returning to portrait
window.matchMedia('(orientation: portrait)').addEventListener('change', (e) => {
  if (e.matches && game && game.scale) {
    setTimeout(() => game.scale.refresh(), 100);
  }
});
