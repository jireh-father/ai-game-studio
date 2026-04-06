class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }
  init(data) { this.returnTo = data.returnTo || 'MenuScene'; }

  create() {
    const W = this.scale.width, H = this.scale.height;
    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0xfff8e7, 1).setDepth(0);

    // Scroll container via camera
    let scrollY = 0;
    const contentH = 750;

    // Title
    this.add.text(W / 2, 30, 'HOW TO PLAY', { fontSize: '24px', fill: COL.TEXT, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5, 0);

    // Section 1: Swipe controls diagram
    this.add.text(W / 2, 70, 'CONTROLS', { fontSize: '16px', fill: COL.ACCENT, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5, 0);

    // Lane boxes
    const laneY = 110, laneH = 50;
    this.add.rectangle(60, laneY + laneH / 2, 90, laneH, 0xeeeeee).setStrokeStyle(1.5, 0xbdc3c7);
    this.add.rectangle(W / 2, laneY + laneH / 2, 90, laneH, 0x5bc8f5).setStrokeStyle(2, 0x2c3e50);
    this.add.rectangle(W - 60, laneY + laneH / 2, 90, laneH, 0xeeeeee).setStrokeStyle(1.5, 0xbdc3c7);
    this.add.text(60, laneY + laneH / 2, 'LEFT', { fontSize: '14px', fill: '#7F8C8D', fontFamily: 'Arial' }).setOrigin(0.5);
    this.add.text(W / 2, laneY + laneH / 2, 'YOU', { fontSize: '14px', fill: COL.TEXT, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(W - 60, laneY + laneH / 2, 'RIGHT', { fontSize: '14px', fill: '#7F8C8D', fontFamily: 'Arial' }).setOrigin(0.5);

    // Arrows
    const arrowLeft = this.add.text(125, laneY + laneH / 2, '<--', { fontSize: '20px', fill: COL.DANGER, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    const arrowRight = this.add.text(W - 125, laneY + laneH / 2, '-->', { fontSize: '20px', fill: COL.DANGER, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(90, laneY + laneH + 10, 'SWIPE LEFT', { fontSize: '11px', fill: COL.DANGER, fontFamily: 'Arial' }).setOrigin(0.5, 0);
    this.add.text(W - 90, laneY + laneH + 10, 'SWIPE RIGHT', { fontSize: '11px', fill: COL.DANGER, fontFamily: 'Arial' }).setOrigin(0.5, 0);

    this.add.text(W / 2, 195, 'Swipe LEFT or RIGHT anywhere\nto dodge grandma\'s attacks!', { fontSize: '15px', fill: COL.TEXT, fontFamily: 'Arial', align: 'center' }).setOrigin(0.5, 0);

    // Section 2: Projectiles
    this.add.text(W / 2, 250, 'PROJECTILES', { fontSize: '16px', fill: COL.ACCENT, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5, 0);

    const projY = 290;
    const projNames = ['Slipper', 'Remote', 'Pot', 'Grandma!'];
    const projKeys = ['slipper', 'remote', 'pot', 'grandma_ball'];
    const projX = [55, 145, 235, 325];
    projKeys.forEach((key, i) => {
      if (this.textures.exists(key)) {
        this.add.image(projX[i], projY, key).setScale(key === 'grandma_ball' ? 0.6 : 0.9);
      }
      this.add.text(projX[i], projY + 30, projNames[i], { fontSize: '11px', fill: COL.TEXT, fontFamily: 'Arial' }).setOrigin(0.5, 0);
    });
    if (this.textures.exists('grandma_ball')) {
      this.add.text(325, projY - 30, 'BOSS!', { fontSize: '10px', fill: COL.DANGER, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5, 0);
    }

    this.add.text(W / 2, 345, 'Projectiles get deadlier\nas grandma gets angrier!', { fontSize: '14px', fill: COL.TEXT, fontFamily: 'Arial', align: 'center' }).setOrigin(0.5, 0);

    // Section 3: HP
    this.add.text(W / 2, 395, 'HEALTH', { fontSize: '16px', fill: COL.ACCENT, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5, 0);

    const heartY = 430;
    for (let i = 0; i < 5; i++) {
      const key = i < 3 ? 'heart_full' : 'heart_empty';
      if (this.textures.exists(key)) {
        this.add.image(W / 2 - 50 + i * 25, heartY, key).setScale(1.3);
      }
    }
    this.add.text(W / 2, heartY + 22, 'You have 5 HP. Lose all = GRANDMA WINS!', { fontSize: '13px', fill: COL.TEXT, fontFamily: 'Arial' }).setOrigin(0.5, 0);

    // Section 4: Tips
    this.add.text(W / 2, 485, 'TIPS', { fontSize: '16px', fill: COL.ACCENT, fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5, 0);

    const tips = [
      'Move DURING grandma\'s wind-up\n  she aims where you ARE!',
      'Survive the full stage timer\n  to advance to next stage',
      'Double-swipe quickly for\n  a 2-lane leap!',
      'Stay still too long and grandma\n  will target you directly!'
    ];
    tips.forEach((tip, i) => {
      this.add.text(30, 515 + i * 45, '  ' + tip, { fontSize: '13px', fill: COL.TEXT, fontFamily: 'Arial', lineSpacing: 2 });
    });

    // GOT IT button at fixed position from bottom
    const btnY = H - 60;
    const btn = this.add.rectangle(W / 2, btnY, 200, 55, 0xe74c3c).setInteractive({ useHandCursor: true });
    btn.setStrokeStyle(2, 0xc0392b);
    const btnText = this.add.text(W / 2, btnY, 'GOT IT!', { fontSize: '22px', fill: '#FFF', fontFamily: 'Arial', fontStyle: 'bold' }).setOrigin(0.5);

    // Full-screen fallback tap zone
    const fallback = this.add.rectangle(W / 2, btnY, W, 80, 0x000000, 0).setInteractive();

    const dismiss = () => {
      Effects.playSound('click');
      this.scene.stop();
      if (this.returnTo === 'GameScene') {
        const gs = this.scene.get('GameScene');
        if (gs && gs.paused) gs.togglePause();
        this.scene.resume('GameScene');
      } else {
        this.scene.resume(this.returnTo);
      }
    };
    btn.on('pointerdown', dismiss);
    fallback.on('pointerdown', dismiss);
  }
}
