// Rush Hour Dash - Boot Scene & Phaser Init (MUST LOAD LAST)
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    var textures = {};
    var keys = Object.keys(SVG_STRINGS);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      textures[key] = 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS[key]);
    }

    var pending = 0;
    var total = Object.keys(textures).length;
    var self = this;

    for (var key in textures) {
      if (!this.textures.exists(key)) {
        pending++;
        (function(k) {
          self.textures.once('addtexture-' + k, function() {
            pending--;
            if (pending === 0) {
              self.scene.start('MenuScene');
            }
          });
          self.textures.addBase64(k, textures[k]);
        })(key);
      }
    }

    if (pending === 0) {
      this.scene.start('MenuScene');
    }
  }
}

// Phaser configuration
var phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2C2C3E',
  scene: [BootScene, MenuScene, HelpScene, UIScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 1
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

var game = new Phaser.Game(phaserConfig);

// Resize handler
window.addEventListener('resize', function() {
  game.scale.refresh();
});
