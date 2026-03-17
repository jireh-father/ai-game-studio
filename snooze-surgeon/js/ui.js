class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

        // Title
        this.add.text(w / 2, 140, 'SNOOZE\nSURGEON', {
            fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold',
            color: COLORS.HUD_TEXT, align: 'center', lineSpacing: 8
        }).setOrigin(0.5).setShadow(3, 3, COLORS.TABLE, 0, true, true);

        // Patient illustration
        this.add.image(w / 2, 300, 'patient').setScale(0.6);

        // Sleeping Zs
        const zzz = this.add.text(90, 240, 'z z z', {
            fontSize: '20px', fontFamily: 'monospace', color: '#8D99AE'
        });
        this.tweens.add({
            targets: zzz, y: 230, alpha: 0.4,
            duration: 1200, yoyo: true, repeat: -1
        });

        // High score
        const hs = GameState.highScore;
        if (hs > 0) {
            this.add.text(w / 2, 400, 'BEST: ' + hs, {
                fontSize: '16px', fontFamily: 'monospace', color: '#8D99AE'
            }).setOrigin(0.5);
        }

        // OPERATE button
        const btnBg = this.add.rectangle(w / 2, 480, 200, 60, 0x06D6A0)
            .setInteractive({ useHandCursor: true });
        this.add.text(w / 2, 480, 'OPERATE!', {
            fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: '#0D1B2A'
        }).setOrigin(0.5).disableInteractive();

        btnBg.on('pointerdown', () => {
            this.tweens.add({
                targets: btnBg, scaleX: 0.95, scaleY: 0.95,
                duration: 60, yoyo: true, onComplete: () => {
                    GameState.reset();
                    AdsManager.resetSession();
                    this.scene.stop('MenuScene');
                    this.scene.start('GameScene');
                }
            });
        });

        // Help button
        const helpBg = this.add.circle(w - 40, 40, 24, 0x495057)
            .setInteractive({ useHandCursor: true });
        this.add.text(w - 40, 40, '?', {
            fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setOrigin(0.5).disableInteractive();

        helpBg.on('pointerdown', () => {
            this.scene.stop('MenuScene');
            this.scene.start('HelpScene', { returnTo: 'MenuScene' });
        });

        // Sound toggle
        const soundIcon = this.add.text(30, 30, GameState.soundEnabled ? 'SND' : 'MUTE', {
            fontSize: '14px', fontFamily: 'monospace', color: '#8D99AE'
        }).setInteractive();
        soundIcon.on('pointerdown', () => {
            GameState.soundEnabled = !GameState.soundEnabled;
            soundIcon.setText(GameState.soundEnabled ? 'SND' : 'MUTE');
        });

        AdsManager.showBanner();
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

        AdsManager.onGameOver();

        // Title slides down
        const title = this.add.text(w / 2, -50, 'OPERATION\nFAILED', {
            fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold',
            color: COLORS.DANGER, align: 'center'
        }).setOrigin(0.5);
        this.tweens.add({ targets: title, y: 120, duration: 600, ease: 'Bounce.easeOut' });

        // Animated score counter
        const scoreObj = { val: 0 };
        const scoreText = this.add.text(w / 2, 220, '0', {
            fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setOrigin(0.5);

        this.tweens.add({
            targets: scoreObj, val: GameState.score, duration: 1200,
            onUpdate: () => scoreText.setText(Math.floor(scoreObj.val).toString())
        });

        // High score check
        const isNew = GameState.score > GameState.highScore;
        if (isNew) {
            GameState.highScore = GameState.score;
            saveHighScore(GameState.highScore);
            this.time.delayedCall(1300, () => {
                this.add.text(w / 2, 270, 'NEW RECORD!', {
                    fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
                    color: COLORS.COMBO
                }).setOrigin(0.5);
            });
        }

        // Stage reached
        this.add.text(w / 2, 310, 'Stage Reached: ' + GameState.stage, {
            fontSize: '18px', fontFamily: 'monospace', color: '#8D99AE'
        }).setOrigin(0.5);

        let btnY = 400;

        // Continue ad button
        if (AdsManager.canShowContinue()) {
            const contBg = this.add.rectangle(w / 2, btnY, 220, 50, 0xFFD60A)
                .setInteractive({ useHandCursor: true });
            this.add.text(w / 2, btnY, 'WATCH AD TO CONTINUE', {
                fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#0D1B2A'
            }).setOrigin(0.5).disableInteractive();

            contBg.on('pointerdown', () => {
                AdsManager.showRewarded('continue', () => {
                    GameState.lives = 3;
                    this.scene.stop('GameOverScene');
                    this.scene.start('GameScene', { continueFromStage: GameState.stage });
                });
            });
            btnY += 70;
        }

        // Retry button
        const retryBg = this.add.rectangle(w / 2, btnY, 200, 56, 0x06D6A0)
            .setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'RETRY', {
            fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: '#0D1B2A'
        }).setOrigin(0.5).disableInteractive();

        retryBg.on('pointerdown', () => {
            GameState.reset();
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
        });
        btnY += 70;

        // Menu button
        const menuBg = this.add.rectangle(w / 2, btnY, 160, 48, 0x495057)
            .setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'MENU', {
            fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setOrigin(0.5).disableInteractive();

        menuBg.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        // Interstitial check
        if (AdsManager.shouldShowInterstitial()) {
            AdsManager.showInterstitial();
        }
    }
}
