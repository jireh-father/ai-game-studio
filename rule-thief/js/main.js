// main.js - BootScene, Phaser config, GameState global, localStorage (LOADS LAST)

const GameState = {
    score: 0,
    highScore: parseInt(localStorage.getItem('rule_thief_high_score') || '0'),
    lives: MAX_LIVES,
    stage: 1,
    ruleStreak: 0,
    bestStreakThisGame: 0,
    rulesThisGame: 0,
    gamesPlayed: parseInt(localStorage.getItem('rule_thief_games_played') || '0'),
    hintsRemaining: HINTS_PER_RULE,
    settings: {
        sound: true
    }
};

// Load settings from localStorage
(function loadSettings() {
    try {
        const saved = localStorage.getItem('rule_thief_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            GameState.settings.sound = parsed.sound !== false;
        }
    } catch (e) { /* ignore */ }
})();

function saveGameState() {
    try {
        localStorage.setItem('rule_thief_settings', JSON.stringify(GameState.settings));
    } catch (e) { /* ignore */ }
}

// BootScene - register all SVG textures once
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        // Show loading text
        const w = this.scale.width, h = this.scale.height;
        this.add.text(w / 2, h / 2, 'Loading...', { fontSize: '20px', fontFamily: 'Arial',
            color: COLORS.TEXT }).setOrigin(0.5);
    }

    create() {
        const keys = Object.keys(SVG_STRINGS);
        let loaded = 0;
        const total = keys.length;

        keys.forEach(key => {
            const svgStr = SVG_STRINGS[key];
            const encoded = 'data:image/svg+xml;base64,' + btoa(svgStr);

            this.textures.once(`addtexture-${key}`, () => {
                loaded++;
                if (loaded >= total) {
                    this.scene.start('MenuScene');
                }
            });

            this.textures.addBase64(key, encoded);
        });

        // Fallback if no SVGs (shouldn't happen)
        if (total === 0) {
            this.scene.start('MenuScene');
        }
    }
}

// GameOverScene
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = (data && data.score) || 0;
        this.highScore = (data && data.highScore) || 0;
        this.finalStage = (data && data.stage) || 1;
        this.rulesThisGame = (data && data.rulesThisGame) || 0;
        this.bestStreak = (data && data.bestStreak) || 0;
        this.reason = (data && data.reason) || 'lives';
        this.isNewHigh = (data && data.isNewHigh) || false;
    }

    create() {
        incrementGameOverCount();
        resetAdStatePerGame();

        const w = this.scale.width, h = this.scale.height;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.95);

        // Game Over title
        this.add.text(w / 2, 80, 'GAME OVER', { fontSize: '32px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.WRONG }).setOrigin(0.5);

        // Reason
        const reasonText = this.reason === 'timer' ? 'Time ran out!' : 'Out of lives!';
        this.add.text(w / 2, 115, reasonText, { fontSize: '14px', fontFamily: 'Arial',
            color: COLORS.ACCENT }).setOrigin(0.5);

        // Score with count-up animation
        this.scoreDisplay = this.add.text(w / 2, 165, '0', { fontSize: '48px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.TEXT }).setOrigin(0.5);
        this.tweens.addCounter({ from: 0, to: this.finalScore, duration: 800, ease: 'Quad.Out',
            onUpdate: (tween) => {
                if (this.scoreDisplay && this.scoreDisplay.active)
                    this.scoreDisplay.setText(Math.round(tween.getValue()).toString());
            }
        });

        // New high score indicator
        if (this.isNewHigh && this.finalScore > 0) {
            const newBest = this.add.text(w / 2, 200, 'NEW BEST!', { fontSize: '20px',
                fontFamily: 'Arial', fontStyle: 'bold', color: '#E9C46A' }).setOrigin(0.5);
            this.tweens.add({ targets: newBest, alpha: 0.5, duration: 300, yoyo: true, repeat: -1 });
        }

        // Stats
        let statY = 235;
        this.add.text(w / 2, statY, `Rules Cracked: ${this.rulesThisGame}`, { fontSize: '16px',
            fontFamily: 'Arial', color: COLORS.ACCENT }).setOrigin(0.5);
        statY += 28;
        this.add.text(w / 2, statY, `Best Streak: ${this.bestStreak}`, { fontSize: '16px',
            fontFamily: 'Arial', color: '#E9C46A' }).setOrigin(0.5);
        statY += 28;
        this.add.text(w / 2, statY, `Stage ${this.finalStage}`, { fontSize: '16px',
            fontFamily: 'Arial', color: COLORS.ACCENT }).setOrigin(0.5);

        // Continue button (rewarded ad - extra life)
        let btnY = 340;
        if (canShowExtraLife() && this.reason === 'lives') {
            const contBtn = this.add.rectangle(w / 2, btnY, 220, 45, 0xE9C46A, 1)
                .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xFFFFFF);
            this.add.text(w / 2, btnY, 'Watch Ad for Extra Life', { fontSize: '14px',
                fontFamily: 'Arial', fontStyle: 'bold', color: '#0D1B2A' }).setOrigin(0.5);
            contBtn.on('pointerdown', () => {
                playButtonSound();
                onExtraLifeGranted();
                // In production: showRewarded('extra_life', ...) then resume
                console.log('[AD] Extra life rewarded ad');
                contBtn.disableInteractive().setAlpha(0.3);
            });
            btnY += 60;
        }

        // Play Again button
        const playBtn = this.add.rectangle(w / 2, btnY, 200, 50, 0x2A9D8F, 1)
            .setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'Play Again', { fontSize: '20px', fontFamily: 'Arial',
            fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
        playBtn.on('pointerdown', () => {
            playButtonSound();
            if (shouldShowInterstitial()) {
                showInterstitial(() => this.scene.start('GameScene'));
            } else {
                this.scene.start('GameScene');
            }
        });
        btnY += 60;

        // Menu button
        const menuBtn = this.add.rectangle(w / 2, btnY, 200, 50, 0x1B2838, 1)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xA8DADC);
        this.add.text(w / 2, btnY, 'Menu', { fontSize: '20px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.TEXT }).setOrigin(0.5);
        menuBtn.on('pointerdown', () => {
            playButtonSound();
            this.scene.start('MenuScene');
        });
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game-container',
    backgroundColor: COLORS.BG,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, HelpScene, GameScene, UIScene, GameOverScene],
    audio: { noAudio: true } // We use Web Audio API directly
};

const game = new Phaser.Game(config);

// Visibility change - pause when backgrounded
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        const gameScene = game.scene.getScene('GameScene');
        if (gameScene && gameScene.scene.isActive() && !gameScene.paused && !gameScene.gameOver) {
            gameScene.togglePause();
        }
    }
});
