// physics.js — Lava particle physics, collision, rendering

const LavaPhysics = {
  emitLava(scene, delta) {
    scene.emitElapsed += delta;
    if (scene.emitElapsed >= scene.emitDuration) {
      scene.lavaFlowing = false;
      return;
    }
    scene.stageData.sources.forEach((src, si) => {
      scene.emitTimers[si] += delta;
      const interval = 1000 / CONFIG.PARTICLE_RATE;
      while (scene.emitTimers[si] >= interval) {
        scene.emitTimers[si] -= interval;
        if (scene.particles.length < CONFIG.PARTICLE_POOL_SIZE) {
          scene.particles.push({
            x: src.x + (Math.random() - 0.5) * 10,
            y: src.y + 20,
            vx: (Math.random() - 0.5) * 30,
            vy: 20 + Math.random() * 20,
            state: 'flowing', hardenTimer: 0,
            inTarget: false, age: 0
          });
          scene.totalEmitted++;
        }
      }
    });
  },

  updateParticles(scene, delta) {
    const dt = delta / 1000;
    scene.particles.forEach(p => {
      if (p.state === 'hardened' || p.inTarget) return;
      p.age += delta;
      p.vy += CONFIG.GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Boundary collisions
      if (p.x < CONFIG.LAVA_RADIUS) { p.x = CONFIG.LAVA_RADIUS; p.vx = Math.abs(p.vx) * 0.5; }
      if (p.x > 360 - CONFIG.LAVA_RADIUS) { p.x = 360 - CONFIG.LAVA_RADIUS; p.vx = -Math.abs(p.vx) * 0.5; }
      if (p.y > 720 - CONFIG.LAVA_RADIUS) { p.y = 720 - CONFIG.LAVA_RADIUS; p.vy = -Math.abs(p.vy) * 0.3; p.vx *= 0.8; }
      // Wall collisions
      scene.walls.forEach(w => LavaPhysics.collideWall(scene, p, w));
      // Obstacle collisions
      scene.stageData.obstacles.forEach(o => LavaPhysics.collideObstacle(p, o));
      // Target check
      LavaPhysics.checkCapture(scene, p);
      // Harden check
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed < CONFIG.HARDEN_VELOCITY) {
        p.hardenTimer += delta;
        if (p.hardenTimer >= CONFIG.HARDEN_TIME) p.state = 'hardened';
      } else {
        p.hardenTimer = 0;
      }
    });
  },

  collideWall(scene, p, w) {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return;
    let t = ((p.x - w.x1) * dx + (p.y - w.y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = w.x1 + t * dx, cy = w.y1 + t * dy;
    const distX = p.x - cx, distY = p.y - cy;
    const dist = Math.sqrt(distX * distX + distY * distY);
    const hitR = CONFIG.WALL_COLLISION_WIDTH / 2 + CONFIG.LAVA_RADIUS;
    if (dist < hitR && dist > 0) {
      const nx = distX / dist, ny = distY / dist;
      p.x = cx + nx * hitR;
      p.y = cy + ny * hitR;
      const dot = p.vx * nx + p.vy * ny;
      p.vx -= 2 * dot * nx * CONFIG.WALL_RESTITUTION;
      p.vy -= 2 * dot * ny * CONFIG.WALL_RESTITUTION;
      scene.spawnSpark(cx, cy, CONFIG.COL_LAVA_HOT, 4);
      scene.playSound(300 + Math.random() * 200, 100, 'triangle', 0.2);
    }
  },

  collideObstacle(p, o) {
    const verts = o.verts;
    for (let i = 0; i < verts.length; i++) {
      const v1 = verts[i], v2 = verts[(i + 1) % verts.length];
      const edx = v2.x - v1.x, edy = v2.y - v1.y;
      const len2 = edx * edx + edy * edy;
      if (len2 === 0) continue;
      let t = ((p.x - v1.x) * edx + (p.y - v1.y) * edy) / len2;
      t = Math.max(0, Math.min(1, t));
      const cx = v1.x + t * edx, cy = v1.y + t * edy;
      const dx = p.x - cx, dy = p.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.LAVA_RADIUS + 4 && dist > 0) {
        const nx = dx / dist, ny = dy / dist;
        p.x = cx + nx * (CONFIG.LAVA_RADIUS + 4);
        p.y = cy + ny * (CONFIG.LAVA_RADIUS + 4);
        const dot = p.vx * nx + p.vy * ny;
        p.vx -= 1.5 * dot * nx;
        p.vy -= 1.5 * dot * ny;
      }
    }
  },

  checkCapture(scene, p) {
    scene.stageData.targets.forEach((t, i) => {
      const hw = t.width / 2;
      if (p.x > t.x - hw && p.x < t.x + hw && p.y > t.y && p.y < t.y + t.height) {
        if (!p.inTarget) {
          p.inTarget = true;
          p.state = 'captured';
          scene.totalCaptured++;
          scene.drawCauldron(scene.targetObjs[i], t,
            Math.min(1, scene.totalCaptured / Math.max(1, scene.totalEmitted)));
          scene.playSound(500 + scene.totalCaptured * 5, 150, 'sine', 0.3);
        }
      }
    });
  },

  renderLava(scene) {
    scene.lavaGfx.clear();
    scene.particles.forEach(p => {
      if (p.inTarget) return;
      let col;
      if (p.state === 'hardened') col = CONFIG.COL_LAVA_HARD;
      else {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        col = speed > 100 ? CONFIG.COL_LAVA_HOT : speed > 40 ? CONFIG.COL_LAVA_WARM : CONFIG.COL_LAVA_COOL;
      }
      if (p.state !== 'hardened') {
        scene.lavaGfx.fillStyle(CONFIG.COL_LAVA_WARM, 0.2);
        scene.lavaGfx.fillCircle(p.x, p.y, CONFIG.LAVA_RADIUS + 4);
      }
      scene.lavaGfx.fillStyle(col, 1);
      scene.lavaGfx.fillCircle(p.x, p.y, p.state === 'hardened' ? 6 : CONFIG.LAVA_RADIUS);
    });
  },

  renderWalls(scene) {
    scene.wallGfx.clear();
    scene.walls.forEach(w => {
      const alpha = Math.max(0, 1 - Math.max(0, w.age - (w.ttl - 1000)) / 1000);
      scene.wallGfx.lineStyle(10, CONFIG.COL_WALL, alpha * 0.3);
      scene.wallGfx.lineBetween(w.x1, w.y1, w.x2, w.y2);
      scene.wallGfx.lineStyle(CONFIG.WALL_WIDTH, CONFIG.COL_WALL, alpha);
      scene.wallGfx.lineBetween(w.x1, w.y1, w.x2, w.y2);
    });
  },

  updateSparks(scene, delta) {
    if (!scene.sparks) return;
    const dt = delta / 1000;
    scene.fxGfx.clear();
    scene.sparks = scene.sparks.filter(s => {
      s.life -= delta;
      if (s.life <= 0) return false;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 200 * dt;
      const a = s.life / s.maxLife;
      scene.fxGfx.fillStyle(s.color, a);
      scene.fxGfx.fillCircle(s.x, s.y, 3 * a);
      return true;
    });
  }
};
