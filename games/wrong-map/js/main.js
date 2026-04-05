// Wrong Map - Main (BootScene + Phaser Config)
// MUST load LAST in index.html

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(SVG.PLAYER)}`,
      ghost: `data:image/svg+xml;base64,${btoa(SVG.GHOST)}`,
      exit_tile: `data:image/svg+xml;base64,${btoa(SVG.EXIT)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE)}`,
      particle_green: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE_GREEN)}`,
      particle_gold: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE_GOLD)}`
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
  parent: 'game-container',
  backgroundColor: '#0D1117',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, HUDScene, DeathScene]
};

const game = new Phaser.Game(phaserConfig);
