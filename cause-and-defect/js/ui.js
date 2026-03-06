// ui.js - MenuScene, GameOverScene, HUDScene, PauseOverlay

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.BG);
        const cx = 180, w = 360;

        // Animated gear logo
        const gear = this.add.image(cx, 140, 'gear_healthy').setScale(2.5);
        this.tweens.add({ targets: gear, angle: 360, duration: 8000, repeat: -1 });

        // Title
        this.add.text(cx, 240, 'CAUSE & DEFECT', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT_HEX }).setOrigin(0.5);
        this.add.text(cx, 272, 'Fix the machine before it blows!', { fontSize: '13px', fontFamily: 'Arial', color: COLORS.COPPER_HEX }).setOrigin(0.5);

        // Play button
        this.createButton(cx, 340, 280, 56, 'PLAY', COLORS.BTN_PRIMARY, () => {
            const gs = window.GameState;
            gs.score = 0;
            gs.currentStage = 1;
            gs.lives = GAME_SETTINGS.LIVES;
            gs.streak = 0;
            gs.totalStars = 0;
            gs.sessionSalt = Date.now() % 10000;
            gs.adContinueUsed = false;
            this.scene.start('GameScene');
        });

        // How to Play
        this.createButton(cx - 70, 420, 120, 40, '? Help', COLORS.COPPER, () => {
            this.scene.launch('HelpScene', { from: 'MenuScene' });
        }, '14px');

        // High score display
        const gs = window.GameState;
        this.add.text(cx + 70, 420, 'Best: ' + gs.highScore, { fontSize: '14px', fontFamily: 'Arial', color: COLORS.GOLD_HEX }).setOrigin(0.5);

        this.add.text(cx, 490, `Best Stage: ${gs.highestStage}`, { fontSize: '13px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX }).setOrigin(0.5);
        this.add.text(cx, 515, `Games Played: ${gs.gamesPlayed}`, { fontSize: '12px', fontFamily: 'Arial', color: COLORS.IRON }).setOrigin(0.5);

        // Small decorative gears
        const g2 = this.add.image(60, 620, 'gear_healthy').setScale(0.8).setAlpha(0.2);
        this.tweens.add({ targets: g2, angle: -360, duration: 12000, repeat: -1 });
        const g3 = this.add.image(300, 660, 'gear_healthy').setScale(0.6).setAlpha(0.15);
        this.tweens.add({ targets: g3, angle: 360, duration: 10000, repeat: -1 });
    }

    createButton(x, y, w, h, label, color, cb, fontSize) {
        const bg = this.add.rectangle(x, y, w, h, color, 0.9).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, label, { fontSize: fontSize || '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
        txt.setInteractive();
        const handler = () => {
            this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true, onComplete: cb });
        };
        bg.on('pointerdown', handler);
        txt.on('pointerdown', handler);
        return { bg, txt };
    }
}

class HUDScene extends Phaser.Scene {
    constructor() { super({ key: 'HUDScene' }); }

    create() {
        const gs = window.GameState;

        // Top bar background
        this.add.rectangle(180, 24, 360, 48, COLORS.UI_BG, 0.85).setDepth(0);
        this.add.rectangle(180, 62, 360, 28, COLORS.UI_BG, 0.6).setDepth(0);

        // Score
        this.scoreText = this.add.text(12, 14, `${gs.score}`, { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT_HEX }).setOrigin(0, 0.5).setDepth(1);

        // Stage
        this.stageText = this.add.text(180, 14, `Stage ${gs.currentStage}`, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT_HEX }).setOrigin(0.5, 0.5).setDepth(1);

        // Lives
        this.lifeIcons = [];
        for (let i = 0; i < 3; i++) {
            const icon = this.add.image(240 + i * 22, 14, i < gs.lives ? 'wrench' : 'wrenchEmpty').setScale(1).setDepth(1);
            this.lifeIcons.push(icon);
        }

        // Timer
        this.timerText = this.add.text(340, 14, '--', { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT_HEX }).setOrigin(1, 0.5).setDepth(1);

        // Pause button
        const pauseBtn = this.add.image(348, 42, 'pause').setScale(0.8).setInteractive({ useHandCursor: true }).setDepth(2);
        pauseBtn.on('pointerdown', () => this.togglePause());

