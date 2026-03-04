// ui.js — Menu, GameOver, HUD, Pause overlay, Aim Arrow

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = CONFIG.WIDTH / 2;
        this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);

        // Spinning top decoration
        this.topDeco = this.add.graphics();
        this.drawTop(this.topDeco, cx, 200, 40, CONFIG.COLORS.PLAYER);
        this.tweens.add({ targets: this.topDeco, angle: 360, duration: 2000, repeat: -1 });

        // Title
        this.add.text(cx, 290, 'SPIN CLASH', {
            fontSize: '36px', fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold', color: '#00E5FF', align: 'center',
        }).setOrigin(0.5);

        // Best score
        const best = window.GAME_STATE ? window.GAME_STATE.highScore : 0;
        this.add.text(cx, 340, `BEST: ${best}`, {
            fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF',
        }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.graphics();
        playBtn.lineStyle(3, CONFIG.COLORS.PLAYER, 1);
        playBtn.strokeRoundedRect(cx - 120, 380, 240, 64, 12);
        const playText = this.add.text(cx, 412, 'PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
            color: '#00E5FF',
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(cx, 412, 240, 64).setInteractive();
        hitArea.on('pointerdown', () => {
            SoundFX.play('uiTap');
            playText.setScale(1.15);
            this.time.delayedCall(100, () => this.scene.start('GameScene'));
        });

        // Settings gear
        const gear = this.add.text(CONFIG.WIDTH - 36, 24, '\u2699', {
            fontSize: '28px', color: '#FFFFFF',
        }).setOrigin(0.5).setInteractive();
        gear.on('pointerdown', () => {
            SoundFX.play('uiTap');
            this.showSettings();
        });

        this.settingsOverlay = null;
    }

    drawTop(g, x, y, r, color) {
        g.fillStyle(color, 0.9);
        g.fillCircle(x, y, r);
        g.fillStyle(0xFFFFFF, 0.6);
        g.fillCircle(x, y, r * 0.5);
        g.lineStyle(2, color, 0.7);
        g.strokeEllipse(x, y, r * 2.4, r * 0.7);
    }

    showSettings() {
        if (this.settingsOverlay) return;
        const cx = CONFIG.WIDTH / 2;
        this.settingsOverlay = this.add.container(0, 0);
        const bg = this.add.rectangle(cx, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, CONFIG.COLORS.UI_BG, 0.85).setInteractive();
        this.settingsOverlay.add(bg);
        this.settingsOverlay.add(this.add.text(cx, 200, 'SETTINGS', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(0.5));

        const sfxState = window.GAME_STATE.settings.sound;
        const musState = window.GAME_STATE.settings.music;
        const sfxText = this.add.text(cx, 280, `Sound: ${sfxState ? 'ON' : 'OFF'}`, {
            fontSize: '20px', fontFamily: 'Arial', color: sfxState ? '#00E5FF' : '#FF4081',
        }).setOrigin(0.5).setInteractive();
        sfxText.on('pointerdown', () => {
            window.GAME_STATE.settings.sound = !window.GAME_STATE.settings.sound;
            sfxText.setText(`Sound: ${window.GAME_STATE.settings.sound ? 'ON' : 'OFF'}`);
            sfxText.setColor(window.GAME_STATE.settings.sound ? '#00E5FF' : '#FF4081');
            saveState();
        });
        this.settingsOverlay.add(sfxText);

        const musText = this.add.text(cx, 330, `Music: ${musState ? 'ON' : 'OFF'}`, {
            fontSize: '20px', fontFamily: 'Arial', color: musState ? '#00E5FF' : '#FF4081',
        }).setOrigin(0.5).setInteractive();
        musText.on('pointerdown', () => {
            window.GAME_STATE.settings.music = !window.GAME_STATE.settings.music;
            musText.setText(`Music: ${window.GAME_STATE.settings.music ? 'ON' : 'OFF'}`);
            musText.setColor(window.GAME_STATE.settings.music ? '#00E5FF' : '#FF4081');
            saveState();
        });
        this.settingsOverlay.add(musText);

        const closeBtn = this.add.text(cx, 420, 'CLOSE', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => {
            this.settingsOverlay.destroy();
            this.settingsOverlay = null;
        });
        this.settingsOverlay.add(closeBtn);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create(data) {
        const cx = CONFIG.WIDTH / 2;
        this.cameras.main.setBackgroundColor('rgba(10,14,26,0)');

        const bg = this.add.rectangle(cx, CONFIG.HEIGHT / 2, CONFIG.WIDTH, CONFIG.HEIGHT, CONFIG.COLORS.UI_BG, 0.88);

        this.add.text(cx, 160, 'GAME OVER', {
            fontSize: '34px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FF1744',
        }).setOrigin(0.5);

        const scoreText = this.add.text(cx, 230, `${data.score}`, {
            fontSize: '44px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(0.5).setScale(0.5);
        this.tweens.add({ targets: scoreText, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

        if (data.isHighScore) {
            const newRec = this.add.text(cx, 280, 'NEW RECORD!', {
                fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD600',
            }).setOrigin(0.5);
            this.tweens.add({ targets: newRec, scaleX: 1.15, scaleY: 1.15, duration: 500, yoyo: true, repeat: -1 });
        } else {
            this.add.text(cx, 280, `BEST: ${data.highScore}`, {
                fontSize: '18px', fontFamily: 'Arial', color: '#FFD600',
            }).setOrigin(0.5);
        }

        this.add.text(cx, 320, `Stage Reached: ${data.stage}`, {
            fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF',
        }).setOrigin(0.5);

        // Play Again
        const playBtn = this.add.graphics();
        playBtn.lineStyle(3, CONFIG.COLORS.PLAYER, 1);
        playBtn.strokeRoundedRect(cx - 110, 375, 220, 56, 10);
        playBtn.fillStyle(CONFIG.COLORS.PLAYER, 0.15);
        playBtn.fillRoundedRect(cx - 110, 375, 220, 56, 10);
        this.add.text(cx, 403, 'PLAY AGAIN', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#00E5FF',
        }).setOrigin(0.5);
        this.add.rectangle(cx, 403, 220, 56).setInteractive().on('pointerdown', () => {
            SoundFX.play('uiTap');
            this.scene.start('GameScene');
        });

        // Menu
        const menuBtn = this.add.graphics();
        menuBtn.lineStyle(2, 0xFFFFFF, 0.5);
        menuBtn.strokeRoundedRect(cx - 80, 450, 160, 48, 10);
        this.add.text(cx, 474, 'MENU', {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF',
        }).setOrigin(0.5);
        this.add.rectangle(cx, 474, 160, 48).setInteractive().on('pointerdown', () => {
            SoundFX.play('uiTap');
            this.scene.start('MenuScene');
        });
    }
}

// HUD class used by GameScene
class HUD {
    constructor(scene) {
        this.scene = scene;
        this.scoreText = scene.add.text(16, 14, 'Score: 0', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setDepth(100).setScrollFactor(0);

        this.stageText = scene.add.text(CONFIG.WIDTH - 16, 14, 'Stage 1', {
            fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF',
        }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

        // Pause button
        this.pauseBtn = scene.add.text(CONFIG.WIDTH - 16, 42, '||', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
        }).setOrigin(1, 0).setDepth(100).setScrollFactor(0).setInteractive();
        this.pauseBtn.on('pointerdown', () => scene.togglePause());

        // Spin bar background
        this.barBg = scene.add.graphics().setDepth(100).setScrollFactor(0);
        this.barFill = scene.add.graphics().setDepth(100).setScrollFactor(0);
        this.barY = CONFIG.HEIGHT - 40;
        this.barW = CONFIG.WIDTH - 32;
        this.barH = 14;
    }

    update(score, stage, spinEnergy, combo) {
        this.scoreText.setText(`Score: ${score}`);
        this.stageText.setText(`Stage ${stage}`);

        this.barBg.clear();
        this.barBg.fillStyle(0x333333, 0.6);
        this.barBg.fillRoundedRect(16, this.barY, this.barW, this.barH, 4);

        this.barFill.clear();
        const pct = Math.max(0, spinEnergy / 100);
        const color = spinEnergy > 30 ? CONFIG.COLORS.SPIN_FULL : CONFIG.COLORS.SPIN_LOW;
        this.barFill.fillStyle(color, 0.9);
        this.barFill.fillRoundedRect(16, this.barY, this.barW * pct, this.barH, 4);

        if (spinEnergy <= 30) {
            const pulse = 1 + Math.sin(this.scene.time.now / 250) * 0.05;
            this.barFill.setScale(1, pulse);
        } else {
            this.barFill.setScale(1, 1);
        }
    }

    showCombo(combo) {
        if (combo < 2) return;
        const cx = CONFIG.WIDTH / 2;
        const txt = this.scene.add.text(cx, CONFIG.HEIGHT - 80, `x${combo} COMBO!`, {
            fontSize: `${24 + (combo - 2) * 4}px`, fontFamily: 'Arial',
            fontStyle: 'bold', color: '#FFD600',
        }).setOrigin(0.5).setDepth(100).setScale(0.5);
        this.scene.tweens.add({
            targets: txt, scaleX: 1.2, scaleY: 1.2, duration: 120, yoyo: true,
            onComplete: () => {
                this.scene.tweens.add({ targets: txt, alpha: 0, duration: 1000, delay: 200, onComplete: () => txt.destroy() });
            }
        });
    }

    scorePunch() {
        this.scene.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
    }

    stageBump(stage) {
        this.stageText.setText(`Stage ${stage}`);
        this.stageText.setColor('#FFD600');
        this.scene.tweens.add({
            targets: this.stageText, scaleX: 1.5, scaleY: 1.5, duration: 200, yoyo: true,
            onComplete: () => this.stageText.setColor('#FFFFFF'),
        });
    }

    destroy() {
        this.scoreText.destroy();
        this.stageText.destroy();
        this.pauseBtn.destroy();
        this.barBg.destroy();
        this.barFill.destroy();
    }
}
