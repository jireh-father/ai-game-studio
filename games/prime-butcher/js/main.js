// Prime Butcher — main.js (BootScene + Phaser config) — MUST LOAD LAST

// Global game state
window.GameState = {
  score: 0,
  stage: 1,
  highScore: parseInt(localStorage.getItem('prime-butcher_high_score') || '0', 10),
  gamesPlayed: 0,
  newRecord: false,
  settings: JSON.parse(localStorage.getItem('prime-butcher_settings') || '{"soundOff":false}')
};

AdsManager.init();

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    const textures = {
      compositeBlock: 'data:image/svg+xml;base64,' + btoa(SVG_COMPOSITE_BLOCK),
      primeBlock: 'data:image/svg+xml;base64,' + btoa(SVG_PRIME_BLOCK),
      bossBlock: 'data:image/svg+xml;base64,' + btoa(SVG_BOSS_BLOCK),
      particle: 'data:image/svg+xml;base64,' + btoa(SVG_PARTICLE),
      particleBlue: 'data:image/svg+xml;base64,' + btoa(SVG_PARTICLE_BLUE)
    };

    let pending = 0;
    const total = Object.keys(textures).length;

    for (const [key, src] of Object.entries(textures)) {
      if (!this.textures.exists(key)) {
        pending++;
        this.textures.once('addtexture-' + key, () => {
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
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1A1A2E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, HUDScene, GameOverScene, PauseScene],
  input: {
    activePointers: 2
  }
};

const game = new Phaser.Game(phaserConfig);
