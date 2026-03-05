// help.js - HelpScene with illustrated instructions

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        const cx = GAME_WIDTH / 2;

        // Overlay background
        this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0A0E1A, 0.95).setDepth(0);

        // Scrollable content via camera
        let yPos = 40;

        // Title
        this.add.text(cx, yPos, 'HOW TO PLAY', {
            fontSize: '30px', fontFamily: 'Arial Black, Arial',
            color: '#FFD600', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        yPos += 40;

        this.add.text(cx, yPos, 'Hold to drift, release to fling passengers!', {
            fontSize: '14px', fontFamily: 'Arial', color: '#4DB6AC',
            wordWrap: { width: 300 }
        }).setOrigin(0.5);
        yPos += 50;

        // Control illustration - Hold gesture
        const gestBox = this.add.rectangle(cx, yPos + 50, 280, 120, 0x1A1E2E, 0.8)
            .setStrokeStyle(1, 0x00E5FF);

        // Draw finger hold icon
        this.add.circle(cx - 60, yPos + 40, 18, 0xFFFFFF, 0.2)
            .setStrokeStyle(2, 0x00E5FF);
        this.add.text(cx - 60, yPos + 40, '\u261B', {
            fontSize: '22px', color: '#00E5FF'
        }).setOrigin(0.5);

        this.add.text(cx - 60, yPos + 70, 'HOLD', {
            fontSize: '14px', fontFamily: 'Arial Black', color: '#00E5FF'
        }).setOrigin(0.5);
        this.add.text(cx - 60, yPos + 88, 'to drift', {
            fontSize: '12px', color: '#FFFFFF'
        }).setOrigin(0.5);

        // Draw taxi with drift arrow
        this.add.image(cx + 20, yPos + 30, 'taxi').setScale(1.5).setAngle(-45);
        // Curved arrow
        const arrow = this.add.graphics();
        arrow.lineStyle(2, 0xFF6B00);
        arrow.beginPath();
        arrow.arc(cx + 20, yPos + 55, 25, -2.5, -0.5, false);
        arrow.strokePath();
        // Arrow head
        arrow.fillStyle(0xFF6B00);
        arrow.fillTriangle(cx + 44, yPos + 43, cx + 38, yPos + 50, cx + 44, yPos + 53);

        // Release icon
        this.add.circle(cx + 80, yPos + 40, 18, 0xFFFFFF, 0.1)
            .setStrokeStyle(2, 0xFF2D7B, 0.6);
        this.add.text(cx + 80, yPos + 40, '\u261D', {
            fontSize: '22px', color: '#FF2D7B'
        }).setOrigin(0.5);
        this.add.text(cx + 80, yPos + 70, 'RELEASE', {
            fontSize: '14px', fontFamily: 'Arial Black', color: '#FF2D7B'
        }).setOrigin(0.5);
        this.add.text(cx + 80, yPos + 88, 'to launch', {
            fontSize: '12px', color: '#FFFFFF'
        }).setOrigin(0.5);

        yPos += 130;

        // Scoring section
        this.add.text(cx, yPos, 'SCORING', {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#FFD700'
        }).setOrigin(0.5);
        yPos += 30;

        const scoreInfo = [
            { zone: 'BULLSEYE', pts: '150', color: '#FF2D7B' },
            { zone: 'GOOD', pts: '100', color: '#FF8C00' },
            { zone: 'OK', pts: '50', color: '#4DB6AC' },
            { zone: 'MISS', pts: '-1 Life', color: '#FF1744' }
        ];
        scoreInfo.forEach((s) => {
            this.add.circle(cx - 90, yPos, 8, Phaser.Display.Color.HexStringToColor(s.color).color);
            this.add.text(cx - 70, yPos, s.zone, {
                fontSize: '14px', fontFamily: 'Arial Black', color: s.color
            }).setOrigin(0, 0.5);
            this.add.text(cx + 90, yPos, s.pts, {
                fontSize: '14px', fontFamily: 'Arial', color: '#FFFFFF'
            }).setOrigin(0.5);
            yPos += 28;
        });

        yPos += 10;

        // Rules
        this.add.text(cx, yPos, 'RULES', {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#FFD700'
        }).setOrigin(0.5);
        yPos += 28;

        const rules = [
            'You have 3 lives (taxi icons)',
            'Missing a building = lose 1 life',
            'Holding too long = crash into wall',
            'No input for 4 seconds = instant death',
            'Speed increases 5% each stage'
        ];
        rules.forEach((r) => {
            this.add.text(cx, yPos, '\u2022 ' + r, {
                fontSize: '13px', fontFamily: 'Arial', color: '#E8E8E8',
                wordWrap: { width: 280 }
            }).setOrigin(0.5);
            yPos += 22;
        });

        yPos += 15;

        // Tips
        this.add.text(cx, yPos, 'TIPS', {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#FFD700'
        }).setOrigin(0.5);
        yPos += 28;

        const tips = [
            'Release at ~90% drift for best accuracy',
            'Combo landings multiply your score!',
            'Watch for red flash = about to overdrift'
        ];
        tips.forEach((t) => {
            this.add.text(cx, yPos, '\u2605 ' + t, {
                fontSize: '13px', fontFamily: 'Arial', color: '#4DB6AC',
                wordWrap: { width: 280 }
            }).setOrigin(0.5);
            yPos += 24;
        });

        yPos += 20;

        // Got it button
        const gotItBg = this.add.rectangle(cx, yPos, 200, 48, 0x00E5FF, 0.2)
            .setStrokeStyle(2, 0x00E5FF).setInteractive({ useHandCursor: true });
        const gotItTxt = this.add.text(cx, yPos, 'GOT IT!', {
            fontSize: '22px', fontFamily: 'Arial Black', color: '#00E5FF'
        }).setOrigin(0.5);
        gotItTxt.disableInteractive();

        gotItBg.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume(this.returnTo);
        });
    }
}
