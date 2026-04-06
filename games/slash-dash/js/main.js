// Slash Dash - Boot Scene & Phaser Config (MUST BE LAST)
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      redOrb: `data:image/svg+xml;base64,${btoa(SVG.redOrb)}`,
      blueOrb: `data:image/svg+xml;base64,${btoa(SVG.blueOrb)}`,
      poisonOrb: `data:image/svg+xml;base64,${btoa(SVG.poisonOrb)}`,
      fingerRing: `data:image/svg+xml;base64,${btoa(SVG.fingerRing)}`,
      spark: `data:image/svg+xml;base64,${btoa(SVG.spark)}`,
      sparkWhite: `data:image/svg+xml;base64,${btoa(SVG.sparkWhite)}`,
      strikeActive: `data:image/svg+xml;base64,${btoa(SVG.strikeActive)}`,
      strikeSpent: `data:image/svg+xml;base64,${btoa(SVG.strikeSpent)}`
    };

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

const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME.CANVAS_W,
  height: GAME.CANVAS_H,
  backgroundColor: COLORS.BG,
  parent: 'game-container',
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 2
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(phaserConfig);
