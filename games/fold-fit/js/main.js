// Fold Fit - Main Entry Point (LOADS LAST)

const GameState = {
  score: 0,
  stage: 1,
  highScore: parseInt(localStorage.getItem('fold_fit_high_score') || '0'),
  wrongFolds: 0,
  combo: 0,
  settings: JSON.parse(localStorage.getItem('fold_fit_settings') || '{"sound":true,"vibration":true}'),
  reset() {
    this.score = 0;
    this.stage = 1;
    this.wrongFolds = 0;
    this.combo = 0;
  }
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    Object.keys(SVG_STRINGS).forEach(key => {
      textures[key] = `data:image/svg+xml;base64,${btoa(SVG_STRINGS[key])}`;
    });

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
  type: Phaser.CANVAS,
  width: 390,
  height: 700,
  backgroundColor: '#E8DCC8',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 480 },
    max: { width: 428, height: 926 }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene, PauseScene],
  render: { pixelArt: false, antialias: true }
};

const game = new Phaser.Game(config);
