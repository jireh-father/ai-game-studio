// Monty's Goats - Visual Effects (juice)
// Mixed into GameScene.prototype via Object.assign

Object.assign(GameScene.prototype, {
  doorPickEffect(index) {
    const door = this.doors[index];
    // Scale punch
    this.tweens.add({ targets: door, scaleX: 1.12, scaleY: 1.12, duration: 60, yoyo: true, ease: 'Sine.InOut' });
    // Particle burst
    this.spawnParticles(door.x, door.y, 6, COLORS.primary, 40, 400);
    // Camera nudge
    this.cameras.main.shake(80, 0.002);
    // Haptic
    if (navigator.vibrate) navigator.vibrate(20);
  },

  doorFlipEffect(doorIndex, newTexture) {
    const door = this.doors[doorIndex];
    // Hit-stop via setTimeout (NOT Phaser timer)
    const scene = this;
    setTimeout(() => {
      scene.tweens.add({
        targets: door, scaleX: 0, duration: 100, ease: 'Sine.In',
        onComplete: () => {
          door.setTexture(newTexture);
          scene.tweens.add({ targets: door, scaleX: 1, duration: 100, ease: 'Sine.Out' });
        }
      });
    }, 80);
    // Camera nudge
    this.cameras.main.shake(150, 0.003);
  },

  buttonPunchEffect(btn) {
    this.tweens.add({ targets: btn, scaleX: 1.15, scaleY: 1.15, duration: 50, yoyo: true });
  },

  correctEffect(points) {
    const w = this.scale.width;
    // Gold flash
    this.goldFlash.setAlpha(0);
    this.tweens.add({ targets: this.goldFlash, alpha: 0.7, duration: 150, yoyo: true, hold: 50 });
    // Particles from winning door
    const wd = this.doors[this.roundData.carDoor];
    if (wd) this.spawnParticles(wd.x, wd.y, 15, COLORS.reward, 80, 700);
    // Score float
    this.floatScore(wd ? wd.x : w / 2, wd ? wd.y - 40 : 280, `+${points}`);
    // Score HUD punch
    this.tweens.add({
      targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true,
      onStart: () => this.scoreText.setColor('#FFD700'),
      onComplete: () => this.scoreText.setColor('#FFFFFF')
    });
    // Door scale punch
    if (wd) this.tweens.add({ targets: wd, scaleX: 1.25, scaleY: 1.25, duration: 200, yoyo: true });
    // Haptic
    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    // Combo effect
    if (GameState.combo >= 3) this.comboEffect();
  },

  wrongEffect() {
    // Screen shake
    this.cameras.main.shake(300, 0.008);
    // Red flash
    this.redFlash.setAlpha(0);
    this.tweens.add({ targets: this.redFlash, alpha: 0.5, duration: 200, yoyo: true });
    // Strike dot punch
    const idx = GameState.strikes - 1;
    if (idx >= 0 && idx < 3) {
      this.tweens.add({
        targets: this.strikeDots[idx], scaleX: 1.4, scaleY: 1.4, duration: 125, yoyo: true
      });
    }
    // Haptic
    if (navigator.vibrate) navigator.vibrate([100, 30, 100]);
    // Combo break
    if (GameState.combo >= 3) {
      this.comboBadge.setVisible(true);
      this.tweens.add({
        targets: this.comboBadge, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 200,
        onComplete: () => this.comboBadge.setVisible(false).setAlpha(1).setScale(1)
      });
    }
  },

  comboEffect() {
    const mult = this.getComboMultiplier();
    this.comboBadge.setText(`x${mult}`).setVisible(true).setScale(0);
    this.tweens.add({ targets: this.comboBadge, scaleX: 1.3, scaleY: 1.3, duration: 150, yoyo: true,
      onComplete: () => this.comboBadge.setScale(1)
    });
    // Color based on level
    if (mult >= 5) {
      this.comboBadge.setColor('#FF00FF');
    } else if (mult >= 3) {
      this.comboBadge.setColor('#FF8C00');
    } else {
      this.comboBadge.setColor('#FFD700');
    }
  },

  montyBounceEffect() {
    this.tweens.add({ targets: this.montyAvatar, y: 80, duration: 300, ease: 'Bounce.Out', yoyo: true });
  },

  timerFlashEffect() {
    this.tweens.add({ targets: this.timerBar, alpha: 0, duration: 50, yoyo: true, repeat: 2 });
  },

  goatModeEffect() {
    const w = this.scale.width, h = this.scale.height;
    // Desaturation
    this.cameras.main.setBackgroundColor('#1A1A1A');
    // Red flash
    this.redFlash.setAlpha(0);
    this.tweens.add({ targets: this.redFlash, alpha: 0.6, duration: 400 });
    // Screen shake
    this.cameras.main.shake(500, 0.015);

    // GOAT MODE text
    const gmText = this.add.text(w / 2, h / 2 - 40, 'GOAT MODE!', {
      fontSize: '40px', fontFamily: 'Arial', fill: '#FF2D55', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(25).setScale(2);
    this.tweens.add({ targets: gmText, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.Out' });

    // Flying goats
    const positions = [
      { x: -60, y: h / 2 }, { x: w + 60, y: h / 2 },
      { x: w / 2, y: -60 }, { x: w / 2, y: h + 60 },
      { x: -60, y: h / 4 }
    ];
    this.goatSprites = [];
    positions.forEach((pos, i) => {
      const goat = this.add.image(pos.x, pos.y, 'goatBig').setDepth(22).setScale(0.8);
      this.goatSprites.push(goat);
      const tx = 60 + Math.random() * (w - 120);
      const ty = 200 + Math.random() * (h - 350);
      this.tweens.add({
        targets: goat, x: tx, y: ty, duration: 600, ease: 'Power2',
        delay: i * 80,
        onComplete: () => {
          // Bounce animation
          this.tweens.add({ targets: goat, y: ty - 20, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
          // Make tappable for bonus
          goat.setInteractive();
          goat.on('pointerdown', () => {
            this.lastInputTime = Date.now();
            GameState.score += 10;
            this.spawnParticles(goat.x, goat.y, 8, 0xC8B89A, 20, 300);
            this.tweens.add({
              targets: goat, scaleY: 0, duration: 200,
              onComplete: () => goat.destroy()
            });
            if (navigator.vibrate) navigator.vibrate(30);
          });
        }
      });
    });
  },

  spawnParticles(x, y, count, color, radius, lifespan) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const p = this.add.circle(x, y, 4, color).setDepth(15).setAlpha(1);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: lifespan,
        onComplete: () => p.destroy()
      });
    }
  },

  floatScore(x, y, text) {
    const fontSize = GameState.combo >= 8 ? '36px' : GameState.combo >= 5 ? '30px' : GameState.combo >= 3 ? '26px' : '22px';
    const txt = this.add.text(x, y, text, {
      fontSize, fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: txt, y: y - 70, alpha: 0, duration: 800,
      onComplete: () => txt.destroy()
    });
  }
});
