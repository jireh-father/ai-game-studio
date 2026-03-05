// main.js - BootScene (register textures), Phaser init, scene array
// MUST load LAST in index.html

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Register all SVG textures once
        const textures = {
            taxi: `data:image/svg+xml;base64,${btoa(SVG_TAXI)}`,
            passenger: `data:image/svg+xml;base64,${btoa(SVG_PASSENGER)}`,
            target: `data:image/svg+xml;base64,${btoa(SVG_TARGET)}`,
            building: `data:image/svg+xml;base64,${btoa(SVG_BUILDING)}`,
            particle: `data:image/svg+xml;base64,${btoa(SVG_PARTICLE)}`
        };

        let pending = 0;
        const total = Object.keys(textures).length;

        for (const [key, src] of Object.entries(textures)) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once(`addtexture-${key}`, () => {
                    if (--pending === 0) this.onTexturesReady();
                });
                this.textures.addBase64(key, src);
            }
        }

        if (pending === 0) this.onTexturesReady();
    }

    onTexturesReady() {
        GameState.init();
        this.scene.start('MenuScene');
    }
}

// Phaser Game Configuration
const gameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: PALETTE.BG_HEX,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
    render: {
        pixelArt: false,
        antialias: true
    },
    input: {
        activePointers: 1
    }
};

// Initialize game
const game = new Phaser.Game(gameConfig);

// Prevent pull-to-refresh and other touch defaults
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// Visibility change - pause/resume
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (game.scene.isActive('GameScene')) {
            const gs = game.scene.getScene('GameScene');
            if (gs && !gs.paused) gs.togglePause();
        }
        audioSynth.stopMusic();
    }
});

// Orientation change handler
window.addEventListener('resize', () => {
    if (game && game.scale) {
        game.scale.refresh();
    }
});
