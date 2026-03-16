// help.js - HelpScene with illustrated how-to-play

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = (data && data.returnTo) || 'MenuScene';
    }

    create() {
        const cx = CANVAS_WIDTH / 2;
        this.cameras.main.setBackgroundColor(COLORS.MENU_BG);

        let y = 30;

        // Title
        this.add.text(cx, y, '// HOW TO CRACK A VAULT //', {
            fontFamily: FONT_FAMILY, fontSize: '18px', color: COLORS.CYAN
        }).setOrigin(0.5);
        y += 40;

        // Control diagram - draw mini grid
        const gfx = this.add.graphics();
        const tileSize = 40;
        const gap = 3;
        const gridStartX = cx - (3 * tileSize + 2 * gap) / 2;
        const gridStartY = y;
        const demoNumbers = [3, 1, 5, 7, 2, 9, 6, 4, 8];

        for (let i = 0; i < 9; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const tx = gridStartX + col * (tileSize + gap);
            const ty = gridStartY + row * (tileSize + gap);

            gfx.fillStyle(0x0E2240, 1);
            gfx.fillRoundedRect(tx, ty, tileSize, tileSize, 3);
            gfx.lineStyle(1.5, 0x00E5FF, 1);
            gfx.strokeRoundedRect(tx, ty, tileSize, tileSize, 3);

            const highlight = demoNumbers[i] === 1;
            this.add.text(tx + tileSize / 2, ty + tileSize / 2, String(demoNumbers[i]), {
                fontFamily: FONT_FAMILY, fontSize: '16px',
                color: highlight ? '#FFD700' : COLORS.CYAN
            }).setOrigin(0.5);
        }

        // Finger pointer at tile "1" (index 1 in grid)
        const t1x = gridStartX + 1 * (tileSize + gap) + tileSize / 2;
        const t1y = gridStartY + tileSize + 8;
        this.add.text(t1x, t1y + tileSize + 10, '\u261D', {
            fontSize: '28px'
        }).setOrigin(0.5);

        y = gridStartY + 3 * (tileSize + gap) + 20;

        this.add.text(cx, y, 'TAP "1" FIRST  ->  "2"  ->  "3" ...', {
            fontFamily: FONT_FAMILY, fontSize: '13px', color: COLORS.HUD_TEXT
        }).setOrigin(0.5);
        y += 20;

        // Timer bar diagram
        gfx.fillStyle(0x112233, 1);
        gfx.fillRoundedRect(40, y, CANVAS_WIDTH - 80, 12, 3);
        gfx.fillStyle(0x00E5FF, 1);
        gfx.fillRoundedRect(40, y, (CANVAS_WIDTH - 80) * 0.7, 12, 3);
        y += 18;

        this.add.text(cx, y, 'Timer drains constantly - be fast!', {
            fontFamily: FONT_FAMILY, fontSize: '11px', color: '#88AACC'
        }).setOrigin(0.5);
        y += 30;

        // Rules section
        this.add.text(30, y, 'RULES', {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: COLORS.GREEN
        });
        y += 22;

        const rules = [
            '\u2022 Tap numbers 1 -> 2 -> 3... in order',
            '\u2022 Correct tap refills timer slightly',
            '\u2022 Wrong tap costs -1.5 seconds!',
            '\u2022 Same-color chains = bonus points',
            '\u2022 Streak multiplier builds with combos'
        ];
        rules.forEach(r => {
            this.add.text(30, y, r, {
                fontFamily: FONT_FAMILY, fontSize: '12px', color: COLORS.HUD_TEXT
            });
            y += 18;
        });
        y += 10;

        // Power tiles section
        this.add.text(30, y, 'POWER TILES', {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: COLORS.POWER_GOLD
        });
        y += 22;

        const powers = [
            ['\u26A1 OVERLOAD', 'Clears 4 nearby tiles'],
            ['\u2744 CRYOFREEZE', 'Freezes timer for 3s'],
            ['\uD83D\uDC41 NEURAL', 'Reveals hidden tiles']
        ];
        powers.forEach(([name, desc]) => {
            this.add.text(30, y, name, {
                fontFamily: FONT_FAMILY, fontSize: '12px', color: COLORS.POWER_GOLD
            });
            this.add.text(160, y, desc, {
                fontFamily: FONT_FAMILY, fontSize: '11px', color: COLORS.HUD_TEXT
            });
            y += 18;
        });
        y += 10;

        // Tips section
        this.add.text(30, y, 'TIPS', {
            fontFamily: FONT_FAMILY, fontSize: '14px', color: COLORS.CYAN
        });
        y += 22;

        const tips = [
            '1. Scan the full grid before tapping',
            '2. Same-color runs earn bonus score',
            '3. Save Cryofreeze for when timer is red'
        ];
        tips.forEach(t => {
            this.add.text(30, y, t, {
                fontFamily: FONT_FAMILY, fontSize: '12px', color: COLORS.HUD_TEXT
            });
            y += 18;
        });
        y += 20;

        // GOT IT button at fixed position near bottom
        const btnY = Math.min(y + 20, CANVAS_HEIGHT - 60);
        const btnGfx = this.add.graphics();
        btnGfx.fillStyle(0x0D2F5A, 1);
        btnGfx.fillRoundedRect(cx - 120, btnY - 24, 240, 48, 8);
        btnGfx.lineStyle(2, 0x00E5FF, 1);
        btnGfx.strokeRoundedRect(cx - 120, btnY - 24, 240, 48, 8);

        this.add.text(cx, btnY, 'GOT IT!', {
            fontFamily: FONT_FAMILY, fontSize: '20px', color: COLORS.BTN_TEXT
        }).setOrigin(0.5);

        // Full-screen tap zone as fallback, but prioritize button zone
        const btnZone = this.add.zone(cx, btnY, 260, 56)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.goBack());

        // Also add full screen fallback below button
        this.add.zone(cx, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 40)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.goBack());
    }

    goBack() {
        SoundManager.playUIClick(this);
        this.scene.stop('HelpScene');
        this.scene.start(this.returnTo);
    }
}
