class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    var w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0D1B2A);

    this.score = 0;
    this.stage = 1;
    this.lives = MAX_LIVES;
    this.combo = 0;
    this.bestCombo = 0;
    this.activeItems = [];
    this.splatDecals = [];
    this.waveIndex = 0;
    this.wave = [];
    this.stageTransitioning = false;
    this.gameOver = false;
    this.paused = false;
    this.hitStopped = false;
    this.stageMisses = 0;
    this.lastInputTime = Date.now();
    this.pauseOverlay = null;

    this.createHUD();

    this.add.circle(w / 2, h * 0.35, 6, 0x1B2838, 0.5).setDepth(1);
    this.input.on('pointerdown', this.onTap, this);
    this.visHandler = this.onVisChange.bind(this);
    document.addEventListener('visibilitychange', this.visHandler);
    this.loadStage();
  }

  loadStage() {
    this.wave = getWave(this.stage);
    this.waveIndex = 0;
    this.stageMisses = 0;
    this.stageTransitioning = false;
    this.updateHUD();
    this.scheduleNext();
  }

  scheduleNext() {
    if (this.gameOver || this.stageTransitioning) return;
    if (this.waveIndex >= this.wave.length) {
      this.checkStageComplete();
      return;
    }
    var diff = getDifficulty(this.stage);
    var delay = this.waveIndex === 0 ? 800 : diff.spawnInterval;
    this.spawnTimer = this.time.delayedCall(delay, this.spawnNextItem, [], this);
  }

  spawnNextItem() {
    if (this.gameOver || this.stageTransitioning) return;
    if (this.waveIndex >= this.wave.length) {
      this.checkStageComplete();
      return;
    }
    var entry = this.wave[this.waveIndex];
    this.waveIndex++;
    this.spawnItem(entry);
    this.scheduleNext();
  }

  spawnItem(entry) {
    var w = this.scale.width, h = this.scale.height;
    var cx = w / 2 + (Math.random() - 0.5) * w * 0.3;
    var cy = h * 0.35;
    var diff = getDifficulty(this.stage);
    var texKey = entry.foodKey === 'bomb' ? 'bomb' : entry.foodKey;

    var item = this.add.image(cx, cy, texKey).setScale(0.15).setDepth(10);
    item.foodEntry = entry;
    item.tappable = false;
    item.missed = false;

    var endX = 40 + Math.random() * (w - 80);
    var endY = h * 0.55 + Math.random() * (h * 0.3);
    var self = this;

    item.approachTween = this.tweens.add({
      targets: item,
      scaleX: 2.0, scaleY: 2.0,
      x: endX, y: endY,
      duration: diff.approachTime,
      ease: 'Quad.easeIn',
      onUpdate: function() {
        if (item.scaleX >= 0.7) item.tappable = true;
      },
      onComplete: function() {
        if (!item.missed && !self.gameOver) self.itemMissed(item);
      }
    });

    if (entry.type === 'bomb') {
      this.tweens.add({ targets: item, alpha: 0.7, duration: 200, yoyo: true, repeat: -1 });
    }
    this.activeItems.push(item);
  }

  onTap(pointer) {
    if (this.gameOver || this.paused) return;
    this.lastInputTime = Date.now();
    if (pointer.y < 48) return;

    var hitItem = null, hitDist = Infinity;
    for (var i = this.activeItems.length - 1; i >= 0; i--) {
      var item = this.activeItems[i];
      if (!item.active || !item.tappable || item.missed) continue;
      var size = 24 * item.scaleX * 1.1;
      var dx = pointer.x - item.x, dy = pointer.y - item.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < size && dist < hitDist) { hitItem = item; hitDist = dist; }
    }
    if (hitItem) {
      hitItem.foodEntry.type === 'bomb' ? this.tapBomb(hitItem) : this.smashItem(hitItem);
    }
  }

  smashItem(item) {
    var foodType = FOOD_TYPES.find(function(f) { return f.key === item.foodEntry.foodKey; });
    var color = foodType ? foodType.splatColor : 0xE63946;
    this.combo++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    var mult = COMBO_MULTIPLIERS[Math.min(this.combo, COMBO_MULTIPLIERS.length - 1)];
    var pts = SCORE_VALUES.base * mult;
    this.score += pts;

    var pCount = this.combo >= 15 ? 36 : this.combo >= 10 ? 28 : this.combo >= 5 ? 20 : 14;
    var pLife = this.combo >= 15 ? 700 : this.combo >= 10 ? 600 : this.combo >= 5 ? 500 : 350;
    this.spawnParticles(item.x, item.y, color, pCount, pLife);

    var zoom = this.combo >= 15 ? 1.08 : this.combo >= 10 ? 1.06 : 1.04;
    this.cameraPunch(zoom, 40);

    var txtColor = this.combo >= 10 ? '#FF6B35' : this.combo >= 5 ? '#FFD166' : '#FFFFFF';
    this.floatingText(item.x, item.y - 20, '+' + pts, txtColor);
    if (this.combo >= 5) {
      this.floatingText(item.x + 30, item.y, 'x' + mult + '!', COLORS.comboGold, '18px');
    }

    this.hitStop(40);
    this.shakeCamera(0.003, 80);
    this.removeItem(item);
    this.updateHUD();
    if (this.combo >= 15) this.flashEdge(0xFF6B35, 200);
  }

  tapBomb(bomb) {
    this.combo = 0;
    this.lives--;
    this.spawnParticles(bomb.x, bomb.y, 0x1A1A2E, 8, 500);
    this.shakeCamera(0.01, 300);
    this.flashEdge(0xFF6B35, 150);

    var w = this.scale.width, h = this.scale.height;
    var flash = this.add.rectangle(w / 2, h / 2, w, h, 0xFFFFFF, 0.8).setDepth(80);
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: function() { flash.destroy(); } });
    this.removeItem(bomb);
    this.updateLifeDisplay();
    this.updateHUD();
    if (this.lives <= 0) this.triggerDeath();
  }

  itemMissed(item) {
    if (item.missed || this.gameOver) return;
    item.missed = true;
    if (item.foodEntry.type === 'bomb') {
      this.score += SCORE_VALUES.bombAvoided;
      this.floatingText(item.x, item.y, '+5', '#52B788', '16px');
      this.removeItem(item);
      this.updateHUD();
      return;
    }
    this.combo = 0;
    this.lives--;
    this.stageMisses++;
    var foodType = FOOD_TYPES.find(function(f) { return f.key === item.foodEntry.foodKey; });
    this.addSplatDecal(item.x, item.y, foodType ? foodType.splatColor : 0xE63946);
    this.flashEdge(0xE63946, 300);
    this.shakeCamera(0.005, 200);
    this.removeItem(item);
    this.updateLifeDisplay();
    this.updateHUD();
    if (this.lives <= 0) this.triggerDeath();
  }

  removeItem(item) {
    if (item.approachTween) item.approachTween.stop();
    var idx = this.activeItems.indexOf(item);
    if (idx > -1) this.activeItems.splice(idx, 1);
    item.destroy();
  }

  checkStageComplete() {
    if (this.stageTransitioning || this.gameOver) return;
    if (this.activeItems.length > 0) {
      this.time.delayedCall(200, this.checkStageComplete, [], this);
      return;
    }
    this.stageTransitioning = true;
    if (this.stageMisses === 0) {
      this.score += SCORE_VALUES.perfectStage;
      this.floatingText(this.scale.width / 2, this.scale.height / 2 - 80, 'PERFECT! +50', COLORS.perfect, '24px');
      this.spawnParticles(this.scale.width / 2, this.scale.height / 2, 0xFFD166, 20, 600);
    }
    this.stageClearEffect();
    this.updateHUD();
    this.stage++;
    this.time.delayedCall(1200, this.loadStage, [], this);
  }

  triggerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.shakeCamera(0.015, 400);
    if (this.spawnTimer) this.spawnTimer.remove();
    this.activeItems.forEach(function(item) { if (item.approachTween) item.approachTween.stop(); });

    var isNew = this.score > GameState.highScore;
    if (isNew) { GameState.highScore = this.score; saveHighScore(); }

    var self = this;
    this.time.delayedCall(500, function() {
      self.scene.launch('GameOverScene', { score: self.score, stage: self.stage, isNewRecord: isNew });
    });
  }

  continueFromDeath() {
    this.gameOver = false;
    this.lives = 1;
    this.updateLifeDisplay();
    this.updateHUD();
    this.scheduleNext();
  }

  onVisChange() {
    if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
  }

  update() {
    if (!this.gameOver && !this.paused && Date.now() - this.lastInputTime > INACTIVITY_TIMEOUT) {
      this.triggerDeath();
    }
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}

Object.assign(GameScene.prototype, GameEffects);
Object.assign(GameScene.prototype, GameHUD);