        // Sub-HUD
        this.streakText = this.add.text(12, 62, '', { fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD_HEX }).setOrigin(0, 0.5).setDepth(1);
        this.parText = this.add.text(180, 62, '', { fontSize: '12px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX }).setOrigin(0.5, 0.5).setDepth(1);

        // Stars
        this.starIcons = [];
        for (let i = 0; i < 3; i++) {
            const s = this.add.image(310 + i * 20, 62, 'starEmpty').setScale(0.7).setDepth(1);
            this.starIcons.push(s);
        }

        // Listen to game events
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.on('scoreChanged', () => this.updateScore());
            gameScene.events.on('livesChanged', () => this.updateLives());
            gameScene.events.on('timerUpdate', (t) => this.updateTimer(t));
            gameScene.events.on('stageComplete', (data) => this.onStageComplete(data));
        }
        this.updateHUD();

        // Pause overlay elements
        this.pauseOverlay = null;
        this.pauseElements = [];
    }

    updateHUD() {
        const gs = window.GameState;
        this.scoreText.setText(`${gs.score}`);
        this.stageText.setText(`Stage ${gs.currentStage}`);
        if (gs.streak >= 2) this.streakText.setText(`Streak: ${gs.streak}x`);
        else this.streakText.setText('');
        const gameScene = this.scene.get('GameScene');
        if (gameScene && gameScene.stageData) {
            this.parText.setText(`Par: ${gameScene.stageData.parTime}s`);
        }
        this.updateLives();
    }

    updateScore() {
        const gs = window.GameState;
        this.scoreText.setText(`${gs.score}`);
        this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
        this.stageText.setText(`Stage ${gs.currentStage}`);
        if (gs.streak >= 2) this.streakText.setText(`Streak: ${gs.streak}x`);
        else this.streakText.setText('');
    }

    updateLives() {
        const gs = window.GameState;
        this.lifeIcons.forEach((icon, i) => {
            icon.setTexture(i < gs.lives ? 'wrench' : 'wrenchEmpty');
        });
    }

    updateTimer(t) {
        if (!this.timerText || !this.timerText.active) return;
        this.timerText.setText(t.toFixed(1));
        this.timerText.setColor(t < 5 ? COLORS.FAIL_RED_HEX : COLORS.UI_TEXT_HEX);
    }

    onStageComplete(data) {
        for (let i = 0; i < data.stars; i++) {
            this.time.delayedCall(i * JUICE.STAR_STAGGER, () => {
                if (this.starIcons[i] && this.starIcons[i].active) {
                    this.starIcons[i].setTexture('star');
                    this.tweens.add({ targets: this.starIcons[i], scaleX: 1.1, scaleY: 1.1, duration: JUICE.STAR_SCALE_MS, yoyo: true });
                }
            });
        }
        // Reset stars after delay for next stage
        this.time.delayedCall(1000, () => {
            this.starIcons.forEach(s => { if (s && s.active) s.setTexture('starEmpty'); });
            this.updateHUD();
        });
    }

    togglePause() {
        const gameScene = this.scene.get('GameScene');
        if (!gameScene) return;
        if (gameScene.isPaused) {
            this.hidePauseOverlay();
            gameScene.isPaused = false;
            gameScene.scene.resume();
        } else {
            gameScene.isPaused = true;
            gameScene.scene.pause();
            this.showPauseOverlay();
        }
    }

    showPauseOverlay() {
        this.pauseOverlay = this.add.rectangle(180, 380, 360, 760, COLORS.UI_BG, 0.9).setDepth(50);
        const els = [];
        els.push(this.add.text(180, 200, 'PAUSED', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT_HEX }).setOrigin(0.5).setDepth(51));

