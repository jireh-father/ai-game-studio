// main.js - BootScene, Phaser config, scene registration, global state (LOADS LAST)

// Global Game State
const GameState = {
    score: 0,
    highScore: 0,
    currentMaze: 1,
    bestMaze: 1,
    totalStars: 0,
    gamesPlayed: 0,
    selectedSkin: 0,
    settings: { sound: true, vibration: true }
};

function loadGameState() {
    try {
        const data = localStorage.getItem('gravity-flip-maze_state');
        if (data) {
            const saved = JSON.parse(data);
            GameState.highScore = saved.highScore || 0;
            GameState.bestMaze = saved.bestMaze || 1;
            GameState.totalStars = saved.totalStars || 0;
            GameState.gamesPlayed = saved.gamesPlayed || 0;
            GameState.selectedSkin = saved.selectedSkin || 0;
            if (saved.settings) {
                GameState.settings.sound = saved.settings.sound !== false;
                GameState.settings.vibration = saved.settings.vibration !== false;
            }
        }
    } catch (e) { console.warn('Failed to load state:', e); }
}

function saveGameState() {
    try {
        localStorage.setItem('gravity-flip-maze_state', JSON.stringify({
            highScore: GameState.highScore,
            bestMaze: GameState.bestMaze,
            totalStars: GameState.totalStars,
            gamesPlayed: GameState.gamesPlayed,
            selectedSkin: GameState.selectedSkin,
            settings: GameState.settings
        }));
    } catch (e) { console.warn('Failed to save state:', e); }
}

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        this.texturesLoaded = 0;
        this.texturesNeeded = 6;

        const svgs = [
            { key: 'ball', svg: SVG_STRINGS.BALL },
            { key: 'gem', svg: SVG_STRINGS.GEM },
            { key: 'spike', svg: SVG_STRINGS.SPIKE },
            { key: 'exit', svg: SVG_STRINGS.EXIT },
            { key: 'star', svg: SVG_STRINGS.STAR },
            { key: 'star_empty', svg: SVG_STRINGS.STAR_EMPTY }
        ];

        svgs.forEach(({ key, svg }) => {
            const dataUri = 'data:image/svg+xml;base64,' + btoa(svg);
            this.textures.once('addtexture-' + key, () => {
                this.texturesLoaded++;
                if (this.texturesLoaded >= this.texturesNeeded) {
                    this.scene.start('MenuScene');
                }
            });
            this.textures.addBase64(key, dataUri);
        });

        // Fallback timeout
        setTimeout(() => {
            if (this.scene.isActive('BootScene')) {
                this.scene.start('MenuScene');
            }
        }, 3000);
    }
}

// Load saved state
loadGameState();

// Phaser config
const phaserConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#0A0E1A',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_CONFIG.GAME_WIDTH,
        height: GAME_CONFIG.GAME_HEIGHT
    },
    scene: [BootScene, MenuScene, GameScene, HelpScene]
};

const game = new Phaser.Game(phaserConfig);

// Visibility change handler - pause when tab hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        game.scene.scenes.forEach(s => {
            if (s.scene.isActive() && s.paused !== undefined) {
                s.paused = true;
            }
        });
    }
});

// Orientation change handler
window.addEventListener('resize', () => {
    if (game && game.scale) {
        game.scale.refresh();
    }
});
