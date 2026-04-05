// Paradox Panic - Main Entry Point (BootScene, Phaser Config, GameState)

// Global game state
const GameState = {
  score: 0,
  highScore: parseInt(localStorage.getItem('paradox-panic_high_score') || '0', 10),
  stage: 0,
  strikes: 0,
  comboCount: 0,
  sessionDeaths: 0,
  continueUsed: false,
  doubleScoreUsed: false,
  newRecord: false,
  cardStackCount: 0
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    AudioManager.init();
    AdsManager.init();

    const textures = {
      card: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.card)}`,
      cardGreen: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.cardGreen)}`,
      cardRed: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.cardRed)}`,
      cardPurple: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.cardPurple)}`,
      cardGold: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.cardGold)}`,
      strikeFilled: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.strikeFilled)}`,
      strikeEmpty: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.strikeEmpty)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.particle)}`,
      particleGreen: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.particleGreen)}`,
      particleRed: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.particleRed)}`,
      particlePurple: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.particlePurple)}`,
      particleGold: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.particleGold)}`
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
  width: 360,
  height: 640,
  parent: 'game-container',
  backgroundColor: COLORS.backgroundHex,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  input: {
    activePointers: 2
  },
  render: {
    antialias: true,
    pixelArt: false
  }
};

const game = new Phaser.Game(phaserConfig);
