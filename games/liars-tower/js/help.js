// Liar's Tower — Help / How to Play scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = (data && data.returnTo) || 'MenuScene'; }

  create() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1A1A2E);
    this.add.text(GAME_W / 2, 40, 'HOW TO PLAY', {
      fontFamily: 'Arial Black', fontSize: '26px', color: '#F5C518',
    }).setOrigin(0.5);

    let y = 90;
    this.add.text(GAME_W / 2, y, 'KNIGHTS always tell the TRUTH', {
      fontSize: '15px', color: '#F5C518',
    }).setOrigin(0.5);
    y += 22;
    this.add.text(GAME_W / 2, y, 'LIARS always LIE', {
      fontSize: '15px', color: '#CC2936',
    }).setOrigin(0.5);

    y += 36;
    this.add.image(GAME_W / 2 - 80, y, 'knight').setScale(0.7);
    this.add.image(GAME_W / 2 + 80, y, 'liar').setScale(0.7);

    y += 62;
    this.add.text(GAME_W / 2, y, 'SWIPE', {
      fontFamily: 'Arial Black', fontSize: '18px', color: '#E8E8E8',
    }).setOrigin(0.5);
    y += 28;
    this.add.text(40, y, 'LEFT =', { fontSize: '16px', color: '#CC2936' });
    this.add.text(110, y, 'LIAR', { fontSize: '16px', color: '#CC2936', fontStyle: 'bold' });
    this.add.text(GAME_W - 160, y, 'RIGHT =', { fontSize: '16px', color: '#F5C518' });
    this.add.text(GAME_W - 80, y, 'KNIGHT', { fontSize: '16px', color: '#F5C518', fontStyle: 'bold' });

    // Gesture diagram
    y += 36;
    this.add.text(GAME_W / 2, y, '\u2190 swipe                 swipe \u2192', {
      fontSize: '14px', color: '#00B4D8',
    }).setOrigin(0.5);

    y += 32;
    this.add.rectangle(GAME_W / 2, y, GAME_W - 40, 2, 0x2E4057);

    y += 20;
    this.add.text(GAME_W / 2, y, 'SHAKES', {
      fontFamily: 'Arial Black', fontSize: '16px', color: '#FF6B35',
    }).setOrigin(0.5);
    y += 22;
    this.add.text(GAME_W / 2, y, 'Wrong swipe = 1 shake', {
      fontSize: '13px', color: '#E8E8E8',
    }).setOrigin(0.5);
    y += 18;
    this.add.text(GAME_W / 2, y, '3 shakes = Tower COLLAPSES!', {
      fontSize: '13px', color: '#CC2936',
    }).setOrigin(0.5);

    y += 28;
    this.add.rectangle(GAME_W / 2, y, GAME_W - 40, 2, 0x2E4057);

    y += 18;
    this.add.text(GAME_W / 2, y, 'TIPS', {
      fontFamily: 'Arial Black', fontSize: '16px', color: '#FFE66D',
    }).setOrigin(0.5);
    y += 22;
    const tips = [
      '1. Each character talks about someone',
      '   ALREADY in the tower below.',
      '2. "#1 is a KNIGHT" - if #1 really is,',
      '   speaker tells truth = KNIGHT.',
      '3. Start with scribe\'s declared fact,',
      '   then deduce each new one.',
    ];
    tips.forEach(t => {
      this.add.text(30, y, t, { fontSize: '12px', color: '#E8E8E8' });
      y += 16;
    });

    // GOT IT button at fixed bottom
    const btnY = GAME_H - 60;
    const btn = this.add.rectangle(GAME_W / 2, btnY, 220, 56, 0xF5C518).setInteractive({ useHandCursor: true });
    this.add.text(GAME_W / 2, btnY, 'GOT IT!', {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#1A1A2E',
    }).setOrigin(0.5);

    const done = () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume('MenuScene');
      }
    };
    btn.on('pointerdown', done);
    // Full-screen fallback tap zone (lower depth than button)
    const zone = this.add.zone(GAME_W / 2, GAME_H - 20, GAME_W, 40).setInteractive();
    zone.on('pointerdown', done);
  }
}
