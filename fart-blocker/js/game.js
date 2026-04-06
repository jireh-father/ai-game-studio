// game.js — GameScene: core loop, tap input, pressure, cramp, startle, scoring

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.gameOver = false;
    this.paused = false;
    this.cramping = false;
    this.stageTransitioning = false;
    this.pressure = 0;
    this.tapTimestamps = [];
    this.lastInputTime = Date.now();
    this.stageElapsed = 0;
    this.maxPressureThisStage = 0;
    this.nearMissTriggered = false;
    this.rhythmTaps = 0;
    this.rhythmStart = 0;
    this.crampTimeoutId = null;
    this.startleTimers = [];
    this.inversionActive = false;
    this.inversionWarning = false;

    this.stageParams = StageSystem.getParams(GameState.stage);

    // Background
    this.bgRect = this.add.rectangle(w / 2, h / 2, w, h,
      parseInt(this.stageParams.scenarioBg.replace('#', '0x')));

    this.scenarioLabel = this.add.text(w / 2, h - 40, this.stageParams.scenarioName, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).setAlpha(0.15);

    // Player
    this.player = this.add.image(w / 2, h * 0.48, 'player').setScale(1.5);

    // NPCs
    this.npcs = [];
    const npcKeys = NPC_KEYS_BY_SCENARIO[this.stageParams.scenarioId] || ['npcYoga'];
    const npcStartX = w / 2 - ((npcKeys.length - 1) * 35);
    npcKeys.forEach((key, i) => {
      this.npcs.push(this.add.image(npcStartX + i * 70, h * 0.22, key).setScale(1.2));
    });

    // Pressure meter
    this.meterX = w - 28;
    this.meterY = 70;
    this.meterH = h - 130;
    this.meterGfx = this.add.graphics();

    // HUD bar
    this.add.rectangle(w / 2, 28, w, 56, 0x1A1A2E).setDepth(10);
    this.scoreText = this.add.text(14, 28, 'SCORE: ' + GameState.score, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.uiText
    }).setOrigin(0, 0.5).setDepth(11);
    this.stageText = this.add.text(w / 2, 28, 'STAGE ' + GameState.stage, {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.uiText
    }).setOrigin(0.5).setDepth(11);

    // Lives
    this.lifeIcons = [];
    for (let i = 0; i < DIFFICULTY_BASE.initialLives; i++) {
      const key = i < GameState.lives ? 'life' : 'lifeLost';
      this.lifeIcons.push(this.add.image(w - 30 - i * 26, 28, key).setScale(1.1).setDepth(11));
    }

    this.timerBar = this.add.graphics().setDepth(10);
    this.crampText = this.add.text(w / 2, h / 2, '', {
      fontSize: '34px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.criticalRed
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    this.comboText = this.add.text(w / 2, 65, '', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.warningYellow
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    if (GameState.stage <= 3) {
      const hint = this.add.text(w / 2, h - 80, 'TAP ANYWHERE TO CLENCH', {
        fontSize: '15px', fontFamily: 'Arial', color: '#FFF'
      }).setOrigin(0.5).setAlpha(0.4);
      this.tweens.add({ targets: hint, alpha: 0, delay: 3000, duration: 1000 });
    }

    this.inversionFlash = this.add.rectangle(w / 2, h / 2, w, h, 0xFF0000, 0).setDepth(15);

    // Pause button
    const pauseBtn = this.add.text(w - 10, 60, '⏸', { fontSize: '24px' })
      .setOrigin(1, 0).setDepth(12).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', (p) => { p.event.stopPropagation(); this.togglePause(); });

    // Tap input
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 56 || this.paused || this.gameOver || this.stageTransitioning) return;
      if (this.stageElapsed < DIFFICULTY_BASE.inputGracePeriod) return;
      this.handleTap();
    });

    // Visibility handler
    this.visHandler = () => {
      if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    this.scheduleStartles();
    if (this.stageParams.hasInversion) this.scheduleInversion();

    AudioSystem.init();
    AudioSystem.resume();
    AudioSystem.startMusic(Math.min(150, 120 + Math.floor(GameState.stage / 5) * 5));
  }

  scheduleStartles() {
    this.stageParams.startleTimes.forEach(t => {
      const timer = setTimeout(() => {
        if (!this.gameOver && !this.stageTransitioning) this.handleStartle();
      }, t);
      this.startleTimers.push(timer);
    });
  }

  scheduleInversion() {
    const delay = 2000 + Math.random() * (this.stageParams.timerMs - 4000);
    setTimeout(() => {
      if (this.gameOver || this.stageTransitioning) return;
      this.inversionWarning = true;
      this.inversionFlash.setAlpha(0.15);
      this.tweens.add({ targets: this.inversionFlash, alpha: 0.25, duration: 250, yoyo: true, repeat: 1 });
      setTimeout(() => {
        if (this.gameOver || this.stageTransitioning) return;
        this.inversionActive = true;
        this.inversionWarning = false;
        this.inversionFlash.setAlpha(0.1);
        setTimeout(() => { this.inversionActive = false; this.inversionFlash.setAlpha(0); }, 800);
      }, 500);
    }, delay);
  }

  handleTap() {
    this.lastInputTime = Date.now();
    AudioSystem.playTap();
    const now = Date.now();
    this.tapTimestamps.push(now);
    this.tapTimestamps = this.tapTimestamps.filter(t => now - t < 500);

    if (this.tapTimestamps.length >= this.stageParams.crampThreshold) {
      this.triggerCramp();
      return;
    }

    if (this.inversionActive) {
      this.pressure = Math.min(100, this.pressure + this.stageParams.tapReduction * 0.5);
      this.effectShake(2, 50);
      return;
    }
    if (this.cramping) return;

    this.pressure = Math.max(0, this.pressure - this.stageParams.tapReduction);
    this.effectScalePunch(this.player, 1.15, 80);
    this.effectSweatBurst(this.player.x, this.player.y - 30, this.pressure > 85 ? 3 : 1);

    if (this.pressure > 85) {
      this.effectMicroZoom(1.04, 60);
      this.scene.pause('GameScene');
      setTimeout(() => {
        if (this.scene.isActive('GameScene') || this.scene.isPaused('GameScene')) {
          this.scene.resume('GameScene');
        }
      }, 40);
    }

    if (this.rhythmTaps === 0) this.rhythmStart = now;
    this.rhythmTaps++;
    if (this.rhythmTaps >= 5 && now - this.rhythmStart <= 2000) {
      this.addScore(SCORE_VALUES.rhythmBonus);
      this.effectFloatingText(this.player.x, this.player.y - 50, 'RHYTHM! +' + SCORE_VALUES.rhythmBonus, COLORS.warningYellow);
      this.rhythmTaps = 0;
    }
    if (now - this.rhythmStart > 2000) { this.rhythmTaps = 1; this.rhythmStart = now; }
    this.effectMeterFlash();
  }

  triggerCramp() {
    if (this.cramping) return;
    this.cramping = true;
    this.tapTimestamps = [];
    AudioSystem.playCramp();
    this.effectScreenFlash(0xFFD60A, 100);

    const dur = this.stageParams.crampDuration;
    let remaining = dur;
    this.crampText.setAlpha(1).setText('CRAMP! ' + (remaining / 1000).toFixed(1) + 's');

    this.crampShakeInterval = setInterval(() => {
      if (!this.cramping) return;
      this.player.x = this.cameras.main.width / 2 + (Math.random() - 0.5) * 8;
    }, 80);

    this.crampTint = this.add.rectangle(
      this.cameras.main.width / 2, this.cameras.main.height / 2,
      this.cameras.main.width, this.cameras.main.height, 0xFF0000, 0.1
    ).setDepth(14);

    const countdownInterval = setInterval(() => {
      remaining -= 100;
      if (remaining <= 0 || !this.cramping) { clearInterval(countdownInterval); return; }
      this.crampText.setText('CRAMP! ' + (remaining / 1000).toFixed(1) + 's');
      if (remaining % 500 < 100) {
        this.tweens.add({ targets: this.crampText, scaleX: 1.1, scaleY: 1.1, duration: 100, yoyo: true });
      }
    }, 100);

    this.crampTimeoutId = setTimeout(() => this.endCramp(), dur);
  }

  endCramp() {
    this.cramping = false;
    this.crampText.setAlpha(0);
    if (this.crampShakeInterval) clearInterval(this.crampShakeInterval);
    this.player.x = this.cameras.main.width / 2;
    if (this.crampTint) { this.crampTint.destroy(); this.crampTint = null; }
    this.addScore(SCORE_VALUES.crampSurvived);
    this.effectFloatingText(this.player.x, this.player.y - 40, '+' + SCORE_VALUES.crampSurvived, COLORS.safeGreen);
  }

  handleStartle() {
    AudioSystem.playStartle();
    this.pressure = Math.min(100, this.pressure + this.stageParams.startleSpike);
    this.effectShake(4, 200);
    if (this.npcs.length > 0) {
      const npc = this.npcs[Math.floor(Math.random() * this.npcs.length)];
      this.tweens.add({ targets: npc, scaleX: 1.4, scaleY: 1.4, duration: 200, yoyo: true });
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.stageTransitioning) return;
    this.stageElapsed += delta;

    if (Date.now() - this.lastInputTime > DIFFICULTY_BASE.inactivityDeathMs) {
      this.triggerDeath(); return;
    }

    const fillMult = this.cramping ? 0.5 : 1;
    this.pressure = Math.min(100, this.pressure + this.stageParams.fillRate * fillMult * (delta / 1000));
    if (this.pressure > this.maxPressureThisStage) this.maxPressureThisStage = this.pressure;

    if (this.pressure > 75 && this.npcs.length) this.npcs.forEach(n => n.setTint(0xFFAAAA));
    else if (this.npcs.length) this.npcs.forEach(n => n.clearTint());

    if (this.pressure >= 90 && !this.nearMissTriggered) this.nearMissTriggered = true;
    if (this.nearMissTriggered && this.pressure < 70) {
      this.nearMissTriggered = false;
      this.addScore(SCORE_VALUES.closeCall);
      this.effectFloatingText(this.player.x, this.player.y - 60, 'CLOSE! +' + SCORE_VALUES.closeCall, COLORS.warningYellow);
      AudioSystem.playNearMiss();
    }

    if (this.pressure > 85) {
      if (this.player.texture.key !== 'playerStressed') this.player.setTexture('playerStressed');
    } else {
      if (this.player.texture.key !== 'player') this.player.setTexture('player');
    }

    if (this.pressure >= 100) { this.triggerDeath(); return; }
    if (this.stageElapsed >= this.stageParams.timerMs) { this.advanceStage(); return; }

    this.drawMeter();
    this.drawTimerBar();
    if (GameState.comboActive) this.comboText.setText('COMPOSED x1.5').setAlpha(1);
    else this.comboText.setAlpha(0);
  }

  cleanupTimers() {
    if (this.crampTimeoutId) { clearTimeout(this.crampTimeoutId); this.crampTimeoutId = null; }
    if (this.crampShakeInterval) { clearInterval(this.crampShakeInterval); this.crampShakeInterval = null; }
    this.startleTimers.forEach(t => clearTimeout(t));
    this.startleTimers = [];
    if (this.crampTint) { this.crampTint.destroy(); this.crampTint = null; }
  }

  shutdown() {
    this.cleanupTimers();
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
