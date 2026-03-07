// help.js - HelpScene: illustrated how-to-play

class HelpScene extends Phaser.Scene {
    constructor() { super({ key: 'HelpScene' }); }

    create(data) {
        this.returnTo = (data && data.from) || 'MenuScene';
        this.cameras.main.setBackgroundColor(COLORS.BG);
        const cx = 180;

        // Title
        this.add.text(cx, 30, 'HOW TO PLAY', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT_HEX
        }).setOrigin(0.5);

        // Close button
        const closeBtn = this.add.text(340, 30, 'X', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.FAIL_RED_HEX
        }).setOrigin(0.5).setInteractive(new Phaser.Geom.Rectangle(-22, -22, 44, 44), Phaser.Geom.Rectangle.Contains);
        closeBtn.on('pointerdown', () => this.closeHelp());

        // Scrollable content container
        const content = this.add.container(0, 0);
        let y = 80;

        // Step 1: Scroll
        const step1Bg = this.add.rectangle(cx, y + 30, 320, 90, COLORS.WOOD, 0.3);
        content.add(step1Bg);

        const gear1 = this.add.image(80, y + 25, 'gear_healthy').setScale(0.7);
        const arrow1 = this.add.text(120, y + 25, '>>>>', {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.FAIL_ORANGE_HEX
        }).setOrigin(0, 0.5);
        const gear2 = this.add.image(200, y + 25, 'lever_healthy').setScale(0.7);
        const gear3 = this.add.image(260, y + 25, 'ramp_healthy').setScale(0.7);
        content.add([gear1, arrow1, gear2, gear3]);

        const t1 = this.add.text(cx, y + 60, 'Swipe to scroll through the\nmachine and find the ROOT CAUSE', {
            fontSize: '12px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX, align: 'center'
        }).setOrigin(0.5);
        content.add(t1);
        y += 100;

        // Step 2: Tap root cause
        const step2Bg = this.add.rectangle(cx, y + 30, 320, 90, COLORS.WOOD, 0.3);
        content.add(step2Bg);

        const glow = this.add.circle(cx, y + 20, 22, COLORS.FAIL_ORANGE, 0.4);
        this.tweens.add({ targets: glow, scaleX: 1.2, scaleY: 1.2, alpha: 0.6, duration: 800, yoyo: true, repeat: -1 });
        const rootGear = this.add.image(cx, y + 20, 'gear_healthy').setScale(0.8);
        content.add([glow, rootGear]);

        const fingerTxt = this.add.text(cx + 40, y + 10, 'TAP', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD_HEX
        });
        content.add(fingerTxt);

        const t2 = this.add.text(cx, y + 60, 'TAP the glowing broken part\nto inspect it', {
            fontSize: '12px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX, align: 'center'
        }).setOrigin(0.5);
        content.add(t2);
        y += 100;

        // Step 3: Choose fix
        const step3Bg = this.add.rectangle(cx, y + 45, 320, 110, COLORS.WOOD, 0.3);
        content.add(step3Bg);

        const fixes = ['Tighten bolts', 'Oil surface', 'Kick it'];
        const fixColors = [COLORS.SUCCESS_GREEN, COLORS.FAIL_ORANGE, COLORS.FAIL_RED];
        fixes.forEach((f, i) => {
            const fb = this.add.rectangle(cx, y + 10 + i * 28, 200, 24, fixColors[i], 0.7);
            const ft = this.add.text(cx, y + 10 + i * 28, f, {
                fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
            }).setOrigin(0.5);
            content.add([fb, ft]);
        });

        const t3 = this.add.text(cx, y + 100, 'Choose the CORRECT fix!\nWrong fixes make things WORSE', {
            fontSize: '12px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX, align: 'center'
        }).setOrigin(0.5);
        content.add(t3);
        y += 130;

        // Step 4: Repair cascade
        const step4Bg = this.add.rectangle(cx, y + 25, 320, 70, COLORS.WOOD, 0.3);
        content.add(step4Bg);

        for (let i = 0; i < 4; i++) {
            const gc = this.add.circle(80 + i * 60, y + 20, 10, i < 2 ? COLORS.SUCCESS_GREEN : COLORS.FAIL_RED);
            content.add(gc);
        }
        const repairArrow = this.add.text(cx, y + 20, '<<<< REPAIR', {
            fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SUCCESS_HEX
        }).setOrigin(0.5);
        content.add(repairArrow);

        const t4 = this.add.text(cx, y + 55, 'Watch the machine repair in a\nsatisfying cascade!', {
            fontSize: '12px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX, align: 'center'
        }).setOrigin(0.5);
        content.add(t4);
        y += 90;

        // Tips
        const tipsHeader = this.add.text(cx, y, 'TIPS:', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD_HEX
        }).setOrigin(0.5);
        content.add(tipsHeader);
        y += 25;

        const tips = [
            'Look for the ORANGE GLOW - root cause!',
            'Absurd fixes (like "Kick It") cost a LIFE',
            'Fix under par time for 3 STARS',
            'Streaks give bonus points!',
            '12s idle = machine speeds up!'
        ];
        tips.forEach(tip => {
            const tt = this.add.text(30, y, '- ' + tip, {
                fontSize: '11px', fontFamily: 'Arial', color: COLORS.UI_TEXT_HEX, wordWrap: { width: 300 }
            });
            content.add(tt);
            y += 22;
        });

        y += 15;

        // Got It button
        const gotBg = this.add.rectangle(cx, y, 200, 44, COLORS.BTN_PRIMARY, 0.9).setInteractive({ useHandCursor: true });
        const gotTxt = this.add.text(cx, y, 'Got It!', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        gotTxt.setInteractive();
        gotBg.on('pointerdown', () => this.closeHelp());
        gotTxt.on('pointerdown', () => this.closeHelp());
        content.add([gotBg, gotTxt]);

        // Scroll support for small screens
        this.contentHeight = y + 40;
        this.contentContainer = content;
        this.scrollY = 0;

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && this.contentHeight > 700) {
                const dy = pointer.velocity.y * 0.5;
                this.scrollY = Phaser.Math.Clamp(this.scrollY + dy, -(this.contentHeight - 700), 0);
                content.y = this.scrollY;
            }
        });
    }

    closeHelp() {
        this.scene.stop('HelpScene');
        // If launched from pause, don't restart the parent
    }
}
