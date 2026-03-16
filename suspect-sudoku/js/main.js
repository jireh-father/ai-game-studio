// main.js - BootScene (texture registration), Phaser config, localStorage API

// --- Global Game State ---
const GameState = {
  highScore: 0,
  highestStreak: 0,
  gamesPlayed: 0,
  highestCase: 0,
  settings: { sound: true, music: true }
};

function loadState() {
  try {
    const hs = localStorage.getItem('suspect-sudoku_high_score');
    if (hs !== null) GameState.highScore = parseInt(hs, 10) || 0;
    const hst = localStorage.getItem('suspect-sudoku_highest_streak');
    if (hst !== null) GameState.highestStreak = parseInt(hst, 10) || 0;
    const gp = localStorage.getItem('suspect-sudoku_games_played');
    if (gp !== null) GameState.gamesPlayed = parseInt(gp, 10) || 0;
    const hc = localStorage.getItem('suspect-sudoku_highest_case');
    if (hc !== null) GameState.highestCase = parseInt(hc, 10) || 0;
    const st = localStorage.getItem('suspect-sudoku_settings');
    if (st) {
      const parsed = JSON.parse(st);
      GameState.settings = Object.assign(GameState.settings, parsed);
    }
  } catch (e) {
    console.warn('localStorage unavailable:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem('suspect-sudoku_high_score', String(GameState.highScore));
    localStorage.setItem('suspect-sudoku_highest_streak', String(GameState.highestStreak));
    localStorage.setItem('suspect-sudoku_games_played', String(GameState.gamesPlayed));
    localStorage.setItem('suspect-sudoku_highest_case', String(GameState.highestCase));
    localStorage.setItem('suspect-sudoku_settings', JSON.stringify(GameState.settings));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

// --- BootScene ---
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const keys = Object.keys(SVG_STRINGS);
    const total = keys.length;
    let loaded = 0;

    if (total === 0) {
      this.scene.start('Menu');
      return;
    }

    for (const key of keys) {
      if (this.textures.exists(key)) {
        loaded++;
        if (loaded === total) this.scene.start('Menu');
        continue;
      }

      const svg = SVG_STRINGS[key];
      const b64 = 'data:image/svg+xml;base64,' + btoa(svg);

      this.textures.once('addtexture-' + key, () => {
        loaded++;
        if (loaded === total) {
          this.scene.start('Menu');
        }
      });

      this.textures.addBase64(key, b64);
    }
  }
}

// --- Initialize ---
loadState();
AdsManager.init();

const gameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: COLORS.BACKGROUND,
  parent: 'game-container',
  scene: [BootScene, MenuScene, GameScene, HelpScene, GameOverScene],
  input: {
    activePointers: 1
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(gameConfig);
