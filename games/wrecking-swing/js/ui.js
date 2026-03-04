// Wrecking Swing - UI Scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);

    // Title
    this.add.text(cx, 160, 'WRECKING', {
      fontSize: '48px', fontFamily: 'Arial Black, sans-serif',
      fill: CONFIG.HEX.UI_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(cx, 220, 'SWING', {
      fontSize: '52px', fontFamily: 'Arial Black, sans-serif',
      fill: CONFIG.HEX.HIGHLIGHT, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Decorative ball
    const g = this.add.graphics();
    g.fillStyle(CONFIG.COLORS.BALL, 1);
    g.fillCircle(cx, 310, 30);
    g.fillStyle(0xFFFFFF, 0.3);
    g.fillCircle(cx - 8, 300, 8);

    // Play button
    const playBtn = this.add.rectangle(cx, 400, 220, 60, CONFIG.COLORS.HIGHLIGHT).setInteractive();
    this.add.text(cx, 400, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif',
      fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: playBtn, scaleX: 0.92, scaleY: 0.92, duration: 60, yoyo: true,
        onComplete: () => {
          SoundManager.play('uiTap');
          window.WS.score = 0;
          window.WS.stage = 1;
          window.WS.swingsLeft = CONFIG.SWING_COUNT;
          this.scene.start('GameScene');
        }
      });
    });

    // High score
    const hs = window.WS.highScore || 0;
    this.add.text(cx, 450, `BEST: ${hs.toLocaleString()}`, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: CONFIG.HEX.REWARD
    }).setOrigin(0.5);

    // Sound toggle
    const soundIcon = this.add.text(20, 20, window.WS.settings.sound ? '🔊' : '🔇', {
      fontSize: '28px'
    }).setInteractive();
    soundIcon.on('pointerdown', () => {
      window.WS.settings.sound = !window.WS.settings.sound;
      soundIcon.setText(window.WS.settings.sound ? '🔊' : '🔇');
      SoundManager.play('uiTap');
      saveSettings();
    });

    window.adManager.showBanner();
  }
}

class StageEndScene extends Phaser.Scene {
  constructor() { super('StageEndScene'); }

  create(data) {
    const cx = CONFIG.GAME_WIDTH / 2;
    const { stageScore, stage, swingsUsed, isPerfect, is2Swing } = data;

    // Semi-transparent bg
    this.add.rectangle(cx, CONFIG.GAME_HEIGHT / 2, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0x000000, 0.75);

    // Stage cleared text
    const clearText = isPerfect ? 'PERFECT!' : 'CLEARED!';
    const clearSize = isPerfect ? '48px' : '36px';
    const clearColor = isPerfect ? CONFIG.HEX.REWARD : CONFIG.HEX.UI_TEXT;
    const ct = this.add.text(cx, 200, `STAGE ${stage}`, {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fill: CONFIG.HEX.UI_TEXT
    }).setOrigin(0.5);
    const cl = this.add.text(cx, 250, clearText, {
      fontSize: clearSize, fontFamily: 'Arial Black, sans-serif',
      fill: clearColor, fontStyle: 'bold'
    }).setOrigin(0.5).setScale(0.3);

    this.tweens.add({ targets: cl, scaleX: 1.2, scaleY: 1.2, duration: 200, ease: 'Back.easeOut',
      onComplete: () => this.tweens.add({ targets: cl, scaleX: 1, scaleY: 1, duration: 150 })
    });

    // Swing efficiency
    this.add.text(cx, 310, `${swingsUsed}/${CONFIG.SWING_COUNT} SWINGS USED`, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: CONFIG.HEX.UI_TEXT
    }).setOrigin(0.5);

    // Score count-up
    const scoreText = this.add.text(cx, 370, '0', {
      fontSize: '40px', fontFamily: 'Arial Black, sans-serif',
      fill: CONFIG.HEX.REWARD, fontStyle: 'bold'
    }).setOrigin(0.5);

