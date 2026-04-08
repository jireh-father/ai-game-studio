// Input handling, group checking, pause - mixin into GameScene
Object.assign(GameScene.prototype, {
  onPointerDown(pointer) {
    if (this.gameOver || this.paused) return;
    if (pointer.y < HUD_H) return;
    this.lastInputTime = Date.now();
    this.pointerStartX = pointer.x;
    this.pointerStartY = pointer.y;
    this.pointerMoved = false;
    this.dragging = true;
    this.selected = [];
    this.selectGfx.clear();
    const card = this.getCardAt(pointer.x, pointer.y);
    if (card) this.addToSelection(card);
  },

  onPointerMove(pointer) {
    if (!this.dragging || this.gameOver || this.paused) return;
    const dx = pointer.x - this.pointerStartX;
    const dy = pointer.y - this.pointerStartY;
    if (Math.sqrt(dx*dx + dy*dy) > DRAG_THRESHOLD) this.pointerMoved = true;
    const card = this.getCardAt(pointer.x, pointer.y);
    if (card && !this.selected.includes(card)) {
      this.addToSelection(card);
      Effects.selectSound();
    }
    this.redrawSelection(pointer.x, pointer.y);
  },

  onPointerUp(pointer) {
    if (!this.dragging) return;
    this.dragging = false;
    if (!this.pointerMoved && this.selected.length <= 1) {
      this.selected = [];
      this.selectGfx.clear();
      return;
    }
    if (this.selected.length === 4) this.checkGroup();
    else this.selected = [];
    this.selectGfx.clear();
  },

  addToSelection(card) {
    if (this.selected.length >= 4) return;
    this.selected.push(card);
    Effects.punch(this, card, 1.15, 80);
  },

  redrawSelection(px, py) {
    this.selectGfx.clear();
    if (this.selected.length === 0) return;
    this.selectGfx.lineStyle(5, 0xffe066, 0.9);
    this.selectGfx.beginPath();
    this.selectGfx.moveTo(this.selected[0].x, this.selected[0].y);
    for (let i = 1; i < this.selected.length; i++) {
      this.selectGfx.lineTo(this.selected[i].x, this.selected[i].y);
    }
    if (this.dragging) this.selectGfx.lineTo(px, py);
    this.selectGfx.strokePath();
  },

  getCardAt(x, y) {
    for (const c of this.activeCards) {
      if (Math.abs(x - c.x) < CARD_W/2 && Math.abs(y - c.y) < CARD_H/2) return c;
    }
    return null;
  },

  checkGroup() {
    const groups = this.selected.map(c => c.cardData.group);
    const allSame = groups.every(g => g === groups[0]);
    const hasTrap = this.selected.some(c => c.cardData.trap);
    if (allSame && !hasTrap) this.clearGroup(this.selected);
    else this.wrongGuess();
    this.selected = [];
  },

  clearGroup(cards) {
    const now = Date.now();
    const since = now - this.lastClearTime;
    if (since < 4000) this.combo++;
    else this.combo = 1;
    this.comboTimer = 4000;
    this.lastClearTime = now;

    const groupIdx = cards[0].cardData.group;
    const color = GROUP_COLORS[groupIdx];
    let pts = 200;
    if (this.combo >= 3) pts += 600;
    else if (this.combo >= 2) pts += 300;
    this.score += pts;

    cards.forEach((c) => {
      Effects.burst(this, c.x, c.y, color, Math.min(12, Math.floor(PARTICLE_CAP / cards.length)));
      this.tweens.add({
        targets: c, scale: 1.5, alpha: 0, duration: 250,
        onComplete: () => this.recycleCard(c)
      });
    });

    Effects.shake(this, this.combo >= 3 ? 0.015 : 0.008, 150);
    Effects.hitStop(this, 40);
    Effects.clearSound(this.combo);
    Effects.floatText(this, cards[1].x, cards[1].y - 30, '+' + pts, '#ffd700', 20 + this.combo * 2);

    if (this.combo >= 2) {
      this.comboText.setText('COMBO x' + this.combo);
      Effects.punch(this, this.comboText, 1.4, 100);
    }
    this.updateHUD();
  },

  wrongGuess() {
    this.hp -= 1;
    this.currentStage.fallSpeed *= 1.15;
    this.selected.forEach(c => {
      Effects.punch(this, c, 0.9, 100);
      c.bg.setFillStyle(0xff3355);
      this.time.delayedCall(200, () => {
        if (c.active && c.cardData) c.bg.setFillStyle(c.cardData.trap ? 0xff6b4a : 0xf4e4bc);
      });
    });
    Effects.shake(this, 0.012, 200);
    Effects.flash(this, 0x550000, 120);
    Effects.wrongSound();
    Effects.floatText(this, this.gameW/2, this.gameH/2, '-1 HP', '#ff3355', 26);
    this.updateHUD();
    if (this.hp <= 0) this.triggerGameOver();
  },

  recycleCard(card) {
    card.active = false;
    card.setVisible(false);
    card.cardData = null;
    const idx = this.activeCards.indexOf(card);
    if (idx >= 0) this.activeCards.splice(idx, 1);
  },

  updateHUD() {
    this.scoreText.setText('SCORE: ' + this.score);
    this.hpText.setText('HP: ' + this.hp);
  },

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.pauseOverlay = this.add.rectangle(this.gameW/2, this.gameH/2, this.gameW, this.gameH, 0x000000, 0.7).setDepth(600).setInteractive();
      this.pauseText = this.add.text(this.gameW/2, this.gameH/2 - 40, 'PAUSED', {
        fontFamily: 'Arial Black', fontSize: '32px', color: '#fff'
      }).setOrigin(0.5).setDepth(601);
      this.resumeBtn = this.add.text(this.gameW/2, this.gameH/2 + 20, '[ RESUME ]', {
        fontFamily: 'Arial Black', fontSize: '20px', color: '#4cd964'
      }).setOrigin(0.5).setDepth(601).setInteractive();
      this.helpBtn = this.add.text(this.gameW/2, this.gameH/2 + 60, '[ HELP ]', {
        fontFamily: 'Arial Black', fontSize: '20px', color: '#f4c20d'
      }).setOrigin(0.5).setDepth(601).setInteractive();
      this.menuBtn = this.add.text(this.gameW/2, this.gameH/2 + 100, '[ MENU ]', {
        fontFamily: 'Arial Black', fontSize: '20px', color: '#5ac8fa'
      }).setOrigin(0.5).setDepth(601).setInteractive();
      this.resumeBtn.on('pointerdown', () => this.togglePause());
      this.helpBtn.on('pointerdown', () => {
        this.scene.pause();
        this.scene.launch('HelpScene', { returnTo: 'GameScene' });
      });
      this.menuBtn.on('pointerdown', () => {
        this.scene.stop();
        this.scene.start('MenuScene');
      });
    } else {
      [this.pauseOverlay, this.pauseText, this.resumeBtn, this.helpBtn, this.menuBtn].forEach(o => o && o.destroy());
      this.lastInputTime = Date.now();
    }
  },

  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    Effects.shake(this, 0.02, 400);
    Effects.flash(this, 0xff0000, 300);
    Effects.deathSound();
    this.time.delayedCall(900, () => {
      this.scene.start('GameOverScene', { score: this.score, stage: this.stageNumber });
    });
  }
});
