// Global state
window.GS = {
  score: 0, stage: 1, hp: MAX_HP, highScore: 0,
  adUsed: false, gamesPlayed: 0
};

// Load high score
try {
  const saved = localStorage.getItem('grandmas-revenge_high_score');
  if (saved) window.GS.highScore = parseInt(saved, 10) || 0;
} catch (e) {}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: SVG_PLAYER,
      slipper: SVG_SLIPPER,
      remote: SVG_REMOTE,
      pot: SVG_POT,
      grandma_ball: SVG_GRANDMA_BALL,
      heart_full: SVG_HEART_FULL,
      heart_empty: SVG_HEART_EMPTY,
      particle: SVG_PARTICLE,
      dust: SVG_DUST,
      star: SVG_STAR
    };
    // Add grandma tiers
    for (let t = 1; t <= 6; t++) {
      textures['grandma_t' + t] = SVG_GRANDMA[t];
    }

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, svg] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once('addtexture-' + key, () => {
          if (--pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, 'data:image/svg+xml;base64,' + btoa(svg));
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
  backgroundColor: COL.BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HUDScene, HelpScene],
  input: { activePointers: 2 }
};

const game = new Phaser.Game(phaserConfig);

// Prevent default touch behaviors
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
