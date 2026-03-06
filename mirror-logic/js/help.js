// Mirror Logic - HelpScene

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0E1A, 0.95).setInteractive();

    // Scrollable content via camera
    let yPos = 30;
    const left = 30, right = w - 30;
    const cw = right - left;

    // Title
    this.add.text(w / 2, yPos, 'HOW TO PLAY', { fontSize: '28px', fontFamily: 'monospace', color: COLORS.TARGET, fontStyle: 'bold' }).setOrigin(0.5, 0);
    yPos += 50;

    this.add.text(w / 2, yPos, 'Route the laser through targets\nin the correct order!', { fontSize: '14px', fontFamily: 'monospace', color: COLORS.UI_TEXT, align: 'center', wordWrap: { width: cw } }).setOrigin(0.5, 0);
    yPos += 55;

    // Section 1: Controls
    this.addSection(w / 2, yPos, 'CONTROLS'); yPos += 30;

    // Control diagrams using game graphics
    const diagramY = yPos;
    const diagramSpacing = w / 3;

    // Tap empty -> place mirror
    this.add.image(diagramSpacing * 0.5, diagramY + 20, 'cell').setDisplaySize(36, 36);
    this.add.text(diagramSpacing * 0.5, diagramY + 46, 'TAP', { fontSize: '10px', fontFamily: 'monospace', color: COLORS.MIRROR }).setOrigin(0.5, 0);
    this.add.text(diagramSpacing * 0.5, diagramY - 6, 'Empty', { fontSize: '10px', fontFamily: 'monospace', color: COLORS.UI_TEXT }).setOrigin(0.5, 0);

    // Arrow
    this.add.text(diagramSpacing, diagramY + 20, '->', { fontSize: '16px', fontFamily: 'monospace', color: COLORS.LASER }).setOrigin(0.5);

    // Mirror placed
    this.add.image(diagramSpacing * 1.5, diagramY + 20, 'mirror45').setDisplaySize(36, 36);
    this.add.text(diagramSpacing * 1.5, diagramY + 46, 'Place', { fontSize: '10px', fontFamily: 'monospace', color: COLORS.SUCCESS }).setOrigin(0.5, 0);

    // Arrow
    this.add.text(diagramSpacing * 2, diagramY + 20, '->', { fontSize: '16px', fontFamily: 'monospace', color: COLORS.LASER }).setOrigin(0.5);

    // Mirror rotated
    this.add.image(diagramSpacing * 2.5, diagramY + 20, 'mirror135').setDisplaySize(36, 36);
    this.add.text(diagramSpacing * 2.5, diagramY + 46, 'Rotate', { fontSize: '10px', fontFamily: 'monospace', color: COLORS.TARGET_HIT }).setOrigin(0.5, 0);

    yPos += 75;

    this.add.text(w / 2, yPos, 'TAP empty = Place mirror\nTAP mirror = Rotate (/ <-> \\)\nHOLD mirror = Remove', { fontSize: '13px', fontFamily: 'monospace', color: COLORS.UI_TEXT, align: 'center', wordWrap: { width: cw } }).setOrigin(0.5, 0);
    yPos += 60;

    // Section 2: Rules
    this.addSection(w / 2, yPos, 'RULES'); yPos += 30;

    this.add.text(w / 2, yPos, 'Hit targets IN ORDER: 1 -> 2 -> 3...', { fontSize: '14px', fontFamily: 'monospace', color: COLORS.SUCCESS, align: 'center' }).setOrigin(0.5, 0);
    yPos += 25;

    this.add.text(w / 2, yPos, 'Wrong order = BOOM!', { fontSize: '14px', fontFamily: 'monospace', color: COLORS.LASER, align: 'center' }).setOrigin(0.5, 0);
    yPos += 25;

    this.add.text(w / 2, yPos, 'Timer runs out = BOOM!', { fontSize: '14px', fontFamily: 'monospace', color: COLORS.TIMER_WARNING, align: 'center' }).setOrigin(0.5, 0);
    yPos += 25;

    // Diagram: correct vs wrong
    const dy = yPos + 5;
    this.add.image(w * 0.3, dy + 20, 'target_1').setDisplaySize(28, 28);
    this.add.text(w * 0.3 + 20, dy + 20, '->', { fontSize: '12px', fontFamily: 'monospace', color: COLORS.SUCCESS }).setOrigin(0, 0.5);
    this.add.image(w * 0.55, dy + 20, 'target_2').setDisplaySize(28, 28);
    this.add.text(w * 0.75, dy + 20, 'OK', { fontSize: '14px', fontFamily: 'monospace', color: COLORS.SUCCESS, fontStyle: 'bold' }).setOrigin(0.5);
    yPos += 55;

    // Section 3: Scoring
    this.addSection(w / 2, yPos, 'SCORING'); yPos += 30;

    this.add.text(w / 2, yPos, 'Clear fast = Time bonus\nNo removals = Perfect bonus\nStreak = Score multiplier!', { fontSize: '13px', fontFamily: 'monospace', color: COLORS.UI_TEXT, align: 'center', wordWrap: { width: cw } }).setOrigin(0.5, 0);
    yPos += 60;

    // Section 4: Tips
    this.addSection(w / 2, yPos, 'TIPS'); yPos += 30;

    const tips = [
      '1. Plan the path before placing',
      '2. Work backwards from last target',
      '3. / and \\ make all the difference!'
    ];
    tips.forEach(tip => {
      this.add.text(w / 2, yPos, tip, { fontSize: '13px', fontFamily: 'monospace', color: COLORS.TARGET_HIT, align: 'center', wordWrap: { width: cw } }).setOrigin(0.5, 0);
      yPos += 22;
    });
    yPos += 15;

    // Got it button
    const gotBtn = this.add.rectangle(w / 2, yPos + 10, 180, 52, 0x0A0E1A).setStrokeStyle(3, 0x44FF88).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, yPos + 10, 'GOT IT!', { fontSize: '22px', fontFamily: 'monospace', color: COLORS.SUCCESS, fontStyle: 'bold' }).setOrigin(0.5);

    gotBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }

  addSection(x, y, title) {
    this.add.text(x, y, `-- ${title} --`, { fontSize: '16px', fontFamily: 'monospace', color: COLORS.LASER, fontStyle: 'bold' }).setOrigin(0.5, 0);
  }
}
