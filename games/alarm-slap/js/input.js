// input.js — Input handling: tap, swipe, double-tap detection

const GameInput = {
  setup(scene) {
    scene.input.on('pointerdown', (pointer) => {
      if (scene.gameOver || scene.paused) return;
      scene.lastInputTime = scene.time.now;
      scene.idleWarned = false;
      scene.pointerDownPos = { x: pointer.x, y: pointer.y, time: scene.time.now };
      AudioManager.resume();
    });

    scene.input.on('pointerup', (pointer) => {
      if (scene.gameOver || scene.paused || !scene.pointerDownPos) return;
      const dx = pointer.x - scene.pointerDownPos.x;
      const dy = pointer.y - scene.pointerDownPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.SWIPE_MIN_DIST) {
        GameInput.handleTap(scene, pointer.x, pointer.y);
      } else {
        GameInput.handleSwipe(scene, scene.pointerDownPos.x, scene.pointerDownPos.y, pointer.x, pointer.y);
      }
      scene.pointerDownPos = null;
    });
  },

  findNearestAlarm(scene, x, y, maxDist) {
    let nearest = null;
    let nearestDist = maxDist;
    for (const alarm of scene.alarms) {
      if (alarm.dead) continue;
      const d = Phaser.Math.Distance.Between(x, y, alarm.x, alarm.y);
      if (d < nearestDist) { nearestDist = d; nearest = alarm; }
    }
    return nearest;
  },

  handleTap(scene, x, y) {
    const now = scene.time.now;
    const nearest = GameInput.findNearestAlarm(scene, x, y, CONFIG.ALARM_HIT_RADIUS);
    if (!nearest) return;

    const isDoubleTap = (now - scene.lastTapTime < CONFIG.DOUBLE_TAP_MS) &&
      Phaser.Math.Distance.Between(x, y, scene.lastTapX, scene.lastTapY) < 50;

    scene.lastTapTime = now;
    scene.lastTapX = x;
    scene.lastTapY = y;

    if (nearest.type === CONFIG.ALARM_TYPES.MUFFLER) {
      scene.slapMuffler(nearest, x, y);
    } else if (isDoubleTap) {
      scene.smashAlarm(nearest, x, y);
    } else {
      scene.slapAlarm(nearest, x, y, false);
    }
  },

  handleSwipe(scene, x1, y1, x2, y2) {
    const swipeAngle = Math.atan2(y2 - y1, x2 - x1);
    let nearest = null;
    let nearestDist = CONFIG.ALARM_HIT_RADIUS + 20;

    for (const alarm of scene.alarms) {
      if (alarm.dead) continue;
      const d = Phaser.Math.Distance.Between(x1, y1, alarm.x, alarm.y);
      if (d < nearestDist) {
        if (alarm.vx !== 0 || alarm.vy !== 0) {
          const moveAngle = Math.atan2(alarm.vy, alarm.vx);
          let angleDiff = Math.abs(swipeAngle - moveAngle) * (180 / Math.PI);
          if (angleDiff > 180) angleDiff = 360 - angleDiff;
          if (angleDiff > CONFIG.SWIPE_DIR_TOLERANCE) continue;
        }
        nearestDist = d;
        nearest = alarm;
      }
    }

    if (!nearest) {
      for (const alarm of scene.alarms) {
        if (alarm.dead) continue;
        const d = Phaser.Math.Distance.Between(x2, y2, alarm.x, alarm.y);
        if (d < CONFIG.ALARM_HIT_RADIUS) { nearest = alarm; break; }
      }
    }

    if (nearest) {
      if (nearest.type === CONFIG.ALARM_TYPES.MUFFLER) {
        scene.slapMuffler(nearest, x2, y2);
      } else {
        scene.slapAlarm(nearest, x1, y1, true);
      }
    }
  },
};
