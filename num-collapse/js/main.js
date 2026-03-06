// main.js - BootScene, Phaser config, GameState - LOADS LAST

// Global game state
window.GameState = {
  score: 0,
  highScore: 0,
  gamesPlayed: 0,
  wave: 1,
  bestWave: 0,
  bestChain: 0,
  totalMerges: 0,
  settings: { sound: true, vibration: true }
};

// Load from localStorage
try {
  GameState.highScore = parseInt(localStorage.getItem('num_collapse_high_score')) || 0;
  GameState.gamesPlayed = parseInt(localStorage.getItem('num_collapse_games_played')) || 0;
  GameState.bestWave = parseInt(localStorage.getItem('num_collapse_best_wave')) || 0;
  GameState.bestChain = parseInt(localStorage.getItem('num_collapse_best_chain')) || 0;
  const settings = JSON.parse(localStorage.getItem('num_collapse_settings'));
  if (settings) GameState.settings = settings;
} catch (e) { /* localStorage unavailable, use defaults */ }

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    const textures = {};
    for (const [key, svg] of Object.entries(SVG_STRINGS)) {
      textures[key] = `data:image/svg+xml;base64,${btoa(svg)}`;
    }
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

// Phaser config
const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 640,
  backgroundColor: '#1A1A2E',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, HelpScene, GameOverScene]
};

const game = new Phaser.Game(config);

// Orientation change handler
window.addEventListener('resize', () => {
  if (game && game.scale) game.scale.refresh();
});
