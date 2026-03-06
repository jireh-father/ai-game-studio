// ui.js - MenuScene, UIScene (HUD), GameOverScene, Pause overlay
var MenuScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function MenuScene() {
        Phaser.Scene.call(this, { key: 'MenuScene' });
    },
    create: function() {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        var cx = DIMENSIONS.WIDTH / 2;

        // Title
        this.add.text(cx, 100, 'SABOTAGE', {
            fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setOrigin(0.5);
        this.add.text(cx, 145, 'CHEF', {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER
        }).setOrigin(0.5);

        // Decorative judge patrol
        this.menuJudge = this.add.image(cx, 240, 'judge').setDisplaySize(50, 75);
        this.menuJudgeDir = 1;
        this.menuCone = this.add.triangle(cx, 300, 0, -30, -40, 30, 40, 30, 0xFF4444, 0.2).setDepth(1);

        // Play button
        var playBtn = this.add.rectangle(cx, 350, 200, 60, 0x00E676, 1).setInteractive({ useHandCursor: true });
        playBtn.setStrokeStyle(2, 0x00C853);
        this.add.text(cx, 350, 'PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(1);
        playBtn.on('pointerdown', function() { this.scene.start('GameScene'); }, this);
        playBtn.on('pointerover', function() { playBtn.setScale(1.05); });
        playBtn.on('pointerout', function() { playBtn.setScale(1); });

        // High score
        var hs = GameState.highScore || 0;
        this.add.text(cx, 420, 'BEST: ' + hs, {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
        }).setOrigin(0.5);

        // Help button
        var helpBtn = this.add.circle(40, 40, 22, 0xFFD700).setInteractive({ useHandCursor: true }).setDepth(2);
        this.add.text(40, 40, '?', {
            fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5).setDepth(3);
        helpBtn.on('pointerdown', function() { this.scene.start('HelpScene', { from: 'MenuScene' }); }, this);

        // Sound toggle
        var soundOn = GameState.settings.sound;
        var soundTxt = this.add.text(DIMENSIONS.WIDTH - 40, DIMENSIONS.HEIGHT - 40,
            soundOn ? 'SND' : 'MUTE', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
        soundTxt.on('pointerdown', function() {
            GameState.settings.sound = !GameState.settings.sound;
            soundTxt.setText(GameState.settings.sound ? 'SND' : 'MUTE');
            saveSettings();
        });

        this.add.text(cx, 470, 'Sneak sabotage past the Judge!', {
            fontSize: '14px', fontFamily: 'Arial', color: '#888888' }).setOrigin(0.5);
    },
    update: function(time, delta) {
        if (!this.menuJudge) return;
        this.menuJudge.x += this.menuJudgeDir * 0.5;
        this.menuCone.x = this.menuJudge.x;
        if (this.menuJudge.x > 300) this.menuJudgeDir = -1;
        if (this.menuJudge.x < 60) this.menuJudgeDir = 1;
        this.menuJudge.setFlipX(this.menuJudgeDir < 0);
    }
});

// UIScene - HUD overlay running parallel to GameScene
var UIScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function UIScene() {
        Phaser.Scene.call(this, { key: 'UIScene' });
    },
    create: function() {
        this.gameScene = this.scene.get('GameScene');
        if (!this.gameScene || !this.gameScene.state) return;
        var gs = this.gameScene.state;

        // HUD bg
        this.add.rectangle(DIMENSIONS.WIDTH / 2, DIMENSIONS.HUD_H / 2, DIMENSIONS.WIDTH, DIMENSIONS.HUD_H, 0xFFF8E7, 0.9).setDepth(50);

        this.scoreText = this.add.text(10, 14, '' + gs.score, {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setDepth(51);

        this.dishText = this.add.text(DIMENSIONS.WIDTH / 2 - 30, 14, 'Dish #' + gs.stage, {
            fontSize: '16px', fontFamily: 'Arial', color: COLORS.HUD_TEXT
        }).setDepth(51);

        this.comboText = this.add.text(DIMENSIONS.WIDTH / 2 + 40, 14, '', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
        }).setDepth(51);

        // Lives
        this.lifeIcons = [];
        for (var i = 0; i < 3; i++) {
            var lx = DIMENSIONS.WIDTH - 30 - i * 24;
            var icon = this.add.image(lx, 25, gs.lives > i ? 'chef_hat' : 'chef_hat_empty')
                .setDisplaySize(20, 20).setDepth(51);
            this.lifeIcons.push(icon);
        }

        // Pause button
        var pauseBtn = this.add.text(DIMENSIONS.WIDTH - 20, DIMENSIONS.HEIGHT - 35, '||', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.HUD_TEXT
        }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });
        pauseBtn.on('pointerdown', this.showPause, this);

        // Pause overlay container
        this.pauseGroup = this.add.container(0, 0).setDepth(100).setVisible(false);

        // Listen to events from GameScene
        var self = this;
        this.gameScene.events.on('scoreUpdate', function() { if (self.gameScene) self.refreshScore(); });
        this.gameScene.events.on('comboUpdate', function() { if (self.gameScene) self.refreshCombo(); });
        this.gameScene.events.on('livesUpdate', function() { if (self.gameScene) self.refreshLives(); });
        this.gameScene.events.on('stageUpdate', function() { if (self.gameScene) self.refreshStage(); });

        this.events.on('shutdown', function() {
            if (self.gameScene && self.gameScene.events) {
                self.gameScene.events.off('scoreUpdate');
                self.gameScene.events.off('comboUpdate');
                self.gameScene.events.off('livesUpdate');
                self.gameScene.events.off('stageUpdate');
            }
        });
    },

    refreshScore: function() {
        if (!this.gameScene || !this.gameScene.state) return;
        this.scoreText.setText('' + this.gameScene.state.score);
        this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 75, yoyo: true });
    },
    refreshCombo: function() {
        if (!this.gameScene || !this.gameScene.state) return;
        var c = this.gameScene.state.combo;
        this.comboText.setText(c > 0 ? 'x' + c : '');
        if (c > 0) {
            this.tweens.add({ targets: this.comboText, scaleX: 1.8, scaleY: 1.8, duration: 100, yoyo: true });
        }
    },
    refreshLives: function() {
        if (!this.gameScene || !this.gameScene.state) return;
        for (var i = 0; i < 3; i++) {
            this.lifeIcons[i].setTexture(this.gameScene.state.lives > i ? 'chef_hat' : 'chef_hat_empty');
        }
    },
    refreshStage: function() {
        if (!this.gameScene || !this.gameScene.state) return;
        this.dishText.setText('Dish #' + this.gameScene.state.stage);
    },

    showPause: function() {
        if (!this.gameScene || this.gameScene.state.gameOver) return;
        this.gameScene.state.paused = true;
        this.gameScene.scene.pause();
        this.pauseGroup.removeAll(true);

        var bg = this.add.rectangle(DIMENSIONS.WIDTH / 2, DIMENSIONS.HEIGHT / 2, DIMENSIONS.WIDTH, DIMENSIONS.HEIGHT, 0x000000, 0.6);
        this.pauseGroup.add(bg);

        var title = this.add.text(DIMENSIONS.WIDTH / 2, 180, 'PAUSED', {
            fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        this.pauseGroup.add(title);

        var self = this;
        var btns = [
            { label: 'RESUME', color: 0x00E676, y: 260, fn: function() { self.hidePause(); } },
            { label: 'HOW TO PLAY', color: 0xFFD700, y: 325, fn: function() {
                self.hidePause();
                self.scene.launch('HelpScene', { from: 'UIScene' });
            }},
            { label: 'RESTART', color: 0xFF4444, y: 390, fn: function() {
                self.hidePause();
                self.gameScene.scene.stop();
                self.scene.stop();
                self.scene.start('GameScene');
            }},
            { label: 'MENU', color: 0x888888, y: 455, fn: function() {
                self.hidePause();
                self.gameScene.scene.stop();
                self.scene.stop();
                self.scene.start('MenuScene');
            }}
        ];

        btns.forEach(function(b) {
            var btn = self.add.rectangle(DIMENSIONS.WIDTH / 2, b.y, 180, 50, b.color).setInteractive({ useHandCursor: true });
            var txt = self.add.text(DIMENSIONS.WIDTH / 2, b.y, b.label, {
                fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
            }).setOrigin(0.5);
            btn.on('pointerdown', b.fn);
            self.pauseGroup.add(btn);
            self.pauseGroup.add(txt);
        });

        this.pauseGroup.setVisible(true);
    },

    hidePause: function() {
        this.pauseGroup.setVisible(false);
        if (this.gameScene) {
            this.gameScene.state.paused = false;
            this.gameScene.scene.resume();
        }
    }
});

