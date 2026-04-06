// Sneeze Guard - Main Entry Point (LOADED LAST)

// Game State - persistent within session
const GameState = {
    score: 0,
    stage: 1,
    hygiene: CONFIG.MAX_HYGIENE,
    streak: 0,
    highScore: parseInt(localStorage.getItem('sneeze-guard_high_score') || '0'),
    gamesPlayed: 0,
    soundOn: true
};

// Load saved settings
try {
    const saved = JSON.parse(localStorage.getItem('sneeze-guard_settings') || '{}');
    if (saved.soundOn !== undefined) GameState.soundOn = saved.soundOn;
} catch (e) {}

// BootScene - register ALL textures once at startup
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const textures = {
            'patron_neutral': `data:image/svg+xml;base64,${btoa(SVG.PATRON_NEUTRAL)}`,
            'patron_windup1': `data:image/svg+xml;base64,${btoa(SVG.PATRON_WINDUP1)}`,
            'patron_windup2': `data:image/svg+xml;base64,${btoa(SVG.PATRON_WINDUP2)}`,
            'guard': `data:image/svg+xml;base64,${btoa(SVG.GUARD)}`,
            'tray': `data:image/svg+xml;base64,${btoa(SVG.TRAY)}`,
            'tray_red': `data:image/svg+xml;base64,${btoa(SVG.TRAY_RED)}`,
            'snot_splat': `data:image/svg+xml;base64,${btoa(SVG.SNOT_SPLAT)}`,
            'exclamation': `data:image/svg+xml;base64,${btoa(SVG.EXCLAMATION)}`,
            'heart_full': `data:image/svg+xml;base64,${btoa(SVG.HEART.replace('FILL_COLOR', CONFIG.COLOR.HEART_FULL))}`,
            'heart_empty': `data:image/svg+xml;base64,${btoa(SVG.HEART.replace('FILL_COLOR', CONFIG.COLOR.HEART_EMPTY))}`,
            'particle': `data:image/svg+xml;base64,${btoa(SVG.PARTICLE)}`
        };

        let pending = 0;
        const total = Object.keys(textures).length;

        for (const [key, src] of Object.entries(textures)) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once(`addtexture-${key}`, () => {
                    if (--pending === 0) {
                        this.scene.start('MenuScene');
                    }
                });
                this.textures.addBase64(key, src);
            }
        }

        if (pending === 0) {
            this.scene.start('MenuScene');
        }
    }
}

// Phaser Game Configuration
const phaserConfig = {
    type: Phaser.AUTO,
    width: CONFIG.GAME_WIDTH,
    height: CONFIG.GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: CONFIG.COLOR.BG,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, HUDScene, GameOverScene],
    input: {
        activePointers: 2
    }
};

const game = new Phaser.Game(phaserConfig);
