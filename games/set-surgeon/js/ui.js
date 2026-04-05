// Set Surgeon - UI Scenes (Menu, GameOver, Pause)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG);
    const cx = CONFIG.GAME_WIDTH / 2;

    // Title
    this.add.text(cx, 140, 'SET', {
      fontSize: '52px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG,
      fontStyle: 'bold', letterSpacing: 12
    }).setOrigin(0.5);
    this.add.text(cx, 195, 'SURGEON', {
      fontSize: '36px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG,
      fontStyle: 'bold', letterSpacing: 8
    }).setOrigin(0.5);
    this.add.text(cx, 235, 'Classify the unknown', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0.5);

    // Decorative mini Venn
    const gfx = this.add.graphics();
    gfx.fillStyle(0xFF6B6B, 0.15); gfx.fillCircle(cx - 30, 310, 40);
    gfx.fillStyle(0x4ECDC4, 0.15); gfx.fillCircle(cx + 30, 310, 40);
    gfx.fillStyle(0xFFE66D, 0.15); gfx.fillCircle(cx, 350, 40);
    gfx.lineStyle(2, 0xFF6B6B); gfx.strokeCircle(cx - 30, 310, 40);
    gfx.lineStyle(2, 0x4ECDC4); gfx.strokeCircle(cx + 30, 310, 40);
    gfx.lineStyle(2, 0xFFE66D); gfx.strokeCircle(cx, 350, 40);

    // High score
    this.add.text(cx, 410, 'BEST: ' + GameState.highScore, {
      fontSize: '14px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(cx, 470, 280, 56, 0x00B894, 1).setInteractive({ useHandCursor: true });
    playBtn.setStrokeStyle(0);
    const playTxt = this.add.text(cx, 470, 'PLAY', {
      fontSize: '22px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    playTxt.disableInteractive();
    playBtn.on('pointerdown', () => {
      this.playClick();
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });
    playBtn.on('pointerover', () => playBtn.setFillStyle(0x00A884));
    playBtn.on('pointerout', () => playBtn.setFillStyle(0x00B894));

    // Help button
    const helpBtn = this.add.rectangle(cx, 540, 280, 44, 0x000000, 0).setInteractive({ useHandCursor: true });
    helpBtn.setStrokeStyle(2, 0x00B894);
    const helpTxt = this.add.text(cx, 540, 'HOW TO PLAY', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#00B894'
    }).setOrigin(0.5);
    helpTxt.disableInteractive();
    helpBtn.on('pointerdown', () => {
      this.playClick();
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    this.soundIcon = this.add.text(CONFIG.GAME_WIDTH - 30, 20,
      GameState.soundOn ? 'SND' : 'MUTE', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.soundIcon.on('pointerdown', () => {
      GameState.soundOn = !GameState.soundOn;
      this.soundIcon.setText(GameState.soundOn ? 'SND' : 'MUTE');
    });
  }

  playClick() {
    if (!GameState.soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    } catch(e){}
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#FFFFFF');
    const cx = CONFIG.GAME_WIDTH / 2;
    const isNewBest = GameState.score >= GameState.highScore && GameState.score > 0;

    // Game over sound
    if (GameState.soundOn) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [330, 220].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle'; osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.2);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.5);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.2); osc.stop(ctx.currentTime + i * 0.2 + 0.5);
        });
      } catch(e){}
    }

    this.add.text(cx, 100, 'GAME OVER', {
      fontSize: '32px', fontFamily: 'monospace', fill: CONFIG.COLORS.WRONG, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, 170, 'ROUND REACHED', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0.5);
    this.add.text(cx, 200, String(GameState.round), {
      fontSize: '42px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Animated score count-up
    this.add.text(cx, 270, 'SCORE', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0.5);
    const scoreTxt = this.add.text(cx, 305, '0', {
      fontSize: '36px', fontFamily: 'monospace', fill: CONFIG.COLORS.HUD_BG, fontStyle: 'bold'
    }).setOrigin(0.5);

    let displayScore = 0;
    const targetScore = GameState.score;
    const steps = 30;
    const inc = Math.max(1, Math.ceil(targetScore / steps));
    const countTimer = this.time.addEvent({
      delay: 25, repeat: steps - 1,
      callback: () => {
        displayScore = Math.min(targetScore, displayScore + inc);
        scoreTxt.setText(String(displayScore));
      }
    });

    if (isNewBest) {
      const badge = this.add.text(cx, 355, 'NEW BEST!', {
        fontSize: '18px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold',
        backgroundColor: CONFIG.COLORS.STREAK, padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: badge, scale: 1, angle: 360, duration: 500, ease: 'Back.easeOut' });
    }

    // Ad continue button (placeholder)
    let btnY = isNewBest ? 420 : 390;
    const adBtn = this.add.rectangle(cx, btnY, 280, 44, 0x000000, 0).setInteractive({ useHandCursor: true });
    adBtn.setStrokeStyle(2, 0xF39C12);
    const adTxt = this.add.text(cx, btnY, 'WATCH AD TO CONTINUE', {
      fontSize: '13px', fontFamily: 'monospace', fill: '#F39C12'
    }).setOrigin(0.5);
    adTxt.disableInteractive();
    adBtn.on('pointerdown', () => {
      AdsManager.showRewarded(() => {
        GameState.lives = CONFIG.LIVES;
        this.scene.stop('GameOverScene');
        this.scene.start('GameScene');
      }, () => {});
    });

    // Play again
    btnY += 60;
    const playBtn = this.add.rectangle(cx, btnY, 280, 56, 0x00B894).setInteractive({ useHandCursor: true });
    const playTxt = this.add.text(cx, btnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    playTxt.disableInteractive();
    playBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });

    // Menu button
    btnY += 60;
    const menuBtn = this.add.text(cx, btnY, 'MENU', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  init(data) { this.returnTo = data.returnTo || 'GameScene'; }

  create() {
    const cx = CONFIG.GAME_WIDTH / 2;
    const cy = CONFIG.GAME_HEIGHT / 2;

    this.add.rectangle(cx, cy, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0x2D3436, 0.85);

    this.add.text(cx, cy - 120, 'PAUSED', {
      fontSize: '32px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Resume
    const resumeBtn = this.add.rectangle(cx, cy - 40, 240, 50, 0x00B894).setInteractive({ useHandCursor: true });
    const resumeTxt = this.add.text(cx, cy - 40, 'RESUME', {
      fontSize: '18px', fontFamily: 'monospace', fill: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    resumeTxt.disableInteractive();
    resumeBtn.on('pointerdown', () => {
      this.scene.stop('PauseScene');
      const gs = this.scene.get('GameScene');
      if (gs) { gs.paused = false; this.scene.resume('GameScene'); }
    });

    // Restart
    const restartBtn = this.add.rectangle(cx, cy + 30, 240, 44, 0x000000, 0).setInteractive({ useHandCursor: true });
    restartBtn.setStrokeStyle(2, 0xFFFFFF);
    const restartTxt = this.add.text(cx, cy + 30, 'RESTART', {
      fontSize: '16px', fontFamily: 'monospace', fill: '#FFFFFF'
    }).setOrigin(0.5);
    restartTxt.disableInteractive();
    restartBtn.on('pointerdown', () => {
      this.scene.stop('PauseScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    // Help
    const helpBtn = this.add.text(cx, cy + 90, 'HOW TO PLAY', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#00B894'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => {
      this.scene.stop('PauseScene');
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    // Quit to menu
    const quitBtn = this.add.text(cx, cy + 130, 'QUIT TO MENU', {
      fontSize: '14px', fontFamily: 'monospace', fill: '#636E72'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerdown', () => {
      this.scene.stop('PauseScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }
}
