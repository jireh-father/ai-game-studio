// Gravity Waiter - Help Scene

class HelpScene extends Phaser.Scene {
    constructor() {
        super('HelpScene');
    }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
        this.wasRunning = data.wasRunning || false;
    }

    create() {
        const W = CONFIG.WIDTH;
        const H = CONFIG.HEIGHT;

        // Background
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

        // Scrollable container
        this.contentY = 0;
        this.container = this.add.container(0, 0);

        // Title
        this.container.add(
            this.add.text(W / 2, 40, 'HOW TO PLAY', {
                fontSize: '24px', fontStyle: 'bold',
                color: '#FFF8F0', fontFamily: 'Arial'
            }).setOrigin(0.5)
        );

        this.container.add(
            this.add.text(W / 2, 70, 'Balance dishes while gravity shifts!', {
                fontSize: '13px', color: '#C0C0C0', fontFamily: 'Arial'
            }).setOrigin(0.5)
        );

        // Section 1: Tilt Control
        let y = 110;
        y = this.addSection(y, 'TILT YOUR TRAY', [
            { type: 'diagram', id: 'tilt' },
            { type: 'text', content: 'Drag left or right anywhere\non screen to tilt the tray.' }
        ]);

        // Section 2: Gravity Rotation
        y = this.addSection(y, 'GRAVITY SHIFTS!', [
            { type: 'diagram', id: 'gravity' },
            { type: 'text', content: 'Blue flash = gravity rotates 90 degrees!\nReact fast to re-balance.' }
        ]);

        // Section 3: Strikes
        y = this.addSection(y, 'STRIKES', [
            { type: 'diagram', id: 'strikes' },
            { type: 'text', content: 'Lose 3 dishes off the tray\n= Game Over!' }
        ]);

        // Tips
        y += 10;
        this.container.add(
            this.add.text(W / 2, y, 'TIPS', {
                fontSize: '18px', fontStyle: 'bold',
                color: '#FFD700', fontFamily: 'Arial'
            }).setOrigin(0.5)
        );
        y += 28;

        const tips = [
            'Tilt TOWARD the direction gravity\nwill shift next (watch the arrow!)',
            'Heavier dishes (bowling balls)\nfall faster - keep them centered',
            'Stay calm during rest stages\n(green tint) to recover'
        ];
        for (const tip of tips) {
            this.container.add(
                this.add.text(30, y, '\u2022 ' + tip, {
                    fontSize: '13px', color: '#E8E8E8',
                    fontFamily: 'Arial', wordWrap: { width: W - 60 }
                })
            );
            y += 45;
        }

        // Got it button - fixed at bottom
        this.maxScroll = Math.max(0, y - H + 120);
        const btnY = H - 55;
        const btn = this.add.rectangle(W / 2, btnY, 280, 55, 0xE63946).setInteractive({ useHandCursor: true });
        const btnTxt = this.add.text(W / 2, btnY, 'GOT IT!', {
            fontSize: '22px', fontStyle: 'bold',
            color: '#FFFFFF', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Full screen fallback tap zone
        const fallback = this.add.rectangle(W / 2, btnY, W, 80, 0x000000, 0).setInteractive();
        fallback.setDepth(-1);

        const dismiss = () => {
            this.scene.stop();
            if (this.wasRunning) {
                this.scene.resume(this.returnTo);
            }
        };
        btn.on('pointerup', dismiss);
        fallback.on('pointerup', dismiss);

        btn.on('pointerover', () => btn.setFillStyle(0xC44040));
        btn.on('pointerout', () => btn.setFillStyle(0xE63946));

        // Scrolling
        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && this.maxScroll > 0) {
                const dy = pointer.y - pointer.prevPosition.y;
                this.contentY = Phaser.Math.Clamp(this.contentY + dy, -this.maxScroll, 0);
                this.container.y = this.contentY;
            }
        });
    }

    addSection(startY, title, items) {
        const W = CONFIG.WIDTH;
        let y = startY;

        this.container.add(
            this.add.text(W / 2, y, title, {
                fontSize: '16px', fontStyle: 'bold',
                color: '#FFD700', fontFamily: 'Arial'
            }).setOrigin(0.5)
        );
        y += 24;

        for (const item of items) {
            if (item.type === 'diagram') {
                y = this.drawDiagram(item.id, y);
            } else {
                this.container.add(
                    this.add.text(W / 2, y, item.content, {
                        fontSize: '13px', color: '#E8E8E8',
                        fontFamily: 'Arial', align: 'center'
                    }).setOrigin(0.5)
                );
                y += 36;
            }
        }
        y += 10;
        return y;
    }

    drawDiagram(id, y) {
        const W = CONFIG.WIDTH;
        const cx = W / 2;
        const g = this.add.graphics();
        this.container.add(g);

        if (id === 'tilt') {
            // Dashed center line
            g.lineStyle(1, 0xAAAAAA);
            for (let i = 0; i < 8; i++) {
                g.lineBetween(cx - 80 + i * 22, y + 35, cx - 70 + i * 22, y + 35);
            }
            // Tilted tray
            g.lineStyle(2, 0x888888);
            g.fillStyle(0xC0C0C0);
            g.fillRoundedRect(cx - 55, y + 18, 110, 10, 5);
            g.strokeRoundedRect(cx - 55, y + 18, 110, 10, 5);
            // Plate on tray
            g.fillStyle(0xFFF8F0);
            g.fillEllipse(cx, y + 14, 36, 10);
            // Arrow right
            g.lineStyle(3, 0xE63946);
            g.lineBetween(cx + 50, y + 45, cx + 80, y + 45);
            g.lineBetween(cx + 73, y + 39, cx + 80, y + 45);
            g.lineBetween(cx + 73, y + 51, cx + 80, y + 45);
            // Arrow left
            g.lineBetween(cx - 50, y + 45, cx - 80, y + 45);
            g.lineBetween(cx - 73, y + 39, cx - 80, y + 45);
            g.lineBetween(cx - 73, y + 51, cx - 80, y + 45);
            y += 65;
        } else if (id === 'gravity') {
            // Down arrow (before)
            g.lineStyle(3, 0x00B4FF);
            g.lineBetween(cx - 40, y + 5, cx - 40, y + 35);
            g.lineBetween(cx - 46, y + 29, cx - 40, y + 35);
            g.lineBetween(cx - 34, y + 29, cx - 40, y + 35);
            // Curved arrow
            g.lineStyle(3, 0xFFD700);
            g.beginPath();
            g.arc(cx, y + 25, 22, -1.2, 0.8, false);
            g.strokePath();
            // Right arrow (after)
            g.lineStyle(3, 0x00B4FF);
            g.lineBetween(cx + 25, y + 25, cx + 55, y + 25);
            g.lineBetween(cx + 49, y + 19, cx + 55, y + 25);
            g.lineBetween(cx + 49, y + 31, cx + 55, y + 25);
            // Label
            this.container.add(
                this.add.text(cx, y + 50, '90 degree shift!', {
                    fontSize: '11px', color: '#00B4FF', fontFamily: 'Arial'
                }).setOrigin(0.5)
            );
            y += 65;
        } else if (id === 'strikes') {
            // 3 dish icons
            g.fillStyle(0xE63946);
            g.fillEllipse(cx - 40, y + 20, 30, 10);
            g.fillEllipse(cx, y + 20, 30, 10);
            g.fillStyle(0x888888);
            g.fillEllipse(cx + 40, y + 20, 30, 10);
            // Crack on third
            g.lineStyle(2, 0xFFFFFF);
            g.lineBetween(cx + 34, y + 16, cx + 40, y + 24);
            g.lineBetween(cx + 42, y + 15, cx + 46, y + 25);
            y += 45;
        }

        return y;
    }
}
