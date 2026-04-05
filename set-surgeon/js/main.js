// Set Surgeon - Main Entry (BootScene + Phaser Config)
// MUST load LAST — all scene classes must be defined before this file

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    Object.entries(SVG_STRINGS).forEach(([key, svg]) => {
      textures[key] = 'data:image/svg+xml;base64,' + btoa(svg);
    });

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
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: CONFIG.COLORS.BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 560 },
    max: { width: 428, height: 926 }
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene, PauseScene],
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

// Prevent scroll during drag
document.addEventListener('touchmove', (e) => {
  if (e.target.closest('#game-container')) e.preventDefault();
}, { passive: false });

const game = new Phaser.Game(phaserConfig);

// Handle resize
window.addEventListener('resize', () => {
  if (game && game.scale) game.scale.refresh();
});
