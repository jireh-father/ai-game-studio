// Sum Sniper - Main (BootScene + Phaser Config)
// MUST be loaded LAST

const GameState = {
    score: 0,
    stage: 1,
    strikes: 0,
    combo: 0,
    highScore: 0,
    soundEnabled: true
};

// Load high score from localStorage
try {
    const saved = localStorage.getItem('sum-sniper_high_score');
    if (saved) GameState.highScore = parseInt(saved, 10) || 0;
} catch(e) {}

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const textures = {};
        for (const [key, svg] of Object.entries(SVG_STRINGS)) {
            textures[key] = 'data:image/svg+xml;base64,' + btoa(svg);
        }

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

const phaserConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.BG,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene, HUDScene]
};

const game = new Phaser.Game(phaserConfig);
