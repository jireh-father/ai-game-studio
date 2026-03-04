// Stack Panic - Entry Point, Phaser Config, Storage

class StorageManager {
    static _key(k) { return `stack-panic_${k}`; }

    static getHighScore() {
        return parseInt(localStorage.getItem(this._key('high_score')) || '0', 10);
    }
    static setHighScore(v) {
        localStorage.setItem(this._key('high_score'), v.toString());
    }
    static getGamesPlayed() {
        return parseInt(localStorage.getItem(this._key('games_played')) || '0', 10);
    }
    static incrementGamesPlayed() {
        const n = this.getGamesPlayed() + 1;
        localStorage.setItem(this._key('games_played'), n.toString());
        return n;
    }
    static getSettings() {
        try {
            const raw = localStorage.getItem(this._key('settings'));
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return { sound: true, music: true, vibration: true };
    }
    static saveSettings(s) {
        localStorage.setItem(this._key('settings'), JSON.stringify(s));
    }
    static saveSetting(key, val) {
        const s = this.getSettings();
        s[key] = val;
        this.saveSettings(s);
    }
}

// BootScene: preload SVG textures (creates a small particle texture)
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // Generate a simple 4x4 white particle texture
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xFFFFFF);
        g.fillRect(0, 0, 4, 4);
        g.generateTexture('particle', 4, 4);
        g.destroy();

        // Apply stored settings
        const settings = StorageManager.getSettings();
        audioManager.enabled = settings.sound;

        // Init ad manager
        adManager.init();

        this.scene.start('MenuScene');
    }
}

// Phaser Game Config
const gameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: COLORS_HEX.background,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 2.5 },
            debug: false,
            enableSleeping: true,
            positionIterations: 16,
            velocityIterations: 10,
            constraintIterations: 4
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    input: {
        activePointers: 1,
    },
    render: {
        antialias: true,
        pixelArt: false,
    },
    disableContextMenu: true,
};

// Wait for DOM
window.addEventListener('load', () => {
    const game = new Phaser.Game(gameConfig);

    // Visibility change: pause/resume
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.scene.scenes.forEach(s => {
                if (s.scene.isActive() && s.matter && s.matter.world) {
                    s.matter.world.pause();
                }
            });
        } else {
            game.scene.scenes.forEach(s => {
                if (s.scene.isActive() && s.matter && s.matter.world && !s.paused) {
                    s.matter.world.resume();
                }
            });
        }
    });
});
