// Lag Shot - Entity Management (enemies, bullets) mixed into GameScene prototype
const GameEntities = {
  spawnEnemy(type, pos, waveParams) {
    const cfg = ENEMY_TYPES[type];
    const enemy = this.add.image(pos.x, pos.y, cfg.key).setDepth(8);
    enemy.enemyType = type;
    enemy.hp = cfg.hp;
    enemy.color = cfg.color;
    enemy.arcProgress = 0;
    enemy.arcDuration = waveParams.arcDurationMs;
    enemy.arcStart = { x: pos.x, y: pos.y };
    enemy.arcEnd = { x: this.player.x, y: this.player.y };
    const arc = computeArc(pos.x, pos.y, this.player.x, this.player.y, waveParams.arcPredictability);
    enemy.arcCP1 = { x: arc.cp1x, y: arc.cp1y };
    enemy.arcCP2 = { x: arc.cp2x, y: arc.cp2y };
    enemy.arcPaused = false;
    if (type === 'zigzag') {
      enemy.zigzagPhase = 0;
      enemy.zigzagAmp = 30 + Math.random() * 20;
    }
    this.enemies.add(enemy);
    this.enemiesAlive++;
  },

  spawnSplitterChildren(x, y) {
    for (let i = 0; i < 2; i++) {
      const child = this.add.image(x + (i === 0 ? -15 : 15), y, 'enemy-splitter-child').setDepth(8);
      child.enemyType = 'basic';
      child.hp = 1;
      child.color = COLORS_INT.enemySplitter;
      child.arcProgress = 0;
      child.arcDuration = 3000;
      child.arcStart = { x: child.x, y: child.y };
      child.arcEnd = { x: this.player.x, y: this.player.y };
      const arc = computeArc(child.x, child.y, this.player.x, this.player.y, 0.8);
      child.arcCP1 = { x: arc.cp1x, y: arc.cp1y };
      child.arcCP2 = { x: arc.cp2x, y: arc.cp2y };
      child.arcPaused = false;
      this.enemies.add(child);
      this.enemiesAlive++;
    }
  },

  updateBullets(delta) {
    this.bullets.getChildren().forEach(b => {
      b.x += b.vx * (delta / 1000);
      b.y += b.vy * (delta / 1000);
      b.trailTimer += delta;
      if (b.trailTimer > 16) { this.bulletTrail(b.x, b.y); b.trailTimer = 0; }
      if (b.x < -20 || b.x > GAME_WIDTH + 20 || b.y < -20 || b.y > GAME_HEIGHT + 20) {
        b.destroy();
      }
    });
  },

  updateEnemies(delta) {
    this.enemies.getChildren().forEach(enemy => {
      if (enemy.arcPaused) return;
      enemy.arcProgress = Math.min(1, enemy.arcProgress + delta / enemy.arcDuration);
      const t = enemy.arcProgress;
      let ex = cubicBezier(t, enemy.arcStart.x, enemy.arcCP1.x, enemy.arcCP2.x, enemy.arcEnd.x);
      let ey = cubicBezier(t, enemy.arcStart.y, enemy.arcCP1.y, enemy.arcCP2.y, enemy.arcEnd.y);
      if (enemy.enemyType === 'zigzag') {
        enemy.zigzagPhase += delta * 0.005;
        ex += Math.sin(enemy.zigzagPhase * 4) * enemy.zigzagAmp;
      }
      enemy.x = ex;
      enemy.y = ey;

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (dist < DEATH_OVERLAP_DIST) {
        this.triggerDeath();
        return;
      }
      if (dist < 30 && dist > DEATH_OVERLAP_DIST) {
        this.nearMissShake();
      }
      if (enemy.arcProgress >= 1) {
        const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
        enemy.x += Math.cos(angle) * 80 * (delta / 1000);
        enemy.y += Math.sin(angle) * 80 * (delta / 1000);
      }
    });
  },

  checkBulletEnemyCollisions() {
    this.bullets.getChildren().forEach(bullet => {
      if (!bullet.active) return;
      this.enemies.getChildren().forEach(enemy => {
        if (!enemy.active || !bullet.active) return;
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        if (dist < 14) {
          this.hitEnemy(enemy, bullet);
        }
      });
    });
  },

  hitEnemy(enemy, bullet) {
    enemy.hp--;
    this.enemyHitFlash(enemy);
    audioManager.playHit();
    enemy.arcPaused = true;
    setTimeout(() => { if (enemy && enemy.active) enemy.arcPaused = false; }, 60);
    bullet.destroy();
    if (enemy.hp <= 0) this.killEnemy(enemy, bullet);
  },

  killEnemy(enemy, bullet) {
    const now = this.time.now;
    const wasPrediction = bullet && bullet.firedPlayerDist > 80;

    if (now - this.lastKillTime < SCORE_VALUES.comboWindow) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    this.lastKillTime = now;

    let pts = SCORE_VALUES.killBase;
    if (this.combo === 2) pts = SCORE_VALUES.combo2x;
    else if (this.combo >= 3) pts = SCORE_VALUES.combo3x;
    if (wasPrediction) pts += SCORE_VALUES.predictionBonus;

    this.score += pts;
    this.scoreText.setText('Score: ' + this.score);
    this.scalePunch(this.scoreText, 1.25, 200);

    this.emitParticles(enemy.x, enemy.y, enemy.color, 8, 120, 300);
    this.scalePunch(enemy, 1.6, 100);
    this.floatingText(enemy.x, enemy.y - 10, '+' + pts, COLORS.combo, '20px');
    this.cameras.main.shake(120, 0.006);
    audioManager.playEnemyDeath(this.combo);

    if (this.combo >= 2) this.showCombo(this.combo);
    if (wasPrediction) this.predictionRing(enemy.x, enemy.y);
    if (enemy.enemyType === 'splitter') this.spawnSplitterChildren(enemy.x, enemy.y);

    this.time.delayedCall(100, () => {
      if (enemy && enemy.active) enemy.destroy();
    });
    this.enemiesAlive--;
    this.time.delayedCall(150, () => this.checkWaveComplete());
  }
};
