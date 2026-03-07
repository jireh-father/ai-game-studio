// ============================================================
// main.js - BootScene, Phaser init, GameState, localStorage
// ============================================================

// Global Game State
const GameState = {
    score: 0,
    stage: 1,
    lives: 3,
    highScore: 0,
    gamesPlayed: 0,
    highestStage: 0,
    wallsRemaining: 0,
    wallsTotal: 0,
    runSeed: Math.floor(Math.random() * 999999),
    mutationOrder: [],
    settings: { sound: true, vibration: true },
    adContinueUsed: false,
};

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, GameState.highScore);
        localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, GameState.gamesPlayed);
        localStorage.setItem(STORAGE_KEYS.HIGHEST_STAGE, GameState.highestStage);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(GameState.settings));
    } catch (e) {
        console.warn('localStorage save failed:', e);
    }
}

function loadState() {
    try {
        const hs = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
        if (hs !== null) GameState.highScore = parseInt(hs, 10) || 0;
        const gp = localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED);
        if (gp !== null) GameState.gamesPlayed = parseInt(gp, 10) || 0;
        const hst = localStorage.getItem(STORAGE_KEYS.HIGHEST_STAGE);
        if (hst !== null) GameState.highestStage = parseInt(hst, 10) || 0;
        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (settings) {
            const parsed = JSON.parse(settings);
            GameState.settings = { ...GameState.settings, ...parsed };
        }
    } catch (e) {
        console.warn('localStorage load failed:', e);
    }
}

// BootScene - register textures and start menu
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        loadState();

        const textures = {
            life_active: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.LIFE_ACTIVE),
            life_empty: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.LIFE_EMPTY),
            pause_icon: 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS.PAUSE_ICON),
        };

        let pending = 0;
        const total = Object.keys(textures).length;

        for (const [key, src] of Object.entries(textures)) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once('addtexture-' + key, () => {
                    if (--pending === 0) this.scene.start('MenuScene');
                });
                this.textures.addBase64(key, src);
            }
        }

        if (pending === 0) this.scene.start('MenuScene');
    }
}

// Phaser Game Configuration
const phaserConfig = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    backgroundColor: '#0A0E1A',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene, UIScene],
};

// Initialize game
const game = new Phaser.Game(phaserConfig);

// Handle visibility change - pause when tab hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive()) {
            gameScene.pauseGame();
        }
    }
});

// Handle orientation change
window.addEventListener('resize', () => {
    const rotateOverlay = document.getElementById('rotate-overlay');
    if (rotateOverlay) {
        if (window.innerWidth > window.innerHeight && window.innerHeight < 500) {
            rotateOverlay.style.display = 'flex';
            const gameScene = game.scene.getScene('GameScene');
            if (gameScene && gameScene.scene.isActive()) {
                gameScene.pauseGame();
            }
        } else {
            rotateOverlay.style.display = 'none';
        }
    }
});
