// Permission Denied - Help Scene

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.WINDOW_BG);

        // Title bar
        this.add.rectangle(180, 12, 360, 24, COLORS.TITLE_BAR);
        this.add.text(10, 4, 'Permission Denied - How To Play', {
            fontSize: '11px', fontFamily: 'Courier New, monospace', color: '#FFFFFF'
        });
        const closeBtn = this.add.rectangle(348, 12, 20, 20, COLORS.DANGER_RED).setInteractive({ useHandCursor: true });
        this.add.text(348, 12, 'X', { fontSize: '12px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => this.goBack());

        // Scrollable content zone
        const contentY = 34;
        const mask = this.add.rectangle(180, 340, 360, 600, 0x000000, 0).setVisible(false);

        let y = contentY + 10;

        // Objective
        this.add.text(180, y, 'OBJECTIVE', {
            fontSize: '14px', fontFamily: 'Courier New, monospace', color: COLORS.TITLE_BAR_HEX, fontStyle: 'bold'
        }).setOrigin(0.5);
        y += 22;
        this.add.text(180, y, 'Complete UI challenges before\nthe timer runs out!', {
            fontSize: '12px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY, align: 'center', lineSpacing: 3
        }).setOrigin(0.5);
        y += 44;

        // Challenges section
        this.add.text(180, y, '-- CHALLENGES --', {
            fontSize: '13px', fontFamily: 'Courier New, monospace', color: COLORS.TITLE_BAR_HEX, fontStyle: 'bold'
        }).setOrigin(0.5);
        y += 28;

        // Moving Button diagram
        y = this.drawChallengeHelp(y, 'Moving Accept Button',
            'Tap the green button\nbefore it escapes!', (scene, cx, cy) => {
                // Draw a moving button with arrows
                const g = scene.add.graphics();
                g.fillStyle(COLORS.ACCEPT_GREEN); g.fillRoundedRect(cx - 30, cy - 12, 60, 24, 4);
                g.lineStyle(2, 0x333333, 0.6);
                // Arrow path
                g.beginPath(); g.moveTo(cx - 40, cy); g.lineTo(cx + 40, cy); g.strokePath();
                g.fillStyle(0x333333); g.fillTriangle(cx + 40, cy, cx + 32, cy - 5, cx + 32, cy + 5);
                scene.add.text(cx, cy, 'OK', { fontSize: '10px', fontFamily: 'Arial', color: '#FFF', fontStyle: 'bold' }).setOrigin(0.5);
            });

        // Hold to Confirm
        y = this.drawChallengeHelp(y, 'Hold to Confirm',
            'Hold your finger until\nthe bar fills. Don\'t let go!', (scene, cx, cy) => {
                const g = scene.add.graphics();
                g.fillStyle(0x999999); g.fillRect(cx - 40, cy + 8, 80, 10);
                g.fillStyle(COLORS.ACCEPT_GREEN); g.fillRect(cx - 40, cy + 8, 50, 10);
                g.fillStyle(COLORS.BUTTON_DEFAULT); g.fillRoundedRect(cx - 25, cy - 14, 50, 22, 3);
                scene.add.text(cx, cy - 3, 'HOLD', { fontSize: '9px', fontFamily: 'Arial', color: COLORS.TEXT_PRIMARY, fontStyle: 'bold' }).setOrigin(0.5);
            });

        // CAPTCHA
        y = this.drawChallengeHelp(y, 'CAPTCHA Challenge',
            'Tap all tiles matching\nthe category. No mistakes!', (scene, cx, cy) => {
                const g = scene.add.graphics();
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const tx = cx - 24 + c * 18;
                        const ty = cy - 18 + r * 18;
                        const correct = (r === 0 && c === 1) || (r === 1 && c === 0) || (r === 2 && c === 2);
                        g.fillStyle(correct ? COLORS.ACCEPT_GREEN : 0xDDDDDD);
                        g.fillRect(tx, ty, 15, 15);
                        g.lineStyle(1, 0x999999); g.strokeRect(tx, ty, 15, 15);
                    }
                }
            });

        // Scroll ToS
        y = this.drawChallengeHelp(y, 'Terms of Service',
            'Swipe up to scroll to\nthe bottom. Find Accept!', (scene, cx, cy) => {
                const g = scene.add.graphics();
                g.fillStyle(0xEEEEEE); g.fillRect(cx - 30, cy - 18, 60, 36);
                g.lineStyle(1, 0xBBBBBB);
                for (let i = 0; i < 5; i++) {
                    g.beginPath(); g.moveTo(cx - 25, cy - 14 + i * 8); g.lineTo(cx + 25, cy - 14 + i * 8); g.strokePath();
                }
                // Up arrow
                g.lineStyle(2, 0x333333);
                g.beginPath(); g.moveTo(cx, cy + 24); g.lineTo(cx, cy + 10); g.strokePath();
                g.fillStyle(0x333333); g.fillTriangle(cx, cy + 8, cx - 4, cy + 14, cx + 4, cy + 14);
            });

        y += 10;

        // Tips
        this.add.text(180, y, '-- TIPS --', {
            fontSize: '13px', fontFamily: 'Courier New, monospace', color: COLORS.TITLE_BAR_HEX, fontStyle: 'bold'
        }).setOrigin(0.5);
        y += 24;
        const tips = [
            '1. Every 5 challenges = reward!',
            '2. Faster = bonus points.',
            '3. One wrong tap = game over.'
        ];
        tips.forEach(tip => {
            this.add.text(30, y, tip, { fontSize: '11px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY });
            y += 18;
        });
        y += 10;

        // Scoring
        this.add.text(180, y, '-- SCORING --', {
            fontSize: '13px', fontFamily: 'Courier New, monospace', color: COLORS.TITLE_BAR_HEX, fontStyle: 'bold'
        }).setOrigin(0.5);
        y += 24;
        const scoring = [
            'Complete challenge:  100 pts',
            'Under 4 seconds:    +50 bonus',
            'Under 2 seconds:   +150 bonus',
            'No-death streak:    x1.5 mult'
        ];
        scoring.forEach(s => {
            this.add.text(30, y, s, { fontSize: '11px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY });
            y += 18;
        });
        y += 20;

        // GOT IT button — fixed at bottom
        const gotItBtn = createBevelButton(this, 180, GAME_HEIGHT - 60, 160, 48, 'GOT IT!', COLORS.ACCEPT_GREEN, '16px');
        gotItBtn.label.setColor('#FFFFFF');
        gotItBtn.on('pointerdown', () => this.goBack());

        // Fullscreen tap fallback at bottom
        const fallback = this.add.rectangle(180, GAME_HEIGHT - 60, 360, 80, 0x000000, 0).setInteractive();
        fallback.on('pointerdown', () => this.goBack());
        fallback.setDepth(-1);
    }

    drawChallengeHelp(y, title, desc, drawFn) {
        // Diagram area
        const cx = 60, cy = y + 20;
        drawFn(this, cx, cy);

        this.add.text(110, y, title, {
            fontSize: '11px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_PRIMARY, fontStyle: 'bold'
        });
        this.add.text(110, y + 16, desc, {
            fontSize: '10px', fontFamily: 'Courier New, monospace', color: COLORS.TEXT_DISABLED, lineSpacing: 2
        });
        return y + 56;
    }

    goBack() {
        this.scene.stop('HelpScene');
        if (this.returnTo === 'GameScene') {
            this.scene.resume('GameScene');
            this.scene.resume('HUDScene');
        } else {
            this.scene.resume(this.returnTo);
        }
    }
}
