// Sum Sniper - Help Scene
class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.97).setDepth(0);

        let y = 30;
        this.add.text(w / 2, y, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        y += 40;
        this.add.text(w / 2, y, 'Tap adjacent numbers that add up to the target!', {
            fontSize: '13px', fontFamily: 'Arial', color: '#AABBCC', wordWrap: { width: w - 40 }
        }).setOrigin(0.5);

        // Controls diagram
        y += 35;
        const cellSize = 48, gap = 4, startX = w / 2 - (cellSize * 3 + gap * 2) / 2;
        const demoNums = [3, 5, 7];
        for (let i = 0; i < 3; i++) {
            const cx = startX + i * (cellSize + gap) + cellSize / 2;
            this.add.rectangle(cx, y + cellSize / 2, cellSize, cellSize, 0x003344)
                .setStrokeStyle(2, 0x00D4FF);
            this.add.text(cx, y + cellSize / 2, '' + demoNums[i], {
                fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SELECTED
            }).setOrigin(0.5);
            if (i < 2) {
                const arrowX = startX + i * (cellSize + gap) + cellSize + gap / 2;
                this.add.text(arrowX, y + cellSize / 2, '-', {
                    fontSize: '16px', fontFamily: 'Arial', color: COLORS.SELECTED
                }).setOrigin(0.5);
            }
        }
        y += cellSize + 8;
        this.add.text(w / 2, y, '3 + 5 + 7 = 15', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SELECTED
        }).setOrigin(0.5);
        y += 20;
        this.add.text(w / 2, y, 'TARGET = 15 ... EXPLODE!', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.EXPLOSION_1
        }).setOrigin(0.5);

        y += 14;
        this.add.text(w / 2, y, 'Tap cells that touch side-by-side (not diagonal)', {
            fontSize: '12px', fontFamily: 'Arial', color: '#8899AA'
        }).setOrigin(0.5);

        // Rules
        y += 30;
        this.add.text(w / 2, y, '-- RULES --', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        y += 22;
        const rules = [
            'A target number appears at the top.',
            'Find adjacent cells that ADD UP to it exactly.',
            'You have 8 seconds per target. Time out = MISS!',
            'Wrong sum = MISS! 3 misses = GAME OVER.',
            'Longer chains = more points. Speed bonus for fast solves!'
        ];
        for (const rule of rules) {
            this.add.text(20, y, '> ' + rule, {
                fontSize: '12px', fontFamily: 'Arial', color: '#CCDDEE',
                wordWrap: { width: w - 40 }
            });
            y += 22;
        }

        // Special tiles
        y += 8;
        this.add.text(w / 2, y, '-- SPECIAL TILES --', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        y += 22;
        this.add.text(20, y, 'x2 MULTIPLIER: doubles cell value in your chain', {
            fontSize: '12px', fontFamily: 'Arial', color: COLORS.NUM_MULTIPLIER
        });
        y += 20;
        this.add.text(20, y, 'LOCKED: cannot tap for a few seconds after refresh', {
            fontSize: '12px', fontFamily: 'Arial', color: '#888888'
        });

        // Tips
        y += 28;
        this.add.text(w / 2, y, '-- TIPS --', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        y += 22;
        const tips = [
            'Look for pairs first - two numbers summing to target.',
            'Negative numbers help fine-tune an over-target chain.',
            'Watch the timer bar - it turns red when time is low.'
        ];
        for (const tip of tips) {
            this.add.text(20, y, '* ' + tip, {
                fontSize: '11px', fontFamily: 'Arial', fontStyle: 'italic', color: '#99AABB',
                wordWrap: { width: w - 40 }
            });
            y += 22;
        }

        // GOT IT button
        const btnY = Math.max(y + 25, h - 70);
        const btn = this.add.rectangle(w / 2, btnY, 280, 52, 0x4A1FA8).setInteractive({ useHandCursor: true });
        btn.setStrokeStyle(2, 0x6B3FC9);
        this.add.text(w / 2, btnY, 'GOT IT!', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            this.scene.stop();
            if (this.returnTo === 'GameScene') {
                const gs = this.scene.get('GameScene');
                if (gs && gs.paused) gs.togglePause();
                this.scene.resume('GameScene');
                this.scene.resume('HUDScene');
            } else {
                this.scene.resume('MenuScene');
            }
        });

        // Full-screen fallback tap zone
        const fallback = this.add.rectangle(w / 2, h - 20, w, 40, 0x000000, 0).setInteractive();
        fallback.on('pointerdown', () => btn.emit('pointerdown'));
    }
}
