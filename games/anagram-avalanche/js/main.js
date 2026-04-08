class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    const textures = {
      boulder: 'data:image/svg+xml;base64,' + btoa(BOULDER_SVG),
      heart: 'data:image/svg+xml;base64,' + btoa(HEART_SVG),
      heartEmpty: 'data:image/svg+xml;base64,' + btoa(HEART_EMPTY_SVG),
      particle: 'data:image/svg+xml;base64,' + btoa(PARTICLE_SVG),
    };
    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;
    const finish = () => { if (pending === 0) this.scene.start('MenuScene'); };
    for (const key of keys) {
      if (this.textures.exists(key)) continue;
      pending++;
      this.textures.once('addtexture-' + key, () => {
        pending--;
        if (pending === 0) this.scene.start('MenuScene');
      });
      this.textures.addBase64(key, textures[key]);
    }
    if (pending === 0) this.scene.start('MenuScene');
    initAds();
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: '#0D1117',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, PowerUpScene, GameOverScene],
};

const game = new Phaser.Game(phaserConfig);
