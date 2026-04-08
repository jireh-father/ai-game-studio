// Liar's Tower — HUD, pause, stage transitions, collapse (mixed into GameScene)
const HUDMixin = {
  createHUD() {
    this.add.rectangle(GAME_W / 2, 26, GAME_W, 52, 0x0D0D1A).setDepth(30);
    const pauseBtn = this.add.text(20, 26, '||', { fontSize: '22px', color: '#E8E8E8', fontStyle: 'bold' }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.togglePause());

    this.scoreText = this.add.text(55, 18, 'Score: ' + this.score, { fontSize: '14px', color: '#E8E8E8' }).setDepth(31);
    this.comboText = this.add.text(55, 34, '', { fontSize: '13px', color: '#FFE66D', fontStyle: 'bold' }).setDepth(31);

    this.shakeIcons = [];
    for (let i = 0; i < MAX_SHAKES; i++) {
      const ic = this.add.image(GAME_W / 2 - 30 + i * 30, 26, 'crack_empty').setDepth(31);
      this.shakeIcons.push(ic);
    }

    this.stageText = this.add.text(GAME_W - 60, 18, 'Stage ' + this.stage, { fontSize: '14px', color: '#00B4D8' }).setDepth(31);

    const helpBtn = this.add.text(GAME_W - 20, 38, '?', {
      fontFamily: 'Arial Black', fontSize: '18px', color: '#F5C518',
    }).setOrigin(0.5).setDepth(31).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => {
      if (!this.paused) this.togglePause();
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    this.towerBaseY = GAME_H - 60;
    this.add.rectangle(GAME_W / 2, GAME_H - 20, GAME_W, 40, 0x0D0D1A, 0.6).setDepth(20);
    this.add.text(GAME_W / 2, GAME_H - 20, '— TOWER —', { fontSize: '11px', color: '#555' }).setOrigin(0.5).setDepth(21);

    this.hintLeft = this.add.text(20, GAME_H / 2, '\u2190 LIAR', { fontSize: '14px', color: '#CC2936' }).setAlpha(0.6).setDepth(25);
    this.hintRight = this.add.text(GAME_W - 20, GAME_H / 2, 'KNIGHT \u2192', { fontSize: '14px', color: '#F5C518' }).setOrigin(1, 0).setAlpha(0.6).setDepth(25);
  },

  advanceStage() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    this.score += SCORE.stageBonus;
    this.scoreText.setText('Score: ' + this.score);
    Effects.floatText(this, GAME_W / 2, GAME_H / 2, 'STAGE CLEAR +500', '#FFE66D', 28);
    Effects.playTone(523, 0.1, 'sine', 0.15);
    setTimeout(() => Effects.playTone(659, 0.1, 'sine', 0.15), 80);
    setTimeout(() => Effects.playTone(784, 0.15, 'sine', 0.18), 160);
    this.time.delayedCall(900, () => {
      this.stage++;
      this.tower = [];
      this.children.list.filter(o => o.texture && (o.texture.key === 'tile_k' || o.texture.key === 'tile_l')).forEach(o => {
        if (o.y > 200) o.destroy();
      });
      this.loadStage();
      this.spawnNext();
    });
  },

  triggerCollapse() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.cleanupCurrent();
    this.cameras.main.shake(500, 0.02);
    Effects.playCollapse();
    this.children.list.filter(o => o.texture && (o.texture.key === 'tile_k' || o.texture.key === 'tile_l')).forEach(o => {
      if (o.y > 200) {
        this.tweens.add({
          targets: o,
          x: o.x + Phaser.Math.Between(-180, 180),
          y: GAME_H + 200,
          angle: Phaser.Math.Between(-180, 180),
          duration: 700, ease: 'Quad.easeIn',
        });
      }
    });
    this.cameras.main.zoomTo(0.9, 400);
    this.time.delayedCall(900, () => {
      this.scene.launch('GameOverScene', {
        score: this.score, placements: this.placements, stage: this.stage,
      });
      this.scene.pause();
    });
  },

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.pauseOverlay = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.7).setDepth(200);
      this.pauseText = this.add.text(GAME_W / 2, GAME_H / 2 - 60, 'PAUSED', {
        fontFamily: 'Arial Black', fontSize: '36px', color: '#F5C518',
      }).setOrigin(0.5).setDepth(201);
      const resumeBtn = this.add.rectangle(GAME_W / 2, GAME_H / 2 + 10, 200, 50, 0xF5C518).setDepth(201).setInteractive({ useHandCursor: true });
      const resumeTxt = this.add.text(GAME_W / 2, GAME_H / 2 + 10, 'RESUME', { fontSize: '20px', color: '#1A1A2E', fontStyle: 'bold' }).setOrigin(0.5).setDepth(202);
      const menuBtn = this.add.rectangle(GAME_W / 2, GAME_H / 2 + 80, 200, 50, 0x2E4057).setDepth(201).setInteractive({ useHandCursor: true });
      const menuTxt = this.add.text(GAME_W / 2, GAME_H / 2 + 80, 'MENU', { fontSize: '20px', color: '#E8E8E8' }).setOrigin(0.5).setDepth(202);
      this.pauseObjs = [this.pauseOverlay, this.pauseText, resumeBtn, resumeTxt, menuBtn, menuTxt];
      resumeBtn.on('pointerdown', () => this.togglePause());
      menuBtn.on('pointerdown', () => {
        this.scene.stop();
        this.scene.start('MenuScene');
      });
      this.pauseStartTime = this.time.now;
    } else {
      if (this.pauseObjs) this.pauseObjs.forEach(o => o.destroy());
      this.pauseObjs = null;
      if (this.pauseStartTime) {
        this.fallStart += (this.time.now - this.pauseStartTime);
        this.pauseStartTime = 0;
      }
      this.lastInputTime = Date.now();
    }
  },
};

// Apply mixin once GameScene is defined
if (typeof GameScene !== 'undefined') {
  Object.assign(GameScene.prototype, HUDMixin);
}
