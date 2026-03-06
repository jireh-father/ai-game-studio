// help.js - HelpScene with illustrated instructions

class HelpScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HelpScene' });
    }

    init(data) {
        this.returnTo = (data && data.returnTo) || 'MenuScene';
    }

    create() {
        var w = GAME.WIDTH;
        var h = GAME.HEIGHT;

        // Dark background
        this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

        // Title
        this.add.text(w / 2, 40, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        // Illustration 1: Characters with thread and arrows
        var charAImg = this.add.image(w / 2 - 60, 130, 'charA').setScale(1.2);
        var charBImg = this.add.image(w / 2 + 60, 130, 'charB').setScale(1.2);
        var g1 = this.add.graphics();
        g1.lineStyle(2, 0xE0E0E0, 0.8);
        g1.lineBetween(w / 2 - 40, 130, w / 2 + 40, 130);
        // Arrows
        this.add.text(w / 2 - 85, 115, '<--', {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.CHAR_A
        });
        this.add.text(w / 2 + 65, 115, '-->', {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.CHAR_B
        });
        this.add.text(w / 2, 170, 'TAP = Both jump opposite!', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        // Illustration 2: Obstacles
        this.add.image(w / 2 - 80, 240, 'obstacle').setScale(0.8);
        this.add.image(w / 2 + 80, 240, 'obstacle').setScale(0.8).setFlipX(true);
        this.add.image(w / 2 - 20, 240, 'charA').setScale(0.7).setAlpha(0.6);
        this.add.image(w / 2 + 20, 240, 'charB').setScale(0.7).setAlpha(0.6);
        this.add.text(w / 2, 280, 'Dodge obstacles from both sides', {
            fontSize: '15px', fontFamily: 'Arial', color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        // Illustration 3: Combo
        this.add.text(w / 2, 330, 'x5 COMBO!', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.REWARD
        }).setOrigin(0.5);
        this.add.text(w / 2, 360, 'Chain dodges for combos!', {
            fontSize: '15px', fontFamily: 'Arial', color: COLORS.UI_TEXT
        }).setOrigin(0.5);

        // Rules
        var rulesY = 410;
        var rules = [
            'Tap anywhere to make both characters jump',
            'Character A jumps LEFT, Character B jumps RIGHT',
            'Time your taps so BOTH dodge obstacles',
            '3 lives - lose one when either gets hit',
            'Stay active! Idle for 5 seconds = game over'
        ];
        for (var i = 0; i < rules.length; i++) {
            this.add.text(w / 2, rulesY + i * 24, rules[i], {
                fontSize: '13px', fontFamily: 'Arial', color: COLORS.SUBTITLE
            }).setOrigin(0.5);
        }

        // Tips
        var tipsY = rulesY + rules.length * 24 + 20;
        var tips = [
            'TIP: Watch for the overlap - the moment both are safe',
            'TIP: Perfect timing (+25 pts) within 80ms window',
            'TIP: Combo milestones change the thread color!'
        ];
        for (var j = 0; j < tips.length; j++) {
            this.add.text(w / 2, tipsY + j * 24, tips[j], {
                fontSize: '13px', fontFamily: 'Arial', color: COLORS.REWARD
            }).setOrigin(0.5);
        }

        // GOT IT button
        var btnY = 680;
        var btn = this.add.rectangle(w / 2, btnY, 180, 50, 0x4FC3F7, 1).setInteractive({ useHandCursor: true });
        var btnText = this.add.text(w / 2, btnY, 'GOT IT!', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold',
            color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        btnText.disableInteractive();

        btn.on('pointerdown', function() {
            this.scene.start(this.returnTo);
        }, this);
    }
}
