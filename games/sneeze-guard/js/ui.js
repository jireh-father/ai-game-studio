// Sneeze Guard - UI Scenes
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const W = CONFIG.GAME_WIDTH;
        const H = CONFIG.GAME_HEIGHT;

        this.add.rectangle(W / 2, H / 2, W, H, 0xFEFCF7);

        // Title
        this.add.text(W / 2, 140, 'SNEEZE', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            fontStyle: 'bold', color: CONFIG.COLOR.PRIMARY,
            stroke: '#fff', strokeThickness: 4
        }).setOrigin(0.5);
        this.add.text(W / 2, 195, 'GUARD', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            fontStyle: 'bold', color: CONFIG.COLOR.SNOT_DARK,
            stroke: '#fff', strokeThickness: 4
        }).setOrigin(0.5);

        // Decorative patron
        if (this.textures.exists('patron_windup2')) {
            this.add.image(W / 2, 280, 'patron_windup2').setScale(1.5);
        }

        // High score
        this.add.text(W / 2, 330, 'Best: ' + GameState.highScore, {
            fontSize: '18px', fontFamily: 'Arial', color: '#888888'
        }).setOrigin(0.5);

        // PLAY button
        const playBg = this.add.rectangle(W / 2, 400, 200, 60, 0x4A90D9)
            .setInteractive({ useHandCursor: true });
        const playTxt = this.add.text(W / 2, 400, 'PLAY', {
            fontSize: '28px', fontFamily: 'Arial Black, Arial',
            fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        playTxt.disableInteractive();

        playBg.on('pointerdown', () => {
            GameState.score = 0;
            GameState.stage = 1;
            GameState.hygiene = CONFIG.MAX_HYGIENE;
            GameState.streak = 0;
            AdManager.reset();
            this.scene.stop('MenuScene');
            this.scene.start('GameScene');
        });

        // HOW TO PLAY button
        const helpBg = this.add.rectangle(W / 2, 480, 180, 45, 0x88CC44)
            .setInteractive({ useHandCursor: true });
        const helpTxt = this.add.text(W / 2, 480, 'HOW TO PLAY', {
            fontSize: '18px', fontFamily: 'Arial Black, Arial',
            fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        helpTxt.disableInteractive();

        helpBg.on('pointerdown', () => {
            this.scene.pause('MenuScene');
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // Sound toggle
        const soundTxt = this.add.text(W - 40, 30, GameState.soundOn ? '🔊' : '🔇', {
            fontSize: '28px'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        soundTxt.on('pointerdown', () => {
            GameState.soundOn = !GameState.soundOn;
            soundTxt.setText(GameState.soundOn ? '🔊' : '🔇');
            localStorage.setItem('sneeze-guard_settings', JSON.stringify({
                soundOn: GameState.soundOn
            }));
        });
    }
}

class HUDScene extends Phaser.Scene {
    constructor() { super('HUDScene'); }

    create() {
        const W = CONFIG.GAME_WIDTH;
        this.hearts = [];

        // Top bar background
        this.add.rectangle(W / 2, 30, W, 60, 0x2C2C2C, 0.85).setDepth(0);

        // Hearts
        for (let i = 0; i < CONFIG.MAX_HYGIENE; i++) {
            const hx = 30 + i * 30;
            const heart = this.add.image(hx, 30, 'heart_full').setScale(1.0).setDepth(1);
            this.hearts.push(heart);
        }

        // Stage text
        this.stageText = this.add.text(W / 2, 22, 'Stage ' + GameState.stage, {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(1);

        // Score bar
        this.add.rectangle(W / 2, 72, W, 32, 0x2C2C2C, 0.6).setDepth(0);
        this.scoreText = this.add.text(20, 65, 'Score: ' + GameState.score, {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setDepth(1);

        this.streakText = this.add.text(W - 20, 65, 'Streak: ' + GameState.streak + 'x', {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(1, 0).setDepth(1);

        // Pause button
        const pauseBtn = this.add.text(W - 30, 22, '⏸', {
            fontSize: '22px', color: '#FFFFFF'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2);
        pauseBtn.on('pointerdown', () => {
            const gs = this.scene.get('GameScene');
            if (gs && gs.scene.isActive()) gs.togglePause();
        });

        // Listen for game events
        this.scene.get('GameScene').events.on('updateHUD', this.updateHUD, this);
        this.scene.get('GameScene').events.on('heartLoss', this.onHeartLoss, this);
    }

    updateHUD() {
        if (!this.scoreText) return;
        this.scoreText.setText('Score: ' + GameState.score);
        this.stageText.setText('Stage ' + GameState.stage);
        this.streakText.setText('Streak: ' + GameState.streak + 'x');
        if (GameState.streak >= CONFIG.SCORE.STREAK_DOUBLE) {
            this.streakText.setColor(CONFIG.COLOR.GOLD);
        } else {
            this.streakText.setColor('#FFFFFF');
        }
        // Update hearts
        for (let i = 0; i < this.hearts.length; i++) {
            if (i < GameState.hygiene) {
                this.hearts[i].setTexture('heart_full');
                this.hearts[i].clearTint();
            } else {
                this.hearts[i].setTexture('heart_empty');
            }
        }
    }

    onHeartLoss(index) {
        if (index >= 0 && index < this.hearts.length) {
            this.tweens.add({
                targets: this.hearts[index],
                scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true,
                onComplete: () => {
                    if (this.hearts[index] && this.hearts[index].scene) {
                        this.hearts[index].setTexture('heart_empty');
                    }
                }
            });
        }
    }

    shutdown() {
        const gs = this.scene.get('GameScene');
        if (gs) {
            gs.events.off('updateHUD', this.updateHUD, this);
            gs.events.off('heartLoss', this.onHeartLoss, this);
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create() {
        const W = CONFIG.GAME_WIDTH;
        const H = CONFIG.GAME_HEIGHT;
        const data = this.scene.settings.data || {};

        // Dark overlay
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8);

        // ACHOO title
        this.add.text(W / 2, 140, 'ACHOO!', {
            fontSize: '48px', fontFamily: 'Arial Black, Arial',
            fontStyle: 'bold', color: CONFIG.COLOR.SNOT
        }).setOrigin(0.5);

        // Final score with count-up
        const finalScore = data.score || GameState.score;
        const scoreTxt = this.add.text(W / 2, 220, '0', {
            fontSize: '42px', fontFamily: 'Arial Black', color: '#FFFFFF'
        }).setOrigin(0.5);

        // Animate score count-up
        this.tweens.addCounter({
            from: 0, to: finalScore, duration: 1000,
            onUpdate: (tween) => {
                if (scoreTxt && scoreTxt.scene) {
                    scoreTxt.setText(Math.floor(tween.getValue()));
                }
            }
        });

        // High score check
        const isNewBest = finalScore > GameState.highScore;
        if (isNewBest) {
            GameState.highScore = finalScore;
            localStorage.setItem('sneeze-guard_high_score', finalScore.toString());
            this.add.text(W / 2, 270, 'NEW BEST!', {
                fontSize: '24px', fontFamily: 'Arial Black',
                color: CONFIG.COLOR.GOLD
            }).setOrigin(0.5);
        }

        // Stage reached
        this.add.text(W / 2, isNewBest ? 305 : 280, 'Made it to Stage ' + GameState.stage, {
            fontSize: '18px', fontFamily: 'Arial', color: '#AAAAAA'
        }).setOrigin(0.5);

        let btnY = 380;

        // Ad continue button
        if (AdManager.canShowContinue) {
            const adBg = this.add.rectangle(W / 2, btnY, 260, 45, 0x88CC44)
                .setInteractive({ useHandCursor: true });
            const adTxt = this.add.text(W / 2, btnY, 'WATCH AD - Continue', {
                fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
            }).setOrigin(0.5);
            adTxt.disableInteractive();
            adBg.on('pointerdown', () => {
                AdManager.showRewardedContinue((success) => {
                    if (success) {
                        GameState.hygiene = 3;
                        this.scene.stop('GameOverScene');
                        this.scene.stop('GameScene');
                        this.scene.start('GameScene');
                    }
                });
            });
            btnY += 60;
        }

        // PLAY AGAIN
        const retryBg = this.add.rectangle(W / 2, btnY, 200, 55, 0x4A90D9)
            .setInteractive({ useHandCursor: true });
        const retryTxt = this.add.text(W / 2, btnY, 'PLAY AGAIN', {
            fontSize: '22px', fontFamily: 'Arial Black', fontStyle: 'bold', color: '#FFF'
        }).setOrigin(0.5);
        retryTxt.disableInteractive();
        retryBg.on('pointerdown', () => {
            GameState.score = 0;
            GameState.stage = 1;
            GameState.hygiene = CONFIG.MAX_HYGIENE;
            GameState.streak = 0;
            AdManager.reset();
            this.scene.stop('GameOverScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        });
        btnY += 65;

        // MENU
        const menuBg = this.add.rectangle(W / 2, btnY, 160, 40, 0x666666)
            .setInteractive({ useHandCursor: true });
        const menuTxt = this.add.text(W / 2, btnY, 'MENU', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
        }).setOrigin(0.5);
        menuTxt.disableInteractive();
        menuBg.on('pointerdown', () => {
            this.scene.stop('GameOverScene');
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });

        // Track game over for interstitial
        AdManager.onGameOver();
    }
}
