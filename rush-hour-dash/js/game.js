// Rush Hour Dash - Core Game Scene
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    GameState.reset();
    this.isDead = false;
    this.isHopping = false;
    this.pendingHop = false;
    this.stageTransitioning = false;
    this.lastInputTime = Date.now();
    this.lanes = [];
    this.vehicleSprites = [];
    this.coinSprites = [];
    this.laneIndex = 0;
    this.scrollOffset = 0;

    this.roadBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.road).setDepth(0);
    this.player = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - HUD_HEIGHT - 96, 'player').setDepth(5);

    // Death wall
    this.deathWall = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 6, GAME_WIDTH, 12, COLORS.deathWall).setDepth(7);
    this.deathWallGlow = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 6, GAME_WIDTH, 24, COLORS.deathWallGlow).setAlpha(0.4).setDepth(6);
    this.deathWallScreenY = GAME_HEIGHT;
    this.tweens.add({ targets: this.deathWallGlow, alpha: 0.3, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.laneDividers = this.add.graphics().setDepth(1);
    for (var i = 0; i < 12; i++) this.spawnLane();

    this.input.on('pointerdown', this.onTap, this);
    this.scene.launch('UIScene');
    this.scrollSpeed = SCROLL_BASE;

    this.visHandler = function() {
      if (document.hidden) {
        var ui = this.scene.get('UIScene');
        if (ui && !ui.isPaused && !this.isDead) ui.togglePause();
      }
    }.bind(this);
    document.addEventListener('visibilitychange', this.visHandler);
  }

  update(time, delta) {
    if (this.isDead) return;
    var dt = Math.min(delta / 1000, 0.1);

    if (Date.now() - this.lastInputTime > INACTIVITY_DEATH_MS) { this.onDeath('crush'); return; }

    this.scrollSpeed = getScrollSpeed(GameState.hops);
    var sd = this.scrollSpeed * dt;
    this.scrollOffset += sd;

    this.deathWallScreenY -= sd;
    if (this.deathWallScreenY < HUD_HEIGHT) this.deathWallScreenY = HUD_HEIGHT;
    this.deathWall.setY(this.deathWallScreenY);
    this.deathWallGlow.setY(this.deathWallScreenY - 6);

    this.updateLanes(sd, dt);

    if (this.deathWallScreenY <= this.player.y + 10) { this.onDeath('crush'); return; }

    var gap = this.deathWallScreenY - this.player.y;
    this.events.emit('dangerUpdate', gap < LANE_HEIGHT * 3 && gap > 0 ? Math.min(0.3, (1 - gap / (LANE_HEIGHT * 3)) * 0.3) : 0);

    while (this.needsMoreLanes()) this.spawnLane();
    this.cleanupLanes();
    this.drawLaneDividers();
  }

  onTap(pointer) {
    if (this.isDead || pointer.y < HUD_HEIGHT) return;
    this.lastInputTime = Date.now();
    if (this.isHopping) { if (!this.pendingHop) this.pendingHop = true; return; }
    this.doHop();
  }

  doHop() {
    if (this.isDead) return;
    this.isHopping = true;
    var fromY = this.player.y;
    var targetY = Math.max(HUD_HEIGHT + 20, this.player.y - LANE_HEIGHT);
    var self = this;

    this.tweens.add({
      targets: this.player,
      y: { value: targetY, duration: HOP_DURATION, ease: 'Sine.easeOut' },
      onComplete: function() {
        self.isHopping = false;
        self.onHopLanded(fromY);
        if (self.pendingHop && !self.isDead) { self.pendingHop = false; self.doHop(); }
      }
    });
    this.hopTrail(fromY);
    this.hopNudge();
    this.playSound('hop');
  }

  onHopLanded(fromY) {
    GameState.hops++;
    var now = Date.now();
    GameState.combo = (now - GameState.lastHopTime <= COMBO_WINDOW) ? GameState.combo + 1 : 1;
    GameState.lastHopTime = now;
    GameState.comboMultiplier = GameState.combo >= 10 ? 2.0 : GameState.combo >= 5 ? 1.5 : GameState.combo >= 2 ? 1.2 : 1.0;

    GameState.addScore(SCORE_VALUES.HOP);
    this.floatingText(this.player.x + 20, this.player.y - 10, '+' + Math.floor(SCORE_VALUES.HOP * GameState.comboMultiplier), '#FFFFFF', 14);

    var newStage = Math.floor(GameState.hops / 10) + 1;
    if (newStage > GameState.stage && !this.stageTransitioning) {
      this.stageTransitioning = true;
      GameState.stage = newStage;
      this.events.emit('stageUpdate', GameState.stage);
      GameState.addScore(SCORE_VALUES.MILESTONE);
      this.floatingText(this.player.x, this.player.y - 40, '+100 MILESTONE!', COLORS_STR.gold, 20);
      this.milestoneFlash();
      this.playSound('milestone');
      var self = this;
      this.time.delayedCall(200, function() { self.stageTransitioning = false; });
    }

    this.hopSquish();
    this.checkVehicleCollision();
    this.checkCoinCollection();
    this.events.emit('scoreUpdate', GameState.score);
    this.events.emit('hopUpdate', GameState.hops);
    this.events.emit('comboUpdate', GameState.combo);
  }

  checkVehicleCollision() {
    if (this.isDead) return;
    var px = this.player.x, py = this.player.y, phw = PLAYER_HITBOX / 2;
    for (var i = 0; i < this.vehicleSprites.length; i++) {
      var v = this.vehicleSprites[i];
      if (!v.active) continue;
      if (Math.abs(px - v.x) < phw + (v.displayWidth - 8) / 2 && Math.abs(py - v.y) < phw + (v.displayHeight - 8) / 2) {
        this.onDeath('vehicle'); return;
      }
    }
  }

  checkCoinCollection() {
    var px = this.player.x, py = this.player.y;
    for (var i = this.coinSprites.length - 1; i >= 0; i--) {
      var c = this.coinSprites[i];
      if (!c.active) continue;
      if (Math.abs(px - c.x) < 30 && Math.abs(py - c.y) < 30) {
        GameState.addScore(SCORE_VALUES.COIN);
        this.coinParticles(c.x, c.y);
        this.floatingText(c.x, c.y - 20, '+50', COLORS_STR.gold, 18);
        this.playSound('coin');
        c.destroy(); this.coinSprites.splice(i, 1);
        this.events.emit('scoreUpdate', GameState.score);
      }
    }
  }

  onDeath(type) {
    if (this.isDead) return;
    this.isDead = true;
    GameState.isDead = true;
    if (type === 'vehicle') this.deathVehicleHit(); else this.deathCrush();
    var isNewRecord = GameState.saveHighScore();
    var self = this;
    this.time.delayedCall(600, function() {
      self.scene.stop('UIScene');
      self.scene.launch('GameOverScene', { score: GameState.score, hops: GameState.hops, stage: GameState.stage, isNewRecord: isNewRecord });
    });
  }

  onContinue() {
    this.isDead = false; GameState.isDead = false;
    this.lastInputTime = Date.now();
    this.deathWallScreenY = this.player.y + LANE_HEIGHT * 4;
    this.deathWall.setY(this.deathWallScreenY);
    this.deathWallGlow.setY(this.deathWallScreenY - 6);
    if (this.player) this.player.setScale(1).setAngle(0).clearTint().setAlpha(1);
    this.scene.launch('UIScene');
  }

  shutdown() {
    this.tweens.killAll(); this.time.removeAllEvents();
    if (this.visHandler) document.removeEventListener('visibilitychange', this.visHandler);
  }
}

// Mix in effects and lane management
Object.assign(GameScene.prototype, GameEffects, LaneManager);
