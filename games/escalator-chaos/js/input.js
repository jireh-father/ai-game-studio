// Escalator Chaos - Input Handling & Swipe Logic

const InputHandler = {
  setup(scene) {
    scene.swipeStart = null;
    scene.swipeTarget = null;

    scene.input.on('pointerdown', (ptr) => {
      if (scene.state.gameOver) return;
      scene.swipeStart = { x: ptr.x, y: ptr.y };
      scene.swipeTarget = InputHandler.getFrontCommuter(scene, ptr.x, ptr.y);
      scene.state.lastInputTime = scene.time.now;
    });

    scene.input.on('pointerup', (ptr) => {
      if (scene.state.gameOver || !scene.swipeStart) return;
      const dx = ptr.x - scene.swipeStart.x;
      const dy = ptr.y - scene.swipeStart.y;

      if (scene.swipeTarget && Math.abs(dx) >= TIMING.SWIPE_THRESHOLD_X && Math.abs(dx) > Math.abs(dy)) {
        SwipeActions.handleSwipe(scene, scene.swipeTarget, dx > 0 ? 'right' : 'left');
      } else if (scene.swipeTarget && dy < -TIMING.SWIPE_THRESHOLD_Y && scene.state.streak >= 5) {
        SwipeActions.handlePowerSwipe(scene, scene.swipeTarget);
      }
      scene.state.lastInputTime = scene.time.now;
      scene.swipeStart = null;
      scene.swipeTarget = null;
    });
  },

  getFrontCommuter(scene, px, py) {
    let best = null;
    const pad = 15;
    for (const c of scene.commuters) {
      if (c.swiped) continue;
      if (!StageManager.isInSwipeZone(c)) continue;
      const dx = Math.abs(px - c.x);
      const dy = Math.abs(py - c.y);
      if (dx < LAYOUT.COMMUTER_SIZE / 2 + pad && dy < LAYOUT.COMMUTER_H / 2 + pad) {
        if (!best || c.y > best.y) best = c;
      }
    }
    if (!best) {
      for (const c of scene.commuters) {
        if (c.swiped) continue;
        if (!StageManager.isInSwipeZone(c)) continue;
        if (!best || c.y > best.y) best = c;
      }
    }
    return best;
  }
};

const SwipeActions = {
  handleSwipe(scene, commuter, direction) {
    if (commuter.swiped) return;
    commuter.swiped = true;
    const correct = commuter.destination === direction;
    const targetX = direction === 'left' ? LAYOUT.ESCALATOR_LEFT_X : LAYOUT.ESCALATOR_RIGHT_X;

    if (correct) {
      SwipeActions.onCorrect(scene, commuter, targetX);
    } else {
      SwipeActions.onWrong(scene, commuter, direction, targetX);
    }
  },

  onCorrect(scene, commuter, targetX) {
    scene.state.streak++;
    let points = SCORING.CORRECT_BASE;
    const mult = Math.min(SCORING.MAX_MULTIPLIER, Math.floor(scene.state.streak / SCORING.STREAK_DIVISOR));
    if (mult >= 1) points = SCORING.CORRECT_BASE * (mult + 1);
    if (commuter.type === 'vip') points *= SCORING.VIP_MULTIPLIER;
    scene.state.score += points;

    // Hit-stop
    scene.tweens.timeScale = 0;
    scene.time.delayedCall(30, () => { scene.tweens.timeScale = 1; });

    // Fly-out animation
    scene.tweens.add({
      targets: commuter.sprite,
      x: targetX, scaleX: 0, scaleY: 0, alpha: 0,
      duration: 200, onComplete: () => commuter.sprite.destroy()
    });
    scene.tweens.add({
      targets: commuter.icon,
      x: targetX, alpha: 0, duration: 150,
      onComplete: () => commuter.icon.destroy()
    });

    // Particles
    scene.spawnParticles(commuter.x, commuter.y, 0x57CC99, 8);
    if (commuter.type === 'vip') {
      scene.spawnParticles(commuter.x, commuter.y, 0xFFD700, 12);
    }

    // Camera shake
    scene.cameras.main.shake(100, 0.003);

    // Events to HUD
    scene.events.emit('correctFlash');
    scene.events.emit('scorePopup', {
      x: commuter.x, y: commuter.y, points: points,
      color: commuter.type === 'vip' ? '#FFD700' : '#57CC99',
      big: commuter.type === 'vip'
    });

    // Streak milestones
    if ([2, 3, 5, 10].includes(scene.state.streak)) {
      scene.events.emit('streakMilestone', scene.state.streak);
    }

    // Stage progress
    scene.state.correctInStage++;
    if (scene.state.correctInStage >= TIMING.CORRECT_PER_STAGE) {
      scene.advanceStage();
    }

    scene.emitHUD();
    scene.removeCommuter(commuter);
  },

  onWrong(scene, commuter, direction, targetX) {
    if (commuter.type === 'vip') {
      scene.state.score = Math.max(0, scene.state.score + SCORING.VIP_WRONG_PENALTY);
      scene.events.emit('scorePopup', {
        x: commuter.x, y: commuter.y, points: SCORING.VIP_WRONG_PENALTY,
        color: '#FF6B6B', big: true
      });
    }
    scene.state.streak = 0;
    commuter.swiped = false;

    const origX = commuter.x;
    scene.tweens.add({
      targets: commuter.sprite,
      x: targetX, duration: 100,
      onComplete: () => {
        scene.tweens.add({
          targets: commuter.sprite,
          x: origX, scaleX: 1.2, scaleY: 1.2, duration: 100,
          onComplete: () => {
            scene.tweens.add({
              targets: commuter.sprite,
              scaleX: 1, scaleY: 1, duration: 100
            });
          }
        });
      }
    });
    scene.tweens.add({
      targets: commuter.icon,
      x: targetX, duration: 100, yoyo: true
    });

    scene.cameras.main.shake(250, 0.008);
    scene.events.emit('wrongFlash');
    scene.emitHUD();
  },

  handlePowerSwipe(scene, commuter) {
    if (commuter.swiped) return;
    commuter.swiped = true;
    scene.state.streak = 0;

    scene.tweens.add({
      targets: [commuter.sprite, commuter.icon],
      y: '-=120', alpha: 0, scaleX: 0.5, scaleY: 0.5,
      duration: 300, onComplete: () => {
        commuter.sprite.destroy();
        commuter.icon.destroy();
      }
    });
    scene.spawnParticles(commuter.x, commuter.y, 0xEAEAEA, 6);
    scene.removeCommuter(commuter);
    scene.emitHUD();
  }
};
