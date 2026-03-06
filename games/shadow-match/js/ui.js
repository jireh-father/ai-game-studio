// Shadow Match - UI (MenuScene + UIScene)
class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        // Background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(COLORS_INT.SKY_TOP, COLORS_INT.SKY_TOP, COLORS_INT.SKY_DARK, COLORS_INT.SKY_DARK, 1);
        bg.fillRect(0, 0, w, h);
        this.add.circle(214, 60, 30, COLORS_INT.STREAK_FIRE, 0.4);

        // Decorative drifting shadow
        const deco = this.add.rectangle(60, 300, 80, 80, COLORS_INT.SHADOW, 0.3);
        this.tweens.add({ targets: deco, x: w + 80, duration: 15000, repeat: -1 });

        this.add.text(w / 2, 100, 'SHADOW\nMATCH', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.HUD_TEXT, align: 'center', lineSpacing: 4
        }).setOrigin(0.5).setShadow(3, 3, '#000000', 4, false, true);

        this.makeBtn(w / 2, 280, 200, 60, 'PLAY', COLORS_INT.PIECE_FILL, COLORS.HUD_BG, 28, () => {
            AdManager.resetRun();
            GameState.score = 0; GameState.stage = 1; GameState.streak = 0; GameState.wrongThisStage = 0;
            this.scene.start('GameScene');
        });

        // Help button
        const hb = this.add.circle(w - 36, 36, 22, COLORS_INT.SHADOW_GRID).setInteractive({ useHandCursor: true }).setDepth(2);
        this.add.text(w - 36, 36, '?', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT }).setOrigin(0.5).setDepth(3).disableInteractive();
        hb.on('pointerdown', () => this.scene.start('HelpScene', { returnScene: 'MenuScene' }));

        this.add.text(w / 2, h - 80, 'BEST: ' + GameState.highScore, {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.STREAK_FIRE
        }).setOrigin(0.5);
        this.add.text(w / 2, h - 50, 'Highest Stage: ' + GameState.highestStage, {
            fontSize: '14px', fontFamily: 'Arial', color: COLORS.HUD_TEXT
        }).setOrigin(0.5);
    }

    makeBtn(x, y, bw, bh, label, bgC, txtC, fs, cb) {
        const b = this.add.rectangle(x, y, bw, bh, bgC).setInteractive({ useHandCursor: true }).setDepth(2).setStrokeStyle(2, 0xFFFFFF, 0.15);
        const t = this.add.text(x, y, label, { fontSize: fs + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: txtC }).setOrigin(0.5).setDepth(3);
        t.disableInteractive();
        b.on('pointerdown', () => { this.tweens.add({ targets: [b, t], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true, onComplete: cb }); });
    }
}

class UIScene extends Phaser.Scene {
    constructor() { super({ key: 'UIScene' }); }

    create() {
        const w = this.cameras.main.width;
        this.add.rectangle(w / 2, 25, w, 50, COLORS_INT.HUD_BG, 0.7).setDepth(100);
        this.scoreText = this.add.text(16, 16, '' + GameState.score, { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT }).setDepth(101);
        this.stageText = this.add.text(w / 2, 16, 'Stage ' + GameState.stage, { fontSize: '18px', fontFamily: 'Arial', color: COLORS.HUD_TEXT }).setOrigin(0.5, 0).setDepth(101);
        this.streakText = this.add.text(w - 16, 16, 'x' + Math.max(1, GameState.streak), { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.STREAK_FIRE }).setOrigin(1, 0).setDepth(101);
        this.add.rectangle(w / 2, DRIFT_BAR_Y, w - 20, 8, COLORS_INT.DRIFT_BAR_BG).setDepth(100);
        this.driftFill = this.add.rectangle(14, DRIFT_BAR_Y, 0, 6, COLORS_INT.DRIFT_BAR_FILL).setOrigin(0, 0.5).setDepth(101);
        this.warnText = this.add.text(w / 2, 300, 'SHADOW ESCAPING!', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER }).setOrigin(0.5).setDepth(200).setAlpha(0);

