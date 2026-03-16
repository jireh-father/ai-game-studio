// game.js - GameScene: core gameplay, case rendering, timer, tap handling, verdict, juice

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.continueRun = data && data.continueRun;
    this.continueData = data || {};
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    this.sessionSalt = Date.now() % 10000;

    // Game state
    if (this.continueRun) {
      this.gs = {
        score: this.continueData.score || 0,
        caseNumber: this.continueData.caseNumber || 1,
        streak: 0, badges: 1, active: false,
        bestStreak: this.continueData.bestStreak || 0
      };
    } else {
      this.gs = {
        score: 0, caseNumber: 1, streak: 0,
        badges: 3, active: false, bestStreak: 0
      };
    }

    this.stageTransitioning = false;
    this.hitStopActive = false;
    this.caseData = null;
    this.cards = [];
    this.cardObjects = [];
    this.timerRemaining = 0;
    this.timerTotal = 0;
    this.lastTickSec = -1;
    this.isPaused = false;

    // Groups
    this.caseGroup = this.add.container(0, 0);

    // HUD
    this.createHUD();

    // Pause button
    this.pauseBtn = this.add.text(w - 30, 18, '| |', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '18px',
      fill: COLORS.HUD_TEXT
    }).setOrigin(0.5).setInteractive().setDepth(100);
    this.pauseBtn.on('pointerdown', () => this.togglePause());

    // Pause overlay (hidden)
    this.pauseOverlay = this.add.container(0, 0).setDepth(200).setVisible(false);
    this.createPauseOverlay();

    // Input
    this.input.on('pointerdown', (pointer) => {
      if (this.isPaused || !this.gs.active) return;
      this.checkCardTap(pointer.x, pointer.y);
    });

    // Visibility change handler
    this.visHandler = () => {
      if (document.hidden && !this.isPaused) this.togglePause();
    };
    document.addEventListener('visibilitychange', this.visHandler);

    // Start
    SoundFX.play('caseStart');
    this.startNewCase();
  }

  createHUD() {
    const w = this.scale.width;
    // HUD bar background
    this.hudBar = this.add.rectangle(w / 2, 28, w, 56, 0x1A2340, 1).setDepth(90);

    this.scoreTxt = this.add.text(12, 18, 'Score: ' + this.gs.score, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px',
      fill: COLORS.HUD_TEXT, fontStyle: 'bold'
    }).setDepth(91);

    this.caseTxt = this.add.text(this.scale.width / 2, 14, 'Case ' + this.gs.caseNumber, {
      fontFamily: 'Arial, sans-serif', fontSize: '13px',
      fill: COLORS.HUD_TEXT
    }).setOrigin(0.5, 0).setDepth(91);

    this.streakTxt = this.add.text(this.scale.width / 2, 32, '', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '12px',
      fill: COLORS.STREAK_ORANGE
    }).setOrigin(0.5, 0).setDepth(91);

    // Badges
    this.badgeIcons = [];
    for (let i = 0; i < 3; i++) {
      const key = i < this.gs.badges ? 'badge-active' : 'badge-lost';
      const b = this.add.image(16 + i * 32, 66, key).setScale(0.55).setDepth(91);
      this.badgeIcons.push(b);
    }

    // Timer bar background
    this.timerBg = this.add.rectangle(w / 2, 84, w - 16, 12, 0x333333, 1).setDepth(90);
    this.timerBar = this.add.rectangle(8, 84, 0, 10, 0x4ECB71, 1).setOrigin(0, 0.5).setDepth(91);

    this.updateStreakDisplay();
  }

  updateHUD() {
    this.scoreTxt.setText('Score: ' + this.gs.score);
    this.caseTxt.setText('Case ' + this.gs.caseNumber);
    this.updateStreakDisplay();
    this.updateBadges();
  }

  updateStreakDisplay() {
    const sm = getStreakMultiplier(this.gs.streak);
    if (sm.label) {
      this.streakTxt.setText(sm.label);
      this.streakTxt.setColor(
        sm.multiplier >= 3 ? COLORS.BADGE_GOLD :
        sm.multiplier >= 2 ? '#FF4444' : COLORS.STREAK_ORANGE
      );
    } else {
      this.streakTxt.setText(this.gs.streak > 0 ? 'Streak: ' + this.gs.streak : '');
      this.streakTxt.setColor(COLORS.STREAK_ORANGE);
    }
  }

  updateBadges() {
    for (let i = 0; i < 3; i++) {
      const key = i < this.gs.badges ? 'badge-active' : 'badge-lost';
      this.badgeIcons[i].setTexture(key);
    }
  }

  updateTimerBar() {
    if (this.timerTotal <= 0) return;
    const frac = Math.max(0, this.timerRemaining / this.timerTotal);
    const maxW = this.scale.width - 16;
    this.timerBar.width = maxW * frac;

    // Color interpolation
    let color;
    if (frac > 0.5) {
      color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.HexStringToColor(COLORS.TIMER_GREEN),
        Phaser.Display.Color.HexStringToColor(COLORS.TIMER_AMBER),
        100, Math.round((1 - frac) * 200)
      );
    } else {
      color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.HexStringToColor(COLORS.TIMER_AMBER),
        Phaser.Display.Color.HexStringToColor(COLORS.TIMER_RED),
        100, Math.round((0.5 - frac) * 200)
      );
    }
    this.timerBar.setFillStyle(Phaser.Display.Color.GetColor(
      Math.round(color.r), Math.round(color.g), Math.round(color.b)
    ));

    // Timer pulse at < 5s
    if (this.timerRemaining <= 5 && this.timerRemaining > 0) {
      const period = this.timerRemaining <= 2 ? 300 : 600;
      const pulse = 1 + 0.05 * Math.sin(this.time.now / period * Math.PI * 2);
      this.timerBar.setScale(1, pulse);
    } else {
      this.timerBar.setScale(1, 1);
    }
  }

  startNewCase() {
    this.stageTransitioning = false;
    this.caseGroup.removeAll(true);
    this.cards = [];
    this.cardObjects = [];

    this.caseData = generateCase(this.gs.caseNumber, this.sessionSalt);
    this.timerTotal = this.caseData.timerSeconds;
    this.timerRemaining = this.timerTotal;
    this.lastTickSec = Math.ceil(this.timerRemaining);

    this.updateHUD();
    this.renderCase();

    // Check milestones
    if (MILESTONE_CASES.includes(this.gs.caseNumber)) {
      this.showMilestone(this.gs.caseNumber);
    }

    SoundFX.play('caseStart');

    // Activate after cards animate in
    this.time.delayedCall(400, () => {
      this.gs.active = true;
    });
  }

  renderCase() {
    const w = this.scale.width;
    const cd = this.caseData;

    // Crime header
    const headerY = 102;
    const hdr = this.add.rectangle(w / 2, headerY, w - 12, 52, 0xFFF0C0, 1)
      .setStrokeStyle(1, 0xCCBBAA);
    this.caseGroup.add(hdr);

    const crimeTitle = cd.crime.title;
    const titleTxt = this.add.text(w / 2, headerY, crimeTitle, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px',
      fill: COLORS.HUD_BG, fontStyle: 'bold', align: 'center',
      wordWrap: { width: w - 50 }
    }).setOrigin(0.5);
    this.caseGroup.add(titleTxt);

    // Rest/Boss tags
    if (cd.isRest) {
      const tag = this.add.text(w - 20, headerY - 18, 'EASY', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '10px',
        fill: COLORS.CORRECT_GREEN, backgroundColor: '#E8FFE8',
        padding: { x: 4, y: 2 }
      }).setOrigin(1, 0.5);
      this.caseGroup.add(tag);
    }
    if (cd.isBoss) {
      const tag = this.add.text(w - 20, headerY - 18, 'GRAND JURY', {
        fontFamily: 'Arial Black, sans-serif', fontSize: '10px',
        fill: COLORS.BADGE_GOLD, backgroundColor: '#3A2A10',
        padding: { x: 4, y: 2 }
      }).setOrigin(1, 0.5);
      this.caseGroup.add(tag);
    }

    // Animate header
    hdr.y = headerY - 80;
    titleTxt.y = headerY - 80;
    this.tweens.add({ targets: [hdr, titleTxt], y: headerY, duration: 250, ease: 'Cubic.easeOut' });

    // Suspect cards
    const suspects = cd.suspects;
    const count = suspects.length;
    const areaTop = 140;
    const areaH = this.scale.height - areaTop - 10;

    let cols, rows, cardW, cardH;
    if (count <= 2) { cols = 2; rows = 1; }
    else if (count <= 4) { cols = 2; rows = 2; }
    else { cols = 3; rows = 2; }

    cardW = Math.min(150, (w - 30 - (cols - 1) * 10) / cols);
    cardH = Math.min(180, (areaH - (rows - 1) * 10) / rows);

    const gridW = cols * cardW + (cols - 1) * 10;
    const gridH = rows * cardH + (rows - 1) * 10;
    const startX = (w - gridW) / 2 + cardW / 2;
    const startY = areaTop + (areaH - gridH) / 2 + cardH / 2;

    suspects.forEach((suspect, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + 10);
      const cy = startY + row * (cardH + 10);

      const card = this.renderSuspectCard(suspect, cx, cy, cardW, cardH, cd.isBoss);
      this.caseGroup.add(card);

      // Bounce-in animation
      card.y = cy + 120;
      card.alpha = 0;
      this.tweens.add({
        targets: card, y: cy, alpha: 1,
        duration: 350, delay: i * 80,
        ease: 'Back.easeOut'
      });

      this.cards.push({ x: cx, y: cy, w: cardW, h: cardH, idx: i, container: card });
    });
  }

  renderSuspectCard(suspect, x, y, cw, ch, isBoss) {
    const container = this.add.container(x, y);
    // Card background
    const borderColor = isBoss ? 0xFFD700 : 0xCCBBAA;
    const bg = this.add.rectangle(0, 0, cw, ch, 0xFFFFFF, 1)
      .setStrokeStyle(isBoss ? 3 : 2, borderColor);
    container.add(bg);

    // Animal icon
    if (this.textures.exists(suspect.animalKey)) {
      const icon = this.add.image(0, -ch * 0.15, suspect.animalKey)
        .setScale(Math.min(0.55, cw / 160));
      container.add(icon);
    }

    // Name
    const name = this.add.text(0, ch * 0.18, suspect.name, {
      fontFamily: 'Arial, sans-serif', fontSize: '11px',
      fill: COLORS.HUD_BG, fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(name);

    // Clue tags
    const clueY = ch * 0.33;
    const clueSpacing = Math.min(28, (cw - 10) / suspect.clues.length);
    const clueStartX = -(suspect.clues.length - 1) * clueSpacing / 2;

    suspect.clues.forEach((clue, ci) => {
      const cx2 = clueStartX + ci * clueSpacing;
      if (this.textures.exists(clue.iconKey)) {
        const ic = this.add.image(cx2, clueY, clue.iconKey).setScale(0.8);
        container.add(ic);
        // Green check for matching, red for non-matching shown subtly
        const dot = this.add.circle(cx2 + 8, clueY - 8, 3,
          clue.matching ? 0x4ECB71 : 0xE84040, 0.8);
        container.add(dot);
      }
    });

    return container;
  }

  checkCardTap(px, py) {
    for (const card of this.cards) {
      const dx = Math.abs(px - card.x);
      const dy = Math.abs(py - card.y);
      if (dx < card.w / 2 && dy < card.h / 2) {
        this.handleSuspectTap(card.idx);
        return;
      }
    }
  }

  handleSuspectTap(idx) {
    if (!this.gs.active) return;
    this.gs.active = false; // Prevent double tap

    const suspect = this.caseData.suspects[idx];
    const card = this.cards[idx];

    // Scale punch on tapped card
    this.tweens.add({
      targets: card.container,
      scaleX: 1.15, scaleY: 1.15,
      duration: 60, yoyo: true, ease: 'Quad.easeOut'
    });

    if (suspect.isGuilty) {
      this.handleCorrectVerdict(idx, card);
    } else {
      this.handleWrongVerdict(idx, card);
    }
  }

  handleCorrectVerdict(idx, card) {
    SoundFX.play('correct');

    // GUILTY stamp
    if (this.textures.exists('stamp-guilty')) {
      const stamp = this.add.image(card.x, card.y, 'stamp-guilty')
        .setScale(2.5).setAlpha(0).setDepth(50);
      stamp.setAngle(-5 + Math.random() * 10);
      this.caseGroup.add(stamp);
      this.tweens.add({ targets: stamp, scaleX: 1, scaleY: 1, alpha: 1, duration: 120, ease: 'Quad.easeOut' });
    }

    // Confetti particles
    const sm = getStreakMultiplier(this.gs.streak);
    const particleCount = 20 + (sm.multiplier >= 3 ? 20 : sm.multiplier >= 2 ? 10 : sm.multiplier >= 1.5 ? 5 : 0);
    this.spawnParticles(card.x, card.y, particleCount, ['#4ECB71','#FFD700','#FF6B35','#7B5EA7','#56A95E']);

    // Camera effects
    this.cameras.main.shake(150, 0.003 * sm.multiplier);
    const zoomTarget = 1 + 0.03 * Math.min(sm.multiplier, 3);
    this.tweens.add({
      targets: this.cameras.main, zoom: zoomTarget,
      duration: 90, yoyo: true, ease: 'Sine.easeInOut'
    });

    // Score calculation
    const speedBonus = Math.floor(this.timerRemaining) * SCORE_VALUES.SPEED_BONUS_PER_SEC;
    const perfectThreshold = this.timerTotal * 0.75;
    const isPerfect = this.timerRemaining >= perfectThreshold;
    let points = SCORE_VALUES.BASE_CORRECT + speedBonus;
    if (isPerfect) points += SCORE_VALUES.PERFECT_BONUS;
    points = Math.floor(points * sm.multiplier);

    this.gs.score += points;
    this.gs.streak++;
    if (this.gs.streak > this.gs.bestStreak) this.gs.bestStreak = this.gs.streak;

    // Floating score text
    this.floatText(card.x, card.y - 30, '+' + points, '#FFFFFF', 16);
    SoundFX.play('scoreFloat');

    if (speedBonus > 0) {
      this.floatText(card.x, card.y - 10, '+' + speedBonus + ' SPEED!', COLORS.BADGE_GOLD, 13);
    }
    if (isPerfect) {
      this.floatText(card.x, card.y + 10, '+50 PERFECT!', COLORS.BADGE_GOLD, 14);
    }

    // Score HUD punch
    this.tweens.add({
      targets: this.scoreTxt, scaleX: 1.35, scaleY: 1.35,
      duration: 80, yoyo: true
    });

    // Streak milestone sounds
    const newSm = getStreakMultiplier(this.gs.streak);
    if (newSm.multiplier > sm.multiplier) {
      SoundFX.play(newSm.multiplier >= 3 ? 'streakHigh' : 'streak');
      this.floatText(this.scale.width / 2, this.scale.height / 2, newSm.label, COLORS.BADGE_GOLD, 22);
    }

    this.updateHUD();

    // Next case after delay
    this.time.delayedCall(600, () => {
      if (this.scene.isActive('Game')) {
        this.gs.caseNumber++;
        this.startNewCase();
      }
    });
  }

  handleWrongVerdict(idx, card) {
    SoundFX.play('wrong');

    // INNOCENT stamp
    if (this.textures.exists('stamp-innocent')) {
      const stamp = this.add.image(card.x, card.y, 'stamp-innocent')
        .setScale(2).setAlpha(0).setDepth(50);
      this.caseGroup.add(stamp);
      this.tweens.add({ targets: stamp, scaleX: 1, scaleY: 1, alpha: 1, duration: 100, ease: 'Quad.easeOut' });
    }

    // Card shake
    this.tweens.add({
      targets: card.container, x: card.x - 4, duration: 50,
      yoyo: true, repeat: 2
    });

    // Grey particles
    this.spawnParticles(card.x, card.y, 8, ['#888888', '#666666']);

    this.handleBadgeLoss();
  }

  handleTimeout() {
    if (this.stageTransitioning) return;
    this.stageTransitioning = true;
    this.gs.active = false;

    SoundFX.play('timeout');

    // TIMEOUT stamp at center
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    if (this.textures.exists('stamp-timeout')) {
      const stamp = this.add.image(cx, cy, 'stamp-timeout')
        .setScale(2.5).setAlpha(0).setDepth(50);
      this.caseGroup.add(stamp);
      this.tweens.add({ targets: stamp, scaleX: 1, scaleY: 1, alpha: 1, duration: 120 });
    }

    this.handleBadgeLoss();
  }

  handleBadgeLoss() {
    this.gs.badges--;
    this.gs.streak = 0;

    // Screen shake
    this.cameras.main.shake(200, 0.008);

    // Badge crack animation
    SoundFX.play('badgeLost');
    const bIdx = this.gs.badges; // index of badge just lost
    if (this.badgeIcons[bIdx]) {
      this.tweens.add({
        targets: this.badgeIcons[bIdx], scaleX: 0.75, scaleY: 0.75,
        duration: 60, yoyo: true, onComplete: () => {
          this.badgeIcons[bIdx].setTexture('badge-lost');
        }
      });
      // Badge debris particles
      const b = this.badgeIcons[bIdx];
      this.spawnParticles(b.x, b.y, 4, ['#777777', '#555555']);
    }

    this.updateStreakDisplay();

    if (this.gs.badges <= 0) {
      // Game over
      this.time.delayedCall(500, () => this.handleGameOver());
    } else {
      // Continue (retry same case)
      this.time.delayedCall(700, () => {
        this.stageTransitioning = false;
        this.startNewCase();
      });
    }
  }

  handleGameOver() {
    SoundFX.play('gameOver');
    this.cameras.main.shake(350, 0.015);

    // Save high score
    let isNewRecord = false;
    if (this.gs.score > (GameState.highScore || 0)) {
      GameState.highScore = this.gs.score;
      isNewRecord = true;
    }
    if (this.gs.bestStreak > (GameState.highestStreak || 0)) {
      GameState.highestStreak = this.gs.bestStreak;
    }
    if (this.gs.caseNumber > (GameState.highestCase || 0)) {
      GameState.highestCase = this.gs.caseNumber;
    }
    GameState.gamesPlayed = (GameState.gamesPlayed || 0) + 1;
    saveState();

    this.time.delayedCall(500, () => {
      this.scene.stop('Game');
      this.scene.start('GameOver', {
        score: this.gs.score,
        caseNumber: this.gs.caseNumber,
        bestStreak: this.gs.bestStreak,
        isNewRecord
      });
    });
  }

  update(time, delta) {
    if (this.isPaused || !this.gs.active || this.hitStopActive) return;

    this.timerRemaining -= delta / 1000;
    this.updateTimerBar();

    // Tick sounds
    const sec = Math.ceil(this.timerRemaining);
    if (sec !== this.lastTickSec && sec > 0) {
      this.lastTickSec = sec;
      if (this.timerRemaining <= 5) {
        SoundFX.play('dangerTick');
      } else {
        SoundFX.play('tick');
      }
    }

    // Timeout
    if (this.timerRemaining <= 0 && !this.stageTransitioning) {
      this.handleTimeout();
    }
  }

  shutdown() {
    if (this.visHandler) {
      document.removeEventListener('visibilitychange', this.visHandler);
    }
    this.tweens.killAll();
    this.time.removeAllEvents();
  }

  // --- Juice helpers ---
  spawnParticles(x, y, count, colors) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 80 + Math.random() * 120;
      const size = 3 + Math.random() * 5;
      const c = Phaser.Display.Color.HexStringToColor(colors[i % colors.length]);
      const p = this.add.circle(x, y, size, Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).setDepth(60);
      this.caseGroup.add(p);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0, scale: 0,
        duration: 400 + Math.random() * 200,
        onComplete: () => p.destroy()
      });
    }
  }

  floatText(x, y, text, color, size) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Arial Black, sans-serif',
      fontSize: size + 'px', fill: color, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(70);
    this.caseGroup.add(t);
    this.tweens.add({
      targets: t, y: y - 60, alpha: 0,
      duration: 600, ease: 'Cubic.easeOut',
      onComplete: () => t.destroy()
    });
  }

  showMilestone(caseNum) {
    SoundFX.play('milestone');
    const w = this.scale.width;
    const banner = this.add.rectangle(w / 2, -30, w, 40, 0x7B5EA7, 0.92).setDepth(80);
    const txt = this.add.text(w / 2, -30, 'CASE ' + caseNum + ' CRACKED!', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '16px',
      fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(81);

    this.tweens.add({
      targets: [banner, txt], y: 120, duration: 250, ease: 'Cubic.easeOut',
      onComplete: () => {
        this.time.delayedCall(600, () => {
          this.tweens.add({
            targets: [banner, txt], y: -30, duration: 200,
            onComplete: () => { banner.destroy(); txt.destroy(); }
          });
        });
      }
    });
  }

  // --- Pause ---
  createPauseOverlay() {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    const bg = this.add.rectangle(cx, h / 2, w, h, 0x1A2340, 0.85).setInteractive();
    this.pauseOverlay.add(bg);

    const title = this.add.text(cx, h * 0.25, 'PAUSED', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '28px', fill: '#FFF'
    }).setOrigin(0.5);
    this.pauseOverlay.add(title);

    // Resume
    const resumeBg = this.add.rectangle(cx, h * 0.40, 220, 48, 0x4ECB71, 1).setInteractive();
    const resumeTxt = this.add.text(cx, h * 0.40, 'RESUME', {
      fontFamily: 'Arial Black, sans-serif', fontSize: '18px', fill: '#FFF'
    }).setOrigin(0.5);
    this.pauseOverlay.add(resumeBg);
    this.pauseOverlay.add(resumeTxt);
    resumeBg.on('pointerdown', () => this.togglePause());

    // Help
    const helpBg = this.add.rectangle(cx, h * 0.52, 220, 42, 0x7B5EA7, 1).setInteractive();
    const helpTxt = this.add.text(cx, h * 0.52, '? How to Play', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', fill: '#FFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.pauseOverlay.add(helpBg);
    this.pauseOverlay.add(helpTxt);
    helpBg.on('pointerdown', () => {
      SoundFX.play('buttonTap');
      this.scene.pause('Game');
      this.scene.launch('Help', { returnTo: 'Game' });
    });

    // Quit
    const quitBg = this.add.rectangle(cx, h * 0.63, 180, 38, 0x555555, 1).setInteractive();
    const quitTxt = this.add.text(cx, h * 0.63, 'Quit to Menu', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', fill: '#CCC'
    }).setOrigin(0.5);
    this.pauseOverlay.add(quitBg);
    this.pauseOverlay.add(quitTxt);
    quitBg.on('pointerdown', () => {
      SoundFX.play('buttonTap');
      this.scene.stop('Game');
      this.scene.start('Menu');
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);
    if (this.isPaused) {
      SoundFX.play('buttonTap');
    }
  }

  shutdown() {
    document.removeEventListener('visibilitychange', this.visHandler);
  }
}
