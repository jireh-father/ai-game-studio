// Sum Sniper - UI Scenes (Menu, GameOver, HUD)
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

        // Crosshair decoration
        this.add.circle(w / 2, h / 3 - 30, 50, 0x000000, 0).setStrokeStyle(2, 0x00D4FF);
        this.add.line(w / 2, h / 3 - 30, -20, 0, 20, 0, 0x00D4FF).setLineWidth(1);
        this.add.line(w / 2, h / 3 - 30, 0, -20, 0, 20, 0x00D4FF).setLineWidth(1);

        this.add.text(w / 2, h / 3 + 30, 'SUM SNIPER', {
            fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        this.add.text(w / 2, h / 3 + 65, 'Tap numbers that add up to the target', {
            fontSize: '13px', fontFamily: 'Arial', color: '#8899AA'
        }).setOrigin(0.5);

        // High score
        const hs = GameState.highScore || 0;
        this.add.text(w / 2, h / 2, 'BEST: ' + hs, {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.SCORE_GOLD
        }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.rectangle(w / 2, h / 2 + 70, 280, 60, 0x4A1FA8).setInteractive({ useHandCursor: true });
        playBtn.setStrokeStyle(2, 0x6B3FC9);
        this.add.text(w / 2, h / 2 + 70, 'PLAY', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        playBtn.on('pointerdown', () => {
            this.scene.stop('MenuScene');
            this.scene.start('GameScene');
        });

        // Help button
        const helpBtn = this.add.circle(w - 36, 36, 20, 0x2E4A6B).setInteractive({ useHandCursor: true });
        this.add.text(w - 36, 36, '?', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        helpBtn.on('pointerdown', () => {
            this.scene.pause('MenuScene');
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // Sound toggle
        const soundTxt = this.add.text(36, 36, GameState.soundEnabled ? 'SND' : 'MUTE', {
            fontSize: '14px', fontFamily: 'Arial', color: COLORS.UI_TEXT
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        soundTxt.on('pointerdown', () => {
            GameState.soundEnabled = !GameState.soundEnabled;
            soundTxt.setText(GameState.soundEnabled ? 'SND' : 'MUTE');
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalStage = data.stage || 1;
    }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.92).setDepth(0);

        const isNewHigh = this.finalScore > (GameState.highScore || 0);
        if (isNewHigh) {
            GameState.highScore = this.finalScore;
            try { localStorage.setItem('sum-sniper_high_score', GameState.highScore); } catch(e) {}
        }

        // Game Over text
        const goText = this.add.text(w / 2, h / 4, 'GAME OVER', {
            fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.STRIKE_ACTIVE
        }).setOrigin(0.5).setScale(0);
        this.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

        // Score with count-up
        const scoreTxt = this.add.text(w / 2, h / 4 + 70, '0', {
            fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        let displayScore = 0;
        const scoreStep = Math.max(1, Math.floor(this.finalScore / 40));
        const countUp = this.time.addEvent({
            delay: 20, repeat: Math.min(40, this.finalScore),
            callback: () => {
                displayScore = Math.min(displayScore + scoreStep, this.finalScore);
                scoreTxt.setText('' + displayScore);
            }
        });

        if (isNewHigh) {
            this.time.delayedCall(900, () => {
                this.add.text(w / 2, h / 4 + 40, 'NEW BEST!', {
                    fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SCORE_GOLD
                }).setOrigin(0.5);
                if (this.newHighScoreEffect) this.newHighScoreEffect(w / 2, h / 4 + 70);
            });
        }

        // Best + stage
        this.add.text(w / 2, h / 4 + 115, 'Best: ' + GameState.highScore, {
            fontSize: '16px', fontFamily: 'Arial', color: isNewHigh ? COLORS.SCORE_GOLD : '#888888'
        }).setOrigin(0.5);
        this.add.text(w / 2, h / 4 + 140, 'Stage ' + this.finalStage, {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        let btnY = h / 2 + 60;

        // Continue ad button
        if (AdsManager.canContinue()) {
            const contBtn = this.add.rectangle(w / 2, btnY, 240, 48, 0x2A1800).setInteractive({ useHandCursor: true });
            contBtn.setStrokeStyle(2, 0xFFD700);
            this.add.text(w / 2, btnY, 'WATCH AD - CONTINUE', {
                fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SCORE_GOLD
            }).setOrigin(0.5);
            contBtn.on('pointerdown', () => {
                AdsManager.showRewarded('continue', (result) => {
                    if (result.rewarded) {
                        this.scene.stop('GameOverScene');
                        const gs = this.scene.get('GameScene');
                        if (gs) gs.continueAfterAd();
                    }
                });
            });
            btnY += 60;
        }

        // Play Again
        const playBtn = this.add.rectangle(w / 2, btnY, 240, 48, 0x4A1FA8).setInteractive({ useHandCursor: true });
        playBtn.setStrokeStyle(2, 0x6B3FC9);
        this.add.text(w / 2, btnY, 'PLAY AGAIN', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        playBtn.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        });
        btnY += 60;

        // Menu
        const menuBtn = this.add.rectangle(w / 2, btnY, 240, 48, 0x000000, 0).setInteractive({ useHandCursor: true });
        menuBtn.setStrokeStyle(2, 0x4A4A6A);
        this.add.text(w / 2, btnY, 'MENU', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        menuBtn.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
    }
}
Object.assign(GameOverScene.prototype, GameEffects);

class HUDScene extends Phaser.Scene {
    constructor() { super('HUDScene'); }

    create() {
        const w = GAME_WIDTH;
        this.strikes = [];
        for (let i = 0; i < MAX_STRIKES; i++) {
            this.strikes.push(this.add.image(16 + i * 30, 22, 'strikeEmpty').setScale(0.9));
        }
        this.targetText = this.add.text(w / 2, 22, 'TARGET: --', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.TARGET_NUM
        }).setOrigin(0.5);
        this.stageText = this.add.text(w - 50, 22, 'Stage 1', {
            fontSize: '13px', fontFamily: 'Arial', color: '#8899AA'
        }).setOrigin(0.5);

        // Pause button
        const pauseBtn = this.add.text(w - 16, 22, '||', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        pauseBtn.on('pointerdown', () => {
            const gs = this.scene.get('GameScene');
            if (gs) gs.togglePause();
        });

        // Timer bar
        this.timerBg = this.add.rectangle(w / 2, 48, w - 8, 8, 0x1A1A2A).setDepth(0);
        this.timerBar = this.add.rectangle(4, 48, w - 8, 8, 0x00D4FF).setOrigin(0, 0.5);

        // Bottom bar
        this.sumText = this.add.text(20, GAME_HEIGHT - 40, 'Sum: 0', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        });
        const confirmBtn = this.add.rectangle(w - 80, GAME_HEIGHT - 38, 120, 44, 0x4A1FA8)
            .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x6B3FC9);
        this.add.text(w - 80, GAME_HEIGHT - 38, 'CONFIRM', {
            fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        confirmBtn.on('pointerdown', () => {
            const gs = this.scene.get('GameScene');
            if (gs) gs.onConfirm();
        });

        // Score
        this.scoreText = this.add.text(w / 2, GAME_HEIGHT - 40, 'Score: ' + GameState.score, {
            fontSize: '14px', fontFamily: 'Arial', color: COLORS.SCORE_GOLD
        }).setOrigin(0.5);
    }

    updateStrikes(count) {
        for (let i = 0; i < MAX_STRIKES; i++) {
            this.strikes[i].setTexture(i < count ? 'strikeActive' : 'strikeEmpty');
            if (i === count - 1) this.tweens.add({ targets: this.strikes[i], scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true });
        }
    }
    updateTarget(target) {
        if (!this.targetText) return;
        this.targetText.setText('TARGET: ' + target);
        this.tweens.add({ targets: this.targetText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
    }
    updateStage(stage) { if (this.stageText) this.stageText.setText('Stage ' + stage); }
    updateTimer(ratio) {
        if (!this.timerBar) return;
        this.timerBar.width = (GAME_WIDTH - 8) * ratio;
        const r = Math.floor(0xFF * (1 - ratio)), g = Math.floor(0xD4 * ratio), b = Math.floor(0xFF * ratio);
        this.timerBar.setFillStyle((r << 16) | (g << 8) | b);
    }
    updateSum(sum) { if (this.sumText) this.sumText.setText('Sum: ' + sum); }
    updateScore(score) {
        if (!this.scoreText) return;
        this.scoreText.setText('Score: ' + score);
        this.tweens.add({ targets: this.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 100, yoyo: true });
    }

    showPauseOverlay() {
        if (this.pauseOverlay) return;
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.pauseOverlay = this.add.container(0, 0).setDepth(100);
        const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8);
        this.pauseOverlay.add(bg);
        const title = this.add.text(w / 2, h / 3, 'PAUSED', {
            fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        this.pauseOverlay.add(title);

        const btns = ['RESUME', 'RESTART', 'HOW TO PLAY', 'QUIT TO MENU'];
        btns.forEach((label, i) => {
            const by = h / 3 + 60 + i * 56;
            const btn = this.add.rectangle(w / 2, by, 200, 46, 0x4A1FA8).setInteractive({ useHandCursor: true });
            btn.setStrokeStyle(1, 0x6B3FC9);
            const txt = this.add.text(w / 2, by, label, {
                fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
            }).setOrigin(0.5);
            this.pauseOverlay.add(btn);
            this.pauseOverlay.add(txt);
            btn.on('pointerdown', () => this.handlePauseBtn(label));
        });
    }

    handlePauseBtn(label) {
        const gs = this.scene.get('GameScene');
        if (label === 'RESUME') {
            if (gs) gs.togglePause();
        } else if (label === 'RESTART') {
            this.hidePauseOverlay();
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        } else if (label === 'HOW TO PLAY') {
            this.scene.launch('HelpScene', { returnTo: 'GameScene' });
        } else if (label === 'QUIT TO MENU') {
            this.hidePauseOverlay();
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        }
    }

    hidePauseOverlay() { if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; } }
    shutdown() { this.hidePauseOverlay(); }
}
