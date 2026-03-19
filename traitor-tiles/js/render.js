// Rendering and effects helpers used by GameScene
// Attached as methods to GameScene prototype to keep game.js under 300 lines

GameScene.prototype._drawGrid = function() {
  this.gridGfx.clear();
  for (let r = 0; r < this.gridSize; r++) {
    for (let c = 0; c < this.gridSize; c++) {
      const x = this.gridOffsetX + c * (this.tileSize + CONFIG.GRID.GAP);
      const y = this.gridOffsetY + r * (this.tileSize + CONFIG.GRID.GAP);
      const state = this.tileStates[r * this.gridSize + c];
      let fill = CONFIG.COLORS.TILE_SAFE, border = CONFIG.COLORS.TILE_BORDER;
      if (state === 'poisoned') { fill = CONFIG.COLORS.TILE_POISONED; border = CONFIG.COLORS.TILE_POISONED_GLOW; }
      else if (state === 'pre_poisoned') { fill = CONFIG.COLORS.TILE_PRE_POISON; border = CONFIG.COLORS.TILE_PRE_POISON_BORDER; }
      this.gridGfx.fillStyle(fill, 1);
      this.gridGfx.fillRoundedRect(x, y, this.tileSize, this.tileSize, 4);
      this.gridGfx.lineStyle(1, border, 0.6);
      this.gridGfx.strokeRoundedRect(x, y, this.tileSize, this.tileSize, 4);
    }
  }
};

GameScene.prototype._spawnParticles = function(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const s = speed * (0.5 + Math.random());
    const p = this.add.circle(x, y, 3 + Math.random() * 3, color).setDepth(30);
    this.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * s,
      y: y + Math.sin(angle) * s,
      alpha: 0, scale: 0,
      duration: 400 + Math.random() * 200,
      onComplete: () => p.destroy()
    });
  }
};

GameScene.prototype._showFloatingText = function(x, y, text, color) {
  const ft = this.floatingTexts[this.floatingTextIdx % this.floatingTexts.length];
  this.floatingTextIdx++;
  ft.setPosition(x, y).setText(text).setColor(color).setAlpha(1).setScale(1);
  this.tweens.add({ targets: ft, y: y - 50, alpha: 0, duration: 700 });
};

GameScene.prototype._playTone = function(freq, dur, type, vol, descend) {
  if (this.game.registry.get('muted')) return;
  try {
    const ctx = this.sound.context;
    if (!ctx || ctx.state === 'closed') return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (descend) o.frequency.linearRampToValueAtTime(100, ctx.currentTime + dur / 1000);
    g.gain.setValueAtTime(vol || 0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur / 1000);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur / 1000);
  } catch (e) {}
};

GameScene.prototype._getParticleCount = function() {
  if (this.streakMultiplier >= 2) return 12;
  if (this.streakMultiplier >= 1.5) return 8;
  if (this.streakMultiplier >= 1.25) return 6;
  return 4;
};

GameScene.prototype._createGoalTimer = function() {
  if (this.timerDots) this.timerDots.forEach(d => d.destroy());
  this.timerDots = [];
  const dotY = this.gridOffsetY + this.gridSize * (this.tileSize + CONFIG.GRID.GAP) + 20;
  for (let i = 0; i < 5; i++) {
    this.timerDots.push(
      this.add.circle(this.gameWidth / 2 - 40 + i * 20, dotY, 6, CONFIG.COLORS.GOAL).setDepth(30)
    );
  }
};

GameScene.prototype._createHUD = function() {
  this.add.rectangle(this.gameWidth / 2, CONFIG.GRID.HUD_HEIGHT / 2, this.gameWidth, CONFIG.GRID.HUD_HEIGHT, CONFIG.COLORS.HUD_BG).setDepth(55);
  this.scoreText = this.add.text(12, 16, `Score: ${this.score}`, {
    fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: CONFIG.COLORS.HUD_TEXT, fontStyle: 'bold'
  }).setDepth(60);
  this.stageText = this.add.text(this.gameWidth / 2, 16, `Stage ${this.stageNum}`, {
    fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: CONFIG.COLORS.HUD_TEXT
  }).setOrigin(0.5, 0).setDepth(60);
  if (this.streakMultiplier > 1) {
    this.streakText = this.add.text(12, 36, `x${this.streakMultiplier}`, {
      fontSize: '13px', fontFamily: 'Arial, sans-serif', fill: '#FFD700'
    }).setDepth(60);
  }
};

GameScene.prototype._initFloatingTexts = function() {
  this.floatingTexts = [];
  for (let i = 0; i < 4; i++) {
    const ft = this.add.text(0, 0, '', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setDepth(40);
    this.floatingTexts.push(ft);
  }
  this.floatingTextIdx = 0;
};
