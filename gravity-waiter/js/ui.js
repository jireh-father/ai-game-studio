// Gravity Waiter - UI Scenes (Menu, GameOver, HUD)

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;
        this.cameras.main.setBackgroundColor(CONFIG.COLOR.BG_WALL);

        // Restaurant background elements
        this.add.rectangle(W / 2, H - 100, W, 200, 0xCC2200);
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 3; j++) {
                if ((i + j) % 2 === 0) {
                    this.add.rectangle(i * 40 + 20, H - 180 + j * 40, 40, 40, 0xFFFAFA);
                }
            }
        }

        // Title
        this.add.text(W / 2, 140, 'GRAVITY\nWAITER', {
            fontSize: '48px', fontStyle: 'bold', color: CONFIG.COLOR.TEXT,
            fontFamily: 'Arial', align: 'center', lineSpacing: 4
        }).setOrigin(0.5).setShadow(3, 3, '#00000044', 4);

        // Animated preview tray
        const tray = this.add.image(W / 2, 280, 'tray').setScale(0.7);
        const plate1 = this.add.image(W / 2 - 15, 260, 'plate').setScale(0.7);
        const plate2 = this.add.image(W / 2 + 10, 248, 'plate').setScale(0.7);
        this.tweens.add({
            targets: [tray, plate1, plate2],
            angle: { from: -3, to: 3 }, duration: 1200,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // High score
        let highScore = 0;
        try { highScore = parseInt(localStorage.getItem('gravity-waiter_high_score')) || 0; } catch (e) {}
        this.add.text(W / 2, 320, 'BEST: ' + highScore, {
            fontSize: '16px', color: CONFIG.COLOR.TEXT, fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.rectangle(W / 2, 420, 280, 70, 0xE63946, 1)
            .setInteractive({ useHandCursor: true });
        this.add.text(W / 2, 420, 'PLAY', {
            fontSize: '28px', fontStyle: 'bold', color: '#FFFFFF', fontFamily: 'Arial'
        }).setOrigin(0.5).disableInteractive();

        playBtn.on('pointerup', () => {
            this.cameras.main.fadeOut(200, 0, 0, 0);
            this.time.delayedCall(200, () => {
                this.scene.stop();
                this.scene.start('GameScene');
            });
        });
        playBtn.on('pointerover', () => playBtn.setFillStyle(0xC44040));
        playBtn.on('pointerout', () => playBtn.setFillStyle(0xE63946));

        // Help button
        const helpBtn = this.add.circle(W - 40, 40, 22, 0xFFFFFF, 0.9)
            .setInteractive({ useHandCursor: true });
        this.add.text(W - 40, 40, '?', {
            fontSize: '22px', fontStyle: 'bold', color: CONFIG.COLOR.TEXT, fontFamily: 'Arial'
        }).setOrigin(0.5).disableInteractive();

        helpBtn.on('pointerup', () => {
            this.scene.launch('HelpScene', { returnTo: 'MenuScene', wasRunning: false });
        });

        // Sound toggle
        const soundOn = !(window.GW && window.GW.muted);
        this.soundIcon = this.add.text(30, H - 40, soundOn ? '\u266B' : '\u266A\u0338', {
            fontSize: '28px', color: CONFIG.COLOR.TEXT, fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.soundIcon.on('pointerup', () => {
            window.GW.muted = !window.GW.muted;
            this.sound.mute = window.GW.muted;
            this.soundIcon.setText(window.GW.muted ? '\u2022' : '\u266B');
        });

        this.cameras.main.fadeIn(200);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.highScore = data.highScore || 0;
        this.isNewRecord = data.isNewRecord || false;
        this.dishesSurvived = data.dishesSurvived || 0;
        this.stageReached = data.stageReached || 1;
    }

    create() {
        const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);

        // Game Over text
        this.add.text(W / 2, 100, 'GAME OVER', {
            fontSize: '42px', fontStyle: 'bold', color: CONFIG.COLOR.ACCENT,
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Crash pile - scattered plates
        for (let i = 0; i < 5; i++) {
            const px = W / 2 + (Math.random() - 0.5) * 120;
            const py = 180 + Math.random() * 40;
            const img = this.add.image(px, py, 'plate').setAngle(Math.random() * 60 - 30).setScale(0.8);
            img.setAlpha(0.7);
        }

        // Score
        this.add.text(W / 2, 260, 'SCORE', {
            fontSize: '16px', color: '#AAAAAA', fontFamily: 'Arial'
        }).setOrigin(0.5);
        const scoreTxt = this.add.text(W / 2, 295, String(this.finalScore), {
            fontSize: '44px', fontStyle: 'bold', color: '#FFFFFF', fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.tweens.add({ targets: scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });

        // High score
        const bestColor = this.isNewRecord ? CONFIG.COLOR.GOLD : '#AAAAAA';
        this.add.text(W / 2, 340, 'BEST: ' + this.highScore, {
            fontSize: '18px', color: bestColor, fontFamily: 'Arial'
        }).setOrigin(0.5);

        if (this.isNewRecord) {
            const nr = this.add.text(W / 2, 365, 'NEW RECORD!', {
                fontSize: '20px', fontStyle: 'bold', color: CONFIG.COLOR.GOLD, fontFamily: 'Arial'
            }).setOrigin(0.5);
            this.tweens.add({ targets: nr, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
        }

        // Stats
        this.add.text(W / 2, 400, 'Stage ' + this.stageReached + '  |  ' + this.dishesSurvived + ' dishes served', {
            fontSize: '14px', color: '#999999', fontFamily: 'Arial'
        }).setOrigin(0.5);

        let btnY = 460;

        // Ad continue button
        if (AdsManager.canContinue()) {
            const adBtn = this.add.rectangle(W / 2, btnY, 280, 55, 0xF39C12)
                .setInteractive({ useHandCursor: true });
            this.add.text(W / 2, btnY, 'WATCH AD TO CONTINUE', {
                fontSize: '16px', fontStyle: 'bold', color: '#FFFFFF', fontFamily: 'Arial'
            }).setOrigin(0.5).disableInteractive();

            adBtn.on('pointerup', () => {
                AdsManager.markContinueUsed();
                AdsManager.showRewarded((success) => {
                    if (success) {
                        this.scene.stop();
                        this.scene.get('GameScene').continueAfterAd();
                    }
                });
            });
            btnY += 70;
        }

        // Play Again
        const playBtn = this.add.rectangle(W / 2, btnY, 280, 55, 0xE63946)
            .setInteractive({ useHandCursor: true });
        this.add.text(W / 2, btnY, 'PLAY AGAIN', {
            fontSize: '20px', fontStyle: 'bold', color: '#FFFFFF', fontFamily: 'Arial'
        }).setOrigin(0.5).disableInteractive();

        playBtn.on('pointerup', () => {
            AdsManager.onGameOver();
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('GameScene');
        });
        btnY += 65;

        // Menu
        const menuBtn = this.add.rectangle(W / 2, btnY, 180, 45, 0x555555)
            .setInteractive({ useHandCursor: true });
        this.add.text(W / 2, btnY, 'MENU', {
            fontSize: '16px', fontStyle: 'bold', color: '#FFFFFF', fontFamily: 'Arial'
        }).setOrigin(0.5).disableInteractive();

        menuBtn.on('pointerup', () => {
            AdsManager.onGameOver();
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MenuScene');
        });

        this.cameras.main.fadeIn(200);
    }
}
