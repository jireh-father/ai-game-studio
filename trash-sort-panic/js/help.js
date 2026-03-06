// help.js - HelpScene with illustrated controls

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.92);

        // Scrollable container
        let yPos = 30;

        // Title
        this.add.text(W / 2, yPos, 'HOW TO PLAY', {
            fontSize: '24px', fontFamily: 'Impact, Arial, sans-serif', fontStyle: 'bold',
            color: '#FFF', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);
        yPos += 35;

        this.add.text(W / 2, yPos, 'Sort garbage into the right bins\nbefore your apartment gets condemned!', {
            fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#CCC', align: 'center'
        }).setOrigin(0.5);
        yPos += 40;

        // Control illustration: drag arrow
        this.add.text(W / 2, yPos, 'CONTROLS', {
            fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS.gold
        }).setOrigin(0.5);
        yPos += 25;

        // Draw drag illustration
        if (this.textures.exists('item_bottle')) {
            this.add.image(W / 2 - 40, yPos + 15, 'item_bottle').setScale(1.5);
        }
        // Arrow
        const arrow = this.add.graphics();
        arrow.lineStyle(3, 0xFFD700);
        arrow.beginPath();
        arrow.moveTo(W / 2 - 15, yPos + 15);
        arrow.lineTo(W / 2 + 50, yPos + 35);
        arrow.strokePath();
        // Arrowhead
        arrow.fillStyle(0xFFD700);
        arrow.fillTriangle(W / 2 + 50, yPos + 35, W / 2 + 40, yPos + 25, W / 2 + 38, yPos + 38);

        if (this.textures.exists('bin_recycle')) {
            this.add.image(W / 2 + 80, yPos + 30, 'bin_recycle').setScale(0.9);
        }

        this.add.text(W / 2, yPos + 55, 'Drag items to the correct bin!', {
            fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#FFF', align: 'center'
        }).setOrigin(0.5);
        yPos += 80;

        // Bin categories
        this.add.text(W / 2, yPos, 'BIN CATEGORIES', {
            fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS.gold
        }).setOrigin(0.5);
        yPos += 22;

        const cats = [
            { name: 'RECYCLE', color: COLORS.recycle, items: 'bottles, cans, cardboard' },
            { name: 'COMPOST', color: COLORS.compost, items: 'food scraps, peels, tea bags' },
            { name: 'TRASH', color: COLORS.trash, items: 'wrappers, wipes, mixed waste' },
            { name: 'HAZARD', color: COLORS.hazard, items: 'batteries, paint, chemicals' }
        ];

        cats.forEach(cat => {
            this.add.circle(25, yPos + 8, 8, Phaser.Display.Color.HexStringToColor(cat.color).color)
                .setStrokeStyle(2, 0x000000);
            this.add.text(40, yPos, cat.name, {
                fontSize: '13px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: cat.color
            });
            this.add.text(40, yPos + 14, cat.items, {
                fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#AAA'
            });
            yPos += 32;
        });

        yPos += 5;

        // Rules
        this.add.text(W / 2, yPos, 'RULES', {
            fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS.gold
        }).setOrigin(0.5);
        yPos += 22;

        const rules = [
            '3 wrong sorts = CONDEMNED (Game Over)',
            'Items on the floor count as wrong!',
            '15 seconds idle = Health Inspector!'
        ];
        rules.forEach(rule => {
            this.add.text(20, yPos, '• ' + rule, {
                fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#E0E0E0',
                wordWrap: { width: W - 40 }
            });
            yPos += 22;
        });

        yPos += 5;

        // Tips
        this.add.text(W / 2, yPos, 'TIPS', {
            fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: COLORS.gold
        }).setOrigin(0.5);
        yPos += 22;

        const tips = [
            'Watch for TRICK items that look wrong!',
            'Sort quickly for speed bonus points!',
            'Bins start MOVING in later stages!'
        ];
        tips.forEach(tip => {
            this.add.text(20, yPos, '★ ' + tip, {
                fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#B2FF59',
                wordWrap: { width: W - 40 }
            });
            yPos += 22;
        });

        yPos += 15;

        // Got it button
        createButton(this, W / 2, Math.min(yPos, H - 40), 180, 50, 'Got it!', COLORS.compost, () => {
            this.scene.stop();
            this.scene.resume(this.returnTo);
        });
    }
}
