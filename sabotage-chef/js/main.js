// main.js - BootScene, Phaser init, scene registration (loads LAST)

var GameState = {
    highScore: 0,
    gamesPlayed: 0,
    settings: { sound: true, music: true, vibration: true }
};

// Load saved data
(function() {
    try {
        var hs = localStorage.getItem('sabotage_chef_high_score');
        if (hs) GameState.highScore = parseInt(hs, 10) || 0;
        var gp = localStorage.getItem('sabotage_chef_games_played');
        if (gp) GameState.gamesPlayed = parseInt(gp, 10) || 0;
        var st = localStorage.getItem('sabotage_chef_settings');
        if (st) {
            var parsed = JSON.parse(st);
            GameState.settings.sound = parsed.sound !== false;
            GameState.settings.music = parsed.music !== false;
            GameState.settings.vibration = parsed.vibration !== false;
        }
    } catch(e) {
        console.warn('Failed to load saved data:', e);
    }
})();

var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function BootScene() {
        Phaser.Scene.call(this, { key: 'BootScene' });
    },

    create: function() {
        var self = this;
        var keys = Object.keys(SVG_STRINGS);
        var loaded = 0;
        var total = keys.length;
        var started = false;

        if (total === 0) {
            this.scene.start('MenuScene');
            return;
        }

        function onLoaded() {
            if (started) return;
            started = true;
            self.scene.start('MenuScene');
        }

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (this.textures.exists(key)) {
                loaded++;
                if (loaded >= total) { onLoaded(); return; }
                continue;
            }
            (function(k) {
                self.textures.once('addtexture-' + k, function() {
                    loaded++;
                    if (loaded >= total) onLoaded();
                });
            })(key);
            var svgStr = SVG_STRINGS[key];
            var b64 = 'data:image/svg+xml;base64,' + btoa(svgStr);
            this.textures.addBase64(key, b64);
        }

        // Fallback timeout in case some textures fail to load
        setTimeout(function() {
            if (!started) {
                console.warn('Texture load timeout, proceeding with ' + loaded + '/' + total);
                onLoaded();
            }
        }, 3000);
    }
});

// Phaser game config
var config = {
    type: Phaser.AUTO,
    width: DIMENSIONS.WIDTH,
    height: DIMENSIONS.HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.BACKGROUND,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, HelpScene, GameOverScene, UIScene],
    input: {
        activePointers: 1
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

var game = new Phaser.Game(config);

// Visibility change handler - pause when tab hidden
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        var gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            if (gameScene.state && !gameScene.state.paused && !gameScene.state.gameOver) {
                gameScene.state.paused = true;
                gameScene.scene.pause();
            }
        }
    }
});

// Orientation change handler
window.addEventListener('resize', function() {
    if (game && game.scale) {
        game.scale.refresh();
    }
});
