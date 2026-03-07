// ui.js - MenuScene, GameOverScene, GameHUD, GameFX, PauseOverlay

// Floating text & effects helper
const GameFX = {
    floatText(scene, x, y, text, color, size) {
        const t = scene.add.text(x, y, text, {
            fontSize: (size || 20) + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: color
        }).setOrigin(0.5).setDepth(15);
        if (!scene.floatingTexts) scene.floatingTexts = [];
        scene.floatingTexts.push({ obj: t, life: 0.8 });
    },
    updateFloats(scene, dt) {
        if (!scene.floatingTexts) return;
        for (let i = scene.floatingTexts.length - 1; i >= 0; i--) {
            const ft = scene.floatingTexts[i];
            ft.life -= dt; ft.obj.y -= 40 * dt; ft.obj.setAlpha(Math.max(0, ft.life / 0.8));
            if (ft.life <= 0) { ft.obj.destroy(); scene.floatingTexts.splice(i, 1); }
        }
    },
    normalCut(scene) { scene.cameras.main.shake(80, 0.005); },
    closeCall(scene) { scene.cameras.main.shake(80, 0.008); },
    lastSecond(scene, x, y, combo) {
        scene.cameras.main.shake(120, 0.01 + combo * 0.001);
        scene.cameras.main.flash(80, 255, 255, 255, false, null, null, 0.15);
    }
};

