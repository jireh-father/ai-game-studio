// ui.js - MenuScene, GameOverScene, GameHUD, GamePause, GameJuice helpers

class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        var w = GAME.WIDTH, h = GAME.HEIGHT;
        var bg = this.add.graphics();
        bg.fillGradientStyle(0x0D1B2A, 0x0D1B2A, 0x1B3A4B, 0x1B3A4B, 1);
        bg.fillRect(0, 0, w, h);

        this.add.text(w / 2, 180, 'TRUST FALL', {
            fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT,
            shadow: { offsetX: 0, offsetY: 0, blur: 12, color: '#4FC3F788', fill: true }
        }).setOrigin(0.5);

        this.cA = this.add.image(w / 2 - 50, 280, 'charA').setScale(1.3);
        this.cB = this.add.image(w / 2 + 50, 280, 'charB').setScale(1.3);
        this.tGfx = this.add.graphics();
        this.tweens.add({ targets: [this.cA, this.cB], y: 286, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        var pt = this.add.text(w / 2, 400, 'TAP TO PLAY', {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT
        }).setOrigin(0.5);
        this.tweens.add({ targets: pt, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1 });

        this.add.text(w / 2, 460, 'BEST: ' + (GameState.highScore || 0), {
            fontSize: '18px', fontFamily: 'Arial', color: COLORS.SUBTITLE
        }).setOrigin(0.5);

        var hb = this.add.circle(50, h - 50, 22, 0x000000, 0).setStrokeStyle(2, 0xFFFFFF).setInteractive({ useHandCursor: true });
        this.add.text(50, h - 50, '?', { fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT }).setOrigin(0.5).disableInteractive();
        hb.on('pointerdown', function() { this.scene.start('HelpScene', { returnTo: 'MenuScene' }); }, this);

        this.input.on('pointerdown', function(p) {
            if (Math.sqrt((p.x - 50) * (p.x - 50) + (p.y - (h - 50)) * (p.y - (h - 50))) < 30) return;
            this.scene.start('GameScene');
        }, this);
    }

    update() {
        if (!this.cA) return;
        this.tGfx.clear(); this.tGfx.lineStyle(2, 0xE0E0E0, 0.7);
        this.tGfx.lineBetween(this.cA.x + 20, this.cA.y, this.cB.x - 20, this.cB.y);
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOverScene' }); }
    init(d) { this.fs = (d && d.score) || 0; this.sr = (d && d.stage) || 1; this.bc = (d && d.bestCombo) || 0; }

    create() {
        var w = GAME.WIDTH, self = this;
        this.add.rectangle(w / 2, GAME.HEIGHT / 2, w, GAME.HEIGHT, 0x000000, 0.8);
        this.add.text(w / 2, 120, 'GAME OVER', { fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT }).setOrigin(0.5);

        var sd = { val: 0 };
        var st = this.add.text(w / 2, 200, '0', { fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.REWARD }).setOrigin(0.5);
        this.tweens.add({ targets: sd, val: this.fs, duration: 1000, ease: 'Power2', onUpdate: function() { st.setText(Math.floor(sd.val)); } });

        if (this.fs > (GameState.highScore || 0)) {
            GameState.highScore = this.fs; localStorage.setItem('trust_fall_high_score', this.fs);
            var nb = this.add.text(w / 2, 250, 'NEW BEST!', { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD }).setOrigin(0.5);
            this.tweens.add({ targets: nb, scaleX: 1.1, scaleY: 1.1, duration: 500, yoyo: true, repeat: -1 });
        }
        this.add.text(w / 2, 280, 'Stage ' + this.sr, { fontSize: '20px', fontFamily: 'Arial', color: COLORS.UI_TEXT }).setOrigin(0.5);
        this.add.text(w / 2, 310, 'Best Combo: ' + this.bc + 'x', { fontSize: '18px', fontFamily: 'Arial', color: COLORS.SUBTITLE }).setOrigin(0.5);

        GameState.gamesPlayed = (GameState.gamesPlayed || 0) + 1;
        localStorage.setItem('trust_fall_games_played', GameState.gamesPlayed);
        if (this.sr > (GameState.highestStage || 0)) { GameState.highestStage = this.sr; localStorage.setItem('trust_fall_highest_stage', this.sr); }

        if (AdManager.canContinue()) {
            this._btn(w / 2, 400, 220, 50, 'CONTINUE (AD)', 0xFFB74D, function() {
                AdManager.showRewarded('continue', function() { self.scene.start('GameScene', { continueData: { score: self.fs, stage: self.sr, combo: 0 } }); });
            });
        }
        this._btn(w / 2, 470, 220, 50, 'PLAY AGAIN', 0x4FC3F7, function() { AdManager.reset(); self.scene.start('GameScene'); });
        this._btn(w / 2, 540, 220, 50, 'MENU', 0x546E7A, function() { AdManager.reset(); AdManager.showInterstitial(function() { self.scene.start('MenuScene'); }); });
    }

    _btn(x, y, bw, bh, label, col, cb) {
        var b = this.add.rectangle(x, y, bw, bh, col).setInteractive({ useHandCursor: true });
        this.add.text(x, y, label, { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT }).setOrigin(0.5).disableInteractive();
        b.on('pointerdown', cb, this);
    }
}

// --- HUD helper (operates on GameScene instance) ---
var GameHUD = {
    create: function(s) {
        s.scoreText = s.add.text(16, 16, '' + s.score, { fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT }).setDepth(60);
        s.stageText = s.add.text(GAME.WIDTH / 2, 16, 'Stage ' + s.currentStage, { fontSize: '20px', fontFamily: 'Arial', color: COLORS.UI_TEXT }).setOrigin(0.5, 0).setDepth(60);
        s.pauseBtn = s.add.image(GAME.WIDTH - 38, 24, 'pauseIcon')
            .setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-14, -14, 52, 52), hitAreaCallback: Phaser.Geom.Rectangle.Contains }).setDepth(60);
        s.pauseBtn.on('pointerdown', s.togglePause, s);
        s.comboText = s.add.text(GAME.WIDTH / 2, 60, '', { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.REWARD }).setOrigin(0.5).setDepth(60).setAlpha(0);
        s.heartIcons = [];
        this.updateLives(s);
    },
    updateScore: function(s) {
        if (s.scoreText) { s.scoreText.setText('' + s.score); JuiceEffects.scalePunch(s, s.scoreText, 1.4); }
    },
    updateStage: function(s) { if (s.stageText) s.stageText.setText('Stage ' + s.currentStage); },
    updateLives: function(s) {
        for (var i = 0; i < s.heartIcons.length; i++) s.heartIcons[i].destroy();
        s.heartIcons = [];
        var total = Math.max(s.lives, TIMING.LIVES_START);
        var sx = GAME.WIDTH / 2 - (total - 1) * 16;
        for (var j = 0; j < total; j++) {
            s.heartIcons.push(s.add.image(sx + j * 32, GAME.LIVES_Y, j < s.lives ? 'heartFull' : 'heartEmpty').setDepth(60));
        }
    },
    showCombo: function(s) {
        if (s.combo > 0) {
            var sz = Math.min(28 + Math.floor(s.combo / 5) * 2, 36);
            s.comboText.setText('x' + s.combo + ' COMBO!').setFontSize(sz + 'px').setColor(s.combo >= 15 ? COLORS.GOLD : COLORS.REWARD).setAlpha(1);
            JuiceEffects.scalePunch(s, s.comboText, 1.3, 100);
            if (s.comboFadeTimer) s.comboFadeTimer.remove();
            s.comboFadeTimer = s.time.delayedCall(TIMING.COMBO_FADE_DELAY, function() {
                s.tweens.add({ targets: s.comboText, alpha: 0, duration: 300 });
            });
        } else { s.comboText.setAlpha(0); }
    }
};

