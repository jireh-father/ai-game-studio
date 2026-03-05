// Balloon Pump Panic - Help Scene

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;

        // Background overlay
        this.add.rectangle(W/2, H/2, W, H, 0x263238, 0.92).setDepth(0);

        let yPos = 40;

        // Title
        this.add.text(W/2, yPos, 'HOW TO PLAY', {
            fontSize: '32px', fontFamily: 'Arial Black, Arial', color: '#FFFFFF',
            stroke: '#7E57C2', strokeThickness: 3
        }).setOrigin(0.5).setDepth(1);
        yPos += 40;

        // One-liner
        this.add.text(W/2, yPos, 'Inflate balloons & pop for points!\nDon\'t push too far!', {
            fontSize: '14px', fontFamily: 'Arial', color: '#B0BEC5',
            align: 'center'
        }).setOrigin(0.5, 0).setDepth(1);
        yPos += 50;

        // --- Control illustration 1: Pump zone ---
        this.add.rectangle(W/2, yPos + 40, W - 40, 90, 0x37474F, 0.6).setDepth(1);
        // Pump zone visual
        this.add.rectangle(W*0.25, yPos + 40, 80, 60, COLORS.pumpZone, 0.8).setDepth(2);
        // Tap arrow
        this.add.text(W*0.25, yPos + 15, '👆', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
        this.add.text(W*0.65, yPos + 25, 'TAP BOTTOM\nto pump air', {
            fontSize: '15px', fontFamily: 'Arial Black', color: '#ECEFF1'
        }).setOrigin(0.5, 0).setDepth(2);
        // Pump icon
        this.add.image(W*0.25, yPos + 45, 'pump').setScale(0.7).setDepth(3);
        yPos += 100;

        // --- Control illustration 2: Balloon tap ---
        this.add.rectangle(W/2, yPos + 40, W - 40, 90, 0x37474F, 0.6).setDepth(1);
        this.add.image(W*0.25, yPos + 40, 'balloon').setScale(0.55).setDepth(2);
        this.add.text(W*0.25, yPos + 15, '👆', { fontSize: '24px' }).setOrigin(0.5).setDepth(2);
        this.add.text(W*0.65, yPos + 25, 'TAP BALLOON\nto pop & score', {
            fontSize: '15px', fontFamily: 'Arial Black', color: '#ECEFF1'
        }).setOrigin(0.5, 0).setDepth(2);
        yPos += 100;

        // --- Zone colors illustration ---
        this.add.rectangle(W/2, yPos + 30, W - 40, 70, 0x37474F, 0.6).setDepth(1);
        const zones = [
            { label: 'SAFE', color: '#4FC3F7', range: '0-49%' },
            { label: 'RISKY', color: '#FF8A65', range: '50-69%' },
            { label: 'DANGER', color: '#EF5350', range: '70-89%' },
            { label: 'PERFECT', color: '#FFD600', range: '95%+' }
        ];
        const zoneStartX = 40;
        const zoneSpacing = (W - 80) / zones.length;
        zones.forEach((z, i) => {
            const zx = zoneStartX + i * zoneSpacing + zoneSpacing / 2;
            this.add.circle(zx, yPos + 22, 10, Phaser.Display.Color.HexStringToColor(z.color).color).setDepth(2);
            this.add.text(zx, yPos + 38, z.label, { fontSize: '10px', fontFamily: 'Arial Black', color: z.color }).setOrigin(0.5).setDepth(2);
            this.add.text(zx, yPos + 52, z.range, { fontSize: '9px', fontFamily: 'Arial', color: '#90A4AE' }).setOrigin(0.5).setDepth(2);
        });
        yPos += 80;

        // Rules
        this.add.text(W/2, yPos, 'RULES', {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#7E57C2'
        }).setOrigin(0.5).setDepth(1);
        yPos += 24;
        const rules = [
            'Inflate past 70% for score multiplier!',
            'Push too far and it EXPLODES - lose a life!',
            'Stop tapping for 5s and it escapes!',
            '3 lives - use them wisely!'
        ];
        rules.forEach(r => {
            this.add.text(30, yPos, '• ' + r, {
                fontSize: '13px', fontFamily: 'Arial', color: '#CFD8DC',
                wordWrap: { width: W - 60 }
            }).setDepth(1);
            yPos += 22;
        });
        yPos += 8;

        // Tips
        this.add.text(W/2, yPos, 'TIPS', {
            fontSize: '20px', fontFamily: 'Arial Black', color: '#FFD600'
        }).setOrigin(0.5).setDepth(1);
        yPos += 24;
        const tips = [
            'Watch for wobble and color - they warn you!',
            'Every 5th stage is a bonus round - go big!'
        ];
        tips.forEach(t => {
            this.add.text(30, yPos, '★ ' + t, {
                fontSize: '13px', fontFamily: 'Arial', color: '#A5D6A7',
                wordWrap: { width: W - 60 }
            }).setDepth(1);
            yPos += 22;
        });

        // Got it button
        yPos = Math.max(yPos + 20, H - 70);
        const gotBg = this.add.rectangle(W/2, yPos, 160, 50, COLORS.uiAccent).setInteractive({ useHandCursor: true }).setDepth(1);
        gotBg.setStrokeStyle(2, 0x4A148C);
        this.add.text(W/2, yPos, 'GOT IT!', {
            fontSize: '24px', fontFamily: 'Arial Black', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(2).disableInteractive();

        gotBg.on('pointerdown', () => {
            this.scene.stop();
            this.scene.resume(this.returnTo);
        });
    }
}
