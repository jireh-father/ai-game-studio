// BootScene - register all SVG textures as base64 once
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    const textures = {
      particle: 'data:image/svg+xml;base64,' + btoa(SVG.particle),
      spark: 'data:image/svg+xml;base64,' + btoa(SVG.spark)
    };
    let pending = 0;
    const keys = Object.keys(textures);
    for (const key of keys) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once('addtexture-' + key, () => {
          pending--;
          if (pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, textures[key]);
      }
    }
    if (pending === 0) this.scene.start('MenuScene');
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0a0e1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(phaserConfig);
});
