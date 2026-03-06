// ============================================================
// help.js - HelpScene: illustrated how-to-play
// ============================================================

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    create(data) {
        this.callerScene = data && data.from ? data.from : 'MenuScene';

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, COLORS.BACKGROUND, 0.95).setDepth(400).setInteractive();

        // Scrollable content via camera bounds
        const contentH = h * 1.2;
        this.cameras.main.setBounds(0, 0, w, Math.max(h, contentH));

        let yPos = 30;

        // Title
        this.add.text(w / 2, yPos, 'HOW TO PLAY', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_BUTTON_HEX,
        }).setOrigin(0.5).setDepth(401);
        yPos += 50;

        // Section 1: Goal
        this.add.text(w / 2, yPos, '-- GOAL --', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(0.5).setDepth(401);
        yPos += 30;
        this.add.text(w / 2, yPos, 'Contain infections before\nthey reach the grid edges!', {
            fontSize: '14px', fontFamily: 'Arial', color: '#B0BEC5', align: 'center',
        }).setOrigin(0.5).setDepth(401);
        yPos += 40;

        // Mini diagram
        this.drawMiniGrid(w / 2 - 50, yPos, 4, [
            { r: 1, c: 1, type: 'infected' },
            { r: 0, c: 1, type: 'wall' },
            { r: 1, c: 0, type: 'wall' },
            { r: 1, c: 2, type: 'wall' },
            { r: 2, c: 1, type: 'wall' },
        ]);
        this.add.text(w / 2 + 55, yPos + 30, 'Surround\ninfections\nwith walls!', {
            fontSize: '12px', fontFamily: 'Arial', color: COLORS.SUCCESS_HEX,
        }).setDepth(401);
        yPos += 100;

        // Section 2: Controls
        this.add.text(w / 2, yPos, '-- CONTROLS --', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(0.5).setDepth(401);
        yPos += 30;
        this.add.text(w / 2, yPos, 'TAP empty cells to place walls', {
            fontSize: '14px', fontFamily: 'Arial', color: '#B0BEC5', align: 'center',
        }).setOrigin(0.5).setDepth(401);
        yPos += 28;
        this.add.text(w / 2, yPos, 'DOUBLE-TAP your walls to reclaim\n(Stage 6+)', {
            fontSize: '13px', fontFamily: 'Arial', color: '#B0BEC5', align: 'center',
        }).setOrigin(0.5).setDepth(401);
        yPos += 50;

        // Section 3: Mutations
        this.add.text(w / 2, yPos, '-- WATCH OUT --', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(0.5).setDepth(401);
        yPos += 30;

        const mutations = [
            { name: 'Basic', color: COLORS.INFECTION_BASIC, desc: 'Spreads up/down/left/right' },
            { name: 'Diagonal', color: COLORS.INFECTION_DIAGONAL, desc: 'Spreads in 8 directions' },
            { name: 'Jumper', color: COLORS.INFECTION_JUMPER, desc: 'Leaps over walls' },
            { name: 'Splitter', color: COLORS.INFECTION_SPLITTER, desc: 'Splits when hitting walls' },
            { name: 'Accelerator', color: COLORS.INFECTION_ACCELERATOR, desc: 'Gets faster over time' },
            { name: 'Dormant', color: COLORS.INFECTION_DORMANT, desc: 'Waits 3 ticks, then explodes' },
        ];

        for (const m of mutations) {
            this.add.circle(40, yPos, 8, m.color).setDepth(401);
            this.add.text(58, yPos, m.name + ': ', {
                fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold',
                color: '#' + m.color.toString(16).padStart(6, '0'),
            }).setOrigin(0, 0.5).setDepth(401);
            this.add.text(58 + m.name.length * 8 + 10, yPos, m.desc, {
                fontSize: '12px', fontFamily: 'Arial', color: '#B0BEC5',
            }).setOrigin(0, 0.5).setDepth(401);
            yPos += 26;
        }
        yPos += 10;

        // Section 4: Tips
        this.add.text(w / 2, yPos, '-- TIPS --', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(0.5).setDepth(401);
        yPos += 30;

        const tips = [
            'Build walls near edges for barriers',
            'Save walls for efficiency bonus!',
            'Watch for mutation warnings!',
            'Every 5th stage is a breather',
        ];
        for (const tip of tips) {
            this.add.text(30, yPos, '\u2022 ' + tip, {
                fontSize: '13px', fontFamily: 'Arial', color: '#B0BEC5',
            }).setDepth(401);
            yPos += 24;
        }
        yPos += 20;

        // GOT IT button
        const gotItY = Math.max(yPos, h - 50);
        const gotItBg = this.add.rectangle(w / 2, gotItY, 160, 44, 0x000000, 0)
            .setStrokeStyle(2, COLORS.UI_BUTTON).setDepth(401).setInteractive({ useHandCursor: true });
        this.add.text(w / 2, gotItY, 'GOT IT!', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_BUTTON_HEX,
        }).setOrigin(0.5).setDepth(401);
        gotItBg.on('pointerdown', () => {
            this.scene.stop('HelpScene');
        });

        // Enable scroll via drag
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y);
                this.cameras.main.scrollY = Phaser.Math.Clamp(
                    this.cameras.main.scrollY, 0, Math.max(0, contentH - h)
                );
            }
        });
    }

    drawMiniGrid(x, y, size, cells) {
        const cs = 24;
        const g = this.add.graphics().setDepth(401);
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cx = x + c * cs;
                const cy = y + r * cs;
                g.fillStyle(COLORS.EMPTY_CELL, 1);
                g.fillRoundedRect(cx, cy, cs - 2, cs - 2, 2);
                g.lineStyle(1, COLORS.GRID_LINE, 0.5);
                g.strokeRoundedRect(cx, cy, cs - 2, cs - 2, 2);
            }
        }
        for (const cell of cells) {
            const cx = x + cell.c * cs;
            const cy = y + cell.r * cs;
            const color = cell.type === 'infected' ? COLORS.INFECTION_BASIC : COLORS.WALL;
            g.fillStyle(color, 0.9);
            g.fillRoundedRect(cx, cy, cs - 2, cs - 2, 2);
        }
    }
}
