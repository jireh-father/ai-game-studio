// help.js - How to Play
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = (data && data.returnTo) || 'MenuScene'; }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x0D0D1F, 0.98);
    this.add.text(w/2, 40, 'HOW TO PLAY', { fontSize: '26px', color: '#F0F0F0', fontStyle: 'bold' }).setOrigin(0.5);

    let y = 90;
    // Section 1: mine
    this.add.text(20, y, 'YOU ARE THE MINE', { fontSize: '16px', color: '#FF2222', fontStyle: 'bold' });
    y += 24;
    this.add.image(40, y + 18, 'mine').setScale(0.7);
    this.add.text(80, y + 8, 'Tap adjacent cell to hop.\nEach hop corrupts a number.', { fontSize: '13px', color: '#F0F0F0' });
    y += 60;

    // Section 2: AI sweep
    this.add.text(20, y, 'AI SWEEPER HUNTS YOU', { fontSize: '16px', color: '#4488FF', fontStyle: 'bold' });
    y += 24;
    // draw grid demo
    for (let i = 0; i < 4; i++) {
      const c = this.add.rectangle(30 + i * 22, y + 12, 20, 20, 0xE8E8E8);
      c.setStrokeStyle(1, 0x888888);
      if (i < 2) this.add.rectangle(30 + i * 22, y + 12, 20, 20, 0x4488FF, 0.5);
    }
    this.add.text(130, y + 4, 'Blue wave = AI area.\nDo not let AI flag your cell!', { fontSize: '13px', color: '#F0F0F0' });
    y += 55;

    // Section 3: corruption
    this.add.text(20, y, 'CORRUPT NUMBERS', { fontSize: '16px', color: '#FF6600', fontStyle: 'bold' });
    y += 24;
    const cellA = this.add.rectangle(35, y + 12, 24, 24, 0xE8E8E8); cellA.setStrokeStyle(1, 0x888888);
    this.add.text(35, y + 12, '2', { fontSize: '14px', color: '#007B00', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(55, y + 12, '→', { fontSize: '14px', color: '#F0F0F0' }).setOrigin(0.5);
    const cellB = this.add.rectangle(75, y + 12, 24, 24, 0xE8E8E8); cellB.setStrokeStyle(1, 0x888888);
    this.add.text(75, y + 12, '3', { fontSize: '14px', color: '#FF6600', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(100, y + 4, 'Wrong numbers =\nAI makes mistakes!', { fontSize: '13px', color: '#F0F0F0' });
    y += 55;

    // Section 4: decoy
    this.add.text(20, y, 'DECOY (Long-Press Mine)', { fontSize: '16px', color: '#FFDD00', fontStyle: 'bold' });
    y += 24;
    this.add.image(40, y + 18, 'explosion').setScale(0.4);
    this.add.text(80, y + 8, 'Hold 500ms on your cell.\nAI pauses 3 seconds!', { fontSize: '13px', color: '#F0F0F0' });
    y += 60;

    // Tips
    this.add.text(20, y, 'TIPS', { fontSize: '16px', color: '#00FF88', fontStyle: 'bold' });
    y += 22;
    this.add.text(20, y, '• Move toward numbered cells\n• Avoid corners - AI sweeps edges\n• Save decoy for emergencies', { fontSize: '12px', color: '#F0F0F0' });

    // Got it button - fixed at bottom
    const btnY = h - 60;
    const btn = this.add.rectangle(w/2, btnY, 200, 50, 0x00FF88).setInteractive({ useHandCursor: true });
    this.add.text(w/2, btnY, 'GOT IT!', { fontSize: '22px', color: '#0D0D1F', fontStyle: 'bold' }).setOrigin(0.5).disableInteractive();
    const close = () => {
      Effects.playClick();
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    };
    btn.on('pointerdown', close);
  }
}
