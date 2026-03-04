// main.js — Phaser config, boot scene, game init

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    // Generate particle texture
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
    this.scene.start('TitleScene');
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: '#0A0A0F',
  parent: 'game-container',
  scene: [BootScene, TitleScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 480 },
    max: { width: 428, height: 926 }
  },
  input: {
    activePointers: 4
  }
});