// HUD manager
const GameHUD = {
    setup(scene) {
        const w = scene.gw; const h = scene.gh;
        scene.add.rectangle(w / 2, LAYOUT.HUD_HEIGHT / 2, w, LAYOUT.HUD_HEIGHT, 0x000000, 0.6).setDepth(10);
        scene._scoreTxt = scene.add.text(12, 18, 'Score: ' + GameState.score, {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setDepth(11);
        scene._stageTxt = scene.add.text(w / 2, 18, 'Stage ' + GameState.stage, {
            fontSize: '16px', fontFamily: 'Arial', color: '#AAAACC'
        }).setOrigin(0.5, 0).setDepth(11);
        scene._timerTxt = scene.add.text(12, h - 28, '', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setDepth(11);
        scene._comboTxt = scene.add.text(w - 12, h - 28, '', {
            fontSize: '15px', fontFamily: 'Arial', color: '#FFD700'
        }).setOrigin(1, 0).setDepth(11);
        scene._hpIcons = [];
        for (let i = 0; i < GAME_CONFIG.INITIAL_HP; i++) {
            const icon = scene.add.image(w - 24 - i * 24, 28,
                i < GameState.hp ? 'shield_full' : 'shield_empty').setScale(1).setDepth(11);
            scene._hpIcons.push(icon);
        }
        const pauseBtn = scene.add.text(w - 90, 12, '||', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#AAAACC',
            backgroundColor: '#2A2A3E', padding: { x: 8, y: 4 }
        }).setDepth(12).setInteractive({ useHandCursor: true });
        pauseBtn.on('pointerup', () => scene.togglePause());
        scene._kitBtn = scene.add.image(w - 120, 28, 'kit').setScale(0.8).setDepth(11)
            .setInteractive({ useHandCursor: true }).setAlpha(GameState.hasKit ? 1 : 0.3);
        scene._kitBtn.on('pointerup', () => scene.activateKit());
    },
    update(scene) {
        if (!scene._scoreTxt) return;
        scene._scoreTxt.setText('Score: ' + GameState.score);
        scene._stageTxt.setText('Stage ' + GameState.stage);
        const t = Math.max(0, Math.ceil(scene.stageTimer || 0));
        scene._timerTxt.setText('Time: ' + t + 's');
        scene._timerTxt.setColor(t <= 3 ? '#FF2D2D' : '#FFFFFF');
        scene._comboTxt.setText(GameState.combo > 0 ? 'Combo x' + GameState.combo : '');
        for (let i = 0; i < scene._hpIcons.length; i++) {
            scene._hpIcons[i].setTexture(i < GameState.hp ? 'shield_full' : 'shield_empty');
        }
        if (scene._kitBtn) scene._kitBtn.setAlpha(GameState.hasKit ? 1 : 0.3);
    },
    showPause(scene) {
        const w = scene.gw; const h = scene.gh;
        scene._pauseGroup = scene.add.group();
        const bg = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.75).setDepth(20);
        const title = scene.add.text(w/2, h*0.25, 'PAUSED', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(21);
        const mkBtn = (y, label, color, cb) => {
            const b = scene.add.rectangle(w/2, y, 180, 48, color).setDepth(21)
                .setInteractive({ useHandCursor: true });
            const t = scene.add.text(w/2, y, label, {
                fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
            }).setOrigin(0.5).setDepth(22);
            b.on('pointerup', cb);
            t.setInteractive({ useHandCursor: true }).on('pointerup', cb);
            scene._pauseGroup.addMultiple([b, t]);
        };
        mkBtn(h*0.4, 'Resume', 0x00AAFF, () => scene.togglePause());
        mkBtn(h*0.52, 'How to Play', 0x3A3A4E, () => {
            scene.scene.launch('HelpScene', { returnScene: 'GameScene' }); scene.scene.pause();
        });
        mkBtn(h*0.64, 'Quit to Menu', 0x3A3A4E, () => scene.scene.start('MenuScene'));
        scene._pauseGroup.addMultiple([bg, title]);
    },
    hidePause(scene) {
        if (scene._pauseGroup) { scene._pauseGroup.clear(true, true); scene._pauseGroup = null; }
    }
};

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }
    create() {
        const w = this.scale.width; const h = this.scale.height;
        this.add.rectangle(w/2, h/2, w, h, COLORS.BACKGROUND);
        const gfx = this.add.graphics();
        for (let i = 0; i < 3; i++) {
            gfx.lineStyle(2, 0x3A3A4E, 0.4); gfx.beginPath();
            const sy = 100 + i * 180 + Math.random() * 60;
            gfx.moveTo(-10, sy);
            for (let x = 0; x <= w + 20; x += 40) gfx.lineTo(x, sy + Math.sin(x * 0.02 + i) * 30);
            gfx.strokePath();
        }
        this.add.text(w/2, h*0.22, 'FUSE NETWORK', {
            fontSize: '30px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00AAFF'
        }).setOrigin(0.5);
        this.add.text(w/2, h*0.30, 'Cut the fuse. Save the base.', {
            fontSize: '14px', fontFamily: 'Arial', color: '#AAAACC'
        }).setOrigin(0.5);
        const playBtn = this.add.rectangle(w/2, h*0.52, 200, 56, 0x00AAFF)
            .setInteractive({ useHandCursor: true });
        const playTxt = this.add.text(w/2, h*0.52, 'PLAY', {
            fontSize: '26px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        const startGame = () => {
            GameState.score = 0; GameState.stage = 1; GameState.hp = GAME_CONFIG.INITIAL_HP;
            GameState.combo = 0; GameState.bestComboThisGame = 0;
            GameState.hasKit = false; AdManager.resetGame();
            this.scene.start('GameScene');
        };
        playBtn.on('pointerup', startGame);
        playTxt.setInteractive({ useHandCursor: true }).on('pointerup', startGame);
        const helpBtn = this.add.rectangle(w/2 - 60, h*0.66, 44, 44, 0x3A3A4E)
            .setInteractive({ useHandCursor: true });
        const helpTxt = this.add.text(w/2 - 60, h*0.66, '?', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00AAFF'
        }).setOrigin(0.5);
        const openHelp = () => this.scene.launch('HelpScene', { returnScene: 'MenuScene' });
        helpBtn.on('pointerup', openHelp);
        helpTxt.setInteractive({ useHandCursor: true }).on('pointerup', openHelp);
        this.add.text(w/2 + 60, h*0.66, 'HI: ' + (GameState.highScore || 0), {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700'
        }).setOrigin(0.5);
        this.add.text(w/2, h*0.74, 'Best: Stage ' + (GameState.bestStage || 0), {
            fontSize: '14px', fontFamily: 'Arial', color: '#666688'
        }).setOrigin(0.5);
        const sOn = GameState.settings.sound;
        const sTxt = this.add.text(w-30, 26, sOn ? 'SND' : 'MUTE', {
            fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: sOn ? '#44DDFF' : '#555566'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        sTxt.on('pointerup', () => {
            GameState.settings.sound = !GameState.settings.sound;
            sTxt.setText(GameState.settings.sound ? 'SND' : 'MUTE');
            sTxt.setColor(GameState.settings.sound ? '#44DDFF' : '#555566');
            try { localStorage.setItem('fuse_network_settings', JSON.stringify(GameState.settings)); } catch(e) {}
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }
    create() {
        const w = this.scale.width; const h = this.scale.height;
        this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.88); AdManager.onGameOver();
        const isNew = GameState.score > GameState.highScore;
        if (isNew) { GameState.highScore = GameState.score; try { localStorage.setItem('fuse_network_high_score', GameState.highScore); } catch(e) {} }
        if (GameState.stage > GameState.bestStage) { GameState.bestStage = GameState.stage; try { localStorage.setItem('fuse_network_best_stage', GameState.bestStage); } catch(e) {} }
        if (GameState.bestComboThisGame > GameState.bestCombo) { GameState.bestCombo = GameState.bestComboThisGame; try { localStorage.setItem('fuse_network_best_combo', GameState.bestCombo); } catch(e) {} }
        this.add.text(w/2, h*0.10, 'BASE DESTROYED!', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FF2D2D' }).setOrigin(0.5);
        const st = this.add.text(w/2, h*0.24, '' + GameState.score, { fontSize: '38px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
        this.tweens.add({ targets: st, scale: { from: 0.5, to: 1 }, duration: 300, ease: 'Back.easeOut' });
        if (isNew) { const nb = this.add.text(w/2, h*0.32, 'NEW BEST!', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700' }).setOrigin(0.5); this.tweens.add({ targets: nb, scale: { from: 0.9, to: 1.1 }, duration: 500, yoyo: true, repeat: -1 }); }
        this.add.text(w/2, h*0.37, 'Stage ' + GameState.stage, { fontSize: '18px', fontFamily: 'Arial', color: '#AAAACC' }).setOrigin(0.5);
        this.add.text(w/2, h*0.43, 'Best Combo: x' + GameState.bestComboThisGame, { fontSize: '16px', fontFamily: 'Arial', color: '#FFD700' }).setOrigin(0.5);
        let by = h * 0.54;
        if (AdManager.canContinue()) { this._btn(w/2, by, 200, 48, 0x2ECC71, 'Continue (+1 HP)', () => { AdManager.showRewarded('continue', () => { GameState.hp = 1; this.scene.start('GameScene'); }); }); by += 56; }
        this._btn(w/2, by, 200, 48, 0x00AAFF, 'Play Again', () => {
            GameState.score = 0; GameState.stage = 1; GameState.hp = GAME_CONFIG.INITIAL_HP;
            GameState.combo = 0; GameState.bestComboThisGame = 0; AdManager.resetGame();
            this.scene.start('GameScene');
        }); by += 56;
        this._btn(w/2, by, 140, 40, 0x3A3A4E, 'Menu', () => this.scene.start('MenuScene'));
    }
    _btn(x, y, w, h, c, label, cb) {
        const b = this.add.rectangle(x, y, w, h, c).setInteractive({ useHandCursor: true });
        const t = this.add.text(x, y, label, { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
        b.on('pointerup', cb);
        t.setInteractive({ useHandCursor: true }).on('pointerup', cb);
    }
}
