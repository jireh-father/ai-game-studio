// Echo Thief - HUD, Pause Overlay & Visual Effects
// Mixin methods added to GameScene prototype

GameScene.prototype.createHUD = function() {
    const w = GAME_WIDTH;
    this.add.rectangle(w / 2, HUD_HEIGHT / 2, w, HUD_HEIGHT, COLORS.HUD_BG, 0.85).setDepth(5);

    this.scoreText = this.add.text(8, 12, 'SCORE: ' + this.score, {
        fontSize: '14px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
    }).setDepth(6);

    this.stageText = this.add.text(w / 2, 12, 'Stage ' + this.stage, {
        fontSize: '14px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
    }).setOrigin(0.5, 0).setDepth(6);

    const pauseBtn = this.add.rectangle(w - 30, 20, 44, 44, 0x000000, 0).setDepth(7);
    this.add.text(w - 30, 20, '\u23F8', {
        fontSize: '22px', fontFamily: 'Arial', fill: COLORS.WAVE
    }).setOrigin(0.5).setDepth(6);
    pauseBtn.setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.togglePause());

    this.meterBg = this.add.rectangle(w / 2, HUD_HEIGHT - 6, w - 16, 8, 0x222244, 0.6).setDepth(5);
    this.meterBar = this.add.rectangle(8, HUD_HEIGHT - 6, 0, 8, COLORS.METER_LOW).setOrigin(0, 0.5).setDepth(5);
    this.noisePctText = this.add.text(w - 8, HUD_HEIGHT - 6, '0%', {
        fontSize: '10px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
    }).setOrigin(1, 0.5).setDepth(6);

    this.chainText = this.add.text(w / 2, HUD_HEIGHT + 10, '', {
        fontSize: '12px', fontFamily: 'Arial', fill: COLORS.WAVE
    }).setOrigin(0.5, 0).setDepth(6).setAlpha(0);
};

GameScene.prototype.updateHUD = function() {
    this.scoreText.setText('SCORE: ' + this.score);
    this.stageText.setText('Stage ' + this.stage);

    const barWidth = (GAME_WIDTH - 16) * (this.noisePct / 100);
    this.meterBar.setSize(Math.max(0, barWidth), 8);
    this.noisePctText.setText(Math.floor(this.noisePct) + '%');

    let color = COLORS.METER_LOW;
    if (this.noisePct >= 90) color = COLORS.METER_CRITICAL;
    else if (this.noisePct >= 70) color = COLORS.METER_HIGH;
    else if (this.noisePct >= 40) color = COLORS.METER_MID;
    this.meterBar.setFillStyle(color);
};

GameScene.prototype.togglePause = function(forceOn) {
    if (this.gameOver) return;
    this.isPaused = forceOn !== undefined ? forceOn : !this.isPaused;

    if (this.isPaused) {
        this.scene.pause();
        this.showPauseOverlay();
    } else {
        this.hidePauseOverlay();
        this.scene.resume();
    }
};

GameScene.prototype.showPauseOverlay = function() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    this.pauseElements = [];
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, COLORS.BG, 0.8).setDepth(20);
    this.pauseElements.push(overlay);

    const title = this.add.text(w / 2, h * 0.2, 'PAUSED', {
        fontSize: '30px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(21);
    this.pauseElements.push(title);

    const btns = [
        { label: 'RESUME', y: h * 0.4, color: COLORS.WAVE_HEX, action: () => this.togglePause(false) },
        { label: 'HOW TO PLAY', y: h * 0.5, color: 0x333355, action: () => {
            this.hidePauseOverlay();
            this.scene.launch('help', { returnTo: 'game' });
        }},
        { label: 'RESTART', y: h * 0.6, color: 0x664400, action: () => {
            this.hidePauseOverlay();
            this.scene.stop('game');
            GameState.currentScore = 0;
            GameState.currentStage = 1;
            this.scene.start('game');
        }},
        { label: 'QUIT', y: h * 0.7, color: 0x333333, action: () => {
            this.hidePauseOverlay();
            this.scene.stop('game');
            this.scene.start('menu');
        }}
    ];

    btns.forEach(b => {
        const rect = this.add.rectangle(w / 2, b.y, 160, 45, b.color, 0.9).setDepth(21);
        const txt = this.add.text(w / 2, b.y, b.label, {
            fontSize: '16px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(22);
        rect.setInteractive({ useHandCursor: true });
        rect.on('pointerdown', b.action);
        this.pauseElements.push(rect, txt);
    });

    this.scene.resume();
    this.isPaused = true;
};

GameScene.prototype.hidePauseOverlay = function() {
    if (this.pauseElements) {
        this.pauseElements.forEach(e => e.destroy());
        this.pauseElements = null;
    }
    this.isPaused = false;
};

GameScene.prototype.emitParticles = function(x, y, key, count, speed) {
    speed = speed || 120;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const s = Phaser.Math.Between(speed * 0.6, speed);
        const p = this.add.image(x, y, key).setDepth(4).setScale(0.8);
        const tx = x + Math.cos(angle) * s;
        const ty = y + Math.sin(angle) * s;
        this.tweens.add({
            targets: p, x: tx, y: ty, alpha: 0, scale: 0,
            duration: Phaser.Math.Between(300, 500),
            onComplete: () => p.destroy()
        });
    }
};

GameScene.prototype.showFloatingText = function(x, y, text, color, size, dur) {
    const t = this.add.text(x, y, text, {
        fontSize: size + 'px', fontFamily: 'Arial', fill: color, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: dur, onComplete: () => t.destroy() });
};
