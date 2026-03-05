// Glass Walk - Boot Scene & Phaser Config (LOADS LAST)
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Register all SVG textures once
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(SVG.player)}`,
      heart: `data:image/svg+xml;base64,${btoa(SVG.heart)}`,
      heartEmpty: `data:image/svg+xml;base64,${btoa(SVG.heartEmpty)}`,
      shard: `data:image/svg+xml;base64,${btoa(SVG.shard)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG.particle)}`,
      goldParticle: `data:image/svg+xml;base64,${btoa(SVG.goldParticle)}`
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

// Phaser Game Configuration
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0D1B2A',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 700,
    min: { width: 320, height: 480 },
    max: { width: 480, height: 900 }
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, UIScene, GameOverScene],
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

// Initialize game
const game = new Phaser.Game(config);

// Sound setting
game.sound.mute = !lsGet(LS_KEYS.sound, true);

// Orientation handler
window.addEventListener('resize', () => {
  if (game && game.scale) {
    game.scale.refresh();
  }
});
