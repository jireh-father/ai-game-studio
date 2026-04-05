// Birthday Bomb - Core Gameplay Scene

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.W = this.cameras.main.width;
    this.H = this.cameras.main.height;
    window._sessionEntropy = (window._sessionEntropy || Date.now() % 100000);

    this.gameOver = false;
    this.paused = false;
    this.stageTransitioning = false;
    this.waitingForBet = false;
    this.lastInputTime = Date.now();

    this.stageConfig = StageConfig(GameState.stage);
    this.cardData = generateCardData(this.stageConfig);
    this.timer = this.stageConfig.baseTimer;
    this.roomBirthdays = new Set();
    this.roomCards = [];
    this.cardIndex = 0;
    this.stageBetsCorrect = 0;
    this.stageBetsTotal = 0;

    // Apply mixins
    Object.assign(GameScene.prototype, GameEffects);
    Object.assign(GameScene.prototype, GameHUD);
    this.initEffects();
    this.createLayout();
    this.createHUD();
    this.spawnQueue();
    this.createBetButtons();
    this.setupPause();
    this.setupVisibility();
  }

  spawnQueue() {
    this.queueCards = [];
    var visibleCount = Math.min(4, this.cardData.length - this.cardIndex);
    for (var i = 0; i < visibleCount; i++) this.createQueueCard(this.cardIndex + i, i);
  }

  createQueueCard(dataIdx, slotIdx) {
    if (dataIdx >= this.cardData.length) return;
    var d = this.cardData[dataIdx];
    var x = this.queueX, y = 130 + slotIdx * 90;
    var card = this.add.rectangle(x, y, 56, 74, 0xFFFFFF).setStrokeStyle(2, 0x1C1C3A);
    var head = this.add.circle(x, y - 12, 12, 0xFFD93D).setStrokeStyle(1, 0x1C1C3A);
    this.add.circle(x - 5, y - 14, 2, 0x1C1C3A);
    this.add.circle(x + 5, y - 14, 2, 0x1C1C3A);
    var bodyColor = Phaser.Display.Color.HexStringToColor(d.shirtColor).color;
    var body = this.add.rectangle(x, y + 14, 28, 20, bodyColor).setStrokeStyle(1, 0x1C1C3A);
    var qText = this.add.text(x, y + 28, '?', {
      fontSize: '14px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5);

    var dragZone = this.add.rectangle(x, y, 60, 80, 0x000000, 0).setInteractive({ draggable: true });
    dragZone.cardDataIdx = dataIdx;
    dragZone.origX = x;
    dragZone.origY = y;
    dragZone.cardVisuals = [card, head, body, qText];

    this.input.on('dragstart', this.onDragStart, this);
    this.input.on('drag', this.onDrag, this);
    this.input.on('dragend', this.onDragEnd, this);
    this.queueCards.push(dragZone);
  }

  onDragStart(pointer, obj) {
    if (this.paused || this.waitingForBet || this.gameOver || this.stageTransitioning) return;
    this.lastInputTime = Date.now();
    obj.setDepth(70);
    this.scalePunch(obj, 1.1, 80);
  }

  onDrag(pointer, obj, dragX, dragY) {
    if (this.paused || this.waitingForBet || this.gameOver) return;
    obj.x = dragX;
    obj.y = dragY;
  }

  onDragEnd(pointer, obj) {
    if (this.paused || this.waitingForBet || this.gameOver) return;
    this.lastInputTime = Date.now();
    if (obj.x > this.W * 0.35 && obj.cardDataIdx !== undefined) {
      this.dropCardInRoom(obj);
    } else {
      this.tweens.add({ targets: obj, x: obj.origX, y: obj.origY, duration: 200 });
      obj.setDepth(0);
    }
  }

  dropCardInRoom(dragObj) {
    var d = this.cardData[dragObj.cardDataIdx];
    var col = this.roomCards.length % 4;
    var row = Math.floor(this.roomCards.length / 4);
    var rx = this.W * 0.42 + col * 44;
    var ry = 130 + row * 55;

    dragObj.disableInteractive();
    dragObj.setVisible(false);
    if (dragObj.cardVisuals) dragObj.cardVisuals.forEach(function(v) { v.setVisible(false); });

    var sc = Phaser.Display.Color.HexStringToColor(d.shirtColor).color;
    var head = this.add.circle(rx, ry - 6, 10, sc).setStrokeStyle(1, 0x1C1C3A);
    var body = this.add.rectangle(rx, ry + 12, 22, 16, sc).setStrokeStyle(1, 0x1C1C3A);
    this.scalePunch(head, 1.35, 180);
    this.scalePunch(body, 1.35, 180);

    var label = d.isCrasher ? '???' : d.birthday;
    var bdayText = this.add.text(rx, ry + 26, '', {
      fontSize: '8px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold',
      backgroundColor: '#1C1C3A', padding: { x: 2, y: 1 }
    }).setOrigin(0.5).setAlpha(0);
    this.time.delayedCall(300, function() { bdayText.setText(label); bdayText.setAlpha(1); });

    this.roomCards.push({ birthday: d.birthday, isCrasher: d.isCrasher, isTwin: d.isTwin, x: rx, y: ry });
    if (d.birthday && !d.isCrasher) this.roomBirthdays.add(d.birthday);
    this.cardIndex++;

    if (d.isTwin) this.goldRingPulse(rx, ry, 3);
    if (d.isCrasher) {
      this.cameras.main.shake(100, 0.003);
      this.floatingText(rx, ry - 30, '???', COLORS.danger, 18);
    }

    this.waitingForBet = true;
    this.currentDropData = d;
    this.currentDropPos = { x: rx, y: ry };
    this.showBetButtons();
    this.updateHUD();
    this.refreshQueue();
  }

  refreshQueue() {
    this.queueCards.forEach(function(c) { if (c && c.scene) c.destroy(); });
    this.queueCards = [];
    var vis = Math.min(4, this.cardData.length - this.cardIndex);
    for (var i = 0; i < vis; i++) this.createQueueCard(this.cardIndex + i, i);
  }

  createBetButtons() {
    var btnY = this.H - 55, btnW = 140, btnH = 60;
    this.matchBtn = this.add.rectangle(this.W * 0.28, btnY, btnW, btnH, 0xFF6B9D)
      .setStrokeStyle(3, 0xC44D6D).setInteractive({ useHandCursor: true }).setDepth(60);
    this.matchTxt = this.add.text(this.W * 0.28, btnY, 'MATCH', {
      fontSize: '20px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    this.noMatchBtn = this.add.rectangle(this.W * 0.72, btnY, btnW, btnH, 0xFF3B30)
      .setStrokeStyle(3, 0xCC2222).setInteractive({ useHandCursor: true }).setDepth(60);
    this.noMatchTxt = this.add.text(this.W * 0.72, btnY, 'NO MATCH', {
      fontSize: '18px', fill: '#FFFFFF', fontFamily: 'Arial', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(61);
    this.matchBtn.on('pointerdown', function() { this.resolveBet('MATCH'); }, this);
    this.noMatchBtn.on('pointerdown', function() { this.resolveBet('NO_MATCH'); }, this);
    this.hideBetButtons();
  }

  showBetButtons() {
    [this.matchBtn, this.matchTxt, this.noMatchBtn, this.noMatchTxt].forEach(function(o) {
      o.setVisible(true).setScale(0);
    });
    this.tweens.add({ targets: [this.matchBtn, this.matchTxt], scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.noMatchBtn, this.noMatchTxt], scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.easeOut' });
  }

  hideBetButtons() {
    [this.matchBtn, this.matchTxt, this.noMatchBtn, this.noMatchTxt].forEach(function(o) { o.setVisible(false); });
  }

  resolveBet(choice) {
    if (!this.waitingForBet || this.gameOver) return;
    this.lastInputTime = Date.now();
    this.waitingForBet = false;
    this.hideBetButtons();

    var d = this.currentDropData, pos = this.currentDropPos;
    var hasMatch = false;
    if (!d.isCrasher && d.birthday) {
      for (var i = 0; i < this.roomCards.length - 1; i++) {
        if (this.roomCards[i].birthday === d.birthday && !this.roomCards[i].isCrasher) { hasMatch = true; break; }
      }
    }
    if (d.isCrasher) hasMatch = Math.random() < 0.3;

    var correct = (choice === 'MATCH' && hasMatch) || (choice === 'NO_MATCH' && !hasMatch);
    this.stageBetsTotal++;
    GameState.totalBets++;

    if (correct) this.handleCorrectBet(choice, hasMatch, pos);
    else this.handleWrongBet(choice, hasMatch, pos);
    this.checkStageComplete();
    this.updateHUD();
  }

  handleCorrectBet(choice, hasMatch, pos) {
    this.stageBetsCorrect++;
    GameState.streak++;
    GameState.correctBets++;
    this.timer += this.stageConfig.correctBonus;
    var pts = hasMatch ? SCORE_VALUES.correctMatch : SCORE_VALUES.correctNoMatch;
    if (this.timer < SCORE_VALUES.clutchThreshold) pts *= SCORE_VALUES.clutchMultiplier;
    if (GameState.streak >= 5) pts *= 2;
    else if (GameState.streak >= 3) pts = Math.floor(pts * 1.5);
    pts += (GameState.streak >= 3) ? SCORE_VALUES.streakBonus * (GameState.streak - 2) : 0;
    if (this.timer <= 3) pts += SCORE_VALUES.nearMiss;
    GameState.score += Math.floor(pts);

    this.screenFlash(0x34C759, hasMatch ? 0.35 : 0.2, 250);
    this.floatingText(pos.x, pos.y - 20, '+' + this.stageConfig.correctBonus.toFixed(0) + 's', COLORS.reward, 24);
    this.floatingText(this.W / 2, this.H * 0.4, '+' + Math.floor(pts), '#FFD93D', 20);
    this.scalePunch(this.scoreText, 1.3, 100);
    if (hasMatch) {
      this.confettiBurst(pos.x, pos.y, GameState.streak >= 5 ? 24 : 12);
      this.hitStop(80);
      this.cameraZoomPulse(GameState.streak >= 7 ? 1.08 : 1.05, 100);
      this.goldRingPulse(pos.x, pos.y, 3);
    }
    if (GameState.streak >= 3) this.streakFlameEffect(this.streakText, GameState.streak);
  }

  handleWrongBet(choice, hasMatch, pos) {
    GameState.streak = 0;
    this.timer -= this.stageConfig.wrongPenalty;
    this.screenFlash(0xFF3B30, 0.35, 300);
    this.wrongBetShake();
    this.floatingText(pos.x, pos.y - 20, '-' + this.stageConfig.wrongPenalty.toFixed(0) + 's', COLORS.danger, 24);
    if (hasMatch && choice === 'NO_MATCH') {
      for (var i = 0; i < this.roomCards.length - 1; i++) {
        if (this.roomCards[i].birthday === this.currentDropData.birthday) {
          this.matchHighlight(this.roomCards[i].x, this.roomCards[i].y, true);
          break;
        }
      }
    }
  }

  checkStageComplete() {
    if (this.roomCards.length >= this.stageConfig.roomTarget && !this.stageTransitioning) {
      this.stageTransitioning = true;
      var pts = SCORE_VALUES.stageClear * GameState.stage;
      if (this.stageBetsCorrect === this.stageBetsTotal) pts += SCORE_VALUES.perfectStage;
      GameState.score += pts;
      this.floatingText(this.W / 2, this.H * 0.3, 'STAGE CLEAR +' + pts, '#FFD93D', 28);
      var scene = this;
      this.stageClearEffect(function() { GameState.stage++; scene.scene.restart(); });
    }
  }

  triggerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    var isNewHigh = GameState.score > GameState.highScore;
    if (isNewHigh) { GameState.highScore = GameState.score; saveHighScore(GameState.score); }
    var scene = this;
    this.bombExplodeEffect(this.bombImg, function() {
      scene.scene.pause('GameScene');
      scene.scene.launch('GameOverScene', { score: GameState.score, stage: GameState.stage, isNewHigh: isNewHigh });
    });
  }

  revivePlayer() {
    this.gameOver = false;
    this.timer = 10;
    this.lastInputTime = Date.now();
    this.updateHUD();
  }

  update(time, delta) {
    if (this.gameOver || this.paused || this.stageTransitioning) return;
    this.timer -= delta / 1000;
    if (this.timer <= 0 && !this.gameOver) { this.timer = 0; this.triggerDeath(); }
    if (this.timer < 5 && this.bombImg) this.bombImg.x = this.W / 2 + Math.sin(time * 0.02) * 4;
    if (Date.now() - this.lastInputTime > 25000 && !this.gameOver) this.triggerDeath();
    this.updateHUD();
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this.visHandler) document.removeEventListener('visibilitychange', this.visHandler);
  }
}
