window.GameState = {
  score: 0, stage: 0, strikes: 3, streak: 0,
  highScore: parseInt(localStorage.getItem('odd-one-math_high_score')) || 0,
  gameOverCount: 0, muted: false
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      'card': `data:image/svg+xml;base64,${btoa(SVG_CARD)}`,
      'card-correct': `data:image/svg+xml;base64,${btoa(SVG_CARD_CORRECT)}`,
      'card-wrong': `data:image/svg+xml;base64,${btoa(SVG_CARD_WRONG)}`,
      'card-impostor': `data:image/svg+xml;base64,${btoa(SVG_CARD_IMPOSTOR)}`,
      'strike-on': `data:image/svg+xml;base64,${btoa(SVG_STRIKE_ON)}`,
      'strike-off': `data:image/svg+xml;base64,${btoa(SVG_STRIKE_OFF)}`,
      'particle': `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`
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
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#F5F5F5',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(phaserConfig);

document.body.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
