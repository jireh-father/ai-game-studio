// help.js - HelpScene: illustrated how-to-play

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = (data && data.returnTo) || 'MenuScene';
    }

    create() {
        const w = this.scale.width, h = this.scale.height;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

        // Title
        this.add.text(w / 2, 30, 'HOW TO PLAY', { fontSize: '24px', fontFamily: 'Arial',
            fontStyle: 'bold', color: COLORS.TEXT }).setOrigin(0.5);

        let y = 70;
        const leftPad = 24;
        const textW = w - 48;
        const sectionGap = 16;
        const headerStyle = { fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#E9C46A' };
        const bodyStyle = { fontSize: '13px', fontFamily: 'Arial', color: COLORS.ACCENT,
            wordWrap: { width: textW } };

        // Section 1 - The Grid
        this.add.text(leftPad, y, 'THE GRID', headerStyle);
        y += 22;
        this.add.text(leftPad, y, 'A 4x4 grid of colored, shaped tiles is displayed. Each tile has a COLOR (red, blue, green, yellow) and a SHAPE (circle, triangle, square, diamond).', bodyStyle);
        y += 55 + sectionGap;

        // Section 2 - Secret Rule
        this.add.text(leftPad, y, 'THE SECRET RULE', headerStyle);
        y += 22;
        this.add.text(leftPad, y, 'A hidden rule determines which tiles are "legal" to tap. Tap tiles to test! Correct taps glow GREEN. Wrong taps flash RED and cost 1 life.', bodyStyle);
        y += 50 + sectionGap;

        // Visual example: correct/wrong
        const exGreen = this.add.rectangle(w / 2 - 50, y + 10, 40, 40, 0x06D6A0, 0.8).setStrokeStyle(2, 0x06D6A0);
        this.add.text(w / 2 - 50, y + 35, 'Correct', { fontSize: '10px', fontFamily: 'Arial', color: COLORS.CORRECT }).setOrigin(0.5);
        const exRed = this.add.rectangle(w / 2 + 50, y + 10, 40, 40, 0xFF006E, 0.4).setStrokeStyle(2, 0xFF006E);
        this.add.text(w / 2 + 50, y + 35, 'Wrong', { fontSize: '10px', fontFamily: 'Arial', color: COLORS.WRONG }).setOrigin(0.5);
        y += 55 + sectionGap;

        // Section 3 - Crack the Rule
        this.add.text(leftPad, y, 'CRACK THE RULE', headerStyle);
        y += 22;
        this.add.text(leftPad, y, 'Get 5 correct taps in a row to CRACK the rule! The rule is revealed, you earn bonus points, and a new harder rule begins.', bodyStyle);
        y += 50 + sectionGap;

        // Streak dots illustration
        for (let i = 0; i < 5; i++) {
            const filled = i < 3;
            const dotColor = filled ? 0x06D6A0 : 0x1B2838;
            const dot = this.add.circle(w / 2 - 48 + i * 24, y + 8, 8, dotColor);
            if (!filled) dot.setStrokeStyle(1.5, 0xA8DADC);
        }
        this.add.text(w / 2 + 80, y + 4, '3 / 5', { fontSize: '12px', fontFamily: 'Arial', color: COLORS.ACCENT });
        y += 30 + sectionGap;

        // Section 4 - Rule Types
        this.add.text(leftPad, y, 'RULE TYPES', headerStyle);
        y += 22;
        const types = [
            'COLOR: "Only RED tiles"',
            'SHAPE: "Only CIRCLES"',
            'POSITION: "Only TOP ROW"',
            'NEIGHBOR: "Adjacent to BLUE"',
            'COMPOUND: "RED and CIRCLE"',
            'NEGATION: "NOT triangles"'
        ];
        types.forEach(t => {
            this.add.text(leftPad + 10, y, '- ' + t, { fontSize: '12px', fontFamily: 'Arial', color: COLORS.ACCENT });
            y += 17;
        });
        y += sectionGap;

        // Section 5 - Hints
        this.add.text(leftPad, y, 'HINTS', headerStyle);
        y += 22;
        this.add.text(leftPad, y, 'Tap the lightbulb to reveal one property of the current rule. 1 hint per rule.', bodyStyle);
        y += 35 + sectionGap;

        // Section 6 - Tips
        this.add.text(leftPad, y, 'TIPS', headerStyle);
        y += 22;
        const tips = [
            'Start with tiles that differ in only one property.',
            'Use wrong taps to eliminate possibilities.',
            'Watch the timer - guess faster under pressure!',
            'You have 3 lives. Losing all = game over.'
        ];
        tips.forEach(t => {
            this.add.text(leftPad + 10, y, '- ' + t, { fontSize: '11px', fontFamily: 'Arial',
                color: COLORS.ACCENT, wordWrap: { width: textW - 10 } });
            y += 28;
        });

        // Got it! button
        const btnY = Math.max(y + 20, h - 60);
        const gotItBtn = this.add.rectangle(w / 2, btnY, 160, 50, 0x2A9D8F, 1)
            .setInteractive({ useHandCursor: true });
        this.add.text(w / 2, btnY, 'Got it!', { fontSize: '20px', fontFamily: 'Arial',
            fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
        gotItBtn.on('pointerdown', () => {
            playButtonSound();
            if (this.returnTo === 'UIScene') {
                // Return to game: just stop help and game+UI are still running
                this.scene.stop('HelpScene');
            } else {
                this.scene.start(this.returnTo);
            }
        });
    }
}
