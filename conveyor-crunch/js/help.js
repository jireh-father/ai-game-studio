// Conveyor Crunch - HelpScene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }
  create() {
    // Background overlay
    this.add.rectangle(CONFIG.WIDTH/2, CONFIG.HEIGHT/2, CONFIG.WIDTH, CONFIG.HEIGHT, 0x1A1A2E, 0.95).setDepth(0);
    let y = 50;
    // Title
    this.add.text(CONFIG.WIDTH/2, y, 'HOW TO PLAY', {
      fontSize: '32px', fontFamily: 'Arial Black', fill: '#FFFFFF', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(1);
    y += 50;
    // One-liner
    this.add.text(CONFIG.WIDTH/2, y, 'Sort items into matching color bins\nbefore the belt overflows!', {
      fontSize: '16px', fontFamily: 'Arial', fill: '#CCC', align: 'center', lineSpacing: 4
    }).setOrigin(0.5).setDepth(1);
    y += 55;
    // Controls illustration
    // Belt
    this.add.rectangle(CONFIG.WIDTH/2, y + 20, 280, 40, 0x5C6370).setDepth(1);
    // Item on belt
    this.add.circle(CONFIG.WIDTH/2, y + 20, 18, 0xE74C3C).setDepth(2);
    this.add.text(CONFIG.WIDTH/2, y + 20, '?', {
      fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).setDepth(3);
    // Left bin
    this.add.rectangle(CONFIG.WIDTH/2 - 110, y + 20, 50, 60, 0x2C3E50).setStrokeStyle(2, 0xE74C3C).setDepth(1);
    this.add.text(CONFIG.WIDTH/2 - 110, y + 15, 'RED', {
      fontSize: '11px', fontFamily: 'Arial Black', fill: COLORS.ITEM_RED
    }).setOrigin(0.5).setDepth(2);
    // Right bin
    this.add.rectangle(CONFIG.WIDTH/2 + 110, y + 20, 50, 60, 0x2C3E50).setStrokeStyle(2, 0x3498DB).setDepth(1);
    this.add.text(CONFIG.WIDTH/2 + 110, y + 15, 'BLUE', {
      fontSize: '11px', fontFamily: 'Arial Black', fill: COLORS.ITEM_BLUE
    }).setOrigin(0.5).setDepth(2);
    // Swipe arrows
    this.add.text(CONFIG.WIDTH/2 - 55, y + 20, '<--', {
      fontSize: '20px', fontFamily: 'Arial Black', fill: COLORS.REWARD
    }).setOrigin(0.5).setDepth(3);
    this.add.text(CONFIG.WIDTH/2 + 55, y + 20, '-->', {
      fontSize: '20px', fontFamily: 'Arial Black', fill: COLORS.REWARD
    }).setOrigin(0.5).setDepth(3);
    y += 80;
    // Controls text
    const controls = [
      { gesture: 'Swipe LEFT', desc: 'Toss item to left bin' },
      { gesture: 'Swipe RIGHT', desc: 'Toss item to right bin' },
      { gesture: 'Swipe UP', desc: 'Discard decoy items (gray X)' }
    ];
    for (const c of controls) {
      this.add.text(40, y, c.gesture, {
        fontSize: '15px', fontFamily: 'Arial Black', fill: COLORS.REWARD
      }).setDepth(1);
      this.add.text(180, y, c.desc, {
        fontSize: '14px', fontFamily: 'Arial', fill: '#CCC'
      }).setDepth(1);
      y += 28;
    }
    y += 15;
    // Rules section
    this.add.text(CONFIG.WIDTH/2, y, '-- RULES --', {
      fontSize: '18px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).setDepth(1);
    y += 30;
    const rules = [
      'Match item colors to the correct bin',
      '3 wrong sorts = GAME OVER',
      '5 unsorted items pile up = GAME OVER',
      'Consecutive correct sorts build combos (up to 10x!)',
      'Every 5th stage is a RUSH with 15 items'
    ];
    for (const r of rules) {
      this.add.text(30, y, '* ' + r, {
        fontSize: '13px', fontFamily: 'Arial', fill: '#BBB', wordWrap: { width: CONFIG.WIDTH - 60 }
      }).setDepth(1);
      y += 28;
    }
    y += 10;
    // Tips section
    this.add.text(CONFIG.WIDTH/2, y, '-- TIPS --', {
      fontSize: '18px', fontFamily: 'Arial Black', fill: COLORS.SUCCESS
    }).setOrigin(0.5).setDepth(1);
    y += 30;
    const tips = [
      'Sort within 0.5s for a speed bonus!',
      'Watch for bin color swaps after stage 7!',
      'Gray items with X marks are decoys - swipe UP!'
    ];
    for (const t of tips) {
      this.add.text(30, y, '> ' + t, {
        fontSize: '13px', fontFamily: 'Arial', fill: '#AAA', wordWrap: { width: CONFIG.WIDTH - 60 }
      }).setDepth(1);
      y += 28;
    }
    y += 20;
    // Got it button
    const gotBtn = this.add.rectangle(CONFIG.WIDTH/2, Math.min(y + 10, CONFIG.HEIGHT - 50), 180, 50, 0x27AE60)
      .setInteractive({ useHandCursor: true }).setDepth(1);
    this.add.text(gotBtn.x, gotBtn.y, 'GOT IT!', {
      fontSize: '24px', fontFamily: 'Arial Black', fill: '#FFF'
    }).setOrigin(0.5).setDepth(2).disableInteractive();
    gotBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }
}