// GameOverScene
var GameOverScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function GameOverScene() {
        Phaser.Scene.call(this, { key: 'GameOverScene' });
    },
    create: function(data) {
        this.cameras.main.setBackgroundColor('#000000');
        var cx = DIMENSIONS.WIDTH / 2;
        var d = data || { score: 0, dishes: 0, bestCombo: 0, totalSabotages: 0 };

        // Stop UI scene
        this.scene.stop('UIScene');

        // Update high score
        var isNewHigh = d.score > (GameState.highScore || 0);
        if (isNewHigh) {
            GameState.highScore = d.score;
            try { localStorage.setItem('sabotage_chef_high_score', d.score); } catch(e) {}
        }
        GameState.gamesPlayed = (GameState.gamesPlayed || 0) + 1;
        try { localStorage.setItem('sabotage_chef_games_played', GameState.gamesPlayed); } catch(e) {}

        this.add.text(cx, 70, 'GAME OVER', {
            fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.DANGER
        }).setOrigin(0.5);

        var scoreTxt = this.add.text(cx, 130, '' + d.score, {
            fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
        }).setOrigin(0.5);
        this.tweens.add({ targets: scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true });

        if (isNewHigh) {
            this.add.text(cx, 175, 'NEW RECORD!', {
                fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.COMBO_GOLD
            }).setOrigin(0.5);
        }

        this.add.text(cx, 210, 'Dishes: ' + d.dishes, {
            fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF'
        }).setOrigin(0.5);
        this.add.text(cx, 240, 'Best Combo: x' + d.bestCombo, {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.SUCCESS
        }).setOrigin(0.5);
        this.add.text(cx, 270, d.totalSabotages + ' sneaky!', {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.SABOTAGE_TINT
        }).setOrigin(0.5);

        // Continue (ad placeholder)
        if (AdManager.canContinue()) {
            var contBtn = this.add.rectangle(cx, 330, 220, 50, 0xFFD700).setInteractive({ useHandCursor: true });
            this.add.text(cx, 330, 'CONTINUE (AD)', {
                fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
            }).setOrigin(0.5);
            var self = this;
            contBtn.on('pointerdown', function() {
                AdManager.showRewarded('continue', function() {
                    // Resume game with 1 life
                    var gameScene = self.scene.get('GameScene');
                    if (gameScene && gameScene.state) {
                        gameScene.state.lives = 1;
                        gameScene.state.gameOver = false;
                        gameScene.state.recipeTimeLeft = gameScene.state.recipeTimeMax;
                        gameScene.events.emit('livesUpdate');
                    }
                    self.scene.stop('GameOverScene');
                    self.scene.launch('UIScene');
                    self.scene.resume('GameScene');
                });
            });
        }

        // Play again
        var playBtn = this.add.rectangle(cx, 400, 200, 55, 0x00E676).setInteractive({ useHandCursor: true });
        this.add.text(cx, 400, 'PLAY AGAIN', {
            fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        playBtn.on('pointerdown', function() {
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        }, this);

        // Menu
        var menuBtn = this.add.rectangle(cx, 465, 120, 40, 0x888888).setInteractive({ useHandCursor: true });
        this.add.text(cx, 465, 'MENU', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
        }).setOrigin(0.5);
        menuBtn.on('pointerdown', function() {
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        }, this);

        // High score
        this.add.text(cx, 520, 'BEST: ' + (GameState.highScore || 0), {
            fontSize: '16px', fontFamily: 'Arial', color: COLORS.COMBO_GOLD
        }).setOrigin(0.5);
    }
});

function saveSettings() {
    try {
        localStorage.setItem('sabotage_chef_settings', JSON.stringify(GameState.settings));
    } catch(e) {}
}
