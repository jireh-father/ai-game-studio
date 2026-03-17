// Echo Thief - Main Entry Point (MUST LOAD LAST)
class BootScene extends Phaser.Scene {
    constructor() { super('boot'); }

    create() {
        const textures = {};
        for (const [key, svg] of Object.entries(SVG_STRINGS)) {
            textures[key] = 'data:image/svg+xml;base64,' + btoa(svg);
        }

        let pending = 0;
        const total = Object.keys(textures).length;

        for (const [key, src] of Object.entries(textures)) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once('addtexture-' + key, () => {
                    if (--pending === 0) {
                        loadSettings();
                        this.scene.start('menu');
                    }
                });
                this.textures.addBase64(key, src);
            }
        }

        if (pending === 0) {
            loadSettings();
            this.scene.start('menu');
        }
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS.BG_HEX,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
    input: {
        activePointers: 1
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

const game = new Phaser.Game(config);

// Orientation handler
function checkOrientation() {
    const overlay = document.getElementById('rotate-overlay');
    if (!overlay) return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch && window.innerWidth > window.innerHeight) {
        overlay.style.visibility = 'visible';
        overlay.style.height = '100%';
    } else {
        overlay.style.visibility = 'hidden';
        overlay.style.height = '0';
        overlay.style.overflow = 'hidden';
    }
}

window.addEventListener('resize', checkOrientation);
checkOrientation();
