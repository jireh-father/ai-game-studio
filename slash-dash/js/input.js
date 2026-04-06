// Slash Dash - Input Handling (mixed into GameScene)
const InputMixin = {
  handlePointerDown(pointer) {
    if (this.gameOver) return;
    this.lastInputTime = Date.now();
    if (this.paused) return;

    this.pointerStart = { x: pointer.x, y: pointer.y, time: Date.now() };

    // Finger indicator
    if (!this.fingerIndicator) {
      this.fingerIndicator = this.add.image(pointer.x, pointer.y, 'fingerRing').setScale(0.5).setAlpha(0.9).setDepth(40);
      this.tweens.add({ targets: this.fingerIndicator, scaleX: 1, scaleY: 1, duration: 80 });
    } else {
      this.fingerIndicator.setPosition(pointer.x, pointer.y).setAlpha(0.9);
    }

    // Start hold check
    this.holdActive = false;
    if (this.holdTimer) this.holdTimer.remove();
    const startX = pointer.x, startY = pointer.y;
    this.holdTimer = this.time.delayedCall(GAME.HOLD_THRESHOLD_MS, () => {
      if (this.pointerStart && !this.gameOver && !this.paused) {
        this.holdActive = true;
        this.zenGlowRef = Effects.zenGlow(this, startX, startY);
        Effects.playDodgeSound();
      }
    });
  },

  handlePointerMove(pointer) {
    if (!this.pointerStart || this.gameOver || this.paused) return;
    this.lastInputTime = Date.now();
    if (this.fingerIndicator) this.fingerIndicator.setPosition(pointer.x, pointer.y);

    const dx = pointer.x - this.pointerStart.x;
    const dy = pointer.y - this.pointerStart.y;
    if (Math.sqrt(dx * dx + dy * dy) > 10 && this.holdActive) {
      this.holdActive = false;
      if (this.zenGlowRef) { this.zenGlowRef.destroy(); this.zenGlowRef = null; }
    }
  },

  handlePointerUp(pointer) {
    if (!this.pointerStart || this.gameOver || this.paused) return;
    this.lastInputTime = Date.now();

    const dx = pointer.x - this.pointerStart.x;
    const dy = pointer.y - this.pointerStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - this.pointerStart.time;

    if (this.holdTimer) { this.holdTimer.remove(); this.holdTimer = null; }
    if (this.zenGlowRef) { this.zenGlowRef.destroy(); this.zenGlowRef = null; }
    if (this.fingerIndicator) this.fingerIndicator.setAlpha(0);

    if (dist >= GAME.SWIPE_MIN_PX && elapsed <= GAME.SWIPE_MAX_MS) {
      this.evaluateSwipe(this.pointerStart.x, this.pointerStart.y, pointer.x, pointer.y, elapsed);
    } else if (this.holdActive) {
      this.evaluateHold(this.pointerStart.x, this.pointerStart.y);
    }

    this.pointerStart = null;
    this.holdActive = false;
  },

  evaluateSwipe(sx, sy, ex, ey, elapsed) {
    Effects.slashTrail(this, sx, sy, ex, ey, GameState.combo);
    Effects.screenShake(this, 3, 80);
    Effects.playSlashSound();

    this.activeObjects.forEach(obj => {
      if (obj.handled || obj.missed) return;
      if (this.pointLineDistance(obj.x, obj.y, sx, sy, ex, ey) < 40) {
        const effectiveType = GameState.inversionActive ? (obj.objType === 'red' ? 'blue' : 'red') : obj.objType;
        if (effectiveType === 'red') {
          const isPerfect = elapsed < GAME.PERFECT_SWIPE_MS &&
            this.pointLineDistance(obj.x, obj.y, sx, sy, ex, ey) < GAME.PERFECT_DIST_PX;
          this.correctSlash(obj, isPerfect);
        } else {
          this.addStrike(obj);
        }
        obj.handled = true;
      }
    });
  },

  evaluateHold(hx, hy) {
    this.activeObjects.forEach(obj => {
      if (obj.handled || obj.missed) return;
      const dist = Phaser.Math.Distance.Between(hx, hy, obj.x, obj.y);
      if (dist < 60 && obj.y >= GAME.PLAYER_ZONE_Y - 80) {
        const effectiveType = GameState.inversionActive ? (obj.objType === 'red' ? 'blue' : 'red') : obj.objType;
        if (effectiveType === 'blue') {
          this.correctDodge(obj);
        } else {
          this.addStrike(obj);
        }
        obj.handled = true;
      }
    });
  },

  pointLineDistance(px, py, lx1, ly1, lx2, ly2) {
    const A = px - lx1, B = py - ly1, C = lx2 - lx1, D = ly2 - ly1;
    const dot = A * C + B * D, lenSq = C * C + D * D;
    const t = lenSq !== 0 ? Math.max(0, Math.min(1, dot / lenSq)) : 0;
    const projX = lx1 + t * C, projY = ly1 + t * D;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }
};
