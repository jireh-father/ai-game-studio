// Grocery Gamble - UI Scenes (MenuScene, GameOverScene, HUDScene)

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.background);

        // Title
        this.add.text(w / 2, 140, 'GROCERY\nGAMBLE', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold',
            color: HEX.text, align: 'center', lineSpacing: 6
        }).setOrigin(0.5);

        this.add.text(w / 2, 230, "Don't get caught.", {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'italic', color: HEX.secondary
        }).setOrigin(0.5);

        // High score
        this.add.text(w / 2, 280, 'HIGH SCORE: ' + GameState.highScore.toLocaleString(), {
            fontSize: '14px', fontFamily: 'Arial', color: HEX.gold
        }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.rectangle(w / 2, 360, 240, 60, COLORS.primary).setInteractive();
        this.add.text(w / 2, 360, 'PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);

        playBtn.on('pointerdown', () => {
            this.tweens.add({
                targets: playBtn, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true,
                onComplete: () => {
                    GameState.reset();
                    this.scene.stop('MenuScene');
                    this.scene.start('GameScene');
                    this.scene.start('HUDScene');
                }
            });
        });

        // Help button
        const helpBtn = this.add.rectangle(w - 40, 40, 50, 50, 0x3498DB).setInteractive();
        this.add.text(w - 40, 40, '?', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);

        helpBtn.on('pointerdown', () => {
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // Sound toggle
        const soundIcon = GameState.soundEnabled ? 'SND ON' : 'SND OFF';
        const soundBtn = this.add.text(30, h - 40, soundIcon, {
            fontSize: '14px', fontFamily: 'Arial', color: HEX.secondary
        }).setOrigin(0, 0.5).setInteractive();

        soundBtn.on('pointerdown', () => {
            GameState.soundEnabled = !GameState.soundEnabled;
            soundBtn.setText(GameState.soundEnabled ? 'SND ON' : 'SND OFF');
        });

        // Cashier decoration
        if (this.textures.exists('cashier_normal')) {
            this.add.image(w / 2, 490, 'cashier_normal').setScale(1.5).setAlpha(0.3);
        }
    }
}

class HUDScene extends Phaser.Scene {
    constructor() { super('HUDScene'); }

    create() {
        const w = GAME_WIDTH;

        // Suspicion bar background
        this.add.rectangle(w / 2, 12, w - 10, 20, COLORS.uiBg).setDepth(10);
        this.suspicionFill = this.add.rectangle(5, 12, 0, 16, COLORS.danger).setOrigin(0, 0.5).setDepth(11);

        // HUD bar
        this.add.rectangle(w / 2, 44, w, 36, 0x2C3E50, 0.85).setDepth(10);

        this.scoreText = this.add.text(15, 44, 'SCORE: ' + GameState.score.toString(), {
            fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0, 0.5).setDepth(11);

        this.stageText = this.add.text(w / 2, 44, 'STAGE ' + GameState.stage.toString(), {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.primary
        }).setOrigin(0.5).setDepth(11);

        // Alarm icons
        this.alarmIcons = [];
        for (let i = 0; i < MAX_ALARMS; i++) {
            const icon = this.add.circle(w - 50 + i * 20, 44, 7,
                i < GameState.alarmCount ? COLORS.danger : 0x555555
            ).setDepth(11);
            this.alarmIcons.push(icon);
        }

        // Combo text
        this.comboText = this.add.text(w / 2, 400, '', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.gold
        }).setOrigin(0.5).setDepth(11).setAlpha(0);

        // Overflow warning
        this.overflowText = this.add.text(w / 2, 75, '', {
            fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.danger
        }).setOrigin(0.5).setDepth(11).setAlpha(0);

        // Listen for events from GameScene
        this.scene.get('GameScene').events.on('updateScore', this.updateScore, this);
        this.scene.get('GameScene').events.on('updateStage', this.updateStage, this);
        this.scene.get('GameScene').events.on('updateAlarm', this.updateAlarm, this);
        this.scene.get('GameScene').events.on('updateSuspicion', this.updateSuspicion, this);
        this.scene.get('GameScene').events.on('updateCombo', this.updateCombo, this);
        this.scene.get('GameScene').events.on('showOverflow', this.showOverflow, this);
        this.scene.get('GameScene').events.on('floatScore', this.floatScore, this);
    }

    updateScore() {
        if (!this.scoreText) return;
        this.scoreText.setText('SCORE: ' + GameState.score.toLocaleString());
        this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
    }

    updateStage() {
        if (!this.stageText) return;
        this.stageText.setText('STAGE ' + GameState.stage);
    }

    updateAlarm() {
        if (!this.alarmIcons) return;
        for (let i = 0; i < MAX_ALARMS; i++) {
            this.alarmIcons[i].setFillStyle(i < GameState.alarmCount ? COLORS.danger : 0x555555);
        }
        if (GameState.alarmCount > 0) {
            const idx = GameState.alarmCount - 1;
            this.tweens.add({
                targets: this.alarmIcons[idx], scaleX: 1.4, scaleY: 1.4, duration: 150, yoyo: true
            });
        }
    }

    updateSuspicion() {
        if (!this.suspicionFill) return;
        const maxW = GAME_WIDTH - 14;
        this.suspicionFill.setSize(Math.min(maxW, (GameState.suspicion / 100) * maxW), 16);
        this.suspicionFill.setFillStyle(GameState.suspicion > 60 ? (GameState.suspicion > 80 ? COLORS.danger : COLORS.amber) : COLORS.danger);
    }

    updateCombo() {
        if (!this.comboText) return;
        if (GameState.combo < 3) { this.comboText.setAlpha(0); return; }
        const mult = GameState.combo >= 8 ? 2.0 : GameState.combo >= 5 ? 1.5 : 1.2;
        this.comboText.setText('x' + mult.toFixed(1)).setAlpha(1);
        this.tweens.add({ targets: this.comboText, scaleX: 1.1, scaleY: 1.1, duration: 400, yoyo: true, repeat: -1 });
    }

    showOverflow(seconds) {
        if (!this.overflowText) return;
        if (seconds > 0) {
            this.overflowText.setText('OVERFLOW IN: ' + seconds + 's');
            this.overflowText.setAlpha(1);
        } else {
            this.overflowText.setAlpha(0);
        }
    }

    floatScore(data) {
        if (!data) return;
        const txt = this.add.text(data.x, data.y, '+' + data.value, {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.gold
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
            targets: txt, y: data.y - 60, alpha: 0, duration: 700,
            onComplete: () => txt.destroy()
        });
    }

    shutdown() {
        const gs = this.scene.get('GameScene');
        if (gs) {
            gs.events.off('updateScore', this.updateScore, this);
            gs.events.off('updateStage', this.updateStage, this);
            gs.events.off('updateAlarm', this.updateAlarm, this);
            gs.events.off('updateSuspicion', this.updateSuspicion, this);
            gs.events.off('updateCombo', this.updateCombo, this);
            gs.events.off('showOverflow', this.showOverflow, this);
            gs.events.off('floatScore', this.floatScore, this);
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.reason = data.reason || 'busted';
    }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;

        // Dark overlay
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8);

        // Header
        const headerText = this.reason === 'overflow' ? 'SECURITY\nCALLED!' : 'BUSTED!';
        const header = this.add.text(w / 2, 120, headerText, {
            fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold',
            color: HEX.danger, align: 'center'
        }).setOrigin(0.5);
        this.tweens.add({ targets: header, scaleX: 1.05, scaleY: 1.05, duration: 300, yoyo: true, repeat: 2 });

        // Score
        this.add.text(w / 2, 220, 'SCORE', {
            fontSize: '16px', fontFamily: 'Arial', color: HEX.secondary
        }).setOrigin(0.5);

        const scoreDisplay = this.add.text(w / 2, 260, GameState.score.toLocaleString(), {
            fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);

        // Stage reached
        this.add.text(w / 2, 300, 'Stage ' + GameState.stage, {
            fontSize: '16px', fontFamily: 'Arial', color: HEX.secondary
        }).setOrigin(0.5);

        // New record check
        let isNewRecord = false;
        if (GameState.score > GameState.highScore) {
            GameState.highScore = GameState.score;
            try { localStorage.setItem('grocery-gamble_high_score', GameState.highScore.toString()); } catch(e) {}
            isNewRecord = true;
        }

        if (isNewRecord) {
            const newRec = this.add.text(w / 2, 335, 'NEW RECORD!', {
                fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: HEX.gold
            }).setOrigin(0.5);
            this.tweens.add({ targets: newRec, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
        }

        // Revive button (if not used)
        let btnY = 400;
        if (!GameState.adReviveUsed && this.reason === 'busted') {
            const reviveBtn = this.add.rectangle(w / 2, btnY, 240, 45, COLORS.amber).setInteractive();
            this.add.text(w / 2, btnY, 'Watch Ad to Continue', {
                fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
            }).setOrigin(0.5);
            reviveBtn.on('pointerdown', () => {
                GameState.adReviveUsed = true;
                GameState.alarmCount = Math.max(0, GameState.alarmCount - 1);
                GameState.suspicion = 50;
                this.scene.stop('GameOverScene');
                this.scene.stop('GameScene');
                this.scene.start('GameScene');
                this.scene.start('HUDScene');
            });
            btnY += 60;
        }

        // Play Again
        const playBtn = this.add.rectangle(w / 2, btnY, 240, 50, COLORS.primary).setInteractive();
        this.add.text(w / 2, btnY, 'PLAY AGAIN', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        playBtn.on('pointerdown', () => {
            GameState.reset();
            this.scene.stop('GameOverScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
            this.scene.start('HUDScene');
        });
        btnY += 60;

        // Menu
        const menuBtn = this.add.rectangle(w / 2, btnY, 240, 45, 0x555555).setInteractive();
        this.add.text(w / 2, btnY, 'MENU', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        menuBtn.on('pointerdown', () => {
            GameState.reset();
            this.scene.stop('GameOverScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });

        GameState.gamesPlayed++;
    }
}
