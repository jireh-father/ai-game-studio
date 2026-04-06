// Pressure Cooker - Boot Scene & Phaser Config
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      chamber: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.chamber),
      hotOverlay: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.hotOverlay),
      lockedOverlay: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.lockedOverlay),
      multiplierOverlay: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.multiplierOverlay),
      particle: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.particle),
      particleWhite: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.particleWhite),
      particleRed: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.particleRed),
      steam: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.steam)
    };

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
  width: 390,
  height: 844,
  parent: 'game-container',
  backgroundColor: COLORS.background,
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

// Prevent scroll/zoom on mobile
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
