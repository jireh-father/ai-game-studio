// Prime Butcher — entities.js (block management via prototype mixin)

Object.assign(GameScene.prototype, {
  spawnBlock() {
    const data = StageManager.getNextBlock(this.stage);
    this.createBlockVisual(data, this.getSpawnX(), PLAY_AREA_TOP - BLOCK_HEIGHT / 2);
  },

  spawnBossBlock() {
    const data = StageManager.getBossBlock(this.stage);
    this.createBlockVisual(data, GAME_WIDTH / 2, PLAY_AREA_TOP - BOSS_HEIGHT / 2);
  },

  createBlockVisual(data, x, y) {
    const w = data.isBoss ? BOSS_WIDTH : BLOCK_WIDTH;
    const h = data.isBoss ? BOSS_HEIGHT : BLOCK_HEIGHT;
    const texKey = data.isBoss ? 'bossBlock' : (data.isPrime ? 'primeBlock' : 'compositeBlock');

    const container = this.add.container(x, y).setDepth(3);
    const img = this.add.image(0, 0, texKey).setDisplaySize(w, h);
    const txt = this.add.text(0, 0, '' + data.value, {
      fontSize: data.isBoss ? '28px' : '22px', fontFamily: 'Arial',
      fontStyle: 'bold', color: data.isBoss ? '#FFFFFF' : COLORS.blockText
    }).setOrigin(0.5);
    container.add([img, txt]);
    container.setSize(w, h);

    const block = { container, img, txt, ...data, w, h, frozen: false };
    this.fallingBlocks.push(block);
    this.activeBlockCount++;
    return block;
  },

  getSpawnX() {
    const margin = BLOCK_WIDTH / 2 + 10;
    let x, attempts = 0;
    do {
      x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
      attempts++;
    } while (attempts < 10 && this.fallingBlocks.some(
      b => Math.abs(b.container.x - x) < BLOCK_WIDTH + 5
    ));
    return x;
  },

  evaluateSwipe(x1, y1, x2, y2) {
    this.drawSliceTrail(x1, y1, x2, y2);
    const allBlocks = [...this.fallingBlocks, ...this.stackedBlocks];
    let hitAny = false;

    for (const b of allBlocks) {
      if (this.lineIntersectsRect(x1, y1, x2, y2,
        b.container.x - b.w / 2, b.container.y - b.h / 2, b.w, b.h)) {
        hitAny = true;
        this.attemptCut(b);
      }
    }
    if (!hitAny) this.playSound('miss');
  },

  attemptCut(block) {
    if (block.isPrime || !FACTOR_MAP[block.value]) {
      this.wrongCutFlash(block);
      return;
    }

    const factors = FACTOR_MAP[block.value];
    const cx = block.container.x;
    const cy = block.container.y;

    // Remove from appropriate list
    let idx = this.fallingBlocks.indexOf(block);
    const wasStacked = idx === -1;
    if (wasStacked) {
      idx = this.stackedBlocks.indexOf(block);
      if (idx !== -1) {
        this.stackedBlocks.splice(idx, 1);
        this.stackHeight = Math.max(0, this.stackHeight - block.h);
      }
    } else {
      this.fallingBlocks.splice(idx, 1);
      this.activeBlockCount--;
    }
    block.container.destroy();

    // Spawn child factors
    for (let i = 0; i < factors.length; i++) {
      const fVal = factors[i];
      const offX = (i === 0 ? -40 : 40);
      const child = {
        value: fVal,
        isPrime: PRIME_SET.has(fVal),
        factors: FACTOR_MAP[fVal] || null,
        isBoss: false
      };
      const cb = this.createBlockVisual(child, cx + offX, cy);
      cb.container.setScale(1.4);
      this.tweens.add({ targets: cb.container, scaleX: 1, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
    }

    // Scoring
    const now = Date.now();
    if (now - this.lastCutTime < COMBO_WINDOW) { this.combo++; }
    else { this.combo = 1; }
    this.lastCutTime = now;

    const multi = Math.min(1 + (this.combo - 1) * 0.25, COMBO_MAX_MULTI);
    const baseScore = factors.length >= 3 ? SCORE_VALUES.threeFactorBase : SCORE_VALUES.cutBase;
    const pts = Math.round(baseScore * block.value * multi);
    this.addScore(pts, cx, cy);
    this.cutEffects(cx, cy, this.combo);
  },

  landOnStack(block) {
    this.stackedBlocks.push(block);
    this.stackHeight += block.h;
    this.playSound('land');
    this.tweens.add({ targets: block.container, y: block.container.y - 5, duration: 80, yoyo: true });
  },

  dissolvePrime(block) {
    const cx = block.container.x;
    const cy = block.container.y;
    const pts = SCORE_VALUES.primeDissolve * block.value;
    this.addScore(pts, cx, cy, true);

    this.tweens.add({
      targets: block.container, scaleX: 0, scaleY: 0, duration: 300, ease: 'Cubic.easeIn',
      onComplete: () => block.container.destroy()
    });
    this.primeSparkle(cx, cy);
    this.playSound('dissolve');
  }
});
