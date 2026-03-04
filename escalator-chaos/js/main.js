// Escalator Chaos - Main Entry Point & Boot Scene

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    // Build all commuter SVGs
    const types = ['normal', 'tourist', 'confused', 'sprint', 'vip'];
    for (const type of types) {
      const svg = buildSVG(type);
      textures['commuter_' + type] = 'data:image/svg+xml;base64,' + btoa(svg);
    }
    // Particle textures
    const particleColors = ['#57CC99', '#FF6B6B', '#FFD700', '#E94560', '#90E0EF', '#EAEAEA'];
    for (const color of particleColors) {
      const key = 'particle_' + color.replace('#', '');
      textures[key] = 'data:image/svg+xml;base64,' + btoa(buildParticleSVG(color));
    }
    // Arrow icons
    textures['arrow_up'] = 'data:image/svg+xml;base64,' + btoa(buildArrowSVG('up', '#57CC99'));
    textures['arrow_down'] = 'data:image/svg+xml;base64,' + btoa(buildArrowSVG('down', '#E94560'));

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once('addtexture-' + key, () => {
          if (--pending === 0) this.scene.start('TitleScene');
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this.scene.start('TitleScene');
  }
}

// Phaser Game Configuration
const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1A1A2E',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TitleScene, GameScene, HUDScene],
  input: {
    activePointers: 2
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(phaserConfig);

// Prevent default touch behavior
document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });
