// Voltage Rush - UI Scenes (Menu, GameOver, Pause)
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        var w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w/2, h/2, w, h, COLORS.bg);

        // Animated background nodes
        this.bgNodes = [];
        for (var i = 0; i < 6; i++) {
            var nx = 60 + Math.random() * (w - 120);
            var ny = 200 + Math.random() * 280;
            var g = this.add.graphics();
            g.lineStyle(1, COLORS.nodeIdle, 0.15);
            g.strokeCircle(nx, ny, 22);
            g.fillStyle(COLORS.nodeIdle, 0.08);
            g.fillCircle(nx, ny, 10);
            this.tweens.add({
                targets: g, alpha: 0.3, duration: 1500 + Math.random() * 1000,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        // Title
        var title = this.add.text(w/2, 120, 'VOLTAGE RUSH', {
            fontSize: '36px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: title, alpha: 0.7, duration: 1200, yoyo: true, repeat: -1
        });

        // Lightning bolt icon
        this.add.text(w/2, 75, '\u26A1', {
            fontSize: '40px', fontFamily: 'Arial', fill: '#00AAFF'
        }).setOrigin(0.5);

        // High score
        GameState.loadHighScore();
        if (GameState.highScore > 0) {
            this.add.text(w/2, 165, 'HIGH SCORE: ' + GameState.highScore, {
                fontSize: '18px', fontFamily: 'Arial', fill: '#FFD700'
            }).setOrigin(0.5);
        }

        // Play button
        var playBtn = this.add.rectangle(w/2, 280, 240, 60, 0x00AAFF, 0.15)
            .setStrokeStyle(2, 0x00AAFF).setInteractive({ useHandCursor: true });
        this.add.text(w/2, 280, 'PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive().on('pointerdown', function() {
            playBtn.emit('pointerdown');
        });

        playBtn.on('pointerdown', function() {
            GameState.reset();
            GameState.continueUsed = false;
            Ads.reset();
            this.cameras.main.flash(300, 0, 170, 255, true);
            this.time.delayedCall(200, function() {
                this.scene.start('GameScene');
            }, [], this);
        }, this);

        // Help button
        var helpBtn = this.add.circle(60, h - 60, 24, 0x00AAFF, 0.15)
            .setStrokeStyle(2, 0x00AAFF).setInteractive({ useHandCursor: true });
        this.add.text(60, h - 60, '?', {
            fontSize: '24px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        }).setOrigin(0.5);
        helpBtn.on('pointerdown', function() {
            this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
        }, this);

        // Sound toggle
        var soundLabel = GameState.soundOn ? 'SOUND: ON' : 'SOUND: OFF';
        var soundBtn = this.add.rectangle(w/2, h - 60, 140, 44, 0x0D0D1F, 0.8)
            .setStrokeStyle(1, 0x444455).setInteractive({ useHandCursor: true });
        var soundText = this.add.text(w/2, h - 60, soundLabel, {
            fontSize: '16px', fontFamily: 'Arial', fill: '#888888'
        }).setOrigin(0.5);
        soundBtn.on('pointerdown', function() {
            GameState.soundOn = !GameState.soundOn;
            soundText.setText(GameState.soundOn ? 'SOUND: ON' : 'SOUND: OFF');
        });
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.finalScore = data.score || 0;
        this.finalStage = data.stage || 1;
    }

    create() {
        var w = GAME_WIDTH, h = GAME_HEIGHT;
        this.add.rectangle(w/2, h/2, w, h, COLORS.bg);

        Ads.onGameOver();

        // Title
        var overTitle = this.add.text(w/2, 80, 'CIRCUIT OVERLOAD', {
            fontSize: '30px', fontFamily: 'Arial', fill: '#FF3300', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: overTitle, alpha: 0.5, duration: 400, yoyo: true, repeat: -1
        });
        this.add.text(w/2, 50, '\u26A1', {
            fontSize: '36px', fontFamily: 'Arial', fill: '#FF3300'
        }).setOrigin(0.5);

        // Score count-up
        var scoreObj = { val: 0 };
        var scoreText = this.add.text(w/2, 160, '0', {
            fontSize: '48px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: scoreObj, val: this.finalScore, duration: 800, ease: 'Cubic.easeOut',
            onUpdate: function() { scoreText.setText(Math.floor(scoreObj.val)); }
        });

        // High score check
        var isNewHigh = GameState.saveHighScore();
        if (isNewHigh) {
            var hsText = this.add.text(w/2, 210, 'NEW HIGH SCORE!', {
                fontSize: '20px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
            }).setOrigin(0.5);
            this.tweens.add({
                targets: hsText, scaleX: 1.15, scaleY: 1.15, duration: 500,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
            // Gold particles
            for (var i = 0; i < 12; i++) {
                var angle = (i / 12) * Math.PI * 2;
                var px = w/2 + Math.cos(angle) * 5;
                var py = 210 + Math.sin(angle) * 5;
                var p = this.add.circle(px, py, 3, COLORS.gold);
                this.tweens.add({
                    targets: p, x: px + Math.cos(angle) * 80, y: py + Math.sin(angle) * 80,
                    alpha: 0, duration: 800, delay: 400, ease: 'Cubic.easeOut'
                });
            }
        }

        this.add.text(w/2, 245, 'Stage Reached: ' + this.finalStage, {
            fontSize: '18px', fontFamily: 'Arial', fill: '#888888'
        }).setOrigin(0.5);

        // Buttons
        var btnY = 320;

        // Continue (rewarded ad) - once per session
        if (Ads.canContinue()) {
            var contBtn = this.add.rectangle(w/2, btnY, 240, 50, 0xFFAA00, 0.2)
                .setStrokeStyle(2, 0xFFAA00).setInteractive({ useHandCursor: true });
            this.add.text(w/2, btnY, 'CONTINUE (AD)', {
                fontSize: '20px', fontFamily: 'Arial', fill: '#FFAA00', fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive().on('pointerdown', function() { contBtn.emit('pointerdown'); });
            contBtn.on('pointerdown', function() {
                var self = this;
                Ads.showRewarded(function() {
                    self.scene.stop('GameOverScene');
                    self.scene.start('GameScene', { continuing: true });
                });
            }, this);
            btnY += 65;
        }

        // Play again
        var playBtn = this.add.rectangle(w/2, btnY, 240, 50, 0x00AAFF, 0.2)
            .setStrokeStyle(2, 0x00AAFF).setInteractive({ useHandCursor: true });
        this.add.text(w/2, btnY, 'PLAY AGAIN', {
            fontSize: '20px', fontFamily: 'Arial', fill: '#00AAFF', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive().on('pointerdown', function() { playBtn.emit('pointerdown'); });
        playBtn.on('pointerdown', function() {
            GameState.reset();
            this.scene.stop('GameOverScene');
            this.scene.start('GameScene');
        }, this);

        btnY += 65;

        // Menu
        var menuBtn = this.add.rectangle(w/2, btnY, 240, 50, 0x0D0D1F, 0.5)
            .setStrokeStyle(1, 0x444455).setInteractive({ useHandCursor: true });
        this.add.text(w/2, btnY, 'MENU', {
            fontSize: '20px', fontFamily: 'Arial', fill: '#888888'
        }).setOrigin(0.5).setInteractive().on('pointerdown', function() { menuBtn.emit('pointerdown'); });
        menuBtn.on('pointerdown', function() {
            this.scene.stop('GameOverScene');
            this.scene.start('MenuScene');
        }, this);

        // Interstitial check
        if (Ads.shouldShowInterstitial()) {
            Ads.showInterstitial();
        }
    }
}
