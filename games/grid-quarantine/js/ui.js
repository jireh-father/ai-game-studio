// ============================================================
// ui.js - MenuScene, GameOverScene, UIScene (HUD), Pause
// ============================================================

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BACKGROUND);

        // Decorative mini grid
        const g = this.add.graphics();
        const gs = 6, cs = 28;
        const ox = (w - gs * cs) / 2, oy = h * 0.58;
        g.setAlpha(0.15);
        for (let r = 0; r < gs; r++) for (let c = 0; c < gs; c++) {
            g.fillStyle(COLORS.EMPTY_CELL, 1);
            g.fillRoundedRect(ox + c * cs + 1, oy + r * cs + 1, cs - 2, cs - 2, 2);
        }
        for (const [r, c] of [[2, 2], [2, 3], [3, 2]]) {
            g.fillStyle(COLORS.INFECTION_BASIC, 1);
            g.fillRoundedRect(ox + c * cs + 1, oy + r * cs + 1, cs - 2, cs - 2, 2);
        }
        for (const [r, c] of [[1, 2], [1, 3], [2, 1], [2, 4], [3, 1], [3, 3], [3, 4], [4, 2], [4, 3]]) {
            g.fillStyle(COLORS.WALL, 1);
            g.fillRoundedRect(ox + c * cs + 1, oy + r * cs + 1, cs - 2, cs - 2, 2);
        }

        // Title
        this.add.text(w / 2, h * 0.18, 'GRID\nQUARANTINE', {
            fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.WALL_HEX, align: 'center', lineSpacing: 4,
        }).setOrigin(0.5);
        this.add.text(w / 2, h * 0.31, 'Contain the outbreak', {
            fontSize: '16px', fontFamily: 'Arial', color: '#B0BEC5',
        }).setOrigin(0.5);

        if (GameState.highScore > 0) {
            this.add.text(w / 2, h * 0.36, 'BEST: ' + GameState.highScore, {
                fontSize: '14px', fontFamily: 'Arial', color: '#B0BEC5',
            }).setOrigin(0.5);
        }

        // PLAY button
        this.makeBtn(w / 2, h * 0.46, 200, 56, 'PLAY', 24, () => {
            GameState.score = 0; GameState.stage = 1; GameState.lives = 3;
            GameState.runSeed = Math.floor(Math.random() * 999999);
            GameState.adContinueUsed = false; GameState.gamesPlayed++;
            saveState();
            this.scene.start('GameScene');
        });

        // Help
        const hb = this.add.circle(50, h - 50, 24, 0x000000, 0).setStrokeStyle(2, COLORS.UI_BUTTON).setInteractive({ useHandCursor: true });
        this.add.text(50, h - 50, '?', { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_BUTTON_HEX }).setOrigin(0.5);
        hb.on('pointerdown', () => this.scene.launch('HelpScene', { from: 'MenuScene' }));

        // Stats
        const sb = this.add.circle(w / 2, h - 50, 24, 0x000000, 0).setStrokeStyle(2, COLORS.UI_BUTTON).setInteractive({ useHandCursor: true });
        this.add.text(w / 2, h - 50, '\u2606', { fontSize: '22px', fontFamily: 'Arial', color: COLORS.UI_BUTTON_HEX }).setOrigin(0.5);
        sb.on('pointerdown', () => this.showStats());

        // Sound
        this.soundOn = GameState.settings.sound;
        const sl = this.add.text(w - 40, 24, this.soundOn ? 'SND' : 'MUTE', {
            fontSize: '12px', fontFamily: 'Arial', color: '#B0BEC5',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        sl.on('pointerdown', () => { this.soundOn = !this.soundOn; GameState.settings.sound = this.soundOn; sl.setText(this.soundOn ? 'SND' : 'MUTE'); saveState(); });
    }

    makeBtn(x, y, bw, bh, label, fs, cb) {
        const bg = this.add.rectangle(x, y, bw, bh, 0x000000, 0).setStrokeStyle(2, COLORS.UI_BUTTON).setInteractive({ useHandCursor: true });
        const t = this.add.text(x, y, label, { fontSize: fs + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_BUTTON_HEX }).setOrigin(0.5);
        bg.on('pointerdown', () => { bg.setFillStyle(COLORS.UI_BUTTON, 0.3); t.setColor('#FFFFFF'); });
        bg.on('pointerup', cb);
        bg.on('pointerout', () => { bg.setFillStyle(0x000000, 0); t.setColor(COLORS.UI_BUTTON_HEX); });
    }

    showStats() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        const els = [];
        const ov = this.add.rectangle(w / 2, h / 2, w, h, COLORS.OVERLAY_BG, 0.85).setDepth(200).setInteractive();
        els.push(ov);
        els.push(this.add.text(w / 2, h * 0.25, 'STATS', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_BUTTON_HEX }).setOrigin(0.5).setDepth(201));
        const items = [['High Score', GameState.highScore], ['Highest Stage', GameState.highestStage], ['Games Played', GameState.gamesPlayed]];
        items.forEach(([l, v], i) => els.push(this.add.text(w / 2, h * 0.35 + i * 36, l + ': ' + v, { fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF' }).setOrigin(0.5).setDepth(201)));
        const cb = this.add.rectangle(w / 2, h * 0.65, 160, 44, 0x000000, 0).setStrokeStyle(2, COLORS.UI_BUTTON).setDepth(201).setInteractive({ useHandCursor: true });
        els.push(cb);
        els.push(this.add.text(w / 2, h * 0.65, 'CLOSE', { fontSize: '18px', fontFamily: 'Arial', color: COLORS.UI_BUTTON_HEX }).setOrigin(0.5).setDepth(201));
        cb.on('pointerdown', () => els.forEach(e => e.destroy()));
    }
}

// UIScene - HUD Overlay
class UIScene extends Phaser.Scene {
    constructor() { super('UIScene'); }

    create() {
        const w = this.cameras.main.width;
        this.scoreText = this.add.text(16, 14, '' + GameState.score, { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' });
        this.stageText = this.add.text(w / 2, 14, 'Stage ' + GameState.stage, { fontSize: '18px', fontFamily: 'Arial', color: '#B0BEC5' }).setOrigin(0.5, 0);

        // Pause button
        const pb = this.add.rectangle(w - 36, 22, 36, 36, 0x000000, 0).setInteractive({ useHandCursor: true });
        this.add.text(w - 36, 22, '||', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#B0BEC5' }).setOrigin(0.5);
        pb.on('pointerdown', () => this.togglePause());

        this.livesEls = [];
        this.drawLives();
        this.supplyBarY = this.cameras.main.height - GRID.SUPPLY_HEIGHT + 10;
        this.supplyGfx = null;
        this.supplyText = null;
        this.wallsLabel = this.add.text(0, this.supplyBarY + 1, 'Walls:', { fontSize: '13px', fontFamily: 'Arial', color: '#B0BEC5' });
        this.drawSupplyBar();

        const gs = this.scene.get('GameScene');
        if (gs) {
            gs.events.on('updateHUD', () => this.refreshHUD());
            gs.events.on('lifeLost', () => this.drawLives());
            gs.events.on('stageCleared', () => {
                this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });
            });
        }
        this.pauseEls = null;
    }

    refreshHUD() {
        if (this.scoreText) this.scoreText.setText('' + GameState.score);
        if (this.stageText) this.stageText.setText('Stage ' + GameState.stage);
        this.drawSupplyBar();
    }

    drawLives() {
        this.livesEls.forEach(e => e.destroy());
        this.livesEls = [];
        const w = this.cameras.main.width;
        for (let i = 0; i < 3; i++) {
            const active = i < GameState.lives;
            const col = active ? COLORS.LIFE_ACTIVE : COLORS.LIFE_EMPTY;
            const x = w - 80 + i * 22;
            this.livesEls.push(this.add.circle(x, 24, 8, 0x000000, 0).setStrokeStyle(1.5, col));
            this.livesEls.push(this.add.circle(x, 24, 2.5, col));
            this.livesEls.push(this.add.circle(x, 19, 2, col));
            this.livesEls.push(this.add.circle(x - 4, 27, 2, col));
            this.livesEls.push(this.add.circle(x + 4, 27, 2, col));
        }
    }

    drawSupplyBar() {
        if (this.supplyGfx) this.supplyGfx.destroy();
        if (this.supplyText) this.supplyText.destroy();
        const w = this.cameras.main.width;
        const barW = 160, barH = 14, barX = (w - barW) / 2 + 15, barY = this.supplyBarY;
        const pct = GameState.wallsTotal > 0 ? GameState.wallsRemaining / GameState.wallsTotal : 0;
        const low = GameState.wallsRemaining <= 3;
        this.supplyGfx = this.add.graphics();
        this.supplyGfx.fillStyle(COLORS.SUPPLY_EMPTY, 1);
        this.supplyGfx.fillRoundedRect(barX, barY, barW, barH, 4);
        this.supplyGfx.fillStyle(low ? COLORS.SUPPLY_LOW : COLORS.SUPPLY_FILL, 1);
        if (pct > 0) this.supplyGfx.fillRoundedRect(barX, barY, Math.max(8, barW * pct), barH, 4);
        this.supplyText = this.add.text(barX + barW + 8, barY, GameState.wallsRemaining + '/' + GameState.wallsTotal, { fontSize: '13px', fontFamily: 'Arial', color: '#B0BEC5' });
        if (this.wallsLabel) this.wallsLabel.setPosition(barX - 48, barY + 1);
    }

    togglePause() {
        const gs = this.scene.get('GameScene');
        if (!gs) return;
        if (gs.paused) { this.hidePause(); gs.resumeGame(); }
        else { gs.pauseGame(); this.showPause(); }
    }

    showPause() {
        if (this.pauseEls) return;
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.pauseEls = [];
        const bg = this.add.rectangle(w / 2, h / 2, w, h, COLORS.OVERLAY_BG, 0.8).setDepth(300).setInteractive();
        this.pauseEls.push(bg);
        this.pauseEls.push(this.add.text(w / 2, h * 0.3, 'PAUSED', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setDepth(301));
        const mk = (y, label, cb) => {
            const b = this.add.rectangle(w / 2, y, 180, 44, 0x000000, 0).setStrokeStyle(2, COLORS.UI_BUTTON).setDepth(301).setInteractive({ useHandCursor: true });
            const t = this.add.text(w / 2, y, label, { fontSize: '18px', fontFamily: 'Arial', color: COLORS.UI_BUTTON_HEX }).setOrigin(0.5).setDepth(301);
            b.on('pointerdown', cb);
            this.pauseEls.push(b, t);
        };
        mk(h * 0.45, 'RESUME', () => this.togglePause());
        mk(h * 0.55, 'HOW TO PLAY', () => this.scene.launch('HelpScene', { from: 'pause' }));
        mk(h * 0.65, 'RESTART', () => { this.hidePause(); GameState.score = 0; GameState.stage = 1; GameState.lives = 3; GameState.runSeed = Math.floor(Math.random() * 999999); const gs2 = this.scene.get('GameScene'); if (gs2) gs2.scene.restart(); });
        mk(h * 0.75, 'QUIT', () => { this.hidePause(); this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('MenuScene'); });
    }

    hidePause() { if (this.pauseEls) { this.pauseEls.forEach(e => e.destroy()); this.pauseEls = null; } }
}

// GameOverScene
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BACKGROUND);
        const isNew = GameState.score > GameState.highScore;
        if (isNew) GameState.highScore = GameState.score;
        if (GameState.stage > GameState.highestStage) GameState.highestStage = GameState.stage;
        AdManager.showInterstitial();
        saveState();

        const title = this.add.text(w / 2, h * 0.15, 'QUARANTINE\nFAILED', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER_HEX, align: 'center' }).setOrigin(0.5).setScale(0);
        this.tweens.add({ targets: title, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' });

        const st = this.add.text(w / 2, h * 0.33, '0', { fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
        this.tweens.addCounter({ from: 0, to: GameState.score, duration: 800, onUpdate: (tw) => st.setText(Math.floor(tw.getValue()) + '') });

        if (isNew) {
            const nb = this.add.text(w / 2, h * 0.40, 'NEW BEST!', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD600' }).setOrigin(0.5);
            this.tweens.add({ targets: nb, scaleX: 1.1, scaleY: 1.1, duration: 500, yoyo: true, repeat: -1 });
        }
        this.add.text(w / 2, h * 0.46, 'Stage ' + GameState.stage, { fontSize: '18px', fontFamily: 'Arial', color: '#B0BEC5' }).setOrigin(0.5);

        if (!GameState.adContinueUsed && AdManager.canShowContinueAd()) {
            this.mkBtn(w / 2, h * 0.58, 210, 44, 'Continue (+1 Life)', COLORS.SUCCESS, () => {
                AdManager.showRewardedContinue((ok) => { if (ok) { GameState.adContinueUsed = true; GameState.lives = 1; this.scene.start('GameScene'); } });
            });
        }
        this.mkBtn(w / 2, h * 0.68, 180, 44, 'PLAY AGAIN', COLORS.UI_BUTTON, () => {
            GameState.score = 0; GameState.stage = 1; GameState.lives = 3; GameState.runSeed = Math.floor(Math.random() * 999999); GameState.adContinueUsed = false; this.scene.start('GameScene');
        });
        this.mkBtn(w / 2, h * 0.78, 180, 44, 'MENU', COLORS.HUD_SECONDARY, () => this.scene.start('MenuScene'));
    }

    mkBtn(x, y, bw, bh, label, col, cb) {
        const hex = '#' + col.toString(16).padStart(6, '0');
        const bg = this.add.rectangle(x, y, bw, bh, 0x000000, 0).setStrokeStyle(2, col).setInteractive({ useHandCursor: true });
        this.add.text(x, y, label, { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: hex }).setOrigin(0.5);
        bg.on('pointerdown', cb);
    }
}
