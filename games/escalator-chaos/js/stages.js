// Escalator Chaos - Stage Generation & Commuter Spawning

const StageManager = {
  getParams(stageNum) {
    const N = stageNum;
    return {
      spawnInterval: Math.max(0.6, 2.0 - (N * 0.09)),
      maxQueueSize: Math.min(7, 3 + Math.floor(N / 2)),
      touristChance: Math.min(0.4, N * 0.025),
      confusedChance: Math.min(0.35, Math.max(0, (N - 4) * 0.04)),
      sprintChance: Math.min(0.25, Math.max(0, (N - 10) * 0.03)),
      vipChance: Math.min(0.15, Math.max(0, (N - 5) * 0.02)),
      doubleSpawnChance: Math.min(0.3, Math.max(0, (N - 8) * 0.035))
    };
  },

  pickCommuterType(params) {
    const r = Math.random();
    let cum = 0;
    cum += params.sprintChance;
    if (r < cum) return 'sprint';
    cum += params.vipChance;
    if (r < cum) return 'vip';
    cum += params.confusedChance;
    if (r < cum) return 'confused';
    cum += params.touristChance;
    if (r < cum) return 'tourist';
    return 'normal';
  },

  createCommuter(scene, type, xOffset) {
    const dest = Math.random() < 0.5 ? 'left' : 'right';
    const cfg = COMMUTER_TYPES[type] || COMMUTER_TYPES.normal;
    const x = GAME_WIDTH / 2 + (xOffset || 0);
    const y = LAYOUT.QUEUE_TOP - 20;

    const sprite = scene.add.image(x, y, 'commuter_' + type);
    sprite.setDisplaySize(LAYOUT.COMMUTER_SIZE, LAYOUT.COMMUTER_H);
    sprite.setDepth(5);
    sprite.setInteractive();

    // Destination icon
    const iconColor = dest === 'right' ? '#57CC99' : '#E94560';
    const iconChar = dest === 'right' ? '\u25B2' : '\u25BC';
    const icon = scene.add.text(x, y - 38, iconChar, {
      fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
      color: iconColor, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(6);

    const commuter = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: type,
      destination: dest,
      displayedDestination: dest,
      speed: cfg.speed,
      sprite: sprite,
      icon: icon,
      y: y,
      x: x,
      swiped: false,
      paused: false,
      pauseTimer: 0,
      confusedFlipped: false,
      confusedFlipY: 0
    };

    // Tourist: set pause point
    if (type === 'tourist') {
      commuter.pauseY = LAYOUT.QUEUE_TOP + 60 + Math.random() * 80;
    }

    // Confused: set icon flip point
    if (type === 'confused') {
      commuter.confusedFlipY = LAYOUT.QUEUE_TOP + 40 + Math.random() * 100;
    }

    // VIP spawn ring
    if (type === 'vip') {
      const ring = scene.add.graphics();
      ring.lineStyle(2, 0xFFD700, 1);
      ring.strokeCircle(0, 0, 30);
      ring.setPosition(x, y);
      ring.setDepth(4);
      scene.tweens.add({
        targets: ring, scaleX: 1.3, scaleY: 1.3, alpha: 0,
        duration: 600, onComplete: () => ring.destroy()
      });
      scene.tweens.add({
        targets: ring, scaleX: 0, scaleY: 0, duration: 1,
        delay: 0, onStart: () => { ring.setScale(0); },
        onComplete: () => {}
      });
      // Proper scale-in ring
      ring.setScale(0);
      scene.tweens.add({
        targets: ring, scaleX: 1.3, scaleY: 1.3,
        duration: 300, ease: 'Back.easeOut',
        onComplete: () => {
          scene.tweens.add({
            targets: ring, alpha: 0, duration: 300,
            onComplete: () => ring.destroy()
          });
        }
      });
    }

    return commuter;
  },

  updateCommuter(scene, commuter, delta) {
    if (commuter.swiped) return;

    // Tourist pause logic
    if (commuter.type === 'tourist' && !commuter.paused && commuter.y >= commuter.pauseY && commuter.pauseTimer === 0) {
      commuter.paused = true;
      commuter.pauseTimer = 1500;
      // Camera flash effect
      const flash = scene.add.rectangle(commuter.x, commuter.y, 48, 60, 0xFFFFFF, 0.8);
      flash.setDepth(7);
      scene.tweens.add({
        targets: flash, alpha: 0, duration: 100,
        onComplete: () => flash.destroy()
      });
    }

    if (commuter.paused) {
      commuter.pauseTimer -= delta;
      if (commuter.pauseTimer <= 0) {
        commuter.paused = false;
        commuter.pauseTimer = 0;
      }
      return;
    }

    // Confused icon flip
    if (commuter.type === 'confused' && !commuter.confusedFlipped && commuter.y >= commuter.confusedFlipY) {
      commuter.confusedFlipped = true;
      commuter.displayedDestination = commuter.displayedDestination === 'left' ? 'right' : 'left';
      const iconColor = commuter.displayedDestination === 'right' ? '#57CC99' : '#E94560';
      const iconChar = commuter.displayedDestination === 'right' ? '\u25B2' : '\u25BC';
      commuter.icon.setText(iconChar);
      commuter.icon.setColor(iconColor);
      // Flip animation
      scene.tweens.add({
        targets: [commuter.sprite, commuter.icon],
        scaleX: 0, duration: 80, yoyo: true,
        onYoyo: () => {}
      });
    }

    // Move down
    const dy = commuter.speed * (delta / 1000);
    commuter.y += dy;
    commuter.sprite.y = commuter.y;
    commuter.icon.y = commuter.y - 38;
  },

  isInSwipeZone(commuter) {
    return commuter.y >= LAYOUT.SWIPE_ZONE_TOP && commuter.y <= LAYOUT.SWIPE_ZONE_BOTTOM;
  },

  isOverflowed(commuter) {
    return commuter.y >= LAYOUT.OVERFLOW_Y;
  }
};
