// Valve Panic - Help Scene & Pause Scene

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

    create() {
        const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;

        // Background overlay
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.92).setDepth(0);

        // Scrollable content via camera offset
        let yy = 30;

        // Title
        this.add.text(W / 2, yy, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial Black', fill: '#4ECDC4',
            stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);
        yy += 40;

        this.add.text(W / 2, yy, 'Keep the pipes from bursting!', {
            fontSize: '14px', fontFamily: 'Arial', fill: '#95A5A6'
        }).setOrigin(0.5).setDepth(10);
        yy += 40;

        // Control illustration 1: Tap & Hold
        this.add.rectangle(W / 2, yy + 50, W - 40, 120, 0x1a1a2e, 0.8).setDepth(5);
        // Mini pipe
        this.add.rectangle(W * 0.3, yy + 30, 30, 80, CONFIG.COLORS.PIPE_BODY).setDepth(10);
        const liq1 = this.add.rectangle(W * 0.3, yy + 70, 22, 40, CONFIG.PIPE_COLORS[0]).setOrigin(0.5, 1).setDepth(11);
        // Valve
        this.add.circle(W * 0.3, yy + 85, 10, CONFIG.COLORS.VALVE_IDLE).setDepth(12);
        // Finger icon (circle)
        const finger = this.add.circle(W * 0.3, yy + 95, 8, 0xFFFFFF, 0.6).setDepth(13);
        this.tweens.add({ targets: finger, y: yy + 80, duration: 600, yoyo: true, repeat: -1 });
        // Arrow down
        this.add.text(W * 0.3, yy + 45, 'v', {
            fontSize: '20px', fill: '#4ECDC4', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(13);

        this.add.text(W * 0.65, yy + 25, 'TAP & HOLD', {
            fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFF'
        }).setOrigin(0.5).setDepth(10);
        this.add.text(W * 0.65, yy + 48, 'on a pipe valve\nto drain pressure', {
            fontSize: '13px', fontFamily: 'Arial', fill: '#95A5A6', align: 'center'
        }).setOrigin(0.5).setDepth(10);
        // Animated drain
        this.tweens.add({ targets: liq1, displayHeight: 10, duration: 1500, yoyo: true, repeat: -1 });
        yy += 120;

        // Control illustration 2: Release Warning
        this.add.rectangle(W / 2, yy + 50, W - 40, 120, 0x1a1a2e, 0.8).setDepth(5);
        this.add.rectangle(W * 0.3, yy + 30, 30, 80, CONFIG.COLORS.PIPE_BODY).setDepth(10);
        const liq2 = this.add.rectangle(W * 0.3, yy + 70, 22, 50, 0xFF69B4).setOrigin(0.5, 1).setDepth(11);
        this.add.text(W * 0.3, yy + 25, '!', {
            fontSize: '22px', fontFamily: 'Arial Black', fill: '#FF4444'
        }).setOrigin(0.5).setDepth(13);
        this.tweens.add({ targets: liq2, displayHeight: 65, duration: 400, yoyo: true, repeat: -1, ease: 'Bounce' });

        this.add.text(W * 0.65, yy + 25, 'RELEASE EARLY', {
            fontSize: '16px', fontFamily: 'Arial Black', fill: '#FF69B4'
        }).setOrigin(0.5).setDepth(10);
        this.add.text(W * 0.65, yy + 48, '= SURGE +30%!\nDrain below 30%\nfor clean bonus', {
            fontSize: '12px', fontFamily: 'Arial', fill: '#95A5A6', align: 'center'
        }).setOrigin(0.5).setDepth(10);
        yy += 120;

        // Rule: burst
        this.add.rectangle(W / 2, yy + 35, W - 40, 70, 0x1a1a2e, 0.8).setDepth(5);
        this.add.text(W / 2, yy + 20, 'Pipe hits 100% = BURST = Game Over!', {
            fontSize: '14px', fontFamily: 'Arial Black', fill: '#FF4444'
        }).setOrigin(0.5).setDepth(10);
        this.add.text(W / 2, yy + 42, 'Only ONE valve at a time! New pipe every 10s', {
            fontSize: '12px', fontFamily: 'Arial', fill: '#95A5A6'
        }).setOrigin(0.5).setDepth(10);
        yy += 80;

        // Tips
        this.add.text(W / 2, yy, 'TIPS', {
            fontSize: '20px', fontFamily: 'Arial Black', fill: '#FFD700'
        }).setOrigin(0.5).setDepth(10);
        yy += 28;
        const tips = [
            'Drain below 30% for clean drain bonus',
            'Watch the fastest-filling pipe first',
            'Emergency saves (>90% to <30%) = +200 pts!'
        ];
        for (const tip of tips) {
            this.add.text(W / 2, yy, '* ' + tip, {
                fontSize: '12px', fontFamily: 'Arial', fill: '#A8E6CF',
                wordWrap: { width: W - 50 }, align: 'center'
            }).setOrigin(0.5).setDepth(10);
            yy += 26;
        }
        yy += 10;

        // Got it button
        const btn = this.add.rectangle(W / 2, yy + 10, 160, 44, 0x4ECDC4)
            .setDepth(10).setInteractive({ useHandCursor: true });
        this.add.text(W / 2, yy + 10, 'GOT IT!', {
            fontSize: '22px', fontFamily: 'Arial Black', fill: '#000'
        }).setOrigin(0.5).setDepth(11).disableInteractive();
        btn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume(this.returnTo);
        });
    }
}

class PauseScene extends Phaser.Scene {
    constructor() { super('PauseScene'); }

    create() {
        const W = CONFIG.GAME_WIDTH, H = CONFIG.GAME_HEIGHT;
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setDepth(0);

        this.add.text(W / 2, H * 0.25, 'PAUSED', {
            fontSize: '36px', fontFamily: 'Arial Black', fill: '#FFF',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);

        // Resume
        const resumeBtn = this.add.rectangle(W / 2, H * 0.40, 180, 48, 0x4ECDC4)
            .setDepth(10).setInteractive();
        this.add.text(W / 2, H * 0.40, 'RESUME', {
            fontSize: '22px', fontFamily: 'Arial Black', fill: '#000'
        }).setOrigin(0.5).setDepth(11).disableInteractive();
        resumeBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume('GameScene');
        });

        // Help
        const helpBtn = this.add.rectangle(W / 2, H * 0.50, 180, 44, 0x636E72)
            .setDepth(10).setInteractive();
        this.add.text(W / 2, H * 0.50, 'How to Play', {
            fontSize: '18px', fontFamily: 'Arial', fill: '#FFF'
        }).setOrigin(0.5).setDepth(11).disableInteractive();
        helpBtn.on('pointerdown', () => {
            this.scene.pause();
            this.scene.launch('HelpScene', { returnTo: 'PauseScene' });
        });

        // Restart
        const restartBtn = this.add.rectangle(W / 2, H * 0.59, 180, 44, 0xFF6B6B)
            .setDepth(10).setInteractive();
        this.add.text(W / 2, H * 0.59, 'RESTART', {
            fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFF'
        }).setOrigin(0.5).setDepth(11).disableInteractive();
        restartBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        });

        // Quit
        const quitBtn = this.add.rectangle(W / 2, H * 0.68, 180, 44, 0x636E72)
            .setDepth(10).setInteractive();
        this.add.text(W / 2, H * 0.68, 'QUIT TO MENU', {
            fontSize: '16px', fontFamily: 'Arial', fill: '#FFF'
        }).setOrigin(0.5).setDepth(11).disableInteractive();
        quitBtn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
    }
}
