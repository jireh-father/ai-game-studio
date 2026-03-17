class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG);
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.WALL, 0.3);

        this.add.text(w / 2, 110, 'CAT BURGLAR', {
            fontSize: '34px', fontFamily: 'Arial', fill: '#F0EDE8', fontStyle: 'bold',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);

        if (this.textures.exists('cat')) {
            const cat = this.add.image(w / 2, 210, 'cat').setScale(1.2);
            this.tweens.add({ targets: cat, angle: { from: -5, to: 5 }, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }

        const playBg = this.add.rectangle(w / 2, 330, 200, 56, 0xD4AF37).setInteractive({ useHandCursor: true });
        this.add.text(w / 2, 330, 'PLAY', { fontSize: '24px', fontFamily: 'Arial', fill: '#1A1A2E', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();

        playBg.on('pointerdown', () => {
            this.tweens.add({ targets: playBg, scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true, onComplete: () => {
                this.scene.stop('MenuScene');
                this.scene.start('GameScene');
            }});
        });

        const hs = localStorage.getItem('cat-burglar_high_score') || 0;
        window.GameState.highScore = parseInt(hs);
        this.add.text(w / 2, 400, `Best: ${window.GameState.highScore}`, { fontSize: '16px', fontFamily: 'Arial', fill: '#888' }).setOrigin(0.5);

        // Help button
        const helpBg = this.add.circle(36, h - 50, 24, 0x2980B9).setInteractive({ useHandCursor: true });
        this.add.text(36, h - 50, '?', { fontSize: '24px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
        helpBg.on('pointerdown', () => {
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // Sound toggle
        this.soundOn = !window.GameState.muted;
        const soundTxt = this.add.text(w - 36, 30, this.soundOn ? '🔊' : '🔇', { fontSize: '22px' }).setOrigin(0.5).setInteractive();
        soundTxt.on('pointerdown', () => {
            this.soundOn = !this.soundOn;
            window.GameState.muted = !this.soundOn;
            soundTxt.setText(this.soundOn ? '🔊' : '🔇');
            this.sound.mute = !this.soundOn;
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.stageReached = data.stage || 1;
        this.deathType = data.deathType || 'caught';
    }

    create() {
        const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85);

        const titleText = this.deathType === 'idle' ? 'BUSTED!' : 'CAUGHT!';
        const title = this.add.text(w / 2, 120, titleText, {
            fontSize: '36px', fontFamily: 'Arial', fill: '#FF3333', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({ targets: title, scaleX: 1.1, scaleY: 1.1, duration: 300, yoyo: true, repeat: -1 });

        if (this.textures.exists('dog_awake')) {
            this.add.image(w / 2, 200, 'dog_awake').setScale(1.5);
        }

        const isNewRecord = this.finalScore > window.GameState.highScore;
        if (isNewRecord) {
            window.GameState.highScore = this.finalScore;
            localStorage.setItem('cat-burglar_high_score', this.finalScore);
        }

        this.add.text(w / 2, 290, `${this.finalScore}`, {
            fontSize: '48px', fontFamily: 'Arial', fill: '#F0EDE8', fontStyle: 'bold'
        }).setOrigin(0.5);

        if (isNewRecord) {
            const rec = this.add.text(w / 2, 330, 'NEW RECORD!', { fontSize: '20px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);
            this.tweens.add({ targets: rec, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
        }

        this.add.text(w / 2, 365, `Stage ${this.stageReached}`, { fontSize: '18px', fontFamily: 'Arial', fill: '#888' }).setOrigin(0.5);

        let btnY = 420;

        // Continue button (rewarded ad, once per session)
        if (ADS.canShowContinue()) {
            const contBg = this.add.rectangle(w / 2, btnY, 260, 52, 0x8E44AD).setInteractive({ useHandCursor: true });
            this.add.text(w / 2, btnY, 'Continue? (Watch Ad)', { fontSize: '17px', fontFamily: 'Arial', fill: '#FFF', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
            contBg.on('pointerdown', () => {
                window.GameState.continueUsed = true;
                ADS.showRewarded(() => {
                    this.scene.stop('GameOverScene');
                    this.scene.start('GameScene', { continueFrom: this.stageReached, score: this.finalScore });
                }, () => {});
            });
            btnY += 65;
        }

        // Play again
        const playBg = this.add.rectangle(w / 2, btnY, 260, 50, 0xD4AF37).setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'Play Again', { fontSize: '20px', fontFamily: 'Arial', fill: '#1A1A2E', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
        playBg.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
        });
        btnY += 58;

        // Menu
        const menuBg = this.add.rectangle(w / 2, btnY, 260, 44, 0x444444).setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'Menu', { fontSize: '18px', fontFamily: 'Arial', fill: '#CCC' }).setOrigin(0.5).disableInteractive();
        menuBg.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        });

        // Show interstitial if triggered
        if (ADS.trackDeathCount()) {
            ADS.showInterstitial(() => {});
        }
    }
}
