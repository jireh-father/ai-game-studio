// Shockwave Hop - Boot Scene & Phaser Init (MUST LOAD LAST)

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

// Phaser Game Configuration
const phaserConfig = {
  type: Phaser.CANVAS,
  width: GAME.width,
  height: GAME.height,
  parent: 'game-container',
  backgroundColor: '#0A0E27',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene, PauseScene],
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(phaserConfig);

// Handle resize
window.addEventListener('resize', () => {
  game.scale.resize(GAME.width, GAME.height);
});
