// Permission Denied - UI Scenes (Menu, GameOver, HUD)

// Helper: create OS-style dialog container
function createOSDialog(scene, x, y, w, h, title) {
    const c = scene.add.container(x, y);
    // Shadow
    const shadow = scene.add.rectangle(3, 3, w, h, 0x000000, 0.3).setOrigin(0, 0);
    // Body
    const body = scene.add.rectangle(0, 0, w, h, COLORS.WINDOW_BG).setOrigin(0, 0).setStrokeStyle(1, COLORS.BUTTON_SHADOW);
    // Title bar
    const titleBar = scene.add.rectangle(0, 0, w, 24, COLORS.TITLE_BAR).setOrigin(0, 0);
    const titleText = scene.add.text(24, 4, title, { fontSize: '12px', fontFamily: 'Courier New, monospace', color: '#FFFFFF' });
    // Close X
    const closeBtn = scene.add.rectangle(w - 20, 4, 16, 16, COLORS.DANGER_RED).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const closeX = scene.add.text(w - 17, 3, 'X', { fontSize: '12px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold' });
    c.add([shadow, body, titleBar, titleText, closeBtn, closeX]);
    c.closeBtn = closeBtn;
    c.bodyArea = { x: 0, y: 24, w, h: h - 24 };
    return c;
}

// Helper: create bevel button
function createBevelButton(scene, x, y, w, h, label, color, fontSize) {
    const c = scene.add.container(x, y);
    const shadowR = scene.add.rectangle(2, 2, w, h, COLORS.BUTTON_SHADOW).setOrigin(0.5);
    const face = scene.add.rectangle(0, 0, w, h, color || COLORS.BUTTON_DEFAULT).setOrigin(0.5);
    const hlTop = scene.add.rectangle(0, -h / 2, w, 2, COLORS.BUTTON_HIGHLIGHT).setOrigin(0.5, 0);
    const hlLeft = scene.add.rectangle(-w / 2, 0, 2, h, COLORS.BUTTON_HIGHLIGHT).setOrigin(0, 0.5);
    const txt = scene.add.text(0, 0, label, {
        fontSize: fontSize || '14px', fontFamily: 'Courier New, monospace',
        color: COLORS.TEXT_PRIMARY, fontStyle: 'bold'
    }).setOrigin(0.5);
    c.add([shadowR, face, hlTop, hlLeft, txt]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    c.face = face;
    c.label = txt;
    return c;
}

// ===== MENU SCENE =====
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.DESKTOP_TEAL);

        // Fake OS window
        const dlg = createOSDialog(this, 20, 80, 320, 440, 'Permission Denied v2.0.4');
        dlg.closeBtn.on('pointerdown', () => {
            // Close does nothing — that's the joke
            this.cameras.main.shake(100, 0.005);
        });

        // Subtitle
        this.add.text(180, 160, 'You do not have\npermission to play\nthis game.', {
            fontSize: '16px', fontFamily: 'Courier New, monospace',
            color: COLORS.TEXT_PRIMARY, align: 'center', lineSpacing: 6
        }).setOrigin(0.5);

        // High score display
        const hsText = GameState.highScore > 0 ? `Best: ${GameState.highScore}` : '';
        this.add.text(180, 220, hsText, {
            fontSize: '13px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_DISABLED
        }).setOrigin(0.5);

        // REQUEST ACCESS button
        const playBtn = createBevelButton(this, 180, 290, 240, 56, 'REQUEST ACCESS', COLORS.ACCEPT_GREEN, '18px');
        playBtn.label.setColor('#FFFFFF');
        this.tweens.add({ targets: playBtn, scaleX: 1.03, scaleY: 1.03, duration: 600, yoyo: true, repeat: -1 });
        playBtn.on('pointerdown', () => this.startGame());

        // HOW TO PLAY
        const helpBtn = createBevelButton(this, 180, 365, 180, 44, 'HOW TO PLAY');
        helpBtn.on('pointerdown', () => {
            this.scene.pause();
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // HIGH SCORES
        const hsBtn = createBevelButton(this, 180, 420, 180, 44, 'HIGH SCORES');
        hsBtn.on('pointerdown', () => this.showHighScores());

        // Footer
        this.add.text(180, 510, 'System Administrator:\nNot Available', {
            fontSize: '10px', fontFamily: 'Courier New, monospace',
            color: COLORS.TEXT_DISABLED, align: 'center'
        }).setOrigin(0.5);
    }

    startGame() {
        GameState.reset();
        this.scene.stop('MenuScene');
        this.scene.start('GameScene');
        this.scene.launch('HUDScene');
    }

    showHighScores() {
        const scores = GameState.getTopScores();
        const overlay = this.add.container(0, 0).setDepth(100);
        const bg = this.add.rectangle(180, 320, 360, 640, 0x000000, 0.5).setInteractive();
        const dlg = createOSDialog(this, 50, 150, 260, 280, 'High Scores');
        dlg.closeBtn.on('pointerdown', () => overlay.destroy());
        bg.on('pointerdown', () => overlay.destroy());

        if (scores.length === 0) {
            const noSc = this.add.text(180, 280, 'No scores yet.', {
                fontSize: '14px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_DISABLED
            }).setOrigin(0.5);
            overlay.add([bg, dlg, noSc]);
        } else {
            const items = [];
            scores.forEach((s, i) => {
                const t = this.add.text(80, 200 + i * 36, `${i + 1}. ${s.toLocaleString()}`, {
                    fontSize: '16px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY
                });
                items.push(t);
            });
            overlay.add([bg, dlg, ...items]);
        }
    }
}

