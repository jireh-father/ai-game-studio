// Conveyor Crunch - BootScene & Phaser Config (LOADED LAST)
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    // Generate all SVG textures once
    const textures = {};
    // Belt
    textures['belt'] = `data:image/svg+xml;base64,${btoa(SVGS.belt)}`;
    // Decoy
    textures['decoy'] = `data:image/svg+xml;base64,${btoa(SVGS.decoy)}`;
    // Particle
    textures['particle'] = `data:image/svg+xml;base64,${btoa(SVGS.particle)}`;
    // Generate item textures for all color/shape combos
    const allColors = [...BASE_COLORS, ...Object.values(SHADE_VARIANTS), COLORS.DECOY];
    const shapes = ['circle', 'square', 'triangle'];
    const svgFns = { circle: SVGS.itemCircle, square: SVGS.itemSquare, triangle: SVGS.itemTriangle };
    for (const color of allColors) {
      for (const shape of shapes) {
        const key = 'item_' + color.replace('#','') + '_' + shape;
        if (!textures[key]) {
          textures[key] = `data:image/svg+xml;base64,${btoa(svgFns[shape](color))}`;
        }
      }
    }
    // Load all textures
    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;
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

// Phaser game configuration
const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: CONFIG.BG_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 480 },
    max: { width: 480, height: 900 }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, PauseScene, HelpScene],
  input: {
    activePointers: 2
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

// Create game instance
const game = new Phaser.Game(gameConfig);

// Orientation change handler
window.addEventListener('resize', () => {
  if (game && game.scale) {
    game.scale.refresh();
  }
});
