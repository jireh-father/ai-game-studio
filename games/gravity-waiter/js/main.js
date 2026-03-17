// Gravity Waiter - Main Entry Point (BootScene + Phaser Config)

// Global state
window.GW = {
    highScore: 0,
    gamesPlayed: 0,
    muted: false
};

try {
    window.GW.highScore = parseInt(localStorage.getItem('gravity-waiter_high_score')) || 0;
} catch (e) {}

// BootScene - register ALL textures once
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const foodColors = CONFIG.FOOD_COLORS;
        const plateSvg = SVG.PLATE(foodColors[Math.floor(Math.random() * foodColors.length)]);

        const textures = {
            tray: `data:image/svg+xml;base64,${btoa(SVG.TRAY)}`,
            plate: `data:image/svg+xml;base64,${btoa(plateSvg)}`,
            fish: `data:image/svg+xml;base64,${btoa(SVG.FISH)}`,
            cake: `data:image/svg+xml;base64,${btoa(SVG.CAKE)}`,
            bowl: `data:image/svg+xml;base64,${btoa(SVG.BOWL)}`,
            strike_active: `data:image/svg+xml;base64,${btoa(SVG.STRIKE_ACTIVE)}`,
            strike_lost: `data:image/svg+xml;base64,${btoa(SVG.STRIKE_LOST)}`,
            particle: `data:image/svg+xml;base64,${btoa(SVG.PARTICLE)}`
        };

        let pending = 0;
        const keys = Object.keys(textures);
        const total = keys.length;

        for (const [key, src] of Object.entries(textures)) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once('addtexture-' + key, () => {
                    pending--;
                    if (pending === 0) {
                        this.scene.start('MenuScene');
                    }
                });
                this.textures.addBase64(key, src);
            }
        }

        if (pending === 0) {
            this.scene.start('MenuScene');
        }

        // Loading text
        this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'Loading...', {
            fontSize: '20px', color: '#2D2D2D', fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
}

// Initialize Ads Manager
AdsManager.init();

// Phaser Game Config
const gameConfig = {
    type: Phaser.AUTO,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: CONFIG.COLOR.BG_WALL,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
    input: {
        activePointers: 1
    },
    audio: {
        disableWebAudio: false
    }
};

const game = new Phaser.Game(gameConfig);
