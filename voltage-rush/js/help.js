// Voltage Rush - Help Scene
class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = data.returnTo || 'MenuScene';
    }

    create() {
        var w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w/2, h/2, w, h, COLORS.bg).setDepth(0);

        var y = 30;
        this.add.text(w/2, y, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        }).setOrigin(0.5, 0);

        y += 50;
        this.drawControlDiagram(y);

        y += 140;
        var rulesTitle = this.add.text(20, y, 'RULES', {
            fontSize: '18px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        });
        y += 28;
        var rules = [
            'Nodes charge up automatically',
            'Tap a node to discharge it',
            'Electricity arcs to the nearest neighbor',
            'If ANY node reaches 100% = GAME OVER',
            'Gray nodes with X block arc paths'
        ];
        for (var i = 0; i < rules.length; i++) {
            this.add.text(24, y, '- ' + rules[i], {
                fontSize: '14px', fontFamily: 'Arial', fill: '#CCCCCC', wordWrap: { width: w - 48 }
            });
            y += 22;
        }

        y += 12;
        this.add.text(20, y, 'SCORING', {
            fontSize: '18px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        });
        y += 28;
        var scoring = [
            'Tap at 80%+: 200 pts (critical!)',
            'Tap at 50-79%: 100 pts (warning)',
            'Tap below 50%: 50 pts (safe)',
            'SafeChain x5: multiplier x1.5',
            'SafeChain x10: multiplier x2.0'
        ];
        for (var i = 0; i < scoring.length; i++) {
            this.add.text(24, y, '- ' + scoring[i], {
                fontSize: '14px', fontFamily: 'Arial', fill: '#CCCCCC', wordWrap: { width: w - 48 }
            });
            y += 22;
        }

        y += 12;
        this.add.text(20, y, 'TIPS', {
            fontSize: '18px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
        });
        y += 28;
        var tips = [
            '1. Watch RED nodes first - they explode soonest',
            '2. Orange jagged nodes charge 2x faster',
            '3. Route arcs away from gray blocked nodes'
        ];
        for (var i = 0; i < tips.length; i++) {
            this.add.text(24, y, tips[i], {
                fontSize: '14px', fontFamily: 'Arial', fill: '#FFD700', wordWrap: { width: w - 48 }
            });
            y += 22;
        }

        // Got it button - fixed position from bottom
        var btnY = h - 60;
        var btn = this.add.rectangle(w/2, btnY, 200, 50, 0x00AAFF, 0.2)
            .setStrokeStyle(2, 0x00AAFF).setInteractive({ useHandCursor: true });
        var btnText = this.add.text(w/2, btnY, 'GOT IT!', {
            fontSize: '22px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Fullscreen fallback tap zone
        var fullZone = this.add.zone(w/2, btnY, w, 80).setInteractive();
        fullZone.setDepth(-1);

        var self = this;
        var dismiss = function() {
            self.scene.stop('HelpScene');
            if (self.returnTo === 'GameScene') {
                self.scene.resume('GameScene');
            }
        };
        btn.on('pointerdown', dismiss);
        fullZone.on('pointerdown', dismiss);
    }

    drawControlDiagram(startY) {
        var g = this.add.graphics();
        var cx1 = 100, cx2 = 260, cy = startY + 60;

        // Wire connection
        g.lineStyle(1, COLORS.wire, 0.5);
        g.lineBetween(cx1, cy, cx2, cy);

        // Critical node (left) - red charge arc
        g.lineStyle(2, COLORS.critical);
        g.strokeCircle(cx1, cy, 22);
        g.fillStyle(0x0A1428);
        g.fillCircle(cx1, cy, 20);
        g.fillStyle(COLORS.critical, 0.6);
        g.fillCircle(cx1, cy, 10);
        // charge arc (80%)
        g.lineStyle(3, COLORS.critical);
        g.beginPath();
        g.arc(cx1, cy, 24, -Math.PI/2, -Math.PI/2 + Math.PI * 1.6);
        g.strokePath();

        // Safe node (right) - blue
        g.lineStyle(2, COLORS.nodeIdle);
        g.strokeCircle(cx2, cy, 22);
        g.fillStyle(0x0A1428);
        g.fillCircle(cx2, cy, 20);
        g.fillStyle(COLORS.nodeIdle, 0.6);
        g.fillCircle(cx2, cy, 10);
        // charge arc (30%)
        g.lineStyle(3, COLORS.safe);
        g.beginPath();
        g.arc(cx2, cy, 24, -Math.PI/2, -Math.PI/2 + Math.PI * 0.6);
        g.strokePath();

        // Tap indicator arrow
        this.add.text(cx1, cy + 36, 'TAP!', {
            fontSize: '14px', fontFamily: 'Arial', fill: '#FF3300', fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.add.text(cx1, cy + 52, '(critical)', {
            fontSize: '11px', fontFamily: 'Arial', fill: '#FF3300'
        }).setOrigin(0.5, 0);

        this.add.text(cx2, cy + 36, 'safe', {
            fontSize: '14px', fontFamily: 'Arial', fill: '#00AAFF'
        }).setOrigin(0.5, 0);
        this.add.text(cx2, cy + 52, '(no rush)', {
            fontSize: '11px', fontFamily: 'Arial', fill: '#00AAFF'
        }).setOrigin(0.5, 0);

        // Arc direction arrow
        this.add.text(180, cy - 20, 'arc >', {
            fontSize: '12px', fontFamily: 'Arial', fill: '#AADDFF'
        }).setOrigin(0.5, 0.5);
    }
}
