// ui.js — Menu, GameOver, HUD, Pause overlay
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.cameras.main.setBackgroundColor(PALETTE.background);
    const cx = GAME_WIDTH / 2;

    this.add.text(cx, 100, 'NOODLE', {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold',
      color: PALETTE.primary
    }).setOrigin(0.5);
    this.add.text(cx, 155, 'LASSO', {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold',
      color: PALETTE.noodle
    }).setOrigin(0.5);
    const chef = this.add.image(cx, 280, 'chef').setScale(1.5);
    this.tweens.add({
      targets: chef, y: 270, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    const gfx = this.add.graphics();
    gfx.lineStyle(3, 0xF4A261);
    gfx.beginPath();
    for (let i = 0; i < GAME_WIDTH; i += 2) {
      const y = 220 + Math.sin(i * 0.03) * 12;
      if (i === 0) gfx.moveTo(i, y);
      else gfx.lineTo(i, y);
    }
    gfx.strokePath();
    this.tweens.add({
      targets: gfx, x: -20, duration: 2000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    const btnBg = this.add.rectangle(cx, 400, 200, 60, 0xE63946, 1).setInteractive();
    btnBg.setStrokeStyle(3, 0x1D1D1B);
    const btnText = this.add.text(cx, 400, 'PLAY', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    btnBg.on('pointerdown', () => {
      AudioManager.init();
      AudioManager.resume();
      AudioManager.play('click');
      this.tweens.add({
        targets: [btnBg, btnText], scaleX: 0.9, scaleY: 0.9,
        duration: 80, yoyo: true, onComplete: () => {
          this.scene.start('GameScene');
        }
      });
    });
    const hs = localStorage.getItem('noodle-lasso_high_score') || 0;
    this.add.text(cx, 460, 'BEST: ' + hs, {
      fontSize: '18px', fontFamily: 'Arial', color: PALETTE.textDark
    }).setOrigin(0.5);
    const settingsBtn = this.add.text(GAME_WIDTH - 36, 20, '\u2699', {
      fontSize: '28px', color: PALETTE.textDark
    }).setOrigin(0.5).setInteractive();
    settingsBtn.on('pointerdown', () => this.showSettings());
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      const shade = (x / 40) % 2 === 0 ? 0xFFF8F0 : 0xFDDBB4;
      this.add.rectangle(x + 20, GAME_HEIGHT - 30, 40, 60, shade);
    }
  }

  showSettings() {
    const overlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2,
      GAME_WIDTH, GAME_HEIGHT, 0x1D1D1B, 0.7).setInteractive().setDepth(100);
    const panel = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2,
      280, 250, 0xFDDBB4).setStrokeStyle(3, 0x1D1D1B).setDepth(101);

    const title = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 90, 'SETTINGS', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.textDark
    }).setOrigin(0.5).setDepth(102);

    const settings = JSON.parse(localStorage.getItem('noodle-lasso_settings') ||
      '{"sound":true,"music":true,"vibration":true}');

    const items = [
      { label: 'Sound FX', key: 'sound', y: -30 },
      { label: 'Music', key: 'music', y: 20 },
      { label: 'Vibration', key: 'vibration', y: 70 }
    ];
    const toggleTexts = [];
    items.forEach(item => {
      const cy = GAME_HEIGHT/2 + item.y;
      this.add.text(GAME_WIDTH/2 - 80, cy, item.label, {
        fontSize: '18px', fontFamily: 'Arial', color: PALETTE.textDark
      }).setOrigin(0, 0.5).setDepth(102);
      const val = settings[item.key];
      const tog = this.add.text(GAME_WIDTH/2 + 80, cy, val ? 'ON' : 'OFF', {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
        color: val ? PALETTE.reward : PALETTE.primary
      }).setOrigin(0.5).setInteractive().setDepth(102);
      tog.on('pointerdown', () => {
        settings[item.key] = !settings[item.key];
        tog.setText(settings[item.key] ? 'ON' : 'OFF');
        tog.setColor(settings[item.key] ? PALETTE.reward : PALETTE.primary);
        localStorage.setItem('noodle-lasso_settings', JSON.stringify(settings));
        AudioManager.enabled = settings.sound;
        AudioManager.musicEnabled = settings.music;
      });
      toggleTexts.push(tog);
    });

    const closeBtn = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 100, 'CLOSE', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.primary
    }).setOrigin(0.5).setInteractive().setDepth(102);
    closeBtn.on('pointerdown', () => {
      [overlay, panel, title, closeBtn, ...toggleTexts].forEach(o => o.destroy());
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  create(data) {
    this.cameras.main.setBackgroundColor(PALETTE.background);
    const cx = GAME_WIDTH / 2;
    const score = data.score || 0;
    const stage = data.stage || 1;
    const highScore = parseInt(localStorage.getItem('noodle-lasso_high_score') || '0');
    const isNewRecord = score > highScore;

    if (isNewRecord) localStorage.setItem('noodle-lasso_high_score', score.toString());
    const goText = this.add.text(cx, -50, 'GAME OVER', {
      fontSize: '40px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.primary
    }).setOrigin(0.5);
    this.tweens.add({
      targets: goText, y: 120, duration: 400, ease: 'Bounce.easeOut'
    });
    const scoreText = this.add.text(cx, 200, score.toString(), {
      fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.textDark
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({
      targets: scoreText, scale: 1, duration: 300, delay: 300, ease: 'Back.easeOut'
    });

    this.add.text(cx, 240, 'POINTS', {
      fontSize: '16px', fontFamily: 'Arial', color: PALETTE.textDark
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1],
      alpha: 1, duration: 300, delay: 400
    });
    if (isNewRecord) {
      const nr = this.add.text(cx, 275, 'NEW RECORD!', {
        fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.secondary
      }).setOrigin(0.5);
      this.tweens.add({
        targets: nr, scale: 1.2, duration: 400, yoyo: true, repeat: -1
      });
    }

    // Stage reached
    this.add.text(cx, 320, 'Made it to Stage ' + stage, {
      fontSize: '18px', fontFamily: 'Arial', color: PALETTE.textDark
    }).setOrigin(0.5);

    // Best score
    const best = isNewRecord ? score : highScore;
    this.add.text(cx, 350, 'BEST: ' + best, {
      fontSize: '16px', fontFamily: 'Arial', color: PALETTE.floor
    }).setOrigin(0.5);

    // Play Again button
    const playBg = this.add.rectangle(cx, 430, 220, 56, 0xE63946).setInteractive();
    playBg.setStrokeStyle(3, 0x1D1D1B);
    const playText = this.add.text(cx, 430, 'PLAY AGAIN', {
      fontSize: '26px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    playBg.on('pointerdown', () => {
      AudioManager.play('click');
      this.tweens.add({
        targets: [playBg, playText], scaleX: 0.9, scaleY: 0.9,
        duration: 60, yoyo: true, onComplete: () => {
          this.scene.start('GameScene');
        }
      });
    });

    // Menu button
    const menuBg = this.add.rectangle(cx, 500, 140, 40, 0x999999).setInteractive();
    menuBg.setStrokeStyle(2, 0x1D1D1B);
    this.add.text(cx, 500, 'MENU', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    menuBg.on('pointerdown', () => {
      AudioManager.play('click');
      this.scene.start('MenuScene');
    });

    // Update stats
    const played = parseInt(localStorage.getItem('noodle-lasso_games_played') || '0') + 1;
    localStorage.setItem('noodle-lasso_games_played', played.toString());
    const hs = parseInt(localStorage.getItem('noodle-lasso_highest_stage') || '0');
    if (stage > hs) localStorage.setItem('noodle-lasso_highest_stage', stage.toString());
  }
}

// HUD Manager — overlaid on GameScene
class HUDManager {
  constructor(scene) {
    this.scene = scene;
    this.depth = 1000;
    this.create();
  }
  create() {
    // Top bar bg
    this.topBar = this.scene.add.rectangle(GAME_WIDTH/2, 22, GAME_WIDTH, 44,
      0x1D1D1B, 0.15).setDepth(this.depth);

    // Score
    this.scoreText = this.scene.add.text(12, HUD_TOP, 'Score: 0', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.textDark
    }).setDepth(this.depth + 1);

    // Stage
    this.stageText = this.scene.add.text(GAME_WIDTH/2, HUD_TOP, 'Stage 1', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.textDark
    }).setOrigin(0.5, 0).setDepth(this.depth + 1);

    // Hearts
    this.hearts = [];
    for (let i = 0; i < MAX_MISSES; i++) {
      const h = this.scene.add.image(GAME_WIDTH - 30 - i * 28, HUD_TOP + 10, 'heartFull')
        .setDepth(this.depth + 1);
      this.hearts.push(h);
    }

    // Progress bar (bottom)
    this.progressBg = this.scene.add.rectangle(GAME_WIDTH/2, FLOOR_Y + 24,
      GAME_WIDTH - 40, 12, 0x1D1D1B, 0.2).setDepth(this.depth);
    this.progressFill = this.scene.add.rectangle(20, FLOOR_Y + 24,
      0, 12, Phaser.Display.Color.HexStringToColor(PALETTE.reward).color)
      .setOrigin(0, 0.5).setDepth(this.depth + 1);
    this.progressText = this.scene.add.text(GAME_WIDTH/2, FLOOR_Y + 24, '0/8', {
      fontSize: '10px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(this.depth + 2);
  }

  updateScore(val) {
    this.scoreText.setText('Score: ' + val);
    this.scene.tweens.add({
      targets: this.scoreText, scaleX: 1.3, scaleY: 1.3,
      duration: 80, yoyo: true
    });
  }

  updateStage(n) {
    this.stageText.setText('Stage ' + n);
  }

  updateMisses(count) {
    for (let i = 0; i < MAX_MISSES; i++) {
      if (i < MAX_MISSES - count) {
        this.hearts[i].setTexture('heartFull');
      } else {
        this.hearts[i].setTexture('heartEmpty');
        // Crack animation
        this.scene.tweens.add({
          targets: this.hearts[i], scaleX: 1.3, scaleY: 1.3,
          duration: 100, yoyo: true
        });
      }
    }
  }

  updateProgress(caught, total) {
    const pct = Math.min(caught / total, 1);
    const maxW = GAME_WIDTH - 40;
    this.scene.tweens.add({
      targets: this.progressFill, displayWidth: maxW * pct,
      duration: 200, ease: 'Quad.easeOut'
    });
    this.progressText.setText(caught + '/' + total);
  }

  showCombo(n) {
    if (n < 2) return;
    const size = n >= 4 ? 42 : n >= 3 ? 34 : 28;
    const txt = this.scene.add.text(GAME_WIDTH/2, 200, '\u00d7' + n + ' COMBO!', {
      fontSize: size + 'px', fontFamily: 'Arial', fontStyle: 'bold', color: PALETTE.secondary
    }).setOrigin(0.5).setDepth(this.depth + 5);
    this.scene.tweens.add({
      targets: txt, scale: 1.3, duration: 150, yoyo: true
    });
    this.scene.tweens.add({
      targets: txt, alpha: 0, y: 170, duration: 800, delay: 400,
      onComplete: () => txt.destroy()
    });
  }

  destroy() {
    [this.topBar, this.scoreText, this.stageText, this.progressBg,
     this.progressFill, this.progressText, ...this.hearts]
      .forEach(o => { if (o) o.destroy(); });
  }
}
