// Gravity Liar - Visual Effects & Particles

function spawnParticles(scene, x, y, count, key) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 200;
    const p = scene.add.image(x, y, key).setScale(0.6 + Math.random() * 0.4).setDepth(9);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(angle) * speed * 0.4,
      y: y + Math.sin(angle) * speed * 0.4,
      alpha: 0, scale: 0, duration: 350 + Math.random() * 100,
      onComplete: () => p.destroy()
    });
  }
}

function showFloatingText(scene, x, y, text, color, size, big) {
  const ft = scene.add.text(x, y, text, {
    fontSize: (size || 16) + 'px', fontFamily: 'Arial',
    fill: color || '#00E5FF', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(10);
  if (big) ft.setScale(0.5);
  scene.tweens.add({
    targets: ft, y: y - 50, alpha: 0, scale: big ? 1.2 : 1,
    duration: 600, onComplete: () => ft.destroy()
  });
}

function addScore(scene, pts) {
  GameState.score += Math.floor(pts);
  if (scene.scoreText) {
    scene.scoreText.setText('' + GameState.score);
    scene.tweens.add({
      targets: scene.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 80,
      yoyo: true, ease: 'Back.easeOut'
    });
  }
}

function doWallTapEffects(scene, side, px, py) {
  // Hit-stop via setTimeout
  scene.physics.pause();
  setTimeout(() => { if (scene.scene.isActive()) scene.physics.resume(); }, 35);

  // Scale punch on ball
  scene.tweens.add({
    targets: scene.ball, scaleX: 1.35, scaleY: 1.35, duration: 90,
    yoyo: true, ease: 'Back.easeOut'
  });

  // Camera shake + zoom
  scene.cameras.main.shake(120, 0.003);
  scene.cameras.main.zoomTo(1.02, 50);
  scene.time.delayedCall(100, () => scene.cameras.main.zoomTo(1, 200));

  // Wall flash
  const flash = side === -1 ? scene.leftFlash : scene.rightFlash;
  flash.setAlpha(0.8);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 120 });

  // Particles
  const pCount = 12 + Math.min(GameState.streak, 15);
  const pKey = GameState.streak >= 10 ? 'particleGold' : 'particle';
  spawnParticles(scene, side === -1 ? WALL_W : GAME_WIDTH - WALL_W, py, pCount, pKey);
}

function doDeathEffects(scene) {
  // Death explosion particles
  spawnParticles(scene, scene.ball.x, scene.ball.y, 20, 'particleRed');

  // Screen shake
  scene.cameras.main.shake(350, 0.012);

  // Red vignette flash
  scene.redFlash.setAlpha(0.35);
  scene.tweens.add({ targets: scene.redFlash, alpha: 0, duration: 400 });

  // Ball shrink
  scene.tweens.add({
    targets: scene.ball, scaleX: 0, scaleY: 0, duration: 200
  });

  playDeathSound();
}

function doLieSwitchEffects(scene) {
  // Arrow glitch animation
  const origAngle = scene.arrow.angle;
  scene.tweens.add({
    targets: scene.arrow, angle: origAngle + 720, duration: 150, ease: 'Linear',
    onComplete: () => scene.updateArrowDisplay()
  });

  // Purple edge flash
  scene.edgeFlash.setAlpha(0.6);
  scene.tweens.add({ targets: scene.edgeFlash, alpha: 0, duration: 200 });

  // "!!!" text
  const bangTxt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, '!!!', {
    fontSize: '28px', fontFamily: 'Arial', fill: '#CE93D8', fontStyle: 'bold'
  }).setOrigin(0.5).setScale(0.5).setDepth(10);
  scene.tweens.add({
    targets: bangTxt, scale: 1.3, duration: 150,
    yoyo: true, onComplete: () => bangTxt.destroy()
  });

  playLieSwitchSound();
}

function doStageClearEffects(scene) {
  spawnParticles(scene, GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 30, 'particle');

  const clearTxt = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 'STAGE CLEAR!', {
    fontSize: '24px', fontFamily: 'Arial', fill: '#00FF88', fontStyle: 'bold'
  }).setOrigin(0.5).setScale(0).setDepth(10);
  scene.tweens.add({
    targets: clearTxt, scale: 1.1, duration: 300, ease: 'Back.easeOut',
    hold: 600, onComplete: () => {
      scene.tweens.add({ targets: clearTxt, alpha: 0, duration: 300,
        onComplete: () => clearTxt.destroy()
      });
    }
  });

  playStageClearSound();
  scene.cameras.main.shake(150, 0.005);
}
