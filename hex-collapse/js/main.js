// main.js — BootScene, Phaser config (LOADS LAST)

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const R = 28;
    const w = Math.round(R * HEX_MATH.SQRT3);
    const h = R * 2;
    const hexSvg = SVG_HEX(w, h, CONFIG.HEX_FILL, CONFIG.HEX_STROKE);
    const bombSvg = SVG_HEX_BOMB(w, h);

    const textures = {
      hex: `data:image/svg+xml;base64,${btoa(hexSvg)}`,
      hex_bomb: `data:image/svg+xml;base64,${btoa(bombSvg)}`,
      triangle: `data:image/svg+xml;base64,${btoa(SVG_TRIANGLE)}`
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

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: CONFIG.BG_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, HUDScene, HelpScene]
});
