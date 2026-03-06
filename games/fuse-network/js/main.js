// main.js - BootScene, Phaser init, scene registration (loads LAST)
const GameState = {
    score: 0, stage: 1, hp: GAME_CONFIG.INITIAL_HP,
    highScore: 0, bestStage: 0, bestCombo: 0, bestComboThisGame: 0,
    combo: 0, hasKit: false, kitUsed: false,
    settings: { sound: true }
};

// Load saved data
try {
    const hs = localStorage.getItem('fuse_network_high_score');
    if (hs) GameState.highScore = parseInt(hs) || 0;
    const bs = localStorage.getItem('fuse_network_best_stage');
    if (bs) GameState.bestStage = parseInt(bs) || 0;
    const bc = localStorage.getItem('fuse_network_best_combo');
    if (bc) GameState.bestCombo = parseInt(bc) || 0;
    const st = localStorage.getItem('fuse_network_settings');
    if (st) GameState.settings = JSON.parse(st);
} catch (e) {}

class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        const svgEntries = [
            ['bomb', SVG_STRINGS.BOMB],
            ['base', SVG_STRINGS.BASE],
            ['base_damaged', SVG_STRINGS.BASE_DAMAGED],
            ['node', SVG_STRINGS.NODE],
            ['safe_zone', SVG_STRINGS.SAFE_ZONE],
            ['cut_mark', SVG_STRINGS.CUT_MARK],
            ['shield_full', SVG_STRINGS.SHIELD_FULL],
            ['shield_empty', SVG_STRINGS.SHIELD_EMPTY],
            ['kit', SVG_STRINGS.KIT]
        ];

        this._loadedCount = 0;
        this._totalCount = svgEntries.length;

        for (const [key, svg] of svgEntries) {
            const encoded = 'data:image/svg+xml;base64,' + btoa(svg);
            this.textures.addBase64(key, encoded);
        }

        // Listen for texture load events
        for (const [key] of svgEntries) {
            this.textures.on('addtexture-' + key, () => {
                this._loadedCount++;
                if (this._loadedCount >= this._totalCount) {
                    this.scene.start('MenuScene');
                }
            });
        }
    }

    create() {
        const w = this.scale.width; const h = this.scale.height;
        this.add.text(w / 2, h / 2, 'Loading...', {
            fontSize: '20px', fontFamily: 'Arial', color: '#00AAFF'
        }).setOrigin(0.5);

        // Fallback: if textures loaded before listeners registered
        setTimeout(() => {
            if (this.scene.isActive('BootScene')) {
                this.scene.start('MenuScene');
            }
        }, 2000);
    }
}

const gameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game-container',
        width: 390,
        height: 700
    },
    backgroundColor: COLORS.BACKGROUND,
    scene: [BootScene, MenuScene, GameScene, GameOverScene, HelpScene],
    input: { activePointers: 2 }
};

const game = new Phaser.Game(gameConfig);

window.addEventListener('resize', () => {
    if (game && game.scale) game.scale.refresh();
});
