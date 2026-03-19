// hud.js — HUD creation, pause overlay, streak display, visual effects

function createHUD(scene) {
  const { WIDTH } = GAME_CONFIG;

  scene.scoreText = scene.add.text(15, 15, 'SCORE: ' + GameState.score, {
    fontSize: '16px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.HUD_TEXT
  });

  scene.stageText = scene.add.text(WIDTH / 2, 15, 'STG: ' + GameState.stage, {
    fontSize: '16px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.HUD_TEXT
  }).setOrigin(0.5, 0);

  const pauseBtn = scene.add.text(WIDTH - 15, 15, '||', {
    fontSize: '20px', fontFamily: 'Arial Black', color: COLORS.HUD_TEXT
  }).setOrigin(1, 0).setInteractive().setPadding(10);
  pauseBtn.on('pointerdown', () => showPauseOverlay(scene));

  scene.streakText = scene.add.text(WIDTH / 2, GAME_CONFIG.STREAK_Y, '', {
    fontSize: '18px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.STREAK_GOLD
  }).setOrigin(0.5);
}

function updateScoreHUD(scene, totalPoints) {
  scene.scoreText.setText('SCORE: ' + GameState.score);
  scene.tweens.add({ targets: scene.scoreText, scaleX: 1.25, scaleY: 1.25, duration: 100, yoyo: true });

  // Float text
  const btn = scene.buttons[scene._lastSurvivedBtn];
  if (btn) {
    const ft = scene.add.text(btn.x, btn.y, '+' + totalPoints, {
      fontSize: '22px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.HUD_TEXT
    }).setOrigin(0.5);
    scene.tweens.add({
      targets: ft, y: btn.y - 55, alpha: 0, duration: 500,
      onComplete: () => ft.destroy()
    });
  }
}

function updateStreakDisplay(scene) {
  const s = GameState.streak;
  if (s < 2) { scene.streakText.setText(''); return; }

  const mult = SCORE.getMultiplier(s);
  scene.streakText.setText('STREAK: x' + s + ' (' + mult + 'x)');

  const milestones = [20, 10, 5, 2];
  for (const m of milestones) {
    if (s === m) {
      const scale = m >= 20 ? 2.0 : m >= 10 ? 1.7 : m >= 5 ? 1.5 : 1.3;
      scene.tweens.add({
        targets: scene.streakText, scaleX: scale, scaleY: scale,
        duration: 200, yoyo: true, ease: 'Back.easeOut'
      });

      if (m >= 5) {
        const count = m >= 20 ? 16 : m >= 10 ? 12 : 8;
        spawnParticles(scene, scene.streakText.x, scene.streakText.y, count);
      }

      if (m >= 20) {
        const unstop = scene.add.text(GAME_CONFIG.WIDTH / 2, -30, 'UNSTOPPABLE!', {
          fontSize: '28px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.STREAK_GOLD
        }).setOrigin(0.5);
        scene.tweens.add({
          targets: unstop, y: GAME_CONFIG.HEIGHT / 2, duration: 400, ease: 'Back.easeOut',
          onComplete: () => {
            scene.tweens.add({ targets: unstop, alpha: 0, duration: 600, delay: 400, onComplete: () => unstop.destroy() });
          }
        });
      }
      break;
    }
  }
}

function spawnParticles(scene, x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const p = scene.add.circle(x, y, 5, 0xFFD700, 1);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * 50,
      y: y + Math.sin(angle) * 50,
      scaleX: 0.2, scaleY: 0.2, alpha: 0,
      duration: 400,
      onComplete: () => p.destroy()
    });
  }
}

function showPauseOverlay(scene) {
  if (scene.gameOver || scene.pauseOverlay) return;
  if (scene.timerTween) scene.timerTween.pause();

  const { WIDTH, HEIGHT } = GAME_CONFIG;
  scene.pauseOverlay = scene.add.container(0, 0).setDepth(50);

  const bg = scene.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0D1B2A, 0.85);
  scene.pauseOverlay.add(bg);

  const title = scene.add.text(WIDTH / 2, 150, 'PAUSED', {
    fontSize: '28px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.HUD_TEXT
  }).setOrigin(0.5);
  scene.pauseOverlay.add(title);

  const makeBtn = (y, label, color, cb) => {
    const r = scene.add.rectangle(WIDTH / 2, y, 240, 50, color, 1).setInteractive();
    const t = scene.add.text(WIDTH / 2, y, label, {
      fontSize: '18px', fontFamily: 'Arial Black', fontStyle: 'bold', color: '#FFFFFF'
    }).setOrigin(0.5);
    r.on('pointerdown', cb);
    scene.pauseOverlay.add(r);
    scene.pauseOverlay.add(t);
  };

  makeBtn(240, 'RESUME', 0x00F5D4, () => resumeGame(scene));
  makeBtn(310, 'HOW TO PLAY', 0x2E4057, () => {
    scene.scene.pause('GameScene');
    scene.scene.launch('HelpScene', { returnTo: 'GameScene' });
  });
  makeBtn(380, 'RESTART', 0x2E4057, () => {
    destroyPauseOverlay(scene);
    GameState.reset();
    scene.scene.stop('GameScene');
    scene.scene.start('GameScene');
  });
  makeBtn(450, 'QUIT TO MENU', 0x8B1A1A, () => {
    destroyPauseOverlay(scene);
    scene.scene.stop('GameScene');
    scene.scene.start('MenuScene');
  });
}

function resumeGame(scene) {
  destroyPauseOverlay(scene);
  if (scene.timerTween && !scene.gameOver) scene.timerTween.resume();
}

function destroyPauseOverlay(scene) {
  if (scene.pauseOverlay) {
    scene.pauseOverlay.destroy(true);
    scene.pauseOverlay = null;
  }
}

function showStageBanner(scene, callback) {
  const banner = scene.add.text(GAME_CONFIG.WIDTH / 2, -40, 'STAGE ' + GameState.stage, {
    fontSize: '32px', fontFamily: 'Arial Black', fontStyle: 'bold', color: COLORS.ACCENT_TEAL
  }).setOrigin(0.5).setDepth(20);

  scene.tweens.add({
    targets: banner, y: GAME_CONFIG.HEIGHT / 2 - 30, duration: 400, ease: 'Bounce.easeOut',
    onComplete: () => {
      scene.time.delayedCall(800, () => {
        scene.tweens.add({
          targets: banner, y: -40, alpha: 0, duration: 300,
          onComplete: () => { banner.destroy(); if (callback) callback(); }
        });
      });
    }
  });
}
