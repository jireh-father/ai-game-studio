// Echo Thief - Help Scene
class HelpScene extends Phaser.Scene {
    constructor() { super('help'); }

    init(data) {
        this.returnTo = data.returnTo || 'menu';
    }

    create() {
        const w = GAME_WIDTH;
        const h = GAME_HEIGHT;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG, 1).setDepth(0);

        // Scrollable container
        const content = this.add.container(0, 0).setDepth(1);
        let cy = 30;

        // Title
        content.add(this.add.text(w / 2, cy, 'HOW TO PLAY', {
            fontSize: '22px', fontFamily: 'Arial', fill: COLORS.WAVE, fontStyle: 'bold'
        }).setOrigin(0.5, 0));
        cy += 45;

        // Section 1: Controls
        content.add(this.add.text(w / 2, cy, 'CONTROLS', {
            fontSize: '16px', fontFamily: 'Arial', fill: COLORS.GOLD
        }).setOrigin(0.5, 0));
        cy += 28;

        // Wave illustration
        if (this.textures.exists('wave')) {
            content.add(this.add.image(w / 2 - 40, cy + 20, 'wave').setScale(0.6));
        }
        // Arrow showing drag direction
        const arrow = this.add.graphics();
        arrow.lineStyle(3, COLORS.WAVE_HEX, 0.8);
        arrow.beginPath();
        arrow.moveTo(w / 2 - 10, cy + 20);
        arrow.lineTo(w / 2 + 50, cy + 10);
        arrow.lineTo(w / 2 + 42, cy + 4);
        arrow.moveTo(w / 2 + 50, cy + 10);
        arrow.lineTo(w / 2 + 42, cy + 18);
        arrow.strokePath();
        content.add(arrow);

        content.add(this.add.text(w / 2, cy + 48, 'Drag to steer the sound wave\nThe wave never stops moving!', {
            fontSize: '13px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, align: 'center', lineSpacing: 4
        }).setOrigin(0.5, 0));
        cy += 100;

        // Section 2: Creatures
        content.add(this.add.text(w / 2, cy, 'CREATURES', {
            fontSize: '16px', fontFamily: 'Arial', fill: COLORS.GOLD
        }).setOrigin(0.5, 0));
        cy += 28;

        if (this.textures.exists('creature')) {
            content.add(this.add.image(w / 2 - 50, cy + 16, 'creature').setScale(0.7));
        }
        // Noise bar illustration
        const noiseBar = this.add.graphics();
        noiseBar.fillStyle(0xFF6600, 0.8);
        noiseBar.fillRect(w / 2 + 10, cy + 8, 60, 10);
        noiseBar.fillStyle(0xFF1111, 0.8);
        noiseBar.fillRect(w / 2 + 70, cy + 8, 30, 10);
        content.add(noiseBar);

        content.add(this.add.text(w / 2, cy + 36, 'Passing through creatures fills\nyour noise meter. 100% = BURST!', {
            fontSize: '13px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, align: 'center', lineSpacing: 4
        }).setOrigin(0.5, 0));
        cy += 90;

        // Section 3: Silence Zones
        content.add(this.add.text(w / 2, cy, 'SILENCE ZONES', {
            fontSize: '16px', fontFamily: 'Arial', fill: COLORS.GOLD
        }).setOrigin(0.5, 0));
        cy += 28;

        const szIllust = this.add.graphics();
        szIllust.fillStyle(COLORS.SILENCE_HEX, 0.6);
        szIllust.fillEllipse(w / 2, cy + 22, 80, 40);
        szIllust.lineStyle(2, COLORS.SILENCE_EDGE_HEX, 0.6);
        szIllust.strokeEllipse(w / 2, cy + 22, 80, 40);
        content.add(szIllust);

        content.add(this.add.text(w / 2, cy + 50, 'Enter dark silence zones to\nrapidly drain the noise meter', {
            fontSize: '13px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, align: 'center', lineSpacing: 4
        }).setOrigin(0.5, 0));
        cy += 100;

        // Scoring
        content.add(this.add.text(w / 2, cy, 'SCORING', {
            fontSize: '16px', fontFamily: 'Arial', fill: COLORS.GOLD
        }).setOrigin(0.5, 0));
        cy += 26;
        const scoreLines = [
            'Survive: 10 pts/sec',
            'Stage clear: 200+ pts',
            'Chain silence (3s): 500 pts',
            'Close call rescue: 100 pts'
        ];
        scoreLines.forEach(line => {
            content.add(this.add.text(w / 2, cy, line, {
                fontSize: '12px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
            }).setOrigin(0.5, 0));
            cy += 20;
        });
        cy += 15;

        // Tips
        content.add(this.add.text(w / 2, cy, 'TIPS', {
            fontSize: '16px', fontFamily: 'Arial', fill: COLORS.GOLD
        }).setOrigin(0.5, 0));
        cy += 26;
        const tips = [
            '1. Always steer toward silence zones',
            '2. Watch for the pre-shift flicker',
            '3. At 90%+ noise, run to safety fast!'
        ];
        tips.forEach(tip => {
            content.add(this.add.text(w / 2, cy, tip, {
                fontSize: '12px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
            }).setOrigin(0.5, 0));
            cy += 22;
        });
        cy += 30;

        // Got it button — fixed at bottom
        const btnY = h - 60;
        const btn = this.add.rectangle(w / 2, btnY, 160, 50, COLORS.WAVE_HEX, 1).setDepth(10);
        const btnText = this.add.text(w / 2, btnY, 'GOT IT!', {
            fontSize: '20px', fontFamily: 'Arial', fill: COLORS.BG_HEX, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(10);

        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => {
            this.scene.stop();
            if (this.returnTo === 'game') {
                this.scene.resume('game');
            } else {
                this.scene.start('menu');
            }
        });

        // Scrolling for content
        const maxScroll = Math.max(0, cy - h + 80);
        if (maxScroll > 0) {
            let startY = 0;
            this.input.on('pointerdown', (p) => { startY = p.y; });
            this.input.on('pointermove', (p) => {
                if (p.isDown) {
                    const dy = p.y - startY;
                    startY = p.y;
                    content.y = Phaser.Math.Clamp(content.y + dy, -maxScroll, 0);
                }
            });
        }
    }
}