        const pb = this.add.rectangle(w / 2, 720, 44, 44, COLORS_INT.HUD_BG, 0.6).setInteractive({ useHandCursor: true }).setDepth(100);
        this.add.text(w / 2, 720, '||', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT }).setOrigin(0.5).setDepth(101).disableInteractive();
        pb.on('pointerdown', () => this.togglePause());

        const gs = this.scene.get('GameScene');
        if (gs) {
            gs.events.on('updateScore', s => { if (this.scoreText) { this.scoreText.setText('' + s); this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 75, yoyo: true }); } }, this);
            gs.events.on('updateStage', s => { if (this.stageText) this.stageText.setText('Stage ' + s); }, this);
            gs.events.on('updateStreak', s => { if (this.streakText) { this.streakText.setText('x' + Math.max(1, s)); this.tweens.add({ targets: this.streakText, scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true }); } }, this);
            gs.events.on('updateDrift', p => { if (this.driftFill) { this.driftFill.width = Math.max(0, Math.min(p, 1)) * (this.cameras.main.width - 28); this.driftFill.fillColor = p > 0.7 ? COLORS_INT.DANGER : COLORS_INT.DRIFT_BAR_FILL; } }, this);
            gs.events.on('showWarning', () => { if (this.warnText) { this.warnText.setAlpha(1); this.tweens.add({ targets: this.warnText, alpha: 0.3, duration: 200, yoyo: true, repeat: 2 }); } }, this);
            gs.events.on('hideWarning', () => { if (this.warnText) this.warnText.setAlpha(0); }, this);
            gs.events.on('showPerfect', () => this.showPerfect(), this);
            gs.events.on('showGameOver', () => this.showGameOver(), this);
            gs.events.on('floatScore', d => { if (!d) return; const t = this.add.text(d.x, d.y, '+' + d.amount, { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.STREAK_FIRE }).setOrigin(0.5).setDepth(150); this.tweens.add({ targets: t, y: d.y - 60, alpha: 0, duration: 600, onComplete: () => t.destroy() }); }, this);
        }
        this.isPaused = false;
    }

    showPerfect() {
        const w = this.cameras.main.width;
        const fl = this.add.rectangle(w / 2, 380, w, 760, COLORS_INT.SUCCESS, 0).setDepth(150);
        this.tweens.add({ targets: fl, alpha: 0.25, duration: 75, yoyo: true, onComplete: () => fl.destroy() });
        const t = this.add.text(w / 2, 350, 'PERFECT!', { fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SUCCESS }).setOrigin(0.5).setDepth(151).setScale(0);
        this.tweens.add({ targets: t, scaleX: 1.2, scaleY: 1.2, duration: 150, onComplete: () => { this.tweens.add({ targets: t, scaleX: 1, scaleY: 1, duration: 100 }); this.tweens.add({ targets: t, alpha: 0, y: 310, duration: 400, delay: 200, onComplete: () => t.destroy() }); } });
    }

    showGameOver() {
        if (this.warnText) this.warnText.setAlpha(0);
        const w = this.cameras.main.width, h = this.cameras.main.height;
        const ov = this.add.rectangle(w / 2, h / 2, w, h, COLORS_INT.HUD_BG, 0).setDepth(300).setInteractive();
        this.tweens.add({ targets: ov, alpha: 0.85, duration: 300 });
        const pan = this.add.container(0, h + 200).setDepth(301);
        pan.add(this.add.text(w / 2, 160, 'SHADOW ESCAPED!', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER }).setOrigin(0.5));
        const isNew = GameState.score > GameState.highScore;
        if (isNew) { GameState.highScore = GameState.score; if (GameState.stage > GameState.highestStage) GameState.highestStage = GameState.stage; saveState(); }
        pan.add(this.add.text(w / 2, 230, '' + GameState.score, { fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.STREAK_FIRE }).setOrigin(0.5));
        if (isNew) { const nb = this.add.text(w / 2, 270, 'NEW BEST!', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SUCCESS }).setOrigin(0.5); this.tweens.add({ targets: nb, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 }); pan.add(nb); }
        pan.add(this.add.text(w / 2, 300, 'Stage ' + GameState.stage, { fontSize: '20px', fontFamily: 'Arial', color: COLORS.HUD_TEXT }).setOrigin(0.5));
        pan.add(this.add.text(w / 2, 330, 'Best Streak: x' + GameState.bestStreak, { fontSize: '18px', fontFamily: 'Arial', color: COLORS.PIECE_FILL }).setOrigin(0.5));

        if (AdManager.canContinue()) {
            this.goBtn(pan, w / 2, 420, 'CONTINUE', COLORS_INT.SUCCESS, () => { AdManager.useContinue(); AdManager.showRewarded(() => { pan.destroy(); ov.destroy(); const g = this.scene.get('GameScene'); if (g) g.rewindShadow(); }); });
        }
        this.goBtn(pan, w / 2, 490, 'PLAY AGAIN', COLORS_INT.PIECE_FILL, () => { AdManager.resetRun(); GameState.score = 0; GameState.stage = 1; GameState.streak = 0; GameState.wrongThisStage = 0; this.scene.stop('UIScene'); this.scene.stop('GameScene'); this.scene.start('GameScene'); this.scene.start('UIScene'); });
        this.goBtn(pan, w / 2, 555, 'MENU', COLORS_INT.PIECE_OUTLINE, () => { this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('MenuScene'); });
        this.tweens.add({ targets: pan, y: 0, duration: 400, ease: 'Back.easeOut' });
        AdManager.onGameOver();
        if (AdManager.shouldShowInterstitial()) AdManager.showInterstitial();
    }

    goBtn(con, x, y, label, bgC, cb) {
        const b = this.add.rectangle(x, y, 200, 50, bgC).setInteractive({ useHandCursor: true }).setDepth(302).setStrokeStyle(2, 0xFFFFFF, 0.15);
        const t = this.add.text(x, y, label, { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT }).setOrigin(0.5).setDepth(303);
        t.disableInteractive();
        b.on('pointerdown', () => { this.tweens.add({ targets: [b, t], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true, onComplete: cb }); });
        con.add(b); con.add(t);
    }

    togglePause() {
        if (this.isPaused) return;
        this.scene.pause('GameScene');
        this.isPaused = true;
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.pOv = this.add.rectangle(w / 2, h / 2, w, h, COLORS_INT.HUD_BG, 0.85).setDepth(250).setInteractive();
        this.pCon = this.add.container(0, 0).setDepth(251);
        this.pCon.add(this.add.text(w / 2, 200, 'PAUSED', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT }).setOrigin(0.5));
        const btns = [
            { y: 300, l: 'RESUME', c: COLORS_INT.PIECE_FILL, cb: () => this.closePause() },
            { y: 370, l: 'HOW TO PLAY', c: COLORS_INT.SHADOW_GRID, cb: () => { this.closePause(); this.scene.pause('GameScene'); this.scene.launch('HelpScene', { returnScene: 'GameScene' }); } },
            { y: 440, l: 'RESTART', c: COLORS_INT.PIECE_PLACED, cb: () => { this.closePause(); GameState.score = 0; GameState.stage = 1; GameState.streak = 0; GameState.wrongThisStage = 0; this.scene.stop('UIScene'); this.scene.stop('GameScene'); this.scene.start('GameScene'); this.scene.start('UIScene'); } },
            { y: 510, l: 'QUIT', c: COLORS_INT.PIECE_OUTLINE, cb: () => { this.closePause(); this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('MenuScene'); } }
        ];
        btns.forEach(b => this.goBtn(this.pCon, w / 2, b.y, b.l, b.c, b.cb));
    }

    closePause() {
        if (this.pOv) this.pOv.destroy();
        if (this.pCon) this.pCon.destroy();
        this.isPaused = false;
        this.scene.resume('GameScene');
    }
}
