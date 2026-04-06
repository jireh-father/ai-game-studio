// main.js — BootScene, Phaser config (MUST be loaded LAST)

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      bull: `data:image/svg+xml;base64,${btoa(BULL_SVG)}`,
      cowboy: `data:image/svg+xml;base64,${btoa(COWBOY_SVG)}`,
      particle: `data:image/svg+xml;base64,${btoa(PARTICLE_SVG)}`,
      dust: `data:image/svg+xml;base64,${btoa(DUST_SVG)}`,
      star: `data:image/svg+xml;base64,${btoa(STAR_SVG)}`
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

const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#E8D5A3',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  input: {
    activePointers: 1
  }
};

const game = new Phaser.Game(phaserConfig);

// Prevent default touch behaviors on game canvas
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }
});
