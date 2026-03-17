// Gravity Liar - HUD & Pause Overlay

function createHUD(scene) {
  const w = GAME_WIDTH;
  scene.add.rectangle(w / 2, HUD_HEIGHT / 2, w, HUD_HEIGHT, COLORS.hudBg).setDepth(10);

  scene.scoreText = scene.add.text(10, HUD_HEIGHT / 2, '' + GameState.score, {
    fontSize: '16px', fontFamily: 'Arial', fill: COLORS.scoreText, fontStyle: 'bold'
  }).setOrigin(0, 0.5).setDepth(11);

  scene.stageText = scene.add.text(w / 2, HUD_HEIGHT / 2, 'Stage ' + GameState.stage, {
    fontSize: '14px', fontFamily: 'Arial', fill: COLORS.stageText
  }).setOrigin(0.5).setDepth(11);

  // Lives dots
  scene.liveDots = [];
  for (let i = 0; i < LIVES_MAX; i++) {
    const dot = scene.add.circle(w - 70 + i * 16, HUD_HEIGHT / 2, 5,
      i < GameState.lives ? COLORS.livesOn : COLORS.livesOff).setDepth(11);
    scene.liveDots.push(dot);
  }

  // Pause button
  const pauseBtn = scene.add.rectangle(w - 22, HUD_HEIGHT / 2, 44, 44, 0x000000, 0)
    .setDepth(12).setInteractive({ useHandCursor: true });
  scene.add.text(w - 22, HUD_HEIGHT / 2, '||', {
    fontSize: '16px', fontFamily: 'Arial', fill: '#E8E8F0', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(11);
  pauseBtn.on('pointerdown', () => { if (!scene.gameOver) pauseGame(scene); });

  // Streak bar
  scene.streakBg = scene.add.rectangle(w / 2, ARENA_TOP + 90, 120, 6, 0x263238).setDepth(6);
  scene.streakFill = scene.add.rectangle(w / 2 - 60, ARENA_TOP + 90, 0, 6, COLORS.comboBar)
    .setOrigin(0, 0.5).setDepth(7);
  scene.streakText = scene.add.text(w / 2, ARENA_TOP + 102, '', {
    fontSize: '11px', fontFamily: 'Arial', fill: COLORS.streakText, fontStyle: 'bold'
  }).setOrigin(0.5, 0).setDepth(7);
  updateStreakDisplay(scene);
}

function updateStreakDisplay(scene) {
  const s = Math.min(GameState.streak, 20);
  const fillW = (s / 20) * 120;
  scene.streakFill.setSize(fillW, 6);
  if (GameState.streak >= 5) {
    scene.streakText.setText(getComboMultiplier() + 'x STREAK');
  } else {
    scene.streakText.setText('');
  }
}

function getComboMultiplier() {
  const s = GameState.streak;
  if (s >= 15) return 3.0;
  if (s >= 10) return 2.0;
  if (s >= 5) return 1.5;
  return 1.0;
}

function pauseGame(scene) {
  if (scene.paused || scene.gameOver) return;
  scene.paused = true;
  scene.physics.pause();

  const w = GAME_WIDTH, h = GAME_HEIGHT;
  scene.pauseGroup = scene.add.group();

  const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x0A0A0F, 0.85).setDepth(20);
  scene.pauseGroup.add(overlay);

  const title = scene.add.text(w / 2, h * 0.25, 'PAUSED', {
    fontSize: '28px', fontFamily: 'Arial', fill: '#FFFFFF', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(21);
  scene.pauseGroup.add(title);

  const btns = [
    { label: 'Resume', y: h * 0.4, action: () => resumeGame(scene) },
    { label: 'Help', y: h * 0.5, action: () => {
      scene.scene.launch('HelpScene', { returnTo: 'GameScene' });
    }},
    { label: 'Restart', y: h * 0.6, action: () => {
      destroyPause(scene);
      GameState.reset();
      scene.scene.stop('GameScene');
      scene.scene.start('GameScene');
    }},
    { label: 'Menu', y: h * 0.7, action: () => {
      destroyPause(scene);
      scene.scene.stop('GameScene');
      scene.scene.start('MenuScene');
    }}
  ];

  btns.forEach(b => {
    const btn = scene.add.rectangle(w / 2, b.y, 200, 48, 0x1A1A2E)
      .setStrokeStyle(1, 0x444466).setDepth(21).setInteractive({ useHandCursor: true });
    const txt = scene.add.text(w / 2, b.y, b.label, {
      fontSize: '16px', fontFamily: 'Arial', fill: '#E8E8F0'
    }).setOrigin(0.5).setDepth(22);
    btn.on('pointerdown', () => { playUIClick(); b.action(); });
    scene.pauseGroup.add(btn);
    scene.pauseGroup.add(txt);
  });
}

function resumeGame(scene) {
  destroyPause(scene);
  scene.paused = false;
  scene.physics.resume();
}

function destroyPause(scene) {
  if (scene.pauseGroup) {
    scene.pauseGroup.getChildren().forEach(c => c.destroy());
    scene.pauseGroup.destroy(true);
    scene.pauseGroup = null;
  }
}
