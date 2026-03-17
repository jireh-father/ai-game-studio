// Gravity Liar - Help Scene

class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;

    // Background
    this.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F, 0.95).setDepth(0);

    // Scrollable content area
    const startY = 30;
    let y = startY;

    // Title
    this.add.text(w / 2, y, 'GRAVITY LIAR', {
      fontSize: '24px', fontFamily: 'Arial', fill: '#00E5FF', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 32;

    this.add.text(w / 2, y, 'The arrow lies. Will you?', {
      fontSize: '13px', fontFamily: 'Arial', fill: '#B0BEC5', fontStyle: 'italic'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 30;

    // Section: The Arena
    this.add.text(w / 2, y, '--- THE ARENA ---', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#FFD600'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 22;

    // Ball illustration
    this.add.image(80, y + 16, 'ball').setScale(0.6).setDepth(1);
    this.add.text(80, y + 36, 'Ball', {
      fontSize: '10px', fontFamily: 'Arial', fill: '#B0BEC5'
    }).setOrigin(0.5, 0).setDepth(1);

    // Arrow illustration
    this.add.image(180, y + 16, 'arrow').setScale(0.5).setDepth(1);
    this.add.text(180, y + 36, 'Arrow', {
      fontSize: '10px', fontFamily: 'Arial', fill: '#B0BEC5'
    }).setOrigin(0.5, 0).setDepth(1);

    // Death zone
    this.add.rectangle(280, y + 16, 60, 16, COLORS.deathZone).setDepth(1);
    this.add.text(280, y + 36, 'Death Zone', {
      fontSize: '10px', fontFamily: 'Arial', fill: '#B0BEC5'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 58;

    // Section: Controls
    this.add.text(w / 2, y, '--- CONTROLS ---', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#FFD600'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 22;

    // Left/right tap diagram
    this.add.rectangle(w / 4, y + 40, w / 2 - 10, 70, 0x1A1A2E).setDepth(1);
    this.add.rectangle(3 * w / 4, y + 40, w / 2 - 10, 70, 0x1A1A2E).setDepth(1);
    this.add.text(w / 4, y + 30, 'TAP LEFT', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#00E5FF', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(2);
    this.add.text(w / 4, y + 50, '<< Push ball left', {
      fontSize: '10px', fontFamily: 'Arial', fill: '#B0BEC5'
    }).setOrigin(0.5, 0).setDepth(2);
    this.add.text(3 * w / 4, y + 30, 'TAP RIGHT', {
      fontSize: '14px', fontFamily: 'Arial', fill: '#00E5FF', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(2);
    this.add.text(3 * w / 4, y + 50, 'Push ball right >>', {
      fontSize: '10px', fontFamily: 'Arial', fill: '#B0BEC5'
    }).setOrigin(0.5, 0).setDepth(2);
    y += 90;

    // Section: The Lie
    this.add.text(w / 2, y, '--- THE LIE ---', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#FFD600'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 20;

    this.add.text(w / 2, y, 'The arrow claims to show gravity direction.', {
      fontSize: '11px', fontFamily: 'Arial', fill: '#E8E8F0'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 16;
    this.add.text(w / 2, y, 'It LIES. Watch the BALL, not the arrow!', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#FF5252', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 28;

    // Arrow up + ball down illustration
    this.add.image(120, y + 14, 'arrow').setScale(0.4).setAngle(180).setDepth(1);
    this.add.text(120, y + 36, 'Arrow says UP', {
      fontSize: '9px', fontFamily: 'Arial', fill: '#B0BEC5'
    }).setOrigin(0.5, 0).setDepth(1);
    this.add.image(240, y + 14, 'ball').setScale(0.4).setDepth(1);
    this.add.text(240, y + 36, 'Ball falls DOWN', {
      fontSize: '9px', fontFamily: 'Arial', fill: '#FF5252'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 56;

    // Section: Stages
    this.add.text(w / 2, y, '--- LIE STAGES ---', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#FFD600'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 18;

    const stageInfo = [
      'Stage 1: Arrow is honest. Learn the feel.',
      'Stage 3+: Arrow starts lying. Observe carefully.',
      'Stage 7+: Arrow changes its lie mid-stage!',
      'Stage 12+: Two arrows. One truth, one lie.'
    ];
    stageInfo.forEach(line => {
      this.add.text(w / 2, y, line, {
        fontSize: '10px', fontFamily: 'Arial', fill: '#E8E8F0'
      }).setOrigin(0.5, 0).setDepth(1);
      y += 16;
    });
    y += 10;

    // Section: Tips
    this.add.text(w / 2, y, '--- TIPS ---', {
      fontSize: '12px', fontFamily: 'Arial', fill: '#FFD600'
    }).setOrigin(0.5, 0).setDepth(1);
    y += 18;

    const tips = [
      'Build Deduction Streaks for score multipliers!',
      'Clear a stage first try for +300 bonus.',
      'Rest stages every 5th stage - breathe!'
    ];
    tips.forEach(t => {
      this.add.text(w / 2, y, t, {
        fontSize: '10px', fontFamily: 'Arial', fill: '#B0BEC5'
      }).setOrigin(0.5, 0).setDepth(1);
      y += 16;
    });
    y += 16;

    // GOT IT button - fixed position near bottom
    const btnY = Math.min(y + 10, h - 60);
    const gotItBtn = this.add.rectangle(w / 2, btnY, 200, 48, COLORS.correctTap)
      .setDepth(2).setInteractive({ useHandCursor: true });
    this.add.text(w / 2, btnY, 'GOT IT!', {
      fontSize: '18px', fontFamily: 'Arial', fill: '#000000', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    gotItBtn.on('pointerdown', () => {
      playUIClick();
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });

    // Full-screen fallback tap zone behind everything
    const fallback = this.add.rectangle(w / 2, h - 30, w, 60, 0x000000, 0)
      .setDepth(1).setInteractive();
    fallback.on('pointerdown', () => {
      playUIClick();
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }
}
