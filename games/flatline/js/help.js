// Flatline - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, COLORS.background).setDepth(0);
    const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x0A1520, 0.92).setDepth(0);

    let yPos = 40;
    const scrollContainer = this.add.container(0, 0).setDepth(5);

    // Title
    const title = this.add.text(w / 2, yPos, 'HOW TO PLAY', {
      fontSize: '22px', fontFamily: 'monospace', color: '#00FF7F', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(title);
    yPos += 45;

    // Section 1: Controls
    const s1Title = this.add.text(w / 2, yPos, '-- CONTROLS --', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFD700'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(s1Title);
    yPos += 30;

    // Draw tap diagram
    const gfx = this.add.graphics().setDepth(5);
    scrollContainer.add(gfx);

    // Phone outline
    gfx.lineStyle(2, 0x00FF7F, 0.6);
    gfx.strokeRoundedRect(w / 2 - 60, yPos, 120, 80, 8);

    // ECG line inside phone
    gfx.lineStyle(2, 0x00FF7F, 1);
    gfx.beginPath();
    gfx.moveTo(w / 2 - 50, yPos + 40);
    gfx.lineTo(w / 2 - 20, yPos + 40);
    gfx.lineTo(w / 2 - 10, yPos + 55);
    gfx.lineTo(w / 2, yPos + 15);
    gfx.lineTo(w / 2 + 10, yPos + 50);
    gfx.lineTo(w / 2 + 20, yPos + 40);
    gfx.lineTo(w / 2 + 50, yPos + 40);
    gfx.strokePath();

    // Timing window highlight
    gfx.fillStyle(0x00FF7F, 0.2);
    gfx.fillRect(w / 2 - 15, yPos + 5, 30, 70);

    // Finger tap icon
    gfx.fillStyle(0xE8F4F8, 0.7);
    gfx.fillCircle(w / 2 + 40, yPos + 65, 8);
    gfx.lineStyle(1, 0xE8F4F8, 0.5);
    gfx.lineBetween(w / 2 + 40, yPos + 57, w / 2 + 40, yPos + 45);

    const tapLabel = this.add.text(w / 2, yPos + 90, 'TAP ANYWHERE when beat\nhits the green window!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#E8F4F8', align: 'center'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(tapLabel);
    yPos += 120;

    // Section 2: Real vs Fake
    const s2Title = this.add.text(w / 2, yPos, '-- REAL vs FAKE BEATS --', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFD700'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(s2Title);
    yPos += 28;

    const gfx2 = this.add.graphics().setDepth(5);
    scrollContainer.add(gfx2);

    // Real beat (tall spike)
    gfx2.lineStyle(2.5, 0x00FF7F, 1);
    gfx2.beginPath();
    gfx2.moveTo(50, yPos + 30);
    gfx2.lineTo(80, yPos + 30);
    gfx2.lineTo(90, yPos + 38);
    gfx2.lineTo(100, yPos - 10);
    gfx2.lineTo(110, yPos + 40);
    gfx2.lineTo(120, yPos + 30);
    gfx2.lineTo(150, yPos + 30);
    gfx2.strokePath();

    const realLabel = this.add.text(100, yPos + 50, 'REAL BEAT\nTAP THIS!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#00FF7F', align: 'center'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(realLabel);

    // False beat (small bump)
    gfx2.lineStyle(2.5, 0x80FFBB, 1);
    gfx2.beginPath();
    gfx2.moveTo(210, yPos + 30);
    gfx2.lineTo(240, yPos + 30);
    gfx2.lineTo(255, yPos + 18);
    gfx2.lineTo(270, yPos + 30);
    gfx2.lineTo(310, yPos + 30);
    gfx2.strokePath();

    const fakeLabel = this.add.text(260, yPos + 50, 'FALSE BEAT\nIGNORE!', {
      fontSize: '11px', fontFamily: 'monospace', color: '#FF3333', align: 'center'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(fakeLabel);
    yPos += 80;

    // Section 3: Timing zones
    const s3Title = this.add.text(w / 2, yPos, '-- TIMING ZONES --', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFD700'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(s3Title);
    yPos += 25;

    const gfx3 = this.add.graphics().setDepth(5);
    scrollContainer.add(gfx3);
    const zoneLeft = 60;
    const zoneWidth = 240;
    gfx3.fillStyle(0x00FF7F, 0.1);
    gfx3.fillRect(zoneLeft, yPos, zoneWidth, 30);
    gfx3.fillStyle(0xFFD700, 0.25);
    gfx3.fillRect(zoneLeft + zoneWidth * 0.3, yPos, zoneWidth * 0.4, 30);
    gfx3.lineStyle(1, 0x00FF7F, 0.6);
    gfx3.strokeRect(zoneLeft, yPos, zoneWidth, 30);

    const pLabel = this.add.text(w / 2, yPos + 15, 'PERFECT +200', {
      fontSize: '10px', fontFamily: 'monospace', color: '#FFD700'
    }).setOrigin(0.5).setDepth(5);
    const gLabel = this.add.text(zoneLeft + 30, yPos + 15, 'GOOD\n+100', {
      fontSize: '9px', fontFamily: 'monospace', color: '#00FF7F', align: 'center'
    }).setOrigin(0.5).setDepth(5);
    const gLabel2 = this.add.text(zoneLeft + zoneWidth - 30, yPos + 15, 'GOOD\n+100', {
      fontSize: '9px', fontFamily: 'monospace', color: '#00FF7F', align: 'center'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add([pLabel, gLabel, gLabel2]);
    yPos += 50;

    // Section 4: Strikes
    const s4Title = this.add.text(w / 2, yPos, '-- STRIKES --', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFD700'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(s4Title);
    yPos += 22;

    const rules = [
      '3 strikes = FLATLINE (Game Over)',
      'Miss a real beat = Strike',
      'Tap a fake bump = Strike',
      'Tap outside window = Safe (ignored)'
    ];
    rules.forEach(r => {
      const t = this.add.text(w / 2, yPos, r, {
        fontSize: '11px', fontFamily: 'monospace', color: '#E8F4F8'
      }).setOrigin(0.5).setDepth(5);
      scrollContainer.add(t);
      yPos += 18;
    });
    yPos += 10;

    // Section 5: Tips
    const s5Title = this.add.text(w / 2, yPos, '-- TIPS --', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFD700'
    }).setOrigin(0.5).setDepth(5);
    scrollContainer.add(s5Title);
    yPos += 22;

    const tips = [
      'Watch spike HEIGHT: tall = real!',
      'Streak 5+ Perfects for multiplier',
      'Every 5th stage is a rest stage'
    ];
    tips.forEach(t => {
      const txt = this.add.text(w / 2, yPos, '> ' + t, {
        fontSize: '11px', fontFamily: 'monospace', color: '#AAFFCC'
      }).setOrigin(0.5).setDepth(5);
      scrollContainer.add(txt);
      yPos += 18;
    });
    yPos += 20;

    // Got it button
    const btnY = Math.min(yPos, h - 60);
    const gotItBg = this.add.rectangle(w / 2, btnY, 200, 48, 0x00FF7F).setDepth(5);
    const gotItText = this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '18px', fontFamily: 'monospace', color: '#050A0E', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(6);
    gotItBg.setInteractive({ useHandCursor: true });
    gotItBg.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        this.scene.resume('GameScene');
        this.scene.resume('HUDScene');
      }
    });

    // Full screen fallback tap zone
    const fallback = this.add.rectangle(w / 2, h - 20, w, 40, 0x000000, 0)
      .setDepth(4).setInteractive();
    fallback.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        this.scene.resume('GameScene');
        this.scene.resume('HUDScene');
      }
    });
  }
}
