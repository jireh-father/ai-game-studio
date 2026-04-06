// Melt Stack - Boot Scene & Phaser Init
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    for (const [key, svg] of Object.entries(SVG_STRINGS)) {
      const texKey = key === 'meltGlow' ? 'melt-glow' : key;
      textures[texKey] = 'data:image/svg+xml;base64,' + btoa(svg);
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
  parent: 'game-container',
  backgroundColor: '#1A1A2E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  render: {
    pixelArt: false,
    antialias: true
  },
  input: {
    activePointers: 1
  }
};

const game = new Phaser.Game(phaserConfig);
