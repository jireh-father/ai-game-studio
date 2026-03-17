window.GameState = {
  score: 0,
  stage: 1,
  lives: STARTING_LIVES,
  streak: 0,
  highScore: parseInt(localStorage.getItem('knife-magnet_high_score')) || 0
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(PLAYER_SVG)}`,
      knife_normal: `data:image/svg+xml;base64,${btoa(KNIFE_SVG_NORMAL)}`,
      knife_cursed: `data:image/svg+xml;base64,${btoa(KNIFE_SVG_CURSED)}`,
      particle: `data:image/svg+xml;base64,${btoa(PARTICLE_SVG)}`,
      particle_gold: `data:image/svg+xml;base64,${btoa(PARTICLE_GOLD_SVG)}`
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

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1A1E2A',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
};

const game = new Phaser.Game(config);
