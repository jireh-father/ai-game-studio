window.GameState = {
    score: 0,
    stage: 1,
    highScore: parseInt(localStorage.getItem('cat-burglar_high_score') || '0'),
    gamesPlayed: 0,
    continueUsed: false,
    muted: false
};

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const textures = {
            cat: `data:image/svg+xml;base64,${btoa(SVG_CAT)}`,
            dog_sleep: `data:image/svg+xml;base64,${btoa(SVG_DOG_SLEEP)}`,
            dog_awake: `data:image/svg+xml;base64,${btoa(SVG_DOG_AWAKE)}`,
            shelf: `data:image/svg+xml;base64,${btoa(SVG_SHELF)}`,
            item_cheap: `data:image/svg+xml;base64,${btoa(SVG_ITEMS.cheap)}`,
            item_mid: `data:image/svg+xml;base64,${btoa(SVG_ITEMS.mid)}`,
            item_valuable: `data:image/svg+xml;base64,${btoa(SVG_ITEMS.valuable)}`,
            item_heirloom: `data:image/svg+xml;base64,${btoa(SVG_ITEMS.heirloom)}`,
            item_precious: `data:image/svg+xml;base64,${btoa(SVG_ITEMS.precious)}`,
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

const gameConfig = {
    type: Phaser.AUTO,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1A1A2E',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
    input: {
        activePointers: 2
    },
    render: {
        antialias: true,
        pixelArt: false
    }
};

const game = new Phaser.Game(gameConfig);

document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'CANVAS') e.preventDefault();
}, { passive: false });
