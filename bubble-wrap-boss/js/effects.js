// effects.js — Sound effects and visual effects mixin for GameScene

// Sound effects — called as methods on GameScene (this = scene)
const SoundEffects = {
  createSoundBank() {
    this.audioCtx = null;
    try {
      if (this.sound && this.sound.context) {
        this.audioCtx = this.sound.context;
      }
    } catch(e) {}
  },

  playTone(freq, dur, type, vol) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur/1000);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + dur/1000);
    } catch(e) {}
  },

  playPopSound() {
    const pitch = 880 + (Math.random() * 80 - 40) + (this.combo >= 15 ? 80 : 0);
    this.playTone(pitch, 120, 'sine', 0.15);
  },

  playBuzzSound() { this.playTone(200, 200, 'sawtooth', 0.1); },

  playWhooshSound() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, this.audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.18);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.18);
    } catch(e) {}
  },

  playRowClearSound() { this.playTone(1000, 200, 'sine', 0.12); },

  playStageClearSound() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 120, 'sine', 0.12), i * 130);
    });
  },

  playGameOverSound() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain); gain.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, this.audioCtx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.8);
      osc.start(this.audioCtx.currentTime);
      osc.stop(this.audioCtx.currentTime + 0.8);
    } catch(e) {}
  },

  playClickSound() {
    this.playTone(440, 60, 'sine', 0.12);
  }
};

// Visual effects — called as methods on GameScene (this = scene)
const VisualEffects = {
  popParticles(x, y, color) {
    const hex = Phaser.Display.Color.HexStringToColor(BUBBLE_HEX_MAP[color] || COLORS.GRAY).color;
    const count = this.combo >= 15 ? 16 : this.combo >= 10 ? 12 : this.combo >= 5 ? 8 : 6;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 180 + Math.random() * 40;
      const p = this.add.circle(x, y, 4, hex).setDepth(80);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * 0.3,
        y: y + Math.sin(angle) * speed * 0.3,
        alpha: 0, duration: 300,
        onComplete: () => p.destroy()
      });
    }
  },

  showFloatingScore(x, y, points, color) {
    const hex = BUBBLE_HEX_MAP[color] || COLORS.COMBO;
    const txt = this.add.text(x, y, '+' + points, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: hex
    }).setOrigin(0.5).setDepth(90);
    this.tweens.add({
      targets: txt, y: y - 60, duration: 600,
      onComplete: () => txt.destroy()
    });
    this.tweens.add({ targets: txt, alpha: 0, delay: 300, duration: 300 });
  },

  showCombo(count) {
    this.comboText.setText('COMBO x' + count + '!');
    this.comboText.setAlpha(1);
    const scale = count >= 15 ? 1.2 : count >= 10 ? 1.1 : 1.0;
    this.comboText.setScale(0.5);
    this.tweens.add({
      targets: this.comboText, scaleX: scale, scaleY: scale, duration: 150,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: this.comboText, alpha: 0, delay: 550, duration: 200
    });
  },

  showRowBonus(y) {
    const txt = this.add.text(GAME_WIDTH/2, y, '+100 ROW!', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.ROW_BONUS
    }).setOrigin(0.5).setDepth(90);
    this.tweens.add({
      targets: txt, y: y - 80, duration: 700,
      onComplete: () => txt.destroy()
    });
    this.tweens.add({ targets: txt, alpha: 0, delay: 400, duration: 300 });
  }
};

// HUD methods — called as methods on GameScene (this = scene)
const HUDMethods = {
  createHUD() {
    this.scoreLabel = this.add.text(16, 12, 'SCORE', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: COLORS.SUBTITLE
    }).setDepth(100);
    this.scoreText = this.add.text(16, 26, String(this.score), {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.HUD_TEXT
    }).setDepth(100);

    this.stageText = this.add.text(GAME_WIDTH/2, 30, 'STAGE ' + this.stage, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.HUD_TEXT
    }).setOrigin(0.5).setDepth(100);

    this.strikeIcons = [];
    for (let i = 0; i < MAX_STRIKES; i++) {
      const x = GAME_WIDTH - 80 + i * 32;
      const key = i < this.strikes ? 'strike_lost' : 'strike_active';
      const icon = this.add.image(x, 36, key).setDepth(100);
      this.strikeIcons.push(icon);
    }

    this.priorityContainer = this.add.container(0, 0).setDepth(100);
    this.comboText = this.add.text(GAME_WIDTH/2, 120, '', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS.COMBO
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
  },

  updateHUD() {
    this.scoreText.setText(String(this.score));
    this.stageText.setText('STAGE ' + this.stage);
    for (let i = 0; i < MAX_STRIKES; i++) {
      this.strikeIcons[i].setTexture(i < this.strikes ? 'strike_lost' : 'strike_active');
    }
  },

  updatePriorityIndicator(priority) {
    this.priorityContainer.removeAll(true);
    if (priority.length <= 1 && priority[0] === 'gray') return;
    const totalW = priority.length * 24 + (priority.length - 1) * 12;
    let x = GAME_WIDTH/2 - totalW/2 + 8;
    for (let i = 0; i < priority.length; i++) {
      const hex = Phaser.Display.Color.HexStringToColor(BUBBLE_HEX_MAP[priority[i]]).color;
      const dot = this.add.circle(x, PRIORITY_INDICATOR_Y, 8, hex);
      this.priorityContainer.add(dot);
      if (i < priority.length - 1) {
        const gt = this.add.text(x + 18, PRIORITY_INDICATOR_Y, '>', {
          fontSize: '14px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
          color: COLORS.COMBO
        }).setOrigin(0.5);
        this.priorityContainer.add(gt);
      }
      x += 36;
    }
  }
};

// Mixin helper — copies methods onto GameScene prototype
function applyEffectsMixin(sceneClass) {
  for (const [name, fn] of Object.entries(SoundEffects)) {
    sceneClass.prototype[name] = fn;
  }
  for (const [name, fn] of Object.entries(VisualEffects)) {
    sceneClass.prototype[name] = fn;
  }
  for (const [name, fn] of Object.entries(HUDMethods)) {
    sceneClass.prototype[name] = fn;
  }
}
