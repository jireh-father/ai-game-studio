// Copycat Killer - Main (BootScene, GameState, Phaser Config)
// MUST LOAD LAST

const GameState = {
  score: 0,
  highScore: loadHighScore(),
  stage: 1,
  gamesPlayed: 0,
  reset() {
    this.score = 0;
    this.stage = 1;
    this.gamesPlayed++;
    if (typeof SessionAdTracker !== 'undefined') SessionAdTracker.reset();
  }
};

function saveHighScore(score) {
  try { localStorage.setItem('copycat-killer_high_score', score); } catch(e) {}
}

function loadHighScore() {
  try { return parseInt(localStorage.getItem('copycat-killer_high_score')) || 0; } catch(e) { return 0; }
}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.player)}`,
      ghost: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.ghost)}`,
      obstacle: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.obstacle)}`,
      megaObstacle: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.megaObstacle)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.particle)}`,
      goldParticle: `data:image/svg+xml;base64,${btoa(SVG_STRINGS.goldParticle)}`
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
  parent: 'game-container',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: '#0A0A12',
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
};

const game = new Phaser.Game(phaserConfig);

// Prevent scroll on touch
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
