class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

    create() {
        const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.92).setDepth(0);

        const container = this.add.container(0, 0).setDepth(1);
        let y = 40;

        const title = this.add.text(w / 2, y, 'HOW TO PLAY', { fontSize: '26px', fontFamily: 'Arial', fill: '#F0EDE8', fontStyle: 'bold' }).setOrigin(0.5);
        container.add(title);
        y += 50;

        const subtitle = this.add.text(w / 2, y, 'You are a cat stealing things off shelves!', { fontSize: '13px', fontFamily: 'Arial', fill: '#D4AF37', wordWrap: { width: 300 } }).setOrigin(0.5);
        container.add(subtitle);
        y += 40;

        const secHead = (text, yPos) => {
            const t = this.add.text(w / 2, yPos, text, { fontSize: '18px', fontFamily: 'Arial', fill: '#FFE234', fontStyle: 'bold' }).setOrigin(0.5);
            container.add(t);
            return yPos + 28;
        };

        // Controls section
        y = secHead('CONTROLS', y);
        const g = this.add.graphics().setDepth(1);
        g.fillStyle(0x8B5E3C); g.fillRoundedRect(40, y, 280, 12, 3);
        g.fillStyle(0x7A8FA6); g.fillRoundedRect(100, y - 40, 36, 38, 4);
        g.fillStyle(0xE8A838); g.fillRoundedRect(162, y - 40, 36, 38, 4);
        g.fillStyle(0xD4AF37); g.fillRoundedRect(224, y - 40, 36, 38, 4);
        container.add(g);

        const arrowL = this.add.text(75, y - 25, '<--', { fontSize: '18px', fill: '#FF6B35', fontStyle: 'bold' }).setOrigin(0.5);
        const arrowR = this.add.text(285, y - 25, '-->', { fontSize: '18px', fill: '#FF6B35', fontStyle: 'bold' }).setOrigin(0.5);
        container.add([arrowL, arrowR]);

        const swipeTxt = this.add.text(w / 2, y + 22, 'Swipe LEFT or RIGHT on items to knock them off!', { fontSize: '12px', fill: '#F0EDE8', wordWrap: { width: 300 } }).setOrigin(0.5);
        container.add(swipeTxt);
        y += 55;

        // Noise meter section
        y = secHead('NOISE METER', y);
        const mg = this.add.graphics().setDepth(1);
        mg.fillStyle(0x3A3A4A); mg.fillRoundedRect(40, y, 280, 14, 3);
        mg.fillStyle(0xFF6B35); mg.fillRoundedRect(40, y, 168, 14, 3);
        container.add(mg);
        y += 24;

        const tiers = [
            { label: 'Quiet 8%', color: '#7A8FA6' },
            { label: 'Noisy 18%', color: '#E8A838' },
            { label: 'Loud 35%', color: '#D4AF37' },
            { label: 'CRASH 55%', color: '#9B59B6' }
        ];
        const startX = 45;
        tiers.forEach((t, i) => {
            const bx = startX + i * 75;
            const tg = this.add.graphics().setDepth(1);
            tg.fillStyle(Phaser.Display.Color.HexStringToColor(t.color).color);
            tg.fillRoundedRect(bx, y, 18, 18, 2);
            container.add(tg);
            const lb = this.add.text(bx + 22, y + 2, t.label, { fontSize: '10px', fill: t.color }).setOrigin(0, 0);
            container.add(lb);
        });
        y += 30;
        const noiseTip = this.add.text(w / 2, y, 'More valuable = more noise!', { fontSize: '12px', fill: '#FF6B35' }).setOrigin(0.5);
        container.add(noiseTip);
        y += 35;

        // Dog chase section
        y = secHead('DOG CHASE', y);
        const dirs = ['<', 'v', '>'];
        dirs.forEach((d, i) => {
            const bx = w / 2 - 60 + i * 60;
            const box = this.add.graphics().setDepth(1);
            box.lineStyle(2, 0xFF3333); box.strokeRoundedRect(bx - 20, y, 40, 40, 4);
            container.add(box);
            const dt = this.add.text(bx, y + 20, d, { fontSize: '22px', fill: '#FF3333', fontStyle: 'bold' }).setOrigin(0.5);
            container.add(dt);
        });
        y += 50;
        const chaseTxt = this.add.text(w / 2, y, 'Swipe in the arrow directions to escape!', { fontSize: '12px', fill: '#F0EDE8', wordWrap: { width: 300 } }).setOrigin(0.5);
        container.add(chaseTxt);
        y += 35;

        // Idle warning section
        y = secHead('IDLE WARNING', y);
        const idleTxt = this.add.text(w / 2, y, 'Stay still 24 seconds = suspicious!\nThe dog wakes automatically!', { fontSize: '12px', fill: '#FF3333', align: 'center', wordWrap: { width: 300 } }).setOrigin(0.5);
        container.add(idleTxt);
        y += 45;

        // Tips
        y = secHead('TIPS', y);
        const tips = [
            'Chain fast swipes for combos - quieter AND higher score!',
            'Cheap items first to build combo, then grab valuables!',
            'Watch the meter - 70%+ and the dog starts growling!'
        ];
        tips.forEach((tip, i) => {
            const tt = this.add.text(w / 2, y, `${i + 1}. ${tip}`, { fontSize: '11px', fill: '#F0EDE8', wordWrap: { width: 300 }, align: 'center' }).setOrigin(0.5);
            container.add(tt);
            y += 28;
        });
        y += 10;

        // Got it button
        const btnY = Math.min(y, h - 60);
        const btnBg = this.add.rectangle(w / 2, btnY, 200, 50, 0xD4AF37).setInteractive({ useHandCursor: true });
        const btnTxt = this.add.text(w / 2, btnY, 'GOT IT!', { fontSize: '22px', fontFamily: 'Arial', fill: '#1A1A2E', fontStyle: 'bold' }).setOrigin(0.5);
        container.add([btnBg, btnTxt]);

        btnBg.on('pointerdown', () => {
            this.scene.stop('HelpScene');
            if (this.returnTo === 'GameScene') {
                this.scene.resume('GameScene');
            }
        });

        // Full screen fallback tap zone
        const fallback = this.add.rectangle(w / 2, h - 20, w, 40, 0x000000, 0).setInteractive();
        fallback.on('pointerdown', () => {
            this.scene.stop('HelpScene');
            if (this.returnTo === 'GameScene') {
                this.scene.resume('GameScene');
            }
        });

        // Scrolling
        this.scrollY = 0;
        this.maxScroll = Math.max(0, y + 40 - h);
        this.container = container;

        if (this.maxScroll > 0) {
            this.input.on('pointermove', (ptr) => {
                if (ptr.isDown) {
                    this.scrollY = Phaser.Math.Clamp(this.scrollY - ptr.velocity.y * 0.02, 0, this.maxScroll);
                    container.y = -this.scrollY;
                }
            });
        }
    }
}
