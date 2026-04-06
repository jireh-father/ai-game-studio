// Stage generation — pure data functions, no Phaser dependency

const Stages = {
  getParams(stage) {
    const throwCount = Math.min(12, 3 + Math.floor(stage * 0.4));
    const throwInterval = Math.max(600, 1800 - stage * 50);
    const telegraphMs = Math.max(100, 250 - stage * 8);
    const speedMult = Math.min(2.2, 1.0 + stage * 0.04);
    const duration = Math.min(15000, 8000 + stage * 200);
    const isRest = stage % 10 === 0 && stage > 0;
    const simultaneous = stage >= 7 ? (stage >= 16 ? 3 : 2) : 1;
    return {
      throwCount: isRest ? Math.ceil(throwCount * 0.7) : throwCount,
      throwInterval: isRest ? throwInterval * 1.2 : throwInterval,
      telegraphMs,
      speedMult: isRest ? speedMult * 0.8 : speedMult,
      duration,
      simultaneous: isRest ? 1 : simultaneous,
      stage
    };
  },

  getProjectilePool(stage) {
    if (stage <= 3) return ['slipper'];
    if (stage <= 6) return ['slipper', 'slipper', 'remote'];
    if (stage <= 9) return ['slipper', 'remote', 'remote'];
    if (stage <= 12) return ['slipper', 'remote', 'pot'];
    if (stage <= 19) return ['slipper', 'remote', 'remote', 'pot'];
    return ['slipper', 'remote', 'pot', 'grandma_ball'];
  },

  pickProjectile(stage) {
    const pool = this.getProjectilePool(stage);
    return pool[Math.floor(Math.random() * pool.length)];
  },

  generateThrowSequence(params) {
    const seq = [];
    const seed = params.stage * 7919 + Date.now() % 100000;
    let lastLaneHint = -1;
    for (let i = 0; i < params.throwCount; i++) {
      const delay = STAGE_START_GRACE_MS + i * params.throwInterval;
      const simCount = Math.min(params.simultaneous, 1 + (i > params.throwCount * 0.6 ? 1 : 0));
      for (let s = 0; s < simCount; s++) {
        const type = Stages.pickProjectile(params.stage);
        const aimNoise = (Math.random() - 0.5) * 40;
        seq.push({ delay: delay + s * 150, type, aimNoise, telegraphMs: params.telegraphMs, speedMult: params.speedMult });
      }
    }
    return seq;
  },

  getBaseDuration(speedMult) {
    return 1200 / speedMult;
  }
};
