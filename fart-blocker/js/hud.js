// hud.js — HUD drawing, pause overlay, death handling, stage advancement (mixed into GameScene)

Object.assign(GameScene.prototype, {
  drawMeter() {
    const g = this.meterGfx;
    g.clear();
    g.fillStyle(0x333333, 0.5);
    g.fillRoundedRect(this.meterX, this.meterY, 20, this.meterH, 8);

    const fillH = (this.pressure / 100) * this.meterH;
    let color = 0x2DC653;
    if (this.pressure > 85) color = 0xE63946;
    else if (this.pressure > 70) color = 0xFF6B35;
    else if (this.pressure > 40) color = 0xFFD60A;

    g.fillStyle(color, 1);
    g.fillRoundedRect(this.meterX, this.meterY + this.meterH - fillH, 20, fillH, 8);

    const threshY = this.meterY + this.meterH * 0.2;
    g.lineStyle(2, 0xFFD60A, 0.6);
    g.beginPath();
    g.moveTo(this.meterX - 2, threshY);
    g.lineTo(this.meterX + 22, threshY);
    g.strokePath();

    if (this.pressure > 80) {
      this.meterGfx.x = (Math.random() - 0.5) * 6;
    } else {
      this.meterGfx.x = 0;
    }
  },

  drawTimerBar() {
    const w = this.cameras.main.width;
    this.timerBar.clear();
    const progress = Math.max(0, 1 - this.stageElapsed / this.stageParams.timerMs);
    this.timerBar.fillStyle(0x3A86FF, 0.4);
    this.timerBar.fillRect(0, 56, w * progress, 4);
  },

  addScore(points) {
    const mult = GameState.comboActive ? SCORE_VALUES.comboMultiplier : 1;
    const gained = Math.round(points * mult);
    GameState.score += gained;
    this.scoreText.setText('SCORE: ' + GameState.score);
    this.effectScalePunch(this.scoreText, 1.3, 200);
  },

  triggerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.cleanupTimers();

    AudioSystem.playDisaster();
    AudioSystem.stopMusic();
    this.effectGasExplosion(this.player.x, this.player.y);
    this.cameras.main.shake(600, 0.012);
    this.effectScreenFlash(0xFF0000, 150, 0.3);

    this.tweens.add({
      targets: this.player, y: this.player.y - 40, alpha: 0, duration: 500
    });
    this.npcs.forEach(npc => {
      this.tweens.add({ targets: npc, scaleX: 1.5, scaleY: 1.5, duration: 300 });
    });

    GameState.lives--;
    this.lifeIcons.forEach((icon, i) => {
      const idx = DIFFICULTY_BASE.initialLives - 1 - i;
      icon.setTexture(idx < GameState.lives ? 'life' : 'lifeLost');
    });

    if (GameState.lives <= 0) {
      AudioSystem.playGameOver();
      setTimeout(() => {
        if (this.scene.isActive('GameScene')) {
          this.scene.launch('GameOverScene');
        }
      }, 800);
    } else {
      setTimeout(() => {
        if (!this.scene.isActive('GameScene')) return;
        this.pressure = 0;
        this.stageElapsed = 0;
        this.gameOver = false;
        this.cramping = false;
        this.nearMissTriggered = false;
        this.maxPressureThisStage = 0;
        this.player.setAlpha(1).setY(this.cameras.main.height * 0.48);
        this.player.setTexture('player');
        this.npcs.forEach(npc => npc.setScale(1.2));
        this.stageParams = StageSystem.getParams(GameState.stage);
        this.scheduleStartles();
        if (this.stageParams.hasInversion) this.scheduleInversion();
        this.lastInputTime = Date.now();
      }, 1000);
    }
  },

  advanceStage() {
    this.stageTransitioning = true;
    this.cleanupTimers();

    const stageScore = SCORE_VALUES.stageSurvived * GameState.stage;
    this.addScore(stageScore);

    if (this.maxPressureThisStage <= 60) {
      this.addScore(SCORE_VALUES.perfectStage);
      this.effectFloatingText(this.player.x, this.player.y - 70, 'PERFECT! +' + SCORE_VALUES.perfectStage, COLORS.safeGreen);
    }

    const timeLeft = (this.stageParams.timerMs - this.stageElapsed) / 1000;
    if (timeLeft > 3) {
      this.addScore(Math.round(timeLeft * SCORE_VALUES.speedBonusPerSec));
    }

    if (this.maxPressureThisStage < 70) {
      GameState.comboChain++;
      if (GameState.comboChain >= 3) GameState.comboActive = true;
    } else {
      GameState.comboChain = 0;
      GameState.comboActive = false;
    }

    AudioSystem.playStageClear();

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const banner = this.add.text(w / 2, h / 2, 'SURVIVED!', {
      fontSize: '30px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.safeGreen
    }).setOrigin(0.5).setDepth(25).setScale(0.5);

    this.tweens.add({
      targets: banner, scaleX: 1.2, scaleY: 1.2, duration: 200,
      yoyo: true, hold: 300,
      onComplete: () => {
        banner.destroy();
        GameState.stage++;
        this.stageTransitioning = false;
        this.pressure = Math.max(0, this.pressure - 20);
        this.stageElapsed = 0;
        this.maxPressureThisStage = 0;
        this.nearMissTriggered = false;
        this.tapTimestamps = [];

        this.stageParams = StageSystem.getParams(GameState.stage);
        this.stageText.setText('STAGE ' + GameState.stage);
        this.bgRect.setFillStyle(parseInt(this.stageParams.scenarioBg.replace('#', '0x')));
        this.scenarioLabel.setText(this.stageParams.scenarioName);

        this.npcs.forEach(n => n.destroy());
        this.npcs = [];
        const npcKeys = NPC_KEYS_BY_SCENARIO[this.stageParams.scenarioId] || ['npcYoga'];
        const npcStartX = w / 2 - ((npcKeys.length - 1) * 35);
        npcKeys.forEach((key, i) => {
          const npc = this.add.image(npcStartX + i * 70, h * 0.22, key).setScale(1.2);
          this.npcs.push(npc);
        });

        this.scheduleStartles();
        if (this.stageParams.hasInversion) this.scheduleInversion();
        this.lastInputTime = Date.now();

        const bpm = Math.min(150, 120 + Math.floor(GameState.stage / 5) * 5);
        AudioSystem.updateMusicBPM(bpm);
      }
    });
  },

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  },

  showPauseOverlay() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.pauseOverlay = this.add.container(0, 0).setDepth(30);
    this.pauseOverlay.add(this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6));
    this.pauseOverlay.add(this.add.text(w / 2, h * 0.25, 'PAUSED', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5));

    const buttons = [
      { label: 'RESUME', color: 0x2DC653, y: h * 0.40, action: () => this.togglePause() },
      { label: 'RESTART', color: 0xFFD60A, y: h * 0.50, action: () => {
        GameState.score = 0; GameState.stage = 1;
        GameState.lives = DIFFICULTY_BASE.initialLives;
        GameState.comboChain = 0; GameState.comboActive = false;
        this.cleanupTimers();
        this.scene.stop('GameScene'); this.scene.start('GameScene');
      }},
      { label: 'HOW TO PLAY', color: 0x3A86FF, y: h * 0.60, action: () => {
        this.scene.pause('GameScene');
        this.scene.launch('HelpScene', { returnTo: 'GameScene' });
      }},
      { label: 'QUIT TO MENU', color: 0x555555, y: h * 0.70, action: () => {
        this.cleanupTimers();
        this.scene.stop('GameScene'); this.scene.start('MenuScene');
      }}
    ];
    buttons.forEach(b => {
      const btn = this.add.rectangle(w / 2, b.y, 180, 44, b.color)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(w / 2, b.y, b.label, {
        fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
      }).setOrigin(0.5);
      btn.on('pointerdown', () => { AudioSystem.playUIClick(); b.action(); });
      this.pauseOverlay.add([btn, txt]);
    });
  },

  hidePauseOverlay() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
  }
});
