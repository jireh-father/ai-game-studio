// Echo Thief - UI Scenes & HUD
class MenuScene extends Phaser.Scene {
    constructor() { super('menu'); }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        loadSettings();

        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG);

        // Ambient star dots
        for (let i = 0; i < 40; i++) {
            const dot = this.add.circle(
                Phaser.Math.Between(10, w - 10),
                Phaser.Math.Between(10, h - 10),
                Phaser.Math.FloatBetween(0.5, 1.5), COLORS.UI_TEXT_HEX, 0.2
            );
            this.tweens.add({
                targets: dot, alpha: { from: 0.1, to: 0.4 },
                duration: Phaser.Math.Between(1500, 3000), yoyo: true, repeat: -1
            });
        }

        // Sleeping creature silhouettes
        for (let i = 0; i < 3; i++) {
            if (this.textures.exists('creature')) {
                const c = this.add.image(80 + i * 100, h * 0.35 + i * 30, 'creature').setAlpha(0.3).setScale(0.8);
                this.tweens.add({ targets: c, scaleX: 0.84, scaleY: 0.84, duration: 2000, yoyo: true, repeat: -1, delay: i * 600 });
            }
        }

        // Title
        const title = this.add.text(w / 2, h * 0.2, 'ECHO THIEF', {
            fontSize: '36px', fontFamily: 'Arial', fill: COLORS.WAVE, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({ targets: title, alpha: { from: 0.7, to: 1 }, duration: 1200, yoyo: true, repeat: -1 });

        const subtitle = this.add.text(w / 2, h * 0.2 + 40, 'Sneak through the silence', {
            fontSize: '14px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
        }).setOrigin(0.5).setAlpha(0.7);

        // Play button
        const playBtn = this.add.rectangle(w / 2, h * 0.58, 180, 60, COLORS.WAVE_HEX, 1);
        const playText = this.add.text(w / 2, h * 0.58, 'PLAY', {
            fontSize: '26px', fontFamily: 'Arial', fill: COLORS.BG_HEX, fontStyle: 'bold'
        }).setOrigin(0.5);
        playBtn.setInteractive({ useHandCursor: true });
        playBtn.on('pointerdown', () => {
            GameState.currentScore = 0;
            GameState.currentStage = 1;
            GameState.hasUsedContinue = false;
            adManager.reset();
            this.scene.start('game');
        });

        // Help button
        const helpBtn = this.add.rectangle(50, h - 50, 60, 60, 0x222244, 0.8);
        this.add.text(50, h - 50, '?', {
            fontSize: '28px', fontFamily: 'Arial', fill: COLORS.WAVE
        }).setOrigin(0.5);
        helpBtn.setInteractive({ useHandCursor: true });
        helpBtn.on('pointerdown', () => {
            this.scene.start('help', { returnTo: 'menu' });
        });

        // High score display
        const trophyBtn = this.add.rectangle(w - 50, h - 50, 60, 60, 0x222244, 0.8);
        this.add.text(w - 50, h - 55, '\u{1F3C6}', {
            fontSize: '22px', fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.add.text(w - 50, h - 35, String(GameState.highScore), {
            fontSize: '12px', fontFamily: 'Arial', fill: COLORS.GOLD
        }).setOrigin(0.5);
        trophyBtn.setInteractive({ useHandCursor: true });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('gameover'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.stageReached = data.stage || 1;
        this.canContinue = data.canContinue || false;
    }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG, 0.92);

        // Check high score
        const isNewBest = this.finalScore > GameState.highScore;
        if (isNewBest) GameState.highScore = this.finalScore;
        GameState.gamesPlayed++;
        saveSettings();
        adManager.onDeath();

        // Burst heading with shake
        const burstText = this.add.text(w / 2, h * 0.15, 'BURST!', {
            fontSize: '42px', fontFamily: 'Arial', fill: '#FF1111', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.cameras.main.shake(300, 0.01);

        // Score animated count-up
        const scoreDisplay = this.add.text(w / 2, h * 0.3, 'Score: 0', {
            fontSize: '28px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
        }).setOrigin(0.5);
        let displayScore = 0;
        this.tweens.addCounter({
            from: 0, to: this.finalScore, duration: 600,
            onUpdate: (t) => {
                displayScore = Math.floor(t.getValue());
                scoreDisplay.setText('Score: ' + displayScore);
            }
        });

        // Best score
        const bestColor = isNewBest ? COLORS.GOLD : COLORS.UI_TEXT;
        this.add.text(w / 2, h * 0.38, 'Best: ' + GameState.highScore, {
            fontSize: '18px', fontFamily: 'Arial', fill: bestColor
        }).setOrigin(0.5);
        if (isNewBest) {
            const badge = this.add.text(w / 2, h * 0.43, 'NEW BEST!', {
                fontSize: '16px', fontFamily: 'Arial', fill: COLORS.GOLD, fontStyle: 'bold'
            }).setOrigin(0.5);
            this.tweens.add({ targets: badge, scaleX: 1.3, scaleY: 1.3, duration: 300, yoyo: true, repeat: 2 });
        }

        this.add.text(w / 2, h * 0.48, 'Stage Reached: ' + this.stageReached, {
            fontSize: '14px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
        }).setOrigin(0.5).setAlpha(0.7);

        let btnY = h * 0.58;

        // Continue button (ad-powered)
        if (this.canContinue && adManager.canContinue()) {
            const contBtn = this.add.rectangle(w / 2, btnY, 200, 50, COLORS.GOLD_HEX, 1);
            this.add.text(w / 2, btnY, 'CONTINUE (Ad)', {
                fontSize: '18px', fontFamily: 'Arial', fill: COLORS.BG_HEX, fontStyle: 'bold'
            }).setOrigin(0.5);
            contBtn.setInteractive({ useHandCursor: true });
            contBtn.on('pointerdown', () => {
                adManager.showContinueAd(() => {
                    this.scene.stop('gameover');
                    this.scene.stop('game');
                    this.scene.start('game', { continueRun: true, score: this.finalScore, stage: this.stageReached });
                });
            });
            btnY += 65;
        }

        // Play Again
        const playBtn = this.add.rectangle(w / 2, btnY, 180, 50, COLORS.WAVE_HEX, 1);
        this.add.text(w / 2, btnY, 'PLAY AGAIN', {
            fontSize: '20px', fontFamily: 'Arial', fill: COLORS.BG_HEX, fontStyle: 'bold'
        }).setOrigin(0.5);
        playBtn.setInteractive({ useHandCursor: true });
        playBtn.on('pointerdown', () => {
            GameState.currentScore = 0;
            GameState.currentStage = 1;
            GameState.hasUsedContinue = false;
            adManager.reset();
            this.scene.stop('gameover');
            this.scene.stop('game');
            this.scene.start('game');
        });
        btnY += 60;

        // Menu
        const menuBtn = this.add.rectangle(w / 2, btnY, 120, 40, 0x333355, 0.8);
        this.add.text(w / 2, btnY, 'MENU', {
            fontSize: '16px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
        }).setOrigin(0.5);
        menuBtn.setInteractive({ useHandCursor: true });
        menuBtn.on('pointerdown', () => {
            this.scene.stop('gameover');
            this.scene.stop('game');
            this.scene.start('menu');
        });
    }
}
