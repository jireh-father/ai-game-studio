// Permission Denied - Main Entry Point (BootScene + Phaser Config)

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        GameState.loadHighScore();

        // Register all SVG textures
        const textures = {
            cursor: `data:image/svg+xml;base64,${btoa(SVG_CURSOR)}`,
            warningIcon: `data:image/svg+xml;base64,${btoa(SVG_WARNING_ICON)}`,
            timeoutScreen: `data:image/svg+xml;base64,${btoa(SVG_TIMEOUT_SCREEN)}`,
            particle: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`
        };

        let pending = 0;
        const total = Object.keys(textures).length;

        for (const [key, src] of Object.entries(textures)) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once(`addtexture-${key}`, () => {
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
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.DESKTOP_TEAL_HEX,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, HUDScene, GameOverScene, HelpScene],
    audio: {
        disableWebAudio: false
    },
    input: {
        activePointers: 2
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

const game = new Phaser.Game(phaserConfig);

// Prevent pull-to-refresh
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('#game-container')) e.preventDefault();
}, { passive: false });
