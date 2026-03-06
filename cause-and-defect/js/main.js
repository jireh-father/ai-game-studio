// main.js - BootScene, GameState, Phaser config (LOADS LAST)

// Global game state
window.GameState = {
    highScore: 0,
    gamesPlayed: 0,
    highestStage: 0,
    totalStars: 0,
    bestStreak: 0,
    score: 0,
    currentStage: 1,
    lives: GAME_SETTINGS.LIVES,
    streak: 0,
    sessionSalt: Date.now() % 10000,
    adContinueUsed: false,
    settings: { sound: true, ambient: true, vibration: true }
};

// LocalStorage persistence
function loadGameState() {
    try {
        const hs = localStorage.getItem('cause_and_defect_high_score');
        if (hs !== null) window.GameState.highScore = parseInt(hs) || 0;
        const gp = localStorage.getItem('cause_and_defect_games_played');
        if (gp !== null) window.GameState.gamesPlayed = parseInt(gp) || 0;
        const hst = localStorage.getItem('cause_and_defect_highest_stage');
        if (hst !== null) window.GameState.highestStage = parseInt(hst) || 0;
        const ts = localStorage.getItem('cause_and_defect_total_stars');
        if (ts !== null) window.GameState.totalStars = parseInt(ts) || 0;
        const bs = localStorage.getItem('cause_and_defect_best_streak');
        if (bs !== null) window.GameState.bestStreak = parseInt(bs) || 0;
        const settings = localStorage.getItem('cause_and_defect_settings');
        if (settings) window.GameState.settings = JSON.parse(settings);
    } catch (e) { console.warn('Failed to load save data', e); }
}

function saveGameState() {
    try {
        const gs = window.GameState;
        localStorage.setItem('cause_and_defect_high_score', gs.highScore);
        localStorage.setItem('cause_and_defect_games_played', gs.gamesPlayed);
        localStorage.setItem('cause_and_defect_highest_stage', gs.highestStage);
        localStorage.setItem('cause_and_defect_total_stars', gs.totalStars);
        localStorage.setItem('cause_and_defect_best_streak', gs.bestStreak);
        localStorage.setItem('cause_and_defect_settings', JSON.stringify(gs.settings));
    } catch (e) { console.warn('Failed to save data', e); }
}

// BootScene: register all textures
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        // Loading text
        this.add.text(180, 380, 'Loading...', {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX
        }).setOrigin(0.5);
    }

    create() {
        this.texturesLoaded = 0;
        this.totalTextures = 0;

        // Register component SVGs (healthy + failed)
        const types = ['gear', 'lever', 'ramp', 'spring', 'domino', 'pendulum', 'pulley', 'conveyor', 'funnel'];
        types.forEach(type => {
            this.registerSVG(type + '_healthy', makeSVG(type, false));
            this.registerSVG(type + '_failed', makeSVG(type, true));
        });

        // Register UI SVGs
        const uiSvgs = {
            wrench: SVG_STRINGS.wrench,
            wrenchEmpty: SVG_STRINGS.wrenchEmpty,
            star: SVG_STRINGS.star,
            starEmpty: SVG_STRINGS.starEmpty,
            pause: SVG_STRINGS.pause,
            connector: SVG_STRINGS.connector
        };
        Object.entries(uiSvgs).forEach(([key, svg]) => {
            this.registerSVG(key, svg);
        });

        // Wait a frame then start menu
        this.time.delayedCall(300, () => {
            loadGameState();
            this.scene.start('MenuScene');
        });
    }

    registerSVG(key, svgString) {
        try {
            const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            this.totalTextures++;
            this.textures.addBase64(key, encoded);
            this.textures.on('addtexture-' + key, () => {
                this.texturesLoaded++;
            });
        } catch (e) {
            console.warn('Failed to register texture: ' + key, e);
        }
    }
}

// Phaser game configuration
const phaserConfig = {
    type: Phaser.AUTO,
    width: GAME_SETTINGS.GAME_WIDTH,
    height: GAME_SETTINGS.GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1A1A2E',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, HUDScene, GameOverScene],
    input: {
        activePointers: 2
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

// Create game instance
const game = new Phaser.Game(phaserConfig);

// Orientation change handler
window.addEventListener('resize', () => {
    if (game && game.scale) {
        game.scale.resize(GAME_SETTINGS.GAME_WIDTH, GAME_SETTINGS.GAME_HEIGHT);
        game.scale.refresh();
    }
});

// Visibility change: pause game when backgrounded
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            gameScene.isPaused = true;
        }
    }
});
