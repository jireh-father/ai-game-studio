// Boot scene — loads all SVG textures once before any gameplay
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    for (const [key, svgStr] of Object.entries(SVG)) {
      textures[key] = `data:image/svg+xml;base64,${btoa(svgStr)}`;
    }

    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;

    for (const key of keys) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this.scene.start('SplashScene');
        });
        this.textures.addBase64(key, textures[key]);
      }
    }

    if (pending === 0) this.scene.start('SplashScene');
  }
}

// Initialize game state
window.GAME_STATE = {
  score: 0,
  stage: 1,
  combo: 1.0,
  usedDodge: false
};

// Load stored settings
AudioManager.init();
Ads.init();

// Phaser game configuration
const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: CONFIG.BG_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: CONFIG.PHYSICS.GRAVITY },
      debug: false
    }
  },
  scene: [BootScene, SplashScene, MenuScene, GameScene, GameOverScene],
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(gameConfig);

// Prevent context menu on long press
document.addEventListener('contextmenu', e => e.preventDefault());

// Prevent pull-to-refresh
document.addEventListener('touchmove', e => {
  if (e.target.closest('#game-container')) e.preventDefault();
}, { passive: false });
