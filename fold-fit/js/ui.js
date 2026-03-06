// Fold Fit - UI Scenes (Menu, GameOver, Pause)

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, width, height, COLORS_INT.menuBg);

    // Title
    this.add.text(width/2, height * 0.22, 'FOLD FIT', {
      fontSize: '52px', fontFamily: 'Georgia, serif', color: COLORS.white,
      fontStyle: 'bold', letterSpacing: 8
    }).setOrigin(0.5);

    this.add.text(width/2, height * 0.29, 'origami meets puzzle', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: COLORS.uiSecondary
    }).setOrigin(0.5);

    // Crane decoration
    this.add.image(width/2, height * 0.38, 'crane').setScale(1.2);

    // Play button
    const playBtn = this.add.rectangle(width/2, height * 0.54, 200, 56, COLORS_INT.target, 1).setInteractive({ useHandCursor: true });
    this.add.text(width/2, height * 0.54, 'PLAY', {
      fontSize: '26px', fontFamily: 'Georgia, serif', color: COLORS.white, fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      SoundFX.play(this, 'uiTap');
      this.scene.start('GameScene');
    });

    // High score
    const hs = GameState.highScore;
    this.add.text(width/2, height * 0.63, hs > 0 ? `BEST: ${hs}` : '', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: COLORS.uiSecondary
    }).setOrigin(0.5);

    // Help button
    const helpBtn = this.add.circle(width - 36, 36, 20, 0x000000, 0).setStrokeStyle(2, COLORS_INT.uiSecondary).setInteractive({ useHandCursor: true });
    this.add.text(width - 36, 36, '?', { fontSize: '22px', color: COLORS.uiSecondary, fontFamily: 'Georgia, serif' }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    const sndTxt = this.add.text(36, 36, GameState.settings.sound ? '♪' : '♪̸', {
      fontSize: '24px', color: COLORS.uiSecondary
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    sndTxt.on('pointerdown', () => {
      GameState.settings.sound = !GameState.settings.sound;
      sndTxt.setText(GameState.settings.sound ? '♪' : '♪̸');
      saveSettings();
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) { this.reason = data.reason || 'torn'; this.finalScore = data.score || 0; this.stageReached = data.stage || 1; }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, width, height, COLORS_INT.menuBg, 0.92);

    const title = this.reason === 'timer' ? "TIME'S UP!" : this.reason === 'idle' ? 'TOO SLOW!' : 'PAPER TORN!';
    this.add.text(width/2, height * 0.18, title, {
      fontSize: '30px', fontFamily: 'Georgia, serif', color: COLORS.danger, fontStyle: 'bold'
    }).setOrigin(0.5);

    // Animated score count-up
    const scoreTxt = this.add.text(width/2, height * 0.32, '0', {
      fontSize: '48px', fontFamily: 'Georgia, serif', color: COLORS.success, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.tweens.addCounter({ from: 0, to: this.finalScore, duration: 800, ease: 'Power2',
      onUpdate: t => scoreTxt.setText(Math.floor(t.getValue()))
    });

    // New best indicator
    const isNewBest = this.finalScore > GameState.highScore;
    if (isNewBest) {
      GameState.highScore = this.finalScore;
      localStorage.setItem('fold_fit_high_score', this.finalScore);
      this.add.text(width/2, height * 0.4, 'NEW BEST!', {
        fontSize: '22px', color: COLORS.success, fontFamily: 'Georgia, serif'
      }).setOrigin(0.5);
    }

    this.add.text(width/2, height * 0.46, `Stage ${this.stageReached}`, {
      fontSize: '18px', color: COLORS.uiSecondary, fontFamily: 'Georgia, serif'
    }).setOrigin(0.5);

    // Continue button (rewarded ad)
    if (AdManager.canContinue()) {
      const contBtn = this.add.rectangle(width/2, height * 0.56, 220, 48, COLORS_INT.target).setInteractive({ useHandCursor: true });
      this.add.text(width/2, height * 0.56, 'Continue (Ad)', {
        fontSize: '18px', color: COLORS.white, fontFamily: 'Georgia, serif'
      }).setOrigin(0.5);
      contBtn.on('pointerdown', () => {
        AdManager.markContinueUsed();
        AdManager.showRewarded((granted) => {
          if (granted) {
            GameState.wrongFolds = Math.max(0, GameState.wrongFolds - 1);
            this.scene.stop();
            this.scene.start('GameScene', { continuing: true });
          }
        });
      });
    }

    // Play Again
    const playBtn = this.add.rectangle(width/2, height * 0.67, 200, 48, COLORS_INT.success).setInteractive({ useHandCursor: true });
    this.add.text(width/2, height * 0.67, 'PLAY AGAIN', {
      fontSize: '20px', color: COLORS.uiText, fontFamily: 'Georgia, serif', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      SoundFX.play(this, 'uiTap');
      GameState.reset();
      AdManager.reset();
      this.scene.start('GameScene');
    });

    // Menu button
    const menuBtn = this.add.rectangle(width/2, height * 0.77, 140, 40, COLORS_INT.uiSecondary).setInteractive({ useHandCursor: true });
    this.add.text(width/2, height * 0.77, 'MENU', {
      fontSize: '17px', color: COLORS.white, fontFamily: 'Georgia, serif'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      GameState.reset();
      AdManager.reset();
      this.scene.start('MenuScene');
    });
  }
}

// Simple sound effects via Web Audio API
const SoundFX = {
  ctx: null,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  play(scene, type) {
    if (!GameState.settings.sound) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime;
      if (type === 'fold') { osc.frequency.value = 800; gain.gain.setValueAtTime(0.15,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.15); osc.start(t); osc.stop(t+0.15); }
      else if (type === 'wrong') { osc.type='sawtooth'; osc.frequency.value=200; gain.gain.setValueAtTime(0.12,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.3); osc.start(t); osc.stop(t+0.3); }
      else if (type === 'tear') { osc.type='sawtooth'; osc.frequency.setValueAtTime(600,t); osc.frequency.linearRampToValueAtTime(100,t+0.5); gain.gain.setValueAtTime(0.15,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.5); osc.start(t); osc.stop(t+0.5); }
      else if (type === 'clear') { osc.frequency.setValueAtTime(523,t); osc.frequency.setValueAtTime(784,t+0.15); gain.gain.setValueAtTime(0.12,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.4); osc.start(t); osc.stop(t+0.4); }
      else if (type === 'perfect') { osc.frequency.setValueAtTime(523,t); osc.frequency.setValueAtTime(659,t+0.15); osc.frequency.setValueAtTime(784,t+0.3); gain.gain.setValueAtTime(0.12,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.6); osc.start(t); osc.stop(t+0.6); }
      else if (type === 'tick') { osc.frequency.value=1000; gain.gain.setValueAtTime(0.05,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.03); osc.start(t); osc.stop(t+0.03); }
      else if (type === 'timerExpire') { osc.frequency.setValueAtTime(400,t); osc.frequency.linearRampToValueAtTime(200,t+0.4); gain.gain.setValueAtTime(0.12,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.4); osc.start(t); osc.stop(t+0.4); }
      else { osc.frequency.value=600; gain.gain.setValueAtTime(0.06,t); gain.gain.exponentialRampToValueAtTime(0.001,t+0.05); osc.start(t); osc.stop(t+0.05); }
    } catch(e) {}
  }
};

function saveSettings() {
  localStorage.setItem('fold_fit_settings', JSON.stringify(GameState.settings));
}
