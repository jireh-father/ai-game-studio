// Escalator Chaos - Core GameScene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.state = {
      score: 0,
      bestScore: parseInt(localStorage.getItem('escalator-chaos-best') || '0'),
      streak: 0,
      overflowCount: 0,
      stage: 1,
      correctInStage: 0,
      lastInputTime: this.time.now,
      gameOver: false
    };
    this.commuters = [];

    this.drawBackground();
    InputHandler.setup(this);
    this.startSpawning();

    this.scene.launch('HUDScene');
    this.emitHUD();
    this.events.emit('showStageBanner', 1);
    this.events.on('restartGame', this.restartGame, this);
  }

  drawBackground() {
    const g = this.add.graphics();
    g.fillStyle(COLORS.ESCALATOR_LEFT, 0.25);
    g.fillRect(0, LAYOUT.SWIPE_ZONE_TOP, LAYOUT.ESCALATOR_W, GAME_HEIGHT - LAYOUT.SWIPE_ZONE_TOP);
    g.fillStyle(COLORS.ESCALATOR_RIGHT, 0.25);
    g.fillRect(GAME_WIDTH - LAYOUT.ESCALATOR_W, LAYOUT.SWIPE_ZONE_TOP, LAYOUT.ESCALATOR_W, GAME_HEIGHT - LAYOUT.SWIPE_ZONE_TOP);
    this.stepLines = this.add.graphics().setDepth(1);
    this.add.text(LAYOUT.ESCALATOR_LEFT_X, GAME_HEIGHT - 30, '\u25BC DOWN', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#E94560'
    }).setOrigin(0.5).setAlpha(0.6).setDepth(2);
    this.add.text(LAYOUT.ESCALATOR_RIGHT_X, GAME_HEIGHT - 30, '\u25B2 UP', {
      fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: '#57CC99'
    }).setOrigin(0.5).setAlpha(0.6).setDepth(2);
    g.fillStyle(0x1A1A2E, 1);
    g.fillRect(LAYOUT.ESCALATOR_W, LAYOUT.SWIPE_ZONE_TOP, GAME_WIDTH - 2 * LAYOUT.ESCALATOR_W, GAME_HEIGHT - LAYOUT.SWIPE_ZONE_TOP);
    g.lineStyle(1, 0x533483, 0.3);
    g.lineBetween(0, LAYOUT.SWIPE_ZONE_TOP, GAME_WIDTH, LAYOUT.SWIPE_ZONE_TOP);
    g.lineBetween(0, LAYOUT.SWIPE_ZONE_BOTTOM, GAME_WIDTH, LAYOUT.SWIPE_ZONE_BOTTOM);
    this.stepOffset = 0;
  }

  advanceStage() {
    this.state.stage++;
    this.state.correctInStage = 0;
    this.state.score += SCORING.STAGE_CLEAR;
    this.events.emit('showStageBanner', this.state.stage);
    this.events.emit('scorePopup', {
      x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 + 40,
      points: SCORING.STAGE_CLEAR, color: '#FFD700', big: true
    });
    this.cameras.main.flash(300, 83, 52, 131, false);
    this.restartSpawnTimer();
  }

  startSpawning() {
    const params = StageManager.getParams(this.state.stage);
    this.spawnTimer = this.time.addEvent({
      delay: params.spawnInterval * 1000,
      callback: () => this.spawnCommuters(),
      loop: true
    });
  }

  restartSpawnTimer() {
    if (this.spawnTimer) this.spawnTimer.remove();
    this.startSpawning();
  }

  spawnCommuters() {
    if (this.state.gameOver) return;
    const params = StageManager.getParams(this.state.stage);
    const activeCount = this.commuters.filter(c => !c.swiped).length;
    if (activeCount >= params.maxQueueSize) return;

    const type = StageManager.pickCommuterType(params);
    this.commuters.push(StageManager.createCommuter(this, type, 0));

    if (Math.random() < params.doubleSpawnChance && activeCount + 1 < params.maxQueueSize) {
      const type2 = StageManager.pickCommuterType(params);
      this.commuters.push(StageManager.createCommuter(this, type2, (Math.random() - 0.5) * 60));
    }
  }

  handleOverflow(commuter) {
    if (commuter.swiped) return;
    commuter.swiped = true;
    this.state.overflowCount++;
    this.state.score = Math.max(0, this.state.score + SCORING.OVERFLOW_PENALTY);

    this.tweens.add({
      targets: commuter.sprite,
      y: GAME_HEIGHT + 20, scaleX: 0.7, scaleY: 0.7, alpha: 0,
      duration: 400, onComplete: () => commuter.sprite.destroy()
    });
    this.tweens.add({
      targets: commuter.icon, alpha: 0, duration: 200,
      onComplete: () => commuter.icon.destroy()
    });

    if (this.state.overflowCount >= 4) {
      this.cameras.main.shake(300, 0.012);
    }
    this.emitHUD();
    this.removeCommuter(commuter);

    if (this.state.overflowCount >= TIMING.MAX_OVERFLOW) {
      this.triggerGameOver('overflow');
    }
  }

  triggerInactivityDeath() {
    for (let i = 0; i < 5; i++) {
      const angry = this.add.text(60 + i * 60, LAYOUT.QUEUE_TOP, '\uD83D\uDE21', {
        fontSize: '36px'
      }).setDepth(10);
      this.tweens.add({
        targets: angry, y: LAYOUT.OVERFLOW_Y, duration: 400,
        delay: i * 80, onComplete: () => angry.destroy()
      });
    }
    this.time.delayedCall(600, () => this.triggerGameOver('inactivity'));
  }

  triggerGameOver(reason) {
    if (this.state.gameOver) return;
    this.state.gameOver = true;
    if (this.spawnTimer) this.spawnTimer.remove();

    if (this.state.score > this.state.bestScore) {
      this.state.bestScore = this.state.score;
      localStorage.setItem('escalator-chaos-best', this.state.score.toString());
    }

    this.cameras.main.shake(500, 0.02);

    for (const c of this.commuters) {
      if (c.swiped) continue;
      this.tweens.add({
        targets: c.sprite,
        x: c.sprite.x + (Math.random() - 0.5) * 600,
        y: c.sprite.y + (Math.random() - 0.5) * 600,
        rotation: (Math.random() - 0.5) * 12,
        alpha: 0, duration: 600,
        onComplete: () => { c.sprite.destroy(); c.icon.destroy(); }
      });
      this.tweens.add({
        targets: c.icon, alpha: 0, duration: 200,
        onComplete: () => { if (c.icon && c.icon.scene) c.icon.destroy(); }
      });
    }
    this.commuters = [];

    this.time.delayedCall(500, () => {
      this.events.emit('showGameOver', {
        score: this.state.score,
        bestScore: this.state.bestScore,
        reason: reason
      });
    });
  }

  restartGame() {
    this.events.off('restartGame', this.restartGame, this);
    this.scene.stop('HUDScene');
    this.scene.restart();
  }

  removeCommuter(commuter) {
    const idx = this.commuters.indexOf(commuter);
    if (idx !== -1) this.commuters.splice(idx, 1);
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const p = this.add.circle(x, y, 4, color).setDepth(8);
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const dist = 40 + Math.random() * 30;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 300, onComplete: () => p.destroy()
      });
    }
  }

  emitHUD() {
    this.events.emit('updateHUD', {
      score: this.state.score,
      streak: this.state.streak,
      overflow: this.state.overflowCount,
      stage: this.state.stage
    });
  }

  update(time, delta) {
    if (this.state.gameOver) return;

    this.stepOffset = (this.stepOffset + delta * 0.04) % 20;
    this.stepLines.clear();
    this.stepLines.lineStyle(1, COLORS.ESCALATOR_STEPS, 0.3);
    for (let y = LAYOUT.SWIPE_ZONE_TOP + this.stepOffset; y < GAME_HEIGHT; y += 20) {
      this.stepLines.lineBetween(0, y, LAYOUT.ESCALATOR_W, y);
      this.stepLines.lineBetween(GAME_WIDTH - LAYOUT.ESCALATOR_W, y, GAME_WIDTH, y);
    }

    for (let i = this.commuters.length - 1; i >= 0; i--) {
      const c = this.commuters[i];
      if (c.swiped) continue;
      StageManager.updateCommuter(this, c, delta);
      if (StageManager.isOverflowed(c)) {
        this.handleOverflow(c);
      }
    }

    if (time - this.state.lastInputTime > TIMING.INACTIVITY_DEATH) {
      this.triggerInactivityDeath();
    }
  }
}
