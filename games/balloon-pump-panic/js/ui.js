// Balloon Pump Panic - UI Scenes (Menu, GameOver, HUD)

class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        this.add.rectangle(W / 2, H / 2, W, H, COLORS.bg);
        this.add.rectangle(W / 2, H, W, H * 0.4, COLORS.bgBottom).setOrigin(0.5, 1);

        // Title
        const title1 = this.add.text(W / 2, H * 0.18, 'BALLOON', {
            fontSize: '42px', fontFamily: 'Arial Black, Arial', color: '#EF5350',
            stroke: '#C62828', strokeThickness: 4
        }).setOrigin(0.5);
        const title2 = this.add.text(W / 2, H * 0.25, 'PUMP PANIC', {
            fontSize: '36px', fontFamily: 'Arial Black, Arial', color: '#7E57C2',
            stroke: '#4A148C', strokeThickness: 3
        }).setOrigin(0.5);
        this.tweens.add({ targets: [title1, title2], scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

        // Decorative balloon
        const dBalloon = this.add.image(W / 2, H * 0.42, 'balloon').setScale(1.8);
        this.tweens.add({ targets: dBalloon, y: dBalloon.y - 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

        // Play button
        const playBg = this.add.rectangle(W / 2, H * 0.62, 180, 60, COLORS.uiAccent, 1).setInteractive({ useHandCursor: true });
        playBg.setStrokeStyle(3, 0x4A148C);
        const playTxt = this.add.text(W / 2, H * 0.62, 'PLAY', {
            fontSize: '30px', fontFamily: 'Arial Black, Arial', color: '#FFFFFF'
        }).setOrigin(0.5);
        playTxt.disableInteractive();
        playBg.on('pointerdown', () => {
            this.tweens.add({ targets: playBg, scaleX: 0.9, scaleY: 0.9, duration: 60, yoyo: true,
                onComplete: () => this.scene.start('GameScene')
            });
        });

        // High score
        const hs = loadStorage(STORAGE_KEYS.highScore, 0);
        this.add.text(W / 2, H * 0.72, 'BEST: ' + hs, {
            fontSize: '20px', fontFamily: 'Arial', color: '#546E7A'
        }).setOrigin(0.5);

        // Help button
        const helpBg = this.add.circle(44, 44, 22, COLORS.uiAccent).setInteractive({ useHandCursor: true });
        this.add.text(44, 44, '?', { fontSize: '26px', fontFamily: 'Arial Black', color: '#FFFFFF' }).setOrigin(0.5).disableInteractive();
        helpBg.on('pointerdown', () => {
            this.scene.pause();
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        });

        // Sound toggle
        const soundOn = loadStorage(STORAGE_KEYS.settings, { sound: true }).sound;
        const soundIcon = this.add.text(W - 44, 44, soundOn ? '🔊' : '🔇', { fontSize: '28px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        soundIcon.on('pointerdown', () => {
            const s = loadStorage(STORAGE_KEYS.settings, { sound: true });
            s.sound = !s.sound;
            saveStorage(STORAGE_KEYS.settings, s);
            soundIcon.setText(s.sound ? '🔊' : '🔇');
            this.sound.mute = !s.sound;
        });
    }
}

class HUDScene extends Phaser.Scene {
    constructor() { super('HUDScene'); }

    create() {
        const W = GAME_CONFIG.width;
        this.scoreText = this.add.text(16, 12, '0', {
            fontSize: '28px', fontFamily: 'Arial Black, Arial', color: '#263238',
            stroke: '#FFFFFF', strokeThickness: 2
        }).setDepth(10);

        this.stageText = this.add.text(W / 2, 16, 'Stage 1', {
            fontSize: '20px', fontFamily: 'Arial', color: '#546E7A'
        }).setOrigin(0.5, 0).setDepth(10);

        this.lifeIcons = [];
        for (let i = 0; i < GAME_CONFIG.lives; i++) {
            const icon = this.add.image(W - 30 - i * 28, 22, 'life').setScale(0.9).setDepth(10);
            this.lifeIcons.push(icon);
        }

        this.streakText = this.add.text(W / 2, 48, '', {
            fontSize: '24px', fontFamily: 'Arial Black, Arial', color: '#FFD600',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(10).setAlpha(0);

        this.zoneLabel = this.add.text(W / 2, GAME_CONFIG.height * 0.23, '', {
            fontSize: '24px', fontFamily: 'Arial Black', color: '#66BB6A',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setDepth(10).setAlpha(0);

        // Pause button
        const pauseBtn = this.add.rectangle(W - 28, GAME_CONFIG.height * 0.1 + 10, 44, 44, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(20);
        this.add.text(W - 28, GAME_CONFIG.height * 0.1 + 10, '⏸', { fontSize: '28px' }).setOrigin(0.5).setDepth(20).disableInteractive();
        pauseBtn.on('pointerdown', () => this.showPause());

        this.events.on('shutdown', () => this.scene.stop('HUDScene'));
    }

    updateScore(score) {
        this.scoreText.setText(score);
        Effects.scalePunch(this.scoreText, 1.3, 150);
    }

    updateStage(num) { this.stageText.setText('Stage ' + num); }

    updateLives(lives) {
        for (let i = 0; i < this.lifeIcons.length; i++) {
            if (i < lives) {
                this.lifeIcons[i].setTexture('life').setAlpha(1);
            } else {
                this.lifeIcons[i].setTexture('lifeEmpty').setAlpha(0.5);
            }
        }
    }

    loseLifeAnim(lives) {
        const idx = lives;
        if (idx >= 0 && idx < this.lifeIcons.length) {
            this.tweens.add({ targets: this.lifeIcons[idx], scaleX: 0, scaleY: 0, alpha: 0, duration: 300 });
        }
    }

    updateStreak(streak) {
        if (streak >= 2) {
            this.streakText.setText('x' + streak + ' STREAK!');
            this.streakText.setAlpha(1);
            this.streakText.setFontSize(Math.min(48, 24 + streak * 2));
            Effects.scalePunch(this.streakText, 1.15, 150);
        } else {
            if (this.streakText.alpha > 0) {
                this.tweens.add({ targets: this.streakText, alpha: 0, scaleX: 0.5, scaleY: 0.5, duration: 200 });
            }
        }
    }

    updateZone(label, inflation) {
        if (inflation < 50) {
            this.zoneLabel.setAlpha(0);
            return;
        }
        this.zoneLabel.setText(label);
        this.zoneLabel.setAlpha(1);
        if (inflation >= 95) {
            this.zoneLabel.setColor('#FFD600');
            this.zoneLabel.setFontSize('32px');
        } else if (inflation >= 70) {
            this.zoneLabel.setColor('#EF5350');
            this.zoneLabel.setFontSize('28px');
        } else {
            this.zoneLabel.setColor('#FF8A65');
            this.zoneLabel.setFontSize('24px');
        }
    }

    showPause() {
        const gs = this.scene.get('GameScene');
        if (gs && gs.scene.isActive()) gs.scene.pause();
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        this.pauseGroup = this.add.group();
        const overlay = this.add.rectangle(W/2, H/2, W, H, 0x263238, 0.7).setDepth(100).setInteractive();
        const resumeBtn = this.add.rectangle(W/2, H*0.35, 180, 50, COLORS.uiAccent).setDepth(101).setInteractive({useHandCursor:true});
        const resumeTxt = this.add.text(W/2, H*0.35, 'RESUME', {fontSize:'24px',fontFamily:'Arial Black',color:'#FFF'}).setOrigin(0.5).setDepth(102).disableInteractive();
        const helpBtn = this.add.rectangle(W/2, H*0.45, 180, 50, COLORS.uiAccent).setDepth(101).setInteractive({useHandCursor:true});
        const helpTxt = this.add.text(W/2, H*0.45, 'HOW TO PLAY', {fontSize:'20px',fontFamily:'Arial Black',color:'#FFF'}).setOrigin(0.5).setDepth(102).disableInteractive();
        const restartBtn = this.add.rectangle(W/2, H*0.55, 180, 50, 0x546E7A).setDepth(101).setInteractive({useHandCursor:true});
        const restartTxt = this.add.text(W/2, H*0.55, 'RESTART', {fontSize:'22px',fontFamily:'Arial Black',color:'#FFF'}).setOrigin(0.5).setDepth(102).disableInteractive();
        const quitBtn = this.add.text(W/2, H*0.65, 'QUIT', {fontSize:'18px',fontFamily:'Arial',color:'#90A4AE'}).setOrigin(0.5).setDepth(101).setInteractive({useHandCursor:true});
        this.pauseGroup.addMultiple([overlay,resumeBtn,resumeTxt,helpBtn,helpTxt,restartBtn,restartTxt,quitBtn]);
        resumeBtn.on('pointerdown', () => this.hidePause());
        helpBtn.on('pointerdown', () => { this.scene.launch('HelpScene', {returnTo:'HUDScene'}); });
        restartBtn.on('pointerdown', () => { this.hidePause(); this.scene.get('GameScene').scene.restart(); });
        quitBtn.on('pointerdown', () => { this.hidePause(); this.scene.stop('GameScene'); this.scene.stop('HUDScene'); this.scene.start('MenuScene'); });
    }

    hidePause() {
        if (this.pauseGroup) { this.pauseGroup.destroy(true); this.pauseGroup = null; }
        const gs = this.scene.get('GameScene');
        if (gs) gs.scene.resume();
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    init(data) { this.finalScore = data.score || 0; this.stageReached = data.stage || 1; this.balloonsPopped = data.popped || 0; this.fromScene = data.fromScene || 'GameScene'; }

    create() {
        const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
        this.add.rectangle(W/2, H/2, W, H, 0x263238, 0.85).setDepth(0);

        this.add.text(W/2, H*0.15, 'GAME OVER', {
            fontSize:'40px', fontFamily:'Arial Black', color:'#EF5350', stroke:'#C62828', strokeThickness:3
        }).setOrigin(0.5);

        // Animated score count-up
        const scoreDisp = this.add.text(W/2, H*0.3, '0', {
            fontSize:'56px', fontFamily:'Arial Black', color:'#FFFFFF', stroke:'#000', strokeThickness:3
        }).setOrigin(0.5);
        this.tweens.addCounter({
            from: 0, to: this.finalScore, duration: 800, ease: 'Quad.Out',
            onUpdate: (t) => scoreDisp.setText(Math.floor(t.getValue()))
        });

        // High score check
        const prevBest = loadStorage(STORAGE_KEYS.highScore, 0);
        if (this.finalScore > prevBest) {
            saveStorage(STORAGE_KEYS.highScore, this.finalScore);
            const nb = this.add.text(W/2, H*0.39, 'NEW BEST!', {
                fontSize:'28px', fontFamily:'Arial Black', color:'#FFD600', stroke:'#000', strokeThickness:2
            }).setOrigin(0.5);
            this.tweens.add({ targets: nb, scaleX: 1.15, scaleY: 1.15, duration: 500, yoyo: true, repeat: -1 });
            Effects.popEffect(this, W/2, H*0.35, 0);
        }

        this.add.text(W/2, H*0.46, 'Stage ' + this.stageReached, { fontSize:'22px', fontFamily:'Arial', color:'#90A4AE' }).setOrigin(0.5);
        this.add.text(W/2, H*0.52, this.balloonsPopped + ' Popped!', { fontSize:'18px', fontFamily:'Arial', color:'#90A4AE' }).setOrigin(0.5);

        // Continue ad button
        if (AdManager.canShowContinue()) {
            const contBg = this.add.rectangle(W/2, H*0.62, 220, 50, COLORS.success).setInteractive({useHandCursor:true});
            contBg.setStrokeStyle(2, 0x388E3C);
            this.add.text(W/2, H*0.62, '+1 Life (Ad)', { fontSize:'20px', fontFamily:'Arial Black', color:'#FFF' }).setOrigin(0.5).disableInteractive();
            contBg.on('pointerdown', () => {
                AdManager.showRewarded(() => {
                    this.scene.stop();
                    this.scene.get('GameScene').continueWithLife();
                });
            });
        }

        // Play Again
        const playBg = this.add.rectangle(W/2, H*0.74, 180, 54, COLORS.uiAccent).setInteractive({useHandCursor:true});
        playBg.setStrokeStyle(2, 0x4A148C);
        this.add.text(W/2, H*0.74, 'PLAY AGAIN', { fontSize:'24px', fontFamily:'Arial Black', color:'#FFF' }).setOrigin(0.5).disableInteractive();
        playBg.on('pointerdown', () => {
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('GameScene');
        });

        // Menu
        const menuBg = this.add.rectangle(W/2, H*0.84, 120, 44, 0x546E7A).setInteractive({useHandCursor:true});
        this.add.text(W/2, H*0.84, 'MENU', { fontSize:'20px', fontFamily:'Arial Black', color:'#FFF' }).setOrigin(0.5).disableInteractive();
        menuBg.on('pointerdown', () => {
            this.scene.stop('HUDScene');
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MenuScene');
        });

        // Track stats
        const gp = loadStorage(STORAGE_KEYS.gamesPlayed, 0);
        saveStorage(STORAGE_KEYS.gamesPlayed, gp + 1);
        const hs = loadStorage(STORAGE_KEYS.highestStage, 0);
        if (this.stageReached > hs) saveStorage(STORAGE_KEYS.highestStage, this.stageReached);
        const tp = loadStorage(STORAGE_KEYS.totalPopped, 0);
        saveStorage(STORAGE_KEYS.totalPopped, tp + this.balloonsPopped);

        AdManager.onGameOver();
    }
}