// --- Pause overlay helper ---
var GamePause = {
    show: function(s) {
        var w = GAME.WIDTH, h = GAME.HEIGHT;
        s.pauseGroup = [];
        var bg = s.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8).setDepth(80).setInteractive();
        s.pauseGroup.push(bg);
        s.pauseGroup.push(s.add.text(w / 2, 200, 'PAUSED', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT }).setOrigin(0.5).setDepth(81));
        var defs = [
            { l: 'RESUME', y: 300, c: 0x4FC3F7, f: function() { s.togglePause(); } },
            { l: 'HOW TO PLAY', y: 370, c: 0x546E7A, f: function() { GamePause.hide(s); s.scene.start('HelpScene', { returnTo: 'GameScene' }); } },
            { l: 'RESTART', y: 440, c: 0x546E7A, f: function() { GamePause.hide(s); s.scene.restart(); } },
            { l: 'QUIT', y: 510, c: 0xEF5350, f: function() { GamePause.hide(s); s.scene.start('MenuScene'); } }
        ];
        for (var i = 0; i < defs.length; i++) {
            var d = defs[i];
            var r = s.add.rectangle(w / 2, d.y, 200, 50, d.c).setDepth(81).setInteractive({ useHandCursor: true });
            var t = s.add.text(w / 2, d.y, d.l, { fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT }).setOrigin(0.5).setDepth(82);
            t.disableInteractive(); r.on('pointerdown', d.f);
            s.pauseGroup.push(r, t);
        }
    },
    hide: function(s) {
        if (s.pauseGroup) { for (var i = 0; i < s.pauseGroup.length; i++) s.pauseGroup[i].destroy(); s.pauseGroup = null; }
        s.isPaused = false;
    }
};

