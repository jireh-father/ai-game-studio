// game.js - GameScene for Flag Me If You Can
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, CONFIG.COLORS.BG);

    this.paused = false;
    this.gameOver = false;
    this.stageTransitioning = false;
    this.corruptionCount = 0;
    this.aiPauseUntil = 0;
    this.lastInputTime = Date.now();
    this.lastAiAdvance = 0;
    this.decoyReady = true;
    this.pressStart = 0;
    this.pressCell = null;
    this.streak = 0;

    const stageData = Stages.generateStage(GameState.stage);
    this.grid = stageData.grid;
    this.params = stageData.params;
    this.playerX = stageData.mineStart.x;
    this.playerY = stageData.mineStart.y;
    this.aiEdge = stageData.aiEdge;

    this.hudY = 30;
    this.gridTop = 70;
    this.gridBottom = h - 70;
    const availH = this.gridBottom - this.gridTop;
    const availW = w - 20;
    this.cellSize = Math.floor(Math.min(availW / this.params.cols, availH / this.params.rows));
    this.gridX = (w - this.cellSize * this.params.cols) / 2;
    this.gridY = this.gridTop + (availH - this.cellSize * this.params.rows) / 2;

    this.buildGridDisplay();
    this.buildHUD();
    this.buildBottomBar();
    this.placeMine();

    this.input.on('pointerdown', (p) => this.onPointerDown(p));
    this.input.on('pointerup', (p) => this.onPointerUp(p));

    this.visHandler = () => {
      if (document.hidden && !this.paused && !this.gameOver) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    Effects.floatingText(this, w/2, 100, `STAGE ${GameState.stage}`, '#FFDD00', 0, 1500);
    if (GameState.stage === 1) {
      const tip = this.add.text(w/2, this.gridTop - 15, 'TAP adjacent cells to hop!', { fontSize: '14px', color: '#FFDD00', fontStyle: 'bold' }).setOrigin(0.5).setDepth(150);
      this.tweens.add({ targets: tip, alpha: 0, duration: 500, delay: 2500, onComplete: () => tip.destroy() });
    }
  }
  shutdown() {
    this.tweens && this.tweens.killAll();
    this.time && this.time.removeAllEvents();
    if (this.visHandler) document.removeEventListener('visibilitychange', this.visHandler);
  }

  buildGridDisplay() {
    this.cellRects = [];
    this.cellTexts = [];
    for (let y = 0; y < this.params.rows; y++) {
      const rowR = [], rowT = [];
      for (let x = 0; x < this.params.cols; x++) {
        const c = this.grid[y][x];
        const cx = this.gridX + x * this.cellSize + this.cellSize / 2;
        const cy = this.gridY + y * this.cellSize + this.cellSize / 2;
        let color = CONFIG.COLORS.CELL_UNREVEALED;
        if (c.isWall) color = CONFIG.COLORS.WALL;
        else if (c.revealed) color = CONFIG.COLORS.CELL_REVEALED;
        const r = this.add.rectangle(cx, cy, this.cellSize - 2, this.cellSize - 2, color);
        r.setStrokeStyle(1, CONFIG.COLORS.BORDER);
        rowR.push(r);
        const t = this.add.text(cx, cy, '', { fontSize: Math.floor(this.cellSize * 0.55) + 'px', fontStyle: 'bold' }).setOrigin(0.5);
        if (c.revealed && c.displayNumber > 0) this.setNumberText(t, c);
        rowT.push(t);
      }
      this.cellRects.push(rowR);
      this.cellTexts.push(rowT);
    }
  }
  setNumberText(t, c) {
    const n = c.displayNumber;
    if (n === 0) { t.setText(''); return; }
    let color = CONFIG.COLORS.NUM1;
    if (n === 2) color = CONFIG.COLORS.NUM2;
    else if (n === 3) color = CONFIG.COLORS.NUM3;
    else if (n >= 4) color = CONFIG.COLORS.NUM4;
    if (c.corrupted) color = CONFIG.COLORS.CORRUPTED;
    t.setText(String(n));
    t.setColor(color);
  }

  buildHUD() {
    const w = this.scale.width;
    this.add.rectangle(w/2, 30, w, 60, 0x0D0D1F);
    this.scoreText = this.add.text(10, 30, 'SCORE: ' + GameState.score, { fontSize: '16px', color: '#F0F0F0', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.stageText = this.add.text(w/2, 15, 'STAGE: ' + GameState.stage, { fontSize: '14px', color: '#F0F0F0' }).setOrigin(0.5);
    this.corruptText = this.add.text(w/2, 40, `CORRUPT: ${this.corruptionCount}/${this.params.corruptionTarget}`, { fontSize: '14px', color: '#00FF88', fontStyle: 'bold' }).setOrigin(0.5);
    const pb = this.add.rectangle(w - 30, 30, 40, 40, 0x4488FF).setInteractive({ useHandCursor: true });
    this.add.text(w - 30, 30, '||', { fontSize: '18px', color: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
    pb.on('pointerdown', () => { this.togglePause(); });
  }
  buildBottomBar() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h - 30, w, 60, 0x0D0D1F);
    this.livesText = this.add.text(10, h - 30, '♥'.repeat(GameState.lives), { fontSize: '22px', color: '#FF2222' }).setOrigin(0, 0.5);
    this.decoyText = this.add.text(w/2, h - 30, 'DECOY READY', { fontSize: '13px', color: '#FFDD00' }).setOrigin(0.5);
    const hb = this.add.circle(w - 30, h - 30, 18, 0x4488FF).setInteractive({ useHandCursor: true });
    this.add.text(w - 30, h - 30, '?', { fontSize: '18px', color: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
    hb.on('pointerdown', () => {
      if (!this.paused) this.togglePause();
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
  }

  placeMine() {
    const cx = this.gridX + this.playerX * this.cellSize + this.cellSize / 2;
    const cy = this.gridY + this.playerY * this.cellSize + this.cellSize / 2;
    this.mineSprite = this.add.image(cx, cy, 'mine').setScale(this.cellSize / 55);
    this.mineSprite.setDepth(50);
    this.tweens.add({ targets: this.mineSprite, alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
  }

  cellAt(px, py) {
    const x = Math.floor((px - this.gridX) / this.cellSize);
    const y = Math.floor((py - this.gridY) / this.cellSize);
    if (x < 0 || y < 0 || x >= this.params.cols || y >= this.params.rows) return null;
    return { x, y };
  }
  isAdjacent(x, y) {
    const dx = Math.abs(x - this.playerX), dy = Math.abs(y - this.playerY);
    if (dx === 0 && dy === 0) return false;
    if (this.params.directions === 4) return (dx + dy === 1);
    return (dx <= 1 && dy <= 1);
  }

  onPointerDown(p) {
    if (this.paused || this.gameOver) return;
    const cell = this.cellAt(p.x, p.y);
    if (!cell) return;
    if (cell.x === this.playerX && cell.y === this.playerY) {
      this.pressStart = Date.now();
      this.pressCell = cell;
    } else {
      this.pressCell = null;
    }
  }
  onPointerUp(p) {
    if (this.paused || this.gameOver) return;
    const cell = this.cellAt(p.x, p.y);
    if (!cell) return;
    if (this.pressCell && cell.x === this.pressCell.x && cell.y === this.pressCell.y && cell.x === this.playerX && cell.y === this.playerY) {
      const dur = Date.now() - this.pressStart;
      if (dur >= 500 && this.decoyReady) {
        this.triggerDecoy();
        this.pressCell = null;
        return;
      }
    }
    this.pressCell = null;
    if (!this.isAdjacent(cell.x, cell.y)) return;
    const target = this.grid[cell.y][cell.x];
    if (target.isWall) {
      this.cellRects[cell.y][cell.x].setFillStyle(0xFF4444);
      this.time.delayedCall(150, () => this.cellRects[cell.y][cell.x].setFillStyle(CONFIG.COLORS.WALL));
      return;
    }
    this.hopMine(cell.x, cell.y);
  }

  hopMine(nx, ny) {
    this.lastInputTime = Date.now();
    const oldX = this.playerX, oldY = this.playerY;
    this.playerX = nx; this.playerY = ny;
    const cx = this.gridX + nx * this.cellSize + this.cellSize / 2;
    const cy = this.gridY + ny * this.cellSize + this.cellSize / 2;
    const oldRect = this.cellRects[oldY][oldX];
    const prevColor = oldRect.fillColor;
    oldRect.setFillStyle(0xFFFFFF);
    this.time.delayedCall(80, () => oldRect.setFillStyle(prevColor));
    const baseScale = this.cellSize / 55;
    this.tweens.add({
      targets: this.mineSprite,
      x: cx, y: cy,
      duration: 120,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: this.mineSprite, scaleX: baseScale * 1.3, scaleY: baseScale * 1.3, duration: 80, yoyo: true });
      }
    });
    const trail = this.add.circle(this.gridX + oldX * this.cellSize + this.cellSize/2, this.gridY + oldY * this.cellSize + this.cellSize/2, this.cellSize/3, 0xFF2222, 0.5);
    this.tweens.add({ targets: trail, alpha: 0, duration: 200, onComplete: () => trail.destroy() });
    Effects.playHop();
    this.addScore(CONFIG.SCORE.HOP, cx, cy);
    this.corruptNearestNumber(oldX, oldY);
  }

  addScore(val, x, y) {
    GameState.score += val;
    this.scoreText.setText('SCORE: ' + GameState.score);
    Effects.scalePunch(this.scoreText, 1.2, 200);
    if (x !== undefined) Effects.floatingText(this, x, y - 10, '+' + val, '#FFFFFF', 25, 500);
  }

  update(time, delta) {
    if (this.paused || this.gameOver || this.stageTransitioning) return;
    if (Date.now() - this.lastInputTime > CONFIG.IDLE_DEATH_MS) {
      this.triggerDeath('idle');
      return;
    }
    if (Date.now() < this.aiPauseUntil) return;
    if (time - this.lastAiAdvance > this.params.aiInterval) {
      this.lastAiAdvance = time;
      this.advanceAI();
    }
  }
}
Object.assign(GameScene.prototype, window.GameHelpers);
