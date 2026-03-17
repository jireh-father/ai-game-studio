class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        const w = GAME_WIDTH;
        const h = GAME_HEIGHT;

        // Dark overlay background
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A, 0.95).setDepth(0);

        // Scrollable container
        const container = this.add.container(0, 0);
        let yPos = 30;

        // Title
        const title = this.add.text(w / 2, yPos, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold',
            color: COLORS.BTN_PRIMARY
        }).setOrigin(0.5);
        container.add(title);
        yPos += 50;

        // Game description
        const desc = this.add.text(w / 2, yPos, 'SNOOZE SURGEON', {
            fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold',
            color: COLORS.HUD_TEXT
        }).setOrigin(0.5);
        container.add(desc);
        yPos += 25;

        const sub = this.add.text(w / 2, yPos,
            'Operate on a patient who keeps\nfalling asleep!', {
            fontSize: '14px', fontFamily: 'monospace',
            color: '#8D99AE', align: 'center'
        }).setOrigin(0.5);
        container.add(sub);
        yPos += 55;

        // Section A: Keep Them Quiet
        yPos = this.addSection(container, yPos, 'KEEP THEM QUIET', [
            'The SNORE METER fills up constantly.',
            'If it maxes out, the patient SNORES',
            'and you lose a life!',
            '',
            'TAP THE NOSE to reset the meter.'
        ]);

        // Nose illustration
        const noseImg = this.add.image(w / 2, yPos + 20, 'nose_highlight').setScale(0.8);
        container.add(noseImg);
        const noseLabel = this.add.text(w / 2, yPos + 65, 'TAP HERE!', {
            fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
            color: COLORS.NOSE
        }).setOrigin(0.5);
        container.add(noseLabel);
        yPos += 95;

        // Meter illustration
        const meterBg = this.add.rectangle(w / 2, yPos, 260, 24, 0x2B2D42).setOrigin(0.5);
        const meterFill = this.add.rectangle(w / 2 - 65, yPos, 130, 20, 0xFFD60A).setOrigin(0.5);
        const meterDanger = this.add.rectangle(w / 2 + 80, yPos, 60, 20, 0xFF4136).setOrigin(0.5);
        const meterLabel = this.add.text(w / 2 - 120, yPos, 'SNORE', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#0D1B2A'
        }).setOrigin(0, 0.5);
        container.add([meterBg, meterFill, meterDanger, meterLabel]);

        const dangerLabel = this.add.text(w / 2 + 80, yPos + 18, 'DANGER!', {
            fontSize: '10px', fontFamily: 'monospace', color: COLORS.DANGER
        }).setOrigin(0.5);
        container.add(dangerLabel);
        yPos += 50;

        // Section B: Do the Surgery
        yPos = this.addSection(container, yPos, 'DO THE SURGERY', [
            'Glowing organs appear on the patient.',
            'TAP them before they disappear!',
            'Each tap = points.'
        ]);

        // Organ comparison
        const goodOrgan = this.add.image(w / 2 - 60, yPos + 20, 'organ_heart').setScale(0.7);
        const badOrgan = this.add.image(w / 2 + 60, yPos + 20, 'organ_fake').setScale(0.7);
        container.add([goodOrgan, badOrgan]);

        const goodLabel = this.add.text(w / 2 - 60, yPos + 55, 'TAP THIS!', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.ORGAN_ACTIVE
        }).setOrigin(0.5);
        const badLabel = this.add.text(w / 2 + 60, yPos + 55, 'FAKE!', {
            fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: COLORS.ORGAN_FAKE
        }).setOrigin(0.5);
        container.add([goodLabel, badLabel]);
        yPos += 85;

        // Section C: Rules
        yPos = this.addSection(container, yPos, 'RULES', [
            '3 lives. Snore = lose 1 life.',
            'Lose all 3 = GAME OVER.',
            'Complete surgery taps to advance.',
            'Each stage gets FASTER!'
        ]);

        // Section D: Tips
        yPos = this.addSection(container, yPos, 'TIPS', [
            '1. Watch the snore meter first!',
            '2. Red organs are FAKES (stage 11+)',
            '3. Chain organ taps for COMBOS!',
            '   3x = x1.5, 5x = x2, 8x = x3!'
        ]);

        // GOT IT button - fixed at bottom
        const btnY = Math.max(yPos + 30, h - 70);
        const gotItBg = this.add.rectangle(w / 2, btnY, 200, 56, 0x06D6A0, 1)
            .setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.closeHelp());
        const gotItText = this.add.text(w / 2, btnY, 'GOT IT!', {
            fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: '#0D1B2A'
        }).setOrigin(0.5);

        // Full screen fallback tap
        const fullTap = this.add.rectangle(w / 2, h - 20, w, 40, 0x000000, 0)
            .setInteractive().on('pointerdown', () => this.closeHelp());

        // Enable scroll if content is tall
        if (btnY > h - 80) {
            this.input.on('pointermove', (pointer) => {
                if (pointer.isDown) {
                    container.y += pointer.velocity.y * 0.02;
                    container.y = Phaser.Math.Clamp(container.y, -(btnY - h + 120), 0);
                }
            });
        }
    }

    addSection(container, yPos, title, lines) {
        const w = GAME_WIDTH;
        const sectionTitle = this.add.text(30, yPos, title, {
            fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
            color: COLORS.COMBO
        });
        container.add(sectionTitle);
        yPos += 25;

        for (const line of lines) {
            const txt = this.add.text(30, yPos, line, {
                fontSize: '13px', fontFamily: 'monospace',
                color: COLORS.HUD_TEXT, wordWrap: { width: w - 60 }
            });
            container.add(txt);
            yPos += 18;
        }
        yPos += 10;
        return yPos;
    }

    closeHelp() {
        this.scene.stop();
        if (this.returnTo === 'GameScene') {
            this.scene.resume('GameScene');
        } else {
            this.scene.start(this.returnTo);
        }
    }
}
