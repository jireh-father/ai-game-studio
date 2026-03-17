// Speed Dating Dodge — Rendering, Date Visuals, Effects
// These methods are mixed into GameScene prototype

GameScene.prototype.createParticleTextures = function() {
  if (!this.textures.exists('p_green')) {
    const g1 = this.make.graphics({ x: 0, y: 0, add: false });
    g1.fillStyle(0x6AB04C); g1.fillCircle(4, 4, 4);
    g1.generateTexture('p_green', 8, 8); g1.destroy();
  }
  if (!this.textures.exists('p_red')) {
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0xEE5A24); g2.fillCircle(4, 4, 4);
    g2.generateTexture('p_red', 8, 8); g2.destroy();
  }
  if (!this.textures.exists('p_gold')) {
    const g3 = this.make.graphics({ x: 0, y: 0, add: false });
    g3.fillStyle(0xF9CA24); g3.fillCircle(4, 4, 4);
    g3.generateTexture('p_gold', 8, 8); g3.destroy();
  }
};

GameScene.prototype.showDateIntro = function() {
  const w = this.scale.width;
  const d = this.currentDate;

  // Avatar circle
  const color = Phaser.Display.Color.HexStringToColor(d.avatarColor);
  const avatarCircle = this.add.circle(w/2, 140, 50, color.color, 0.9);
  avatarCircle.setScale(0.3);
  this.tweens.add({ targets: avatarCircle, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

  // Eyes
  const eyeL = this.add.circle(w/2 - 12, 132, 6, 0x2C3A47).setScale(0.3);
  const eyeR = this.add.circle(w/2 + 12, 132, 6, 0x2C3A47).setScale(0.3);
  const eyeHL = this.add.circle(w/2 - 9, 130, 2.2, 0xFFFFFF).setScale(0.3);
  const eyeHR = this.add.circle(w/2 + 15, 130, 2.2, 0xFFFFFF).setScale(0.3);
  [eyeL, eyeR, eyeHL, eyeHR].forEach(e => {
    this.tweens.add({ targets: e, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });
  });

  // Mouth (happy arc)
  const mouth = this.add.graphics();
  mouth.lineStyle(3, 0x2C3A47);
  mouth.beginPath();
  mouth.moveTo(w/2 - 14, 155);
  mouth.quadraticCurveTo(w/2, 168, w/2 + 14, 155);
  mouth.strokePath();
  mouth.setScale(0.3);
  this.tweens.add({ targets: mouth, scaleX: 1, scaleY: 1, duration: 300, ease: 'Back.easeOut' });

  // Blush dots
  const blushL = this.add.circle(w/2 - 30, 150, 7, 0xFF6B6B, 0.3).setScale(0.3);
  const blushR = this.add.circle(w/2 + 30, 150, 7, 0xFF6B6B, 0.3).setScale(0.3);
  this.tweens.add({ targets: [blushL, blushR], scaleX: 1, scaleY: 1, duration: 300 });

  // Personality icon badge
  const badge = this.add.circle(w/2, 80, 16, color.color);
  badge.setStrokeStyle(2, 0x2C3A47);
  const iconLabel = d.personalityType.charAt(0);
  const iconTxt = this.add.text(w/2, 80, iconLabel, {
    fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
  }).setOrigin(0.5);

  // Name
  const nameTxt = this.add.text(w/2, 198, d.name, {
    fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
  }).setOrigin(0.5);

  this.dateObjects.push(avatarCircle, eyeL, eyeR, eyeHL, eyeHR, mouth, blushL, blushR, badge, iconTxt, nameTxt);
  this.avatarCircle = avatarCircle;
  this.mouthGraphics = mouth;

  this.time.delayedCall(400, () => {
    if (!this.gameOver) this.showQuestion();
  });
};

GameScene.prototype.showQuestion = function() {
  if (this.gameOver || !this.currentDate) return;
  const w = this.scale.width;
  const q = this.currentDate.questions[this.currentQuestionIdx];
  if (!q) { this.completeDate(); return; }

  const qText = this.add.text(w/2, 230, q.text, {
    fontSize: '17px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT,
    wordWrap: { width: w - 40 }, align: 'center'
  }).setOrigin(0.5, 0);

  const bubbleY = 310;
  const bubbleW = 148, bubbleH = 56;

  const leftBubble = this.add.rectangle(w/2 - 80, bubbleY, bubbleW, bubbleH, 0xF8F9FA);
  leftBubble.setStrokeStyle(2.5, 0x2C3A47);
  const leftText = this.add.text(w/2 - 80, bubbleY, q.answers.left, {
    fontSize: '12px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT,
    wordWrap: { width: bubbleW - 16 }, align: 'center'
  }).setOrigin(0.5);

  const rightBubble = this.add.rectangle(w/2 + 80, bubbleY, bubbleW, bubbleH, 0xF8F9FA);
  rightBubble.setStrokeStyle(2.5, 0x2C3A47);
  const rightText = this.add.text(w/2 + 80, bubbleY, q.answers.right, {
    fontSize: '12px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT,
    wordWrap: { width: bubbleW - 16 }, align: 'center'
  }).setOrigin(0.5);

  const arrowL = this.add.text(w/2 - 155, bubbleY, '\u2190', {
    fontSize: '20px', color: CONFIG.COLOR_TEXT
  }).setOrigin(0.5).setAlpha(0.3);
  const arrowR = this.add.text(w/2 + 155, bubbleY, '\u2192', {
    fontSize: '20px', color: CONFIG.COLOR_TEXT
  }).setOrigin(0.5).setAlpha(0.3);

  this.dateObjects.push(qText, leftBubble, leftText, rightBubble, rightText, arrowL, arrowR);
  this.leftBubble = leftBubble;
  this.rightBubble = rightBubble;

  this.timerTotal = this.currentDate.timerMs;
  this.timerRemaining = this.timerTotal;
  this.timerExpired = false;
};

GameScene.prototype.triggerSparkBonus = function() {
  const w = this.scale.width;
  const h = this.scale.height;

  const sparkTxt = this.add.text(w/2, h/2 - 30, 'SPARK!', {
    fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_GOLD
  }).setOrigin(0.5).setDepth(25).setScale(0.4);
  this.tweens.add({
    targets: sparkTxt, scaleX: 1.6, scaleY: 1.6, duration: 350,
    ease: 'Back.easeOut', onComplete: () => {
      this.tweens.add({ targets: sparkTxt, alpha: 0, duration: 400, onComplete: () => sparkTxt.destroy() });
    }
  });

  if (this.avatarCircle) {
    const emitter = this.add.particles(this.avatarCircle.x, this.avatarCircle.y, 'p_gold', {
      speed: { min: 80, max: 250 }, angle: { min: 0, max: 360 },
      lifespan: 500, quantity: 20, scale: { start: 1, end: 0 },
      emitting: false
    });
    emitter.explode(20);
    this.time.delayedCall(600, () => emitter.destroy());
  }

  this.cameras.main.zoomTo(1.04, 200, 'Quad.easeOut', false, (cam, progress) => {
    if (progress === 1) this.cameras.main.zoomTo(1, 200);
  });

  SFX.play('spark');
};

GameScene.prototype.emitCorrectEffects = function(bx, by, pts, multi) {
  // Particles
  const pCount = 20 + (multi - 1) * 4;
  const emitter = this.add.particles(bx, by, 'p_green', {
    speed: { min: 100, max: 300 }, angle: { min: 0, max: 360 },
    lifespan: 400, quantity: pCount, scale: { start: 0.8, end: 0 },
    emitting: false
  });
  emitter.explode(pCount);
  this.time.delayedCall(500, () => emitter.destroy());

  // Bubble scale punch
  const bubble = (bx < this.scale.width / 2) ? this.leftBubble : this.rightBubble;
  if (bubble) {
    this.tweens.add({ targets: bubble, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true });
  }

  // Avatar pulse
  if (this.avatarCircle) {
    this.tweens.add({ targets: this.avatarCircle, scaleX: 1.15, scaleY: 1.15, duration: 120, yoyo: true });
  }

  // Screen shake
  this.cameras.main.shake(120, 0.003);

  // Floating score
  const floatTxt = this.add.text(bx, by - 10, '+' + pts, {
    fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_GOLD
  }).setOrigin(0.5).setDepth(20);
  this.tweens.add({ targets: floatTxt, y: by - 60, alpha: 0, duration: 600, onComplete: () => floatTxt.destroy() });

  // Score text punch
  if (this.scoreText) {
    this.tweens.add({ targets: this.scoreText, scaleX: 1.35, scaleY: 1.35, duration: 140, yoyo: true });
  }
};

GameScene.prototype.emitWrongEffects = function(bx, by) {
  // Red particles
  const emitter = this.add.particles(bx, by, 'p_red', {
    speed: { min: 100, max: 300 }, angle: { min: 0, max: 360 },
    lifespan: 400, quantity: 15, scale: { start: 0.8, end: 0 },
    emitting: false
  });
  emitter.explode(15);
  this.time.delayedCall(500, () => emitter.destroy());

  // Heavy screen shake
  this.cameras.main.shake(180, 0.008);

  // Red flash
  const flash = this.add.rectangle(this.scale.width/2, this.scale.height/2,
    this.scale.width, this.scale.height, 0xEE5A24, 0.3).setDepth(30);
  this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

  // Heart break animation
  if (this.hearts[this.failCount - 1]) {
    const h = this.hearts[this.failCount - 1];
    this.tweens.add({ targets: h, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true,
      onComplete: () => { h.setColor('#8395A7'); h.setAlpha(0.5); }
    });
  }
};

GameScene.prototype.emitGameOverEffects = function() {
  this.cameras.main.shake(350, 0.012);

  const flash = this.add.rectangle(this.scale.width/2, this.scale.height/2,
    this.scale.width, this.scale.height, 0xEE5A24, 0.5).setDepth(30);
  this.tweens.add({ targets: flash, alpha: 0, duration: 400 });

  this.hearts.forEach(h => {
    this.tweens.add({ targets: h, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true });
  });
};
