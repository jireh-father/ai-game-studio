// Wrecking Swing - HUD & Pause Overlay
class HUD {
  static create(scene) {
    const isBoss = StageGenerator.isBossStage(window.WS.stage);
    const label = isBoss ? `BOSS ${window.WS.stage}` : `STAGE ${window.WS.stage}`;
    scene.stageText = scene.add.text(CONFIG.GAME_WIDTH / 2, 12, label, {
      fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: CONFIG.HEX.UI_TEXT
    }).setOrigin(0.5, 0).setDepth(10);

    scene.scoreText = scene.add.text(CONFIG.GAME_WIDTH - 10, 12, window.WS.score.toLocaleString(), {
      fontSize: '18px', fontFamily: 'Arial Black, sans-serif', fill: CONFIG.HEX.REWARD, fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(10);

    scene.swingDots = [];
    for (let i = 0; i < CONFIG.SWING_COUNT; i++) {
      const dot = scene.add.circle(30 + i * 24, CONFIG.GAME_HEIGHT - 30, 8,
        i < scene.swingsLeft ? CONFIG.COLORS.HIGHLIGHT : 0x333344);
      dot.setStrokeStyle(2, 0xFFFFFF).setDepth(10);
      scene.swingDots.push(dot);
    }

    if (window.WS.stage <= 3) {
      scene.tapHint = scene.add.text(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT - 60, 'TAP TO SWING', {
        fontSize: '16px', fontFamily: 'Arial, sans-serif', fill: CONFIG.HEX.UI_TEXT
      }).setOrigin(0.5).setAlpha(0.7).setDepth(10);
      scene.tweens.add({ targets: scene.tapHint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    }

    const pauseBtn = scene.add.text(16, 10, '||', {
      fontSize: '20px', fill: CONFIG.HEX.UI_TEXT, fontFamily: 'Arial Black, sans-serif'
    }).setInteractive().setDepth(10);
    pauseBtn.on('pointerdown', (p) => { p.event.stopPropagation(); scene.showPause(); });
  }

  static updateSwingDots(scene) {
    scene.swingDots.forEach((dot, i) => {
      dot.fillColor = i < scene.swingsLeft ? CONFIG.COLORS.HIGHLIGHT : 0x333344;
    });
  }

  static showPause(scene) {
    scene.paused = true;
    scene.matter.world.pause();
    scene.pauseOverlay = scene.add.container(0, 0).setDepth(100);
    const bg = scene.add.rectangle(CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2,
      CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT, 0x000000, 0.8);
    scene.pauseOverlay.add(bg);
    const cx = CONFIG.GAME_WIDTH / 2;
    const t = scene.add.text(cx, 200, 'PAUSED', {
      fontSize: '36px', fontFamily: 'Arial Black, sans-serif', fill: CONFIG.HEX.UI_TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);
    scene.pauseOverlay.add(t);

    const makeBtn = (y, label, color, cb) => {
      const btn = scene.add.rectangle(cx, y, 200, 50, color).setInteractive();
      const txt = scene.add.text(cx, y, label, {
        fontSize: '20px', fontFamily: 'Arial, sans-serif', fill: '#FFFFFF', fontStyle: 'bold'
      }).setOrigin(0.5);
      btn.on('pointerdown', cb);
      scene.pauseOverlay.add([btn, txt]);
    };
    makeBtn(310, 'RESUME', CONFIG.COLORS.HIGHLIGHT, () => HUD.resumeGame(scene));
    makeBtn(380, 'RESTART', 0x555566, () => {
      scene.pauseOverlay.destroy(); scene.paused = false; scene.matter.world.resume();
      window.WS.swingsLeft = CONFIG.SWING_COUNT; scene.scene.restart();
    });
    makeBtn(450, 'MENU', 0x333344, () => {
      scene.pauseOverlay.destroy(); scene.paused = false; scene.matter.world.resume();
      scene.scene.start('GameOverScene');
    });
  }

  static resumeGame(scene) {
    scene.pauseOverlay.destroy();
    scene.paused = false;
    scene.matter.world.resume();
    scene.lastTapTime = scene.time.now;
  }
}
