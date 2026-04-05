// Birthday Bomb - Boot Scene & Phaser Config

var GameState = {
  score: 0,
  stage: 1,
  highScore: 0,
  streak: 0,
  correctBets: 0,
  totalBets: 0,
  gamesPlayed: 0
};

function saveHighScore(score) {
  try { localStorage.setItem('birthday-bomb_high_score', score); } catch(e) {}
}

function loadHighScore() {
  try { return parseInt(localStorage.getItem('birthday-bomb_high_score')) || 0; } catch(e) { return 0; }
}

GameState.highScore = loadHighScore();

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    var textures = {};

    // Generate person SVGs for each shirt color
    SHIRT_COLORS.forEach(function(color, i) {
      textures['person_' + i] = 'data:image/svg+xml;base64,' + btoa(makePersonSVG(color, 60, 80));
    });

    textures['bomb'] = 'data:image/svg+xml;base64,' + btoa(SVG_BOMB);
    textures['cake'] = 'data:image/svg+xml;base64,' + btoa(SVG_CAKE);
    textures['burst'] = 'data:image/svg+xml;base64,' + btoa(SVG_BURST);
    textures['burst_red'] = 'data:image/svg+xml;base64,' + btoa(SVG_BURST_RED);
    textures['confetti'] = 'data:image/svg+xml;base64,' + btoa(SVG_CONFETTI);

    var pending = 0;
    var total = Object.keys(textures).length;
    var scene = this;

    for (var key in textures) {
      if (textures.hasOwnProperty(key)) {
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
    }

    if (pending === 0) this.scene.start('MenuScene');
  }
}

var phaserConfig = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  parent: 'game-container',
  backgroundColor: '#FFF8F0',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
  input: {
    touch: true
  },
  render: {
    pixelArt: false,
    antialias: true
  }
};

var game = new Phaser.Game(phaserConfig);
