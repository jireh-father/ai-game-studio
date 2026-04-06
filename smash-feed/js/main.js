var GameState = {
  highScore: 0,
  soundOn: true
};

function saveHighScore() {
  try { localStorage.setItem('smash-feed_high_score', GameState.highScore); } catch (e) {}
}
function loadHighScore() {
  try {
    var v = localStorage.getItem('smash-feed_high_score');
    if (v) GameState.highScore = parseInt(v, 10) || 0;
  } catch (e) {}
}

loadHighScore();

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    var textures = {};
    FOOD_TYPES.forEach(function(f) {
      textures[f.key] = 'data:image/svg+xml;base64,' + btoa(f.svg);
    });
    textures['bomb'] = 'data:image/svg+xml;base64,' + btoa(BOMB_SVG);

    var pending = 0;
    var total = Object.keys(textures).length;
    var self = this;

    for (var key in textures) {
      if (!this.textures.exists(key)) {
        pending++;
        (function(k) {
          self.textures.once('addtexture-' + k, function() {
            if (--pending === 0) self.scene.start('MenuScene');
          });
          self.textures.addBase64(k, textures[k]);
        })(key);
      }
    }

    if (pending === 0) this.scene.start('MenuScene');
  }
}

var phaserConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: 'game-container',
  backgroundColor: '#0D1B2A',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene]
};

var game = new Phaser.Game(phaserConfig);
