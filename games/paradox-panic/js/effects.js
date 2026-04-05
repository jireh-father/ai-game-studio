// Paradox Panic - Juice Effects (mixin for GameScene)
// AudioManager defined in config.js (loads first)

Object.assign(GameScene.prototype, {
  animateCorrect(card, type, points) {
    AudioManager.resume();
    const w = this.scale.width;
    const exitX = type === 'FALSE' ? -400 : (type === 'TRUE' ? w + 400 : w / 2);
    const exitY = type === 'PARADOX' ? card.bg.y - 150 : card.bg.y;

    // Flash border color
    const flashKey = type === 'PARADOX' ? 'cardPurple' : (type === 'TRUE' ? 'cardGreen' : 'cardRed');
    card.bg.setTexture(flashKey);
    card.bg.setDisplaySize(CARD_WIDTH, CARD_HEIGHT);

    // Hit-stop (80ms freeze via setTimeout)
    const targets = this.cardStack.filter((c, i) => i < this.cardStack.length - 1);
    setTimeout(() => {
      // Card exit animation
      this.tweens.add({
        targets: [card.bg, card.text], x: exitX, y: exitY, alpha: 0,
        scaleX: 0.8, scaleY: 0.8, duration: 180, ease: 'Cubic.easeIn',
        onComplete: () => {
          this.cardStack.pop();
          card.bg.destroy(); card.text.destroy();
          this.repositionCards();
          this.swipeActive = false;
        }
      });
    }, 80);

    // Particles
    const particleKey = type === 'PARADOX' ? 'particlePurple' : (type === 'TRUE' ? 'particleGreen' : 'particleRed');
    this.spawnParticles(card.bg.x, card.bg.y, particleKey, 15);

    // Screen shake
    this.cameras.main.shake(120, 0.003);

    // Score text punch
    this.tweens.add({ targets: this.scoreText, scaleX: 1.4, scaleY: 1.4, duration: 110, yoyo: true });

    // Floating score
    this.showFloatingText(card.bg.x, card.bg.y - 30, `+${points}`, '#FFFFFF', 20);

    // Combo text
    if (this.comboCount >= 4) {
      this.showFloatingText(card.bg.x, card.bg.y - 60, `COMBO x${this.comboCount}`, COLORS.comboGoldHex, 24);
    }

    // Audio
    const pitch = 1.0 + Math.min(this.comboCount, 4) * 0.05;
    if (type === 'TRUE') AudioManager.play(880 * pitch, 0.15, 'sine', 0.12);
    else if (type === 'FALSE') AudioManager.play(330 * pitch, 0.15, 'triangle', 0.12);
    else AudioManager.playChord([262 * pitch, 330 * pitch, 392 * pitch, 494 * pitch], 0.4, 'sine');
  },

  animateWrong(card) {
    // Shake card
    this.tweens.add({
      targets: [card.bg, card.text], x: card.bg.x - 8, duration: 38, yoyo: true, repeat: 3,
      onComplete: () => { card.bg.x = this.scale.width / 2; card.text.x = this.scale.width / 2; }
    });
    card.bg.setTexture('cardRed');
    card.bg.setDisplaySize(CARD_WIDTH, CARD_HEIGHT);
    this.time.delayedCall(200, () => { if (card.bg.active) { card.bg.setTexture('card'); card.bg.setDisplaySize(CARD_WIDTH, CARD_HEIGHT); }});

    // Strike pop
    const si = GameState.strikes - 1;
    if (si >= 0 && si < this.strikeImages.length) {
      this.tweens.add({ targets: this.strikeImages[si], scaleX: 1.6, scaleY: 1.6, duration: 120, yoyo: true });
    }
    // Buzzer
    AudioManager.play(220, 0.2, 'sawtooth', 0.1);
    this.cameras.main.shake(100, 0.002);
  },

  animateWrongParadox(card) {
    // Button flash red
    this.paradoxBtn.setTint(0xFF4757);
    this.paradoxBtnText.setText('WRONG!');
    this.time.delayedCall(1200, () => {
      if (this.paradoxBtn && this.paradoxBtn.active) {
        this.paradoxBtn.setTint(COLORS.paradox);
        this.paradoxBtnText.setText('PARADOX');
      }
    });
    // Card shake (stronger)
    this.tweens.add({
      targets: [card.bg, card.text], x: card.bg.x - 12, duration: 33, yoyo: true, repeat: 5,
      onComplete: () => { card.bg.x = this.scale.width / 2; card.text.x = this.scale.width / 2; }
    });
    // Double buzzer
    AudioManager.play(180, 0.18, 'sawtooth', 0.12);
    this.time.delayedCall(180, () => AudioManager.play(140, 0.18, 'sawtooth', 0.12));

    // Strike pops
    for (let i = 0; i < GAME_CONFIG.wrongParadoxPenalty; i++) {
      const si = GameState.strikes - GAME_CONFIG.wrongParadoxPenalty + i;
      if (si >= 0 && si < this.strikeImages.length) {
        this.time.delayedCall(i * 100, () => {
          this.tweens.add({ targets: this.strikeImages[si], scaleX: 1.6, scaleY: 1.6, duration: 120, yoyo: true });
        });
      }
    }
    this.cameras.main.shake(150, 0.005);
    this.spawnParticles(this.paradoxBtn.x, this.paradoxBtn.y, 'particleRed', 10);
  },

  animateDeath(cause) {
    // Screen flash
    const flash = this.add.rectangle(this.scale.width/2, this.scale.height/2,
      this.scale.width, this.scale.height, 0xFF4757, 0).setDepth(100);
    this.tweens.add({ targets: flash, alpha: 0.5, duration: 200, yoyo: true });

    // Screen shake
    const intensity = cause === 'OVERFLOW' ? 0.01 : 0.008;
    this.cameras.main.shake(500, intensity);

    if (cause === 'OVERFLOW') {
      // Cards scatter
      this.cardStack.forEach((card, i) => {
        const angle = Math.random() * Math.PI * 2;
        this.tweens.add({
          targets: [card.bg, card.text],
          x: card.bg.x + Math.cos(angle) * 500,
          y: card.bg.y + Math.sin(angle) * 500,
          alpha: 0, rotation: (Math.random() - 0.5) * 3,
          duration: 400, delay: 100 + i * 50
        });
      });
      AudioManager.play(100, 0.5, 'sawtooth', 0.15);
    } else {
      // Strikes flash
      this.strikeImages.forEach((s, i) => {
        this.tweens.add({ targets: s, alpha: 0, duration: 100, yoyo: true, repeat: 5, delay: i * 50 });
      });
      // Triple descending buzzer
      AudioManager.play(300, 0.15, 'sawtooth', 0.1);
      this.time.delayedCall(150, () => AudioManager.play(240, 0.15, 'sawtooth', 0.1));
      this.time.delayedCall(300, () => AudioManager.play(180, 0.2, 'sawtooth', 0.1));
    }
  },

  spawnParticles(x, y, key, count) {
    for (let i = 0; i < count; i++) {
      const p = this.add.image(x, y, key).setDepth(99).setScale(0.8);
      const angle = (Math.PI * 2 / count) * i;
      const dist = 40 + Math.random() * 60;
      this.tweens.add({
        targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, scale: 0, duration: 350, ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  },

  showFloatingText(x, y, text, color, size) {
    const txt = this.add.text(x, y, text, {
      fontSize: `${size}px`, fontFamily: 'monospace', color, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(90);
    this.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 700, onComplete: () => txt.destroy() });
  },

  showSpeedBonus(card, text) {
    this.time.delayedCall(200, () => {
      this.showFloatingText(card.bg.x + 40, card.bg.y - 20, text, COLORS.speedBonus, 18);
      AudioManager.play(1200, 0.1, 'sine', 0.08);
    });
  },

  showStageChange(newStage) {
    const txt = this.add.text(this.scale.width / 2, this.scale.height / 2, `STAGE ${newStage + 1}`, {
      fontSize: '36px', fontFamily: 'monospace', color: COLORS.paradoxHex, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(90).setAlpha(0);
    this.tweens.add({ targets: txt, alpha: 1, scaleX: 1.2, scaleY: 1.2, duration: 300, yoyo: true,
      hold: 400, onComplete: () => txt.destroy() });
    AudioManager.playChord([523, 659, 784], 0.3, 'sine');
  },

  playStackWarning() {
    if (this.cardStack.length >= 4) {
      AudioManager.play(80, 0.3, 'square', 0.06);
    }
  },

  playCardArriveSound() {
    AudioManager.play(600, 0.08, 'sine', 0.05);
  }
});
