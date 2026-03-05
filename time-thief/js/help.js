// help.js - HelpScene with illustrated instructions
class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A1A, 0.95).setInteractive();

        let y = 40;

        // Title
        this.add.text(w / 2, y, 'HOW TO STEAL TIME', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00F5FF'
        }).setOrigin(0.5);
        y += 40;

        this.add.text(w / 2, y, 'Steal seconds from obstacles\nto keep your timer alive!', {
            fontSize: '13px', fontFamily: 'Arial', color: '#E0E0E0', align: 'center'
        }).setOrigin(0.5);
        y += 50;

        // --- Control 1: Swipe to Steal ---
        this.add.text(30, y, 'SWIPE LEFT', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00E676'
        });
        y += 22;
        // Illustration: player -> arrow -> crystal
        this.add.image(60, y + 15, 'player').setScale(0.7);
        // Arrow
        const arrowLen = 70;
        const arrowX = 100;
        this.add.rectangle(arrowX + arrowLen / 2, y + 15, arrowLen, 3, 0x00F5FF);
        // Arrow head
        const ax = arrowX + arrowLen;
        this.add.triangle(ax, y + 15, 0, -6, 12, 0, 0, 6, 0x00F5FF);
        // Crystal
        this.add.image(ax + 30, y + 15, 'obstacle').setScale(0.6);
        // +3s label
        this.add.text(ax + 55, y + 5, '+3s', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00E676'
        });
        y += 50;

        this.add.text(30, y, 'Swipe through obstacles to\nsteal their time value', {
            fontSize: '12px', fontFamily: 'Arial', color: '#E0E0E0'
        });
        y += 40;

        // --- Control 2: Tap to Dodge ---
        this.add.text(30, y, 'TAP TO DODGE', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FF1744'
        });
        y += 22;
        // Illustration: player hopping over bomb
        const playerY = y + 20;
        this.add.image(60, playerY, 'player').setScale(0.6).setAlpha(0.4);
        this.add.image(60, playerY - 25, 'player').setScale(0.6);
        // Up arrow
        this.add.rectangle(60, playerY - 40, 2, 15, 0x00F5FF);
        this.add.triangle(60, playerY - 50, -5, 0, 5, 0, 0, -8, 0x00F5FF);
        // Bomb
        this.add.image(130, playerY, 'bomb').setScale(0.6);
        this.add.text(155, playerY - 8, '-2s', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FF1744'
        });
        y += 60;

        this.add.text(30, y, 'Tap anywhere to hop over\nred time bombs!', {
            fontSize: '12px', fontFamily: 'Arial', color: '#E0E0E0'
        });
        y += 40;

        // --- Rules ---
        this.add.text(30, y, 'RULES', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFB300'
        });
        y += 22;

        const rules = [
            '- Timer constantly drains. It IS your life.',
            '- Steal time from obstacles to survive.',
            '- Missed obstacles stack = less space!',
            '- Chain steals for x2, x3, x5 multipliers.',
            '- Boss obstacles need 3 swipes to crack.',
            '- Stay active! Idle = double drain speed.'
        ];
        rules.forEach(r => {
            this.add.text(30, y, r, {
                fontSize: '11px', fontFamily: 'Arial', color: '#E0E0E0'
            });
            y += 18;
        });
        y += 10;

        // --- Tips ---
        this.add.text(30, y, 'TIPS', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700'
        });
        y += 22;

        const tips = [
            'Target +5s crystals for big time gains!',
            'Keep your chain for massive score multipliers.',
            'Watch the wall - clear it by not missing!'
        ];
        tips.forEach(t => {
            this.add.text(30, y, t, {
                fontSize: '11px', fontFamily: 'Arial', color: '#E0E0E0', wordWrap: { width: w - 60 }
            });
            y += 22;
        });
        y += 15;

        // Timer bar illustration
        const barY = y;
        this.add.rectangle(w / 2, barY, w * 0.6, 12, 0x00F5FF).setOrigin(0.5);
        this.add.text(w / 2, barY + 16, 'Timer = Your Life', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00F5FF'
        }).setOrigin(0.5);
        y += 40;

        // Got it button
        const gotItY = Math.min(y + 10, h - 40);
        const btn = this.add.rectangle(w / 2, gotItY, 160, 44, 0x0A0A1A)
            .setStrokeStyle(3, 0x00F5FF).setInteractive({ useHandCursor: true });
        this.add.text(w / 2, gotItY, 'GOT IT!', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00F5FF'
        }).setOrigin(0.5).disableInteractive();
        btn.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume(this.returnTo);
        });
    }
}
