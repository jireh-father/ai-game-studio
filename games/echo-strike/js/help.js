// Echo Strike - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = CONFIG.GAME_WIDTH;
    const h = CONFIG.GAME_HEIGHT;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F, 0.95).setDepth(0);

    const contentY = 30;
    const container = this.add.container(0, 0);

    // Title
    const title = this.add.text(w / 2, contentY, 'HOW TO PLAY', {
      fontSize: '24px', fontFamily: 'Arial', fill: '#00D4FF', fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(title);

    // Section 1: STRIKE
    let sy = contentY + 50;
    container.add(this.add.text(w / 2, sy, '-- STRIKE --', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5));
    sy += 30;

    // Illustration: target circle with tap indicator
    const g1 = this.add.graphics();
    g1.lineStyle(2, 0x00D4FF, 0.8);
    g1.strokeCircle(w / 2, sy + 30, 28);
    g1.fillStyle(0x1A1A3E, 1);
    g1.fillCircle(w / 2, sy + 30, 24);
    g1.fillStyle(0x00D4FF, 0.8);
    g1.fillCircle(w / 2, sy + 30, 5);
    // Tap hand arrow
    g1.lineStyle(3, 0xFFFFFF, 0.7);
    g1.lineBetween(w / 2 + 35, sy + 50, w / 2 + 10, sy + 35);
    g1.fillStyle(0xFFFFFF, 0.7);
    g1.fillCircle(w / 2 + 35, sy + 52, 6);
    container.add(g1);

    // +100 text
    container.add(this.add.text(w / 2 + 50, sy + 10, '+100', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#00D4FF', fontStyle: 'bold'
    }).setOrigin(0.5));

    sy += 75;
    container.add(this.add.text(w / 2, sy, 'Tap targets during their\nBRIGHT glow window.', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center', lineSpacing: 4
    }).setOrigin(0.5));

    sy += 35;
    container.add(this.add.text(w / 2, sy, 'Miss = walls close in!', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#FF4422', align: 'center'
    }).setOrigin(0.5));

    // Section 2: ECHO
    sy += 45;
    container.add(this.add.text(w / 2, sy, '-- ECHO --', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5));
    sy += 30;

    // Echo illustration: tap -> ghost -> auto-hit
    const g2 = this.add.graphics();
    // Step 1: tap circle
    g2.lineStyle(2, 0x00D4FF, 0.8);
    g2.strokeCircle(80, sy + 25, 18);
    g2.fillStyle(0x00D4FF, 0.5);
    g2.fillCircle(80, sy + 25, 5);
    // Arrow
    g2.lineStyle(2, 0xFFFFFF, 0.5);
    g2.lineBetween(105, sy + 25, 140, sy + 25);
    g2.fillStyle(0xFFFFFF, 0.5);
    g2.fillTriangle(140, sy + 20, 140, sy + 30, 150, sy + 25);
    // Step 2: ghost circle
    g2.lineStyle(2, 0x00FFEE, 0.5);
    g2.strokeCircle(180, sy + 25, 18);
    // countdown arc
    g2.lineStyle(3, 0x00FFEE, 0.8);
    g2.beginPath();
    g2.arc(180, sy + 25, 22, -Math.PI / 2, Math.PI, false);
    g2.strokePath();
    // Arrow
    g2.lineStyle(2, 0xFFFFFF, 0.5);
    g2.lineBetween(205, sy + 25, 240, sy + 25);
    g2.fillStyle(0xFFFFFF, 0.5);
    g2.fillTriangle(240, sy + 20, 240, sy + 30, 250, sy + 25);
    // Step 3: auto-hit burst
    g2.lineStyle(2, 0x00FFEE, 1);
    g2.strokeCircle(280, sy + 25, 18);
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      g2.lineBetween(
        280 + Math.cos(angle) * 22, sy + 25 + Math.sin(angle) * 22,
        280 + Math.cos(angle) * 30, sy + 25 + Math.sin(angle) * 30
      );
    }
    container.add(g2);

    // Labels
    container.add(this.add.text(80, sy + 52, 'TAP', {
      fontSize: '11px', fontFamily: 'Arial', fill: '#00D4FF'
    }).setOrigin(0.5));
    container.add(this.add.text(180, sy + 52, '2 SEC', {
      fontSize: '11px', fontFamily: 'Arial', fill: '#00FFEE'
    }).setOrigin(0.5));
    container.add(this.add.text(280, sy + 52, 'AUTO!', {
      fontSize: '11px', fontFamily: 'Arial', fill: '#00FFEE', fontStyle: 'bold'
    }).setOrigin(0.5));

    sy += 75;
    container.add(this.add.text(w / 2, sy, 'Every hit plants an ECHO.\n2 seconds later, it fires again.\nIf a target is there - bonus hit!', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center', lineSpacing: 4
    }).setOrigin(0.5));

    // Section 3: PLAN AHEAD
    sy += 60;
    container.add(this.add.text(w / 2, sy, '-- PLAN AHEAD --', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5));
    sy += 25;
    container.add(this.add.text(w / 2, sy, 'Experts tap where targets\nWILL appear, not just where they are.', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#CCCCCC', align: 'center', lineSpacing: 4
    }).setOrigin(0.5));

    // Tips
    sy += 50;
    container.add(this.add.text(w / 2, sy, '-- TIPS --', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#FFD700', fontStyle: 'bold'
    }).setOrigin(0.5));
    sy += 25;

    const tips = [
      'Echo hits push walls back -\nchain echoes to recover!',
      'Orange triangles pulse faster -\nreact quickly!',
      'Purple X targets are decoys -\ndon\'t tap them!'
    ];
    tips.forEach((tip, i) => {
      container.add(this.add.text(w / 2, sy + i * 42, `${i + 1}. ${tip}`, {
        fontSize: '12px', fontFamily: 'Arial', fill: '#AAAAAA', align: 'center', lineSpacing: 3
      }).setOrigin(0.5));
    });

    // GOT IT button at fixed bottom position
    const btnY = h - 60;
    const btnBg = this.add.rectangle(w / 2, btnY, 180, 50, 0x00D4FF, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.dismiss());
    const btnTxt = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '20px', fontFamily: 'Arial', fill: '#0A0A0F', fontStyle: 'bold'
    }).setOrigin(0.5);
    btnTxt.disableInteractive();

    // Full-screen fallback tap zone
    this.add.rectangle(w / 2, btnY, w, 80, 0x000000, 0)
      .setInteractive()
      .on('pointerdown', () => this.dismiss())
      .setDepth(-1);

    // Scrollable if content overflows
    const totalH = sy + 140;
    if (totalH > h - 80) {
      const scrollRange = totalH - h + 120;
      let scrollY = 0;
      this.input.on('pointermove', (pointer) => {
        if (pointer.isDown) {
          const dy = pointer.prevPosition.y - pointer.y;
          scrollY = Phaser.Math.Clamp(scrollY + dy, 0, scrollRange);
          container.y = -scrollY;
        }
      });
    }
  }

  dismiss() {
    this.scene.stop('HelpScene');
    if (this.returnTo === 'GameScene') {
      this.scene.resume('GameScene');
    }
  }
}
