// Stack Quake - Main (BootScene + Phaser Config + GameState)
// MUST LOAD LAST

// Pause Scene (simple overlay)
class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const W = GAME_WIDTH;
    this.add.rectangle(W / 2, GAME_HEIGHT / 2, W, GAME_HEIGHT, 0x000000, 0.6);

    this.add.text(W / 2, 200, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.createBtn(W / 2, 280, 200, 52, 0x06D6A0, 'RESUME', () => {
      this.scene.stop('PauseScene');
      const gs = this.scene.get('GameScene');
      gs.paused = false;
      gs.lastInputTime = Date.now();
      gs.startAutoDropTimer();
      this.scene.resume('GameScene');
    });

    this.createBtn(W / 2, 346, 200, 52, 0x1A1A2E, 'RESTART', () => {
      this.scene.stop('PauseScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    this.createBtn(W / 2, 412, 200, 52, 0x1A1A2E, 'HOW TO PLAY', () => {
      this.scene.pause('PauseScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    this.createBtn(W / 2, 478, 200, 52, 0x1A1A2E, 'MENU', () => {
      this.scene.stop('PauseScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }

  createBtn(x, y, w, h, color, label, cb) {
    const bg = this.add.rectangle(x, y, w, h, color).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, { fontSize: '18px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
    txt.disableInteractive();
    bg.on('pointerdown', cb);
  }
}

// BootScene - register all textures once
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      block: `data:image/svg+xml;base64,${btoa(SVG_BLOCK)}`,
      ground: `data:image/svg+xml;base64,${btoa(SVG_GROUND)}`,
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

// Global GameState
const GameState = {
  highScore: 0,
  gamesPlayed: 0,
  settings: { sound: true, music: true, vibration: true },
  currentScore: 0,
  currentFloor: 0,

  load() {
    try {
      const data = JSON.parse(localStorage.getItem('stack-quake_state'));
      if (data) {
        this.highScore = data.highScore || 0;
        this.gamesPlayed = data.gamesPlayed || 0;
        if (data.settings) this.settings = data.settings;
      }
    } catch (e) { /* ignore */ }
  },

  save() {
    try {
      localStorage.setItem('stack-quake_state', JSON.stringify({
        highScore: this.highScore,
        gamesPlayed: this.gamesPlayed,
        settings: this.settings
      }));
    } catch (e) { /* ignore */ }
  }
};

GameState.load();

// Phaser config
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
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene, PauseScene],
  input: {
    activePointers: 1
  }
};

const game = new Phaser.Game(phaserConfig);

// Prevent pull-to-refresh
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
