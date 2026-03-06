// main.js - BootScene (register textures), Phaser.Game init, GameState global (LOADS LAST)

const GameState = {
    score: 0,
    highScore: parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE) || '0'),
    stage: 1,
    lives: 3,
    combo: 0,
    bestCombo: 0,
    totalCarsSaved: 0,
    gamesPlayed: parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.GAMES_PLAYED) || '0'),
    settings: (function() {
        try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS)) || { sound: true, vibration: true }; }
        catch(e) { return { sound: true, vibration: true }; }
    })()
};

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Loading screen
        this.add.rectangle(W / 2, H / 2, W, H, 0x2D2D2D);
        const loadText = this.add.text(W / 2, H / 2 - 20, 'Loading...', {
            fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial'
        }).setOrigin(0.5);
        const bar = this.add.rectangle(W / 2 - 75, H / 2 + 20, 0, 12, 0x00E676);
        bar.setOrigin(0, 0.5);

        this.load.on('progress', function(value) {
            bar.width = 150 * value;
        });
    }

    create() {
        // Register all SVG textures as base64
        const keys = Object.keys(SVG_STRINGS);
        this.texturesLoaded = 0;
        this.texturesTotal = keys.length;

        for (const key of keys) {
            const svgStr = SVG_STRINGS[key];
            const encoded = 'data:image/svg+xml;base64,' + btoa(svgStr);

            // Listen for texture add event
            this.textures.once('addtexture-' + key, () => {
                this.texturesLoaded++;
                if (this.texturesLoaded >= this.texturesTotal) {
                    this.scene.start('MenuScene');
                }
            });

            this.textures.addBase64(key, encoded);
        }

        // Fallback in case textures load instantly
        if (this.texturesLoaded >= this.texturesTotal) {
            this.scene.start('MenuScene');
        }
    }
}

// Phaser Game Configuration
const gameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: 390,
        height: 680
    },
    backgroundColor: '#2D2D2D',
    scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    input: {
        activePointers: 3
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

// Create game instance
const game = new Phaser.Game(gameConfig);

// Visibility change handler for pause
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        if (game && game.scene) {
            const gameScene = game.scene.getScene('GameScene');
            if (gameScene && gameScene.scene.isActive() && !gameScene.gameOver) {
                gameScene.scene.pause();
            }
        }
    } else {
        if (game && game.scene) {
            const gameScene = game.scene.getScene('GameScene');
            if (gameScene && gameScene.scene.isPaused()) {
                gameScene.scene.resume();
                if (gameScene.lastInputTime) {
                    gameScene.lastInputTime = Date.now();
                }
            }
        }
    }
});

// Prevent default touch behaviors
document.addEventListener('touchstart', function(e) {
    if (e.target.closest('#game-container')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
    if (e.target.closest('#game-container')) {
        e.preventDefault();
    }
}, { passive: false });
