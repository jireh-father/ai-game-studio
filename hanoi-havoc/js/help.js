class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = (data && data.returnTo) || 'MenuScene'; }
  create() {
    const W = 360, H = 720;
    this.add.rectangle(W/2, H/2, W, H, 0x1A0F00).setDepth(0);
    this.add.rectangle(W/2, H/2, W - 20, H - 40, 0x2C1A0A).setStrokeStyle(2, 0xC8A96E).setDepth(1);

    this.add.text(W/2, 50, 'HOW TO PLAY', {
      fontSize: '26px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);

    // Controls diagram: 3 pegs
    const g = this.add.graphics().setDepth(2);
    const baseY = 160;
    [80, 180, 280].forEach(x => {
      g.fillStyle(0xC8A96E, 1);
      g.fillRect(x - 2, baseY - 40, 4, 50);
      g.fillStyle(0x5C2E0A, 1);
      g.fillRect(x - 15, baseY + 10, 30, 8);
    });
    // falling disc
    g.fillStyle(0xC8A96E, 1);
    g.fillRoundedRect(160, 100, 40, 14, 5);
    g.lineStyle(2, 0xFFD700, 1);
    g.lineBetween(180, 120, 180, 145);
    g.fillStyle(0xFFD700, 1);
    g.fillTriangle(175, 140, 185, 140, 180, 150);

    this.add.text(W/2, 200, 'TAP a peg to set catcher', {
      fontSize: '13px', color: '#F5E6C8', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(2);
    this.add.text(W/2, 220, 'DOUBLE-TAP a falling disc to redirect', {
      fontSize: '13px', color: '#F5E6C8', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(2);

    // The rule
    this.add.text(W/2, 260, 'THE RULE', {
      fontSize: '18px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);
    this.add.text(W/2, 290, 'NEVER place a LARGER disc', {
      fontSize: '13px', color: '#F5E6C8', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(2);
    this.add.text(W/2, 308, 'on a SMALLER one!', {
      fontSize: '13px', color: '#FF2222', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);

    // Scoring
    this.add.text(W/2, 345, 'SCORING', {
      fontSize: '18px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);
    ['Legal catch: +100', 'Sequence bonus: +150', 'Stage clear: +500 x stage', '3 SMITES = Game Over'].forEach((t, i) => {
      this.add.text(W/2, 370 + i * 18, t, {
        fontSize: '12px', color: '#F5E6C8', fontFamily: 'monospace'
      }).setOrigin(0.5).setDepth(2);
    });

    // Tips
    this.add.text(W/2, 460, 'TIPS', {
      fontSize: '18px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);
    ['Tap the peg BEFORE the disc falls', 'Double-tap the DISC (not peg) to redirect', 'Size 1 is smallest — goes on anything'].forEach((t, i) => {
      this.add.text(W/2, 485 + i * 18, t, {
        fontSize: '11px', color: '#F5E6C8', fontFamily: 'monospace'
      }).setOrigin(0.5).setDepth(2);
    });

    // Got it button
    const btnY = 620;
    const btn = this.add.rectangle(W/2, btnY, 160, 50, 0xC8A96E).setStrokeStyle(3, 0xFFD700).setDepth(2).setInteractive({ useHandCursor: true });
    this.add.text(W/2, btnY, 'GOT IT!', {
      fontSize: '20px', color: '#5C2E0A', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    btn.on('pointerdown', () => {
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause && gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    });
  }
}
