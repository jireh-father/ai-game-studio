// help.js - HelpScene: illustrated how-to-play

class HelpScene extends Phaser.Scene {
    constructor() { super('HelpScene'); }

    create(data) {
        this.fromScene = (data && data.from) || 'MenuScene';
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        // Background
        this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.92).setDepth(0);

        // Title
        this.add.text(cx, 30, 'HOW TO PLAY', {
            fontSize: '24px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);

        // Scrollable content container
        let yPos = 70;

        // Section 1: Visual diagram
        this.add.text(cx, yPos, 'Intersection Layout', {
            fontSize: '16px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        yPos += 28;

        // Mini intersection diagram
        const diagCx = cx, diagCy = yPos + 50;
        const ds = 35; // diagram scale

        // Roads
        this.add.rectangle(diagCx, diagCy, ds * 1.5, ds * 4, 0x2D2D2D).setDepth(1);
        this.add.rectangle(diagCx, diagCy, ds * 4, ds * 1.5, 0x2D2D2D).setDepth(1);

        // Traffic lights on diagram
        const lightS = 18;
        this.add.image(diagCx, diagCy - ds * 2.3, 'light_green').setDisplaySize(lightS, lightS).setDepth(2);
        this.add.image(diagCx, diagCy + ds * 2.3, 'light_green').setDisplaySize(lightS, lightS).setDepth(2);
        this.add.image(diagCx - ds * 2.3, diagCy, 'light_red').setDisplaySize(lightS, lightS).setDepth(2);
        this.add.image(diagCx + ds * 2.3, diagCy, 'light_red').setDisplaySize(lightS, lightS).setDepth(2);

        // Direction arrows
        this.drawArrow(diagCx - 8, diagCy - ds * 3.5, diagCx - 8, diagCy - ds * 1.2, 0x00E676); // N down
        this.drawArrow(diagCx + 8, diagCy + ds * 3.5, diagCx + 8, diagCy + ds * 1.2, 0x00E676); // S up
        // Perpendicular (red X)
        this.add.text(diagCx + ds * 1.5, diagCy - ds * 0.3, 'STOP', {
            fontSize: '10px', fill: CONFIG.COLORS.LIGHT_RED, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);
        this.add.text(diagCx - ds * 1.5, diagCy + ds * 0.3, 'STOP', {
            fontSize: '10px', fill: CONFIG.COLORS.LIGHT_RED, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);

        // Parallel OK label
        this.add.text(diagCx + ds * 2.5, diagCy - ds * 2.3, 'N+S = OK!', {
            fontSize: '9px', fill: CONFIG.COLORS.LIGHT_GREEN, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(2);

        // Perpendicular danger label
        this.add.text(diagCx + ds * 2.5, diagCy, 'N+E = CRASH!', {
            fontSize: '9px', fill: CONFIG.COLORS.LIGHT_RED, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(2);

        // Mini cars
        this.add.image(diagCx - 8, diagCy - ds * 2.8, 'car_sedan').setDisplaySize(10, 16).setAngle(180).setDepth(2);
        this.add.image(diagCx + 8, diagCy + ds * 2.8, 'car_sedan').setDisplaySize(10, 16).setAngle(0).setDepth(2);

        yPos = diagCy + ds * 3.5 + 15;

        // Section 2: Rules
        this.add.text(cx, yPos, 'Rules', {
            fontSize: '16px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        yPos += 24;

        const rules = [
            '> Tap traffic lights to toggle GREEN/RED',
            '> Cars on GREEN flow through intersection',
            '> N+S can be green together (parallel)',
            '> E+W can be green together (parallel)',
            '> N+E, N+W, S+E, S+W = CRASH!',
            '> 3 crashes = Game Over'
        ];
        rules.forEach(r => {
            this.add.text(30, yPos, r, {
                fontSize: '12px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial'
            }).setDepth(1);
            yPos += 20;
        });
        yPos += 10;

        // Section 3: Scoring
        this.add.text(cx, yPos, 'Scoring', {
            fontSize: '16px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        yPos += 24;

        const scoring = [
            '> Each safe pass = points',
            '> Keep traffic flowing for COMBO bonus',
            '> Combo multiplier grows every 5 passes',
            '> Near-miss = +25 bonus points!'
        ];
        scoring.forEach(s => {
            this.add.text(30, yPos, s, {
                fontSize: '12px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial'
            }).setDepth(1);
            yPos += 20;
        });
        yPos += 10;

        // Section 4: Tips
        this.add.text(cx, yPos, 'Tips', {
            fontSize: '16px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        yPos += 24;

        const tips = [
            '> Double-tap center for EMERGENCY STOP',
            '> Ambulances IGNORE red lights!',
            '> Don\'t idle! Lights malfunction after 8s',
            '> Trucks are slow but block longer',
            '> Sports cars are FAST - watch out!'
        ];
        tips.forEach(t => {
            this.add.text(30, yPos, t, {
                fontSize: '12px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial'
            }).setDepth(1);
            yPos += 20;
        });
        yPos += 10;

        // Vehicle types with icons
        this.add.text(cx, yPos, 'Vehicle Types', {
            fontSize: '16px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        yPos += 26;

        const vehicles = [
            { key: 'car_sedan', name: 'Sedan', desc: 'Normal speed, 10 pts' },
            { key: 'car_truck', name: 'Truck', desc: 'Slow & wide, 15 pts' },
            { key: 'car_sports', name: 'Sports', desc: 'Fast!, 20 pts' },
            { key: 'car_ambulance', name: 'Ambulance', desc: 'Ignores red!, 50 pts' }
        ];
        vehicles.forEach(v => {
            this.add.image(50, yPos + 8, v.key).setDisplaySize(18, 28).setDepth(2);
            this.add.text(75, yPos, v.name, {
                fontSize: '12px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial', fontStyle: 'bold'
            }).setDepth(1);
            this.add.text(75, yPos + 15, v.desc, {
                fontSize: '11px', fill: CONFIG.COLORS.SUBTITLE, fontFamily: 'Arial'
            }).setDepth(1);
            yPos += 36;
        });
        yPos += 10;

        // GOT IT button
        const btnY = Math.max(yPos, H - 50);
        this.createButton(cx, btnY, 180, 50, 'GOT IT!', CONFIG.COLORS.BUTTON_GREEN, '#000000', () => {
            this.scene.start(this.fromScene);
        });
    }

    drawArrow(x1, y1, x2, y2, color) {
        const g = this.add.graphics().setDepth(2);
        g.lineStyle(2, color, 1);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokePath();
        // Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 6;
        g.beginPath();
        g.moveTo(x2, y2);
        g.lineTo(x2 - headLen * Math.cos(angle - 0.5), y2 - headLen * Math.sin(angle - 0.5));
        g.moveTo(x2, y2);
        g.lineTo(x2 - headLen * Math.cos(angle + 0.5), y2 - headLen * Math.sin(angle + 0.5));
        g.strokePath();
    }

    createButton(x, y, w, h, label, bgColor, textColor, callback) {
        const bg = this.add.rectangle(x, y, w, h, Phaser.Display.Color.HexStringToColor(bgColor).color)
            .setInteractive().setDepth(10);
        const txt = this.add.text(x, y, label, {
            fontSize: '18px', fill: textColor, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(11);
        txt.setInteractive();
        let tapped = false;
        const onTap = () => {
            if (tapped) return;
            tapped = true;
            this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true, onComplete: callback });
        };
        bg.on('pointerdown', onTap);
        txt.on('pointerdown', onTap);
        return bg;
    }
}
