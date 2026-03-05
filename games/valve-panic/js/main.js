// Valve Panic - Boot Scene & Phaser Config (LOADED LAST)

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Register all SVG textures once
        const textures = {
            particle: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE)}`,
            spark: `data:image/svg+xml;base64,${btoa(SVG.SPARK)}`,
            fragment: `data:image/svg+xml;base64,${btoa(SVG.FRAGMENT)}`,
            droplet: `data:image/svg+xml;base64,${btoa(SVG.DROPLET)}`
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
const gameConfig = {
    type: Phaser.CANVAS,
    width: CONFIG.GAME_WIDTH,
    height: CONFIG.GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2D3436',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene, PauseScene],
    input: {
        activePointers: 1
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

// Initialize game
const game = new Phaser.Game(gameConfig);

// Handle orientation / resize
window.addEventListener('resize', () => {
    if (game && game.scale) {
        game.scale.refresh();
    }
});
