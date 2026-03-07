// Shadow Match - Main (BootScene + Phaser Init) - LOADS LAST
const GameState = {
    score: 0,
    highScore: 0,
    stage: 1,
    streak: 0,
    bestStreak: 0,
    highestStage: 0,
    gamesPlayed: 0,
    wrongThisStage: 0,
    collection: [],
    settings: { sound: true, music: true, vibration: true },
    dailyStreak: 0,
    lastDailyDate: '',
    totalScore: 0,
    gameOverCount: 0
};

function saveState() {
    try {
        localStorage.setItem('shadow_match_high_score', GameState.highScore);
        localStorage.setItem('shadow_match_highest_stage', GameState.highestStage);
        localStorage.setItem('shadow_match_best_streak', GameState.bestStreak);
        localStorage.setItem('shadow_match_games_played', GameState.gamesPlayed);
        localStorage.setItem('shadow_match_collection', JSON.stringify(GameState.collection));
        localStorage.setItem('shadow_match_settings', JSON.stringify(GameState.settings));
        localStorage.setItem('shadow_match_daily_streak', GameState.dailyStreak);
        localStorage.setItem('shadow_match_last_daily', GameState.lastDailyDate);
        localStorage.setItem('shadow_match_total_score', GameState.totalScore);
    } catch (e) {
        console.warn('Could not save state:', e);
    }
}

function loadState() {
    try {
        const hs = localStorage.getItem('shadow_match_high_score');
        if (hs !== null) GameState.highScore = parseInt(hs, 10) || 0;
        const hst = localStorage.getItem('shadow_match_highest_stage');
        if (hst !== null) GameState.highestStage = parseInt(hst, 10) || 0;
        const bs = localStorage.getItem('shadow_match_best_streak');
        if (bs !== null) GameState.bestStreak = parseInt(bs, 10) || 0;
        const gp = localStorage.getItem('shadow_match_games_played');
        if (gp !== null) GameState.gamesPlayed = parseInt(gp, 10) || 0;
        const col = localStorage.getItem('shadow_match_collection');
        if (col !== null) GameState.collection = JSON.parse(col) || [];
        const settings = localStorage.getItem('shadow_match_settings');
        if (settings !== null) GameState.settings = JSON.parse(settings);
        const ds = localStorage.getItem('shadow_match_daily_streak');
        if (ds !== null) GameState.dailyStreak = parseInt(ds, 10) || 0;
        const ld = localStorage.getItem('shadow_match_last_daily');
        if (ld !== null) GameState.lastDailyDate = ld;
        const ts = localStorage.getItem('shadow_match_total_score');
        if (ts !== null) GameState.totalScore = parseInt(ts, 10) || 0;
    } catch (e) {
        console.warn('Could not load state:', e);
    }
}

class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        // Register static SVG textures
        const svgToBase64 = (svg) => 'data:image/svg+xml;base64,' + btoa(svg);
        this.textures.addBase64('bg', svgToBase64(SVG_BG));
        this.textures.addBase64('tray', svgToBase64(SVG_TRAY));
        this.textures.addBase64('flame', svgToBase64(SVG_FLAME));
    }

    create() {
        loadState();
        AdManager.init();

        // Wait a tick for textures then go to menu
        this.time.delayedCall(100, () => {
            this.scene.start('MenuScene');
        });
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 428,
    height: 760,
    parent: 'game-container',
    backgroundColor: '#1A0A2E',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, UIScene],
    input: {
        activePointers: 3,
        touch: {
            capture: true
        }
    }
};

const game = new Phaser.Game(config);

// Visibility change handler - pause on background
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (game.scene.isActive('GameScene')) {
            game.scene.getScene('GameScene').scene.pause();
        }
    }
});

// Orientation change handler
window.addEventListener('resize', () => {
    if (game && game.scale) {
        game.scale.refresh();
    }
});
