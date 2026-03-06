// main.js - BootScene, Phaser config, GameState (LOADS LAST)

const GameState = {
  score: 0,
  stage: 1,
  lives: GAME_CONFIG.INITIAL_LIVES,
  highScore: parseInt(localStorage.getItem('circuit_reroute_high_score') || '0'),
  streak: 0,
  bestStreak: parseInt(localStorage.getItem('circuit_reroute_best_streak') || '0'),
  settings: JSON.parse(localStorage.getItem('circuit_reroute_settings') || '{"sound":true}')
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      straight: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.STRAIGHT)}`,
      elbow: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.ELBOW)}`,
      t_junction: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.T_JUNCTION)}`,
      cross: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.CROSS)}`,
      source: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.SOURCE)}`,
      bulb_unlit: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.BULB_UNLIT)}`,
      bulb_lit: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.BULB_LIT)}`,
      lock: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.LOCK)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.PARTICLE)}`
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
  parent: 'game-container',
  backgroundColor: COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 700
  },
  scene: [BootScene, MenuScene, GameScene, HUDScene, GameOverScene, HelpScene]
};

const game = new Phaser.Game(config);

// Visibility change handler
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const gs = game.scene.getScene('GameScene');
    if (gs && gs.electricity && gs.electricity.state === 'FLOWING') {
      gs.electricity.state = 'PAUSED';
    }
  } else {
    const gs = game.scene.getScene('GameScene');
    if (gs && gs.electricity && gs.electricity.state === 'PAUSED') {
      gs.electricity.state = 'FLOWING';
    }
  }
});
