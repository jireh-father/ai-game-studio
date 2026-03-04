// game.js — Core gameplay: grills, patties, timers, flip logic

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.BG);
    this.score = 0; this.lives = CONFIG.LIVES_START; this.combo = 0;
    this.perfectStreak = 0; this.stageNum = 1; this.correctServes = 0;
    this.lastFlipTime = this.time.now; this.gameActive = true;
    this.isTutorial = true; this.tutorialFlips = 0;
    this.grills = []; this.patties = []; this.customers = [];
    this.stageData = Stages.getData(1);
    this.inactivityWarning = null;
    this.setupStage();
    this.events.emit('stageChange', 1);
    this.events.emit('ordersChange', 0, this.stageData.target);
  }

  setupStage() {
    this.grills.forEach(g => { g.bg.destroy(); g.bars.destroy(); if (g.zone) g.zone.destroy(); });
    this.patties.forEach(p => this.clearPatty(p));
    this.customers.forEach(c => { if (c.sprite) c.sprite.destroy(); });
    this.grills = []; this.patties = []; this.customers = [];
    if (this.inactivityWarning) { this.inactivityWarning.destroy(); this.inactivityWarning = null; }
    const layout = GRILL_LAYOUTS[this.stageData.grills];
    layout.forEach((pos, idx) => {
      const grill = this.createGrill(pos, idx);
      this.grills.push(grill);
      this.spawnPatty(grill);
      this.spawnCustomer(grill);
    });
    if (this.stageData.grills > 1) {
      this.spawnTimer = this.time.addEvent({
        delay: this.stageData.spawnInterval * 1000,
        callback: () => this.onSpawnTick(), loop: true
      });
    }
  }

  createGrill(pos, idx) {
    const isHot = this.stageData.hasHotGrill && idx === 0;
    const bg = this.add.graphics();
    bg.fillStyle(CONFIG.GRILL_DARK, 1);
    bg.fillRoundedRect(pos.x - pos.w / 2, pos.y - pos.h / 2, pos.w, pos.h, 8);
    const bars = this.add.graphics();
    const barColor = isHot ? CONFIG.GRILL_HOT : CONFIG.GRILL_BAR;
    for (let i = 0; i < 5; i++) {
      const by = pos.y - pos.h / 2 + 30 + i * ((pos.h - 60) / 4);
      bars.lineStyle(4, barColor, 1);
      bars.beginPath(); bars.moveTo(pos.x - pos.w / 2 + 10, by);
      bars.lineTo(pos.x + pos.w / 2 - 10, by); bars.strokePath();
    }
    const zone = this.add.rectangle(pos.x, pos.y, pos.w - 8, pos.h - 8).setInteractive().setAlpha(0.001);
    zone.on('pointerdown', () => this.onGrillTap(idx));
    return { pos, bg, bars, zone, idx, isHot, cookSpeed: isHot ? 1.3 : 1.0 };
  }

  spawnPatty(grill) {
    const isDouble = this.stageData.hasDouble && Math.random() < 0.3;
    const cookTime = this.stageData.cookTime / grill.cookSpeed;
    const speedMult = (this.isTutorial && this.tutorialFlips < CONFIG.TUTORIAL_COUNT) ? CONFIG.TUTORIAL_SLOW : 1;
    const p = {
      grillIdx: grill.idx, cookProgress: 0, cookTime: (cookTime / speedMult) * 1000,
      state: 'raw', flipsNeeded: isDouble ? 2 : 1, flipsDone: 0,
      isDouble, graphics: this.add.graphics(), pattySprite: null,
      arcGraphics: this.add.graphics(), x: grill.pos.x, y: grill.pos.y
    };
    p.pattySprite = this.add.image(grill.pos.x, grill.pos.y + 10, 'pattyRaw').setDepth(5);
    SFX.play('sizzle');
    Effects.steamEffect(this, grill.pos.x, grill.pos.y - 20);
    if (isDouble) {
      p.doubleRing = this.add.graphics();
      this.tweens.add({ targets: p.doubleRing, alpha: 1, scaleX: 1.1, scaleY: 1.1, duration: 250, yoyo: true });
    }
    this.patties.push(p);
    if (this.isTutorial && this.tutorialFlips === 0 && this.patties.length === 1) {
      this.tutorialText = this.add.text(grill.pos.x, grill.pos.y - 60, 'TAP IN GREEN!', {
        fontSize: '16px', fontFamily: 'Arial Black', color: '#44CC44', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(50);
      this.tweens.add({ targets: this.tutorialText, y: grill.pos.y - 70, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  spawnCustomer(grill) {
    const sprite = this.add.image(grill.pos.x, grill.pos.y - grill.pos.h / 2 - 28, 'customerWait').setScale(0.9).setDepth(10);
    this.tweens.add({ targets: sprite, scaleX: 0.95, scaleY: 0.95, duration: 300, from: 0, ease: 'Back.easeOut' });
    this.customers[grill.idx] = { sprite, patience: 10000, waiting: false, served: false };
  }

  onSpawnTick() {
    if (!this.gameActive) return;
    this.grills.forEach(g => {
      const hasPatty = this.patties.some(p => p.grillIdx === g.idx && p.state !== 'done');
      if (!hasPatty) { this.spawnPatty(g); this.spawnCustomer(g); }
    });
  }

  onGrillTap(grillIdx) {
    if (!this.gameActive) return;
    const patty = this.patties.find(p => p.grillIdx === grillIdx && p.state !== 'done');
    if (!patty) return;
    const progress = patty.cookProgress;
    const flipZone = this.stageData.flipZone;
    if (patty.state === 'raw' || (patty.isDouble && patty.flipsDone < patty.flipsNeeded - 1)) {
      const grade = Stages.gradeFlip(progress, flipZone);
      patty.flipsDone++;
      this.lastFlipTime = this.time.now;
      if (grade === 'MISS') { this.onMiss(patty); return; }
      patty.state = patty.flipsDone >= patty.flipsNeeded ? 'cooked' : 'flipping';
      patty.cookProgress = 0;
      if (patty.pattySprite) patty.pattySprite.setTexture(patty.state === 'cooked' ? 'pattyCooked' : 'pattyRaw');
      Effects.flipJuice(this, patty, grade);
      this.processGrade(grade, patty);
    } else if (patty.state === 'cooked' || patty.state === 'flipping') {
      const grade = Stages.gradeFlip(progress, flipZone);
      this.lastFlipTime = this.time.now;
      if (grade === 'MISS') { this.onMiss(patty); return; }
      this.platePatty(patty, grade);
    }
  }

  processGrade(grade, patty) {
    const g = GRADE[grade];
    if (grade === 'PERFECT' || grade === 'GOOD') {
      this.combo++;
      this.perfectStreak = grade === 'PERFECT' ? this.perfectStreak + 1 : 0;
      if (this.perfectStreak >= CONFIG.PERFECT_STREAK_LIFE && this.lives < CONFIG.LIVES_MAX) {
        this.lives++; this.perfectStreak = 0;
        this.events.emit('livesChange', this.lives);
        this.events.emit('lifeGained');
        SFX.play('comboMilestone');
      }
      SFX.play(grade === 'PERFECT' ? 'perfect' : 'good', this.combo);
    } else if (grade === 'LATE') {
      this.combo = 0; SFX.play('late');
    }
    const multi = Stages.getComboMultiplier(this.combo);
    const pts = g.pts * multi;
    if (pts > 0) {
      this.score += pts;
      this.events.emit('scoreChange', this.score);
      this.events.emit('floatScore', { x: patty.x, y: patty.y - 30, pts });
    }
    this.events.emit('comboChange', this.combo);
    this.events.emit('gradePopup', { x: patty.x, y: patty.y, grade });
    if (this.isTutorial && (grade === 'PERFECT' || grade === 'GOOD')) {
      this.tutorialFlips++;
      if (this.tutorialFlips >= CONFIG.TUTORIAL_COUNT && this.tutorialText) {
        this.tutorialText.destroy(); this.tutorialText = null; this.isTutorial = false;
      }
    }
  }

  platePatty(patty, grade) {
    this.processGrade(grade, patty);
    patty.state = 'done';
    this.correctServes++;
    this.events.emit('ordersChange', this.correctServes, this.stageData.target);
    const cust = this.customers[patty.grillIdx];
    if (cust && cust.sprite) {
      cust.sprite.setTexture('customerHappy');
      this.tweens.add({ targets: cust.sprite, y: cust.sprite.y - 8, duration: 150, yoyo: true });
      SFX.play('customerHappy');
      this.time.delayedCall(400, () => { if (cust.sprite) { cust.sprite.destroy(); cust.sprite = null; } });
    }
    this.time.delayedCall(200, () => this.clearPatty(patty));
    if (this.correctServes >= this.stageData.target) {
      this.stageClear();
    } else if (this.stageData.grills === 1) {
      this.time.delayedCall(500, () => {
        if (this.gameActive) { this.spawnPatty(this.grills[0]); this.spawnCustomer(this.grills[0]); }
      });
    }
  }

  onMiss(patty) {
    this.loseLife();
    if (this.combo > 1) this.events.emit('comboBreak');
    this.combo = 0; this.perfectStreak = 0;
    this.events.emit('comboChange', 0);
    this.events.emit('gradePopup', { x: patty.x, y: patty.y, grade: 'MISS' });
    SFX.play('miss');
    this.cameras.main.shake(200, 0.004);
  }

  onBurnt(patty) {
    patty.state = 'done';
    if (patty.pattySprite) patty.pattySprite.setTexture('pattyBurnt');
    this.loseLife();
    if (this.combo > 1) this.events.emit('comboBreak');
    this.combo = 0; this.perfectStreak = 0;
    this.events.emit('comboChange', 0);
    this.events.emit('gradePopup', { x: patty.x, y: patty.y, grade: 'BURNT' });
    SFX.play('burnt');
    this.cameras.main.shake(200, 0.006);
    const cust = this.customers[patty.grillIdx];
    if (cust && cust.sprite) {
      cust.sprite.setTexture('customerAngry');
      SFX.play('customerAngry');
      this.time.delayedCall(500, () => { if (cust.sprite) { cust.sprite.destroy(); cust.sprite = null; } });
    }
    Effects.grillShake(this, patty.grillIdx);
    this.time.delayedCall(400, () => {
      this.clearPatty(patty);
      if (this.gameActive && this.stageData.grills === 1) {
        this.spawnPatty(this.grills[0]); this.spawnCustomer(this.grills[0]);
      }
    });
  }

  loseLife() {
    this.lives--;
    this.events.emit('livesChange', this.lives);
    this.events.emit('lifeLost');
    if (this.lives <= 0) this.triggerGameOver();
  }

  clearPatty(p) {
    if (p.graphics) p.graphics.destroy();
    if (p.arcGraphics) p.arcGraphics.destroy();
    if (p.pattySprite) p.pattySprite.destroy();
    if (p.doubleRing) p.doubleRing.destroy();
    p.state = 'done';
  }

  stageClear() {
    this.gameActive = false;
    SFX.play('stageClear');
    this.cameras.main.shake(150, 0.003);
    this.events.emit('stageClear', this.stageNum);
    this.time.delayedCall(CONFIG.STAGE_CLEAR_DELAY, () => {
      this.stageNum++; this.correctServes = 0;
      this.stageData = Stages.getData(this.stageNum);
      this.events.emit('stageChange', this.stageNum);
      this.events.emit('ordersChange', 0, this.stageData.target);
      if (this.spawnTimer) this.spawnTimer.remove();
      this.gameActive = true; this.lastFlipTime = this.time.now;
      this.setupStage();
    });
  }

  triggerFireDeath() {
    if (!this.gameActive) return;
    this.gameActive = false;
    Effects.fireDeath(this);
    this.time.delayedCall(600, () => this.events.emit('gameOver', { score: this.score }));
  }

  triggerGameOver() {
    if (!this.gameActive) return;
    this.gameActive = false;
    SFX.play('gameOver');
    this.cameras.main.shake(250, 0.008);
    this.time.delayedCall(500, () => this.events.emit('gameOver', { score: this.score }));
  }

  update(time, delta) {
    if (!this.gameActive) return;
    this.patties.forEach(p => {
      if (p.state === 'done') return;
      p.cookProgress += delta / p.cookTime;
      if (p.cookProgress >= 1.0) { this.onBurnt(p); return; }
      Effects.drawArc(p, this.stageData.flipZone);
    });
    const idle = time - this.lastFlipTime;
    if (idle >= CONFIG.INACTIVITY_DEATH) {
      this.triggerFireDeath();
    } else if (idle >= CONFIG.INACTIVITY_CRIT) {
      Effects.showInactivityWarning(this, 0xDD2222, 0.6);
    } else if (idle >= CONFIG.INACTIVITY_WARN) {
      Effects.showInactivityWarning(this, 0xFF8800, 0.3);
    } else if (this.inactivityWarning) {
      this.inactivityWarning.destroy(); this.inactivityWarning = null;
    }
  }
}
