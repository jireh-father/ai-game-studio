class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x0a0e1a);

    // Title
    this.add.text(w/2, 90, 'CONNECTIONS', {
      fontFamily: 'Arial Black', fontSize: '36px', color: '#f4c20d',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(w/2, 130, 'COLLAPSE', {
      fontFamily: 'Arial Black', fontSize: '36px', color: '#5ac8fa',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);
    this.add.text(w/2, 168, 'Find the hidden groups. Fast.', {
      fontFamily: 'Arial', fontSize: '14px', color: '#ccc'
    }).setOrigin(0.5);

    // Storyboard demo area (first 10s teaser animation)
    const demoY = 230;
    const demoBox = this.add.rectangle(w/2, demoY + 60, w - 40, 150, 0x121a2e).setStrokeStyle(2, 0x3a4a6a);
    this.add.text(w/2, demoY, 'HOW IT WORKS', {
      fontFamily: 'Arial Black', fontSize: '13px', color: '#ffd700'
    }).setOrigin(0.5);

    this.createDemo(w/2, demoY + 70);

    // Buttons
    const mkBtn = (y, label, color, cb) => {
      const bg = this.add.rectangle(w/2, y, 220, 50, color).setStrokeStyle(3, 0xffffff).setInteractive();
      this.add.text(w/2, y, label, {
        fontFamily: 'Arial Black', fontSize: '20px', color: '#1a1208'
      }).setOrigin(0.5).disableInteractive();
      bg.on('pointerdown', () => {
        Effects.selectSound();
        this.tweens.add({ targets: bg, scale: 0.95, duration: 60, yoyo: true, onComplete: cb });
      });
    };

    mkBtn(460, 'PLAY', 0x4cd964, () => {
      this.scene.start('GameScene');
    });
    mkBtn(520, 'HOW TO PLAY', 0xf4c20d, () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { returnTo: 'MenuScene' });
    });

    // High score
    const hi = parseInt(localStorage.getItem('connections-collapse_high_score') || '0', 10);
    this.add.text(w/2, 590, 'HIGH SCORE: ' + hi, {
      fontFamily: 'Arial Black', fontSize: '16px', color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(w/2, h - 20, 'v1.0', {
      fontFamily: 'Arial', fontSize: '11px', color: '#555'
    }).setOrigin(0.5);
  }

  createDemo(cx, cy) {
    // 4 small cards animating: connect → explode → drop
    const colors = [0xf4c20d, 0xf4c20d, 0xf4c20d, 0xf4c20d];
    const boxes = [];
    for (let i = 0; i < 4; i++) {
      const r = this.add.rectangle(cx - 90 + i * 60, cy, 48, 30, colors[i]).setStrokeStyle(2, 0xffffff);
      boxes.push(r);
    }
    const g = this.add.graphics();

    const runDemo = () => {
      g.clear();
      boxes.forEach((b, i) => { b.setAlpha(1); b.setScale(1); });
      // Draw line progressively
      this.time.delayedCall(400, () => {
        g.lineStyle(3, 0xffe066, 1);
        g.beginPath();
        g.moveTo(boxes[0].x, boxes[0].y);
        g.lineTo(boxes[1].x, boxes[1].y);
        g.strokePath();
      });
      this.time.delayedCall(700, () => {
        g.lineBetween(boxes[1].x, boxes[1].y, boxes[2].x, boxes[2].y);
      });
      this.time.delayedCall(1000, () => {
        g.lineBetween(boxes[2].x, boxes[2].y, boxes[3].x, boxes[3].y);
      });
      // Explode
      this.time.delayedCall(1400, () => {
        boxes.forEach((b, i) => {
          Effects.burst(this, b.x, b.y, 0xf4c20d, 10);
          this.tweens.add({ targets: b, alpha: 0, scale: 1.5, duration: 300 });
        });
        g.clear();
      });
      // Loop
      this.time.delayedCall(2600, runDemo);
    };
    runDemo();
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }
  init(data) { this.finalScore = data.score || 0; this.finalStage = data.stage || 1; }
  create() {
    const w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x0a0e1a, 0.92);

    this.add.text(w/2, 120, 'GAME OVER', {
      fontFamily: 'Arial Black', fontSize: '40px', color: '#ff3355',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(w/2, 200, 'STAGE ' + this.finalStage, {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#fff'
    }).setOrigin(0.5);

    this.add.text(w/2, 240, 'SCORE', {
      fontFamily: 'Arial', fontSize: '16px', color: '#aaa'
    }).setOrigin(0.5);
    this.add.text(w/2, 275, String(this.finalScore), {
      fontFamily: 'Arial Black', fontSize: '44px', color: '#ffd700'
    }).setOrigin(0.5);

    // High score
    const hi = parseInt(localStorage.getItem('connections-collapse_high_score') || '0', 10);
    if (this.finalScore > hi) {
      localStorage.setItem('connections-collapse_high_score', String(this.finalScore));
      this.add.text(w/2, 330, 'NEW HIGH SCORE!', {
        fontFamily: 'Arial Black', fontSize: '20px', color: '#ffd700'
      }).setOrigin(0.5);
    } else {
      this.add.text(w/2, 330, 'BEST: ' + hi, {
        fontFamily: 'Arial', fontSize: '16px', color: '#888'
      }).setOrigin(0.5);
    }

    const mkBtn = (y, label, color, cb) => {
      const bg = this.add.rectangle(w/2, y, 220, 54, color).setStrokeStyle(3, 0xffffff).setInteractive();
      this.add.text(w/2, y, label, {
        fontFamily: 'Arial Black', fontSize: '20px', color: '#1a1208'
      }).setOrigin(0.5).disableInteractive();
      bg.on('pointerdown', cb);
    };
    mkBtn(430, 'RETRY', 0x4cd964, () => {
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('GameScene');
    });
    mkBtn(495, 'MENU', 0x5ac8fa, () => {
      this.scene.stop('GameScene');
      this.scene.stop();
      this.scene.start('MenuScene');
    });
  }
}
