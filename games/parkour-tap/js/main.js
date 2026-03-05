// main.js - BootScene (texture registration), Phaser config, scene list
// MUST load LAST in index.html

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      runner: `data:image/svg+xml;base64,${btoa(SVG_RUNNER)}`,
      wall: `data:image/svg+xml;base64,${btoa(SVG_WALL)}`,
      bar: `data:image/svg+xml;base64,${btoa(SVG_BAR)}`,
      gap: `data:image/svg+xml;base64,${btoa(SVG_GAP)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`,
      life: `data:image/svg+xml;base64,${btoa(SVG_LIFE)}`,
      lifeEmpty: `data:image/svg+xml;base64,${btoa(SVG_LIFE_EMPTY)}`
    };

    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) {
            this.scene.start('MenuScene');
          }
        });
        this.textures.addBase64(key, src);
      }
    }

    if (pending === 0) {
      this.scene.start('MenuScene');
    }
  }
}

// Phaser game configuration
const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#F1FAEE',
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: 360,
    height: 640,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene, HelpScene],
  input: {
    activePointers: 2
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(gameConfig);

// Orientation change handler
window.addEventListener('resize', () => {
  if (game && game.scale) {
    game.scale.resize(window.innerWidth, window.innerHeight);
  }
});
