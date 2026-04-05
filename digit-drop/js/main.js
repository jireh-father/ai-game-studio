class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      digit_tile: `data:image/svg+xml;base64,${btoa(SVG.DIGIT_TILE)}`,
      digit_tile_poison: `data:image/svg+xml;base64,${btoa(SVG.DIGIT_TILE_POISON)}`,
      empty_slot: `data:image/svg+xml;base64,${btoa(SVG.EMPTY_SLOT)}`,
      crystal: `data:image/svg+xml;base64,${btoa(SVG.CRYSTAL)}`,
      crystal_broken: `data:image/svg+xml;base64,${btoa(SVG.CRYSTAL_BROKEN)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE)}`,
      particle_gold: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE_GOLD)}`,
      particle_red: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE_RED)}`,
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
  width: 360,
  height: 640,
  parent: 'game-container',
  backgroundColor: '#0D1B2A',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, HelpScene, GameOverScene],
};

loadHighScore();
const game = new Phaser.Game(phaserConfig);

document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
