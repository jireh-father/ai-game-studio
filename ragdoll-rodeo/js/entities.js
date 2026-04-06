// entities.js — Bull physics, ejection, pause overlay (GameScene prototype extension)

Object.assign(GameScene.prototype, {
  updateBull(dt) {
    if (this.buckActive && this.currentBuck) {
      this.buckElapsed += dt * 1000;
      const progress = this.buckElapsed / this.currentBuck.duration;
      if (progress >= 1) {
        this.buckActive = false;
        this.currentBuck = null;
        this.bullVelX *= 0.3;
        this.bullVelY *= 0.3;
        this.scheduleBuck();
      } else {
        const intensity = Math.sin(progress * Math.PI);
        this.bullX += this.bullVelX * intensity * dt * 60;
        this.bullY += this.bullVelY * intensity * dt * 60;
        this.bullAngle = Math.sin(progress * Math.PI * 2) * this.currentBuck.rotation;
      }
    }
    this.bullX += (GAME_WIDTH / 2 - this.bullX) * 0.02;
    this.bullY += (this.bullBaseY - this.bullY) * 0.03;
    this.bullAngle *= 0.95;
    this.bullX = Phaser.Math.Clamp(this.bullX, 60, GAME_WIDTH - 60);
    this.bullY = Phaser.Math.Clamp(this.bullY, 250, 450);
    this.bull.setPosition(this.bullX, this.bullY).setRotation(this.bullAngle);
    this.bullShadow.setPosition(this.bullX, 460);
  },

  drawRope() {
    this.ropeGfx.clear();
    if (this.cowboyFlying) return;
    const alpha = GameState.isGripping ? 1 : 0.3;
    const width = GameState.isGripping ? 4 : 2;
    this.ropeGfx.lineStyle(width, COLORS.ropeTan, alpha);
    this.ropeGfx.beginPath();
    this.ropeGfx.moveTo(this.cowboy.x + 10, this.cowboy.y + 10);
    const midX = (this.cowboy.x + this.bullX) / 2;
    const midY = (this.cowboy.y + this.bullY) / 2 + (GameState.isGripping ? 5 : 20);
    this.ropeGfx.lineTo(midX, midY);
    this.ropeGfx.lineTo(this.bullX, this.bullY - 15);
    this.ropeGfx.strokePath();
  },

  updateGripMeter() {
    const pct = GameState.gripPercent / 100;
    const fillW = 196 * pct;
    this.gripFill.setDisplaySize(fillW, 18);
    this.gripFill.x = GAME_WIDTH / 2 - (196 - fillW) / 2;
    const color = pct > 0.5 ? COLORS.brightGreen : pct > 0.2 ? COLORS.goldYellow : COLORS.hotOrange;
    this.gripFill.setFillStyle(color);
  },

  triggerEjection() {
    if (this.ejecting || GameState.gameOver) return;
    this.ejecting = true;
    GameState.isGripping = false;
    this.cowboyFlying = true;
    this.cowboyVelX = this.bullVelX * 2 + Phaser.Math.Between(-3, 3);
    this.cowboyVelY = -12 + this.bullVelY;
    this.ropeGfx.clear();
    Effects.soundEjection();
    Effects.shake(this, 0.008, 300);
    Effects.dustPuff(this, this.bullX, 460);
    Effects.ejectionTrail(this, this.cowboy);
    Effects.desaturateFlash(this);
    this.time.delayedCall(400, () => {
      if (this.cowboy && this.cowboy.active) {
        Effects.floatingText(this, this.cowboy.x, this.cowboy.y - 20, 'WOOO!', '#FFFFFF', 24);
      }
    });
  },

  updateEjection(dt) {
    this.cowboyVelY += 20 * dt;
    this.cowboy.x += this.cowboyVelX * dt * 60;
    this.cowboy.y += this.cowboyVelY * dt * 60;
    this.cowboy.rotation += (this.cowboyVelX > 0 ? 1 : -1) * 5 * dt;
    if (this.cowboy.y > 470) {
      this.cowboy.y = 470;
      Effects.soundLand();
      Effects.shake(this, 0.012, 400);
      this.tweens.add({ targets: this.cowboy, scaleY: 0.4, duration: 100, yoyo: true });
      Effects.starOrbit(this, this.cowboy.x, this.cowboy.y - 30);
      this.endGame();
    }
    if (this.cowboy.x < 20 || this.cowboy.x > GAME_WIDTH - 20) {
      this.cowboyVelX *= -0.6;
      this.cowboy.x = Phaser.Math.Clamp(this.cowboy.x, 20, GAME_WIDTH - 20);
    }
    if (this.cowboy.y > GAME_HEIGHT + 50) this.endGame();
  },

  endGame() {
    if (GameState.gameOver) return;
    GameState.gameOver = true;
    const isNewRecord = GameState.score > GameState.highScore;
    if (isNewRecord) {
      GameState.highScore = GameState.score;
      setHighScore(GameState.score);
    }
    GameState.gamesPlayed++;
    this.time.delayedCall(500, () => {
      this.scene.launch('GameOverScene', {
        score: GameState.score, stage: GameState.stage, isNewRecord
      });
    });
  },

  onStageClear() {
    this.stageCleared = true;
    const stageBonus = SCORE.stageClear * GameState.stage;
    GameState.score += stageBonus;
    Effects.soundStageClear();
    Effects.shake(this, 0.004, 200);
    Effects.particleBurst(this, GAME_WIDTH / 2, GAME_HEIGHT / 3, 20, 'particle', 150);
    Effects.floatingText(this, GAME_WIDTH / 2, GAME_HEIGHT / 3, 'STAGE CLEAR! +' + stageBonus, COLORS_HEX.goldYellow, 22);
    Effects.scalePunch(this, this.scoreText, 1.5, 300);
    this.updateHUD();
    this.time.delayedCall(2000, () => {
      if (GameState.gameOver) return;
      GameState.stage++;
      this.bullVelX = 0; this.bullVelY = 0;
      this.cowboyFlying = false;
      GameState.isGripping = false;
      this.cowboyOffsetX = 0;
      this.loadStage(GameState.stage);
    });
  },

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) this.showPauseOverlay();
    else this.hidePauseOverlay();
  },

  showPauseOverlay() {
    this.pauseGroup = this.add.group();
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.darkBrown, 0.85).setDepth(200);
    this.pauseGroup.add(bg);
    const t = this.add.text(GAME_WIDTH / 2, 200, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial Black', fill: COLORS_HEX.goldYellow
    }).setOrigin(0.5).setDepth(201);
    this.pauseGroup.add(t);
    const btns = [
      { y: 300, label: 'RESUME', cb: () => this.togglePause() },
      { y: 370, label: 'HOW TO PLAY', cb: () => { this.scene.launch('HelpScene', { returnTo: 'GameScene' }); } },
      { y: 440, label: 'RESTART', cb: () => { this.scene.stop(); this.scene.start('GameScene'); } },
      { y: 510, label: 'QUIT TO MENU', cb: () => { this.scene.stop(); this.scene.start('MenuScene'); } }
    ];
    btns.forEach(b => {
      const r = this.add.rectangle(GAME_WIDTH / 2, b.y, 220, 50, COLORS.deepBlue)
        .setStrokeStyle(2, COLORS.warmTan).setInteractive({ useHandCursor: true }).setDepth(201);
      const txt = this.add.text(GAME_WIDTH / 2, b.y, b.label, {
        fontSize: '18px', fill: '#FFFFFF'
      }).setOrigin(0.5).setDepth(202);
      r.on('pointerdown', () => { Effects.soundButton(); b.cb(); });
      this.pauseGroup.add(r); this.pauseGroup.add(txt);
    });
  },

  hidePauseOverlay() {
    if (this.pauseGroup) {
      this.pauseGroup.clear(true, true);
      this.pauseGroup = null;
    }
  },

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
});