// --- Juice effects for GameScene ---
var GameJuice = {
    doJump: function(s) {
        var dur = JUMP.DURATION / 2, jA = s.currentJumpA, jB = s.currentJumpB;
        s.tweens.add({ targets: s.charA, scaleY: 0.7, scaleX: 1.15, duration: 60 });
        s.tweens.add({ targets: s.charB, scaleY: 0.7, scaleX: 1.15, duration: 60 });
        s.tweens.add({ targets: s.charA, x: s.charA.baseX - jA, y: s.charA.baseY - jA, duration: dur, ease: 'Quad.easeOut',
            onComplete: function() { s.tweens.add({ targets: s.charA, x: s.charA.baseX, y: s.charA.baseY, duration: dur, ease: 'Quad.easeIn' }); } });
        s.tweens.add({ targets: s.charB, x: s.charB.baseX + jB, y: s.charB.baseY - jB, duration: dur, ease: 'Quad.easeOut',
            onComplete: function() { s.tweens.add({ targets: s.charB, x: s.charB.baseX, y: s.charB.baseY, duration: dur, ease: 'Quad.easeIn' }); } });
        s.time.delayedCall(dur - 20, function() {
            if (!s.charA) return;
            s.tweens.add({ targets: s.charA, scaleY: 1.2, scaleX: 0.85, duration: dur });
            s.tweens.add({ targets: s.charB, scaleY: 1.2, scaleX: 0.85, duration: dur });
        });
        s.time.delayedCall(JUMP.DURATION, function() {
            if (s.isGameOver) return;
            s.tweens.add({ targets: s.charA, scaleY: 0.8, scaleX: 1.15, duration: 80, yoyo: true });
            s.tweens.add({ targets: s.charB, scaleY: 0.8, scaleX: 1.15, duration: 80, yoyo: true });
            s.time.delayedCall(100, function() {
                if (s.charA) { s.charA.setScale(1); s.charB.setScale(1); }
                s.isJumping = false;
                if (s.bufferedInput) { s.bufferedInput = false; s.handleTap(); }
            });
        });
        s.threadWidth = 4;
        s.tweens.add({ targets: s, threadWidth: 2, duration: 200, delay: 50 });
        JuiceEffects.burstParticles(s, s.charA.x, s.charA.baseY, COLORS_HEX.CHAR_A, 8);
        JuiceEffects.burstParticles(s, s.charB.x, s.charB.baseY, COLORS_HEX.CHAR_B, 8);
        s.cameras.main.shake(80, 0.005);
        if (navigator.vibrate && GameState.settings.vibration) navigator.vibrate(15);
    },
    onDodge: function(s, obs, isPerfect) {
        s.threadAlpha = 1.0; s.tweens.add({ targets: s, threadAlpha: 0.8, duration: 300 });
        s.threadWidth = 5; s.tweens.add({ targets: s, threadWidth: 2, duration: 200, delay: 100 });
        JuiceEffects.burstParticles(s, obs.x, obs.y, COLORS_HEX.REWARD, 12);
        s.cameras.main.setZoom(1.02);
        s.tweens.add({ targets: s.cameras.main, zoom: 1.0, duration: 200 });
        if (isPerfect) {
            var pt = s.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, 'PERFECT!', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD }).setOrigin(0.5).setDepth(70).setScale(0);
            s.tweens.add({ targets: pt, scaleX: 1.3, scaleY: 1.3, duration: 150, onComplete: function() {
                s.tweens.add({ targets: pt, scaleX: 1, scaleY: 1, duration: 100, onComplete: function() {
                    s.tweens.add({ targets: pt, alpha: 0, duration: 400, onComplete: function() { pt.destroy(); } });
                }});
            }});
            JuiceEffects.burstParticles(s, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, COLORS_HEX.GOLD, 20);
        }
    },
    onHit: function(s, ch, obs) {
        ch.setTint(0xF44336);
        s.time.delayedCall(100, function() {
            if (s.isGameOver && s.lives <= 0) return;
            s.tweens.add({ targets: ch, alpha: 0.5, duration: 100, yoyo: true, repeat: 2, onComplete: function() { ch.setAlpha(1); ch.clearTint(); } });
        });
        var kb = obs.lane === 'left' ? -20 : 20;
        s.tweens.add({ targets: ch, x: ch.x + kb, duration: 200, yoyo: true });
        s.redFlash.setAlpha(0.25); s.tweens.add({ targets: s.redFlash, alpha: 0, duration: 300 });
        s.cameras.main.shake(300, 0.025);
        s.threadAlpha = 0.2; s.threadColor = 0xF44336;
        s.tweens.add({ targets: s, threadAlpha: 0.8, duration: 500, delay: 300, onStart: function() { s.time.delayedCall(300, function() { s.updateThreadColor(); }); } });
        if (navigator.vibrate && GameState.settings.vibration) navigator.vibrate([30, 20, 50]);
    },
    onStageClear: function(s) {
        var t = s.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, 'STAGE ' + s.currentStage + ' CLEAR!', { fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.UI_TEXT }).setOrigin(0.5).setScale(0).setDepth(70);
        s.tweens.add({ targets: t, scaleX: 1.5, scaleY: 1.5, duration: 200, ease: 'Back.easeOut', onComplete: function() {
            s.tweens.add({ targets: t, scaleX: 1, scaleY: 1, duration: 150, onComplete: function() {
                s.tweens.add({ targets: t, alpha: 0, duration: 500, onComplete: function() { t.destroy(); } });
            }});
        }});
        JuiceEffects.burstParticles(s, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, COLORS_HEX.CHAR_A, 10);
        JuiceEffects.burstParticles(s, GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40, COLORS_HEX.CHAR_B, 10);
        s.redFlash.setFillStyle(0xFFFFFF); s.redFlash.setAlpha(0.2);
        s.tweens.add({ targets: s.redFlash, alpha: 0, duration: 150, onComplete: function() { s.redFlash.setFillStyle(0xF44336); s.redFlash.setAlpha(0); } });
    },
    onInactivityDeath: function(s) {
        for (var p = 0; p < 2; p++) {
            var plat = p === 0 ? s.platformA : s.platformB;
            for (var i = 0; i < 6; i++) {
                var f = s.add.rectangle(plat.x - 50 + i * 20, plat.y, 18, 12, 0x546E7A).setDepth(40);
                s.tweens.add({ targets: f, x: f.x + (Math.random() - 0.5) * 80, y: f.y + 200 + Math.random() * 100, alpha: 0, angle: Math.random() * 360, duration: 800, ease: 'Quad.easeIn', onComplete: function() { f.destroy(); } });
            }
            plat.setVisible(false);
        }
        s.tweens.add({ targets: [s.charA, s.charB], y: GAME.HEIGHT + 100, scaleX: 0.3, scaleY: 0.3, alpha: 0, duration: 1000, ease: 'Quad.easeIn' });
        s.tweens.add({ targets: s, threadAlpha: 0, duration: 400 });
    },
    showMilestone: function(s, text) {
        var mt = s.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, text, { fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.GOLD }).setOrigin(0.5).setDepth(70).setScale(0);
        s.tweens.add({ targets: mt, scaleX: 1.2, scaleY: 1.2, duration: 200, onComplete: function() {
            s.tweens.add({ targets: mt, scaleX: 1, scaleY: 1, duration: 200, onComplete: function() {
                s.tweens.add({ targets: mt, alpha: 0, duration: 600, onComplete: function() { mt.destroy(); } });
            }});
        }});
    }
};
