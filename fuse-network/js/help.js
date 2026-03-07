// help.js - HelpScene: illustrated how-to-play with fuse type guide
class HelpScene extends Phaser.Scene {
    constructor() { super({ key: 'HelpScene' }); }

    init(data) {
        this.returnScene = data && data.returnScene ? data.returnScene : 'MenuScene';
    }

    create() {
        const w = this.scale.width; const h = this.scale.height;
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.92).setDepth(0);

        let yPos = h * 0.04;
        this.add.text(w / 2, yPos, 'HOW TO PLAY', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#00AAFF'
        }).setOrigin(0.5, 0).setDepth(1);

        yPos += 50;
        this._addSection(w / 2, yPos, 'TAP fuse lines to CUT them', '#FFFFFF', 18);
        yPos += 30;
        this._addSection(w / 2, yPos, 'Stop fire from reaching your BASE!', '#FFFFFF', 16);

        yPos += 50;
        this.add.text(w / 2, yPos, 'SCORING', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700'
        }).setOrigin(0.5, 0).setDepth(1);
        yPos += 30;
        this._addSection(w / 2, yPos, 'Normal cut: 50 pts', '#CCCCCC', 14);
        yPos += 22;
        this._addSection(w / 2, yPos, 'Close call (80px): 2x = 100 pts', '#FFFFFF', 14);
        yPos += 22;
        this._addSection(w / 2, yPos, 'Last second (40px): 3x = 150 pts!', '#FFD700', 15);

        yPos += 45;
        this.add.text(w / 2, yPos, 'FUSE TYPES', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00AAFF'
        }).setOrigin(0.5, 0).setDepth(1);
        yPos += 35;

        const fuseTypes = [
            { label: 'Normal - steady burn', color: 0xFFE0A0 },
            { label: 'Fast - 2x speed (Stage 9+)', color: 0xFF8C00 },
            { label: 'Delayed - pauses then sprints (16+)', color: 0x00CED1 },
            { label: 'Split - branches into 2 (26+)', color: 0xFF00FF }
        ];
        const gfx = this.add.graphics().setDepth(1);
        for (const ft of fuseTypes) {
            gfx.lineStyle(4, ft.color, 1);
            gfx.beginPath();
            gfx.moveTo(w * 0.12, yPos + 6);
            gfx.lineTo(w * 0.32, yPos + 6);
            gfx.strokePath();
            this.add.text(w * 0.36, yPos, ft.label, {
                fontSize: '13px', fontFamily: 'Arial', color: '#CCCCCC'
            }).setOrigin(0, 0).setDepth(1);
            yPos += 28;
        }

        yPos += 20;
        this.add.text(w / 2, yPos, 'TIPS', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#2ECC71'
        }).setOrigin(0.5, 0).setDepth(1);
        yPos += 30;

        const tips = [
            'You have 3 HP (shields). Lose all = Game Over',
            'Route fire to green safe zones for bonus!',
            'Build combos with consecutive last-second cuts',
            'Prioritize fast fuses - they arrive first!',
            'Delayed fuses look slow but sprint suddenly',
            'Idle for too long and fires will reach your base'
        ];
        for (const tip of tips) {
            this._addSection(w / 2, yPos, '- ' + tip, '#BBBBBB', 13);
            yPos += 24;
        }

        yPos += 30;
        const btn = this.add.rectangle(w / 2, yPos, 160, 48, 0x00AAFF)
            .setInteractive({ useHandCursor: true }).setDepth(1);
        const gotItTxt = this.add.text(w / 2, yPos, 'Got it!', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5, 0.5).setDepth(2);

        const closeHelp = () => {
            this.scene.stop();
            if (this.returnScene === 'GameScene') {
                this.scene.resume('GameScene');
            }
        };
        btn.on('pointerup', closeHelp);
        gotItTxt.setInteractive({ useHandCursor: true }).on('pointerup', closeHelp);
    }

    _addSection(x, y, text, color, size) {
        this.add.text(x, y, text, {
            fontSize: size + 'px', fontFamily: 'Arial', color: color,
            wordWrap: { width: this.scale.width - 40 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(1);
    }
}
