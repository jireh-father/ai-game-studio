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
        // Golden roulette: first ball-panel collision determines outcome
        if (ball && !this.goldenResolved) {
          this.goldenResolved = true;
          if (glass._isGolden) {
            // Hit golden first -> activate 3x multiplier
            this.goldenMultiplierActive = true;
            this.fx.goldenRushFlash();
            playGoldenHit();
          } else if (this.goldenBody && this.glassBodies.includes(this.goldenBody)) {
            // Hit non-golden first -> golden becomes absorber
            this.convertGoldenToAbsorber();
          }
        }

        // Absorber: ball collision = instant destroy ball
        if (ball && glass._isAbsorber) {
          this.onBallLost();
          continue;
        }

        // Ice freeze: ball freezes on ice panel contact
        if (ball && glass._type === 'ice' && !this._frozenThisLaunch) {
          this._frozenThisLaunch = true;
          this.freezeBall(ball);
        }

        const chainDepth = ball ? 0 : ((shard.plugin && shard.plugin.chainDepth) || 0) + 1;
        this.hitGlass(glass, chainDepth, ball ? ball.position : shard.position);
      }
    }
  },

  convertGoldenToAbsorber() {
    const gb = this.goldenBody;
    if (!gb || !gb._sprite) return;
    gb._isGolden = false;
    gb._isAbsorber = true;
    gb._sprite.setFillStyle(CFG.ABSORBER_COLOR, 0.9);
    if (gb._sprite._goldenGlow) {
      gb._sprite._goldenGlow.destroy();
      gb._sprite._goldenGlow = null;
    }
    // Pulsing dark red effect
    this.tweens.add({ targets: gb._sprite, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    // Skull overlay text
    const skull = this.add.text(gb.position.x, gb.position.y, '\u2620', {
      fontSize: '18px', color: '#FF0000',
    }).setOrigin(0.5).setDepth(23);
    gb._sprite._skull = skull;
    playAbsorberConvert();
    this.fx.shake(0.004, 150);
  },

  freezeBall(ballBody) {
    const savedVel = { x: ballBody.velocity.x, y: ballBody.velocity.y };
    const savedMask = ballBody.collisionFilter.mask;
    Phaser.Physics.Matter.Matter.Body.setVelocity(ballBody, { x: 0, y: 0 });
    ballBody.ignoreGravity = true;
    ballBody.collisionFilter.mask = 0;
    playIceFreeze();
    // Blue frost overlay
    if (this.ballSprite) {
      const frost = this.add.circle(this.ballSprite.x, this.ballSprite.y, CFG.BALL_RADIUS + 6, CFG.ICE_COLOR, 0.4).setDepth(32);
      this.fx.sparks(this.ballSprite.x, this.ballSprite.y, 0, 8);
      setTimeout(() => {
        if (ballBody && this.activeBall === ballBody) {
          ballBody.ignoreGravity = false;
          ballBody.collisionFilter.mask = savedMask;
          Phaser.Physics.Matter.Matter.Body.setVelocity(ballBody, savedVel);
        }
        if (frost && frost.active) frost.destroy();
      }, CFG.ICE_FREEZE_TIME);
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
    const isBomb = glassBody._type === 'bomb';
    const isIce = glassBody._type === 'ice';

    const sprite = glassBody._sprite;
    if (sprite) {
      if (sprite._highlight) sprite._highlight.destroy();
      if (sprite._rivets) sprite._rivets.destroy();
      if (sprite._crack) sprite._crack.destroy();
      if (sprite._fuse) sprite._fuse.destroy();
      if (sprite._icePattern) sprite._icePattern.destroy();
      if (sprite._goldenGlow) sprite._goldenGlow.destroy();
      if (sprite._skull) sprite._skull.destroy();
      sprite.destroy();
      const si = this.glassSprites.indexOf(sprite);
      if (si !== -1) this.glassSprites.splice(si, 1);
    }

    this.time.delayedCall(0, () => this.matter.world.remove(glassBody));

    // Bomb AoE explosion
    if (isBomb) {
      this.bombExplode(glassBody.position.x, glassBody.position.y, chainDepth);
    } else {
      this.spawnShards(glassBody, chainDepth, ix, iy, isIce);
    }

    // Score with golden multiplier + achievement multiplier
    let pts = CFG.CHAIN_SCORE[Math.min(chainDepth, 3)];
    const achMult = 1 + AchievementManager.getScoreMultiplier();
    pts = Math.floor(pts * achMult);
    if (this.goldenMultiplierActive) pts *= CFG.GOLDEN_MULTIPLIER;
    window.GameState.score += pts;
    this.hudScore.setText(`${window.GameState.score}`);
    this.fx.scoreHudPunch(this.hudScore);
    this.fx.floatScore(ix, iy, pts, chainDepth);

    this.maxChainDepth = Math.max(this.maxChainDepth, chainDepth);
    this.panelsDestroyedThisWave++;
    this.panelsDestroyedThisLaunch++;

    // Track shards for achievements
    AchievementManager.addStat('total_shards', 1);
    if (chainDepth >= 1) AchievementManager.addStat('total_cascades', 1);

    // Effects
    this.fx.impactFlash(ix, iy);
    this.fx.sparks(ix, iy, chainDepth);
    playShatter(chainDepth);

    if (!this._ballHitThisLaunch) {
      this._ballHitThisLaunch = true;
      this.fx.hitStop(40);
      this.fx.zoomPunch(1.04);
    }

    if (chainDepth >= 1) this.fx.chainCombo(chainDepth);
    if (chainDepth >= 4) this.fx.slowMotion(400, 0.7);
    this.fx.shake(0.003 + chainDepth * 0.002, 100 + chainDepth * 30);
    try { navigator.vibrate([50, 20, 50]); } catch (e) {}

    // Check achievements
    const newAch = AchievementManager.checkUnlocks();
    newAch.forEach(a => this.fx.achievementToast(a.label));

    if (this.glassBodies.length === 0) {
      this.time.delayedCall(300, () => this.onWaveClear());
    }
  },

  bombExplode(bx, by, chainDepth) {
    playBombExplode();
    this.fx.bombExplosion(bx, by);
    this.fx.shake(0.008, 200);
    // AoE: hit all panels within radius
    const radius = CFG.BOMB_AOE_RADIUS;
    const targets = [...this.glassBodies];
    for (const g of targets) {
      const dx = g.position.x - bx, dy = g.position.y - by;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        this.hitGlass(g, chainDepth + 1, { x: bx, y: by });
      }
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
    const speedMult = isIce ? CFG.ICE_SHARD_SPEED_MULT : 1;

    for (let i = 0; i < shardCount; i++) {
      const angle = (Math.random() - 0.5) * Math.PI + Math.atan2(iy - gy, ix - gx) + Math.PI;
      const speed = (2 + Math.random() * 6) * speedMult;
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

      const color = isIce ? CFG.ICE_COLOR : (chainDepth >= 3 ? CFG.COLOR.CASCADE : CFG.COLOR.SHARD);
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
};
