// game.js — GameScene: core gameplay, input, timer, strikes, form cards

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.continueFromStage = data && data.continueFromStage ? data.continueFromStage : null;
    this.continueScore = data && data.score ? data.score : 0;
  }

  create() {
    const w = DIMS.width, h = DIMS.height;

    // Game state
    this.score = this.continueFromStage ? this.continueScore : 0;
    this.strikes = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.stageNumber = this.continueFromStage || 1;
    this.formIndex = 0;
    this.gameOver = false;
    this.paused = false;
    this.inputLocked = false;
    this.stageTransitioning = false;
    this.dragging = false;
    this.dragStartX = 0;
    this.currentDragX = 0;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0xF5F0E8).setDepth(0);
    // Desk surface at bottom
    this.add.rectangle(w / 2, h - 20, w, 60, 0xD5CFC4).setDepth(0);

    // Rule bar background
    this.ruleBarBg = this.add.rectangle(w / 2, 60, w, DIMS.rulesBarHeight, 0xEBF5FB).setDepth(1);
    this.ruleCards = [];

    // HUD
    this.hud = new HUDManager(this);
    this.hud.create(this.score, this.strikes, this.stageNumber);

    // Desk decorations (hidden, for death animation)
    this.decoPencil = this.add.image(60, h - 50, 'deco-pencilcup').setDepth(5).setVisible(false);
    this.decoPlant = this.add.image(300, h - 50, 'deco-plant').setDepth(5).setVisible(false);
    this.decoNameplate = this.add.image(180, h - 40, 'deco-nameplate').setDepth(5).setVisible(false);

    // Form card container
    this.formGroup = this.add.container(DIMS.formCenterX, DIMS.formCenterY).setDepth(5);

    // Flash overlays
    this.flashOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x27AE60, 0).setDepth(50);

    // Stamp overlays
    this.stampApprove = this.add.image(DIMS.formCenterX, DIMS.formCenterY, 'stamp-approved')
      .setDepth(15).setAlpha(0);
    this.stampDeny = this.add.image(DIMS.formCenterX, DIMS.formCenterY, 'stamp-denied')
      .setDepth(15).setAlpha(0);

    // Generate first stage
    this.stageData = generateStage(this.stageNumber);
    this.decisionWindow = this.stageData.decisionWindow;
    this.timeRemaining = this.decisionWindow;

    // Show rules
    this.displayRules(this.stageData.rules);

    // Show first form
    this.showForm(this.stageData.forms[0]);

    // Input
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Tick timer for last 3 seconds
    this.tickPlayed = {};

    // Visibility change
    this.visHandler = () => {
      if (document.hidden && !this.gameOver && !this.paused) this.pauseGame();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    // New rule announcement for stages 3,5,8,12
    if ([3, 5, 8, 12].includes(this.stageNumber) && !this.continueFromStage) {
      this.showNewRuleAnnouncement();
    }

    this.cameras.main.fadeIn(200);
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.stageTransitioning || this.inputLocked) return;

    // Drain timer
    const dt = delta / 1000;
    this.timeRemaining -= dt;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.onTimeout();
      return;
    }

    // Tick sound in last 3 seconds
    const sec = Math.ceil(this.timeRemaining);
    if (sec <= 3 && !this.tickPlayed[sec]) {
      this.tickPlayed[sec] = true;
      synthTick();
    }

    // Update timer bar
    const pct = this.timeRemaining / this.decisionWindow;
    this.hud.updateTimer(pct, this.timeRemaining);
  }

  showForm(formData) {
    if (!formData) return;
    this.currentForm = formData;
    this.formGroup.removeAll(true);

    // Card background
    const card = this.add.image(0, 0, 'form-card');
    this.formGroup.add(card);

    // Applicant icon
    const appKey = 'icon-' + formData.applicant;
    if (this.textures.exists(appKey)) {
      this.formGroup.add(this.add.image(-80, -30, appKey));
    }
    this.formGroup.add(this.add.text(-80, 5, getIconLabel(formData.applicant), {
      fontSize: '9px', fontFamily: 'monospace', fill: COLORS.inkBlack
    }).setOrigin(0.5));

    // Request icon
    const reqKey = 'req-' + formData.request;
    if (this.textures.exists(reqKey)) {
      this.formGroup.add(this.add.image(80, -30, reqKey));
    }
    this.formGroup.add(this.add.text(80, 5, getIconLabel(formData.request), {
      fontSize: '9px', fontFamily: 'monospace', fill: COLORS.inkBlack
    }).setOrigin(0.5));

    // Time icon
    const timeKey = 'time-' + formData.time;
    if (this.textures.exists(timeKey)) {
      this.formGroup.add(this.add.image(-80, 50, timeKey).setScale(0.8));
    }
    this.formGroup.add(this.add.text(-80, 72, getIconLabel(formData.time), {
      fontSize: '9px', fontFamily: 'monospace', fill: COLORS.inkBlack
    }).setOrigin(0.5));

    // Modifier badge
    if (formData.modifier !== 'none') {
      const badgeKey = 'badge-' + formData.modifier;
      if (this.textures.exists(badgeKey)) {
        this.formGroup.add(this.add.image(80, 50, badgeKey));
      }
      this.formGroup.add(this.add.text(80, 72, getIconLabel(formData.modifier), {
        fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold',
        fill: formData.modifier === 'urgent' ? COLORS.denyRed : COLORS.inkBlack
      }).setOrigin(0.5));
    }

    // Reset form position
    this.formGroup.setPosition(DIMS.formCenterX, DIMS.formCenterY);
    this.formGroup.setRotation(0);
    this.formGroup.setAlpha(1);
    this.stampApprove.setAlpha(0);
    this.stampDeny.setAlpha(0);

    // Slide in from right
    this.formGroup.x = DIMS.width + 180;
    this.tweens.add({
      targets: this.formGroup, x: DIMS.formCenterX, duration: 250,
      ease: 'Power2', onComplete: () => { this.inputLocked = false; }
    });

    // Reset timer
    this.timeRemaining = this.decisionWindow;
    this.tickPlayed = {};
  }

  displayRules(rules) {
    // Clear existing rule cards
    this.ruleCards.forEach(c => c.destroy());
    this.ruleCards = [];

    const ruleW = 160, spacing = 6;
    const totalW = rules.length * ruleW + (rules.length - 1) * spacing;
    const startX = (DIMS.width - totalW) / 2 + ruleW / 2;

    rules.forEach((rule, i) => {
      const x = startX + i * (ruleW + spacing);
      const container = this.add.container(x, 60).setDepth(3);

      // Card bg
      if (this.textures.exists('rule-card')) {
        container.add(this.add.image(0, 0, 'rule-card'));
      }

      // Rule label text
      container.add(this.add.text(0, 10, rule.label || '', {
        fontSize: '8px', fontFamily: 'monospace', fill: COLORS.inkBlack,
        wordWrap: { width: 140 }, align: 'center'
      }).setOrigin(0.5));

      // Icons in rule
      const icon1Key = rule.icon1 ? this.getTextureKeyForRuleIcon(rule.icon1) : null;
      const icon2Key = rule.icon2 ? this.getTextureKeyForRuleIcon(rule.icon2) : null;

      if (icon1Key && this.textures.exists(icon1Key)) {
        container.add(this.add.image(-30, -12, icon1Key).setScale(0.4));
      }
      if (icon2Key && this.textures.exists(icon2Key)) {
        container.add(this.add.image(30, -12, icon2Key).setScale(0.4));
      }

      // Verdict indicator
      const vColor = rule.verdict === 'approve' ? COLORS.approveGreen : COLORS.denyRed;
      const vText = rule.verdict === 'approve' ? 'OK' : 'NO';
      container.add(this.add.text(60, -20, vText, {
        fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', fill: vColor
      }).setOrigin(0.5));

      // Flipped indicator
      if (rule.flipped) {
        container.add(this.add.text(0, 25, 'FLIPPED!', {
          fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.timerOrange
        }).setOrigin(0.5));
      }

      this.ruleCards.push(container);
    });
  }

  getTextureKeyForRuleIcon(iconId) {
    if (ICON_APPLICANTS.includes(iconId)) return 'icon-' + iconId;
    if (ICON_REQUESTS.includes(iconId)) return 'req-' + iconId;
    if (ICON_TIMES.includes(iconId)) return 'time-' + iconId;
    if (['urgent', 'restricted', 'override'].includes(iconId)) return 'badge-' + iconId;
    return null;
  }

  onPointerDown(pointer) {
    if (this.gameOver || this.paused || this.inputLocked) return;
    if (pointer.y < DIMS.rulesBarHeight || pointer.y > DIMS.hudY) return;
    this.dragging = true;
    this.dragStartX = pointer.x;
    this.currentDragX = 0;
  }

  onPointerMove(pointer) {
    if (!this.dragging || this.gameOver || this.paused || this.inputLocked) return;
    const dx = pointer.x - this.dragStartX;
    this.currentDragX = dx;

    // Move and rotate form
    this.formGroup.x = DIMS.formCenterX + dx;
    const rot = (dx / 200) * (DIMS.maxRotation * Math.PI / 180);
    this.formGroup.rotation = Phaser.Math.Clamp(rot, -0.44, 0.44);

    // Show stamp overlays
    const absDx = Math.abs(dx);
    if (dx > 30) {
      this.stampApprove.setAlpha(Math.min((absDx - 30) / 80, 0.8));
      this.stampApprove.setPosition(this.formGroup.x, this.formGroup.y);
      this.stampDeny.setAlpha(0);
    } else if (dx < -30) {
      this.stampDeny.setAlpha(Math.min((absDx - 30) / 80, 0.8));
      this.stampDeny.setPosition(this.formGroup.x, this.formGroup.y);
      this.stampApprove.setAlpha(0);
    } else {
      this.stampApprove.setAlpha(0);
      this.stampDeny.setAlpha(0);
    }
  }

  onPointerUp(pointer) {
    if (!this.dragging) return;
    this.dragging = false;
    const dx = this.currentDragX;

    if (Math.abs(dx) >= DIMS.swipeThreshold) {
      const verdict = dx > 0 ? 'approve' : 'deny';
      this.commitDecision(verdict);
    } else {
      // Snap back
      synthSnap();
      this.tweens.add({
        targets: this.formGroup,
        x: DIMS.formCenterX, rotation: 0, duration: 200, ease: 'Back.easeOut'
      });
      this.stampApprove.setAlpha(0);
      this.stampDeny.setAlpha(0);
    }
  }

  commitDecision(verdict) {
    if (this.inputLocked || this.gameOver) return;
    this.inputLocked = true;

    const correct = verdict === this.currentForm.correctVerdict;

    if (correct) {
      this.onCorrect(verdict);
    } else {
      this.onWrong(verdict);
    }
  }

  onCorrect(verdict) {
    // Calculate score
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    let pts = SCORE_VALUES.correct;
    if (this.timeRemaining > 8) pts = 150;
    else if (this.timeRemaining < 4) pts = 200;

    // Apply combo multiplier
    let mult = 1;
    if (this.combo >= 8) mult = 3.0;
    else if (this.combo >= 5) mult = 2.0;
    else if (this.combo >= 3) mult = 1.5;
    pts = Math.floor(pts * mult);

    this.score += pts;

    // Sound
    if (verdict === 'approve') synthStamp(); else synthShred();
    synthChime();
    if (this.combo > 1) synthCombo(this.combo);

    // Haptic
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}

    // Green flash
    this.flashOverlay.setFillStyle(0x27AE60, 0.3);
    this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 150, onStart: () => this.flashOverlay.setAlpha(0.3) });

    // Stamp drop effect
    const stamp = verdict === 'approve' ? this.stampApprove : this.stampDeny;
    stamp.setAlpha(1).setScale(1.5);
    this.tweens.add({ targets: stamp, scaleX: 1, scaleY: 1, duration: 100 });

    // Particles
    const pCount = this.combo >= 8 ? 32 : this.combo >= 5 ? 24 : this.combo >= 3 ? 18 : 12;
    this.spawnParticles(this.formGroup.x, this.formGroup.y, 0x27AE60, pCount);

    // Score float
    const floatText = this.add.text(this.formGroup.x, this.formGroup.y - 20, '+' + pts, {
      fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: floatText, y: floatText.y - 70, alpha: 0, duration: 600,
      onComplete: () => floatText.destroy()
    });

    // HUD updates
    this.hud.updateScore(this.score);
    this.hud.updateCombo(this.combo);

    // Fly out card
    const flyX = verdict === 'approve' ? DIMS.width + 200 : -200;
    const flyRot = verdict === 'approve' ? 0.5 : -0.5;

    // Scale punch before fly
    this.tweens.add({
      targets: this.formGroup, scaleX: 1.25, scaleY: 1.25, duration: 60, yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: this.formGroup, x: flyX, rotation: flyRot, duration: 250, ease: 'Power2',
          onComplete: () => { this.stampApprove.setAlpha(0); this.stampDeny.setAlpha(0); this.nextForm(); }
        });
      }
    });

    // Camera shake (mild for correct)
    this.cameras.main.shake(80, 0.003);
  }

  onWrong(verdict) {
    this.combo = 0;
    this.strikes++;

    // Sound
    synthBuzz();

    // Haptic double-pulse
    try { if (navigator.vibrate) navigator.vibrate([30, 15, 30]); } catch (e) {}

    // Red flash
    this.flashOverlay.setFillStyle(0xE74C3C, 0.4);
    this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 200, onStart: () => this.flashOverlay.setAlpha(0.4) });

    // Shake
    this.cameras.main.shake(200, 0.008);

    // Red particles
    this.spawnParticles(this.formGroup.x, this.formGroup.y, 0xE74C3C, 12);

    // HUD
    this.hud.updateStrikes(this.strikes);
    this.hud.updateCombo(0);

    if (this.strikes >= 3) {
      this.onFired();
      return;
    }

    // Fly out wrong direction
    const flyX = verdict === 'approve' ? DIMS.width + 200 : -200;
    this.tweens.add({
      targets: this.formGroup, x: flyX, rotation: verdict === 'approve' ? 0.5 : -0.5,
      alpha: 0.3, duration: 280, ease: 'Power2',
      onComplete: () => { this.stampApprove.setAlpha(0); this.stampDeny.setAlpha(0); this.nextForm(); }
    });
  }

  onTimeout() {
    if (this.inputLocked || this.gameOver) return;
    this.inputLocked = true;
    // Auto-wrong: submit opposite of correct answer
    this.onWrong(this.currentForm.correctVerdict === 'approve' ? 'deny' : 'approve');
  }

  onFired() {
    this.gameOver = true;
    synthFired();

    // Big shake
    this.cameras.main.shake(350, 0.012);

    // Red vignette
    this.flashOverlay.setFillStyle(0xC0392B, 0.5);
    this.flashOverlay.setAlpha(0.5);
    this.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 600, delay: 400 });

    // Desk clear animation
    this.decoPencil.setVisible(true);
    this.decoPlant.setVisible(true);
    this.decoNameplate.setVisible(true);

    this.time.delayedCall(300, () => {
      this.tweens.add({ targets: this.decoPencil, x: -60, duration: 200 });
    });
    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: this.decoPlant, y: -60, x: 360, duration: 250 });
    });
    this.time.delayedCall(600, () => {
      this.tweens.add({ targets: this.decoNameplate, y: 700, rotation: 1, duration: 150 });
    });

    // Transition to game over
    this.time.delayedCall(1100, () => {
      this.cleanupListeners();
      this.scene.stop('GameScene');
      this.scene.start('GameOverScene', {
        score: this.score, stage: this.stageNumber, maxCombo: this.maxCombo
      });
    });
  }

  nextForm() {
    this.formIndex++;
    if (this.formIndex >= this.stageData.forms.length) {
      this.advanceStage();
      return;
    }

    // Check for rule flip mid-stage
    if (this.stageData.ruleFlipChance > 0 && this.formIndex === Math.floor(this.stageData.forms.length / 2)) {
      const flipRule = this.stageData.rules.find(r => r.flippable && !r.flipped);
      if (flipRule) {
        this.performRuleFlip(flipRule);
        return;
      }
    }

    this.showForm(this.stageData.forms[this.formIndex]);
  }

  advanceStage() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    this.inputLocked = true;

    // Stage bonus
    this.score += SCORE_VALUES.stageBonus;
    this.hud.updateScore(this.score);

    // Stage complete float
    const bonusText = this.add.text(DIMS.width / 2, DIMS.formCenterY - 40, '+500 STAGE CLEAR', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: bonusText, y: bonusText.y - 90, alpha: 0, duration: 800,
      onComplete: () => bonusText.destroy()
    });

    synthStageComplete();

    this.stageNumber++;
    this.formIndex = 0;
    this.hud.updateStage(this.stageNumber);

    // Generate new stage
    this.stageData = generateStage(this.stageNumber);
    this.decisionWindow = this.stageData.decisionWindow;

    // Animate rule transition
    const isNewRuleStage = [3, 5, 8, 12].includes(this.stageNumber);

    this.time.delayedCall(isNewRuleStage ? 600 : 300, () => {
      this.displayRules(this.stageData.rules);
      if (isNewRuleStage) {
        this.showNewRuleAnnouncement();
        this.time.delayedCall(1500, () => {
          this.stageTransitioning = false;
          this.showForm(this.stageData.forms[0]);
        });
      } else {
        this.stageTransitioning = false;
        this.showForm(this.stageData.forms[0]);
      }
    });
  }

  performRuleFlip(rule) {
    this.inputLocked = true;
    rule.flipped = true;

    synthNewRule();

    // Flash the rule card
    const ruleIdx = this.stageData.rules.indexOf(rule);
    if (ruleIdx >= 0 && this.ruleCards[ruleIdx]) {
      const card = this.ruleCards[ruleIdx];
      this.tweens.add({
        targets: card, scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true, repeat: 2,
        onComplete: () => {
          // Re-evaluate remaining forms
          for (let i = this.formIndex; i < this.stageData.forms.length; i++) {
            this.stageData.forms[i].correctVerdict = evaluateForm(this.stageData.forms[i], this.stageData.rules);
          }
          this.displayRules(this.stageData.rules);
          this.showForm(this.stageData.forms[this.formIndex]);
        }
      });
    } else {
      this.showForm(this.stageData.forms[this.formIndex]);
    }
  }

  showNewRuleAnnouncement() {
    synthNewRule();
    const ann = this.add.text(DIMS.width / 2, DIMS.formCenterY, 'NEW RULE!', {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.comboGold
    }).setOrigin(0.5).setDepth(40);
    this.tweens.add({
      targets: ann, scaleX: 1.3, scaleY: 1.3, duration: 400, yoyo: true,
      onComplete: () => {
        this.tweens.add({ targets: ann, alpha: 0, duration: 300, onComplete: () => ann.destroy() });
      }
    });
  }

  pauseGame() {
    if (this.paused) return;
    this.paused = true;
    this.showPauseOverlay();
  }

  showPauseOverlay() {
    const w = DIMS.width, h = DIMS.height;
    this.pauseGroup = this.add.container(0, 0).setDepth(100);

    const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.65);
    this.pauseGroup.add(bg);

    this.pauseGroup.add(this.add.text(w / 2, 200, 'PAUSED', {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5));

    // Resume
    const resumeBtn = this.add.rectangle(w / 2, 280, 160, 48, 0x2B4C8C).setInteractive({ useHandCursor: true });
    this.pauseGroup.add(resumeBtn);
    this.pauseGroup.add(this.add.text(w / 2, 280, 'RESUME', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5));
    resumeBtn.on('pointerdown', () => { synthClick(); this.resumeGame(); });

    // Help
    const helpBtn = this.add.rectangle(w / 2, 340, 160, 48, 0x2B4C8C).setInteractive({ useHandCursor: true });
    this.pauseGroup.add(helpBtn);
    this.pauseGroup.add(this.add.text(w / 2, 340, '? HELP', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5));
    helpBtn.on('pointerdown', () => {
      synthClick();
      this.scene.pause('GameScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    // Restart
    const restartBtn = this.add.rectangle(w / 2, 400, 160, 48, 0xE67E22).setInteractive({ useHandCursor: true });
    this.pauseGroup.add(restartBtn);
    this.pauseGroup.add(this.add.text(w / 2, 400, 'RESTART', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#FFFFFF'
    }).setOrigin(0.5));
    restartBtn.on('pointerdown', () => {
      synthClick();
      this.cleanupListeners();
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    // Menu
    const menuBtn = this.add.rectangle(w / 2, 460, 160, 48, 0xF5F0E8).setStrokeStyle(2, 0x2B4C8C).setInteractive({ useHandCursor: true });
    this.pauseGroup.add(menuBtn);
    this.pauseGroup.add(this.add.text(w / 2, 460, 'MENU', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: COLORS.govBlue
    }).setOrigin(0.5));
    menuBtn.on('pointerdown', () => {
      synthClick();
      this.cleanupListeners();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }

  resumeGame() {
    if (this.pauseGroup) { this.pauseGroup.destroy(true); this.pauseGroup = null; }
    this.paused = false;
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 80 + Math.random() * 120;
      const p = this.add.circle(x, y, 3 + Math.random() * 2, color).setDepth(25);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 350 + Math.random() * 150,
        onComplete: () => p.destroy()
      });
    }
  }

  cleanupListeners() {
    if (this.visHandler) {
      document.removeEventListener('visibilitychange', this.visHandler);
      this.visHandler = null;
    }
  }

  shutdown() {
    this.cleanupListeners();
  }
}
