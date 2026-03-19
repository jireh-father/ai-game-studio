class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(w / 2, h / 2, w, h, COLORS.UI_BG).setDepth(0);

        // Back button
        const backBtn = this.add.text(16, 16, '< BACK', {
            fontSize: '18px', fontFamily: 'Arial', color: '#F59E0B', fontStyle: 'bold'
        }).setInteractive({ useHandCursor: true }).setDepth(1);
        backBtn.on('pointerdown', () => {
            this.scene.stop();
            if (this.returnTo === 'GameScene') {
                this.scene.resume('GameScene');
                this.scene.resume('HUDScene');
            }
        });

        let y = 60;
        this.add.text(w / 2, y, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);

        y += 40;
        this.add.text(w / 2, y, 'Tap to land your stickman\non the gold sweet spot!', {
            fontSize: '16px', fontFamily: 'Arial', color: '#CBD5E1', align: 'center', lineSpacing: 4
        }).setOrigin(0.5).setDepth(1);

        // Tap diagram
        y += 55;
        this.add.rectangle(w / 2, y, 280, 80, 0x1E293B, 0.6).setDepth(1);
        this.add.text(w / 2, y - 20, 'TAP ANYWHERE', {
            fontSize: '20px', fontFamily: 'Arial', color: '#F59E0B', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);
        // Ripple circles
        for (let i = 0; i < 3; i++) {
            const circle = this.add.circle(w / 2, y + 15, 8 + i * 12, 0xFFFFFF, 0.3 - i * 0.08).setDepth(2);
        }

        // Timing diagram - three outcomes
        y += 65;
        const panels = [
            { label: 'TOO EARLY', color: '#DC2626', icon: 'X' },
            { label: 'PERFECT', color: '#F59E0B', icon: '\u2605' },
            { label: 'TOO LATE', color: '#DC2626', icon: 'X' }
        ];
        panels.forEach((p, i) => {
            const px = w / 2 + (i - 1) * 100;
            this.add.rectangle(px, y + 30, 85, 70, 0x1E293B, 0.8).setDepth(1);
            this.add.text(px, y + 6, p.label, {
                fontSize: '10px', fontFamily: 'Arial', color: p.color, fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(2);
            this.add.text(px, y + 35, p.icon, {
                fontSize: '28px', fontFamily: 'Arial', color: p.color
            }).setOrigin(0.5).setDepth(2);
            // Platform line
            this.add.rectangle(px, y + 58, 70, 4, Phaser.Display.Color.HexStringToColor(p.color).color).setDepth(2);
        });

        // Scoring section
        y += 90;
        this.add.text(w / 2, y, 'SCORING', {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        y += 25;
        const scores = [
            '\u2605 Perfect  \u2192  100pts + combo',
            '\u25CB Good     \u2192  50pts',
            '\u2717 Miss     \u2192  lose 1 life'
        ];
        scores.forEach((s, i) => {
            this.add.text(50, y + i * 24, s, {
                fontSize: '14px', fontFamily: 'Arial', color: '#CBD5E1'
            }).setDepth(1);
        });

        // Tips section
        y += 90;
        this.add.text(w / 2, y, 'TIPS', {
            fontSize: '18px', fontFamily: 'Arial', color: '#F59E0B', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        y += 25;
        const tips = [
            '\u2022 Watch the FEET, not the head',
            '\u2022 Combos widen the sweet spot',
            '\u2022 Every 10 stages = bonus round!'
        ];
        tips.forEach((t, i) => {
            this.add.text(50, y + i * 24, t, {
                fontSize: '14px', fontFamily: 'Arial', color: '#CBD5E1'
            }).setDepth(1);
        });

        // Got it button - fixed near bottom
        const btnY = h - 70;
        const gotItBtn = this.add.rectangle(w / 2, btnY, 200, 50, COLORS.PRIMARY).setDepth(1).setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'GOT IT!', {
            fontSize: '22px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);
        gotItBtn.on('pointerdown', () => {
            this.scene.stop();
            if (this.returnTo === 'GameScene') {
                this.scene.resume('GameScene');
                this.scene.resume('HUDScene');
            }
        });

        // Full screen fallback tap zone
        const fallback = this.add.rectangle(w / 2, btnY, w, 100, 0x000000, 0).setDepth(0).setInteractive();
        fallback.on('pointerdown', () => {
            this.scene.stop();
            if (this.returnTo === 'GameScene') {
                this.scene.resume('GameScene');
                this.scene.resume('HUDScene');
            }
        });
    }
}
