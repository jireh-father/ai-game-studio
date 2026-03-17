// Speed Dating Dodge — UI Scenes (MenuScene, GameOverScene, Pause)
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Floating hearts background
    for (let i = 0; i < 5; i++) {
      const hx = Phaser.Math.Between(40, w - 40);
      const hy = Phaser.Math.Between(h + 20, h + 200);
      const heart = this.add.text(hx, hy, '\u2665', {
        fontSize: Phaser.Math.Between(20, 36) + 'px', color: '#FF6B6B'
      }).setAlpha(0.2);
      this.tweens.add({
        targets: heart, y: -40, alpha: 0, duration: Phaser.Math.Between(4000, 8000),
        repeat: -1, delay: i * 800
      });
    }

    // Title
    this.add.text(w/2, 110, 'Speed Dating\nDodge', {
      fontSize: '34px', fontFamily: 'Arial', fontStyle: 'bold',
      color: CONFIG.COLOR_PRIMARY, align: 'center', lineSpacing: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(w/2, 185, 'Read the room. Avoid the red flags.', {
      fontSize: '13px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT,
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Avatar decoration
    if (this.textures.exists('avatar_menu')) {
      this.add.image(w/2, 245, 'avatar_menu').setScale(0.6);
    }

    // Play button
    const playBtn = this.add.rectangle(w/2, 330, 200, 56, 0xFF6B6B).setInteractive();
    playBtn.setStrokeStyle(2, 0xC44D4D);
    this.add.text(w/2, 330, 'PLAY', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5);

    playBtn.on('pointerdown', () => {
      SFX.play('click');
      this.tweens.add({
        targets: playBtn, scaleX: 1.1, scaleY: 1.1, duration: 80, yoyo: true,
        onComplete: () => {
          this.scene.stop('MenuScene');
          this.scene.start('GameScene');
        }
      });
    });

    // Help button
    const helpBtn = this.add.rectangle(50, h - 50, 52, 52, 0xFFF5E6).setInteractive();
    helpBtn.setStrokeStyle(2, 0x2C3A47);
    this.add.text(50, h - 50, '?', {
      fontSize: '24px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
    }).setOrigin(0.5);

    helpBtn.on('pointerdown', () => {
      SFX.play('click');
      this.scene.launch('HelpScene', { returnTo: 'MenuScene', wasGamePaused: false });
    });

    // High score
    const hs = localStorage.getItem('speed-dating-dodge_high_score') || 0;
    this.add.text(w/2, 400, 'Best: ' + hs, {
      fontSize: '14px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT
    }).setOrigin(0.5);

    // Sound toggle
    const soundOn = SFX._enabled;
    const soundBtn = this.add.rectangle(w - 50, h - 50, 44, 44, 0xFFF5E6).setInteractive();
    soundBtn.setStrokeStyle(2, 0x2C3A47);
    const soundTxt = this.add.text(w - 50, h - 50, soundOn ? '\u266B' : '\u2715', {
      fontSize: '20px', fontFamily: 'Arial', color: CONFIG.COLOR_TEXT
    }).setOrigin(0.5);

    soundBtn.on('pointerdown', () => {
      SFX._enabled = !SFX._enabled;
      soundTxt.setText(SFX._enabled ? '\u266B' : '\u2715');
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.dateReached = data.dateReached || 1;
    this.adContinueUsed = data.adContinueUsed || false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    Ads.trackGameOver();

    // Dark overlay
    this.add.rectangle(w/2, h/2, w, h, 0x2C3A47, 0.85);

    // Title
    this.add.text(w/2, 80, 'GAME OVER', {
      fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_PRIMARY
    }).setOrigin(0.5);

    // Score
    const scoreTxt = this.add.text(w/2, 140, String(this.finalScore), {
      fontSize: '48px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_GOLD
    }).setOrigin(0.5);
    this.tweens.add({ targets: scoreTxt, scaleX: 1.2, scaleY: 1.2, duration: 150, yoyo: true });

    // High score check
    const hs = parseInt(localStorage.getItem('speed-dating-dodge_high_score') || '0');
    if (this.finalScore > hs) {
      localStorage.setItem('speed-dating-dodge_high_score', this.finalScore);
      const newRec = this.add.text(w/2, 185, 'NEW RECORD!', {
        fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_GOLD
      }).setOrigin(0.5);
      this.tweens.add({ targets: newRec, scaleX: 1.15, scaleY: 1.15, duration: 500, yoyo: true, repeat: -1 });
    }

    // Date reached
    this.add.text(w/2, 215, 'Dates Reached: ' + this.dateReached, {
      fontSize: '16px', fontFamily: 'Arial', color: '#CCC'
    }).setOrigin(0.5);

    let btnY = 270;

    // Extra life ad
    if (Ads.canOfferExtraLife() && !this.adContinueUsed) {
      const adBtn = this.add.rectangle(w/2, btnY, 220, 48, 0xF9CA24).setInteractive();
      adBtn.setStrokeStyle(2, 0x2C3A47);
      this.add.text(w/2, btnY, 'Watch Ad - Get +1 Life', {
        fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
      }).setOrigin(0.5);
      adBtn.on('pointerdown', () => {
        SFX.play('click');
        Ads.showRewardedExtraLife(() => {
          this.scene.stop('GameOverScene');
          this.scene.get('GameScene').events.emit('extraLife');
        });
      });
      btnY += 60;
    }

    // Double score ad
    if (Ads.canOfferDoubleScore()) {
      const dblBtn = this.add.rectangle(w/2, btnY, 220, 48, 0xF9CA24, 0.7).setInteractive();
      dblBtn.setStrokeStyle(2, 0x2C3A47);
      this.add.text(w/2, btnY, 'Double Score - Watch Ad', {
        fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold', color: CONFIG.COLOR_TEXT
      }).setOrigin(0.5);
      dblBtn.on('pointerdown', () => {
        SFX.play('click');
        Ads.showRewardedDoubleScore(() => {
          this.finalScore *= 2;
          scoreTxt.setText(String(this.finalScore));
          localStorage.setItem('speed-dating-dodge_high_score',
            Math.max(this.finalScore, parseInt(localStorage.getItem('speed-dating-dodge_high_score') || '0')));
          dblBtn.destroy();
        });
      });
      btnY += 60;
    }

    // Interstitial check
    if (Ads.shouldShowInterstitial()) {
      Ads.showInterstitial();
    }

    // Play again
    const playBtn = this.add.rectangle(w/2, btnY, 200, 52, 0xFF6B6B).setInteractive();
    playBtn.setStrokeStyle(2, 0xC44D4D);
    this.add.text(w/2, btnY, 'PLAY AGAIN', {
      fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      SFX.play('click');
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('GameScene');
    });
    btnY += 58;

    // Menu
    const menuBtn = this.add.rectangle(w/2, btnY, 160, 44, 0x000000, 0).setInteractive();
    menuBtn.setStrokeStyle(2, 0xFFFFFF);
    this.add.text(w/2, btnY, 'MENU', {
      fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      SFX.play('click');
      this.scene.stop('GameOverScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    // Slide-up animation
    this.cameras.main.y = 400;
    this.tweens.add({ targets: this.cameras.main, y: 0, duration: 350, ease: 'Back.easeOut' });
  }
}
