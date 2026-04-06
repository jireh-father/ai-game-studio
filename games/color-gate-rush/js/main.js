// main.js — BootScene, GameState, Phaser init — LOADS LAST

var GameState = {
  highScore: 0,
  load: function() {
    try {
      var saved = localStorage.getItem('color-gate-rush_high_score');
      if (saved) this.highScore = parseInt(saved, 10) || 0;
    } catch (e) {}
  },
  save: function() {
    try {
      localStorage.setItem('color-gate-rush_high_score', '' + this.highScore);
    } catch (e) {}
  }
};
GameState.load();

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Register star texture
    var starSvg = SVG_STRINGS.star;
    var starBase64 = 'data:image/svg+xml;base64,' + btoa(starSvg);

    if (!this.textures.exists('star')) {
      var self = this;
      this.textures.once('addtexture-star', function() {
        self.scene.start('MenuScene');
      });
      this.textures.addBase64('star', starBase64);
    } else {
      this.scene.start('MenuScene');
    }
  }
}

var phaserConfig = {
  type: Phaser.AUTO,
  width: SCREEN.WIDTH,
  height: SCREEN.HEIGHT,
  backgroundColor: '#0A0A14',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene]
};

var game = new Phaser.Game(phaserConfig);
