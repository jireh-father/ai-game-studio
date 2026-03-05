// Shrink Panic - Main Entry Point (BootScene + Phaser Config)
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Register all SVG textures once
    const textures = {
      target_normal: `data:image/svg+xml;base64,${btoa(SVG.NORMAL_TARGET)}`,
      target_small: `data:image/svg+xml;base64,${btoa(SVG.SMALL_TARGET)}`,
      target_decoy: `data:image/svg+xml;base64,${btoa(SVG.DECOY_TARGET)}`,
      target_fleeting: `data:image/svg+xml;base64,${btoa(SVG.FLEETING_TARGET)}`,
      energy_icon: `data:image/svg+xml;base64,${btoa(SVG.ENERGY_ICON)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE)}`
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

// Initialize sound setting
SFX.enabled = localStorage.getItem(STORAGE_KEYS.SOUND) !== 'false';
SFX.init();

// Phaser Game Config
const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 720
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene, PauseScene],
  input: {
    activePointers: 2
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(phaserConfig);

// Handle resize
window.addEventListener('resize', () => {
  game.scale.refresh();
});
