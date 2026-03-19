// main.js — BootScene, Phaser config, localStorage helpers — LOADS LAST

function saveHighScore(score) {
  try { localStorage.setItem('bubble-wrap-boss_high_score', String(score)); } catch(e) {}
}

function loadHighScore() {
  try { return parseInt(localStorage.getItem('bubble-wrap-boss_high_score') || '0', 10); } catch(e) { return 0; }
}

window.GameState = {
  highScore: loadHighScore(),
  gamesPlayed: 0,
  totalDeaths: 0
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {};
    for (const [key, svg] of Object.entries(SVG_STRINGS)) {
      textures[key] = 'data:image/svg+xml;base64,' + btoa(svg);
    }

    // Also create deadline bar texture
    const deadlineSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="8"><rect width="360" height="8" fill="#E53935"/><line x1="0" y1="4" x2="360" y2="4" stroke="#FFCDD2" stroke-width="1" stroke-dasharray="8,4"/></svg>';
    textures['deadline_bar'] = 'data:image/svg+xml;base64,' + btoa(deadlineSVG);

    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once('addtexture-' + key, () => {
          pending--;
          if (pending === 0) this.scene.start('MenuScene');
        });
        this.textures.addBase64(key, src);
      }
    }

    if (pending === 0) this.scene.start('MenuScene');
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.BG,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, PauseOverlay, GameOverScene],
  audio: {
    disableWebAudio: false
  },
  input: {
    activePointers: 3
  }
};

const game = new Phaser.Game(phaserConfig);

// Prevent default touch behavior for the game canvas
document.addEventListener('touchstart', function(e) {
  if (e.target.tagName === 'CANVAS') e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', function(e) {
  if (e.target.tagName === 'CANVAS') e.preventDefault();
}, { passive: false });
