// main.js - BootScene, Phaser config, localStorage I/O (MUST LOAD LAST)

class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Register all SVG textures once
        const textures = {};
        for (const key of TEXTURE_KEYS) {
            if (SVG_STRINGS[key]) {
                textures[key] = 'data:image/svg+xml;base64,' + btoa(SVG_STRINGS[key]);
            }
        }

        const keys = Object.keys(textures);
        let pending = 0;
        const total = keys.length;

        const tryStart = () => {
            if (--pending === 0) {
                this.scene.start('MenuScene');
            }
        };

        for (const key of keys) {
            if (!this.textures.exists(key)) {
                pending++;
                this.textures.once('addtexture-' + key, tryStart);
                this.textures.addBase64(key, textures[key]);
            }
        }

        if (pending === 0) {
            this.scene.start('MenuScene');
        }
    }
}

// localStorage I/O
function loadHighScore() {
    try { return parseInt(localStorage.getItem('sequence-lock_high_score') || '0', 10); } catch(e) { return 0; }
}
function saveHighScore(score) {
    try { localStorage.setItem('sequence-lock_high_score', String(score)); } catch(e) {}
}
function loadHighStage() {
    try { return parseInt(localStorage.getItem('sequence-lock_highest_stage') || '0', 10); } catch(e) { return 0; }
}
function saveHighStage(stage) {
    try { localStorage.setItem('sequence-lock_highest_stage', String(stage)); } catch(e) {}
}
function loadSettings() {
    try { return JSON.parse(localStorage.getItem('sequence-lock_settings') || '{}'); } catch(e) { return {}; }
}
function saveSettings(obj) {
    try { localStorage.setItem('sequence-lock_settings', JSON.stringify(obj)); } catch(e) {}
}

window.loadHighScore = loadHighScore;
window.saveHighScore = saveHighScore;
window.loadHighStage = loadHighStage;
window.saveHighStage = saveHighStage;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;

// Load settings on startup
window.GameSettings = loadSettings();

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.BG,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene],
    input: {
        activePointers: 1
    }
};

const game = new Phaser.Game(config);
