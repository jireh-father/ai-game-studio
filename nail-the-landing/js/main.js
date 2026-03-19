class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const textures = {
            player: `data:image/svg+xml;base64,${btoa(SVG_PLAYER)}`,
            player_stuck: `data:image/svg+xml;base64,${btoa(SVG_PLAYER_STUCK)}`,
            platform: `data:image/svg+xml;base64,${btoa(SVG_PLATFORM)}`,
            splat: `data:image/svg+xml;base64,${btoa(SVG_SPLAT)}`,
            particle_gold: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`,
            particle_green: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE_GREEN)}`,
            particle_blue: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE_BLUE)}`
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

const phaserConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0EA5E9',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, HUDScene, GameOverScene, HelpScene],
    input: {
        activePointers: 1
    },
    render: {
        antialias: true,
        pixelArt: false
    }
};

const game = new Phaser.Game(phaserConfig);

// Prevent default touch behavior
document.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
