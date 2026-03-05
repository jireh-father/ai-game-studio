// help.js - HelpScene with illustrated how-to-play instructions

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.cameras.main.width, h = this.cameras.main.height;

    // Background overlay
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85).setDepth(0);

    let y = 30;

    // Title
    this.add.text(w / 2, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS_HEX.RUNNER
    }).setOrigin(0.5, 0).setDepth(1);
    y += 50;

    // One-liner
    this.add.text(w / 2, y, 'Tap to vault, slide & wall-jump\nthrough a parkour course!', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif', color: '#CCC',
      align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0).setDepth(1);
    y += 52;

    // Control illustration - runner approaching wall with tap zone
    const illustY = y + 40;
    this.add.rectangle(w / 2, illustY, w - 40, 80, 0x1D3557, 0.5).setDepth(1);
    // Ground line
    this.add.rectangle(w / 2, illustY + 25, w - 60, 3, COLORS.GROUND).setDepth(2);
    // Runner
    this.add.image(w * 0.25, illustY + 15, 'runner').setScale(1.2).setDepth(3).setOrigin(0.5, 1);
    // Arrow
    this.add.text(w * 0.42, illustY - 2, '>>>', {
      fontSize: '18px', fontFamily: 'Arial, sans-serif', color: COLORS_HEX.RUNNER
    }).setOrigin(0.5).setDepth(3);
    // Wall obstacle
    this.add.image(w * 0.6, illustY + 15, 'wall').setScale(1).setDepth(3).setOrigin(0.5, 1);
    // Tap zone indicator (glowing circle)
    const glow = this.add.circle(w * 0.6, illustY - 5, 22, 0xFFFFFF, 0.2).setDepth(2);
    this.tweens.add({
      targets: glow, alpha: 0.05, duration: 500, yoyo: true, repeat: -1
    });
    // Tap text
    this.add.text(w * 0.8, illustY - 5, 'TAP!', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS_HEX.COMBO_GLOW
    }).setOrigin(0.5).setDepth(3);
    y = illustY + 55;

    // Rules section
    const rules = [
      { icon: '1', text: 'TAP when the runner reaches\nan obstacle (in the glow zone)' },
      { icon: '2', text: 'Wrong timing = stumble!\nMissed obstacle = crash!' },
      { icon: '3', text: '3 stumbles/crashes = Game Over' },
      { icon: '4', text: 'Chain perfect taps for\ncombo multiplier up to x5!' }
    ];

    rules.forEach((r, i) => {
      const ry = y + i * 52;
      this.add.circle(30, ry + 12, 13, COLORS.RUNNER).setDepth(1);
      this.add.text(30, ry + 12, r.icon, {
        fontSize: '14px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFF'
      }).setOrigin(0.5).setDepth(2);
      this.add.text(54, ry, r.text, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#DDD',
        lineSpacing: 3
      }).setOrigin(0, 0).setDepth(1);
    });
    y += rules.length * 52 + 10;

    // Obstacle types
    this.add.text(w / 2, y, 'OBSTACLE TYPES', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS_HEX.RUNNER
    }).setOrigin(0.5, 0).setDepth(1);
    y += 28;

    const types = [
      { tex: 'wall', label: 'Wall - Vault Over', color: COLORS_HEX.WALL },
      { tex: 'bar', label: 'Bar - Slide Under', color: COLORS_HEX.BAR },
      { tex: 'gap', label: 'Gap - Wall Jump', color: COLORS_HEX.GAP }
    ];
    types.forEach((t, i) => {
      const ty = y + i * 32;
      this.add.image(40, ty + 8, t.tex).setScale(0.8).setDepth(2);
      this.add.text(70, ty, t.label, {
        fontSize: '13px', fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold', color: t.color
      }).setDepth(1);
    });
    y += types.length * 32 + 14;

    // Tips
    this.add.text(w / 2, y, 'TIPS', {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
      color: COLORS_HEX.COMBO_GLOW
    }).setOrigin(0.5, 0).setDepth(1);
    y += 26;
    const tips = [
      'Watch for the glow - tap inside it!',
      'Don\'t panic-tap between obstacles',
      'Perfects give 2x combo build speed'
    ];
    tips.forEach((tip, i) => {
      this.add.text(30, y + i * 22, '* ' + tip, {
        fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#BBB'
      }).setDepth(1);
    });
    y += tips.length * 22 + 20;

    // Got it button
    const btnY = Math.min(y + 10, h - 40);
    const btnBg = this.add.rectangle(w / 2, btnY, 160, 44, COLORS.RUNNER)
      .setInteractive({ useHandCursor: true }).setDepth(2);
    this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '22px', fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#FFF'
    }).setOrigin(0.5).setDepth(3).disableInteractive();
    btnBg.on('pointerdown', () => {
      SFX.play('click');
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }
}
