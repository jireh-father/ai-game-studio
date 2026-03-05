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

      // Absorber kills ball on contact
      if (ball && glass && glass._isAbsorber) {
        playAbsorberKill();
        this.fx.sparks(ball.position.x, ball.position.y, 0, 15);
        this.fx.shake(0.006, 150);
        this.onBallLost();
        continue;
      }

      if (glass && (ball || shard)) {
        // Golden Panel Roulette decision on first ball-panel hit
        if (ball && !this.goldenDecided) {
          this.goldenDecided = true;
          if (glass._isGolden) {
            // Hit golden FIRST -> 3x Gold Rush!
            this.goldRushActive = true;
            this.fx.goldRushFlash();
            playGoldRush();
          } else if (this.goldenBody && !this.goldenBody._isAbsorber) {
            // Hit something else first -> golden becomes absorber
            this.convertGoldenToAbsorber();
          }
        }

        const chainDepth = ball ? 0 : ((shard.plugin && shard.plugin.chainDepth) || 0) + 1;
        // Ball impact squash
        if (ball && this.ballSprite) {
          this.tweens.add({
            targets: this.ballSprite,
            scaleX: CFG.BALL_IMPACT_SQUASH_X, scaleY: CFG.BALL_IMPACT_SQUASH_Y,
            duration: CFG.BALL_IMPACT_DURATION, yoyo: true, ease: 'Bounce.Out',
          });
        }
        this.hitGlass(glass, chainDepth, ball ? ball.position : shard.position);
      }
    }
  },

  convertGoldenToAbsorber() {
    const body = this.goldenBody;
    if (!body || !body._sprite) return;
    body._isGolden = false;
    body._isAbsorber = true;
    this.absorberBody = body;
    const sprite = body._sprite;
    // Change color to dark red
    sprite.setFillStyle(CFG.COLOR.ABSORBER, 1.0);
    // Remove golden glow, add absorber glow
    if (sprite._goldenGlow) { sprite._goldenGlow.destroy(); sprite._goldenGlow = null; }
    const glow = this.add.rectangle(body.position.x, body.position.y, body._w + 8, body._h + 8, CFG.COLOR.ABSORBER_PULSE, 0.3).setDepth(19);
    this.tweens.add({ targets: glow, alpha: 0.7, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    sprite._absorberGlow = glow;
    // Skull icon overlay
    const skull = this.add.text(body.position.x, body.position.y, '\u2620', {
      fontSize: '18px', color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(25);
    sprite._skull = skull;
    playAbsorberConvert();
    this.fx.shake(0.004, 100);
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

    // If this was the golden panel, clean up golden/absorber visuals
    if (glassBody === this.goldenBody) {
      this.goldenBody = null;
    }
    if (glassBody === this.absorberBody) {
      this.absorberBody = null;
    }

    const sprite = glassBody._sprite;
    if (sprite) {
      if (sprite._highlight) sprite._highlight.destroy();
      if (sprite._rivets) sprite._rivets.destroy();
      if (sprite._crack) sprite._crack.destroy();
      if (sprite._goldenGlow) sprite._goldenGlow.destroy();
      if (sprite._absorberGlow) sprite._absorberGlow.destroy();
      if (sprite._skull) sprite._skull.destroy();
      sprite.destroy();
      const si = this.glassSprites.indexOf(sprite);
      if (si !== -1) this.glassSprites.splice(si, 1);
    }

    this.time.delayedCall(0, () => this.matter.world.remove(glassBody));
    this.spawnShards(glassBody, chainDepth, ix, iy);

    // Score with gold rush multiplier
    let pts = CFG.CHAIN_SCORE[Math.min(chainDepth, 3)];
    if (this.goldRushActive) pts *= CFG.GOLD_RUSH_MULTIPLIER;
    window.GameState.score += pts;
    this.hudScore.setText(`${window.GameState.score}`);
    this.fx.scoreHudPunch(this.hudScore);
    this.fx.floatScore(ix, iy, pts, chainDepth, this.goldRushActive);

    this.maxChainDepth = Math.max(this.maxChainDepth, chainDepth);
    this.panelsDestroyedThisWave++;
    this.panelsDestroyedThisLaunch++;

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
    if (chainDepth >= 4) {
      this.fx.slowMotion(400, 0.7);
      this.fx.screenCrack(ix, iy, chainDepth);
    }
    this.fx.shake(0.003 + chainDepth * 0.002, 100 + chainDepth * 30);
    try { navigator.vibrate([50, 20, 50]); } catch (e) {}

    if (this.glassBodies.length === 0) {
      this.time.delayedCall(300, () => this.onWaveClear());
    }
  },

  spawnShards(glassBody, chainDepth, ix, iy) {
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
      const speed = 2 + Math.random() * 6;
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

      const color = chainDepth >= 3 ? CFG.COLOR.CASCADE : CFG.COLOR.SHARD;
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
