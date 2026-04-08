// Liar's Tower — Menu, GameOver scenes
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1A1A2E);

    // Decorative tower stack
    const tileYs = [250, 290, 330, 370, 410];
    tileYs.forEach((ty, i) => {
      const key = i % 2 === 0 ? 'tile_k' : 'tile_l';
      const t = this.add.image(GAME_W / 2, ty, key);
      this.tweens.add({ targets: t, y: ty + 4, duration: 1200 + i * 100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // Title
    this.add.text(GAME_W / 2, 110, "LIAR'S", {
      fontFamily: 'Georgia, serif', fontSize: '54px', color: '#F5C518',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 165, 'TOWER', {
      fontFamily: 'Georgia, serif', fontSize: '54px', color: '#CC2936',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 210, 'Deduce. Stack. Survive.', {
      fontSize: '14px', color: '#E8E8E8', fontStyle: 'italic',
    }).setOrigin(0.5);

    // Buttons
    const playBtn = this.add.rectangle(GAME_W / 2, 490, 240, 64, 0xF5C518).setInteractive({ useHandCursor: true });
    this.add.text(GAME_W / 2, 490, 'PLAY', {
      fontFamily: 'Arial Black', fontSize: '28px', color: '#1A1A2E',
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      Effects.playTone(440, 0.1, 'square', 0.1);
      this.scene.start('GameScene');
    });
    this.tweens.add({ targets: playBtn, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1 });

    const helpBtn = this.add.rectangle(GAME_W / 2, 570, 200, 48, 0x2E4057).setInteractive({ useHandCursor: true });
    this.add.text(GAME_W / 2, 570, 'HOW TO PLAY', {
      fontSize: '18px', color: '#E8E8E8',
    }).setOrigin(0.5);
    helpBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // High score
    const hs = (window.GameState && window.GameState.highScore) || 0;
    this.add.text(GAME_W / 2, 625, `Best: ${hs} placements`, {
      fontSize: '14px', color: '#FFE66D',
    }).setOrigin(0.5);

    // Sound toggle
    const soundBtn = this.add.text(GAME_W - 30, 30, window.GameState.soundEnabled ? '🔊' : '🔇', {
      fontSize: '24px',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    soundBtn.on('pointerdown', () => {
      window.GameState.soundEnabled = !window.GameState.soundEnabled;
      soundBtn.setText(window.GameState.soundEnabled ? '🔊' : '🔇');
      try { localStorage.setItem('liars-tower_sound', window.GameState.soundEnabled ? '1' : '0'); } catch (e) {}
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalScore = data.score || 0; this.placements = data.placements || 0; this.stage = data.stage || 1; }
  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.85);

    this.add.text(GAME_W / 2, 150, 'TOWER', {
      fontFamily: 'Georgia, serif', fontSize: '36px', color: '#CC2936',
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 195, 'COLLAPSED', {
      fontFamily: 'Georgia, serif', fontSize: '36px', color: '#CC2936',
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 265, 'SCORE', {
      fontSize: '16px', color: '#E8E8E8',
    }).setOrigin(0.5);
    const scoreText = this.add.text(GAME_W / 2, 305, '0', {
      fontFamily: 'Arial Black', fontSize: '52px', color: '#F5C518',
    }).setOrigin(0.5);

    // Count up
    let s = 0;
    const step = Math.max(1, Math.floor(this.finalScore / 40));
    const timer = this.time.addEvent({
      delay: 25, repeat: 39,
      callback: () => {
        s = Math.min(this.finalScore, s + step);
        scoreText.setText('' + s);
      },
    });
    this.time.delayedCall(1100, () => scoreText.setText('' + this.finalScore));

    this.add.text(GAME_W / 2, 365, `Placements: ${this.placements}`, {
      fontSize: '18px', color: '#E8E8E8',
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 390, `Reached Stage ${this.stage}`, {
      fontSize: '16px', color: '#00B4D8',
    }).setOrigin(0.5);

    const hs = window.GameState.highScore || 0;
    if (this.placements > hs) {
      window.GameState.highScore = this.placements;
      try { localStorage.setItem('liars-tower_high_score', '' + this.placements); } catch (e) {}
      const nr = this.add.text(GAME_W / 2, 425, 'NEW RECORD!', {
        fontFamily: 'Arial Black', fontSize: '22px', color: '#FFE66D',
      }).setOrigin(0.5);
      this.tweens.add({ targets: nr, scaleX: 1.15, scaleY: 1.15, duration: 400, yoyo: true, repeat: -1 });
    } else {
      this.add.text(GAME_W / 2, 425, `Best: ${hs}`, {
        fontSize: '14px', color: '#FFE66D',
      }).setOrigin(0.5);
    }

    // Play Again
    const playBtn = this.add.rectangle(GAME_W / 2, 510, 240, 64, 0xF5C518).setInteractive({ useHandCursor: true });
    this.add.text(GAME_W / 2, 510, 'PLAY AGAIN', {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#1A1A2E',
    }).setOrigin(0.5);
    playBtn.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.rectangle(GAME_W / 2, 585, 180, 48, 0x2E4057).setInteractive({ useHandCursor: true });
    this.add.text(GAME_W / 2, 585, 'MENU', {
      fontSize: '20px', color: '#E8E8E8',
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('MenuScene');
    });

    AdsManager.showInterstitial();
  }
}
