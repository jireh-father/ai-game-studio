// Effects module - juice, particles, death, scoring visuals
// These are mixed into GameScene prototype

function initEffects(GameScene) {

  GameScene.prototype.doJump = function() {
    if (!this.player.body.touching.down && !this.onGround) return;
    const holdMs = this.time.now - this.jumpStartTime;
    const power = holdMs > CONFIG.HOLD_THRESHOLD_MS ? CONFIG.MAX_JUMP : CONFIG.SHORT_JUMP;
    this.player.body.setVelocityY(power);
    this.onGround = false;
    this.tweens.add({
      targets: this.player, scaleX: 1.3, scaleY: 0.6, duration: 40,
      yoyo: true, ease: 'Quad.easeOut'
    });
    this.emitDust(this.player.x, this.player.y + 16);
    SoundManager.playJump(holdMs > CONFIG.HOLD_THRESHOLD_MS);
    if (getSettings().vibration && navigator.vibrate) navigator.vibrate(20);
  };

  GameScene.prototype.onLandPlatform = function(player, platform) {
    if (this.isDead || !player.body.touching.down) return;
    this.onGround = true;
    const pd = platform.platData;
    this.tweens.add({ targets: player, scaleX: 1.4, scaleY: 0.7, duration: 50, yoyo: true });
    this.tweens.add({ targets: platform, alpha: 0.5, duration: 50, yoyo: true });
    SoundManager.playLand();

    if (pd.index !== this.lastPlatformIndex) {
      this.lastPlatformIndex = pd.index;
      this.addScore(CONFIG.SCORE.PLATFORM_LAND, player.x, player.y - 20);
      const edgeDist = Math.abs(player.x - platform.x);
      if (edgeDist > platform.displayWidth * 0.3) {
        this.combo++;
        if (this.combo >= 2) {
          this.addScore(CONFIG.SCORE.PERFECT_LAND * Math.min(this.combo, 8),
            player.x, player.y - 40, true);
          this.hud.showCombo(this.combo);
          SoundManager.playCombo(this.combo);
        }
      } else { this.combo = 0; }
      if (pd.landed && pd.sinking) {
        const remaining = pd.sinkMs - (this.time.now - pd.sinkStartTime);
        if (remaining < pd.sinkMs * 0.1 && remaining > 0) {
          this.addScore(CONFIG.SCORE.NEAR_MISS, player.x, player.y - 60, true);
          SoundManager.playNearMiss();
          this.cameras.main.shake(150, 0.002);
          if (getSettings().vibration && navigator.vibrate) navigator.vibrate(40);
        }
      }
    }
    if (!pd.landed) {
      pd.landed = true;
      if (pd.type === 'crumble') {
        this.emitCrumbleDebris(platform.x, platform.y);
        this.startSink(platform, pd.sinkMs * 0.25);
      } else {
        this.time.delayedCall(500, () => this.startSink(platform, pd.sinkMs));
      }
    }
  };

  GameScene.prototype.addScore = function(pts, x, y, isSpecial) {
    this.score += pts;
    this.hud.updateScore(this.score);
    const color = isSpecial ? CONFIG.COLORS.COMBO : '#FFFFFF';
    const sz = isSpecial ? '20px' : '16px';
    const txt = this.add.text(x, y, '+' + pts, {
      fontSize: sz, fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: color
    }).setOrigin(0.5).setDepth(50);
    if (isSpecial) {
      this.tweens.add({ targets: txt, scaleX: 1.4, scaleY: 1.4, duration: 80, yoyo: true });
    }
    this.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 600,
      onComplete: () => txt.destroy()
    });
  };

  GameScene.prototype.emitDust = function(x, y) {
    for (let i = 0; i < 6; i++) {
      const d = this.add.circle(x + (Math.random() - 0.5) * 10, y,
        2 + Math.random() * 2, 0xFFFFFF, 0.8).setDepth(9);
      this.tweens.add({
        targets: d,
        x: d.x + (Math.random() - 0.5) * 40,
        y: d.y - 30 - Math.random() * 50,
        alpha: 0, duration: 300,
        onComplete: () => d.destroy()
      });
    }
  };

  GameScene.prototype.emitCrumbleDebris = function(x, y) {
    for (let i = 0; i < 5; i++) {
      const d = this.add.rectangle(
        x + (Math.random() - 0.5) * 30, y,
        3, 6, Phaser.Display.Color.HexStringToColor(CONFIG.COLORS.DEBRIS).color
      ).setDepth(9);
      this.tweens.add({
        targets: d,
        x: d.x + (Math.random() - 0.5) * 60,
        y: d.y + 50 + Math.random() * 50,
        alpha: 0, angle: Math.random() * 180,
        duration: 400,
        onComplete: () => d.destroy()
      });
    }
  };

  GameScene.prototype.triggerDeath = function(reason) {
    if (this.isDead) return;
    this.isDead = true;

    // Screen shake + sound
    this.cameras.main.shake(350, 0.01);
    SoundManager.playDeath();
    SoundManager.stopAmbient();

    // Red flash
    const flash = this.add.rectangle(
      CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2,
      CONFIG.WIDTH, CONFIG.HEIGHT, 0xE63946, 0.6
    ).setScrollFactor(0).setDepth(90);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    // Player sinks
    this.player.body.setVelocity(0, 0);
    this.player.body.setGravityY(0);
    this.tweens.add({
      targets: this.player, y: this.player.y + 80, alpha: 0, duration: 500
    });

    // Haptic
    if (getSettings().vibration && navigator.vibrate) navigator.vibrate([50, 30, 50]);

    // Transition to game over
    this.time.delayedCall(700, () => {
      this.scene.launch('GameOverScene', { score: this.score, stage: this.currentStage });
      this.scene.pause('GameScene');
    });
  };

  GameScene.prototype.startSink = function(platform, duration) {
    const pd = platform.platData;
    if (pd.sinking) return;
    pd.sinking = true;
    pd.sinkStartTime = this.time.now;
    SoundManager.playSink();
    this.tweens.add({
      targets: platform, angle: 8, y: platform.y + 80, alpha: 0,
      duration: duration, ease: 'Quad.easeIn',
      onComplete: () => this.recyclePlatform(platform)
    });
  };

  GameScene.prototype.recyclePlatform = function(p) {
    p.setActive(false).setVisible(false);
    p.body.enable = false;
    const idx = this.activePlatforms.indexOf(p);
    if (idx > -1) this.activePlatforms.splice(idx, 1);
  };

  GameScene.prototype.completeStage = function() {
    const pts = CONFIG.SCORE.STAGE_CLEAR * this.currentStage;
    this.addScore(pts, this.player.x, this.player.y - 50, true);

    // Star burst particles
    for (let i = 0; i < 20; i++) {
      const star = this.add.text(this.player.x, this.player.y, '\u2605', {
        fontSize: '16px', color: CONFIG.COLORS.COMBO
      }).setOrigin(0.5).setDepth(50);
      const angle = (i / 20) * Math.PI * 2;
      const speed = 120 + Math.random() * 80;
      this.tweens.add({
        targets: star,
        x: star.x + Math.cos(angle) * speed,
        y: star.y + Math.sin(angle) * speed,
        alpha: 0, duration: 600,
        onComplete: () => star.destroy()
      });
    }

    SoundManager.playStageClear();

    this.currentStage++;
    this.hud.updateStage(this.currentStage);
    this.waterY = Math.max(this.waterY, this.player.y + 200);
    this.loadStage(this.currentStage);
  };
}
