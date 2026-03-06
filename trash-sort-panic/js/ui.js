// ui.js - MenuScene, HUD overlay, game over, pause

function createButton(scene, x, y, w, h, label, color, cb) {
    const btn = scene.add.rectangle(x, y, w, h, Phaser.Display.Color.HexStringToColor(color).color, 1)
        .setInteractive({ useHandCursor: true }).setStrokeStyle(3, 0x000000);
    const txt = scene.add.text(x, y, label, {
        fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFFFFF', align: 'center'
    }).setOrigin(0.5);
    btn.on('pointerdown', () => {
        scene.tweens.add({ targets: [btn, txt], scaleX: 0.92, scaleY: 0.92, duration: 60, yoyo: true });
        if (cb) cb();
    });
    return { btn, txt };
}

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0xFFF8E1);
        // Animated bins
        ['bin_recycle', 'bin_compost', 'bin_trash', 'bin_hazard'].forEach((key, i) => {
            if (this.textures.exists(key)) {
                const bin = this.add.image(50 + i * 80, H - 60, key).setScale(1.6);
                this.tweens.add({ targets: bin, y: H - 68, duration: 600 + i * 100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }
        });
        const title = this.add.text(W / 2, 120, 'TRASH SORT\nPANIC', {
            fontSize: '36px', fontFamily: 'Impact, Arial', fontStyle: 'bold',
            color: COLORS.danger, align: 'center', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({ targets: title, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1 });
        this.add.text(W / 2, 195, 'Sort garbage before you get condemned!', {
            fontSize: '13px', fontFamily: 'Arial', color: '#795548', align: 'center'
        }).setOrigin(0.5);
        createButton(this, W / 2, 280, 200, 60, 'PLAY', COLORS.compost, () => this.scene.start('GameScene'));
        this.add.text(W / 2, 330, `Best: ${GameState.highScore || 0}`, {
            fontSize: '16px', fontFamily: 'Arial', color: COLORS.gold, fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
        // Help button
        const hb = this.add.circle(W - 35, 35, 22, 0x2196F3).setInteractive({ useHandCursor: true }).setStrokeStyle(3, 0x000000);
        this.add.text(W - 35, 35, '?', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' }).setOrigin(0.5);
        hb.on('pointerdown', () => { this.scene.pause(); this.scene.launch('HelpScene', { returnTo: 'MenuScene' }); });
        // Sound toggle
        const snd = this.add.text(W - 35, H - 35, GameState.settings.sound ? '🔊' : '🔇', { fontSize: '28px' })
            .setOrigin(0.5).setInteractive({ useHandCursor: true });
        snd.on('pointerdown', () => { GameState.settings.sound = !GameState.settings.sound; snd.setText(GameState.settings.sound ? '🔊' : '🔇'); saveState(); });
    }
}

class UIScene extends Phaser.Scene {
    constructor() { super('UIScene'); }
    create() {
        const W = GAME_CONFIG.width;
        this.scoreText = this.add.text(10, 8, `SCORE: ${GameState.score}`, {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF', stroke: '#000', strokeThickness: 3 });
        this.stageText = this.add.text(W / 2, 8, `Stage ${GameState.stage}`, {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0);
        this.strikes = [];
        for (let i = 0; i < 3; i++) {
            this.strikes.push(this.add.text(W - 30 - i * 28, 10, 'X', {
                fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#555', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5, 0));
        }
        this.updateStrikes();
        this.comboText = this.add.text(W / 2, 180, '', {
            fontSize: '20px', fontFamily: 'Impact, Arial', fontStyle: 'bold', color: COLORS.gold, stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setAlpha(0);
        this.timerBarBg = this.add.rectangle(W / 2, 48, W - 20, 6, 0x333333).setOrigin(0.5);
        this.timerBar = this.add.rectangle(W / 2, 48, W - 20, 6, 0x4CAF50).setOrigin(0.5).setDepth(1);
        const pb = this.add.text(W / 2 + 70, 8, '||', { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF' })
            .setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
        pb.on('pointerdown', () => this.showPause());
        // Events
        const gs = this.scene.get('GameScene');
        if (gs && gs.events) {
            gs.events.on('scoreUpdate', this.onScore, this);
            gs.events.on('stageUpdate', this.onStage, this);
            gs.events.on('strikeUpdate', this.onStrike, this);
            gs.events.on('comboUpdate', this.onCombo, this);
            gs.events.on('timerUpdate', this.onTimer, this);
            gs.events.on('gameOver', this.onGameOver, this);
            gs.events.on('floatingScore', this.onFloat, this);
            gs.events.on('stageClear', this.onClear, this);
        }
    }
    onScore(s) { if (this.scoreText) { this.scoreText.setText(`SCORE: ${s}`); this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true }); } }
    onStage(s) { if (this.stageText) this.stageText.setText(`Stage ${s}`); }
    updateStrikes() { for (let i = 0; i < 3; i++) this.strikes[i].setColor(i < GameState.strikes ? COLORS.danger : '#555'); }
    onStrike() { this.updateStrikes(); const i = GameState.strikes - 1; if (i >= 0 && i < 3) this.tweens.add({ targets: this.strikes[i], scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true }); }
    onCombo(c) { if (!this.comboText) return; if (c >= 3) { this.comboText.setFontSize(Math.min(36, 20 + (c - 3) * 2) + 'px').setText(`x${c} COMBO!`).setAlpha(1); this.tweens.killTweensOf(this.comboText); this.tweens.add({ targets: this.comboText, alpha: 0, duration: 1000, delay: 400 }); } else this.comboText.setAlpha(0); }
    onTimer(p) { if (this.timerBar) { this.timerBar.setScale(p, 1); this.timerBar.setFillStyle(p > 0.3 ? 0x4CAF50 : 0xF44336); } }
    onFloat(x, y, pts, col) { const t = this.add.text(x, y, `+${pts}`, { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: col, stroke: '#000', strokeThickness: 2 }).setOrigin(0.5); this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 600, onComplete: () => t.destroy() }); }
    onClear(perfect) { const W = GAME_CONFIG.width, H = GAME_CONFIG.height; const t = this.add.text(W / 2, H / 2 - 40, perfect ? 'PERFECT!' : 'Stage Clear!', { fontSize: '32px', fontFamily: 'Impact, Arial', fontStyle: 'bold', color: perfect ? COLORS.gold : COLORS.compost, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setScale(0.3); this.tweens.add({ targets: t, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' }); this.tweens.add({ targets: t, alpha: 0, duration: 400, delay: 800, onComplete: () => t.destroy() }); }

    showPause() {
        this.scene.pause('GameScene');
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        this.pauseGrp = this.add.group();
        const els = [];
        els.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
        els.push(this.add.text(W / 2, 150, 'PAUSED', { fontSize: '28px', fontFamily: 'Impact, Arial', color: '#FFF', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5));
        const r = createButton(this, W / 2, 250, 180, 50, 'Resume', COLORS.compost, () => this.hidePause());
        const h = createButton(this, W / 2, 320, 180, 50, 'How to Play', COLORS.recycle, () => { this.hidePause(); this.scene.pause('GameScene'); this.scene.launch('HelpScene', { returnTo: 'UIScene' }); });
        const rs = createButton(this, W / 2, 390, 180, 50, 'Restart', COLORS.hazard, () => { this.hidePause(); this.scene.stop('GameScene'); this.scene.stop('UIScene'); resetGameState(); this.scene.start('GameScene'); });
        const q = createButton(this, W / 2, 460, 180, 50, 'Quit', COLORS.trash, () => { this.hidePause(); this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('MenuScene'); });
        [...els, r.btn, r.txt, h.btn, h.txt, rs.btn, rs.txt, q.btn, q.txt].forEach(o => this.pauseGrp.add(o));
    }
    hidePause() { if (this.pauseGrp) { this.pauseGrp.destroy(true); this.pauseGrp = null; } this.scene.resume('GameScene'); }

    onGameOver(data) {
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        AdManager.onGameOver();
        const isNew = GameState.score > GameState.highScore;
        if (isNew) GameState.highScore = GameState.score;
        GameState.gamesPlayed++;
        if (GameState.stage > GameState.highestStage) GameState.highestStage = GameState.stage;
        saveState();
        this.time.delayedCall(GAME_CONFIG.deathRestartDelay, () => {
            const g = this.add.group(); const els = [];
            els.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setInteractive());
            els.push(this.add.text(W / 2, 140, 'CONDEMNED!', { fontSize: '34px', fontFamily: 'Impact, Arial', color: COLORS.danger, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setAngle(-8));
            els.push(this.add.text(W / 2, 220, `${GameState.score}`, { fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5));
            if (isNew) { const nb = this.add.text(W / 2, 260, 'NEW BEST!', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.gold }).setOrigin(0.5); this.tweens.add({ targets: nb, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 }); els.push(nb); }
            els.push(this.add.text(W / 2, 290, `Stage ${GameState.stage}`, { fontSize: '18px', fontFamily: 'Arial', color: '#CCC' }).setOrigin(0.5));
            let y = 340;
            if (AdManager.canContinue() && data.reason !== 'inactivity') {
                const c = createButton(this, W / 2, y, 200, 50, 'Continue (Ad)', COLORS.gold, () => { AdManager.useContinue(); AdManager.showRewarded(() => { g.destroy(true); GameState.strikes = Math.max(0, GameState.strikes - 1); this.updateStrikes(); this.scene.resume('GameScene'); this.scene.get('GameScene').resumeFromContinue(); }); }); els.push(c.btn, c.txt); y += 65;
            }
            const p = createButton(this, W / 2, y, 200, 50, 'Play Again', COLORS.compost, () => { g.destroy(true); this.scene.stop('GameScene'); this.scene.stop('UIScene'); resetGameState(); AdManager.reset(); this.scene.start('GameScene'); }); els.push(p.btn, p.txt);
            const m = createButton(this, W / 2, y + 60, 120, 40, 'Menu', COLORS.trash, () => { g.destroy(true); this.scene.stop('GameScene'); this.scene.stop('UIScene'); this.scene.start('MenuScene'); }); els.push(m.btn, m.txt);
            els.forEach(e => g.add(e));
        });
    }

    shutdown() {
        const gs = this.scene.get('GameScene');
        if (gs && gs.events) {
            ['scoreUpdate', 'stageUpdate', 'strikeUpdate', 'comboUpdate', 'timerUpdate', 'gameOver', 'floatingScore', 'stageClear'].forEach(e => gs.events.off(e));
        }
    }
}
