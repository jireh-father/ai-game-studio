// Wrong Map - Juice Effects (mixed into GameScene prototype)
Object.assign(GameScene.prototype, {

  flashTile: function(tx, ty) {
    const tile = this.tileSprites[ty] && this.tileSprites[ty][tx];
    if (!tile) return;
    const origColor = this.roomData.true_grid[ty][tx] === 1 ? CONFIG.COLORS.WALL : CONFIG.COLORS.FLOOR;
    tile.setFillStyle(CONFIG.COLORS.TILE_FLASH);
    this.time.delayedCall(60, () => tile.setFillStyle(origColor));
  },

  playMoveParticles: function(x, y) {
    for (let i = 0; i < 3; i++) {
      const p = this.add.image(x, y, 'particle').setScale(0.6).setAlpha(0.8).setDepth(8);
      this.tweens.add({
        targets: p,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        alpha: 0, scale: 0,
        duration: 200,
        onComplete: () => p.destroy()
      });
    }
  },

  playScalePunch: function(target, scale, duration) {
    this.tweens.add({
      targets: target,
      scaleX: target.scaleX * scale / 1,
      scaleY: target.scaleY * scale / 1,
      duration: duration / 2,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  },

  playExitEffect: function(x, y, points) {
    // Camera zoom
    this.cameras.main.zoomTo(1.05, 150, 'Power2', true);
    this.time.delayedCall(150, () => this.cameras.main.zoomTo(1, 150));

    // Green particle burst
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const p = this.add.image(x, y, 'particle_green').setScale(0.8).setAlpha(1).setDepth(15);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0, scale: 0,
        duration: 400,
        onComplete: () => p.destroy()
      });
    }

    // Floating score text
    this.showFloatingScore(x, y - 10, '+' + points);

    // HUD streak punch
    if (this.scene.isActive('HUDScene')) {
      this.scene.get('HUDScene').events.emit('streakPunch');
      this.scene.get('HUDScene').events.emit('scorePunch');
    }

    // Hit-stop
    this.hitStop(120);
  },

  playWallHitEffect: function(wx, wy) {
    const px = this.gridOffsetX + wx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    const py = this.gridOffsetY + wy * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    // Flash wall tile red briefly
    const flash = this.add.rectangle(px, py, CONFIG.TILE_SIZE - 2, CONFIG.TILE_SIZE - 2, CONFIG.COLORS.DANGER, 0.8).setDepth(12);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
  },

  playWallDeathEffect: function() {
    // Hit-stop
    this.hitStop(80);

    // Screen shake
    this.cameras.main.shake(300, 0.015);

    // Red flash overlay
    const flash = this.add.rectangle(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT,
      CONFIG.COLORS.DANGER, 0
    ).setDepth(50);
    this.tweens.add({
      targets: flash, alpha: 0.7, duration: 125, yoyo: true,
      onComplete: () => flash.destroy()
    });

    // Player fragment explosion
    this.playerExplode(this.player.x, this.player.y, CONFIG.COLORS.PLAYER);
    this.player.setAlpha(0);

    // Camera zoom out
    this.cameras.main.zoomTo(0.95, 150, 'Power2', true);
    this.time.delayedCall(150, () => this.cameras.main.zoomTo(1, 150));
  },

  playGhostDeathEffect: function() {
    // Ghost absorb pulse
    this.tweens.add({
      targets: this.ghost, scaleX: 2, scaleY: 2, alpha: 0, duration: 400
    });

    // Screen shake
    this.cameras.main.shake(400, 0.02);

    // Purple flash overlay
    const flash = this.add.rectangle(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT,
      CONFIG.COLORS.GHOST, 0
    ).setDepth(50);
    this.tweens.add({
      targets: flash, alpha: 0.6, duration: 150, yoyo: true,
      onComplete: () => flash.destroy()
    });

    this.player.setAlpha(0);
  },

  playerExplode: function(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const frag = this.add.rectangle(x, y, 6, 6, color).setDepth(15);
      this.tweens.add({
        targets: frag,
        x: x + Math.cos(angle) * 80,
        y: y + Math.sin(angle) * 80,
        alpha: 0, rotation: Math.PI * 2,
        duration: 400,
        onComplete: () => frag.destroy()
      });
    }
  },

  hitStop: function(ms) {
    // Use setTimeout since Phaser timers don't run at timeScale 0
    const prevTimeScale = this.time.timeScale;
    this.time.timeScale = 0.001;
    setTimeout(() => {
      if (this.time) this.time.timeScale = prevTimeScale || 1;
    }, ms);
  },

  showFloatingScore: function(x, y, text) {
    const txt = this.add.text(x, y, text, {
      fontSize: '20px', fontStyle: 'bold', color: CONFIG.HEX.SCORE_POPUP
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: txt, y: y - 50, alpha: 0,
      duration: 600, ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  },

  playGhostSpawnEffect: function() {
    // Ghost appear particles
    const gp = this.tileToPixel(this.ghostTile.x, this.ghostTile.y);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const p = this.add.rectangle(gp.x + Math.cos(angle) * 30, gp.y + Math.sin(angle) * 30, 4, 4, CONFIG.COLORS.GHOST).setDepth(8);
      this.tweens.add({
        targets: p, x: gp.x, y: gp.y, alpha: 0,
        duration: 300,
        onComplete: () => p.destroy()
      });
    }
  },

  playMilestoneWarning: function() {
    const border = this.add.rectangle(
      CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH - 4, CONFIG.GAME_HEIGHT - 4,
      0x000000, 0
    ).setStrokeStyle(3, CONFIG.COLORS.DANGER).setDepth(30);
    this.tweens.add({
      targets: border, alpha: 0, duration: 500, delay: 500,
      onComplete: () => border.destroy()
    });
  }
});
