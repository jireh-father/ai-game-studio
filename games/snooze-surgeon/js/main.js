// Global game state
const GameState = {
    score: 0,
    highScore: loadHighScore(),
    stage: 1,
    lives: 3,
    comboStreak: 0,
    gamesPlayed: 0,
    soundEnabled: true,
    musicEnabled: true,

    reset: function() {
        this.score = 0;
        this.stage = 1;
        this.lives = 3;
        this.comboStreak = 0;
        this.gamesPlayed++;
    }
};

function loadHighScore() {
    try { return parseInt(localStorage.getItem('snooze-surgeon_high_score')) || 0; }
    catch (e) { return 0; }
}

function saveHighScore(score) {
    try { localStorage.setItem('snooze-surgeon_high_score', score.toString()); }
    catch (e) {}
}

// BootScene: register all textures once
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        const textures = {
            patient: PATIENT_SVG,
            organ_heart: ORGAN_SVG,
            organ_lung: ORGAN_LUNG_SVG,
            organ_stomach: ORGAN_STOMACH_SVG,
            organ_fake: FAKE_ORGAN_SVG,
            scalpel: SCALPEL_SVG,
            zzz_cloud: ZZZ_CLOUD_SVG,
            heart_full: HEART_FULL_SVG,
            heart_empty: HEART_EMPTY_SVG,
            nose_highlight: NOSE_HIGHLIGHT_SVG,
            particle: PARTICLE_SVG,
            particle_green: PARTICLE_GREEN_SVG,
            particle_pink: PARTICLE_PINK_SVG,
            particle_gold: PARTICLE_GOLD_SVG
        };

        let pending = 0;
        const keys = Object.keys(textures);
        const total = keys.length;

        for (const key of keys) {
            if (!this.textures.exists(key)) {
                pending++;
                const src = `data:image/svg+xml;base64,${btoa(textures[key])}`;
                this.textures.once(`addtexture-${key}`, () => {
                    pending--;
                    if (pending === 0) this.scene.start('MenuScene');
                });
                this.textures.addBase64(key, src);
            }
        }

        if (pending === 0) this.scene.start('MenuScene');
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.BG,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
        min: { width: 320, height: 640 },
        max: { width: 428, height: 926 }
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, GameOverScene],
    audio: {
        disableWebAudio: false
    },
    input: {
        activePointers: 3
    }
};

const game = new Phaser.Game(config);

// Prevent pull-to-refresh
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
