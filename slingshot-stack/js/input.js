// Slingshot Stack - Slingshot Input, Drag, Release, Trajectory

function setupSlingshotInput(scene) {
  scene.input.on('pointerdown', (p) => {
    if (scene.inputDisabled || scene.isFlinging || scene.isCollapsing || scene.isPaused) return;
    if (p.x > scene.w - 44 && p.y < 44) return;

    const dx = p.x - scene.slingshotX;
    const dy = p.y - (scene.slingshotY - 50) + scene.cameras.main.scrollY;
    if (Math.sqrt(dx * dx + dy * dy) < CONFIG.GAMEPLAY.GRAB_RADIUS * 2) {
      scene.isDragging = true;
      scene.dragStart = { x: p.x, y: p.y };
      scene.lastInputTime = Date.now();
      scene.inactivityTriggered = false;
    }
  });

  scene.input.on('pointermove', (p) => {
    if (!scene.isDragging || scene.inputDisabled) return;
    scene.lastInputTime = Date.now();
    updateDrag(scene, p);
  });

  scene.input.on('pointerup', (p) => {
    if (!scene.isDragging || scene.inputDisabled) return;
    scene.isDragging = false;
    scene.lastInputTime = Date.now();
    releaseSlingshot(scene, p);
  });
}

function updateDrag(scene, p) {
  const sx = scene.slingshotX, sy = scene.slingshotY - 50;
  const dx = p.x - sx, dy = p.y - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < CONFIG.GAMEPLAY.CANCEL_DISTANCE) {
    scene.bandGfx.clear();
    scene.trajectoryGfx.clear();
    Phaser.Physics.Matter.Matter.Body.setPosition(scene.currentBlock, { x: sx, y: sy });
    scene.currentBlockGfx.setPosition(sx, sy);
    return;
  }

  const maxDrag = 120;
  const clampDist = Math.min(dist, maxDrag);
  const nx = sx + (dx / dist) * clampDist;
  const ny = sy + (dy / dist) * clampDist;
  Phaser.Physics.Matter.Matter.Body.setPosition(scene.currentBlock, { x: nx, y: ny });
  scene.currentBlockGfx.setPosition(nx, ny);

  // Scale punch proportional to drag
  const s = 1 + 0.15 * (clampDist / maxDrag);
  scene.currentBlockGfx.setScale(s);

  // Draw elastic band
  scene.bandGfx.clear();
  scene.bandGfx.lineStyle(4, CONFIG.COLORS.SLINGSHOT_BAND);
  scene.bandGfx.lineBetween(sx - 14, sy + 10 - 50, nx, ny);
  scene.bandGfx.lineBetween(sx + 14, sy + 10 - 50, nx, ny);

  // Trajectory preview
  scene.trajectoryGfx.clear();
  const power = clampDist / maxDrag;
  const launchVx = -(dx / dist) * CONFIG.PHYSICS.MAX_LAUNCH_VELOCITY * power;
  const launchVy = -(dy / dist) * CONFIG.PHYSICS.MAX_LAUNCH_VELOCITY * power;
  const vis = stageManager.getTrajectoryVisibility(scene.blocksStacked);
  if (vis > 0) {
    const dots = Math.floor(CONFIG.GAMEPLAY.TRAJECTORY_DOTS * vis);
    const points = stageManager.calculateTrajectory(sx, sy, launchVx, launchVy, CONFIG.PHYSICS.GRAVITY_Y, dots);
    for (let i = 0; i < points.length; i++) {
      const alpha = 0.6 * (1 - i / points.length);
      scene.trajectoryGfx.fillStyle(0xFFFFFF, alpha);
      scene.trajectoryGfx.fillCircle(points[i].x, points[i].y, 3);
    }
  }
}

function releaseSlingshot(scene, p) {
  const sx = scene.slingshotX, sy = scene.slingshotY - 50;
  const dx = p.x - sx, dy = p.y - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  scene.bandGfx.clear();
  scene.trajectoryGfx.clear();
  scene.currentBlockGfx.setScale(1);

  if (dist < CONFIG.GAMEPLAY.CANCEL_DISTANCE) {
    Phaser.Physics.Matter.Matter.Body.setPosition(scene.currentBlock, { x: sx, y: sy });
    scene.currentBlockGfx.setPosition(sx, sy);
    return;
  }

  const maxDrag = 120;
  const power = Math.min(dist, maxDrag) / maxDrag;
  const vx = -(dx / dist) * CONFIG.PHYSICS.MAX_LAUNCH_VELOCITY * power;
  const vy = -(dy / dist) * CONFIG.PHYSICS.MAX_LAUNCH_VELOCITY * power;

  const Body = Phaser.Physics.Matter.Matter.Body;
  scene.currentBlock.ignoreGravity = false;
  scene.currentBlock.isSensor = false;
  Body.setVelocity(scene.currentBlock, { x: vx, y: vy });

  scene.isFlinging = true;
  scene.settleFrames = 0;

  // Launch juice
  scene.cameras.main.shake(100, 0.003);
  spawnParticles(scene, sx, sy, CONFIG.COLORS.SLINGSHOT_BAND, 12, 300);

  // Stuck timer
  scene.stuckTimer = setTimeout(() => {
    if (scene.isFlinging && !scene.isCollapsing) {
      onBlockMiss(scene);
    }
  }, CONFIG.GAMEPLAY.STUCK_TIMEOUT);
}

function autoFling(scene) {
  if (!scene.currentBlock || scene.isFlinging || scene.isCollapsing) return;
  const badAngle = (Math.random() * 60 + 30) * (Math.PI / 180);
  const dir = Math.random() < 0.5 ? -1 : 1;
  const vx = Math.cos(badAngle) * CONFIG.PHYSICS.MAX_LAUNCH_VELOCITY * 0.7 * dir;
  const vy = -Math.sin(badAngle) * CONFIG.PHYSICS.MAX_LAUNCH_VELOCITY * 0.5;

  const Body = Phaser.Physics.Matter.Matter.Body;
  scene.currentBlock.ignoreGravity = false;
  scene.currentBlock.isSensor = false;
  Body.setVelocity(scene.currentBlock, { x: vx, y: vy });
  scene.isFlinging = true;
  scene.settleFrames = 0;
  scene.stuckTimer = setTimeout(() => {
    if (scene.isFlinging && !scene.isCollapsing) onBlockMiss(scene);
  }, CONFIG.GAMEPLAY.STUCK_TIMEOUT);
}

function onBlockMiss(scene) {
  if (scene.isCollapsing) return;
  scene.isFlinging = false;
  if (scene.stuckTimer) { clearTimeout(scene.stuckTimer); scene.stuckTimer = null; }
  scene.misses++;
  updateMissIndicators(scene.hud, scene.misses);

  if (scene.currentBlock) {
    scene.time.delayedCall(0, () => {
      if (scene.currentBlock) {
        scene.matter.world.remove(scene.currentBlock);
        scene.currentBlock = null;
      }
      if (scene.currentBlockGfx) {
        scene.currentBlockGfx.destroy();
        scene.currentBlockGfx = null;
      }
    });
  }

  if (scene.misses >= CONFIG.GAMEPLAY.MAX_MISSES) {
    triggerCollapse(scene);
  } else {
    scene.time.delayedCall(500, () => {
      if (!scene.isCollapsing) scene.spawnBlock();
    });
  }
}