// ===== HUD SCENE =====
class HUDScene extends Phaser.Scene {
    constructor() { super('HUDScene'); }

    create() {
        // Top bar background
        this.add.rectangle(180, 24, 360, 48, COLORS.TITLE_BAR).setDepth(0);

        this.scoreText = this.add.text(10, 14, 'SCORE: ' + GameState.score, {
            fontSize: '14px', fontFamily: 'Courier New, monospace', color: COLORS.SCORE_WHITE, fontStyle: 'bold'
        }).setDepth(1);

        this.stageText = this.add.text(180, 14, 'STAGE: ' + GameState.challengeNum, {
            fontSize: '14px', fontFamily: 'Courier New, monospace', color: COLORS.SCORE_WHITE
        }).setOrigin(0.5, 0).setDepth(1);

        this.streakText = this.add.text(290, 14, '', {
            fontSize: '13px', fontFamily: 'Courier New, monospace', color: COLORS.GOLD
        }).setDepth(1);

        // Help button
        const helpBtn = this.add.rectangle(340, 24, 36, 36, COLORS.TITLE_BAR).setStrokeStyle(2, 0xFFFFFF).setInteractive({ useHandCursor: true }).setDepth(1);
        this.add.text(340, 24, '?', {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);
        helpBtn.on('pointerdown', () => {
            this.scene.pause('GameScene');
            this.scene.pause('HUDScene');
            this.scene.launch('HelpScene', { returnTo: 'GameScene' });
        });

        // Timer bar (bottom)
        this.timerBg = this.add.rectangle(180, GAME_HEIGHT - 36, 340, 20, 0x333333).setDepth(0);
        this.timerBar = this.add.rectangle(10, GAME_HEIGHT - 46, 340, 20, COLORS.TIMER_GREEN).setOrigin(0, 0).setDepth(1);
        this.timerText = this.add.text(180, GAME_HEIGHT - 36, '', {
            fontSize: '12px', fontFamily: 'Courier New, monospace', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(2);
    }

    updateHUD(score, challengeNum, streak) {
        if (!this.scoreText || !this.scoreText.active) return;
        this.scoreText.setText('SCORE: ' + score);
        this.stageText.setText('STAGE: ' + challengeNum);
        if (streak > 1.0) {
            this.streakText.setText('x' + streak.toFixed(1));
        } else {
            this.streakText.setText('');
        }
    }

    updateTimer(fraction) {
        const w = Math.max(0, 340 * fraction);
        this.timerBar.setDisplaySize(w, 20);
        const secs = (fraction * 8).toFixed(1);
        this.timerText.setText(secs + 's');

        if (fraction > 0.5) {
            this.timerBar.setFillStyle(COLORS.TIMER_GREEN);
        } else if (fraction > 0.25) {
            this.timerBar.setFillStyle(COLORS.TIMER_YELLOW);
        } else {
            this.timerBar.setFillStyle(COLORS.TIMER_RED);
        }
    }

    punchScore() {
        this.tweens.add({ targets: this.scoreText, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
    }
}

// ===== GAME OVER SCENE =====
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.BSOD_BLUE);

        // Frown icon
        const g = this.add.graphics();
        g.lineStyle(3, 0xFFFFFF);
        g.strokeCircle(180, 140, 40);
        g.fillStyle(0xFFFFFF); g.fillCircle(165, 130, 5); g.fillCircle(195, 130, 5);
        g.beginPath(); g.moveTo(160, 155); g.splineThru([{x:170,y:148},{x:180,y:145},{x:190,y:148},{x:200,y:155}]); g.strokePath();

        this.add.text(180, 210, 'SESSION TIMEOUT', {
            fontSize: '24px', fontFamily: 'Courier New, monospace', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(180, 250, `Your session expired after\ncompleting ${GameState.challengeNum} challenges.`, {
            fontSize: '13px', fontFamily: 'Courier New, monospace', color: '#FFFFFF', align: 'center', lineSpacing: 4
        }).setOrigin(0.5);

        // Animated score
        const finalScore = GameState.score;
        const scoreDisplay = this.add.text(180, 300, 'Final Score: 0', {
            fontSize: '18px', fontFamily: 'Courier New, monospace', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.addCounter({
            from: 0, to: finalScore, duration: 800,
            onUpdate: (t) => { scoreDisplay.setText('Final Score: ' + Math.floor(t.getValue()).toLocaleString()); }
        });

        // New record?
        const isNewRecord = GameState.score > GameState.highScore || (GameState.score > 0 && GameState.highScore === 0);
        if (isNewRecord) {
            const record = this.add.text(180, 340, 'NEW RECORD!', {
                fontSize: '20px', fontFamily: 'Courier New, monospace', color: COLORS.GOLD, fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(0);
            this.tweens.add({ targets: record, alpha: 1, x: { from: -100, to: 180 }, duration: 600, delay: 800, ease: 'Back.easeOut' });
        }

        GameState.saveHighScore();
        GameState.saveTopScore();
        GameState.gameOverCount++;
        AdManager.showGameOverInterstitial(GameState.gameOverCount);

        // Continue button (if available)
        const btnY = isNewRecord ? 400 : 380;
        if (AdManager.canShowContinue()) {
            const contBtn = createBevelButton(this, 180, btnY, 240, 48, 'CONTINUE (Watch Ad)', COLORS.ACCEPT_GREEN);
            contBtn.label.setColor('#FFFFFF').setFontSize('13px');
            contBtn.on('pointerdown', () => {
                AdManager.acceptContinue();
                this.scene.stop('GameOverScene');
                this.scene.start('GameScene', { continuing: true });
                this.scene.launch('HUDScene');
            });
            // Fade out after 4 seconds
            this.time.delayedCall(4000, () => {
                this.tweens.add({ targets: contBtn, alpha: 0, duration: 500 });
            });
        }

        // Play Again
        const yOffset = AdManager.canShowContinue() ? 60 : 0;
        const retryBtn = createBevelButton(this, 180, btnY + yOffset + 60, 200, 52, 'PLAY AGAIN', COLORS.ACCEPT_GREEN);
        retryBtn.label.setColor('#FFFFFF');
        retryBtn.on('pointerdown', () => {
            GameState.reset();
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.launch('HUDScene');
        });

        // Main Menu
        const menuBtn = createBevelButton(this, 180, btnY + yOffset + 125, 180, 44, 'MAIN MENU');
        menuBtn.on('pointerdown', () => {
            GameState.reset();
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
    }
}
