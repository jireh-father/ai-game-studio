// Valve Panic - UI Scenes (Menu, GameOver, Pause)

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
        this.add.rectangle(W / 2, H / 2, W, H, CONFIG.COLORS.BG).setDepth(0);

        // Animated bg pipes
        this.bgPipes = [];
        for (let i = 0; i < 2; i++) {
            const x = W * 0.3 + i * W * 0.4;
            const pipe = this.add.rectangle(x, H * 0.55, 36, 200, CONFIG.COLORS.PIPE_BODY).setDepth(1);
            const liquid = this.add.rectangle(x, H * 0.65, 28, 0, CONFIG.PIPE_COLORS[i]).setDepth(2);
            liquid.setOrigin(0.5, 1);
            this.bgPipes.push({ pipe, liquid, fill: Math.random() * 0.5, dir: 1, rate: 0.3 + i * 0.15 });
        }

        // Title
        this.add.text(W / 2, H * 0.18, 'VALVE', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            fill: '#FF6B6B', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(10);
        this.add.text(W / 2, H * 0.26, 'PANIC', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            fill: '#4ECDC4', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(10);

        // High score
        const hi = localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE) || 0;
        this.add.text(W / 2, H * 0.34, 'BEST: ' + hi, {
            fontSize: '18px', fontFamily: 'Arial', fill: '#95A5A6'
        }).setOrigin(0.5).setDepth(10);

        // Play button
        const playBtn = this.add.rectangle(W / 2, H * 0.50, 160, 56, 0xFF6B6B, 1)
            .setDepth(10).setInteractive({ useHandCursor: true });
        playBtn.setStrokeStyle(3, 0xC44D4D);
        const playTxt = this.add.text(W / 2, H * 0.50, 'PLAY', {
            fontSize: '28px', fontFamily: 'Arial Black, Arial', fill: '#FFFFFF'
        }).setOrigin(0.5).setDepth(11);
        playTxt.disableInteractive();

        // Pulsing glow
        this.tweens.add({
            targets: playBtn, scaleX: 1.05, scaleY: 1.05,
            duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        playBtn.on('pointerdown', () => {
            Ads.hideBanner();
            this.scene.start('GameScene');
        });

        // Help button
        const helpBtn = this.add.circle(40, 40, 20, 0x636E72).setDepth(10).setInteractive();
        this.add.text(40, 40, '?', {
            fontSize: '22px', fontFamily: 'Arial Black', fill: '#FFF'
        }).setOrigin(0.5).setDepth(11).disableInteractive();
        helpBtn.on('pointerdown', () => {
            this.scene.pause();
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        Ads.showBanner();
    }

    update(time, delta) {
        for (const bp of this.bgPipes) {
            bp.fill += bp.dir * bp.rate * delta / 1000;
            if (bp.fill > 0.8) bp.dir = -1;
            if (bp.fill < 0.1) bp.dir = 1;
            bp.liquid.setSize(28, Math.max(1, bp.fill * 160));
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.survivalTime = data.time || 0;
        this.maxPipes = data.maxPipes || 2;
        this.combo = data.bestCombo || 0;
    }

    create() {
        const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(0);

        this.add.text(W / 2, H * 0.12, 'BURST!', {
            fontSize: '44px', fontFamily: 'Arial Black', fill: '#FF4444',
            stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        this.add.text(W / 2, H * 0.22, 'Survived: ' + this.survivalTime + 's', {
            fontSize: '20px', fontFamily: 'Arial', fill: '#95A5A6'
        }).setOrigin(0.5).setDepth(10);

        const hi = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE) || '0');
        const isNewBest = this.finalScore > hi;
        if (isNewBest) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, this.finalScore);
        }

        this.add.text(W / 2, H * 0.32, 'SCORE: ' + this.finalScore, {
            fontSize: '32px', fontFamily: 'Arial Black', fill: '#FFD700',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);

        if (isNewBest) {
            const nb = this.add.text(W / 2, H * 0.39, 'NEW BEST!', {
                fontSize: '24px', fontFamily: 'Arial Black', fill: '#FFD700'
            }).setOrigin(0.5).setDepth(10);
            this.tweens.add({ targets: nb, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true, repeat: 3 });
            Effects.particleBurst(this, W / 2, H * 0.39, 20, 0xFFD700, 150, 500);
        }

        this.add.text(W / 2, H * 0.44, 'Pipes: ' + this.maxPipes + '  Combo: x' + this.combo, {
            fontSize: '16px', fontFamily: 'Arial', fill: '#95A5A6'
        }).setOrigin(0.5).setDepth(10);

        // Continue button
        if (Ads.canContinue()) {
            const contBtn = this.add.rectangle(W / 2, H * 0.54, 220, 44, 0x4ECDC4)
                .setDepth(10).setInteractive();
            this.add.text(W / 2, H * 0.54, 'Continue (Ad)', {
                fontSize: '20px', fontFamily: 'Arial Black', fill: '#000'
            }).setOrigin(0.5).setDepth(11).disableInteractive();
            contBtn.on('pointerdown', () => {
                Ads.showRewardedContinue(() => {
                    this.scene.start('GameScene', { continueGame: true, prevData: this.scene.settings.data });
                });
            });
        }

        // Play Again
        const y1 = Ads.canContinue() ? H * 0.63 : H * 0.56;
        const retryBtn = this.add.rectangle(W / 2, y1, 180, 48, 0xFF6B6B)
            .setDepth(10).setInteractive();
        this.add.text(W / 2, y1, 'Play Again', {
            fontSize: '22px', fontFamily: 'Arial Black', fill: '#FFF'
        }).setOrigin(0.5).setDepth(11).disableInteractive();
        retryBtn.on('pointerdown', () => {
            Ads.reset();
            this.scene.start('GameScene');
        });

        // Menu
        const menuBtn = this.add.rectangle(W / 2, y1 + 60, 120, 38, 0x636E72)
            .setDepth(10).setInteractive();
        this.add.text(W / 2, y1 + 60, 'Menu', {
            fontSize: '18px', fontFamily: 'Arial', fill: '#FFF'
        }).setOrigin(0.5).setDepth(11).disableInteractive();
        menuBtn.on('pointerdown', () => {
            Ads.reset();
            this.scene.start('MenuScene');
        });

        Ads.onGameOver();
        // Increment games played
        const gp = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.GAMES_PLAYED) || '0');
        localStorage.setItem(CONFIG.STORAGE_KEYS.GAMES_PLAYED, gp + 1);
    }
}
