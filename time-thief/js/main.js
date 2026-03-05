// main.js - BootScene, Phaser init, scene registration (loads LAST)
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Register all SVG textures once
        const textures = {};
        for (const [key, svg] of Object.entries(SVG_STRINGS)) {
            textures[key] = `data:image/svg+xml;base64,${btoa(svg)}`;
        }

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

// Phaser configuration
const gameConfig = {
    type: Phaser.CANVAS,
    parent: 'game-container',
    width: 360,
    height: 640,
    backgroundColor: '#0A0A1A',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene, HelpScene],
    input: {
        activePointers: 2
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

const game = new Phaser.Game(gameConfig);

// Handle resize/orientation
window.addEventListener('resize', () => {
    game.scale.refresh();
});
