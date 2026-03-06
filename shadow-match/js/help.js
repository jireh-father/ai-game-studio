// Shadow Match - Help / How to Play Scene
class HelpScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HelpScene' });
    }

    init(data) {
        this.returnScene = data && data.returnScene ? data.returnScene : 'MenuScene';
        this.returnData = data && data.returnData ? data.returnData : {};
    }

    create() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Dark background
        this.add.rectangle(w / 2, h / 2, w, h, COLORS_INT.SKY_DARK, 0.95).setDepth(0);

        // Scrollable container
        let yPos = 30;

        // Title
        this.add.text(w / 2, yPos, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.HUD_TEXT
        }).setOrigin(0.5, 0).setDepth(1);
        yPos += 50;

        // Instruction 1: Drag
        this.createInstruction(w / 2, yPos, 'drag',
            'DRAG pieces from the tray\ninto the shadow');
        yPos += 120;

        // Instruction 2: Rotate
        this.createInstruction(w / 2, yPos, 'rotate',
            'TAP a piece to ROTATE\nit 90 degrees');
        yPos += 120;

        // Instruction 3: Shadow drift
        this.createInstruction(w / 2, yPos, 'drift',
            'Complete the shadow before\nit escapes off-screen!');
        yPos += 120;

        // Instruction 4: Streak
        this.createInstruction(w / 2, yPos, 'streak',
            'Perfect stages build your\nSTREAK multiplier!');
        yPos += 110;

        // Rules box
        const rulesY = yPos;
        this.add.rectangle(w / 2, rulesY + 50, w - 40, 120, COLORS_INT.HUD_BG, 0.5)
            .setDepth(1).setStrokeStyle(1, COLORS_INT.SHADOW_GRID, 0.3);

        const rules = [
            'Wrong placement = bounce back + shadow lurches',
            'Shadow escapes off-screen = Game Over',
            "Don't idle! Shadow accelerates after 10s"
        ];
        rules.forEach((r, i) => {
            this.add.text(w / 2, rulesY + 15 + i * 30, r, {
                fontSize: '13px', fontFamily: 'Arial', color: COLORS.HUD_TEXT,
                wordWrap: { width: w - 70 }, align: 'center'
            }).setOrigin(0.5, 0).setDepth(2);
        });
        yPos = rulesY + 130;

        // Tips
        const tips = [
            'Tip: Rotate pieces BEFORE dragging',
            'Tip: Watch for decoy pieces (stage 16+)',
            'Tip: Speed bonus for early completion!'
        ];
        tips.forEach((t, i) => {
            this.add.text(w / 2, yPos + i * 28, t, {
                fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
                color: COLORS.STREAK_FIRE
            }).setOrigin(0.5, 0).setDepth(1);
        });
        yPos += 100;

        // Got it button
        const btnY = Math.min(yPos, h - 60);
        this.createButton(w / 2, btnY, 180, 50, 'GOT IT!', COLORS_INT.PIECE_FILL, COLORS.HUD_BG, () => {
            if (this.returnScene === 'GameScene') {
                this.scene.stop();
                this.scene.resume('GameScene');
                this.scene.resume('UIScene');
            } else {
                this.scene.start('MenuScene');
            }
        });
    }

    createInstruction(x, y, type, text) {
        const g = this.add.graphics().setDepth(1);
        const boxW = 80;
        const boxH = 80;
        const bx = x - 140;

        g.fillStyle(COLORS_INT.SHADOW, 0.6);
        g.fillRoundedRect(bx, y, boxW, boxH, 8);

        // Simple icon illustrations
        if (type === 'drag') {
            // Arrow pointing up
            g.lineStyle(3, COLORS_INT.PIECE_FILL);
            g.beginPath();
            g.moveTo(bx + 40, y + 65);
            g.lineTo(bx + 40, y + 20);
            g.strokePath();
            g.fillStyle(COLORS_INT.PIECE_FILL);
            g.fillTriangle(bx + 40, y + 12, bx + 30, y + 28, bx + 50, y + 28);
        } else if (type === 'rotate') {
            // Circular arrow
            g.lineStyle(3, COLORS_INT.PIECE_FILL);
            const arc = new Phaser.Geom.Circle(bx + 40, y + 40, 22);
            g.beginPath();
            g.arc(bx + 40, y + 40, 22, -1.2, 1.8, false);
            g.strokePath();
            g.fillStyle(COLORS_INT.PIECE_FILL);
            g.fillTriangle(bx + 55, y + 50, bx + 60, y + 38, bx + 48, y + 40);
        } else if (type === 'drift') {
            // Shadow block moving right
            g.fillStyle(COLORS_INT.SHADOW_GRID, 0.8);
            g.fillRect(bx + 15, y + 25, 30, 30);
            g.lineStyle(2, COLORS_INT.DANGER);
            g.beginPath();
            g.moveTo(bx + 50, y + 40);
            g.lineTo(bx + 70, y + 40);
            g.strokePath();
            g.fillStyle(COLORS_INT.DANGER);
            g.fillTriangle(bx + 70, y + 40, bx + 62, y + 33, bx + 62, y + 47);
        } else if (type === 'streak') {
            // x3 text with glow
            this.add.text(bx + 40, y + 35, 'x3', {
                fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
                color: COLORS.STREAK_FIRE
            }).setOrigin(0.5).setDepth(2);
        }

        this.add.text(x + 20, y + 40, text, {
            fontSize: '15px', fontFamily: 'Arial', color: COLORS.HUD_TEXT,
            lineSpacing: 4
        }).setOrigin(0, 0.5).setDepth(1);
    }

    createButton(x, y, w, h, label, bgColor, textColor, callback) {
        const btn = this.add.rectangle(x, y, w, h, bgColor)
            .setDepth(2).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(2, 0xFFFFFF, 0.2);
        const txt = this.add.text(x, y, label, {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
            color: textColor
        }).setOrigin(0.5).setDepth(3);
        txt.disableInteractive();

        btn.on('pointerdown', () => {
            this.tweens.add({
                targets: [btn, txt], scaleX: 0.95, scaleY: 0.95,
                duration: 60, yoyo: true, onComplete: callback
            });
        });
    }
}
