// main.js - ALWAYS LOADS LAST. BootScene + Phaser config.
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    // Init GameState
    let savedSettings = { sfx: true, music: true };
    try {
      const s = localStorage.getItem('fmifyc_settings');
      if (s) savedSettings = JSON.parse(s);
    } catch (e) {}
    let highScore = 0;
    try {
      const hs = localStorage.getItem('fmifyc_highscore');
      if (hs) highScore = parseInt(hs, 10) || 0;
    } catch (e) {}
    window.GameState = {
      score: 0,
      highScore,
      stage: 1,
      lives: CONFIG.LIVES,
      settings: savedSettings
    };

    const textures = {
      mine: 'data:image/svg+xml;base64,' + btoa(CONFIG.SVG.MINE),
      explosion: 'data:image/svg+xml;base64,' + btoa(CONFIG.SVG.EXPLOSION),
      flag_wrong: 'data:image/svg+xml;base64,' + btoa(CONFIG.SVG.FLAG_WRONG),
      flag_right: 'data:image/svg+xml;base64,' + btoa(CONFIG.SVG.FLAG_RIGHT),
      particle: 'data:image/svg+xml;base64,' + btoa(CONFIG.SVG.PARTICLE)
    };
    let pending = 0;
    const keys = Object.keys(textures);
    const total = keys.length;
    const done = () => { if (--pending === 0) this.scene.start('MenuScene'); };
    for (const k of keys) {
      if (this.textures.exists(k)) continue;
      pending++;
      this.textures.once('addtexture-' + k, done);
      this.textures.addBase64(k, textures[k]);
    }
    if (pending === 0) this.scene.start('MenuScene');
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#1A1A2E',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 400,
    height: 700
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
};

document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

window.addEventListener('load', () => {
  new Phaser.Game(phaserConfig);
});
