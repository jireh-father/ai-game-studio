// Balloon Pump Panic - Main Entry (BootScene + Phaser Config)
// MUST LOAD LAST

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Register all SVG textures once
        const textureMap = {};
        for (const [key, svg] of Object.entries(SVG_STRINGS)) {
            textureMap[key] = 'data:image/svg+xml;base64,' + btoa(svg);
        }

        let pending = 0;
        const keys = Object.keys(textureMap);
        const total = keys.length;

        for (const [key, src] of Object.entries(textureMap)) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once('addtexture-' + key, () => {
                    if (--pending === 0) this.startGame();
                });
                this.textures.addBase64(key, src);
            }
        }

        if (pending === 0) this.startGame();
    }

    startGame() {
        // Apply saved settings
        const settings = loadStorage(STORAGE_KEYS.settings, { sound: true });
        this.sound.mute = !settings.sound;
        this.scene.start('MenuScene');
    }
}

// Phaser Game Configuration
const gameConfig = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#FFF8E1',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, HUDScene, GameOverScene, HelpScene],
    input: {
        activePointers: 3
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

const game = new Phaser.Game(gameConfig);

// Handle orientation / resize
window.addEventListener('resize', () => {
    if (game && game.scale) {
        game.scale.refresh();
    }
});
