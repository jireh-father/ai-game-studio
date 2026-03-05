// ui.js - MenuScene, GameOverScene, UIScene (HUD overlay), PauseOverlay
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A1A);

        // Title with glow
        const title = this.add.text(w / 2, h * 0.22, 'TIME THIEF', {
            fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#00F5FF', stroke: '#005566', strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({ targets: title, alpha: 0.7, duration: 1200, yoyo: true, repeat: -1 });

        // Subtitle
        this.add.text(w / 2, h * 0.30, 'Steal seconds to survive', {
            fontSize: '14px', fontFamily: 'Arial', color: '#E0E0E0'
        }).setOrigin(0.5);

        // High score
        const hs = localStorage.getItem('time_thief_high_score') || 0;
        this.add.text(w / 2, h * 0.37, `Best: ${Number(hs).toLocaleString()}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFD700'
        }).setOrigin(0.5);

        // Play button
        const btnBg = this.add.rectangle(w / 2, h * 0.55, 180, 56, 0x0A0A1A)
            .setStrokeStyle(3, 0x00F5FF).setInteractive({ useHandCursor: true });
        const btnTxt = this.add.text(w / 2, h * 0.55, 'PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00F5FF'
        }).setOrigin(0.5);
        btnTxt.disableInteractive();
        this.tweens.add({
            targets: btnBg, strokeAlpha: 0.4, duration: 800, yoyo: true, repeat: -1
        });
        btnBg.on('pointerdown', () => {
            AdManager.reset();
            this.scene.start('GameScene');
        });

        // Help button
        const helpBg = this.add.rectangle(48, 48, 40, 40, 0x0A0A1A)
            .setStrokeStyle(2, 0x00F5FF).setInteractive({ useHandCursor: true });
        this.add.text(48, 48, '?', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00F5FF'
        }).setOrigin(0.5).disableInteractive();
        helpBg.on('pointerdown', () => {
            this.scene.pause();
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // Player character preview
        this.add.image(w / 2, h * 0.74, 'player').setScale(1.8).setAlpha(0.6);

        // Decorative crystals
        this.add.image(w * 0.25, h * 0.85, 'obstacle').setScale(0.6).setAlpha(0.3);
        this.add.image(w * 0.75, h * 0.85, 'obstacle').setScale(0.6).setAlpha(0.3);
    }
}

class UIScene extends Phaser.Scene {
    constructor() { super('UIScene'); }

    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.timerBarBg = this.add.rectangle(20, 20, w * 0.6, 16, 0x333333).setOrigin(0, 0);
        this.timerBar = this.add.rectangle(20, 20, w * 0.6, 16, 0x00F5FF).setOrigin(0, 0);
        this.timerText = this.add.text(20 + w * 0.62, 20, '10.0', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00F5FF'
        }).setOrigin(0, 0);
        this.stageText = this.add.text(w - 20, 20, 'Stage 1', {
            fontSize: '14px', fontFamily: 'Arial', color: '#E0E0E0'
        }).setOrigin(1, 0);
        this.chainText = this.add.text(w - 20, 40, '', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFB300'
        }).setOrigin(1, 0);
        this.scoreText = this.add.text(w / 2, h - 30, '0', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#E0E0E0'
        }).setOrigin(0.5);

        // Pause button
        const pauseBtn = this.add.rectangle(w - 28, h - 30, 36, 36, 0x0A0A1A, 0)
            .setStrokeStyle(2, 0xE0E0E0, 0.5).setInteractive({ useHandCursor: true }).setDepth(50);
        this.add.text(w - 28, h - 30, '||', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#E0E0E0'
        }).setOrigin(0.5).setDepth(50).disableInteractive();
        pauseBtn.on('pointerdown', () => {
            const gs = this.scene.get('GameScene');
            if (gs && gs.scene.isActive()) {
                gs.pauseGame();
            }
        });
    }

    updateHUD(data) {
        if (!data) return;
        const w = this.cameras.main.width;
        const maxWidth = w * 0.6;
        const ratio = Math.max(0, data.timer / TIMER.start);
        this.timerBar.width = maxWidth * Math.min(1, data.timer / 15);
        this.timerText.setText(data.timer.toFixed(1));

        // Color-code timer
        let color;
        if (data.timer > 5) color = 0x00F5FF;
        else if (data.timer > 2) color = 0xFFB300;
        else color = 0xFF1744;
        this.timerBar.setFillStyle(color);
        this.timerText.setColor(color === 0x00F5FF ? '#00F5FF' : color === 0xFFB300 ? '#FFB300' : '#FF1744');

        this.stageText.setText(`Stage ${data.stage}`);
        if (data.chain > 0) {
            this.chainText.setText(`x${data.chain}`);
            const cc = data.chain >= 10 ? '#FF1744' : data.chain >= 6 ? '#FF6D00' : data.chain >= 3 ? '#FFB300' : '#FFFFFF';
            this.chainText.setColor(cc);
        } else {
            this.chainText.setText('');
        }
        this.scoreText.setText(data.score.toLocaleString());
    }

    punchScore() {
        Effects.scalePunch(this, this.scoreText, 1.3, 120);
    }

    punchTimer() {
        Effects.scalePunch(this, this.timerBar, 1.1, 150);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.stage = data.stage || 1;
        this.totalStolen = data.totalStolen || 0;
    }

    create() {
        const w = this.cameras.main.width, h = this.cameras.main.height;
        this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A1A, 0.92);

        // Title
        const header = this.add.text(w / 2, h * 0.12, "TIME'S UP", {
            fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#FF1744', stroke: '#660000', strokeThickness: 3
        }).setOrigin(0.5);
        this.cameras.main.shake(300, 0.008);

        // Score with count-up
        const scoreTxt = this.add.text(w / 2, h * 0.28, '0', {
            fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        this.tweens.addCounter({
            from: 0, to: this.finalScore, duration: 800,
            onUpdate: (t) => scoreTxt.setText(Math.floor(t.getValue()).toLocaleString())
        });

        // Grade
        let grade = GRADE_TABLE[GRADE_TABLE.length - 1];
        for (const g of GRADE_TABLE) { if (this.finalScore >= g.min) { grade = g; break; } }
        this.add.text(w / 2, h * 0.37, grade.grade, {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: grade.color
        }).setOrigin(0.5);

        // High score check
        const hs = Number(localStorage.getItem('time_thief_high_score') || 0);
        if (this.finalScore > hs) {
            localStorage.setItem('time_thief_high_score', this.finalScore);
            const newBest = this.add.text(w / 2, h * 0.45, 'NEW BEST!', {
                fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700'
            }).setOrigin(0.5);
            this.tweens.add({ targets: newBest, scaleX: 1.2, scaleY: 1.2, duration: 400, yoyo: true, repeat: -1 });
        } else {
            this.add.text(w / 2, h * 0.45, `Best: ${hs.toLocaleString()}`, {
                fontSize: '16px', fontFamily: 'Arial', color: '#E0E0E0'
            }).setOrigin(0.5);
        }

        // Stats
        this.add.text(w / 2, h * 0.52, `Stage ${this.stage} | ${this.totalStolen}s stolen`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#E0E0E0'
        }).setOrigin(0.5);

        // Buttons
        const btnY = h * 0.67;
        this._makeBtn(w / 2, btnY, 'PLAY AGAIN', '#00F5FF', 0x00F5FF, () => {
            AdManager.reset();
            this.scene.start('GameScene');
        });
        this._makeBtn(w / 2, btnY + 60, 'MENU', '#E0E0E0', 0x666666, () => {
            this.scene.start('MenuScene');
        });

        // Update stats
        const gp = Number(localStorage.getItem('time_thief_games_played') || 0) + 1;
        localStorage.setItem('time_thief_games_played', gp);
        const maxStage = Math.max(Number(localStorage.getItem('time_thief_highest_stage') || 0), this.stage);
        localStorage.setItem('time_thief_highest_stage', maxStage);

        AdManager.onGameOver();
    }

    _makeBtn(x, y, label, color, strokeColor, cb) {
        const bg = this.add.rectangle(x, y, 180, 48, 0x0A0A1A)
            .setStrokeStyle(2, strokeColor).setInteractive({ useHandCursor: true });
        this.add.text(x, y, label, {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: color
        }).setOrigin(0.5).disableInteractive();
        bg.on('pointerdown', cb);
    }
}
