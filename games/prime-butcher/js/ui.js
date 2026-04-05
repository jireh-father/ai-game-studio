// Prime Butcher — ui.js

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    this.add.text(GAME_WIDTH / 2, 140, 'PRIME\nBUTCHER', {
      fontSize: '42px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF',
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 210, 'Slice composites. Leave primes.', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888888'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(GAME_WIDTH / 2, 320, 200, 60, 0xFF6B35, 1).setInteractive();
    this.add.text(GAME_WIDTH / 2, 320, 'PLAY', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      window.GameState.score = 0;
      window.GameState.stage = 1;
      window.GameState.newRecord = false;
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });

    // High score
    this.add.text(GAME_WIDTH / 2, 420, 'BEST: ' + window.GameState.highScore, {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Help button
    const helpBtn = this.add.circle(320, 580, 20, 0x333355).setInteractive();
    this.add.text(320, 580, '?', {
      fontSize: '22px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      this.scene.pause('MenuScene');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // Sound toggle
    const soundState = window.GameState.settings.soundOff ? 'OFF' : 'ON';
    const soundTxt = this.add.text(40, 580, 'SND: ' + soundState, {
      fontSize: '14px', fontFamily: 'Arial', color: '#AAAAAA'
    }).setOrigin(0.5).setInteractive();
    soundTxt.on('pointerdown', () => {
      window.GameState.settings.soundOff = !window.GameState.settings.soundOff;
      soundTxt.setText('SND: ' + (window.GameState.settings.soundOff ? 'OFF' : 'ON'));
      localStorage.setItem('prime-butcher_settings', JSON.stringify(window.GameState.settings));
    });
  }
}

class HUDScene extends Phaser.Scene {
  constructor() { super('HUDScene'); }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, PLAY_AREA_BOTTOM + HUD_HEIGHT / 2, GAME_WIDTH, HUD_HEIGHT, COLORS.hudBg).setDepth(0);

    this.scoreTxt = this.add.text(15, PLAY_AREA_BOTTOM + 18, '' + window.GameState.score, {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.hudText
    }).setDepth(1);

    this.stageTxt = this.add.text(GAME_WIDTH / 2, PLAY_AREA_BOTTOM + 12, 'Stage ' + window.GameState.stage, {
      fontSize: '16px', fontFamily: 'Arial', color: COLORS.hudText
    }).setOrigin(0.5, 0).setDepth(1);

    this.timerTxt = this.add.text(260, PLAY_AREA_BOTTOM + 18, '30s', {
      fontSize: '18px', fontFamily: 'Arial', color: COLORS.hudText
    }).setDepth(1);

    this.comboTxt = this.add.text(GAME_WIDTH / 2, 100, '', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: COLORS.comboText
    }).setOrigin(0.5).setDepth(9).setAlpha(0);

    // Help button in HUD
    const helpBtn = this.add.circle(340, PLAY_AREA_BOTTOM + 30, 16, 0x333355).setInteractive().setDepth(2);
    this.add.text(340, PLAY_AREA_BOTTOM + 30, '?', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5).setDepth(3);

    // Pause button
    const pauseBtn = this.add.text(GAME_WIDTH / 2, PLAY_AREA_BOTTOM + 44, '||', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888888'
    }).setOrigin(0.5).setInteractive().setDepth(2);

    const gs = this.scene.get('GameScene');

    helpBtn.on('pointerdown', () => {
      if (gs) gs.togglePause();
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });

    pauseBtn.on('pointerdown', () => {
      if (gs) gs.togglePause();
    });

    // Listen for events from GameScene
    if (gs) {
      gs.events.on('scoreUpdate', (s) => {
        this.scoreTxt.setText('' + s);
        this.tweens.add({ targets: this.scoreTxt, scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
        if (window.GameState.newRecord) this.scoreTxt.setColor('#F9C74F');
      });
      gs.events.on('stageUpdate', (st) => { this.stageTxt.setText('Stage ' + st); });
      gs.events.on('timerUpdate', (t) => {
        this.timerTxt.setText(t + 's');
        if (t <= 5) this.timerTxt.setColor('#FF2D6B');
        else this.timerTxt.setColor(COLORS.hudText);
      });
      gs.events.on('comboUpdate', (c) => {
        this.comboTxt.setText('x' + c + ' COMBO!');
        this.comboTxt.setAlpha(1);
        this.tweens.add({
          targets: this.comboTxt, alpha: 0, y: 80, duration: 600,
          onComplete: () => { this.comboTxt.y = 100; }
        });
      });
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    this.add.text(GAME_WIDTH / 2, 180, 'GAME OVER', {
      fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold', color: '#E84393'
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 260, '' + window.GameState.score, {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    if (window.GameState.newRecord) {
      const nr = this.add.text(GAME_WIDTH / 2, 300, 'NEW BEST!', {
        fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#F9C74F'
      }).setOrigin(0.5);
      this.tweens.add({ targets: nr, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
    }

    this.add.text(GAME_WIDTH / 2, 340, 'Reached Stage ' + window.GameState.stage, {
      fontSize: '16px', fontFamily: 'Arial', color: '#888888'
    }).setOrigin(0.5);

    // Continue (ad)
    const contBtn = this.add.rectangle(GAME_WIDTH / 2, 400, 200, 55, 0x6C5CE7).setInteractive();
    this.add.text(GAME_WIDTH / 2, 400, 'Continue (Ad)', {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    contBtn.on('pointerdown', () => {
      AdsManager.showRewarded('continue', () => {
        this.scene.stop('GameOverScene');
        this.scene.start('GameScene');
      }, () => {});
    });

    // Play Again
    const playBtn = this.add.rectangle(GAME_WIDTH / 2, 465, 200, 55, 0xFF6B35).setInteractive();
    this.add.text(GAME_WIDTH / 2, 465, 'Play Again', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      window.GameState.score = 0;
      window.GameState.stage = 1;
      window.GameState.newRecord = false;
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });

    // Menu
    const menuBtn = this.add.rectangle(GAME_WIDTH / 2, 530, 120, 40, 0x333355).setInteractive();
    this.add.text(GAME_WIDTH / 2, 530, 'Menu', {
      fontSize: '16px', fontFamily: 'Arial', color: '#FFFFFF'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });

    // Save high score
    localStorage.setItem('prime-butcher_high_score', '' + window.GameState.highScore);
    AdsManager.recordGameOver();
    window.GameState.gamesPlayed++;
  }
}

class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    this.add.text(GAME_WIDTH / 2, 220, 'PAUSED', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);

    const makeBtn = (y, label, color, cb) => {
      const btn = this.add.rectangle(GAME_WIDTH / 2, y, 180, 50, color).setInteractive();
      this.add.text(GAME_WIDTH / 2, y, label, {
        fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFFFFF'
      }).setOrigin(0.5);
      btn.on('pointerdown', cb);
    };

    makeBtn(300, 'RESUME', 0xFF6B35, () => {
      const gs = this.scene.get('GameScene');
      if (gs) gs.togglePause();
    });

    makeBtn(365, 'RESTART', 0x555577, () => {
      window.GameState.score = 0;
      window.GameState.stage = 1;
      this.scene.stop('PauseScene');
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    makeBtn(430, 'HOW TO PLAY', 0x333355, () => {
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
      this.scene.stop('PauseScene');
    });

    makeBtn(495, 'MENU', 0x333355, () => {
      this.scene.stop('PauseScene');
      this.scene.stop('HUDScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }
}
