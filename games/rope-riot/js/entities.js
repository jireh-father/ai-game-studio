// Enemy creation and behavior logic

function createEnemy(scene, type, x, y, speed) {
  const texKey = type === CONFIG.ENEMY_TYPES.SHIELDED ? 'shielded' : getEnemyTexture(type);
  const sprite = scene.add.image(x, y, texKey).setOrigin(0.5, 1);
  const body = scene.physics.add.sprite(x, y, null).setVisible(false).setSize(18, 28).setOrigin(0.5, 1);
  body.body.setAllowGravity(false);
  body.body.setCollideWorldBounds(false);

  return {
    type, sprite, body, speed, isDead: false,
    exposed: type !== CONFIG.ENEMY_TYPES.SHIELDED,
    isJumping: false, jumpCooldown: 0, isSplit: false
  };
}

function updateEnemies(scene, time, delta) {
  const layout = scene.platformLayout;
  const playerX = scene.playerX;

  for (let i = scene.enemies.length - 1; i >= 0; i--) {
    const e = scene.enemies[i];
    if (e.isDead) {
      if (e.sprite.active && e.sprite.y > CONFIG.HEIGHT + 40) {
        AudioManager.play('fall');
        e.sprite.destroy();
        if (e.body && e.body.active) e.body.destroy();
        checkWaveClear(scene);
      }
      continue;
    }

    // Move toward player
    const dir = e.sprite.x > playerX ? -1 : 1;
    const moveSpeed = e.speed * (delta / 1000);
    e.sprite.x += dir * moveSpeed;
    if (e.body && e.body.active) e.body.x = e.sprite.x;

    // Jumper behavior — dodge rope when aiming
    if (e.type === CONFIG.ENEMY_TYPES.JUMPER && !e.isJumping && time > e.jumpCooldown) {
      if (scene.isAiming) {
        const tip = scene.ropePoints[scene.ropePoints.length - 1];
        const distToRope = Phaser.Math.Distance.Between(e.sprite.x, e.sprite.y, tip.x, tip.y);
        if (distToRope < 60) {
          e.isJumping = true;
          e.jumpCooldown = time + 2000;
          scene.tweens.add({
            targets: e.sprite, y: e.sprite.y - 60, duration: 300, yoyo: true, ease: 'Power2',
            onComplete: () => { e.isJumping = false; }
          });
        }
      }
    }

    // Runner charge burst near player
    if (e.type === CONFIG.ENEMY_TYPES.RUNNER) {
      const distToPlayer = Math.abs(e.sprite.x - playerX);
      if (distToPlayer < 80 && distToPlayer > 30) {
        e.sprite.x += dir * moveSpeed * 0.5;
      }
    }

    // Enemy reached player — death
    if (!scene.inGrace && Math.abs(e.sprite.x - playerX) < 16 && Math.abs(e.sprite.y - scene.playerY) < 30) {
      scene.triggerDeath();
      return;
    }

    // Enemy walked off platform edge
    const onPlatform = layout.segments.some(seg =>
      e.sprite.x >= seg.x - 5 && e.sprite.x <= seg.x + seg.width + 5
    );
    if (!onPlatform && !e.isDead) {
      e.isDead = true;
      scene.tweens.add({
        targets: e.sprite, y: CONFIG.HEIGHT + 60, duration: 600, ease: 'Power1',
        onComplete: () => {
          if (e.sprite.active) e.sprite.destroy();
          if (e.body && e.body.active) e.body.destroy();
        }
      });
      const points = Math.round(CONFIG.SCORING.KILL * window.GAME_STATE.combo);
      window.GAME_STATE.score += points;
      updateScoreDisplay(scene, points, e.sprite.x, e.sprite.y);
      scene.time.delayedCall(700, () => checkWaveClear(scene));
    }
  }
}

function killEnemy(scene, enemy, angle, forceMult) {
  enemy.isDead = true;
  const vx = Math.cos(angle) * CONFIG.PHYSICS.ENEMY_HIT_MIN_VELOCITY * (1 + forceMult * 10);
  const vy = Math.sin(angle) * CONFIG.PHYSICS.ENEMY_HIT_MIN_VELOCITY * 0.5 - 200;

  if (enemy.body) {
    enemy.body.body.setAllowGravity(true);
    enemy.body.body.setVelocity(vx, vy);
    enemy.body.body.setCollideWorldBounds(false);
  }

  // Hit flash
  enemy.sprite.setTint(0xFFFFFF);
  scene.time.delayedCall(80, () => { if (enemy.sprite.active) enemy.sprite.clearTint(); });

  // Particles + sound
  spawnHitParticles(scene, enemy.sprite.x, enemy.sprite.y, 16);
  AudioManager.play('hit');

  // Spin while falling
  scene.tweens.add({
    targets: enemy.sprite, angle: enemy.sprite.angle + (vx > 0 ? 360 : -360),
    duration: 800, ease: 'Linear'
  });

  // Score
  const points = Math.round(CONFIG.SCORING.KILL * window.GAME_STATE.combo);
  window.GAME_STATE.score += points;
  updateScoreDisplay(scene, points, enemy.sprite.x, enemy.sprite.y);

  // Splitter spawns 2 small versions
  if (enemy.type === CONFIG.ENEMY_TYPES.SPLITTER) {
    scene.time.delayedCall(100, () => {
      const e1 = createEnemy(scene, CONFIG.ENEMY_TYPES.WALKER, enemy.sprite.x - 10, enemy.sprite.y, scene.stageConfig.enemySpeed * 0.5);
      e1.sprite.setScale(0.6); e1.isSplit = true; scene.enemies.push(e1);
      const e2 = createEnemy(scene, CONFIG.ENEMY_TYPES.WALKER, enemy.sprite.x + 10, enemy.sprite.y, scene.stageConfig.enemySpeed * 0.5);
      e2.sprite.setScale(0.6); e2.isSplit = true; scene.enemies.push(e2);
    });
  }

  // Delayed cleanup
  scene.time.delayedCall(1000, () => {
    if (enemy.sprite.active) enemy.sprite.destroy();
    if (enemy.body && enemy.body.active) enemy.body.destroy();
    checkWaveClear(scene);
  });
}

function checkWaveClear(scene) {
  if (scene.isDead) return;
  const alive = scene.enemies.filter(e => !e.isDead && e.sprite.active);
  if (alive.length === 0 && scene.allEnemiesSpawned) {
    scene.stageClear();
  }
}
