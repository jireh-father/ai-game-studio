class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: CONFIG.SVG_PLAYER,
      goal: CONFIG.SVG_GOAL,
      skull: CONFIG.SVG_SKULL,
      warning: CONFIG.SVG_WARNING
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

function getHighScore() {
  try {
    return parseInt(localStorage.getItem(CONFIG.LS_KEY) || '0', 10);
  } catch (e) {
    return window._ttHighScore || 0;
  }
}

function saveHighScore(score) {
  try {
    localStorage.setItem(CONFIG.LS_KEY, String(score));
  } catch (e) {
    window._ttHighScore = score;
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  backgroundColor: '#0A0E1A',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, PauseScene, GameOverScene]
};

const game = new Phaser.Game(phaserConfig);