    let displayed = 0;
    this.tweens.addCounter({
      from: 0, to: stageScore, duration: 600, ease: 'Expo.easeOut',
      onUpdate: (t) => {
        displayed = Math.floor(t.getValue());
        scoreText.setText(displayed.toLocaleString());
      }
    });

    if (isPerfect) {
      this.spawnClearParticles(cx);
    }

    // Auto-advance or tap
    const timer = this.time.delayedCall(1500, () => this.advance(data));
    this.input.on('pointerdown', () => {
      timer.remove();
      this.advance(data);
    });

    SoundManager.play(isPerfect ? 'perfectClear' : 'stageClear');
    window.adManager.onStageComplete();
  }

  advance(data) {
    window.WS.stage++;
    window.WS.swingsLeft = CONFIG.SWING_COUNT;
    this.scene.start('GameScene');
  }

  spawnClearParticles(cx) {
    for (let i = 0; i < 30; i++) {
      const p = this.add.circle(cx, 300, Phaser.Math.Between(3, 6), CONFIG.COLORS.REWARD);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(150, 350);
      this.tweens.add({
        targets: p, x: cx + Math.cos(angle) * speed, y: 300 + Math.sin(angle) * speed,
        alpha: 0, duration: 800, ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.UI_BG);

    this.add.text(cx, 120, 'GAME OVER', {
      fontSize: '42px', fontFamily: 'Arial Black, sans-serif',
      fill: CONFIG.HEX.UI_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score count-up
    const finalScore = window.WS.score;
    const scoreText = this.add.text(cx, 220, '0', {
      fontSize: '48px', fontFamily: 'Arial Black, sans-serif',
      fill: CONFIG.HEX.REWARD, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: finalScore, duration: 800, ease: 'Expo.easeOut',
      onUpdate: (t) => scoreText.setText(Math.floor(t.getValue()).toLocaleString())
    });

    // High score check
    const isNew = finalScore > (window.WS.highScore || 0);
    if (isNew) {
      window.WS.highScore = finalScore;
      localStorage.setItem('wrecking-swing_high_score', finalScore);
    }
    const hsLabel = isNew ? 'NEW BEST!' : `BEST: ${(window.WS.highScore || 0).toLocaleString()}`;
    const hsColor = isNew ? CONFIG.HEX.REWARD : CONFIG.HEX.UI_TEXT;
    this.add.text(cx, 280, hsLabel, {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fill: hsColor
    }).setOrigin(0.5);

    this.add.text(cx, 330, `Highest Stage: ${window.WS.stage}`, {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', fill: CONFIG.HEX.UI_TEXT
    }).setOrigin(0.5);

    // Play Again
    const playBtn = this.add.rectangle(cx, 430, 220, 56, CONFIG.COLORS.HIGHLIGHT).setInteractive();
    this.add.text(cx, 430, 'PLAY AGAIN', {
      fontSize: '24px', fontFamily: 'Arial Black, sans-serif',
      fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      SoundManager.play('uiTap');
      window.WS.score = 0; window.WS.stage = 1;
      window.WS.swingsLeft = CONFIG.SWING_COUNT;
      this.scene.start('GameScene');
    });

    // Menu
    const menuBtn = this.add.rectangle(cx, 510, 220, 50, 0x333344).setInteractive();
    this.add.text(cx, 510, 'MENU', {
      fontSize: '20px', fontFamily: 'Arial, sans-serif', fill: CONFIG.HEX.UI_TEXT
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      SoundManager.play('uiTap');
      this.scene.start('MenuScene');
    });

    // Update stats
    const played = parseInt(localStorage.getItem('wrecking-swing_games_played') || '0') + 1;
    localStorage.setItem('wrecking-swing_games_played', played);
    const hs = parseInt(localStorage.getItem('wrecking-swing_highest_stage') || '0');
    if (window.WS.stage > hs) {
      localStorage.setItem('wrecking-swing_highest_stage', window.WS.stage);
    }
  }
}

function saveSettings() {
  localStorage.setItem('wrecking-swing_settings', JSON.stringify(window.WS.settings));
}
