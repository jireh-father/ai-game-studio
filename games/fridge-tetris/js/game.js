// Core gameplay scene
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.grid = Array.from({ length: GRID_COLS }, () => Array(GRID_ROWS).fill(null));
    this.items = []; // all item game objects
    this.playerItem = null;
    this.dragItem = null;
    this.dragOriginCol = -1;
    this.dragOriginRow = -1;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.waveNumber = 0;
    this.waveActive = false;
    this.waveTimeRemaining = 0;
    this.waveDuration = 0;
    this.score = 0;
    this.lives = 3;
    this.smellMeter = 0;
    this.combo = 0;
    this.backRowTurns = 0;
    this.smellBlocked = 0;
    this.fridgePoints = 0;
    this.waveGenerator = new WaveGenerator();
    this.audioCtx = null;

    this._createBackground();
    this._createGrid();
    this.hud = new HUD(this);
    this._spawnPlayer(0, 2);
    this._initAudio();
    this._setupInput();
    this._startNextWave();
  }

  _createBackground() {
    // Fridge interior background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOR.FRIDGE_BG);
    // Fridge walls
    this.add.rectangle(GAME_WIDTH / 2, HUD_HEIGHT + (GRID_ROWS * CELL_SIZE) / 2 + 4, GAME_WIDTH, GRID_ROWS * CELL_SIZE + 8, COLOR.FRIDGE_ACCENT, 0.2);
  }

  _createGrid() {
    const graphics = this.add.graphics();
    // Column tints
    for (let col = 0; col < GRID_COLS; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const x = GRID_START_X + col * CELL_SIZE;
        const y = GRID_START_Y + row * CELL_SIZE;
        let color = COLOR.FRIDGE_BG;
        let alpha = 0.3;
        if (col === 0) { color = COLOR.SAFE_ZONE; alpha = 0.25; }
        if (col === 3) { color = COLOR.DANGER_ZONE; alpha = 0.15; }
        graphics.fillStyle(color, alpha);
        graphics.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
    }
    // Grid lines
    graphics.lineStyle(1, COLOR.FRIDGE_ACCENT, 0.5);
    for (let col = 0; col <= GRID_COLS; col++) {
      graphics.lineBetween(GRID_START_X + col * CELL_SIZE, GRID_START_Y, GRID_START_X + col * CELL_SIZE, GRID_START_Y + GRID_ROWS * CELL_SIZE);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      graphics.lineBetween(GRID_START_X, GRID_START_Y + row * CELL_SIZE, GRID_START_X + GRID_COLS * CELL_SIZE, GRID_START_Y + row * CELL_SIZE);
    }
    // Column labels
    const style = { fontSize: '10px', color: '#1A1A2E', fontFamily: 'Arial' };
    this.add.text(GRID_START_X + CELL_SIZE * 0.5, GRID_START_Y - 12, 'FRONT', { ...style, fontSize: '9px' }).setOrigin(0.5, 0.5);
    this.add.text(GRID_START_X + CELL_SIZE * 3.5, GRID_START_Y - 12, 'BACK', { ...style, fontSize: '9px' }).setOrigin(0.5, 0.5);
  }

  _spawnPlayer(col, row) {
    const pos = gridToScreen(col, row);
    // Texture pre-registered in BootScene; never re-register here.
    const key = 'player_default';
    const img = this.add.image(pos.x, pos.y, key).setDisplaySize(58, 58).setDepth(10);
    const item = { type: 'player', col, row, img, isPlayer: true, expiryTurns: 0, isHot: false, isFrozen: false, isHeavy: false };
    this.grid[col][row] = item;
    this.items.push(item);
    this.playerItem = item;
    return item;
  }

  _preloadTextures(placements) {
    // All textures are pre-registered in BootScene; this is now a no-op kept for API compatibility.
    return placements.map(p => `item_${p.type}`);
  }

  _spawnItem(p, delay = 0) {
    // Texture pre-registered in BootScene; use it directly.
    const key = this.textures.exists(`item_${p.type}`) ? `item_${p.type}` : 'item_milk';
    const pos = gridToScreen(p.col, p.row);
    const img = this.add.image(pos.x, pos.y - GAME_HEIGHT, key)
      .setDisplaySize(58, 58).setDepth(5);

    const item = {
      type: p.type,
      col: p.col,
      row: p.row,
      img,
      isPlayer: false,
      expiryTurns: p.expiryTurns || 0,
      isHot: p.isHot || false,
      isFrozen: p.isFrozen || false,
      isHeavy: p.isHeavy || false,
      isFragile: p.isFragile || false,
      isSlippery: false,
    };

    this.grid[p.col][p.row] = item;
    this.items.push(item);

    // Cascade drop animation
    this.time.delayedCall(delay, () => {
      this.tweens.add({
        targets: img,
        y: pos.y,
        duration: 350,
        ease: 'Bounce.Out',
      });
    });

    // Add expiry ring if needed
    if (item.expiryTurns > 0) this._addExpiryIndicator(item);
    return item;
  }

  _addExpiryIndicator(item) {
    if (item.expiryCircle) item.expiryCircle.destroy();
    const pos = gridToScreen(item.col, item.row);
    const circle = this.add.graphics().setDepth(6);
    circle.lineStyle(3, COLOR.EXPIRY, 0.85);
    circle.strokeCircle(0, 0, 26);
    circle.setPosition(pos.x, pos.y);
    item.expiryCircle = circle;
    this.tweens.add({ targets: circle, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
  }

  _setupInput() {
    let dragStartX = 0, dragStartY = 0, isDragging = false;

    this.input.on('pointerdown', (pointer) => {
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      isDragging = false;
      const gc = screenToGrid(pointer.x, pointer.y);
      if (gc.col < 0 || gc.col >= GRID_COLS || gc.row < 0 || gc.row >= GRID_ROWS) return;
      const item = this.grid[gc.col][gc.row];
      if (!item) return;
      this.dragItem = item;
      this.dragOriginCol = gc.col;
      this.dragOriginRow = gc.row;
      this.dragOffsetX = item.img.x - pointer.x;
      this.dragOffsetY = item.img.y - pointer.y;
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.dragItem) return;
      const dx = pointer.x - dragStartX;
      const dy = pointer.y - dragStartY;
      if (!isDragging && Math.sqrt(dx * dx + dy * dy) < 8) return;
      isDragging = true;
      this.dragItem.img.setScale(1.1).setDepth(20);
      this.dragItem.img.x = pointer.x + this.dragOffsetX;
      this.dragItem.img.y = pointer.y + this.dragOffsetY;
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.dragItem) return;
      if (!isDragging) {
        // Tap = inspect
        this._showTooltip(this.dragItem);
        this.dragItem = null;
        return;
      }
      const gc = screenToGrid(pointer.x, pointer.y);
      this._handleDrop(gc.col, gc.row);
    });
  }

  _handleDrop(targetCol, targetRow) {
    const item = this.dragItem;
    if (!item) return;
    this.dragItem = null;
    item.img.setScale(1.0).setDepth(item.isPlayer ? 10 : 5);

    const validTarget = targetCol >= 0 && targetCol < GRID_COLS && targetRow >= 0 && targetRow < GRID_ROWS;
    if (!validTarget) {
      // Return to origin
      this._animateToCell(item, item.col, item.row);
      return;
    }
    if (targetCol === item.col && targetRow === item.row) {
      this._animateToCell(item, item.col, item.row);
      return;
    }

    const targetItem = this.grid[targetCol][targetRow];
    if (targetItem) {
      // Swap
      this._swapItems(item, targetItem);
    } else {
      // Move to empty
      this.grid[item.col][item.row] = null;
      item.col = targetCol;
      item.row = targetRow;
      this.grid[targetCol][targetRow] = item;
      this._animateToCell(item, targetCol, targetRow);
    }
    this._playSound('snap');
    if (navigator.vibrate && GlobalState.settings.vibration) navigator.vibrate(20);
    this._processItemInteractions();
    this._checkPlayerPosition();
  }

  _swapItems(a, b) {
    const ac = a.col, ar = a.row;
    const bc = b.col, br = b.row;
    this.grid[ac][ar] = b;
    this.grid[bc][br] = a;
    a.col = bc; a.row = br;
    b.col = ac; b.row = ar;
    this._animateToCell(a, bc, br);
    this._animateToCell(b, ac, ar);
    // Swap flash
    this._flashCell(bc, br, 0xFFD700);
    this._flashCell(ac, ar, 0xFFD700);
  }

  _animateToCell(item, col, row) {
    const pos = gridToScreen(col, row);
    this.tweens.add({
      targets: item.img,
      x: pos.x, y: pos.y,
      duration: 200,
      ease: 'Back.Out',
    });
    if (item.expiryCircle) {
      this.tweens.add({ targets: item.expiryCircle, x: pos.x, y: pos.y, duration: 200, ease: 'Back.Out' });
    }
  }

  _flashCell(col, row, color) {
    const pos = gridToScreen(col, row);
    const flash = this.add.rectangle(pos.x, pos.y, CELL_SIZE - 4, CELL_SIZE - 4, color, 0.5).setDepth(15);
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
  }

  _checkPlayerPosition() {
    const col = this.playerItem.col;
    if (col === 0) {
      // Safe pulse
      this._pulseSafe();
    } else if (col === 3) {
      this._pulseDanger();
    }
    this.hud.updateLives(this.lives);
  }

  _pulseSafe() {
    const pos = gridToScreen(this.playerItem.col, this.playerItem.row);
    const ring = this.add.graphics().setDepth(12);
    ring.lineStyle(3, COLOR.SAFE_ZONE, 1);
    ring.strokeCircle(pos.x, pos.y, 28);
    this.tweens.add({ targets: ring, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
  }

  _pulseDanger() {
    this.cameras.main.shake(300, 0.008);
    const vignette = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOR.DANGER_ZONE, 0.3).setDepth(30);
    this.tweens.add({ targets: vignette, alpha: 0, duration: 600, onComplete: () => vignette.destroy() });
  }

  _processItemInteractions() {
    for (const item of [...this.items]) {
      if (item.isPlayer || !item.img || !item.img.active) continue;
      if (item.isHot) this._checkHotMelt(item);
      if (item.isHeavy) this._checkHeavyCrush(item);
    }
  }

  _checkHotMelt(hotItem) {
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [dc, dr] of dirs) {
      const nc = hotItem.col + dc, nr = hotItem.row + dr;
      if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
      const neighbor = this.grid[nc][nr];
      if (neighbor && neighbor.isFrozen && !neighbor.isSlippery) {
        neighbor.isSlippery = true;
        this.hud.addScore(SCORE_VALUES.interactionBonus, nc, nr, this);
      }
    }
  }

  _checkHeavyCrush(heavyItem) {
    const nr = heavyItem.row + 1;
    if (nr >= GRID_ROWS) return;
    const below = this.grid[heavyItem.col][nr];
    if (below && below.isFragile && !below.isPlayer) {
      this._removeItem(below);
      this.hud.addScore(SCORE_VALUES.interactionBonus, heavyItem.col, nr, this);
    }
  }

  _removeItem(item) {
    this.grid[item.col][item.row] = null;
    const idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);
    this.tweens.add({ targets: item.img, alpha: 0, y: item.img.y + 20, duration: 300, onComplete: () => item.img.destroy() });
    if (item.expiryCircle) {
      this.tweens.add({ targets: item.expiryCircle, alpha: 0, duration: 300, onComplete: () => item.expiryCircle.destroy() });
    }
  }

  _showTooltip(item) {
    if (this.tooltipText) this.tooltipText.destroy();
    const label = item.isPlayer ? 'You (Tupperware)' : (item.type.charAt(0).toUpperCase() + item.type.slice(1));
    const props = [];
    if (item.isHot) props.push('HOT');
    if (item.isFrozen) props.push('FROZEN');
    if (item.isHeavy) props.push('HEAVY');
    if (item.isFragile) props.push('FRAGILE');
    if (item.expiryTurns > 0) props.push(`Expires in ${item.expiryTurns} turns`);
    const text = label + (props.length ? '\n' + props.join(' | ') : '');
    const pos = gridToScreen(item.col, item.row);
    this.tooltipText = this.add.text(pos.x, pos.y - 44, text, {
      fontSize: '11px', color: '#1A1A2E', backgroundColor: '#FFF8E7', padding: { x: 6, y: 4 },
      fontFamily: 'Arial', align: 'center',
    }).setOrigin(0.5, 1).setDepth(50);
    this.time.delayedCall(1500, () => { if (this.tooltipText) { this.tooltipText.destroy(); this.tooltipText = null; } });
  }

  _startNextWave() {
    this.waveNumber++;
    const isRest = this.waveGenerator.isRestWave(this.waveNumber);
    const isBoss = this.waveGenerator.isBossWave(this.waveNumber);

    // Wave banner
    const bannerText = isRest ? 'QUICK RUN! 🛒' : isBoss ? 'BULK SHOPPING!!!' : 'GROCERY RUN!';
    const banner = this.add.text(GAME_WIDTH / 2, -40, bannerText, {
      fontSize: '22px', color: '#FFF8E7', backgroundColor: '#E63946', padding: { x: 16, y: 8 }, fontFamily: 'Arial bold',
    }).setOrigin(0.5, 0.5).setDepth(50);
    this.tweens.add({
      targets: banner, y: HUD_HEIGHT + 40, duration: 300, ease: 'Back.Out',
      onComplete: () => this.time.delayedCall(800, () => {
        this.tweens.add({ targets: banner, y: -60, duration: 250, onComplete: () => banner.destroy() });
        this._dropWaveItems(isRest, isBoss);
      }),
    });
    this.hud.updateWave(this.waveNumber, isRest);
  }

  _dropWaveItems(isRest, isBoss) {
    const placements = this.waveGenerator.generateWave(this.waveNumber, this.playerItem.col, this.playerItem.row);
    this._preloadTextures(placements);
    let delay = 0;
    for (const p of placements) {
      if (this.grid[p.col][p.row]) continue; // skip occupied
      this._spawnItem(p, delay);
      delay += 80;
    }
    // Start timer after all items land
    const totalDelay = delay + 500;
    this.time.delayedCall(totalDelay, () => this._beginWaveTimer(isRest));
  }

  _beginWaveTimer(isRest) {
    const base = this.waveGenerator.getWaveTimer(this.waveNumber);
    this.waveDuration = isRest ? base + 500 : base;
    this.waveTimeRemaining = this.waveDuration;
    this.waveActive = true;
    this._playSound('waveStart');
  }

  update(time, delta) {
    if (!this.waveActive) return;
    this.waveTimeRemaining -= delta;
    const pct = Math.max(0, this.waveTimeRemaining / this.waveDuration);
    this.hud.updateTimer(pct);

    if (this.waveTimeRemaining <= 0) {
      this.waveActive = false;
      this._endWave();
    }
  }

  _endWave() {
    const playerCol = this.playerItem.col;
    let points = 0;

    if (playerCol === 0) {
      points = SCORE_VALUES.waveFront;
      const timeBonus = Math.floor(this.waveTimeRemaining / 500) * SCORE_VALUES.speedBonusPerHalfSec;
      points += Math.max(0, timeBonus);
      this.combo++;
      if (this.combo > 1) points = Math.round(points * Math.min(1 + (this.combo - 1) * 0.5, 3));
      this.backRowTurns = 0;
    } else if (playerCol === 1) {
      points = SCORE_VALUES.waveMid;
      this.combo = 0;
    } else if (playerCol === 2) {
      points = SCORE_VALUES.waveBack;
      this.combo = 0;
    } else {
      // Back row - lose life
      this.combo = 0;
      this.backRowTurns++;
      if (this.backRowTurns >= 3) {
        this._gameOver();
        return;
      }
      this._loseLife();
      if (this.lives <= 0) return;
    }

    if (points > 0) {
      this.score += points;
      this.hud.updateScore(this.score);
      this.hud.showScorePop(points, this.playerItem.img.x, this.playerItem.img.y, this);
      if (this.combo > 1) this.hud.showCombo(this.combo, this);
    }

    // Smell meter update
    if (this.smellBlocked > 0) {
      this.smellBlocked--;
    } else {
      const tier = this.waveGenerator.getDifficultyTier(this.waveNumber);
      this.smellMeter = Math.min(100, this.smellMeter + tier.smellRate);
      if (this.smellMeter >= 100) this._humanInspection();
    }
    this.hud.updateSmell(this.smellMeter);

    // Expiry countdown
    this._tickExpiry();

    // Fridge points
    this.fridgePoints += this.waveNumber <= 10 ? FRIDGE_POINTS_RATE.earlyWave : FRIDGE_POINTS_RATE.lateWave;

    // Flash green on surviving items
    if (playerCol <= 1) this._flashGreen();
    this.time.delayedCall(600, () => this._startNextWave());
  }

  _loseLife() {
    this.lives--;
    this.hud.updateLives(this.lives);
    if (this.lives <= 0) {
      this._gameOver();
      return;
    }
    // Push back animation
    this.cameras.main.shake(300, 0.012);
    this._showPushBackText();
    this._playSound('pushBack');
    // Smell meter reset
    this.smellMeter = 0;
    this.hud.updateSmell(0);
  }

  _showPushBackText() {
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'YOU\'VE BEEN\nPUSHED BACK...', {
      fontSize: '24px', color: '#FF4444', fontFamily: 'Arial bold', align: 'center',
    }).setOrigin(0.5, 0.5).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: txt, alpha: 1, duration: 300, yoyo: true, hold: 1200, onComplete: () => txt.destroy() });
  }

  _flashGreen() {
    for (const item of this.items) {
      if (item.col <= 1 && item.img && item.img.active) {
        this.tweens.add({ targets: item.img, alpha: 0.5, duration: 200, yoyo: true });
      }
    }
  }

  _tickExpiry() {
    for (const item of [...this.items]) {
      if (item.isPlayer || item.expiryTurns <= 0) continue;
      item.expiryTurns--;
      if (item.expiryTurns <= 0) {
        this._expireItem(item);
      }
    }
  }

  _expireItem(item) {
    this.hud.addScore(SCORE_VALUES.expiryClear, item.col, item.row, this);
    this._removeItem(item);
  }

  _humanInspection() {
    this.smellMeter = 0;
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0.8).setDepth(55);
    this.time.delayedCall(600, () => {
      this.tweens.add({ targets: overlay, alpha: 0, duration: 300, onComplete: () => overlay.destroy() });
    });
    this._playSound('inspection');
    // Remove front row expiring items
    for (let row = 0; row < GRID_ROWS; row++) {
      const item = this.grid[0][row];
      if (item && !item.isPlayer && item.expiryTurns <= 2 && item.expiryTurns > 0) {
        this._removeItem(item);
      }
    }
  }

  _gameOver() {
    this.waveActive = false;
    this._playSound('gameOver');
    const finalScore = this.score;
    const wave = this.waveNumber;
    const fp = this.fridgePoints;

    // Update global state
    if (finalScore > GlobalState.highScore) {
      GlobalState.highScore = finalScore;
      GlobalState.isNewHighScore = true;
    } else {
      GlobalState.isNewHighScore = false;
    }
    if (wave > GlobalState.highestWave) GlobalState.highestWave = wave;
    GlobalState.gamesPlayed++;
    GlobalState.lastScore = finalScore;
    GlobalState.lastWave = wave;
    GlobalState.lastFridgePoints = fp;
    GlobalState.fridgePoints += fp;
    GlobalState.totalFridgePoints += fp;
    saveState();

    // Items melt animation
    for (const item of this.items) {
      if (item.img && item.img.active) {
        this.tweens.add({ targets: item.img, y: item.img.y + 40, alpha: 0, duration: 800, ease: 'Quad.In' });
      }
    }
    const dimmer = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setDepth(70);
    this.tweens.add({ targets: dimmer, alpha: 0.7, duration: 800 });
    this.time.delayedCall(900, () => {
      AdManager.showInterstitial(() => {
        this.scene.start('GameOverScene');
      });
    });
  }

  // --- Audio ---
  _initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }
    this.input.once('pointerdown', () => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    });
  }

  _playSound(type) {
    if (!this.audioCtx || !GlobalState.settings.sound) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      switch (type) {
        case 'snap':
          osc.type = 'sine'; osc.frequency.setValueAtTime(250, now); osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);
          gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          break;
        case 'waveStart':
          osc.type = 'sine'; osc.frequency.setValueAtTime(440, now); osc.frequency.linearRampToValueAtTime(600, now + 0.3);
          gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          break;
        case 'pushBack':
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
          gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          break;
        case 'gameOver':
          osc.type = 'triangle'; osc.frequency.setValueAtTime(392, now);
          osc.frequency.setValueAtTime(330, now + 0.3);
          osc.frequency.setValueAtTime(261, now + 0.7);
          gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          break;
        case 'inspection':
          osc.type = 'sine'; osc.frequency.setValueAtTime(100, now); osc.frequency.linearRampToValueAtTime(300, now + 0.6);
          gain.gain.setValueAtTime(0.35, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
          break;
        default:
          osc.type = 'sine'; osc.frequency.setValueAtTime(1000, now);
          gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      }
      osc.start(now);
      osc.stop(now + 1.6);
    } catch (e) {}
  }

  shutdown() {
    if (this.audioCtx) { try { this.audioCtx.close(); } catch (e) {} }
  }
}
