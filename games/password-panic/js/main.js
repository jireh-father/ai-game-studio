// main.js - BootScene, Phaser config, scene registration (LOADS LAST)

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Load high score from localStorage
    GameState.highScore = parseInt(localStorage.getItem('password_panic_high_score') || '0');
    GameState.gamesPlayed = parseInt(localStorage.getItem('password_panic_games_played') || '0');

    // Register ALL SVG textures once
    const textures = {
      stickyNote: `data:image/svg+xml;base64,${btoa(SVG.stickyNote)}`,
      tile: `data:image/svg+xml;base64,${btoa(SVG.tile)}`,
      tilePressed: `data:image/svg+xml;base64,${btoa(SVG.tilePressed)}`,
      submitBtn: `data:image/svg+xml;base64,${btoa(SVG.submitBtn)}`,
      lockIcon: `data:image/svg+xml;base64,${btoa(SVG.lockIcon)}`,
      checkIcon: `data:image/svg+xml;base64,${btoa(SVG.checkmark)}`,
      xIcon: `data:image/svg+xml;base64,${btoa(SVG.xmark)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG.particle)}`
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

// Phaser configuration
const config = {
  type: Phaser.CANVAS,
  width: 360,
  height: 640,
  parent: 'game-container',
  backgroundColor: COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  banner: false
};

// Create game
const game = new Phaser.Game(config);

// Orientation/resize handler
window.addEventListener('resize', () => {
  game.scale.resize(360, 640);
});
