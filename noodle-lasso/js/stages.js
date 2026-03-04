// stages.js — Stage generation, difficulty scaling, quota tracking

class StageManager {
  constructor(scene) {
    this.scene = scene;
    this.currentStage = 0;
    this.caught = 0;
    this.quota = 0;
    this.params = null;
    this.spawnTimer = null;
    this.spawnQueue = 0;
  }

  startStage(n) {
    this.currentStage = n;
    this.caught = 0;
    this.params = getStageParams(n);
    this.quota = this.params.quota;
    this.spawnQueue = 0;

    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }

    this.scene.clearAllIngredients();
    this.scene.hud.updateStage(n);
    this.scene.hud.updateProgress(0, this.quota);

    if (this.params.isRest) {
      this.scene.showStageText('REST STAGE', PALETTE.floor);
    } else if (this.params.isGold) {
      this.scene.showStageText('GOLD RUSH!', PALETTE.secondary);
    } else if (n > 1) {
      this.scene.showStageText('STAGE ' + n, PALETTE.reward);
    }

    // Delay first spawn slightly
    this.scene.time.delayedCall(n === 1 ? 800 : 500, () => {
      this.beginSpawning();
    });
  }

  beginSpawning() {
    if (!this.params) return;
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.params.interval,
      callback: () => this.spawnWave(),
      loop: true
    });
    this.spawnWave();
  }

  spawnWave() {
    if (!this.params) return;
    const count = Math.min(this.params.simCount, 3);
    // Stagger spawns slightly within wave
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(i * 120, () => {
        if (this.scene && this.scene.gameActive) {
          this.spawnOne();
        }
      });
    }
  }

  spawnOne() {
    if (!this.params) return;
    const types = this.params.isGold
      ? [INGREDIENT_TYPES.find(t => t.id === 'goldstar')]
      : this.params.types;
    const type = types[Math.floor(Math.random() * types.length)];
    const x = 30 + Math.random() * (GAME_WIDTH - 60);
    this.scene.spawnIngredient(x, type, this.params.speed);
  }

  onCatch() {
    this.caught++;
    this.scene.hud.updateProgress(this.caught, this.quota);
    if (this.caught >= this.quota) {
      this.onStageComplete();
    }
  }

  onStageComplete() {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }

    const bonus = SCORE_VALUES.stageClearBonus(this.currentStage);
    this.scene.addScore(bonus, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    AudioManager.play('stageClear');

    // Stage clear effects
    this.scene.cameras.main.shake(200, 0.004);
    this.scene.showStageText('STAGE CLEAR!', PALETTE.reward);

    // Fireworks particles
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const px = 60 + Math.random() * (GAME_WIDTH - 120);
        const py = 100 + Math.random() * 200;
        this.scene.burstParticles(px, py, 10,
          [PALETTE.primary, PALETTE.secondary, PALETTE.reward][i]);
      });
    }

    this.scene.time.delayedCall(900, () => {
      if (this.scene.gameActive) {
        this.startStage(this.currentStage + 1);
      }
    });
  }

  getSpeedMultiplier() {
    return this.params ? this.params.speed : 1.0;
  }

  destroy() {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }
  }
}
