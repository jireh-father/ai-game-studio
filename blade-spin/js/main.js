// Blade Spin - Boot Scene & Phaser Init (MUST LOAD LAST)

// Shared game state
window.GameState = {
  score: 0, stage: 1, combo: 0, throwsRemaining: 0,
  highScore: parseInt(localStorage.getItem('blade-spin_high_score') || '0')
};

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    var textures = {
      'log': 'data:image/svg+xml;base64,' + btoa(SVG_LOG),
      'log-boss': 'data:image/svg+xml;base64,' + btoa(SVG_LOG_BOSS),
      'blade': 'data:image/svg+xml;base64,' + btoa(SVG_BLADE),
      'golden-apple': 'data:image/svg+xml;base64,' + btoa(SVG_APPLE),
      'particle': 'data:image/svg+xml;base64,' + btoa(SVG_PARTICLE),
      'gold-particle': 'data:image/svg+xml;base64,' + btoa(SVG_GOLD_PARTICLE)
    };

    var keys = Object.keys(textures);
    var pending = 0;
    var scene = this;

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!this.textures.exists(key)) {
        pending++;
        (function(k) {
          scene.textures.once('addtexture-' + k, function() {
            pending--;
            if (pending === 0) scene.scene.start('MenuScene');
          });
          scene.textures.addBase64(k, textures[k]);
        })(key);
      }
    }

    if (pending === 0) this.scene.start('MenuScene');
  }
}

// Phaser config - all scene classes must be declared before this
var phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: COL_BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, HUDScene, GameOverScene]
};

var game = new Phaser.Game(phaserConfig);
AdsManager.init();
