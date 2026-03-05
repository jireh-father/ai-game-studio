// ui.js - MenuScene, GameOverScene, HUD, PauseOverlay

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const cx = GAME_WIDTH / 2;
        // Background
        this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PALETTE.BG);

        // Neon glow title
        const titleShadow = this.add.text(cx, 140, 'TAXI\nDRIFT\nSTACK', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            color: '#00E5FF', align: 'center', lineSpacing: -8
        }).setOrigin(0.5).setAlpha(0.3).setScale(1.05);

        this.add.text(cx, 140, 'TAXI\nDRIFT\nSTACK', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            color: '#FFD600', align: 'center', lineSpacing: -8,
            stroke: '#B8960A', strokeThickness: 3
        }).setOrigin(0.5);

        // Animated taxi in background
        this.taxiBg = this.add.image(cx, 320, 'taxi').setScale(2).setAlpha(0.3);
        this.tweens.add({
            targets: this.taxiBg, angle: 360,
            duration: 8000, repeat: -1
        });

        // High score
        this.add.text(cx, 410, `BEST: ${GameState.highScore.toLocaleString()} | STAGE ${GameState.highStage}`, {
            fontSize: '16px', fontFamily: 'Arial',
            color: '#4DB6AC'
        }).setOrigin(0.5);

        // Play button
        const playBg = this.add.rectangle(cx, 490, 260, 56, 0x00E5FF, 0.15)
            .setStrokeStyle(2, 0x00E5FF).setInteractive({ useHandCursor: true });
        const playTxt = this.add.text(cx, 490, 'TAP TO PLAY', {
            fontSize: '26px', fontFamily: 'Arial Black, Arial',
            color: '#00E5FF'
        }).setOrigin(0.5);
        playTxt.disableInteractive();

        this.tweens.add({
            targets: [playBg, playTxt], scaleX: 1.05, scaleY: 1.05,
            duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        playBg.on('pointerdown', () => {
            audioSynth.init();
            audioSynth.playMenuTap();
            GameState.reset();
            this.scene.start('GameScene');
        });

        // Help button
        const helpBtn = this.add.text(cx - 80, 560, '? How to Play', {
            fontSize: '16px', fontFamily: 'Arial',
            color: '#FFD700'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        helpBtn.on('pointerdown', () => {
            audioSynth.playMenuTap();
            this.scene.pause();
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // Settings gear
        const gear = this.add.text(GAME_WIDTH - 30, 30, '\u2699', {
            fontSize: '28px', color: '#FFFFFF'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        gear.on('pointerdown', () => this.showSettings());

        this.settingsPanel = null;
    }

    showSettings() {
        if (this.settingsPanel) return;
        const cx = GAME_WIDTH / 2;
        const panel = this.add.container(0, 0);
        const bg = this.add.rectangle(cx, GAME_HEIGHT / 2, 280, 240, 0x000000, 0.9)
            .setStrokeStyle(2, 0x00E5FF);
        panel.add(bg);
        panel.add(this.add.text(cx, GAME_HEIGHT / 2 - 80, 'SETTINGS', {
            fontSize: '24px', fontFamily: 'Arial Black', color: '#FFFFFF'
        }).setOrigin(0.5));

        const opts = ['Sound', 'Music', 'Vibration'];
        const keys = ['sound', 'music', 'vibration'];
        opts.forEach((name, i) => {
            const y = GAME_HEIGHT / 2 - 30 + i * 45;
            panel.add(this.add.text(cx - 80, y, name, {
                fontSize: '18px', color: '#FFFFFF'
            }).setOrigin(0, 0.5));
            const val = GameState.settings[keys[i]];
            const tog = this.add.text(cx + 80, y, val ? 'ON' : 'OFF', {
                fontSize: '18px', color: val ? '#00E5FF' : '#FF1744'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            tog.on('pointerdown', () => {
                GameState.settings[keys[i]] = !GameState.settings[keys[i]];
                tog.setText(GameState.settings[keys[i]] ? 'ON' : 'OFF');
                tog.setColor(GameState.settings[keys[i]] ? '#00E5FF' : '#FF1744');
                audioSynth.enabled = GameState.settings.sound;
                audioSynth.musicEnabled = GameState.settings.music;
                GameState.save();
            });
            panel.add(tog);
        });

        const closeBtn = this.add.text(cx, GAME_HEIGHT / 2 + 100, 'CLOSE', {
            fontSize: '20px', color: '#FFD700'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => { panel.destroy(); this.settingsPanel = null; });
        panel.add(closeBtn);
        panel.setDepth(50);
        this.settingsPanel = panel;
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create() {
        const cx = GAME_WIDTH / 2;
        this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);

        // Game Over title with shake
        const goText = this.add.text(cx, 150, 'GAME OVER', {
            fontSize: '42px', fontFamily: 'Arial Black, Arial',
            color: '#FF1744', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        shakeCamera(this, 8, 300);

        // Stage display
        this.add.text(cx, 220, `STAGE ${GameState.stage}`, {
            fontSize: '22px', fontFamily: 'Arial', color: '#4DB6AC'
        }).setOrigin(0.5);

        // Animated score counter
        const scoreTxt = this.add.text(cx, 290, '0', {
            fontSize: '48px', fontFamily: 'Arial Black, Arial',
            color: '#FFFFFF', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        const finalScore = GameState.score;
        let counter = { val: 0 };
        this.tweens.add({
            targets: counter, val: finalScore,
            duration: 1200, ease: 'Power2',
            onUpdate: () => scoreTxt.setText(Math.floor(counter.val).toLocaleString()),
            onComplete: () => {
                scoreTxt.setText(finalScore.toLocaleString());
                punchScale(this, scoreTxt, 1.3, 200);
            }
        });

        // New record check
        const isNewRecord = finalScore > GameState.highScore;
        if (isNewRecord) {
            GameState.highScore = finalScore;
        }
        if (GameState.stage > GameState.highStage) {
            GameState.highStage = GameState.stage;
        }
        GameState.gamesPlayed++;
        GameState.save();

        if (isNewRecord) {
            const nr = this.add.text(cx, 350, 'NEW RECORD!', {
                fontSize: '28px', fontFamily: 'Arial Black',
                color: '#FFD700', stroke: '#000000', strokeThickness: 3
            }).setOrigin(0.5).setScale(0);
            this.tweens.add({
                targets: nr, scale: 1.2, duration: 300, delay: 1300,
                ease: 'Back.easeOut', yoyo: true, hold: 200,
                onComplete: () => {
                    this.tweens.add({ targets: nr, scale: 1, alpha: 0.7, duration: 400, yoyo: true, repeat: 2 });
                }
            });
        }

        // Play Again button
        const btnY = isNewRecord ? 430 : 400;
        const playBg = this.add.rectangle(cx, btnY, 240, 52, 0x00E5FF, 0.2)
            .setStrokeStyle(2, 0x00E5FF).setInteractive({ useHandCursor: true });
        const playTxt = this.add.text(cx, btnY, 'PLAY AGAIN', {
            fontSize: '24px', fontFamily: 'Arial Black', color: '#00E5FF'
        }).setOrigin(0.5);
        playTxt.disableInteractive();

        playBg.on('pointerdown', () => {
            audioSynth.playMenuTap();
            GameState.reset();
            this.scene.start('GameScene');
        });

        // Menu button
        const menuBg = this.add.rectangle(cx, btnY + 65, 160, 40, 0x333333, 0.5)
            .setStrokeStyle(1, 0x666666).setInteractive({ useHandCursor: true });
        const menuTxt = this.add.text(cx, btnY + 65, 'MENU', {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF'
        }).setOrigin(0.5);
        menuTxt.disableInteractive();

        menuBg.on('pointerdown', () => {
            audioSynth.playMenuTap();
            this.scene.start('MenuScene');
        });

        audioSynth.playGameOver();
        audioSynth.stopMusic();
    }
}
