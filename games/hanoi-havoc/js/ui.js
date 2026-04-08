class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    AudioFX.init();
    const W = 360, H = 720;
    this.add.rectangle(W/2, H/2, W, H, 0x1A0F00);
    // Decorative pegs
    const g = this.add.graphics();
    [70, 180, 290].forEach(x => {
      g.fillStyle(0xC8A96E, 1);
      g.fillRect(x - 2, 550, 4, 50);
      g.fillStyle(0x5C2E0A, 1);
      g.fillRect(x - 20, 600, 40, 10);
    });
    // Stack some discs on first peg
    [{ w: 50 }, { w: 40 }, { w: 30 }].forEach((d, i) => {
      g.fillStyle(0xC8A96E, 1);
      g.fillRoundedRect(70 - d.w/2, 580 - i * 12, d.w, 10, 4);
    });

    this.add.text(W/2, 160, 'HANOI', {
      fontSize: '56px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#5C2E0A', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(W/2, 220, 'HAVOC', {
      fontSize: '56px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#5C2E0A', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(W/2, 280, 'Catch the discs. Mind the rule.', {
      fontSize: '14px', color: '#F5E6C8', fontFamily: 'monospace', fontStyle: 'italic'
    }).setOrigin(0.5);

    // High score
    const hs = parseInt(localStorage.getItem('hanoi-havoc_high_score') || '0');
    const hst = parseInt(localStorage.getItem('hanoi-havoc_highest_stage') || '0');
    this.add.text(W/2, 440, 'BEST: ' + hs + '  STAGE: ' + hst, {
      fontSize: '14px', color: '#F5E6C8', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.rectangle(W/2, 350, 180, 60, 0xC8A96E).setStrokeStyle(3, 0xFFD700).setInteractive({ useHandCursor: true });
    this.add.text(W/2, 350, 'PLAY', {
      fontSize: '28px', color: '#5C2E0A', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      AudioFX.click();
      this.scene.start('GameScene');
    });

    // Help button
    const helpBtn = this.add.circle(320, 40, 22, 0x2C1A0A).setStrokeStyle(2, 0xFFD700).setInteractive({ useHandCursor: true });
    this.add.text(320, 40, '?', {
      fontSize: '24px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      AudioFX.click();
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) {
    this.finalScore = (data && data.score) || 0;
    this.finalStage = (data && data.stage) || 1;
    this.reason = (data && data.reason) || 'THE PRIEST SAW EVERYTHING';
    this.adUsed = (data && data.adUsed) || false;
  }
  create() {
    const W = 360, H = 720;
    this.add.rectangle(W/2, H/2, W, H, 0x1A0F00).setAlpha(0.95);

    this.add.text(W/2, 150, this.reason, {
      fontSize: '18px', color: '#FF2222', fontFamily: 'monospace', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 320 }
    }).setOrigin(0.5);

    this.add.text(W/2, 220, 'GAME OVER', {
      fontSize: '36px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5);

    const hs = parseInt(localStorage.getItem('hanoi-havoc_high_score') || '0');
    const newRecord = this.finalScore > hs;
    if (newRecord) {
      localStorage.setItem('hanoi-havoc_high_score', this.finalScore);
      this.add.text(W/2, 280, 'NEW BEST!', {
        fontSize: '22px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
      }).setOrigin(0.5);
    }
    const hst = parseInt(localStorage.getItem('hanoi-havoc_highest_stage') || '0');
    if (this.finalStage > hst) localStorage.setItem('hanoi-havoc_highest_stage', this.finalStage);

    this.add.text(W/2, 320, 'SCORE: ' + this.finalScore, {
      fontSize: '28px', color: '#F5E6C8', fontFamily: 'monospace'
    }).setOrigin(0.5);
    this.add.text(W/2, 360, 'STAGE: ' + this.finalStage, {
      fontSize: '20px', color: '#F5E6C8', fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Play again
    const btn1 = this.add.rectangle(W/2, 450, 200, 55, 0xC8A96E).setStrokeStyle(3, 0xFFD700).setInteractive({ useHandCursor: true });
    this.add.text(W/2, 450, 'PLAY AGAIN', {
      fontSize: '22px', color: '#5C2E0A', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5);
    btn1.on('pointerdown', () => {
      AudioFX.click();
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });

    // Menu
    const btn2 = this.add.rectangle(W/2, 530, 200, 55, 0x2C1A0A).setStrokeStyle(2, 0xC8A96E).setInteractive({ useHandCursor: true });
    this.add.text(W/2, 530, 'MENU', {
      fontSize: '22px', color: '#F5E6C8', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5);
    btn2.on('pointerdown', () => {
      AudioFX.click();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    Ads.checkInterstitialTrigger();
  }
}