        const btns = [
            { y: 300, text: 'Resume', color: COLORS.BTN_PRIMARY, cb: () => this.togglePause() },
            { y: 360, text: 'How to Play', color: COLORS.COPPER, cb: () => this.scene.launch('HelpScene', { from: 'HUDScene' }) },
            { y: 420, text: 'Restart Stage', color: COLORS.COPPER, cb: () => { this.hidePauseOverlay(); const g = this.scene.get('GameScene'); g.isPaused = false; g.scene.resume(); g.startStage(window.GameState.currentStage); } },
            { y: 480, text: 'Quit to Menu', color: COLORS.BTN_DANGER, cb: () => { this.hidePauseOverlay(); this.scene.stop('GameScene'); this.scene.stop('HUDScene'); this.scene.start('MenuScene'); } }
        ];
        btns.forEach(b => {
            const bg = this.add.rectangle(180, b.y, 260, 44, b.color, 0.9).setInteractive({ useHandCursor: true }).setDepth(51);
            const txt = this.add.text(180, b.y, b.text, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(52);
            txt.setInteractive();
            bg.on('pointerdown', b.cb);
            txt.on('pointerdown', b.cb);
            els.push(bg, txt);
        });
        this.pauseElements = els;
    }

    hidePauseOverlay() {
        if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
        this.pauseElements.forEach(e => { if (e && e.active) e.destroy(); });
        this.pauseElements = [];
    }

    shutdown() {
        this.hidePauseOverlay();
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.off('scoreChanged');
            gameScene.events.off('livesChanged');
            gameScene.events.off('timerUpdate');
            gameScene.events.off('stageComplete');
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.BG);
        const gs = window.GameState;
        const cx = 180;

        this.add.text(cx, 80, 'MACHINE EXPLODED!', { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.FAIL_RED_HEX }).setOrigin(0.5);

        // Animated score count-up
        const displayScore = Math.max(0, gs.score);
        const scoreObj = { val: 0 };
        const scoreText = this.add.text(cx, 160, '0', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD_HEX }).setOrigin(0.5);
        this.tweens.add({ targets: scoreObj, val: displayScore, duration: 1500, onUpdate: () => { scoreText.setText(Math.floor(scoreObj.val).toLocaleString()); } });

        this.add.text(cx, 210, `Stage Reached: ${gs.currentStage}`, { fontSize: '16px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX }).setOrigin(0.5);
        this.add.text(cx, 240, `Best Streak: ${gs.bestStreak}`, { fontSize: '14px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX }).setOrigin(0.5);

        // New record check
        if (gs.score >= gs.highScore && gs.score > 0) {
            const rec = this.add.text(cx, 280, 'NEW RECORD!', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD_HEX }).setOrigin(0.5);
            this.tweens.add({ targets: rec, scaleX: 1.1, scaleY: 1.1, duration: 500, yoyo: true, repeat: -1 });
        }

        // Stars
        this.add.text(cx, 320, `Stars: ${gs.totalStars}`, { fontSize: '14px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX }).setOrigin(0.5);

        let by = 380;
        // Continue ad button (once per session)
        if (!gs.adContinueUsed) {
            this.createBtn(cx, by, 280, 48, 'Watch Ad: +1 Life', COLORS.GOLD, () => {
                AdManager.showRewarded('continue', (success) => {
                    if (success) {
                        gs.adContinueUsed = true;
                        gs.lives = 1;
                        this.scene.start('GameScene');
                    }
                });
            });
            by += 60;
        }

        // Play Again
        this.createBtn(cx, by, 280, 48, 'Play Again', COLORS.BTN_PRIMARY, () => {
            gs.score = 0; gs.currentStage = 1; gs.lives = GAME_SETTINGS.LIVES; gs.streak = 0; gs.totalStars = 0;
            gs.sessionSalt = Date.now() % 10000; gs.adContinueUsed = false;
            this.scene.start('GameScene');
        });

        // Main Menu
        this.createBtn(cx, by + 60, 280, 48, 'Main Menu', COLORS.COPPER, () => {
            this.scene.start('MenuScene');
        });
    }

    createBtn(x, y, w, h, label, color, cb) {
        const bg = this.add.rectangle(x, y, w, h, color, 0.9).setInteractive({ useHandCursor: true });
        const txt = this.add.text(x, y, label, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: color === COLORS.GOLD ? '#1A1A2E' : '#FFFFFF' }).setOrigin(0.5);
        txt.setInteractive();
        bg.on('pointerdown', cb);
        txt.on('pointerdown', cb);
    }
}
