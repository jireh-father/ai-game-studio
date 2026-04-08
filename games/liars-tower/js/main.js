// Liar's Tower — Phaser init, BootScene (texture registration)
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    // Global state
    window.GameState = window.GameState || {};
    try {
      window.GameState.highScore = parseInt(localStorage.getItem('liars-tower_high_score') || '0', 10);
      const s = localStorage.getItem('liars-tower_sound');
      window.GameState.soundEnabled = s === null ? true : s === '1';
    } catch (e) {
      window.GameState.highScore = 0;
      window.GameState.soundEnabled = true;
    }

    const textures = {
      knight: 'data:image/svg+xml;base64,' + btoa(SVG_KNIGHT),
      liar: 'data:image/svg+xml;base64,' + btoa(SVG_LIAR),
      tile_k: 'data:image/svg+xml;base64,' + btoa(SVG_TILE_KNIGHT),
      tile_l: 'data:image/svg+xml;base64,' + btoa(SVG_TILE_LIAR),
      crack: 'data:image/svg+xml;base64,' + btoa(SVG_CRACK),
      crack_empty: 'data:image/svg+xml;base64,' + btoa(SVG_CRACK_EMPTY),
      particle: 'data:image/svg+xml;base64,' + btoa(SVG_PARTICLE),
    };

    const keys = Object.keys(textures);
    let pending = 0;
    const start = () => { if (--pending === 0) this.scene.start('MenuScene'); };
    keys.forEach(k => {
      if (this.textures.exists(k)) return;
      pending++;
      this.textures.once('addtexture-' + k, start);
      this.textures.addBase64(k, textures[k]);
    });
    if (pending === 0) this.scene.start('MenuScene');

    AdsManager.init();
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#1A1A2E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { default: 'arcade' },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
};

window.addEventListener('load', () => {
  new Phaser.Game(phaserConfig);
});

// Block pull-to-refresh
document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
