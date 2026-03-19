// Copycat Killer - Ghost Recording & Replay System

class GhostRecorder {
  constructor() {
    this.buffer = [];
    this.maxMs = GAME_CONFIG.ghostMaxHistory;
    this.interval = GAME_CONFIG.ghostRecordInterval;
    this.lastRecord = 0;
  }

  record(x, y, t) {
    if (t - this.lastRecord >= this.interval) {
      this.buffer.push({ x, y, t });
      this.lastRecord = t;
      const cutoff = t - this.maxMs;
      while (this.buffer.length && this.buffer[0].t < cutoff) this.buffer.shift();
    }
  }

  getFullPath() { return [...this.buffer]; }

  reset() {
    this.buffer = [];
    this.lastRecord = 0;
  }
}

class GhostReplayer {
  constructor(scene, path, index) {
    this.path = path;
    this.idx = 0;
    this.startTime = null;
    this.originT = path[0].t;
    this.sprite = scene.add.image(path[0].x, path[0].y, 'ghost');
    this.sprite.setAlpha(index === 0 ? 0.6 : 0.4);
    this.sprite.setTint(index === 0 ? COLORS.ghost1 : COLORS.ghost2);
    this.nearMissTriggered = false;
    this.done = false;

    // Spawn scale punch animation
    this.sprite.setScale(0);
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.4, scaleY: 1.4,
      duration: 100,
      ease: 'Back.Out',
      onComplete: () => {
        scene.tweens.add({
          targets: this.sprite,
          scaleX: 1, scaleY: 1,
          duration: 100
        });
      }
    });
  }

  update(t, speedMult) {
    if (this.done) return true;
    if (!this.startTime) this.startTime = t;
    const elapsed = (t - this.startTime) * (speedMult || 1);
    const target = this.originT + elapsed;
    while (this.idx < this.path.length - 1 && this.path[this.idx + 1].t <= target) {
      this.idx++;
    }
    if (this.idx < this.path.length) {
      this.sprite.x = this.path[this.idx].x;
      this.sprite.y = this.path[this.idx].y;
    }
    if (this.idx >= this.path.length - 1) {
      this.done = true;
      return true;
    }
    return false;
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
  }
}

class IdlePunishment {
  constructor(scene) {
    this.scene = scene;
    this.baseX = 0;
    this.baseY = 0;
    this.idleTime = 0;
    this.warning = null;
    this.poisonRing = null;
    this.poisonOriginX = 0;
    this.poisonOriginY = 0;
    this.poisonRadius = 0;
    this.poisonActive = false;
  }

  init(x, y) {
    this.baseX = x;
    this.baseY = y;
    this.idleTime = 0;
  }

  update(playerX, playerY, delta, idleTrigger) {
    const dist = Math.hypot(playerX - this.baseX, playerY - this.baseY);

    if (dist > GAME_CONFIG.idleRadius) {
      this.baseX = playerX;
      this.baseY = playerY;
      this.idleTime = 0;
      this.clearWarning();
      this.clearPoison();
      return false;
    }

    this.idleTime += delta;

    // Warning at 2s
    if (this.idleTime >= 2000 && !this.warning) {
      this.warning = this.scene.add.text(playerX, playerY - 30, 'MOVE!', {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FF4422'
      }).setOrigin(0.5);
      this.scene.tweens.add({
        targets: this.warning, scaleX: 1.2, scaleY: 1.2,
        duration: 250, yoyo: true, repeat: -1
      });
    }

    // Update warning position
    if (this.warning) {
      this.warning.x = playerX;
      this.warning.y = playerY - 30;
    }

    // Poison ring at idleTrigger (3-4s depending on stage)
    const triggerMs = idleTrigger || 3000;
    if (this.idleTime >= triggerMs && !this.poisonActive) {
      this.poisonActive = true;
      this.poisonOriginX = playerX;
      this.poisonOriginY = playerY;
      this.poisonRadius = 0;
      this.poisonRing = this.scene.add.graphics();
    }

    // Expand poison ring
    if (this.poisonActive && this.poisonRing) {
      this.poisonRadius += (GAME_CONFIG.poisonExpandRate * delta) / 1000;
      this.poisonRing.clear();

      // Color transition: green -> yellow -> red
      const t = Math.min(this.poisonRadius / GAME_CONFIG.poisonMaxRadius, 1);
      const r = Math.floor(0x44 + t * (0xFF - 0x44));
      const g = Math.floor(0xFF - t * (0xFF - 0x44));
      const b = Math.floor(0x66 - t * 0x44);
      const col = (r << 16) | (g << 8) | b;
      this.poisonRing.lineStyle(3, col, 0.8);
      this.poisonRing.strokeCircle(this.poisonOriginX, this.poisonOriginY, this.poisonRadius);

      // Kill check: player inside expanding ring or ring maxed out
      const playerDist = Math.hypot(playerX - this.poisonOriginX, playerY - this.poisonOriginY);
      if (this.poisonRadius > 15 && playerDist <= this.poisonRadius + 5) {
        return true; // Signal death
      }
      if (this.poisonRadius >= GAME_CONFIG.poisonMaxRadius) {
        return true; // Signal death
      }
    }

    return false;
  }

  clearWarning() {
    if (this.warning) {
      this.warning.destroy();
      this.warning = null;
    }
  }

  clearPoison() {
    if (this.poisonRing) {
      this.poisonRing.destroy();
      this.poisonRing = null;
    }
    this.poisonActive = false;
    this.poisonRadius = 0;
  }

  destroy() {
    this.clearWarning();
    this.clearPoison();
  }
}
