// help.js - HelpScene: illustrated how-to-play

var HelpScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function HelpScene() {
        Phaser.Scene.call(this, { key: 'HelpScene' });
    },

    create: function(data) {
        this.returnScene = (data && data.from) ? data.from : 'MenuScene';
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        var cx = DIMENSIONS.WIDTH / 2;
        var yOff = 30;

        // Title
        this.add.text(cx, yOff, 'HOW TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setOrigin(0.5);
        yOff += 50;

        // Instruction 1: Drag ingredients
        this.add.rectangle(cx, yOff + 40, 300, 90, 0xFFFFFF, 0.8).setStrokeStyle(1, 0xCCCCCC);
        this.drawDragDiagram(cx, yOff + 10);
        yOff += 95;
        this.add.text(cx, yOff, 'Drag ingredients from the belt\nto the cooking station slots', {
            fontSize: '14px', fontFamily: 'Arial', color: COLORS.HUD_TEXT, align: 'center'
        }).setOrigin(0.5);
        yOff += 50;

        // Instruction 2: Sabotage
        this.add.rectangle(cx, yOff + 40, 300, 90, 0xFFFFFF, 0.8).setStrokeStyle(1, 0xCCCCCC);
        this.drawSabotageDiagram(cx, yOff + 10);
        yOff += 95;
        this.add.text(cx, yOff, 'Sneak SABOTAGE ingredients\n(green border + skull) past the Judge\nfor BONUS POINTS!', {
            fontSize: '14px', fontFamily: 'Arial', color: COLORS.HUD_TEXT, align: 'center'
        }).setOrigin(0.5);
        yOff += 60;

        // Instruction 3: Vision cone danger
        this.add.rectangle(cx, yOff + 40, 300, 90, 0xFFFFFF, 0.8).setStrokeStyle(1, 0xCCCCCC);
        this.drawCaughtDiagram(cx, yOff + 10);
        yOff += 95;
        this.add.text(cx, yOff, "Don't drop sabotage when the\nJudge is watching -- you'll get CAUGHT!", {
            fontSize: '14px', fontFamily: 'Arial', color: COLORS.DANGER, align: 'center'
        }).setOrigin(0.5);
        yOff += 55;

        // Tips box
        var tipsBg = this.add.rectangle(cx, yOff + 55, 300, 100, 0xFFF8E7).setStrokeStyle(2, 0xFFD700);
        this.add.text(cx, yOff + 20, 'TIPS', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
        }).setOrigin(0.5);
        var tips = [
            'Build Sneaky Combos for huge multipliers!',
            'Fill ALL 4 slots with sabotage for 5x bonus!',
            'Place ingredients quickly -- timer is ticking!'
        ];
        for (var i = 0; i < tips.length; i++) {
            this.add.text(cx, yOff + 42 + i * 20, tips[i], {
                fontSize: '11px', fontFamily: 'Arial', color: COLORS.HUD_TEXT
            }).setOrigin(0.5);
        }
        yOff += 120;

        // Got it button
        var gotItBtn = this.add.rectangle(cx, yOff + 10, 200, 50, 0x00E676).setInteractive({ useHandCursor: true });
        gotItBtn.setStrokeStyle(2, 0x00C853);
        this.add.text(cx, yOff + 10, 'GOT IT!', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        var self = this;
        gotItBtn.on('pointerdown', function() {
            if (self.returnScene === 'UIScene') {
                self.scene.stop();
            } else {
                self.scene.start(self.returnScene);
            }
        });
    },

    drawDragDiagram: function(cx, y) {
        // Belt area
        this.add.rectangle(cx, y + 60, 200, 25, 0x3A3A3A);
        // Ingredient on belt
        var ing = this.add.circle(cx - 40, y + 60, 12, 0xFFD93D);
        // Slot above
        this.add.rectangle(cx + 30, y + 15, 30, 30, 0xE0E0E0).setStrokeStyle(1, 0xB0C4DE);
        // Arrow
        this.add.text(cx - 5, y + 35, '^', {
            fontSize: '24px', fontFamily: 'Arial', color: COLORS.SUCCESS
        }).setOrigin(0.5);
        // Finger icon
        this.add.circle(cx - 40, y + 45, 6, 0xFFDAB9).setStrokeStyle(1, 0x999999);
    },

    drawSabotageDiagram: function(cx, y) {
        // Judge
        this.add.image(cx - 60, y + 30, 'judge').setDisplaySize(25, 38);
        // Vision cone pointing away
        this.add.triangle(cx - 80, y + 55, 0, -10, -20, 15, 20, 15, 0xFF4444, 0.2);
        // Sabotage ingredient (green border)
        this.add.circle(cx + 40, y + 60, 14, 0xFFE44D).setStrokeStyle(2, 0x7FFF00);
        this.add.circle(cx + 52, y + 48, 5, 0x7FFF00, 0.7);
        this.add.text(cx + 50, y + 51, 'x', { fontSize: '7px', fontFamily: 'Arial', color: '#333' }).setOrigin(0.5);
        // Slot with checkmark
        this.add.rectangle(cx + 40, y + 20, 30, 30, 0xC8E6C9).setStrokeStyle(1, 0x00E676);
        this.add.text(cx + 50, y + 10, '+50', { fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.SUCCESS }).setOrigin(0.5);
    },

    drawCaughtDiagram: function(cx, y) {
        // Judge looking at slot
        this.add.image(cx - 20, y + 20, 'judge').setDisplaySize(25, 38);
        // Vision cone pointing at slot
        this.add.triangle(cx + 10, y + 50, 0, -15, -25, 20, 25, 20, 0xFF4444, 0.35);
        // Slot with X
        this.add.rectangle(cx + 40, y + 55, 30, 30, 0xFFCDD2).setStrokeStyle(2, 0xFF2D2D);
        this.add.text(cx + 40, y + 55, 'X', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER
        }).setOrigin(0.5);
        // -1 life
        this.add.text(cx + 70, y + 40, '-1', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER
        }).setOrigin(0.5);
        this.add.image(cx + 85, y + 40, 'chef_hat').setDisplaySize(14, 14);
    }
});
