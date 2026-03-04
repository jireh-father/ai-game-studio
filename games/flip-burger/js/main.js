// main.js — Phaser config, BootScene, game init

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      pattyRaw: `data:image/svg+xml;base64,${btoa(SVG.pattyRaw)}`,
      pattyCooked: `data:image/svg+xml;base64,${btoa(SVG.pattyCooked)}`,
      pattyBurnt: `data:image/svg+xml;base64,${btoa(SVG.pattyBurnt)}`,
      burgerLife: `data:image/svg+xml;base64,${btoa(SVG.burgerLife)}`,
      burgerLifeEmpty: `data:image/svg+xml;base64,${btoa(SVG.burgerLifeEmpty)}`,
      customerHappy: `data:image/svg+xml;base64,${btoa(SVG.customerHappy)}`,
      customerWait: `data:image/svg+xml;base64,${btoa(SVG.customerWait)}`,
      customerAngry: `data:image/svg+xml;base64,${btoa(SVG.customerAngry)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG.particle)}`,
      steamParticle: `data:image/svg+xml;base64,${btoa(SVG.steamParticle)}`,
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
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: '#FDF6E3',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, UIScene],
  input: {
    activePointers: 4,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
};

const game = new Phaser.Game(phaserConfig);
