// main.js — BootScene (texture registration) and Phaser.Game init — MUST LOAD LAST
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    const textures = {
      bubble: `data:image/svg+xml;base64,${btoa(CONFIG.SVG.BUBBLE)}`,
      bomb: `data:image/svg+xml;base64,${btoa(CONFIG.SVG.BOMB)}`,
      rainbow: `data:image/svg+xml;base64,${btoa(CONFIG.SVG.RAINBOW)}`,
      particle: `data:image/svg+xml;base64,${btoa(CONFIG.SVG.PARTICLE)}`
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
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  backgroundColor: '#1A1A2E',
  parent: 'game-container',
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 2.5 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
};

const game = new Phaser.Game(phaserConfig);

// Prevent scroll on mobile
document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
