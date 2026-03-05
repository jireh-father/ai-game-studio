// main.js - BootScene (texture registration), Phaser init, scene array
// MUST load LAST in index.html

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    loadGameState();

    const textures = {
      realChar: `data:image/svg+xml;base64,${btoa(SVG_REAL)}`,
      reflChar: `data:image/svg+xml;base64,${btoa(SVG_REFL)}`,
      lifeFull: `data:image/svg+xml;base64,${btoa(SVG_LIFE)}`,
      lifeEmpty: `data:image/svg+xml;base64,${btoa(SVG_LIFE_EMPTY)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`,
      particleCyan: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE_CYAN)}`,
      particleMagenta: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE_MAGENTA)}`
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

// Prevent pull-to-refresh and other touch defaults
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Visibility change handler
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.game) {
    const gs = window.game.scene.getScene('GameScene');
    if (gs && gs.scene.isActive()) {
      gs.pauseGame();
    }
  }
});

// Phaser game config
window.game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: PALETTE.bgHex,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
});
