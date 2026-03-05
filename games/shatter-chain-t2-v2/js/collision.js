// Shatter Chain - Collision & Shatter Logic (mixed into GameScene)

const CollisionMixin = {
  onCollision(event) {
    const pairs = event.pairs;
    for (const pair of pairs) {
      let ball = null, glass = null, shard = null;
      const a = pair.bodyA, b = pair.bodyB;

      if (a.label === 'ball' && b.label === 'glass') { ball = a; glass = b; }
      else if (b.label === 'ball' && a.label === 'glass') { ball = b; glass = a; }
      else if (a.label === 'shard' && b.label === 'glass') { shard = a; glass = b; }
      else if (b.label === 'shard' && a.label === 'glass') { shard = b; glass = a; }
      else if ((a.label === 'ball' || b.label === 'ball') && (a.label === 'floor' || b.label === 'floor')) {
        this.onBallLost();
        continue;
      }

      if (glass && (ball || shard)) {
        const chainDepth = ball ? 0 : ((shard.plugin && shard.plugin.chainDepth) || 0) + 1;
        // Ice freeze: only on ball collision, once per launch
        if (ball && glass._type === 'ice' && !this._frozenThisLaunch) {
          this._frozenThisLaunch = true;
          const savedVel = { x: ball.velocity.x, y: ball.velocity.y };
          const savedMask = ball.collisionFilter.mask;
          Phaser.Physics.Matter.Matter.Body.setVelocity(ball, { x: 0, y: 0 });
          ball.ignoreGravity = true;
          ball.collisionFilter.mask = 0;
          this.fx.iceFreeze(ball.position.x, ball.position.y);
          playIceFreeze();
          setTimeout(() => {
            if (this.activeBall === ball) {
              ball.ignoreGravity = false;
              ball.collisionFilter.mask = savedMask;
              Phaser.Physics.Matter.Matter.Body.setVelocity(ball, savedVel);
            }
          }, CFG.ICE_FREEZE_DURATION);
        }
        this.hitGlass(glass, chainDepth, ball ? ball.position : shard.position);
      }
    }
  },

  hitGlass(glassBody, chainDepth, impactPos) {
    if (!this.glassBodies.includes(glassBody)) return;

    glassBody._hp--;
    const ix = impactPos.x, iy = impactPos.y;

    if (glassBody._hp > 0) {
      playReinforcedHit();
      this.fx.sparks(ix, iy, 0, 5);
      if (glassBody._sprite) {
        const g = this.add.graphics().setDepth(23);
        g.lineStyle(1, CFG.COLOR.WHITE, 0.6);
        const cx = glassBody.position.x, cy = glassBody.position.y;
        g.lineBetween(cx - 8, cy - 5, cx + 10, cy + 7);
        g.lineBetween(cx + 3, cy - 8, cx - 5, cy + 6);
        glassBody._sprite._crack = g;
      }
      this.fx.shake(0.002, 60);
      return;
    }

    this.shatterPanel(glassBody, chainDepth, ix, iy);
  },

  shatterPanel(glassBody, chainDepth, ix, iy) {
    const idx = this.glassBodies.indexOf(glassBody);
    if (idx === -1) return;
    this.glassBodies.splice(idx, 1);

    const sprite = glassBody._sprite;
    if (sprite) {
      if (sprite._highlight) sprite._highlight.destroy();
      if (sprite._rivets) sprite._rivets.destroy();
      if (sprite._crack) sprite._crack.destroy();
      if (sprite._fuse) sprite._fuse.destroy();
      if (sprite._iceDecor) sprite._iceDecor.destroy();
      sprite.destroy();
      const si = this.glassSprites.indexOf(sprite);
      if (si !== -1) this.glassSprites.splice(si, 1);
    }

    this.time.delayedCall(0, () => this.matter.world.remove(glassBody));

    const isBomb = glassBody._type === 'bomb';
    const isIce = glassBody._type === 'ice';
    this.spawnShards(glassBody, chainDepth, ix, iy, isIce);

    // Score
    const pts = CFG.CHAIN_SCORE[Math.min(chainDepth, 3)];
    window.GameState.score += pts;
    this.hudScore.setText(`${window.GameState.score}`);
    this.fx.scoreHudPunch(this.hudScore);
    this.fx.floatScore(ix, iy, pts, chainDepth);

    this.maxChainDepth = Math.max(this.maxChainDepth, chainDepth);
    this.panelsDestroyedThisWave++;
    this.panelsDestroyedThisLaunch++;
    this.totalPanelsDestroyed++;
    if (chainDepth >= 1) this.totalChainsTriggered++;
    this._chainSequenceCount++;
    if (this.panelsDestroyedThisLaunch > this.bestSingleLaunchPanels) {
      this.bestSingleLaunchPanels = this.panelsDestroyedThisLaunch;
    }

    // Effects
    this.fx.impactFlash(ix, iy);
    this.fx.sparks(ix, iy, chainDepth);
    playShatter(chainDepth);

    // Hit-stop only on FIRST glass contact per ball launch
    if (!this._ballHitThisLaunch) {
      this._ballHitThisLaunch = true;
      this.fx.hitStop(40);
      this.fx.zoomPunch(1.04);
    }

    if (chainDepth >= 1) this.fx.chainCombo(chainDepth);
    if (chainDepth >= 4) this.fx.slowMotion(400, 0.7);
    this.fx.shake(0.003 + chainDepth * 0.002, 100 + chainDepth * 30);
    try { navigator.vibrate([50, 20, 50]); } catch (e) {}

    // Bomb AoE
    if (isBomb) {
      this.fx.bombExplosion(ix, iy);
      playExplosion();
      this.fx.shake(0.008, 200);
      const nearby = this.glassBodies.filter(g => {
        const dx = g.position.x - ix, dy = g.position.y - iy;
        return Math.sqrt(dx * dx + dy * dy) < CFG.BOMB_AOE_RADIUS;
      });
      nearby.forEach(g => this.time.delayedCall(50, () => this.hitGlass(g, chainDepth + 1, { x: ix, y: iy })));
    }

    // Kickback shards: spawn when chain sequence hits threshold
    if (this._chainSequenceCount >= CFG.KICKBACK_CHAIN_THRESHOLD && chainDepth >= 1) {
      this.spawnKickbackShards(ix, iy, chainDepth);
      this._chainSequenceCount = 0; // reset so it can trigger again
    }

    if (this.glassBodies.length === 0) {
      // Check demolition (kickback cleared all)
      if (this._kickbackActive) {
        this._kickbackActive = false;
        window.GameState.score += CFG.DEMOLITION_BONUS;
        this.hudScore.setText(`${window.GameState.score}`);
        this.fx.demolitionEvent();
        playDemolition();
        this.fx.shake(0.01, 300);
      }
      this.time.delayedCall(300, () => this.onWaveClear());
    }
  },

  spawnShards(glassBody, chainDepth, ix, iy, isIce) {
    const worldBodies = this.matter.world.localWorld.bodies.length;
    let shardCount = CFG.SHARD_BASE_COUNT + Math.min(chainDepth, 4) * 2;
    if (worldBodies > CFG.MAX_BODIES) {
      shardCount = 2;
      while (this.shards.length > 10) {
        const old = this.shards.shift();
        if (old._sprite) old._sprite.destroy();
        this.time.delayedCall(0, () => this.matter.world.remove(old));
      }
    }

    const gx = glassBody.position.x, gy = glassBody.position.y;

    for (let i = 0; i < shardCount; i++) {
      const angle = (Math.random() - 0.5) * Math.PI + Math.atan2(iy - gy, ix - gx) + Math.PI;
      let speed = 2 + Math.random() * 6;
      if (isIce) speed *= CFG.ICE_SHARD_SPEED_MULT;
      const size = 5 + Math.random() * 8;

      const shard = this.matter.add.rectangle(
        gx + (Math.random() - 0.5) * 10,
        gy + (Math.random() - 0.5) * 10,
        size, size * 0.6,
        { ...SHARD_BODY, plugin: { chainDepth: chainDepth } }
      );

      Phaser.Physics.Matter.Matter.Body.setVelocity(shard, {
        x: Math.cos(angle) * speed, y: Math.sin(angle) * speed
      });
      Phaser.Physics.Matter.Matter.Body.setAngularVelocity(shard, (Math.random() - 0.5) * 0.3);

      const color = isIce ? CFG.COLOR.ICE : chainDepth >= 3 ? CFG.COLOR.CASCADE : CFG.COLOR.SHARD;
      const vis = this.add.polygon(gx, gy,
        [[0, 0], [size, size * 0.3], [size * 0.5, size * 0.8]],
        color, 0.9
      ).setDepth(18);
      vis.setStrokeStyle(0.5, CFG.COLOR.WHITE, 0.6);

      shard._sprite = vis;
      this.shards.push(shard);

      this.time.delayedCall(CFG.SHARD_LIFESPAN, () => {
        const si = this.shards.indexOf(shard);
        if (si !== -1) this.shards.splice(si, 1);
        if (shard._sprite) {
          this.tweens.add({
            targets: shard._sprite, alpha: 0, duration: 200,
            onComplete: () => { if (shard._sprite) shard._sprite.destroy(); }
          });
        }
        this.matter.world.remove(shard);
      });
    }
  },

  spawnKickbackShards(ix, iy, chainDepth) {
    this._kickbackActive = true;
    for (let i = 0; i < CFG.KICKBACK_SHARD_COUNT; i++) {
      const targetY = 600 + Math.random() * 80;
      const angle = Math.atan2(targetY - iy, (CFG.WIDTH / 2 + (Math.random() - 0.5) * 200) - ix);
      const speed = CFG.KICKBACK_SPEED;
      const size = 8 + Math.random() * 6;

      const shard = this.matter.add.rectangle(
        ix + (Math.random() - 0.5) * 20, iy + (Math.random() - 0.5) * 20,
        size, size * 0.6,
        { ...SHARD_BODY, plugin: { chainDepth: chainDepth } }
      );

      Phaser.Physics.Matter.Matter.Body.setVelocity(shard, {
        x: Math.cos(angle) * speed, y: Math.sin(angle) * speed
      });
      Phaser.Physics.Matter.Matter.Body.setAngularVelocity(shard, (Math.random() - 0.5) * 0.4);

      const vis = this.add.polygon(ix, iy,
        [[0, 0], [size, size * 0.3], [size * 0.5, size * 0.8]],
        CFG.COLOR.SCORE, 0.95
      ).setDepth(18);
      vis.setStrokeStyle(1, CFG.COLOR.WHITE, 0.8);

      shard._sprite = vis;
      this.shards.push(shard);

      this.time.delayedCall(CFG.SHARD_LIFESPAN * 1.5, () => {
        const si = this.shards.indexOf(shard);
        if (si !== -1) this.shards.splice(si, 1);
        if (shard._sprite) {
          this.tweens.add({
            targets: shard._sprite, alpha: 0, duration: 200,
            onComplete: () => { if (shard._sprite) shard._sprite.destroy(); }
          });
        }
        this.matter.world.remove(shard);
      });
    }
  },
};
