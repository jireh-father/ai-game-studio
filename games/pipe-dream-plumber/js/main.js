// main.js - BootScene, Phaser config, GameState - LOADS LAST

// Global game state
const GameState = {
  highScore: 0,
  gamesPlayed: 0,
  bestStage: 0,
  sound: true,
  vibration: true
};

function loadState() {
  try {
    const hs = localStorage.getItem('pipe_dream_plumber_high_score');
    if (hs) GameState.highScore = parseInt(hs);
    const gp = localStorage.getItem('pipe_dream_plumber_games_played');
    if (gp) GameState.gamesPlayed = parseInt(gp);
    const bs = localStorage.getItem('pipe_dream_plumber_highest_stage');
    if (bs) GameState.bestStage = parseInt(bs);
    const settings = localStorage.getItem('pipe_dream_plumber_settings');
    if (settings) {
      const s = JSON.parse(settings);
      GameState.sound = s.sound !== false;
      GameState.vibration = s.vibration !== false;
    }
  } catch (e) {}
}

function saveState() {
  try {
    localStorage.setItem('pipe_dream_plumber_high_score', GameState.highScore);
    localStorage.setItem('pipe_dream_plumber_games_played', GameState.gamesPlayed);
    localStorage.setItem('pipe_dream_plumber_highest_stage', GameState.bestStage);
    localStorage.setItem('pipe_dream_plumber_settings', JSON.stringify({
      sound: GameState.sound, vibration: GameState.vibration
    }));
  } catch (e) {}
}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    const textures = {};
    for (const [key, svgStr] of Object.entries(SVG)) {
      textures[key] = `data:image/svg+xml;base64,${btoa(svgStr)}`;
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

loadState();
sfx.enabled = GameState.sound;

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 400,
    height: 720,
    parent: 'game-container'
  },
  backgroundColor: '#E0F7FA',
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  input: { activePointers: 2 }
};

const game = new Phaser.Game(config);

// Orientation change handler - delayed refresh to let viewport settle
let resizeTimer = null;
window.addEventListener('resize', () => {
  if (game && game.scale) {
    game.scale.refresh();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      game.scale.refresh();
    }, 200);
  }
});
