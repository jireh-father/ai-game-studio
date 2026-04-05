// Monty's Goats - HUD & Door Setup (mixed into GameScene)
Object.assign(GameScene.prototype, {
  createDoors(count) {
    const w = this.scale.width;
    this.doors.forEach(d => d.destroy());
    this.doorNumbers.forEach(d => d.destroy());
    this.doors = [];
    this.doorNumbers = [];
    const doorW = count === 4 ? 75 : 90;
    const gap = count === 4 ? 85 : 105;
    const startX = w / 2 - (count - 1) * gap / 2;
    for (let i = 0; i < count; i++) {
      const x = startX + i * gap;
      const door = this.add.image(x, 310, 'doorClosed')
        .setDisplaySize(doorW, doorW * 1.6).setInteractive().setDepth(2);
      door.doorIndex = i;
      door.on('pointerdown', () => this.onDoorTap(i));
      this.doors.push(door);
      const num = this.add.text(x, 310, `${i + 1}`, {
        fontSize: '28px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(3);
      this.doorNumbers.push(num);
    }
  },

  createDecisionButtons() {
    const w = this.scale.width, h = this.scale.height;
    const btnY = h - 80;
    this.switchBg = this.add.rectangle(w / 2 - 80, btnY, 140, 55, COLORS.switchBtn)
      .setInteractive().setDepth(8).setVisible(false);
    this.switchLabel = this.add.text(w / 2 - 80, btnY, 'SWITCH', {
      fontSize: '20px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(9).setVisible(false);
    this.switchLabel.disableInteractive();

    this.stayBg = this.add.rectangle(w / 2 + 80, btnY, 140, 55, COLORS.stayBtn)
      .setInteractive().setDepth(8).setVisible(false);
    this.stayLabel = this.add.text(w / 2 + 80, btnY, 'STAY', {
      fontSize: '20px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(9).setVisible(false);
    this.stayLabel.disableInteractive();

    this.switchBg.on('pointerdown', () => this.onDecision('switch'));
    this.stayBg.on('pointerdown', () => this.onDecision('stay'));
  },

  createHUD() {
    this.scoreText = this.add.text(10, 18, `SCORE: ${GameState.score}`, {
      fontSize: '16px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
    }).setDepth(10);
    this.roundText = this.add.text(this.scale.width / 2, 18, `ROUND: ${GameState.round}`, {
      fontSize: '14px', fontFamily: 'Arial', fill: '#FFFFFF'
    }).setOrigin(0.5, 0).setDepth(10);
    this.strikeDots = [];
    for (let i = 0; i < 3; i++) {
      const dot = this.add.circle(this.scale.width - 50 + i * 18, 26, 7, 0x333333).setDepth(10);
      dot.setStrokeStyle(2, COLORS.danger);
      this.strikeDots.push(dot);
    }
    this.updateStrikeDots();
    this.comboBadge = this.add.text(this.scale.width - 50, 48, '', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(10).setVisible(false);
  },

  updateHUD() {
    this.scoreText.setText(`SCORE: ${GameState.score}`);
    this.roundText.setText(`ROUND: ${GameState.round}`);
    this.updateStrikeDots();
    if (GameState.combo >= 3) {
      const mult = this.getComboMultiplier();
      this.comboBadge.setText(`x${mult}`).setVisible(true);
    } else {
      this.comboBadge.setVisible(false);
    }
  },

  updateStrikeDots() {
    for (let i = 0; i < 3; i++) {
      this.strikeDots[i].setFillStyle(i < GameState.strikes ? COLORS.danger : 0x333333);
    }
  },

  getComboMultiplier() {
    let mult = 1;
    for (const t of COMBO_THRESHOLDS) {
      if (GameState.combo >= t.streak) mult = t.multiplier;
    }
    return mult;
  },

  setDecisionVisible(vis) {
    this.switchBg.setVisible(vis);
    this.switchLabel.setVisible(vis);
    this.stayBg.setVisible(vis);
    this.stayLabel.setVisible(vis);
  },

  showSpeechBubble(text) {
    this.speechBg.setVisible(true);
    this.speechText.setText(text).setVisible(true);
    this.speechBg.setY(80);
    this.speechText.setY(80);
    this.tweens.add({ targets: [this.speechBg, this.speechText], y: 160, duration: 200, ease: 'Back.Out' });
    this.speechText.setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: this.speechText, scale: 1, alpha: 1, duration: 150, delay: 100 });
  }
});
