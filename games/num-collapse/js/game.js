// game.js - GameScene: hex grid gameplay, merge logic, collapse, chain detection

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.gridCenterX = w / 2;
    this.gridCenterY = h * 0.42;
    this.cells = {};
    this.selectedCell = null;
    this.inputEnabled = true;
    this.chainCount = 0;
    this.bestChain = 0;
    this.elapsedMs = 0;
    this.idleSpawns = 0;
    this.cascading = false;

    GameState.score = 0;
    GameState.wave = 1;
    AdManager.reset();

    // Build hex grid
    this.cellContainer = this.add.container(0, 0);
    GRID_CELLS.forEach(({ q, r }) => {
      HexGrid.createEmptyCell(this, q, r, this.gridCenterX, this.gridCenterY,
                              this.cellContainer, this.cells, (qq, rr) => this._onCellTap(qq, rr));
    });

    // Place initial numbers
    const initial = generateInitialBoard(GRID_CELLS);
    initial.forEach(d => HexGrid.setCellValue(this, d.q, d.r, d.value, d.type,
                                              this.cells, this.cellContainer, this.gridCenterX, this.gridCenterY));

    this.waveParams = getWaveParams(1);
    this.spawnElapsed = 0;
    this.scene.launch('UIScene');

    // Stagger pop-in
    let delay = 0;
    GRID_CELLS.forEach(({ q, r }) => {
      const cell = this.cells[HexGrid.key(q, r)];
      if (cell && cell.sprite) {
        cell.sprite.setScale(0);
        this.tweens.add({ targets: cell.sprite, scaleX: 1, scaleY: 1, duration: 150, delay, ease: 'Back.easeOut' });
        if (cell.text) { cell.text.setScale(0); this.tweens.add({ targets: cell.text, scaleX: 1, scaleY: 1, duration: 150, delay, ease: 'Back.easeOut' }); }
        delay += 40;
      }
    });

    this._visHandler = () => { if (document.hidden) this.scene.pause(); else this.scene.resume(); };
    document.addEventListener('visibilitychange', this._visHandler);
    this.scene.get('GameOverScene').events.on('continue', this._onContinue, this);
  }

  update(time, delta) {
    if (this.cascading) return;
    this.elapsedMs += delta;
    const newWave = updateWave(this.elapsedMs);
    if (newWave !== GameState.wave) {
      GameState.wave = newWave;
      this.waveParams = getWaveParams(newWave);
      this.events.emit('waveUpdate', newWave);
    }
    this.spawnElapsed += delta;
    this.events.emit('spawnTimerUpdate', 1 - this.spawnElapsed / this.waveParams.interval);
    if (this.spawnElapsed >= this.waveParams.interval) { this.spawnElapsed = 0; this._spawnNumber(); }
    HexGrid.updateBombs(this, this.cells, delta, this.gridCenterX, this.gridCenterY);
    HexGrid.updateFrozen(this.cells, delta);
  }

  _onCellTap(q, r) {
    if (!this.inputEnabled || this.cascading) return;
    this.idleSpawns = 0;
    const cell = this.cells[HexGrid.key(q, r)];
    if (!cell || cell.value === 0 || cell.type === 'frozen') { if (this.selectedCell) this._deselect(); return; }
    SoundFX.play('click');
    const { x, y } = HexGrid.axialToPixel(q, r, this.gridCenterX, this.gridCenterY);
    HexGrid.burstParticles(this, x, y, JUICE.tapParticles, getCellColor(cell.value));
    this.tweens.add({ targets: cell.sprite, scaleX: JUICE.tapScale, scaleY: JUICE.tapScale, duration: JUICE.tapScaleMs / 2, yoyo: true });

    if (!this.selectedCell) { this._selectCell(q, r); }
    else if (this.selectedCell.q === q && this.selectedCell.r === r) { this._deselect(); }
    else { this._tryMerge(this.selectedCell, { q, r }); }
  }

  _selectCell(q, r) {
    this.selectedCell = { q, r };
    const cell = this.cells[HexGrid.key(q, r)];
    cell.sprite.setTexture('hexSelected').setDisplaySize(HEX.width, HEX.height);
    if (cell.text) cell.text.setDepth(10);
  }

  _deselect() {
    if (!this.selectedCell) return;
    const cell = this.cells[HexGrid.key(this.selectedCell.q, this.selectedCell.r)];
    if (cell && cell.value > 0) {
      const tk = cell.type === 'wild' ? 'hexWild' : cell.type === 'bomb' ? 'hexBomb' : 'hex' + Math.min(cell.value, 12);
      cell.sprite.setTexture(tk).setDisplaySize(HEX.width, HEX.height);
    }
    this.selectedCell = null;
  }

  _tryMerge(a, b) {
    const cA = this.cells[HexGrid.key(a.q, a.r)], cB = this.cells[HexGrid.key(b.q, b.r)];
    if (!cA || !cB || cA.value === 0 || cB.value === 0) { this._deselect(); return; }
    if (!HexGrid.isAdjacent(a, b)) { this._flashInvalid(b.q, b.r); this._deselect(); return; }
    if (cB.type === 'frozen') { this._flashInvalid(b.q, b.r); this._deselect(); return; }
    const matches = cA.value === cB.value || cA.type === 'wild' || cB.type === 'wild';
    if (!matches) { this._flashInvalid(b.q, b.r); this._deselect(); return; }
    let mv = cA.type === 'wild' ? cB.value * 2 : cB.type === 'wild' ? cA.value * 2 : cA.value + cB.value;
    this.idleSpawns = 0;
    this._executeMerge(a, b, mv);
  }

  _flashInvalid(q, r) {
    SoundFX.play('invalid');
    const cell = this.cells[HexGrid.key(q, r)]; if (!cell) return;
    const orig = cell.sprite.texture.key;
    cell.sprite.setTexture('hexInvalid').setDisplaySize(HEX.width, HEX.height);
    this.time.delayedCall(120, () => { if (cell.value > 0) cell.sprite.setTexture(orig).setDisplaySize(HEX.width, HEX.height); });
  }

  _executeMerge(a, b, mergeVal) {
    this.inputEnabled = false; this.cascading = true; this.chainCount = 0;
    const cA = this.cells[HexGrid.key(a.q, a.r)], cB = this.cells[HexGrid.key(b.q, b.r)];
    const pA = HexGrid.axialToPixel(a.q, a.r, this.gridCenterX, this.gridCenterY);
    const pB = HexGrid.axialToPixel(b.q, b.r, this.gridCenterX, this.gridCenterY);
    SoundFX.play('merge', { sum: mergeVal });
    this.tweens.add({ targets: cA.sprite, scaleX: JUICE.mergeScale, scaleY: JUICE.mergeScale, duration: JUICE.mergeScaleMs / 2, yoyo: true, ease: 'Back.easeOut' });
    if (cA.text) this.tweens.add({ targets: cA.text, scaleX: JUICE.mergeScale, scaleY: JUICE.mergeScale, duration: JUICE.mergeScaleMs / 2, yoyo: true });
    this.tweens.add({ targets: cB.sprite, scaleX: 0, scaleY: 0, duration: 150, ease: 'Cubic.easeIn' });
    if (cB.text) this.tweens.add({ targets: cB.text, scaleX: 0, scaleY: 0, duration: 150 });
    HexGrid.burstParticles(this, pA.x, pA.y, JUICE.mergeParticles, getCellColor(mergeVal));
    HexGrid.burstParticles(this, pB.x, pB.y, JUICE.mergeSrcParticles, getCellColor(cB.value), pA);
    this.cameras.main.shake(JUICE.shakeDuration, JUICE.shakeIntensity);
    let pts = SCORING.baseMult * mergeVal;
    if (mergeVal >= SCORING.highSumThreshold) pts = Math.floor(pts * SCORING.highSumMult);
    GameState.score += pts;
    this.events.emit('scoreUpdate', GameState.score);
    this.events.emit('floatScore', pA.x, pA.y - 20, pts);
    if (GameState.settings.vibration && navigator.vibrate) navigator.vibrate(20);
    this._deselect();

    this.time.delayedCall(TIMING.mergeAnim, () => {
      HexGrid.setCellValue(this, a.q, a.r, mergeVal, 'normal', this.cells, this.cellContainer, this.gridCenterX, this.gridCenterY);
      HexGrid.clearCell(b.q, b.r, this.cells);
      cB.sprite.setScale(1); if (cB.text) cB.text.setScale(1);
      this._collapseGap(b, a, 0);
    });
  }

  _collapseGap(emptyPos, mergePos, depth) {
    if (depth >= 3) { this._afterCollapse(); return; }
    const dq = emptyPos.q - mergePos.q, dr = emptyPos.r - mergePos.r;
    const oq = emptyPos.q + dq, or2 = emptyPos.r + dr;
    const oCell = this.cells[HexGrid.key(oq, or2)];
    if (!oCell || oCell.value === 0 || oCell.type === 'frozen') { this._afterCollapse(); return; }
    const tp = HexGrid.axialToPixel(emptyPos.q, emptyPos.r, this.gridCenterX, this.gridCenterY);
    this.tweens.add({ targets: oCell.sprite, x: tp.x, y: tp.y, duration: TIMING.collapseSlide, ease: 'Cubic.easeOut' });
    if (oCell.text) this.tweens.add({ targets: oCell.text, x: tp.x, y: tp.y, duration: TIMING.collapseSlide });
    this.time.delayedCall(TIMING.collapseSlide, () => {
      const v = oCell.value, t = oCell.type;
      HexGrid.clearCell(oq, or2, this.cells);
      HexGrid.setCellValue(this, emptyPos.q, emptyPos.r, v, t, this.cells, this.cellContainer, this.gridCenterX, this.gridCenterY);
      this._collapseGap({ q: oq, r: or2 }, emptyPos, depth + 1);
    });
  }

  _afterCollapse() { this.time.delayedCall(TIMING.chainDelay, () => this._detectChains()); }

  _detectChains() {
    if (this.chainCount >= 8) { this._finishCascade(); return; }
    for (const key of Object.keys(this.cells)) {
      const cell = this.cells[key];
      if (cell.value === 0 || cell.type === 'frozen') continue;
      const neighbors = HexGrid.getNeighbors(cell.q, cell.r, this.cells);
      for (const n of neighbors) {
        const nc = this.cells[HexGrid.key(n.q, n.r)];
        if (!nc || nc.value === 0 || nc.type === 'frozen') continue;
        if (cell.value === nc.value || cell.type === 'wild' || nc.type === 'wild') {
          this.chainCount++;
          if (this.chainCount > this.bestChain) this.bestChain = this.chainCount;
          this.events.emit('chainUpdate', this.chainCount);
          const dA = Math.abs(cell.q) + Math.abs(cell.r) + Math.abs(cell.q + cell.r);
          const dB = Math.abs(n.q) + Math.abs(n.r) + Math.abs(n.q + n.r);
          const tgt = dA <= dB ? cell : nc, src = tgt === cell ? nc : cell;
          let mv = tgt.type === 'wild' ? src.value * 2 : src.type === 'wild' ? tgt.value * 2 : tgt.value + src.value;
          this.cameras.main.shake(80, (JUICE.chainShakeBase + this.chainCount * JUICE.chainShakeStep) * 0.001);
          this.tweens.add({ targets: this.cameras.main, zoom: 1 + this.chainCount * JUICE.chainZoomStep, duration: 100 });
          SoundFX.play('chain', { step: this.chainCount });
          const pT = HexGrid.axialToPixel(tgt.q, tgt.r, this.gridCenterX, this.gridCenterY);
          HexGrid.burstParticlesHex(this, pT.x, pT.y, JUICE.chainParticlesBase + this.chainCount * JUICE.chainParticlesStep, [0xFFFFFF, 0xFFD700, 0xFF8C00, 0xFF4444][Math.min(this.chainCount - 1, 3)]);
          const cm = 1 + this.chainCount * 0.5;
          let pts = Math.floor(SCORING.baseMult * mv * cm + SCORING.chainBonus * this.chainCount);
          if (mv >= SCORING.highSumThreshold) pts = Math.floor(pts * SCORING.highSumMult);
          GameState.score += pts;
          this.events.emit('scoreUpdate', GameState.score);
          this.events.emit('floatScore', pT.x, pT.y - 20, pts);
          this.tweens.add({ targets: tgt.sprite, scaleX: JUICE.mergeScale, scaleY: JUICE.mergeScale, duration: 100, yoyo: true });
          this.tweens.add({ targets: src.sprite, scaleX: 0, scaleY: 0, duration: 100 });
          if (src.text) this.tweens.add({ targets: src.text, scaleX: 0, scaleY: 0, duration: 100 });
          this.time.delayedCall(TIMING.mergeAnim, () => {
            HexGrid.setCellValue(this, tgt.q, tgt.r, mv, 'normal', this.cells, this.cellContainer, this.gridCenterX, this.gridCenterY);
            HexGrid.clearCell(src.q, src.r, this.cells);
            src.sprite.setScale(1); if (src.text) src.text.setScale(1);
            this._collapseGap({ q: src.q, r: src.r }, tgt, 0);
          });
          return;
        }
      }
    }
    this._finishCascade();
  }

  _finishCascade() {
    this.cascading = false; this.inputEnabled = true; this.chainCount = 0;
    this.events.emit('chainUpdate', 0);
    this.tweens.add({ targets: this.cameras.main, zoom: 1, duration: 300 });
    const occ = Object.values(this.cells).filter(c => c.value > 0).length;
    if (occ === 0) { GameState.score += SCORING.boardClearBonus; this.events.emit('scoreUpdate', GameState.score); this.events.emit('floatScore', this.gridCenterX, this.gridCenterY, SCORING.boardClearBonus); }
    this._checkGameOver();
  }

  _spawnNumber() {
    const empty = Object.values(this.cells).filter(c => c.value === 0);
    if (empty.length === 0) { if (!HexGrid.hasAnyMatch(this.cells)) this._triggerDeath(); return; }
    const t = Phaser.Utils.Array.GetRandom(empty);
    const sType = pickSpecialType(this.waveParams);
    const num = pickSpawnNumber(this.waveParams.pool, this.waveParams.weights);
    HexGrid.setCellValue(this, t.q, t.r, num, sType, this.cells, this.cellContainer, this.gridCenterX, this.gridCenterY);
    t.sprite.setScale(0);
    this.tweens.add({ targets: t.sprite, scaleX: 1.1, scaleY: 1.1, duration: 150, ease: 'Back.easeOut', onComplete: () => { this.tweens.add({ targets: t.sprite, scaleX: 1, scaleY: 1, duration: 50 }); }});
    if (t.text) { t.text.setScale(0); this.tweens.add({ targets: t.text, scaleX: 1.1, scaleY: 1.1, duration: 150, ease: 'Back.easeOut', onComplete: () => { this.tweens.add({ targets: t.text, scaleX: 1, scaleY: 1, duration: 50 }); }}); }
    SoundFX.play('spawn');
    this.idleSpawns++;
    if (this.idleSpawns >= 3) this._triggerDeath();
    const occ = Object.values(this.cells).filter(c => c.value > 0).length;
    this.cameras.main.setBackgroundColor(occ >= 16 ? '#2A1A1A' : '#1A1A2E');
    this._checkGameOver();
  }

  _checkGameOver() {
    const empty = Object.values(this.cells).filter(c => c.value === 0);
    if (empty.length > 0) return;
    if (!HexGrid.hasAnyMatch(this.cells)) this._triggerDeath();
  }

  _triggerDeath() {
    if (!this.inputEnabled && !this.cascading) return;
    this.inputEnabled = false; this.cascading = true;
    SoundFX.play('death');
    this.cameras.main.shake(JUICE.deathShakeDuration, JUICE.deathShake);
    if (GameState.settings.vibration && navigator.vibrate) navigator.vibrate([50, 30, 50]);
    Object.values(this.cells).forEach(c => { if (c.sprite) c.sprite.setTint(0x888888); });
    let isNewBest = false;
    if (GameState.score > GameState.highScore) {
      GameState.highScore = GameState.score;
      try { localStorage.setItem('num_collapse_high_score', GameState.highScore); } catch (e) {}
      isNewBest = true;
    }
    GameState.gamesPlayed++;
    try { localStorage.setItem('num_collapse_games_played', GameState.gamesPlayed); } catch (e) {}
    AdManager.trackGameOver();
    this.time.delayedCall(500, () => {
      this.scene.launch('GameOverScene', { score: GameState.score, wave: GameState.wave, bestChain: this.bestChain, isNewBest });
      this.scene.stop('UIScene');
    });
  }

  _onContinue() {
    const occ = Object.values(this.cells).filter(c => c.value > 0);
    const shuffled = Phaser.Utils.Array.Shuffle(occ.slice());
    shuffled.slice(0, Math.min(3, shuffled.length)).forEach(c => HexGrid.clearCell(c.q, c.r, this.cells));
    Object.values(this.cells).forEach(c => { if (c.sprite) c.sprite.clearTint(); });
    this.cascading = false; this.inputEnabled = true; this.idleSpawns = 0;
    this.scene.launch('UIScene');
  }

  shutdown() { document.removeEventListener('visibilitychange', this._visHandler); }
}
