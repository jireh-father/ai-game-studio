class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(w / 2, h / 2, w, h, COLORS.UI_BG);

        // Background falling stickman animation
        this.menuChar = this.add.image(w / 2, -40, 'player').setAlpha(0.15).setScale(1.5);
        this.tweens.add({
            targets: this.menuChar, y: h * 0.86, duration: 2000,
            ease: 'Quad.easeIn', yoyo: false, repeat: -1,
            onRepeat: () => { this.menuChar.y = -40; }
        });

        this.add.text(w / 2, h * 0.22, 'NAIL THE\nLANDING', {
            fontSize: '38px', fontFamily: 'Arial', color: '#FFFFFF',
            fontStyle: 'bold', align: 'center', lineSpacing: 4
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.38, 'Stick it or splat.', {
            fontSize: '16px', fontFamily: 'Arial', color: '#CBD5E1'
        }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.rectangle(w / 2, h * 0.52, 200, 60, COLORS.PRIMARY)
            .setInteractive({ useHandCursor: true });
        const playTxt = this.add.text(w / 2, h * 0.52, 'PLAY', {
            fontSize: '24px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        playBtn.on('pointerdown', () => {
            this.cameras.main.flash(100, 255, 255, 255);
            this.scene.stop('MenuScene');
            this.scene.start('GameScene');
            this.scene.start('HUDScene');
        });

        // How to play button
        const helpBtn = this.add.rectangle(w / 2, h * 0.65, 160, 50, COLORS.UI_DARK)
            .setInteractive({ useHandCursor: true });
        this.add.text(w / 2, h * 0.65, '? HOW TO PLAY', {
            fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        helpBtn.on('pointerdown', () => {
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // High score
        const highScore = parseInt(localStorage.getItem(LS_KEY)) || 0;
        this.add.text(w / 2, h * 0.78, `BEST: ${highScore}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#F59E0B', fontStyle: 'bold'
        }).setOrigin(0.5);
    }
}

class HUDScene extends Phaser.Scene {
    constructor() { super('HUDScene'); }

    create() {
        const w = this.scale.width;
        this.livesIcons = [];
        for (let i = 0; i < MAX_LIVES; i++) {
            const icon = this.add.circle(24 + i * 28, 24, 10, COLORS.PRIMARY).setDepth(10);
            this.livesIcons.push(icon);
        }

        this.scoreText = this.add.text(w / 2, 24, '0', {
            fontSize: '20px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);

        this.stageText = this.add.text(w - 60, 24, 'STAGE 1', {
            fontSize: '14px', fontFamily: 'Arial', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(10);

        // Pause button
        const pauseBtn = this.add.text(w - 16, 24, '\u23F8', {
            fontSize: '24px', fontFamily: 'Arial', color: '#FFFFFF'
        }).setOrigin(1, 0.5).setDepth(10).setInteractive({ useHandCursor: true });
        pauseBtn.on('pointerdown', () => { this.showPause(); });

        // Combo badge
        this.comboBadge = this.add.text(w / 2, this.scale.height * 0.4, '', {
            fontSize: '32px', fontFamily: 'Arial', color: '#F59E0B', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10).setAlpha(0);

        // Pause overlay elements (hidden)
        this.pauseGroup = [];
        this.pauseVisible = false;

        // Listen for game events
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('updateHUD', this.onUpdateHUD, this);
        gameScene.events.on('gameOver', this.onGameOver, this);
    }

    onUpdateHUD(data) {
        if (!this.scoreText) return;
        this.scoreText.setText(data.score.toString());
        this.stageText.setText(`STAGE ${data.stage}`);

        // Update lives
        for (let i = 0; i < MAX_LIVES; i++) {
            this.livesIcons[i].setFillStyle(i < data.lives ? COLORS.PRIMARY : 0x475569);
            if (i === data.lives && data.lifeLost) {
                this.tweens.add({
                    targets: this.livesIcons[i], scaleX: 1.3, scaleY: 1.3,
                    duration: 200, yoyo: true
                });
            }
        }

        // Score pulse
        if (data.scorePulse) {
            this.tweens.add({
                targets: this.scoreText, scaleX: 1.3, scaleY: 1.3,
                duration: 200, yoyo: true
            });
        }

        // Combo badge
        if (data.combo >= 2) {
            this.comboBadge.setText(`x${data.combo} COMBO`);
            this.comboBadge.setAlpha(1);
            this.tweens.add({
                targets: this.comboBadge, scaleX: 1.5, scaleY: 1.5,
                duration: 150, yoyo: true
            });
            if (data.combo >= 10) {
                this.comboBadge.setColor('#FFFFFF');
                this.comboBadge.setStroke('#F59E0B', 4);
            } else if (data.combo >= 5) {
                this.comboBadge.setColor('#F59E0B');
                this.tweens.add({
                    targets: this.comboBadge, alpha: 0.8, duration: 100, yoyo: true, repeat: 2
                });
            }
        } else {
            this.comboBadge.setAlpha(0);
        }
    }

    onGameOver(data) {
        this.scene.stop('HUDScene');
    }

    showPause() {
        if (this.pauseVisible) return;
        this.pauseVisible = true;
        this.scene.pause('GameScene');

        const w = this.scale.width;
        const h = this.scale.height;

        const bg = this.add.rectangle(w / 2, h / 2, w, h, COLORS.UI_BG, 0.85).setDepth(20);
        const title = this.add.text(w / 2, h * 0.25, 'PAUSED', {
            fontSize: '28px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(21);

        const makeBtn = (y, label, color, cb) => {
            const btn = this.add.rectangle(w / 2, y, 160, 50, color).setDepth(21).setInteractive({ useHandCursor: true });
            const txt = this.add.text(w / 2, y, label, {
                fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(22);
            btn.on('pointerdown', cb);
            this.pauseGroup.push(btn, txt);
            return btn;
        };

        this.pauseGroup.push(bg, title);

        makeBtn(h * 0.4, 'RESUME', COLORS.PRIMARY, () => this.hidePause());
        makeBtn(h * 0.5, 'RESTART', COLORS.UI_DARK, () => {
            this.clearPause();
            this.scene.stop('GameScene');
            this.scene.stop('HUDScene');
            this.scene.start('GameScene');
            this.scene.start('HUDScene');
        });
        makeBtn(h * 0.6, 'MENU', COLORS.UI_DARK, () => {
            this.clearPause();
            this.scene.stop('GameScene');
            this.scene.stop('HUDScene');
            this.scene.start('MenuScene');
        });
        makeBtn(h * 0.7, '? HELP', 0x1E293B, () => {
            this.scene.pause('HUDScene');
            this.scene.launch('HelpScene', { returnTo: 'GameScene' });
        });
    }

    hidePause() {
        this.clearPause();
        this.scene.resume('GameScene');
    }

    clearPause() {
        this.pauseGroup.forEach(obj => obj.destroy());
        this.pauseGroup = [];
        this.pauseVisible = false;
    }

    shutdown() {
        this.tweens.killAll();
        this.time.removeAllEvents();
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.off('updateHUD', this.onUpdateHUD, this);
            gameScene.events.off('gameOver', this.onGameOver, this);
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalStage = data.stage || 1;
        this.isHighScore = data.isHighScore || false;
        this.lives = data.lives || 0;
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(w / 2, h / 2, w, h, COLORS.UI_BG, 0.95);

        const header = this.isHighScore ? 'NEW RECORD!' : 'SPLAT!';
        const headerColor = this.isHighScore ? '#F59E0B' : '#DC2626';
        const headerTxt = this.add.text(w / 2, h * 0.18, header, {
            fontSize: '32px', fontFamily: 'Arial', color: headerColor, fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({ targets: headerTxt, scaleX: 1.1, scaleY: 1.1, duration: 300, yoyo: true, repeat: -1 });

        this.add.text(w / 2, h * 0.32, this.finalScore.toString(), {
            fontSize: '48px', fontFamily: 'Arial', color: '#F59E0B', fontStyle: 'bold'
        }).setOrigin(0.5);

        const highScore = parseInt(localStorage.getItem(LS_KEY)) || 0;
        const bestColor = this.isHighScore ? '#F59E0B' : '#FFFFFF';
        this.add.text(w / 2, h * 0.42, `BEST: ${Math.max(highScore, this.finalScore)}`, {
            fontSize: '20px', fontFamily: 'Arial', color: bestColor
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.48, `Stage ${this.finalStage}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#CBD5E1'
        }).setOrigin(0.5);

        let btnY = h * 0.58;

        // Revive button
        if (AdManager.canShowRevive()) {
            const reviveBtn = this.add.rectangle(w / 2, btnY, 220, 50, COLORS.GOLD)
                .setInteractive({ useHandCursor: true });
            this.add.text(w / 2, btnY, 'WATCH AD TO REVIVE', {
                fontSize: '16px', fontFamily: 'Arial', color: '#0F172A', fontStyle: 'bold'
            }).setOrigin(0.5);
            reviveBtn.on('pointerdown', () => {
                AdManager.useRevive();
                AdManager.showRewarded(() => {
                    this.scene.stop('GameOverScene');
                    this.scene.start('GameScene', { revive: true, score: this.finalScore, stage: this.finalStage });
                    this.scene.start('HUDScene');
                });
            });
            btnY += 65;
        }

        // Try again
        const retryBtn = this.add.rectangle(w / 2, btnY, 200, 55, COLORS.PRIMARY)
            .setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'TRY AGAIN', {
            fontSize: '20px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        retryBtn.on('pointerdown', () => {
            this.cameras.main.flash(100, 255, 255, 255);
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
            this.scene.start('HUDScene');
        });
        btnY += 60;

        // Menu
        const menuBtn = this.add.rectangle(w / 2, btnY, 160, 48, COLORS.UI_DARK)
            .setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'MENU', {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        menuBtn.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        AdManager.showInterstitial();
    }
}
