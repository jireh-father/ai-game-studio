// Monty's Goats - Main (Boot + Config)
// GameState global
const GameState = {
  score: 0,
  round: 0,
  strikes: 0,
  combo: 0,
  highScore: 0,
  gamesPlayed: 0
};

// Load high score from localStorage
try {
  const saved = localStorage.getItem('montys-goats_high_score');
  if (saved) GameState.highScore = parseInt(saved, 10) || 0;
} catch(e) {}

// BootScene - register all textures ONCE
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      doorClosed: `data:image/svg+xml;base64,${btoa(SVG_DOOR_CLOSED)}`,
      doorSelected: `data:image/svg+xml;base64,${btoa(SVG_DOOR_SELECTED)}`,
      doorGoat: `data:image/svg+xml;base64,${btoa(SVG_DOOR_GOAT)}`,
      doorCar: `data:image/svg+xml;base64,${btoa(SVG_DOOR_CAR)}`,
      monty: `data:image/svg+xml;base64,${btoa(SVG_MONTY)}`,
      goatBig: `data:image/svg+xml;base64,${btoa(SVG_GOAT_BIG)}`,
      particle: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`
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

// Phaser config
const phaserConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: 'game-container',
  backgroundColor: '#0D0D1A',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene, PauseScene]
};

const game = new Phaser.Game(phaserConfig);
