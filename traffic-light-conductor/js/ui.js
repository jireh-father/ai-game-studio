// ui.js - MenuScene, GameOverScene, pause, settings, button factory

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        // Background
        this.add.rectangle(cx, H / 2, W, H, 0x2D2D2D);

        // Decorative mini intersection
        this.add.rectangle(cx, H / 2, 80, H, 0x3D3D3D);
        this.add.rectangle(cx, H / 2, W, 80, 0x3D3D3D);
        for (let y = 0; y < H; y += 30) {
            this.add.rectangle(cx, y, 2, 12, 0xFFD700, 0.3);
        }

        // Decorative cars slowly moving
        this.decoCars = [];
        for (let i = 0; i < 4; i++) {
            const car = this.add.image(
                i < 2 ? cx + 20 : (i === 2 ? -20 : W + 20),
                i < 2 ? (i === 0 ? -20 : H + 20) : H / 2 + (i === 2 ? 20 : -20),
                'car_sedan'
            ).setDisplaySize(16, 26).setAlpha(0.4).setDepth(1);
            car.vx = i < 2 ? 0 : (i === 2 ? 0.5 : -0.5);
            car.vy = i < 2 ? (i === 0 ? 0.5 : -0.5) : 0;
            car.setAngle(i === 0 ? 180 : i === 1 ? 0 : i === 2 ? 90 : 270);
            this.decoCars.push(car);
        }

        // Title
        this.add.text(cx, H * 0.18, 'TRAFFIC LIGHT\nCONDUCTOR', {
            fontSize: '28px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial', fontStyle: 'bold',
            align: 'center', shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(cx, H * 0.32, 'One wrong green and cars collide!', {
            fontSize: '13px', fill: CONFIG.COLORS.SUBTITLE, fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Play button
        this.createButton(cx, H * 0.48, 200, 56, 'PLAY', CONFIG.COLORS.BUTTON_GREEN, '#000000', () => {
            GameState.score = 0; GameState.combo = 0; GameState.lives = 3;
            GameState.stage = 1; GameState.bestCombo = 0; GameState.totalCarsSaved = 0;
            this.scene.start('GameScene');
        });

        // High score
        const hs = localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE) || '0';
        this.add.text(cx, H * 0.58, 'Best: ' + hs, {
            fontSize: '16px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Stats
        const stage = localStorage.getItem(CONFIG.STORAGE_KEYS.HIGHEST_STAGE) || '0';
        this.add.text(cx, H * 0.64, 'Highest Stage: ' + stage, {
            fontSize: '13px', fill: CONFIG.COLORS.SUBTITLE, fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Help button
        this.createButton(cx + 80, H * 0.08, 44, 44, '?', CONFIG.COLORS.BUTTON_BLUE, '#FFFFFF', () => {
            this.scene.start('HelpScene', { from: 'MenuScene' });
        });

        // Sound toggle
        const settings = this.getSettings();
        this.soundBtn = this.add.text(W - 30, H - 30, settings.sound ? '🔊' : '🔇', {
            fontSize: '24px'
        }).setOrigin(0.5).setInteractive(new Phaser.Geom.Rectangle(-22, -22, 44, 44), Phaser.Geom.Rectangle.Contains);
        this.soundBtn.on('pointerdown', () => {
            settings.sound = !settings.sound;
            this.soundBtn.setText(settings.sound ? '🔊' : '🔇');
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        });

        // Decorative traffic lights
        const lightSize = 32;
        this.add.image(cx, H * 0.78, 'light_green').setDisplaySize(lightSize, lightSize).setAlpha(0.6);
        this.add.image(cx - 50, H * 0.78, 'light_red').setDisplaySize(lightSize, lightSize).setAlpha(0.6);
        this.add.image(cx + 50, H * 0.78, 'light_red').setDisplaySize(lightSize, lightSize).setAlpha(0.6);

        // Instructions hint
        this.add.text(cx, H * 0.88, 'Tap traffic lights to control flow\nDon\'t let perpendicular cars cross!', {
            fontSize: '11px', fill: CONFIG.COLORS.SUBTITLE, fontFamily: 'Arial', align: 'center'
        }).setOrigin(0.5);
    }

    update() {
        if (!this.decoCars) return;
        this.decoCars.forEach(c => {
            c.x += c.vx;
            c.y += c.vy;
            if (c.y > this.scale.height + 30) c.y = -30;
            if (c.y < -30) c.y = this.scale.height + 30;
            if (c.x > this.scale.width + 30) c.x = -30;
            if (c.x < -30) c.x = this.scale.width + 30;
        });
    }

    getSettings() {
        try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS)) || { sound: true, vibration: true }; }
        catch(e) { return { sound: true, vibration: true }; }
    }

    createButton(x, y, w, h, label, bgColor, textColor, callback) {
        const bg = this.add.rectangle(x, y, w, h, Phaser.Display.Color.HexStringToColor(bgColor).color)
            .setInteractive().setDepth(10);
        bg.setStrokeStyle(0);
        const txt = this.add.text(x, y, label, {
            fontSize: h > 44 ? '20px' : '18px', fill: textColor, fontFamily: 'Arial', fontStyle: 'bold'
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

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create(data) {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        // Dark overlay background
        this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.85).setDepth(0);

        // Game Over title - drops in
        const title = this.add.text(cx, -50, 'GAME OVER', {
            fontSize: '36px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        this.tweens.add({ targets: title, y: H * 0.1, duration: 400, ease: 'Bounce.easeOut' });

        // Cause
        this.add.text(cx, H * 0.18, data.cause || '', {
            fontSize: '16px', fill: CONFIG.COLORS.SUBTITLE, fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(1);

        // Score count-up
        const scoreText = this.add.text(cx, H * 0.28, '0', {
            fontSize: '48px', fill: CONFIG.COLORS.UI_TEXT, fontFamily: 'Arial', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1);
        const finalScore = data.score || 0;
        let displayScore = 0;
        const increment = Math.max(1, Math.ceil(finalScore / 48));
        const countUp = this.time.addEvent({
            delay: 16, callback: () => {
                displayScore = Math.min(finalScore, displayScore + increment);
                scoreText.setText(displayScore.toString());
                if (displayScore >= finalScore) countUp.destroy();
            }, loop: true
        });

        // New high score
        if (data.isNewHigh) {
            const newBest = this.add.text(cx, H * 0.37, 'NEW BEST!', {
                fontSize: '20px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(1);
            this.tweens.add({ targets: newBest, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
            // Confetti
            for (let i = 0; i < 40; i++) {
                const p = this.add.circle(cx + (Math.random() - 0.5) * W, H * 0.35, 3 + Math.random() * 3, 0xFFD700).setDepth(2);
                this.tweens.add({ targets: p, y: p.y + 80 + Math.random() * 100, x: p.x + (Math.random() - 0.5) * 60, alpha: 0, duration: 1200, delay: Math.random() * 300 });
            }
        } else {
            this.add.text(cx, H * 0.37, 'Best: ' + (data.highScore || 0), {
                fontSize: '16px', fill: CONFIG.COLORS.COMBO_GOLD, fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(1);
        }

        // Stats
        const statsY = H * 0.45;
        this.add.text(cx, statsY, 'Stage Reached: ' + (data.stage || 1), {
            fontSize: '14px', fill: CONFIG.COLORS.SUBTITLE, fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(1);
        this.add.text(cx, statsY + 22, 'Cars Saved: ' + (data.carsSaved || 0), {
            fontSize: '14px', fill: CONFIG.COLORS.SUBTITLE, fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(1);
        this.add.text(cx, statsY + 44, 'Best Combo: x' + (data.combo || 0), {
            fontSize: '14px', fill: CONFIG.COLORS.SUBTITLE, fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(1);

        // Buttons
        const btnY = H * 0.72;
        this.createButton(cx, btnY, 200, 50, 'Play Again', CONFIG.COLORS.BUTTON_GREEN, '#000000', () => {
            GameState.score = 0; GameState.combo = 0; GameState.lives = 3;
            GameState.stage = 1; GameState.bestCombo = 0; GameState.totalCarsSaved = 0;
            this.scene.start('GameScene');
        });
        this.createButton(cx, btnY + 62, 200, 50, 'Menu', CONFIG.COLORS.BUTTON_GRAY, '#FFFFFF', () => {
            this.scene.start('MenuScene');
        });
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
