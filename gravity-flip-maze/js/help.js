// help.js - HelpScene with illustrated instructions

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    init(data) {
        this.returnTo = (data && data.returnTo) ? data.returnTo : 'MenuScene';
    }

    create() {
        const W = GAME_CONFIG.GAME_WIDTH, H = GAME_CONFIG.GAME_HEIGHT;
        this.add.rectangle(W/2, H/2, W, H, COLORS.BG);

        // Title
        this.add.text(W/2, 40, 'HOW TO PLAY', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.BALL_HEX
        }).setOrigin(0.5);

        // Animated swipe diagram
        const cx = W/2, cy = 130;
        const dBall = this.add.image(cx, cy, 'ball').setDisplaySize(28, 28);
        this.tweens.add({
            targets: dBall, x: cx + 40, duration: 600, delay: 0,
            yoyo: true, repeat: -1, repeatDelay: 1800, ease: 'Power2'
        });

        // Direction arrows
        const arrowStyle = { fontSize: '20px', fontFamily: 'Arial', color: '#FFFFFF', alpha: 0.6 };
        this.add.text(cx, cy - 40, '\u2191', arrowStyle).setOrigin(0.5);
        this.add.text(cx, cy + 40, '\u2193', arrowStyle).setOrigin(0.5);
        this.add.text(cx - 50, cy, '\u2190', arrowStyle).setOrigin(0.5);
        this.add.text(cx + 50, cy, '\u2192', arrowStyle).setOrigin(0.5);

        this.add.text(cx, cy + 60, 'Swipe in any direction', {
            fontSize: '12px', fontFamily: 'Arial', color: '#AAAAAA'
        }).setOrigin(0.5);

        // Rules
        const rules = [
            { icon: 'ball', text: 'Swipe to flip gravity. Ball slides until hitting a wall.' },
            { icon: 'gem', text: 'Collect all gems for maximum stars.' },
            { icon: 'spike', text: 'Avoid pink spikes -- instant death!' },
            { icon: null, text: 'Purple walls phase in/out -- watch the timing.' },
            { icon: null, text: 'Cross your ghost trail for a speed boost!' },
            { icon: null, text: 'Complete under par moves for a bonus star.' }
        ];

        let ruleY = 210;
        rules.forEach(rule => {
            if (rule.icon) {
                this.add.image(30, ruleY, rule.icon).setDisplaySize(16, 16).setOrigin(0, 0.5);
            } else {
                this.add.circle(30, ruleY, 3, 0x00F5FF);
            }
            this.add.text(50, ruleY, rule.text, {
                fontSize: '13px', fontFamily: 'Arial', color: '#DDDDDD',
                wordWrap: { width: W - 70 }
            }).setOrigin(0, 0.5);
            ruleY += 40;
        });

        // Tips
        ruleY += 10;
        this.add.text(W/2, ruleY, 'TIPS', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GEM_HEX
        }).setOrigin(0.5);
        ruleY += 30;

        const tips = [
            'Plan 2-3 moves ahead before swiping.',
            'Ghost trail boosts are risky near spikes.',
            'Rest mazes appear every 10 levels.'
        ];
        tips.forEach(tip => {
            this.add.text(30, ruleY, '> ' + tip, {
                fontSize: '12px', fontFamily: 'Arial', color: '#AAAAAA',
                wordWrap: { width: W - 60 }
            }).setOrigin(0, 0.5);
            ruleY += 32;
        });

        // GOT IT button
        const btnY = Math.min(ruleY + 30, H - 60);
        const btnBg = this.add.rectangle(W/2, btnY, 160, 48, COLORS.WALL).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.EXIT_HEX).color).setInteractive({ useHandCursor: true });
        this.add.text(W/2, btnY, 'GOT IT!', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            this.scene.stop('HelpScene');
            this.scene.resume(this.returnTo);
        });
    }
}
