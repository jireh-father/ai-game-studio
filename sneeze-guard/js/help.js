// Sneeze Guard - Help Scene
class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        const W = CONFIG.GAME_WIDTH;
        const H = CONFIG.GAME_HEIGHT;

        // Background
        this.add.rectangle(W / 2, H / 2, W, H, 0xFEFCF7).setDepth(0);

        // Scrollable content via camera
        let yOff = 30;

        // Title
        this.add.text(W / 2, yOff, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial Black, Arial',
            fontStyle: 'bold', color: CONFIG.COLOR.TEXT
        }).setOrigin(0.5);
        yOff += 40;

        this.add.text(W / 2, yOff, 'Tap to raise the guard before the sneeze!', {
            fontSize: '14px', fontFamily: 'Arial', color: '#666666',
            wordWrap: { width: W - 40 }
        }).setOrigin(0.5);
        yOff += 35;

        // Wind-up sequence diagram
        this.add.text(W / 2, yOff, '--- WIND-UP SEQUENCE ---', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            color: CONFIG.COLOR.PRIMARY
        }).setOrigin(0.5);
        yOff += 25;

        // 3 patron frames side by side
        const frameW = 60;
        const startX = W / 2 - frameW * 1.5;
        const labels = ['Normal', 'Nose\ntwitch', 'Inhale!\nTAP NOW'];
        const keys = ['patron_neutral', 'patron_windup1', 'patron_windup2'];
        for (let i = 0; i < 3; i++) {
            const fx = startX + i * (frameW + 30);
            if (this.textures.exists(keys[i])) {
                this.add.image(fx, yOff + 20, keys[i]).setScale(0.8);
            } else {
                this.add.circle(fx, yOff + 20, 18, 0xE8C99A).setStrokeStyle(2, 0x2C2C2C);
            }
            this.add.text(fx, yOff + 55, labels[i], {
                fontSize: '11px', fontFamily: 'Arial', color: CONFIG.COLOR.TEXT,
                align: 'center'
            }).setOrigin(0.5);
            if (i < 2) {
                this.add.text(fx + frameW / 2 + 10, yOff + 20, '>', {
                    fontSize: '20px', color: CONFIG.COLOR.PRIMARY, fontStyle: 'bold'
                }).setOrigin(0.5);
            }
        }
        yOff += 85;

        // Tap zone diagram
        this.add.text(W / 2, yOff, '--- TAP ANYWHERE ---', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            color: CONFIG.COLOR.PRIMARY
        }).setOrigin(0.5);
        yOff += 20;

        // Phone silhouette
        const phoneX = W / 2;
        this.add.rectangle(phoneX, yOff + 35, 60, 90, 0x4A90D9, 0.3)
            .setStrokeStyle(2, 0x4A90D9);
        this.add.text(phoneX, yOff + 35, 'TAP!', {
            fontSize: '16px', fontFamily: 'Arial Black', color: CONFIG.COLOR.PRIMARY
        }).setOrigin(0.5);
        this.add.text(phoneX + 55, yOff + 35, 'Full screen is\nthe tap zone!', {
            fontSize: '11px', fontFamily: 'Arial', color: '#666',
            align: 'left'
        }).setOrigin(0, 0.5);
        yOff += 90;

        // Timing bar
        this.add.text(W / 2, yOff, '--- TIMING ---', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            color: CONFIG.COLOR.PRIMARY
        }).setOrigin(0.5);
        yOff += 22;

        const barX = 50;
        const barW = W - 100;
        // Too early
        this.add.rectangle(barX + barW * 0.1, yOff, barW * 0.2, 16, 0xFF5555).setOrigin(0.5);
        this.add.text(barX + barW * 0.1, yOff + 14, 'TOO EARLY', {
            fontSize: '9px', color: '#FF5555'
        }).setOrigin(0.5);
        // Perfect
        this.add.rectangle(barX + barW * 0.37, yOff, barW * 0.2, 20, 0xFFD700).setOrigin(0.5);
        this.add.text(barX + barW * 0.37, yOff + 16, 'PERFECT!', {
            fontSize: '10px', fontStyle: 'bold', color: '#DAA520'
        }).setOrigin(0.5);
        // Good
        this.add.rectangle(barX + barW * 0.6, yOff, barW * 0.16, 18, 0x88CC44).setOrigin(0.5);
        this.add.text(barX + barW * 0.6, yOff + 15, 'GOOD', {
            fontSize: '9px', color: '#5A9A22'
        }).setOrigin(0.5);
        // Too late
        this.add.rectangle(barX + barW * 0.83, yOff, barW * 0.2, 16, 0xFF5555).setOrigin(0.5);
        this.add.text(barX + barW * 0.83, yOff + 14, 'TOO LATE', {
            fontSize: '9px', color: '#FF5555'
        }).setOrigin(0.5);
        yOff += 40;

        // Fake-out section
        this.add.text(W / 2, yOff, '--- FAKE-OUTS (Stage 8+) ---', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            color: CONFIG.COLOR.PRIMARY
        }).setOrigin(0.5);
        yOff += 22;
        this.add.text(W / 2, yOff, 'Some patrons fake a sneeze!\nNo head tilt back = FAKE. Don\'t tap!', {
            fontSize: '13px', fontFamily: 'Arial', color: CONFIG.COLOR.TEXT,
            align: 'center', wordWrap: { width: W - 60 }
        }).setOrigin(0.5);
        yOff += 40;

        // Scoring
        this.add.text(W / 2, yOff, '--- SCORING ---', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            color: CONFIG.COLOR.PRIMARY
        }).setOrigin(0.5);
        yOff += 20;
        const scores = [
            'Perfect Block: 500 pts',
            'Good Block: 200 pts',
            'Fake-out Survived: 150 pts',
            'Streak 3+: DOUBLE POINTS!',
            'Streak 5+: TRIPLE POINTS!'
        ];
        scores.forEach((s, i) => {
            this.add.text(W / 2, yOff + i * 18, s, {
                fontSize: '12px', fontFamily: 'Arial', color: CONFIG.COLOR.TEXT
            }).setOrigin(0.5);
        });
        yOff += scores.length * 18 + 15;

        // Tips
        this.add.text(W / 2, yOff, '--- TIPS ---', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            color: CONFIG.COLOR.PRIMARY
        }).setOrigin(0.5);
        yOff += 20;
        const tips = [
            '1. Wait for the inhale (head tilt back)',
            '2. Fake-outs have NO head tilt',
            '3. Every 10th stage is a rest stage!'
        ];
        tips.forEach((t, i) => {
            this.add.text(W / 2, yOff + i * 20, t, {
                fontSize: '12px', fontFamily: 'Arial', color: '#555555'
            }).setOrigin(0.5);
        });
        yOff += tips.length * 20 + 25;

        // GOT IT button - fixed near bottom
        const btnY = Math.max(yOff, H - 70);
        const btnBg = this.add.rectangle(W / 2, btnY, 200, 50, 0x4A90D9)
            .setInteractive({ useHandCursor: true }).setDepth(60);
        const btnTxt = this.add.text(W / 2, btnY, 'GOT IT!', {
            fontSize: '22px', fontFamily: 'Arial Black, Arial',
            fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(61);
        btnTxt.disableInteractive();

        // Full-screen fallback tap zone
        const fallback = this.add.rectangle(W / 2, btnY, W, 80, 0x000000, 0)
            .setInteractive().setDepth(59);

        const handleGotIt = () => {
            this.scene.stop();
            if (this.returnTo === 'GameScene') {
                const gs = this.scene.get('GameScene');
                if (gs && gs.paused) gs.togglePause();
                this.scene.resume('GameScene');
            } else {
                this.scene.resume(this.returnTo);
            }
        };

        btnBg.on('pointerdown', handleGotIt);
        fallback.on('pointerdown', handleGotIt);

        // Scroll support if content is tall
        if (yOff > H - 30) {
            this.cameras.main.setBounds(0, 0, W, yOff + 80);
            this.input.on('pointermove', (pointer) => {
                if (pointer.isDown) {
                    this.cameras.main.scrollY -= pointer.velocity.y * 0.02;
                    this.cameras.main.scrollY = Phaser.Math.Clamp(
                        this.cameras.main.scrollY, 0, yOff + 80 - H
                    );
                }
            });
        }
    }
}
