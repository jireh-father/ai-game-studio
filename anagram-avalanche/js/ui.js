class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
    this.add.rectangle(W/2, H/2, W, H, COLORS.bg);
    this.add.rectangle(W/2, H/2, W, H, COLORS.bgDark, 0.3);

    this.add.text(W/2, 140, 'ANAGRAM', {
      fontFamily: 'Arial Black', fontSize: '44px', color: '#F3F4F6',
      stroke: '#06B6D4', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(W/2, 190, 'AVALANCHE', {
      fontFamily: 'Arial Black', fontSize: '36px', color: '#06B6D4',
    }).setOrigin(0.5);
    this.add.text(W/2, 240, 'Tap letters. Destroy boulders.', {
      fontFamily: 'Arial', fontSize: '15px', color: '#9CA3AF',
    }).setOrigin(0.5);

    // Decoration boulder
    const deco = this.add.image(W/2, 320, 'boulder').setScale(1.2);
    this.tweens.add({ targets: deco, angle: 360, duration: 4000, repeat: -1 });

    // Play button
    this.makeButton(W/2, 430, 220, 64, COLORS.cyan, 'PLAY', () => {
      this.scene.start('GameScene');
    });

    const hi = parseInt(localStorage.getItem('anagram-avalanche_high_score') || '0');
    this.add.text(W/2, 520, 'Best: ' + hi, {
      fontFamily: 'Arial Black', fontSize: '20px', color: '#F59E0B',
    }).setOrigin(0.5);

    // Help button
    this.makeButton(W/2, 600, 180, 50, 0x374151, '? HOW TO PLAY', () => {
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
      this.scene.pause();
    });
  }

  makeButton(x, y, w, h, color, label, onTap) {
    const bg = this.add.rectangle(x, y, w, h, color).setStrokeStyle(3, 0xFFFFFF);
    bg.setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
    }).setOrigin(0.5);
    bg.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true });
      this.time.delayedCall(80, onTap);
    });
    return bg;
  }
}

class PowerUpScene extends Phaser.Scene {
  constructor() { super('PowerUpScene'); }
  create() {
    const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.75);
    this.add.text(W/2, 140, 'CHOOSE POWER-UP', {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#FFFFFF',
    }).setOrigin(0.5);

    const choices = samplePowerUps(3);
    choices.forEach((pu, i) => {
      const y = 240 + i * 130;
      const bg = this.add.rectangle(W/2, y, 300, 100, pu.color, 0.8).setStrokeStyle(3, 0xFFFFFF);
      bg.setInteractive({ useHandCursor: true });
      this.add.text(W/2, y - 20, pu.name, {
        fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
      }).setOrigin(0.5);
      this.add.text(W/2, y + 18, pu.desc, {
        fontFamily: 'Arial', fontSize: '14px', color: '#F3F4F6',
      }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        this.scene.stop();
        const gs = this.scene.get('GameScene');
        if (gs) gs.applyPowerUp(pu);
        this.scene.resume('GameScene');
      });
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalScore = data.score || 0; this.finalStage = data.stage || 1; }
  create() {
    const W = GAME_CONFIG.width, H = GAME_CONFIG.height;
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.85);
    this.add.text(W/2, 160, 'GAME OVER', {
      fontFamily: 'Arial Black', fontSize: '42px', color: '#EF4444',
    }).setOrigin(0.5);

    const hi = parseInt(localStorage.getItem('anagram-avalanche_high_score') || '0');
    const isNew = this.finalScore > hi;
    if (isNew) {
      localStorage.setItem('anagram-avalanche_high_score', this.finalScore.toString());
      this.add.text(W/2, 220, 'NEW RECORD!', {
        fontFamily: 'Arial Black', fontSize: '22px', color: '#06B6D4',
      }).setOrigin(0.5);
    }

    this.add.text(W/2, 280, this.finalScore.toString(), {
      fontFamily: 'Arial Black', fontSize: '48px', color: '#F59E0B',
    }).setOrigin(0.5);
    this.add.text(W/2, 340, 'Reached Stage ' + this.finalStage, {
      fontFamily: 'Arial', fontSize: '18px', color: '#9CA3AF',
    }).setOrigin(0.5);

    trackGameOver(this.finalStage, this.finalScore);

    this.makeBtn(W/2, 430, 240, 56, 0x06B6D4, 'PLAY AGAIN', () => {
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    this.makeBtn(W/2, 510, 240, 56, 0x374151, 'MENU', () => {
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }
  makeBtn(x, y, w, h, color, label, onTap) {
    const bg = this.add.rectangle(x, y, w, h, color).setStrokeStyle(3, 0xFFFFFF);
    bg.setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'Arial Black', fontSize: '20px', color: '#FFFFFF',
    }).setOrigin(0.5);
    bg.on('pointerdown', onTap);
  }
}
