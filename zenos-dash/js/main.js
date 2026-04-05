// Zeno's Dash - Main Entry (BootScene, GameState, Phaser config)
// MUST load LAST in index.html

// Global game state
const GameState = {
  score: 0,
  stage: 1,
  highScore: 0,
  bestStage: 0,
  gamesPlayed: 0,
  adContinueUsed: false,
  consecutivePerfect: 0
};

function loadGameState() {
  try {
    const saved = localStorage.getItem('zenos-dash_state');
    if (saved) {
      const data = JSON.parse(saved);
      GameState.highScore = data.highScore || 0;
      GameState.bestStage = data.bestStage || 0;
      GameState.gamesPlayed = data.gamesPlayed || 0;
    }
  } catch (e) {}
}

function saveGameState() {
  try {
    localStorage.setItem('zenos-dash_state', JSON.stringify({
      highScore: GameState.highScore,
      bestStage: GameState.bestStage,
      gamesPlayed: GameState.gamesPlayed
    }));
  } catch (e) {}
}

// BootScene - register all SVG textures once
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(SVG_PLAYER)}`,
      pursuer: `data:image/svg+xml;base64,${btoa(SVG_PURSUER)}`,
      finish: `data:image/svg+xml;base64,${btoa(SVG_FINISH)}`,
      arrow: `data:image/svg+xml;base64,${btoa(SVG_ARROW)}`
    };

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once(`addtexture-${key}`, () => {
          if (--pending === 0) this._boot();
        });
        this.textures.addBase64(key, src);
      }
    }
    if (pending === 0) this._boot();
  }

  _boot() {
    loadGameState();
    this.scene.start('MenuScene');
  }
}

// Phaser config
const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.bg,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
};

const game = new Phaser.Game(phaserConfig);
