// main.js - BootScene, Phaser config, scene registration (LOADS LAST)

// Global game state
var GameState = {
    highScore: parseInt(localStorage.getItem('trust_fall_high_score')) || 0,
    gamesPlayed: parseInt(localStorage.getItem('trust_fall_games_played')) || 0,
    highestStage: parseInt(localStorage.getItem('trust_fall_highest_stage')) || 0,
    bestCombo: parseInt(localStorage.getItem('trust_fall_best_combo')) || 0,
    settings: JSON.parse(localStorage.getItem('trust_fall_settings') || '{"sound":true,"music":true,"vibration":true}')
};

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Show loading text
        var w = GAME.WIDTH, h = GAME.HEIGHT;
        this.add.text(w / 2, h / 2, 'Loading...', {
            fontSize: '24px', fontFamily: 'Arial', color: '#FFFFFF'
        }).setOrigin(0.5);
    }

    create() {
        var keys = Object.keys(SVG_STRINGS);
        var loaded = 0;
        var total = keys.length;
        var self = this;

        for (var i = 0; i < keys.length; i++) {
            (function(key) {
                var svgStr = SVG_STRINGS[key];
                var encoded = 'data:image/svg+xml;base64,' + btoa(svgStr);
                self.textures.addBase64(key, encoded);
                self.textures.on('addtexture-' + key, function() {
                    loaded++;
                    if (loaded >= total) {
                        self.scene.start('MenuScene');
                    }
                });
            })(keys[i]);
        }
    }
}

// Phaser config
var gameConfig = {
    type: Phaser.AUTO,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.BG_TOP,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene]
};

// Create game instance
var game = new Phaser.Game(gameConfig);

// Orientation resize handler
window.addEventListener('resize', function() {
    if (game && game.scale) {
        game.scale.resize(GAME.WIDTH, GAME.HEIGHT);
    }
});
