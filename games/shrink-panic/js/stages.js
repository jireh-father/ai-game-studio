// Shrink Panic - Stage/Target Spawn System
const StageManager = {
  getDifficulty(elapsed) {
    const tbl = CONFIG.DIFFICULTY;
    let i = tbl.length - 1;
    for (let j = tbl.length - 1; j >= 0; j--) {
      if (elapsed >= tbl[j].time) { i = j; break; }
    }
    if (i >= tbl.length - 1) return { ...tbl[tbl.length - 1] };
    const a = tbl[i], b = tbl[i + 1];
    const t = (elapsed - a.time) / (b.time - a.time);
    return {
      shrinkRate: a.shrinkRate + (b.shrinkRate - a.shrinkRate) * t,
      lifespan: a.lifespan + (b.lifespan - a.lifespan) * t,
      spawnInterval: a.spawnInterval + (b.spawnInterval - a.spawnInterval) * t,
      maxTargets: Math.floor(a.maxTargets + (b.maxTargets - a.maxTargets) * t),
      types: elapsed >= b.time ? b.types : a.types
    };
  },

  getTargetType(elapsed) {
    const diff = this.getDifficulty(elapsed);
    const types = diff.types;
    const r = Math.random();
    if (types.includes('fleeting') && r < 0.15) return 'fleeting';
    if (types.includes('decoy') && r < 0.25) return 'decoy';
    if (types.includes('small') && r < 0.50) return 'small';
    return 'normal';
  },

  generateTargetPosition(gw, gh, vp, elapsed, mercyMode) {
    const hud = CONFIG.GAMEPLAY.HUD_HEIGHT;
    const pad = 30;
    if (mercyMode || Math.random() < 0.4) {
      // Spawn inside viewport
      const x = vp.x + pad + Math.random() * Math.max(10, vp.width - pad * 2);
      const y = Math.max(vp.y + pad, hud + pad) + Math.random() * Math.max(10, vp.height - pad * 2);
      return { x: Phaser.Math.Clamp(x, pad, gw - pad), y: Phaser.Math.Clamp(y, hud + pad, gh - pad) };
    }
    // Spawn anywhere in full area
    const x = pad + Math.random() * (gw - pad * 2);
    const y = hud + pad + Math.random() * (gh - hud - pad * 2);
    return { x, y };
  },

  isInsideViewport(x, y, vp) {
    return x >= vp.x && x <= vp.x + vp.width && y >= vp.y && y <= vp.y + vp.height;
  },

  isNearEdge(x, y, vp) {
    const t = CONFIG.SCORING.EDGE_THRESHOLD;
    const dx = Math.min(Math.abs(x - vp.x), Math.abs(x - (vp.x + vp.width)));
    const dy = Math.min(Math.abs(y - vp.y), Math.abs(y - (vp.y + vp.height)));
    return dx <= t || dy <= t;
  },

  validateSpawn(x, y, existingTargets, type) {
    for (const t of existingTargets) {
      if (!t.active) continue;
      const dist = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (dist < 40) return false;
      if (type === 'decoy' && t.getData('type') !== 'decoy' && dist < 80) return false;
    }
    return true;
  }
};
