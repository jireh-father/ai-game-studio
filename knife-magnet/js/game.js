class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.gameOver = false; this.stageTransitioning = false;
    this.magnetActive = false; this.holdStartTime = 0;
    this.hitStopTimer = 0; this.waveCatches = 0;
    this.waveIndex = 0; this.currentStageData = null;
    this.paused = false; this.pauseOverlay = null;
    this.lastInputTime = Date.now();

    this.add.rectangle(w / 2, h / 2, w, h, COLORS.bg);
    const bgGfx = this.add.graphics().lineStyle(1, 0x2A2F3E, 0.4);
    bgGfx.lineBetween(0, h * 0.25, w, h * 0.25);
    bgGfx.lineBetween(0, h * 0.75, w, h * 0.75);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) bgGfx.strokeRect(c * 60 + 5, r * 42 + 60, 55, 38);

    // Player
    this.player = this.add.image(PLAYER_X, PLAYER_Y, 'player').setDepth(5);

    // Magnet ring graphics
    this.magnetRing = this.add.graphics().setDepth(4);
    this.magnetPulseTime = 0;

    // Knife pool
    this.knifePool = [];
    for (let i = 0; i < KNIFE_POOL_SIZE; i++) {
      const knife = this.add.image(-200, -200, 'knife_normal').setDepth(3);
      knife.active = false; knife.vx = 0; knife.vy = 0;
      knife.cursed = false; knife.caught = false;
      knife.missed = false; knife.holdTime = 0; knife.magnetized = false;
      this.knifePool.push(knife);
    }

    // HUD
    this.createHUD();

    // Input
    this.input.on('pointerdown', (pointer) => {
      if (this.gameOver || this.paused) return;
      this.lastInputTime = Date.now();
      // Ignore taps on pause button area
      if (pointer.x > 360 && pointer.y < 44) return;
      this.magnetActive = true;
      this.holdStartTime = this.time.now;
    });
    this.input.on('pointerup', () => {
      if (this.gameOver || this.paused) return;
      this.magnetActive = false;
      this.holdStartTime = 0;
      this.magnetRing.clear();
    });

    // Pause button
    this.pauseBtn = this.add.text(w - 30, 22, '\u23F8', {
      fontSize: '24px', fontFamily: 'Arial', color: COLORS_HEX.uiText
    }).setOrigin(0.5).setDepth(20).setInteractive();
    this.pauseBtn.on('pointerup', () => this.togglePause());

    // Visibility handler
    this.visHandler = () => {
      if (document.hidden && !this.gameOver) this.togglePause(true);
    };
    document.addEventListener('visibilitychange', this.visHandler);

    this.startStage();
  }

  createHUD() {
    const gs = window.GameState;
    this.hudBar = this.add.rectangle(200, 22, 400, 44, COLORS.uiBg, 0.8).setDepth(10);
    this.heartsText = this.add.text(16, 22, this.getHeartsStr(), {
      fontSize: '18px', fontFamily: 'Arial'
    }).setOrigin(0, 0.5).setDepth(11);
    this.stageText = this.add.text(200, 22, 'STAGE ' + gs.stage, {
      fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.uiText, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11);
    this.scoreText = this.add.text(355, 22, String(gs.score), {
      fontSize: '16px', fontFamily: 'Arial', color: COLORS_HEX.reward, fontStyle: 'bold'
    }).setOrigin(1, 0.5).setDepth(11);
    this.waveText = this.add.text(16, 54, 'WAVE 1/' + WAVES_PER_STAGE, {
      fontSize: '12px', fontFamily: 'Arial', color: '#6A7088'
    }).setDepth(11);
    this.streakText = this.add.text(16, 570, '', {
      fontSize: '14px', fontFamily: 'Arial', color: COLORS_HEX.reward, fontStyle: 'bold'
    }).setDepth(11);
  }

  getHeartsStr() {
    const gs = window.GameState;
    let s = '';
    for (let i = 0; i < STARTING_LIVES; i++) {
      s += i < gs.lives ? '\u2764\uFE0F' : '\uD83D\uDDA4';
    }
    return s;
  }

  startStage() {
    const gs = window.GameState;
    this.currentStageData = generateStage(gs.stage);
    this.waveIndex = 0;
    this.stageTransitioning = false;
    this.stageText.setColor(this.currentStageData.isBossStage ? '#FF2244' : COLORS_HEX.uiText);
    this.stageText.setText('STAGE ' + gs.stage);
    this.startWave();
  }

  startWave() {
    if (this.gameOver || this.stageTransitioning) return;
    const stageData = this.currentStageData;
    if (!stageData || this.waveIndex >= stageData.waves.length) return;

    const wave = stageData.waves[this.waveIndex];
    this.waveCatches = 0;
    this.waveKnifeCount = wave.knifeCount;
    this.waveCursedCount = 0;
    this.waveKnivesResolved = 0;
    this.waveText.setText('WAVE ' + (this.waveIndex + 1) + '/' + WAVES_PER_STAGE);

    wave.knives.forEach((kd) => {
      this.time.addEvent({ delay: kd.delay, callback: () => this.spawnKnife(kd) });
    });
  }

  spawnKnife(knifeData) {
    if (this.gameOver) return;
    const knife = this.knifePool.find(k => !k.active);
    if (!knife) return;

    const angleRad = Phaser.Math.DegToRad(knifeData.angle);
    const spawnY = PLAYER_Y + Math.tan(angleRad) * 300;

    knife.setPosition(420, Phaser.Math.Clamp(spawnY, 80, 520));
    knife.setTexture(knifeData.cursed ? 'knife_cursed' : 'knife_normal');
    knife.setRotation(angleRad);
    knife.vx = -knifeData.speed / 1000;
    knife.vy = Math.sin(angleRad) * knifeData.speed / 1000 * -0.3;
    knife.cursed = knifeData.cursed;
    knife.caught = false;
    knife.missed = false;
    knife.magnetized = false;
    knife.holdTime = 0;
    knife.active = true;
    knife.setAlpha(1).setVisible(true).setScale(1);

    if (knifeData.cursed) {
      this.waveCursedCount++;
      this.tweens.add({ targets: knife, alpha: 0.7, duration: 200, yoyo: true, repeat: -1 });
    }
  }

  update(time, delta) {
    if (this.gameOver || this.paused) return;
    if (Date.now() - this.lastInputTime > 15000) {
      this.lastInputTime = Date.now();
      this.loseLife();
      this.floatText(200, 280, 'WAKE UP!', COLORS_HEX.danger, 24);
      this.cameras.main.shake(200, 0.008);
      return;
    }
    if (this.hitStopTimer > 0) { this.hitStopTimer -= delta; return; }
    if (this.magnetActive) this.drawMagnetRing(time);

    const catchWindow = this.currentStageData ? this.currentStageData.catchWindow : 600;
    const holdDuration = this.magnetActive ? (time - this.holdStartTime) : 0;

    this.knifePool.forEach(knife => {
      if (!knife.active || knife.caught || knife.missed) return;

      const dx = PLAYER_X - knife.x;
      const dy = PLAYER_Y - knife.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (this.magnetActive && dist < MAGNET_RADIUS) {
        knife.magnetized = true;
        knife.holdTime += delta;

        if (knife.cursed && dist < CATCH_RADIUS) { this.cursedExplosion(knife); return; }
        if (!knife.cursed && dist < CATCH_RADIUS && holdDuration < catchWindow) {
          this.catchKnife(knife); return;
        }
        if (knife.holdTime > catchWindow && !knife.cursed) { this.dropKnife(knife); return; }

        const pullStrength = 0.18;
        knife.vx += (dx / dist) * pullStrength * delta / 16;
        knife.vy += (dy / dist) * pullStrength * delta / 16;
      }

      knife.x += knife.vx * delta;
      knife.y += knife.vy * delta;
      knife.y = Phaser.Math.Clamp(knife.y, 50, 550);

      if (knife.x < PLAYER_X - 30 && !knife.magnetized) {
        if (knife.cursed) this.cursedDodge(knife);
        else this.knifeStab(knife);
      }

      if (knife.x < -60) {
        if (knife.cursed && !knife.caught) this.cursedDodge(knife);
        else this.returnKnife(knife);
      }
    });

    this.scoreText.setText(String(window.GameState.score));
    this.heartsText.setText(this.getHeartsStr());
    const gs = window.GameState;
    this.streakText.setText(gs.streak >= 3 ? 'x' + gs.streak + ' STREAK' : '');
  }

  loseLife() {
    const gs = window.GameState;
    gs.lives--;
    gs.streak = 0;
    this.heartsText.setText(this.getHeartsStr());
    if (gs.lives <= 0) this.onGameOver();
  }

  onGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.magnetActive = false;
    this.magnetRing.clear();
    this.cameras.main.fade(400, 20, 20, 30);
    setTimeout(() => {
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene');
    }, 700);
  }

  returnKnife(knife) {
    knife.active = false;
    knife.caught = false;
    knife.missed = false;
    knife.magnetized = false;
    knife.holdTime = 0;
    knife.setPosition(-200, -200).setAlpha(1).setScale(1).setRotation(0);
    this.tweens.killTweensOf(knife);
  }

  checkWaveComplete() {
    if (this.waveKnivesResolved < this.waveKnifeCount) return;

    const gs = window.GameState;
    if (this.waveCatches >= 2) {
      const bonusIdx = Math.min(this.waveCatches, 4);
      const bonus = SCORE_VALUES.comboBonus[bonusIdx];
      gs.score += bonus;

      const labels = ['', '', 'DOUBLE!', 'TRIPLE!', 'PERFECT!'];
      const shakeAmts = [0, 0, 0.002, 0.004, 0.006];
      const shakeDurs = [0, 0, 80, 100, 120];
      this.floatText(200, 280, labels[bonusIdx] + ' +' + bonus, COLORS_HEX.primary, 22);
      this.cameras.main.shake(shakeDurs[bonusIdx], shakeAmts[bonusIdx]);

      for (let i = 0; i < (bonusIdx - 1) * 8; i++) {
        const gp = this.add.image(200, 280, 'particle_gold').setDepth(12);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.tweens.add({
          targets: gp, x: 200 + Math.cos(angle) * 80, y: 280 + Math.sin(angle) * 80,
          alpha: 0, duration: 500, onComplete: () => gp.destroy()
        });
      }
    }

    this.waveIndex++;
    if (this.waveIndex >= WAVES_PER_STAGE && !this.stageTransitioning) {
      this.advanceStage();
    } else if (!this.stageTransitioning) {
      const interval = this.currentStageData.waves[Math.min(this.waveIndex, WAVES_PER_STAGE - 1)].interval;
      this.time.addEvent({ delay: interval, callback: () => this.startWave() });
    }
  }

  advanceStage() {
    this.stageTransitioning = true;
    const gs = window.GameState;
    gs.score += gs.stage * SCORE_VALUES.stageBonus;
    gs.stage++;

    const banner = this.add.text(200, 280, 'STAGE CLEAR', {
      fontSize: '28px', fontFamily: 'Arial', color: COLORS_HEX.reward, fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0.5).setDepth(20);

    this.tweens.add({
      targets: banner, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.addEvent({
          delay: 800, callback: () => {
            this.tweens.add({
              targets: banner, alpha: 0, duration: 300,
              onComplete: () => { banner.destroy(); this.startStage(); }
            });
          }
        });
      }
    });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
    if (this.pauseOverlay) { this.pauseOverlay.destroy(); this.pauseOverlay = null; }
  }
}
