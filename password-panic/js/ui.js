// ui.js - MenuScene, GameOverScene, pause overlay

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.add.rectangle(w/2, h/2, w, h, 0xFAFAFA);
    // Lock icon jiggle
    const lock = this.add.image(w/2, h*0.22, 'lockIcon').setScale(1.2);
    this.tweens.add({ targets: lock, angle: [-5, 5], duration: 300, yoyo: true, repeat: -1 });
    // Title
    this.add.text(w/2, h*0.34, 'PASSWORD PANIC', {
      fontSize: '28px', fontFamily: 'Arial Black, sans-serif', fill: COLORS.PRIMARY, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(w/2, h*0.40, 'Can you log in?', {
      fontSize: '14px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
    }).setOrigin(0.5);
    // High score
    const hs = localStorage.getItem('password_panic_high_score') || 0;
    this.add.text(w/2, h*0.46, 'Best Score: ' + hs, {
      fontSize: '13px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
    }).setOrigin(0.5);
    // LOG IN button
    const btn = this.add.image(w/2, h*0.58, 'submitBtn').setScale(0.8).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(w/2, h*0.58, 'LOG IN', {
      fontSize: '20px', fontFamily: 'Arial Black, sans-serif', fill: '#FFFFFF'
    }).setOrigin(0.5);
    this.tweens.add({ targets: [btn, btnTxt], scaleX: 0.83, scaleY: 0.83, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    btn.on('pointerdown', () => {
      resetGameState();
      this.cameras.main.flash(200, 21, 101, 192);
      this.time.delayedCall(200, () => this.scene.start('GameScene'));
    });
    // Help button
    const helpBtn = this.add.text(32, 32, '?', {
      fontSize: '22px', fontFamily: 'Arial Black', fill: COLORS.PRIMARY,
      backgroundColor: '#E3F2FD', padding: { x: 10, y: 4 }
    }).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
    // Decorative footer
    this.add.text(w/2, h*0.88, 'Terms of Service | Privacy Policy', {
      fontSize: '10px', fontFamily: 'Arial', fill: '#BDBDBD'
    }).setOrigin(0.5);
    this.add.text(w/2, h*0.92, 'v1.0.0 - MegaCorp Industries', {
      fontSize: '9px', fontFamily: 'Arial', fill: '#BDBDBD'
    }).setOrigin(0.5);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalScore = data.score || 0; this.finalStage = data.stage || 1; this.rulesCleared = data.rulesCleared || 0; }
  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;
    this.add.rectangle(w/2, h/2, w, h, 0xFAFAFA);
    // Lock slam animation
    const lock = this.add.image(w/2, -80, 'lockIcon').setScale(2);
    this.tweens.add({ targets: lock, y: h*0.18, duration: 300, ease: 'Bounce.easeOut' });
    // ACCOUNT LOCKED typewriter
    const lockText = this.add.text(w/2, h*0.32, '', {
      fontSize: '24px', fontFamily: 'Arial Black', fill: COLORS.FAIL
    }).setOrigin(0.5);
    const fullText = 'ACCOUNT LOCKED';
    let idx = 0;
    this.time.addEvent({ delay: 50, repeat: fullText.length - 1, callback: () => {
      idx++; lockText.setText(fullText.substring(0, idx));
    }});
    this.add.text(w/2, h*0.38, 'Reason: Session Expired', {
      fontSize: '12px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
    }).setOrigin(0.5);
    // Score count-up
    const scoreTxt = this.add.text(w/2, h*0.48, '0', {
      fontSize: '32px', fontFamily: 'Arial Black', fill: COLORS.PRIMARY
    }).setOrigin(0.5);
    let displayed = 0;
    const step = Math.max(1, Math.floor(this.finalScore / 30));
    const countUp = this.time.addEvent({ delay: 30, repeat: 30, callback: () => {
      displayed = Math.min(displayed + step, this.finalScore);
      scoreTxt.setText(displayed.toLocaleString());
    }});
    // High score check
    const prev = parseInt(localStorage.getItem('password_panic_high_score') || '0');
    if (this.finalScore > prev) {
      localStorage.setItem('password_panic_high_score', this.finalScore);
      this.time.delayedCall(1000, () => {
        const nr = this.add.text(w/2, h*0.55, 'NEW RECORD!', {
          fontSize: '18px', fontFamily: 'Arial Black', fill: COLORS.TIMER_WARNING
        }).setOrigin(0.5);
        this.tweens.add({ targets: nr, scaleX: 1.3, scaleY: 1.3, duration: 200, yoyo: true, repeat: 2 });
      });
    }
    // Stats
    this.add.text(w/2, h*0.60, 'Stage ' + this.finalStage + '  |  ' + this.rulesCleared + ' rules cleared', {
      fontSize: '12px', fontFamily: 'Arial', fill: COLORS.UI_TEXT
    }).setOrigin(0.5);
    // Buttons
    const tryBtn = this.add.image(w/2, h*0.72, 'submitBtn').setScale(0.7).setInteractive({ useHandCursor: true });
    this.add.text(w/2, h*0.72, 'Create New Account', {
      fontSize: '14px', fontFamily: 'Arial Bold', fill: '#FFF'
    }).setOrigin(0.5);
    tryBtn.on('pointerdown', () => {
      resetGameState();
      this.scene.start('GameScene');
    });
    const menuBtn = this.add.text(w/2, h*0.82, 'Leave Website', {
      fontSize: '13px', fontFamily: 'Arial', fill: COLORS.UI_TEXT, textDecoration: 'underline'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      resetGameState();
      this.scene.start('MenuScene');
    });
    // Update stats
    const gp = parseInt(localStorage.getItem('password_panic_games_played') || '0') + 1;
    localStorage.setItem('password_panic_games_played', gp);
    const hs = parseInt(localStorage.getItem('password_panic_highest_stage') || '0');
    if (this.finalStage > hs) localStorage.setItem('password_panic_highest_stage', this.finalStage);
    AdManager.onGameOver();
  }
}

function resetGameState() {
  GameState.score = 0; GameState.stage = 1; GameState.streak = 0;
  GameState.rules = []; GameState.password = []; GameState.tiles = [];
  GameState.wrongThisStage = 0; GameState.reviveUsed = false;
  GameState.lastTapTime = 0; GameState.paused = false;
  AdManager.reset();
}
