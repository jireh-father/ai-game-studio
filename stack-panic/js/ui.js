// Stack Panic - UI Scenes (Menu, GameOver, HUD, Pause, Settings)

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
        this.cameras.main.setBackgroundColor(COLORS.background);

        // Background grid
        this._drawGrid();

        // Title
        this.titleText = this.add.text(cx, cy - 160, 'STACK\nPANIC', {
            fontSize: '56px', fontFamily: 'Arial Black, Arial', fontStyle: 'bold',
            color: '#FFFFFF', align: 'center', stroke: '#E8A838', strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({
            targets: this.titleText, scaleX: 1.05, scaleY: 1.05,
            duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // High score
        const hs = StorageManager.getHighScore();
        if (hs > 0) {
            this.add.text(cx, cy - 80, `BEST: ${hs}`, {
                fontSize: '20px', fontFamily: 'Arial', color: '#FFD700'
            }).setOrigin(0.5);
        }

        // Play button
        const playBtn = this.add.rectangle(cx, cy + 20, 240, 64, COLORS.block, 1).setInteractive();
        playBtn.setStrokeStyle(2, COLORS.blockHighlight);
        const playTxt = this.add.text(cx, cy + 20, 'TAP TO PLAY', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);

        playBtn.on('pointerdown', () => {
            this.tweens.add({ targets: [playBtn, playTxt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true });
            audioManager.init();
            audioManager.resume();
            audioManager.play('ui_click');
            this.scene.start('GameScene');
        });

        // Settings gear
        const settingsBtn = this.add.text(GAME_WIDTH - 36, 30, '\u2699', {
            fontSize: '32px', color: '#FFFFFF'
        }).setOrigin(0.5).setInteractive();
        settingsBtn.on('pointerdown', () => this._toggleSettings());

        // Sound toggle
        const soundIcon = audioManager.enabled ? '\u{1F50A}' : '\u{1F507}';
        this.soundBtn = this.add.text(GAME_WIDTH - 36, GAME_HEIGHT - 40, soundIcon, {
            fontSize: '28px'
        }).setOrigin(0.5).setInteractive();
        this.soundBtn.on('pointerdown', () => {
            audioManager.enabled = !audioManager.enabled;
            this.soundBtn.setText(audioManager.enabled ? '\u{1F50A}' : '\u{1F507}');
            StorageManager.saveSetting('sound', audioManager.enabled);
        });

        // Settings overlay (hidden)
        this.settingsOverlay = null;
    }

    _drawGrid() {
        const g = this.add.graphics();
        g.lineStyle(1, COLORS.grid, 0.3);
        for (let x = 0; x < GAME_WIDTH; x += 40) {
            g.moveTo(x, 0); g.lineTo(x, GAME_HEIGHT);
        }
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            g.moveTo(0, y); g.lineTo(GAME_WIDTH, y);
        }
        g.strokePath();
    }

    _toggleSettings() {
        if (this.settingsOverlay) {
            this.settingsOverlay.destroy(true);
            this.settingsOverlay = null;
            return;
        }
        const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
        const cont = this.add.container(0, 0);

        const bg = this.add.rectangle(cx, cy, 300, 260, 0x000000, 0.85).setInteractive();
        cont.add(bg);
        cont.add(this.add.text(cx, cy - 100, 'SETTINGS', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5));

        const settings = StorageManager.getSettings();
        const labels = ['Sound Effects', 'Music', 'Haptic Feedback'];
        const keys = ['sound', 'music', 'vibration'];
        labels.forEach((label, i) => {
            const y = cy - 40 + i * 50;
            cont.add(this.add.text(cx - 100, y, label, { fontSize: '18px', color: '#FFFFFF' }).setOrigin(0, 0.5));
            const val = settings[keys[i]];
            const toggle = this.add.text(cx + 100, y, val ? 'ON' : 'OFF', {
                fontSize: '18px', fontStyle: 'bold', color: val ? '#4CAF50' : '#FF3030'
            }).setOrigin(0.5).setInteractive();
            toggle.on('pointerdown', () => {
                settings[keys[i]] = !settings[keys[i]];
                toggle.setText(settings[keys[i]] ? 'ON' : 'OFF');
                toggle.setColor(settings[keys[i]] ? '#4CAF50' : '#FF3030');
                StorageManager.saveSettings(settings);
                if (keys[i] === 'sound') audioManager.enabled = settings.sound;
            });
            cont.add(toggle);
        });

        const closeBtn = this.add.text(cx, cy + 110, 'CLOSE', {
            fontSize: '20px', fontStyle: 'bold', color: '#AAAAAA'
        }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => { cont.destroy(true); this.settingsOverlay = null; });
        cont.add(closeBtn);

        this.settingsOverlay = cont;
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create(data) {
        const cx = GAME_WIDTH / 2;
        this.cameras.main.setBackgroundColor(COLORS.background);

        const score = data.score || 0;
        const blocksLanded = data.blocksLanded || 0;
        const milestone = data.milestone || 1;
        const isNewBest = score > StorageManager.getHighScore();

        if (isNewBest) StorageManager.setHighScore(score);
        StorageManager.incrementGamesPlayed();

        // Game Over title
        const title = this.add.text(cx, 140, 'GAME OVER', {
            fontSize: '36px', fontFamily: 'Arial Black', fontStyle: 'bold', color: '#FF3030'
        }).setOrigin(0.5);
        this.tweens.add({ targets: title, x: cx - 3, duration: 50, yoyo: true, repeat: 5 });

        // Animated score count-up
        const scoreObj = { val: 0 };
        const scoreText = this.add.text(cx, 220, '0', {
            fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: scoreObj, val: score, duration: 600, ease: 'Power2',
            onUpdate: () => scoreText.setText(Math.floor(scoreObj.val).toString())
        });

        // New best banner
        if (isNewBest) {
            const best = this.add.text(cx, 280, 'NEW BEST!', {
                fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFD700'
            }).setOrigin(0.5);
            this.tweens.add({ targets: best, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
        }

        // Stats
        this.add.text(cx, 320, `Blocks Landed: ${blocksLanded}`, {
            fontSize: '18px', color: '#999999'
        }).setOrigin(0.5);
        this.add.text(cx, 348, `Milestone Reached: ${milestone}`, {
            fontSize: '18px', color: '#999999'
        }).setOrigin(0.5);

        let btnY = 420;

        // Continue button (rewarded ad)
        if (adManager.hasContinueAvailable()) {
            const contBtn = this.add.rectangle(cx, btnY, 220, 56, 0x3080FF).setInteractive();
            this.add.text(cx, btnY, 'CONTINUE (Watch Ad)', {
                fontSize: '17px', fontStyle: 'bold', color: '#FFFFFF'
            }).setOrigin(0.5);
            contBtn.on('pointerdown', () => {
                audioManager.play('ui_click');
                adManager.showRewarded('continue', () => {
                    this.scene.start('GameScene', { continueGame: true, prevData: data });
                }, null);
            });
            btnY += 70;
        }

        // Play again
        const playBtn = this.add.rectangle(cx, btnY, 220, 56, COLORS.block).setInteractive();
        this.add.text(cx, btnY, 'PLAY AGAIN', {
            fontSize: '20px', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        playBtn.on('pointerdown', () => {
            audioManager.play('ui_click');
            this._handlePlayAgain();
        });
        btnY += 70;

        // Menu
        const menuBtn = this.add.rectangle(cx, btnY, 160, 44, 0x555577).setInteractive();
        this.add.text(cx, btnY, 'MENU', {
            fontSize: '18px', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        menuBtn.on('pointerdown', () => {
            audioManager.play('ui_click');
            this.scene.start('MenuScene');
        });

        // Handle interstitial
        adManager.onGameOver();
    }

    _handlePlayAgain() {
        if (adManager.shouldShowInterstitial()) {
            adManager.showInterstitial(() => this.scene.start('GameScene'));
        } else {
            this.scene.start('GameScene');
        }
    }
}

// HUD Manager - created within GameScene
class HUDManager {
    constructor(scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0).setDepth(100).setScrollFactor(0);

        // Top bar background
        const topBar = scene.add.rectangle(GAME_WIDTH / 2, 22, GAME_WIDTH, 44, 0x000000, 0.53);
        this.container.add(topBar);

        // Score
        this.scoreText = scene.add.text(12, 12, '\u2605 SCORE: 0', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        });
        this.container.add(this.scoreText);

        // Milestone
        this.milestoneText = scene.add.text(GAME_WIDTH - 12, 12, '\u25A0 MILESTONE 1', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(1, 0);
        this.container.add(this.milestoneText);

        // Streak (below top bar, center)
        this.streakText = scene.add.text(GAME_WIDTH / 2, 50, '', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#E8A838'
        }).setOrigin(0.5).setAlpha(0);
        this.container.add(this.streakText);

        // Tilt meter (left edge)
        this.tiltBg = scene.add.rectangle(12, GAME_HEIGHT / 2, 8, 80, 0x333333).setScrollFactor(0);
        this.tiltFill = scene.add.rectangle(12, GAME_HEIGHT / 2 + 40, 8, 0, 0xFF3030).setOrigin(0.5, 1).setScrollFactor(0);
        this.container.add(this.tiltBg);
        this.container.add(this.tiltFill);

        // Pause button
        const pauseBtn = scene.add.text(GAME_WIDTH - 12, 50, '\u23F8', {
            fontSize: '28px', color: '#FFFFFF'
        }).setOrigin(1, 0).setInteractive().setScrollFactor(0);
        pauseBtn.on('pointerdown', (p) => {
            p.event.stopPropagation();
            scene.togglePause();
        });
        this.container.add(pauseBtn);
    }

    updateScore(score) {
        this.scoreText.setText(`\u2605 SCORE: ${score}`);
        this.scene.tweens.add({
            targets: this.scoreText, scaleX: 1.35, scaleY: 1.35,
            duration: 90, yoyo: true, ease: 'Back.easeOut'
        });
    }

    updateMilestone(m) {
        this.milestoneText.setText(`\u25A0 MILESTONE ${m}`);
    }

    updateStreak(n) {
        if (n >= 2) {
            this.streakText.setText(`STREAK: ${n} PERFECTS`);
            this.streakText.setAlpha(1);
            const fs = Math.min(28, 16 + n * 1.5);
            this.streakText.setFontSize(fs + 'px');
            this.scene.tweens.add({
                targets: this.streakText, scaleX: 1.1, scaleY: 1.1,
                duration: 100, yoyo: true
            });
        } else {
            this.scene.tweens.add({
                targets: this.streakText, alpha: 0, duration: 300
            });
        }
    }

    updateTilt(pct) {
        const height = Math.min(80, 80 * pct);
        this.tiltFill.setSize(8, height);
    }

    showMilestoneBanner(n) {
        const banner = this.scene.add.container(GAME_WIDTH / 2, -50).setDepth(200).setScrollFactor(0);
        const bg = this.scene.add.rectangle(0, 0, 240, 40, COLORS.block);
        const txt = this.scene.add.text(0, 0, `MILESTONE ${n}`, {
            fontSize: '24px', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        banner.add([bg, txt]);
        this.scene.tweens.add({
            targets: banner, y: 90, duration: 300, ease: 'Back.easeOut',
            hold: 1000,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: banner, y: -50, duration: 200,
                    onComplete: () => banner.destroy()
                });
            }
        });
    }

    destroy() {
        this.container.destroy();
        this.tiltBg.destroy();
        this.tiltFill.destroy();
    }
}
