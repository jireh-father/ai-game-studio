// Escalator Chaos - HUD Scene (Score, Streak, Overflow, Stage Banner, Game Over)

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }

  create() {
    this.scoreText = this.add.text(GAME_WIDTH / 2, 16, '0', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#EAEAEA', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 0).setDepth(20);

    this.streakText = this.add.text(GAME_WIDTH - 16, 16, '', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#EAEAEA', stroke: '#000', strokeThickness: 2
    }).setOrigin(1, 0).setDepth(20);

    // Overflow bar
    const barX = 16, barY = 18, barW = 80, barH = 12;
    this.overflowBg = this.add.rectangle(barX, barY, barW, barH, COLORS.OVERFLOW_BG)
      .setOrigin(0, 0).setDepth(20);
    this.overflowFill = this.add.rectangle(barX, barY, 0, barH, COLORS.OVERFLOW_FILL)
      .setOrigin(0, 0).setDepth(21);
    for (let i = 1; i < 5; i++) {
      this.add.rectangle(barX + (barW / 5) * i, barY, 1, barH, 0x000000, 0.5)
        .setOrigin(0, 0).setDepth(22);
    }
    this.barX = barX; this.barW = barW; this.barH = barH;

    this.stageText = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 20, 'Stage 1', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888'
    }).setOrigin(1, 1).setDepth(20);

    const gs = this.scene.get('GameScene');
    gs.events.on('updateHUD', this.onUpdateHUD, this);
    gs.events.on('showStageBanner', this.onStageBanner, this);
    gs.events.on('showGameOver', this.onGameOver, this);
    gs.events.on('scorePopup', this.onScorePopup, this);
    gs.events.on('streakMilestone', this.onStreakMilestone, this);
    gs.events.on('wrongFlash', this.onWrongFlash, this);
    gs.events.on('correctFlash', this.onCorrectFlash, this);

    this.events.on('shutdown', () => {
      gs.events.off('updateHUD', this.onUpdateHUD, this);
      gs.events.off('showStageBanner', this.onStageBanner, this);
      gs.events.off('showGameOver', this.onGameOver, this);
      gs.events.off('scorePopup', this.onScorePopup, this);
      gs.events.off('streakMilestone', this.onStreakMilestone, this);
      gs.events.off('wrongFlash', this.onWrongFlash, this);
      gs.events.off('correctFlash', this.onCorrectFlash, this);
    });
  }

  onUpdateHUD(data) {
    this.scoreText.setText(data.score.toString());
    if (data.streak >= 2) {
      this.streakText.setText('\u00D7' + data.streak);
      let c = '#EAEAEA';
      if (data.streak >= 5) c = '#FF4444';
      else if (data.streak >= 3) c = '#FF8C00';
      else c = '#FFD700';
      this.streakText.setColor(c);
    } else {
      this.streakText.setText('');
    }
    const fillW = (data.overflow / TIMING.MAX_OVERFLOW) * this.barW;
    this.overflowFill.setSize(fillW, this.barH);
    if (data.overflow >= 4) {
      this.tweens.add({
        targets: this.overflowFill, x: this.barX - 3,
        duration: 50, yoyo: true, repeat: 2,
        onComplete: () => { this.overflowFill.x = this.barX; }
      });
    }
    this.stageText.setText('Stage ' + data.stage);
  }

  onStageBanner(stageNum) {
    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'STAGE ' + stageNum, {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#EAEAEA', stroke: '#533483', strokeThickness: 4
    }).setOrigin(0.5).setDepth(30).setScale(0.5);
    this.tweens.add({
      targets: banner, scaleX: 1.2, scaleY: 1.2, duration: 200, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: banner, scaleX: 1, scaleY: 1, duration: 200, delay: 400,
          onComplete: () => {
            this.tweens.add({ targets: banner, alpha: 0, duration: 200, onComplete: () => banner.destroy() });
          }
        });
      }
    });
    // Confetti
    const colors = [0x57CC99, 0xFFD700, 0xE94560, 0x90E0EF, 0xEAEAEA];
    for (let i = 0; i < 20; i++) {
      const p = this.add.rectangle(
        GAME_WIDTH / 2 + (Math.random() - 0.5) * 40, GAME_HEIGHT / 2,
        6, 6, colors[i % colors.length]
      ).setDepth(29);
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 120;
      this.tweens.add({
        targets: p, x: p.x + Math.cos(angle) * dist, y: p.y + Math.sin(angle) * dist,
        alpha: 0, rotation: Math.random() * 6, duration: 600 + Math.random() * 200,
        onComplete: () => p.destroy()
      });
    }
  }

  onScorePopup(data) {
    const txt = this.add.text(data.x, data.y, '+' + data.points, {
      fontSize: data.big ? '32px' : '22px', fontFamily: 'Arial', fontStyle: 'bold',
      color: data.color || '#FFD700', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(25);
    this.tweens.add({
      targets: txt, y: data.y - 50, alpha: 0, scaleX: 1.4, scaleY: 1.4,
      duration: 500, onComplete: () => txt.destroy()
    });
    this.tweens.add({ targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
  }

  onStreakMilestone(streak) {
    if (streak === 5 || streak === 10) {
      const label = streak === 5 ? 'COMBO!' : 'UNSTOPPABLE!';
      const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, label, {
        fontSize: streak === 5 ? '36px' : '32px', fontFamily: 'Arial', fontStyle: 'bold',
        color: streak === 5 ? '#FF4444' : '#FFD700', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setDepth(30).setScale(0.5);
      this.tweens.add({
        targets: txt, scaleX: 1.5, scaleY: 1.5, duration: 200, yoyo: true,
        hold: streak === 5 ? 300 : 500,
        onComplete: () => {
          this.tweens.add({ targets: txt, alpha: 0, duration: 200, onComplete: () => txt.destroy() });
        }
      });
    }
    this.tweens.add({ targets: this.streakText, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true });
  }

  onCorrectFlash() {
    const f = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0.3).setDepth(28);
    this.tweens.add({ targets: f, alpha: 0, duration: 80, onComplete: () => f.destroy() });
  }

  onWrongFlash() {
    const f = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFF0000, 0.25).setDepth(28);
    this.tweens.add({ targets: f, alpha: 0, duration: 120, onComplete: () => f.destroy() });
    for (let i = 0; i < 6; i++) {
      const p = this.add.rectangle(GAME_WIDTH - 16, 20, 5, 5, 0xFF6B6B).setDepth(29);
      const a = Math.random() * Math.PI * 2;
      this.tweens.add({
        targets: p, x: p.x + Math.cos(a) * 40, y: p.y + Math.sin(a) * 40,
        alpha: 0, duration: 200, onComplete: () => p.destroy()
      });
    }
  }

  onGameOver(data) {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0).setDepth(40);
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: TIMING.OVERLAY_FADE_MS });

    const goText = this.add.text(GAME_WIDTH / 2, 220, 'GAME OVER', {
      fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold',
      color: '#E94560', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(41).setScale(0);
    this.tweens.add({
      targets: goText, scaleX: 1.2, scaleY: 1.2, duration: 200, ease: 'Back.easeOut',
      onComplete: () => { this.tweens.add({ targets: goText, scaleX: 1, scaleY: 1, duration: 200 }); }
    });

    const scoreLabel = this.add.text(GAME_WIDTH / 2, 300, 'Score', {
      fontSize: '18px', fontFamily: 'Arial', color: '#888'
    }).setOrigin(0.5).setDepth(41).setAlpha(0);
    const scoreFinal = this.add.text(GAME_WIDTH / 2, 330, '0', {
      fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold', color: '#EAEAEA'
    }).setOrigin(0.5).setDepth(41).setAlpha(0);

    this.time.delayedCall(400, () => {
      scoreLabel.setAlpha(1); scoreFinal.setAlpha(1);
      const counter = { val: 0 };
      this.tweens.add({
        targets: counter, val: data.score, duration: 600,
        onUpdate: () => { scoreFinal.setText(Math.floor(counter.val).toString()); }
      });
    });

    const bestLabel = this.add.text(GAME_WIDTH / 2, 380, 'Best: ' + data.bestScore, {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFD700'
    }).setOrigin(0.5).setDepth(41).setAlpha(0);
    this.time.delayedCall(700, () => bestLabel.setAlpha(1));

    const btn = this.add.rectangle(GAME_WIDTH / 2, 460, 160, 50, 0xE94560)
      .setDepth(41).setAlpha(0).setInteractive();
    const btnText = this.add.text(GAME_WIDTH / 2, 460, 'RESTART', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#EAEAEA'
    }).setOrigin(0.5).setDepth(42).setAlpha(0);

    this.time.delayedCall(500, () => {
      btn.setAlpha(1); btnText.setAlpha(1);
      this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });
    });

    btn.on('pointerdown', () => {
      [overlay, goText, scoreLabel, scoreFinal, bestLabel, btn, btnText].forEach(o => o.destroy());
      this.scene.get('GameScene').events.emit('restartGame');
    });
  }
}
