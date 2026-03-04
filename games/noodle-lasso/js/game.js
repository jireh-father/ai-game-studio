// game.js — Core gameplay scene: input, spawning, game state

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(PALETTE.background);
    AudioManager.init();
    AudioManager.resume();

    // Game state
    this.score = 0;
    this.misses = 0;
    this.combo = 0;
    this.gameActive = true;
    this.lastTapTime = this.time.now;
    this.idleWarned = false;
    this.isPaused = false;

    // Lasso state
    this.lassoState = 'IDLE';
    this.lassoProgress = 0;
    this.lassoTargetX = CHEF_POS.x;
    this.lassoTargetY = CHEF_POS.y - 200;
    this.lassoCaughtIngredient = null;
    this.lassoWobbleTime = 0;

    // Decorative floor tiles
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      const shade = (x / 40) % 2 === 0 ? 0xFFF8F0 : 0xFDDBB4;
      this.add.rectangle(x + 20, FLOOR_Y + 30, 40, 60, shade);
    }

    // Floor line
    this.add.rectangle(GAME_WIDTH / 2, FLOOR_Y, GAME_WIDTH, 4,
      Phaser.Display.Color.HexStringToColor(PALETTE.floor).color);

    // Bowl
    const bowlGfx = this.add.graphics();
    bowlGfx.fillStyle(0xFDDBB4);
    bowlGfx.fillRoundedRect(BOWL_POS.x - 35, BOWL_POS.y - 8, 70, 20, 6);
    bowlGfx.lineStyle(2, 0x1D1D1B);
    bowlGfx.strokeRoundedRect(BOWL_POS.x - 35, BOWL_POS.y - 8, 70, 20, 6);

    // Chef
    this.chef = this.add.image(CHEF_POS.x, CHEF_POS.y, 'chef').setDepth(10);

    // Lasso graphics
    this.lassoGfx = this.add.graphics().setDepth(9);

    // Ingredients pool
    this.ingredients = [];

    // Flash overlay
    this.flashOverlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0).setDepth(500);

    // HUD and Stage manager
    this.hud = new HUDManager(this);
    this.stageManager = new StageManager(this);

    // Input
    this.input.on('pointerdown', (pointer) => this.onTap(pointer));

    // Start stage 1
    this.stageManager.startStage(1);
  }

  onTap(pointer) {
    if (!this.gameActive || this.isPaused) return;

    // Pause on chef tap
    const dx = pointer.x - CHEF_POS.x;
    const dy = pointer.y - CHEF_POS.y;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 35 && this.lassoState === 'IDLE') {
      this.togglePause();
      return;
    }

    this.lastTapTime = this.time.now;
    this.idleWarned = false;
    if (this.lassoState !== 'IDLE') return;

    AudioManager.play('whoosh');
    this.tweens.add({
      targets: this.chef, scaleX: 0.95, scaleY: 1.05, duration: 80, yoyo: true
    });

    // Auto-aim toward nearest ingredient
    const biasX = pointer.x;
    const targetY = Math.max(60, CHEF_POS.y - 300);
    let bestTarget = null;
    let bestDist = 250;
    this.ingredients.forEach(ing => {
      if (!ing.active) return;
      const d = Phaser.Math.Distance.Between(biasX, targetY, ing.x, ing.y);
      if (d < bestDist) { bestDist = d; bestTarget = ing; }
    });

    this.lassoTargetX = bestTarget ? bestTarget.x : biasX;
    this.lassoTargetY = bestTarget ? bestTarget.y : targetY;
    this.lassoState = 'EXTENDING';
    this.lassoProgress = 0;
    this.lassoWobbleTime = 0;

    Effects.burstParticles(this, CHEF_POS.x, CHEF_POS.y - 20, 6, PALETTE.noodle);
  }

  update(time, delta) {
    if (!this.gameActive || this.isPaused) return;

    // Idle check
    const idleTime = time - this.lastTapTime;
    if (idleTime > IDLE_WARNING_MS && !this.idleWarned) {
      this.idleWarned = true;
      Effects.showIdleWarning(this);
    }
    if (idleTime > IDLE_DEATH_MS) { this.triggerDeath(); return; }

    LassoRenderer.update(this, delta);
    this.updateIngredients(delta);
    LassoRenderer.draw(this);
  }

  updateIngredients(_delta) {
    // Ingredients are moved by tweens, nothing to do per-frame
  }

  spawnIngredient(x, type, speed) {
    if (!this.gameActive) return;
    const img = this.add.image(x, SPAWN_Y, type.id).setDepth(5);
    img.ingredientType = type;
    img.active = true;
    img.spawnTime = this.time.now;

    const fallDuration = (FLOOR_Y - SPAWN_Y) / (speed * 0.12) * 10;
    img.fallTween = this.tweens.add({
      targets: img, y: FLOOR_Y, duration: Math.max(fallDuration, 800),
      ease: 'Linear',
      onComplete: () => { if (img.active) this.onIngredientMiss(img); }
    });

    if (type.fallPattern === 'zigzag') {
      img.zigzagTween = this.tweens.add({
        targets: img, x: x + (Math.random() > 0.5 ? 50 : -50),
        duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }
    this.ingredients.push(img);
  }

  onIngredientCatch(ingredient) {
    if (!ingredient.active) return;
    ingredient.active = false;
    this.combo++;

    const mult = SCORE_VALUES.comboMultipliers[Math.min(this.combo, 4)];
    let points = Math.round(ingredient.ingredientType.points * mult);
    if (this.time.now - ingredient.spawnTime < 500) points += SCORE_VALUES.speedBonus;

    this.addScore(points, ingredient.x, ingredient.y);
    this.stageManager.onCatch();
    this.hud.showCombo(this.combo);
    Effects.catchEffects(this, ingredient, this.combo);
  }

  onIngredientMiss(ingredient) {
    if (!ingredient.active) return;
    ingredient.active = false;
    this.combo = 0;
    this.misses++;
    this.hud.updateMisses(this.misses);
    Effects.missEffects(this, ingredient);
    if (this.misses >= MAX_MISSES) this.triggerDeath();
  }

  triggerDeath() {
    if (!this.gameActive) return;
    this.gameActive = false;
    Effects.deathEffects(this);
    this.stageManager.destroy();

    this.time.delayedCall(DEATH_EFFECT_MS, () => {
      AdsManager.showInterstitial(() => {
        this.scene.start('GameOverScene', {
          score: this.score,
          stage: this.stageManager.currentStage
        });
      });
    });
  }

  addScore(points, x, y) {
    this.score += points;
    this.hud.updateScore(this.score);
    Effects.floatingScore(this, x, y, points);
  }

  clearAllIngredients() {
    this.ingredients.forEach(ing => {
      if (ing.fallTween) ing.fallTween.stop();
      if (ing.zigzagTween) ing.zigzagTween.stop();
      this.time.delayedCall(0, () => { if (ing && ing.scene) ing.destroy(); });
    });
    this.ingredients = [];
  }

  removeIngredient(ing) {
    const idx = this.ingredients.indexOf(ing);
    if (idx >= 0) this.ingredients.splice(idx, 1);
    if (ing && ing.scene) ing.destroy();
  }

  // Delegate to Effects
  showStageText(text, color) { Effects.showStageText(this, text, color); }
  burstParticles(x, y, count, color) { Effects.burstParticles(this, x, y, count, color); }

  togglePause() {
    if (this.isPaused) this.resumeGame();
    else this.pauseGame();
  }

  pauseGame() {
    this.isPaused = true;
    this.tweens.pauseAll();
    if (this.stageManager.spawnTimer) this.stageManager.spawnTimer.paused = true;

    const els = [];
    els.push(this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2,
      GAME_WIDTH, GAME_HEIGHT, 0x1D1D1B, 0.6).setInteractive().setDepth(2000));
    els.push(this.add.text(GAME_WIDTH/2, 200, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(2001));

    const btns = [
      { text: 'RESUME', color: 0x2DC653, y: 320, action: () => this.resumeGame() },
      { text: 'RESTART', color: 0xFFB703, y: 390, action: () => {
        this.destroyPause(); this.scene.restart();
      }},
      { text: 'MENU', color: 0x999999, y: 460, action: () => {
        this.destroyPause(); this.scene.start('MenuScene');
      }}
    ];
    btns.forEach(b => {
      const bg = this.add.rectangle(GAME_WIDTH/2, b.y, 180, 50, b.color)
        .setStrokeStyle(2, 0x1D1D1B).setInteractive().setDepth(2001);
      const txt = this.add.text(GAME_WIDTH/2, b.y, b.text, {
        fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
      }).setOrigin(0.5).setDepth(2002);
      bg.on('pointerdown', () => { AudioManager.play('click'); b.action(); });
      els.push(bg, txt);
    });
    this.pauseElements = els;
  }

  resumeGame() {
    this.isPaused = false;
    this.lastTapTime = this.time.now;
    this.tweens.resumeAll();
    if (this.stageManager.spawnTimer) this.stageManager.spawnTimer.paused = false;
    this.destroyPause();
  }

  destroyPause() {
    if (this.pauseElements) {
      this.pauseElements.forEach(e => e.destroy());
      this.pauseElements = null;
    }
  }
}
