// main.js — BootScene, GameState, Phaser config (MUST load last)

const GameState = {
  score: 0,
  stage: 1,
  lives: DIFFICULTY_BASE.initialLives,
  highScore: 0,
  gamesPlayed: 0,
  comboChain: 0,
  comboActive: false,
  settings: { sfx: true, music: true }
};

// Load high score from localStorage
try {
  const saved = localStorage.getItem(STORAGE_KEYS.highScore);
  if (saved) GameState.highScore = parseInt(saved, 10) || 0;
} catch (e) {}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      player: `data:image/svg+xml;base64,${btoa(SVG_PLAYER)}`,
      playerStressed: `data:image/svg+xml;base64,${btoa(SVG_PLAYER_STRESSED)}`,
      npcYoga: `data:image/svg+xml;base64,${btoa(SVG_NPC_YOGA)}`,
      npcElevator: `data:image/svg+xml;base64,${btoa(SVG_NPC_ELEVATOR)}`,
      npcWedding: `data:image/svg+xml;base64,${btoa(SVG_NPC_WEDDING)}`,
      cloudPuff: `data:image/svg+xml;base64,${btoa(SVG_CLOUD_PUFF)}`,
      sweat: `data:image/svg+xml;base64,${btoa(SVG_SWEAT)}`,
      life: `data:image/svg+xml;base64,${btoa(SVG_LIFE)}`,
      lifeLost: `data:image/svg+xml;base64,${btoa(SVG_LIFE_LOST)}`
    };

    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;

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
  width: 375,
  height: 667,
  backgroundColor: '#1A1A2E',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
  input: {
    activePointers: 3
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

const game = new Phaser.Game(phaserConfig);
