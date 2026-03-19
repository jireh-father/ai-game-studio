// Grocery Gamble - Boot Scene & Phaser Init

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Register all SVG textures
        const textures = {
            scale: `data:image/svg+xml;base64,${btoa(SVG_SCALE)}`,
            cashier_normal: `data:image/svg+xml;base64,${btoa(SVG_CASHIER_NORMAL)}`,
            cashier_angry: `data:image/svg+xml;base64,${btoa(SVG_CASHIER_ANGRY)}`,
            particle: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`,
            particle_red: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE_RED)}`
        };

        // Add all item SVGs
        for (const [key, svg] of Object.entries(SVG_ITEMS)) {
            textures[key] = `data:image/svg+xml;base64,${btoa(svg)}`;
        }

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

        // Load high score
        try {
            const saved = localStorage.getItem('grocery-gamble_high_score');
            if (saved) GameState.highScore = parseInt(saved, 10) || 0;
        } catch(e) {}
    }
}

// Phaser configuration
const phaserConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#F5F5F0',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, HUDScene, GameOverScene],
    input: {
        activePointers: 1
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

const game = new Phaser.Game(phaserConfig);
