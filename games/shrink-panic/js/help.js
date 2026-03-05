// Shrink Panic - Help Scene
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this.returnTo = data.returnTo || 'MenuScene';
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // Background overlay
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.92).setDepth(0);

    let y = 30;
    const cx = w / 2;

    // Title
    this.add.text(cx, y, 'HOW TO PLAY', {
      fontSize: '28px', fontFamily: 'Arial', color: '#00FFFF', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    y += 40;

    this.add.text(cx, y, 'Your screen SHRINKS every second!\nTap targets before it disappears.', {
      fontSize: '14px', fontFamily: 'Arial', color: '#AAAAAA', align: 'center', lineSpacing: 4
    }).setOrigin(0.5, 0);
    y += 50;

    // Viewport diagram
    const bx = cx, by = y + 50;
    // Outer void
    this.add.rectangle(bx, by, 160, 100, 0x111111).setStrokeStyle(1, 0x333333);
    // Inner viewport
    const inner = this.add.rectangle(bx, by, 100, 60, 0x0A0E27)
      .setStrokeStyle(2, 0x00FFFF);
    this.tweens.add({ targets: inner, scaleX: 0.7, scaleY: 0.7, duration: 2000, yoyo: true, repeat: -1 });
    // Targets inside
    this.add.circle(bx - 20, by - 10, 6, 0x39FF14);
    this.add.circle(bx + 15, by + 8, 6, 0x39FF14);
    this.add.circle(bx + 30, by - 15, 4, 0xFF1493);
    // Label
    this.add.text(bx, by + 60, 'Viewport shrinks inward', {
      fontSize: '12px', fontFamily: 'Arial', color: '#00FFFF'
    }).setOrigin(0.5, 0);
    y += 130;

    // Controls section
    this._section(cx, y, 'CONTROLS');
    y += 25;

    // Tap illustration
    this.add.circle(cx - 60, y + 15, 12, 0x39FF14, 0.8);
    this.add.text(cx - 60, y + 15, 'TAP', {
      fontSize: '9px', fontFamily: 'Arial', color: '#000', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(cx + 10, y + 10, 'Tap targets to score\n+expand energy', {
      fontSize: '13px', fontFamily: 'Arial', color: '#CCCCCC', lineSpacing: 2
    }).setOrigin(0, 0.5);
    y += 40;

    // Double tap illustration
    this.add.star(cx - 60, y + 15, 5, 5, 12, 0x00BFFF);
    this.add.text(cx - 60, y + 15, '2x', {
      fontSize: '10px', fontFamily: 'Arial', color: '#000', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(cx + 10, y + 10, 'Double-tap with 5 energy\nto EXPAND viewport', {
      fontSize: '13px', fontFamily: 'Arial', color: '#CCCCCC', lineSpacing: 2
    }).setOrigin(0, 0.5);
    y += 50;

    // Rules
    this._section(cx, y, 'RULES');
    y += 25;
    const rules = [
      { icon: 'X', iconCol: '#DC143C', text: 'Red targets are DECOYS - avoid!' },
      { icon: '♥', iconCol: '#FF0000', text: 'Miss 3 targets = 20% viewport collapse' },
      { icon: '!', iconCol: '#FFA500', text: 'Idle 2s = 3x shrink speed' },
      { icon: '*', iconCol: '#FFD700', text: 'Gold stars are worth 250 points (fast!)' }
    ];
    rules.forEach(r => {
      this.add.text(cx - 80, y, r.icon, {
        fontSize: '16px', fontFamily: 'Arial', color: r.iconCol, fontStyle: 'bold'
      }).setOrigin(0.5, 0);
      this.add.text(cx - 60, y, r.text, {
        fontSize: '12px', fontFamily: 'Arial', color: '#CCCCCC'
      }).setOrigin(0, 0);
      y += 22;
    });
    y += 10;

    // Tips
    this._section(cx, y, 'TIPS');
    y += 25;
    const tips = [
      'Edge targets give 2x points - risk it!',
      'Save expansion for emergencies (< 25%)',
      'Chain taps within 0.8s for combo bonus'
    ];
    tips.forEach(tip => {
      this.add.text(cx, y, '> ' + tip, {
        fontSize: '12px', fontFamily: 'Arial', color: '#39FF14'
      }).setOrigin(0.5, 0);
      y += 20;
    });
    y += 15;

    // Got it button
    const btnBg = this.add.rectangle(cx, y + 10, 160, 40, 0x00FFFF, 0.2)
      .setStrokeStyle(2, 0x00FFFF).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(cx, y + 10, 'Got it!', {
      fontSize: '20px', fontFamily: 'Arial', color: '#00FFFF', fontStyle: 'bold'
    }).setOrigin(0.5);
    btnTxt.disableInteractive();
    btnBg.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume(this.returnTo);
    });
  }

  _section(x, y, title) {
    this.add.text(x, y, '--- ' + title + ' ---', {
      fontSize: '14px', fontFamily: 'Arial', color: '#00FFFF', fontStyle: 'bold'
    }).setOrigin(0.5, 0);
  }
}

// Pause scene
class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.7);

    this.add.text(w / 2, h * 0.3, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial', color: '#FFFFFF', fontStyle: 'bold'
    }).setOrigin(0.5);

    this._btn(w / 2, h * 0.45, 'Resume', () => {
      this.scene.stop(); this.scene.resume('GameScene');
      const gs = this.scene.get('GameScene'); if (gs) gs.paused = false;
    });
    this._btn(w / 2, h * 0.55, 'How to Play', () => {
      this.scene.stop();
      this.scene.launch('HelpScene', { returnTo: 'GameScene' });
    });
    this._btn(w / 2, h * 0.65, 'Restart', () => {
      this.scene.stop(); this.scene.stop('GameScene'); this.scene.start('GameScene');
    });
    this._btn(w / 2, h * 0.75, 'Menu', () => {
      this.scene.stop(); this.scene.stop('GameScene'); this.scene.start('MenuScene');
    });
  }

  _btn(x, y, label, cb) {
    const bg = this.add.rectangle(x, y, 180, 36, 0x1a1a3a, 0.9)
      .setStrokeStyle(2, 0x00FFFF).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: '18px', fontFamily: 'Arial', color: '#FFFFFF'
    }).setOrigin(0.5);
    txt.disableInteractive();
    bg.on('pointerdown', cb);
  }
}
