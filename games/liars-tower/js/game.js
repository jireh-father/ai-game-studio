// Liar's Tower — GameScene (core gameplay). HUD/pause/collapse in hud.js
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // State
    this.score = 0;
    this.combo = 1;
    this.shakes = 0;
    this.stage = 1;
    this.placements = 0;
    this.tower = [];
    this.stageBatch = null;
    this.stageIndex = 0;
    this.fallTime = getFallTime(1);
    this.currentChar = null;
    this.currentSprite = null;
    this.currentBubble = null;
    this.currentBubbleText = null;
    this.currentArc = null;
    this.fallStart = 0;
    this.paused = false;
    this.gameOver = false;
    this.stageTransitioning = false;
    this.lastInputTime = Date.now();
    this.swiping = false;

    // Background
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1A1A2E);
    for (let i = 0; i < 30; i++) {
      this.add.circle(Math.random() * GAME_W, Math.random() * GAME_H, Math.random() * 1.5, 0x2E4057, 0.5);
    }

    // HUD (from hud.js mixin)
    this.createHUD();

    // Input — swipe
    this.input.on('pointerdown', (p) => {
      this.lastInputTime = Date.now();
      if (this.paused || this.gameOver) return;
      this.swipeStartX = p.x;
      this.swipeStartY = p.y;
      this.swiping = true;
    });
    this.input.on('pointerup', (p) => {
      if (!this.swiping || this.paused || this.gameOver) { this.swiping = false; return; }
      const dx = p.x - this.swipeStartX;
      const dy = p.y - this.swipeStartY;
      this.swiping = false;
      if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
      this.handleSwipe(dx > 0 ? 'K' : 'L');
    });

    this.visHandler = () => {
      if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    this.loadStage();
    this.spawnNext();
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this.visHandler) document.removeEventListener('visibilitychange', this.visHandler);
  }

  loadStage() {
    this.stageBatch = generateStage(this.stage);
    this.stageIndex = 0;
    this.fallTime = getFallTime(this.stage);
    this.stageTransitioning = false;
    this.stageText.setText('Stage ' + this.stage);
    if (this.stage > 3 && this.hintLeft) {
      this.tweens.add({ targets: [this.hintLeft, this.hintRight], alpha: 0, duration: 600 });
    }
  }

  spawnNext() {
    if (this.gameOver) return;
    if (this.stageIndex >= this.stageBatch.length) {
      this.advanceStage();
      return;
    }
    const ch = this.stageBatch[this.stageIndex];
    this.currentChar = ch;
    this.fallStart = this.time.now;

    const textureKey = ch.answer === 'K' ? 'knight' : 'liar';
    const sprite = this.add.image(GAME_W / 2, 90, textureKey).setDepth(15);
    sprite.setScale(0);
    this.tweens.add({ targets: sprite, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
    this.currentSprite = sprite;

    const bubbleY = 180;
    const bubble = this.add.rectangle(GAME_W / 2, bubbleY, GAME_W - 40, 70, 0xF4E9CD).setStrokeStyle(2, 0x8B7355).setDepth(14);
    const txt = this.add.text(GAME_W / 2, bubbleY, ch.text, {
      fontSize: '14px', color: '#1A1A1A', align: 'center', wordWrap: { width: GAME_W - 60 },
    }).setOrigin(0.5).setDepth(15);
    if (txt.disableInteractive) txt.disableInteractive();
    this.currentBubble = bubble;
    this.currentBubbleText = txt;

    this.currentArc = this.add.graphics().setDepth(16);
  }

  update(time) {
    if (this.gameOver || this.paused) return;

    // Inactivity death
    if (Date.now() - this.lastInputTime > INACTIVITY_MS) {
      this.lastInputTime = Date.now();
      this.shakes = MAX_SHAKES;
      this.shakeIcons.forEach(ic => ic.setTexture('crack'));
      this.triggerCollapse();
      return;
    }

    if (!this.currentChar) return;

    const elapsed = time - this.fallStart;
    const t = Math.min(1, elapsed / this.fallTime);
    const startY = 90;
    const endY = this.towerBaseY - (this.tower.length * 38) - 60;
    if (this.currentSprite) {
      this.currentSprite.y = startY + (endY - startY) * t;
    }
    if (this.currentBubble) {
      const by = 180 + (endY - 120 - 180) * t;
      this.currentBubble.y = by;
      this.currentBubbleText.y = by;
    }

    if (this.currentArc && this.currentSprite) {
      this.currentArc.clear();
      const remaining = 1 - t;
      const col = remaining > 0.5 ? 0xE8E8E8 : (remaining > 0.25 ? 0xFFE66D : 0xCC2936);
      this.currentArc.lineStyle(3, col, 0.9);
      this.currentArc.beginPath();
      this.currentArc.arc(this.currentSprite.x, this.currentSprite.y, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining, false);
      this.currentArc.strokePath();
    }

    if (t >= 1 && !this.stageTransitioning) {
      // Timeout = force wrong
      this.handleSwipe(this.currentChar.answer === 'K' ? 'L' : 'K');
    }
  }

  handleSwipe(dir) {
    if (!this.currentChar || this.gameOver) return;
    const correct = dir === this.currentChar.answer;
    const sprite = this.currentSprite;
    if (correct) this.onCorrect(sprite);
    else this.onWrong(sprite);
  }

  onCorrect(sprite) {
    const ch = this.currentChar;
    this.placements++;
    const gained = SCORE.base * this.combo;
    this.score += gained;
    if (this.combo < SCORE.comboMax) this.combo++;

    Effects.burstParticles(this, sprite.x, sprite.y, ch.answer === 'K' ? 0xF5C518 : 0xCC2936, 22);
    Effects.scalePunch(this, sprite, 1.3, 100);
    Effects.floatText(this, sprite.x, sprite.y - 20, `+${gained} x${this.combo - 1 || 1}`, '#FFE66D', 20);
    if (ch.answer === 'K') Effects.playChime(523, 659, 'sine');
    else Effects.playChime(392, 330, 'triangle');
    Effects.hitStop(this, 50);
    if (this.combo >= 4) Effects.goldFlash(this);

    this.tower.push({ type: ch.answer });
    const tileKey = ch.answer === 'K' ? 'tile_k' : 'tile_l';
    const tileY = this.towerBaseY - (this.tower.length - 1) * 38;
    const tile = this.add.image(GAME_W / 2, tileY, tileKey).setDepth(10);
    tile.setScale(0);
    this.tweens.add({ targets: tile, scaleX: 1, scaleY: 1, duration: 180, ease: 'Back.easeOut' });

    this.cleanupCurrent();

    this.scoreText.setText('Score: ' + this.score);
    this.comboText.setText(this.combo > 1 ? 'x' + this.combo : '');
    Effects.scalePunch(this, this.scoreText, 1.2, 80);

    this.stageIndex++;
    this.time.delayedCall(260, () => this.spawnNext());
  }

  onWrong(sprite) {
    this.combo = 1;
    this.comboText.setText('');

    this.cameras.main.shake(300, 0.012);
    Effects.redFlash(this);
    Effects.playThud();
    if (sprite) Effects.burstParticles(this, sprite.x, sprite.y, 0xCC2936, 20);
    Effects.hitStop(this, 80);

    this.shakes++;
    if (this.shakes <= MAX_SHAKES) {
      const ic = this.shakeIcons[this.shakes - 1];
      if (ic) {
        ic.setTexture('crack');
        Effects.scalePunch(this, ic, 1.5, 120);
      }
    }

    this.cleanupCurrent();

    if (this.shakes >= MAX_SHAKES) {
      this.triggerCollapse();
      return;
    }

    this.stageIndex++;
    this.time.delayedCall(400, () => this.spawnNext());
  }

  cleanupCurrent() {
    if (this.currentSprite) { this.currentSprite.destroy(); this.currentSprite = null; }
    if (this.currentBubble) { this.currentBubble.destroy(); this.currentBubble = null; }
    if (this.currentBubbleText) { this.currentBubbleText.destroy(); this.currentBubbleText = null; }
    if (this.currentArc) { this.currentArc.destroy(); this.currentArc = null; }
    this.currentChar = null;
  }
}
