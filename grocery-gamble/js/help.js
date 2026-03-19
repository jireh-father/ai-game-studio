// Grocery Gamble - Help Scene
class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        const w = GAME_WIDTH, h = GAME_HEIGHT;

        // Background
        this.add.rectangle(w / 2, h / 2, w, h, 0x2C3E50, 0.95).setDepth(0);

        let y = 30;
        // Title
        this.add.text(w / 2, y, 'HOW TO PLAY', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5, 0).setDepth(1);
        y += 50;

        // Controls section
        this.add.text(20, y, 'CONTROLS:', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#2ECC71'
        }).setDepth(1);
        y += 30;

        // Step 1: Touch & Hold (drawn with primitives)
        this.add.rectangle(50, y + 20, 60, 60, 0x3E5060).setDepth(1);
        this.add.rectangle(35, y + 12, 30, 30, 0xE74C3C).setDepth(2);
        this.add.ellipse(60, y + 28, 16, 22, 0xD4A96A).setDepth(2);
        this.add.circle(60, y + 28, 14, 0xF39C12, 0).setStrokeStyle(2, 0xF39C12).setDepth(2);
        this.add.text(90, y + 5, '1. TOUCH & HOLD\n   item on belt', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ECF0F1', lineSpacing: 4
        }).setDepth(1);
        y += 65;

        // Step 2: Drag
        this.add.rectangle(50, y + 15, 60, 40, 0x3E5060).setDepth(1);
        this.add.text(25, y + 8, 'BELT  -->  SCALE', {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold', color: '#F39C12'
        }).setDepth(2);
        this.add.text(90, y + 5, '2. DRAG to the\n   scale platform', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ECF0F1', lineSpacing: 4
        }).setDepth(1);
        y += 55;

        // Step 3: Release in green
        this.add.rectangle(50, y + 20, 20, 50, 0xECF0F1).setDepth(1);
        this.add.rectangle(50, y + 18, 20, 16, 0x2ECC71).setDepth(2);
        this.add.rectangle(50, y + 20, 30, 3, 0xE74C3C).setDepth(3);
        this.add.text(90, y + 5, '3. RELEASE inside\n   the GREEN ZONE', {
            fontSize: '14px', fontFamily: 'Arial', color: '#ECF0F1', lineSpacing: 4
        }).setDepth(1);
        y += 65;

        // Divider
        this.add.rectangle(w / 2, y, w - 40, 1, 0x7F8C8D).setDepth(1);
        y += 15;

        // Rules
        this.add.text(20, y, 'RULES:', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#E74C3C'
        }).setDepth(1);
        y += 28;

        const rules = [
            '3 misses = BUSTED!',
            'Belt idle 12s = SECURITY CALLED',
            'Fragile items: drop from LOW height!',
            'Suspicion meter fills on misses'
        ];
        rules.forEach(r => {
            this.add.text(30, y, '> ' + r, {
                fontSize: '13px', fontFamily: 'Arial', color: '#ECF0F1'
            }).setDepth(1);
            y += 22;
        });
        y += 10;

        // Divider
        this.add.rectangle(w / 2, y, w - 40, 1, 0x7F8C8D).setDepth(1);
        y += 15;

        // Tips
        this.add.text(20, y, 'TIPS:', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#F1C40F'
        }).setDepth(1);
        y += 28;

        const tips = [
            'Size does NOT equal Weight!',
            'Build combos to drain suspicion',
            'Rush items flash — prioritize them!'
        ];
        tips.forEach(t => {
            this.add.text(30, y, '> ' + t, {
                fontSize: '13px', fontFamily: 'Arial', color: '#ECF0F1'
            }).setDepth(1);
            y += 22;
        });

        // GOT IT button - fixed position near bottom
        const btnY = h - 60;
        const btn = this.add.rectangle(w / 2, btnY, 200, 50, 0x2ECC71).setDepth(1).setInteractive();
        this.add.text(w / 2, btnY, 'GOT IT!', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(2);

        const closeHelp = () => {
            this.scene.stop();
            if (this.returnTo === 'GameScene') {
                const gs = this.scene.get('GameScene');
                if (gs && gs.paused) gs.togglePause();
                this.scene.resume('GameScene');
                this.scene.resume('HUDScene');
            } else {
                this.scene.resume('MenuScene');
            }
        };

        btn.on('pointerdown', closeHelp);

        // Fullscreen fallback tap zone
        const fallback = this.add.rectangle(w / 2, btnY, w, 80, 0x000000, 0).setDepth(0).setInteractive();
        fallback.on('pointerdown', closeHelp);
    }
}
