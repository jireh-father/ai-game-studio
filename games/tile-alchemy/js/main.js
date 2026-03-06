// main.js - BootScene, Phaser config, GameState, localStorage helpers (LOADS LAST)

const GameState = {
  score: 0,
  highScore: 0,
  stage: 1,
  mergesThisStage: 0,
  mergesSincePure: 0,
  voidCount: 0,
  gamesPlayed: 0,
  highestStage: 0,
  bestChain: 0,
  newBest: false,
  settings: { sound: true, vibration: true },
};

function loadState() {
  try {
    GameState.highScore = parseInt(localStorage.getItem('tile_alchemy_high_score')) || 0;
    GameState.gamesPlayed = parseInt(localStorage.getItem('tile_alchemy_games_played')) || 0;
    GameState.highestStage = parseInt(localStorage.getItem('tile_alchemy_highest_stage')) || 0;
    const s = localStorage.getItem('tile_alchemy_settings');
    if (s) GameState.settings = JSON.parse(s);
  } catch (e) { /* ignore */ }
}

function saveState() {
  try {
    localStorage.setItem('tile_alchemy_high_score', GameState.highScore);
    localStorage.setItem('tile_alchemy_games_played', GameState.gamesPlayed);
    localStorage.setItem('tile_alchemy_highest_stage', GameState.highestStage);
    localStorage.setItem('tile_alchemy_settings', JSON.stringify(GameState.settings));
  } catch (e) { /* ignore */ }
}

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    loadState();
    this.pendingTextures = 0;
    this.loadedTextures = 0;

    // Register element tile textures
    const elements = ['fire', 'water', 'earth', 'air', 'lightning', 'magma', 'ice', 'storm', 'mud', 'steam', 'obsidian', 'blizzard', 'tornado', 'philosopher'];
    elements.forEach(el => {
      const hex = TILE_COLORS_HEX[el];
      this.registerSvg('tile_' + el, SVG_TILE(hex));
    });

    // Special tiles
    this.registerSvg('void_tile', SVG_VOID);
    this.registerSvg('pure_tile', SVG_PURE);
    this.registerSvg('empty_cell', SVG_EMPTY);

    // Wait for all or proceed immediately if sync
    if (this.pendingTextures === 0) {
      this.scene.start('MenuScene');
    }
  }

  registerSvg(key, svgString) {
    if (this.textures.exists(key)) return;
    this.pendingTextures++;
    const encoded = 'data:image/svg+xml;base64,' + btoa(svgString);
    this.textures.once('addtexture-' + key, () => {
      this.loadedTextures++;
      if (this.loadedTextures >= this.pendingTextures) {
        this.scene.start('MenuScene');
      }
    });
    this.textures.addBase64(key, encoded);
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0D0B1E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, HelpScene],
};

const game = new Phaser.Game(phaserConfig);
