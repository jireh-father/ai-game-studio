// Slingshot Stack - Block Generation, Difficulty Scaling, Wind, Trajectory

class StageManager {
  constructor() {
    this.lastBlockTypes = [];
  }

  reset() {
    this.lastBlockTypes = [];
  }

  getDifficultyParam(table, blocksStacked) {
    for (const entry of table) {
      if (blocksStacked <= entry.max) return entry;
    }
    return table[table.length - 1];
  }

  generateNextBlock(blocksStacked) {
    // Rest block every 10th
    if (blocksStacked > 0 && blocksStacked % 10 === 0) {
      this.lastBlockTypes.push('SQUARE');
      return this.buildBlock('SQUARE', blocksStacked, 1.0);
    }

    const poolEntry = this.getDifficultyParam(CONFIG.DIFFICULTY.BLOCK_POOLS, blocksStacked);
    let typeKey = this.weightedRandom(poolEntry.types, poolEntry.weights);

    // Fairness: no more than 2 awkward shapes in a row
    const awkward = ['L_SHAPE', 'T_SHAPE'];
    if (awkward.includes(typeKey)) {
      const last2 = this.lastBlockTypes.slice(-2);
      if (last2.length === 2 && last2.every(t => awkward.includes(t))) {
        typeKey = Math.random() < 0.6 ? 'SQUARE' : 'RECT_WIDE';
      }
    }

    this.lastBlockTypes.push(typeKey);
    if (this.lastBlockTypes.length > 5) this.lastBlockTypes.shift();

    const scaleEntry = this.getDifficultyParam(CONFIG.DIFFICULTY.SCALE, blocksStacked);
    return this.buildBlock(typeKey, blocksStacked, scaleEntry.scale);
  }

  buildBlock(typeKey, blocksStacked, scale) {
    const type = CONFIG.BLOCK_TYPES[typeKey];
    const w = Math.round(type.w * scale);
    const h = Math.round(type.h * scale);
    const friction = typeKey === 'ICE' ? CONFIG.PHYSICS.ICE_FRICTION : CONFIG.PHYSICS.BLOCK_FRICTION;

    return {
      typeKey,
      label: type.label,
      width: w,
      height: h,
      color: type.color,
      strokeColor: CONFIG.BLOCK_STROKE[type.color] || 0x333333,
      friction,
      restitution: CONFIG.PHYSICS.BLOCK_RESTITUTION,
      density: CONFIG.PHYSICS.BLOCK_DENSITY,
      scale
    };
  }

  weightedRandom(items, weights) {
    let total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  getWindForce(blocksStacked) {
    if (blocksStacked <= 10) return { x: 0, direction: 'none' };
    const strength = Math.min(blocksStacked * 3, 80);
    const direction = Math.random() < 0.5 ? 'left' : 'right';
    return {
      x: direction === 'right' ? strength : -strength,
      direction
    };
  }

  getSwayParams(blocksStacked) {
    if (blocksStacked <= 20) return { amplitude: 0, period: 3000 };
    const amplitude = Math.min(blocksStacked * 0.15, 6);
    const period = Math.max(3000 - blocksStacked * 30, 1500);
    return { amplitude, period };
  }

  getTrajectoryVisibility(blocksStacked) {
    const entry = this.getDifficultyParam(CONFIG.DIFFICULTY.TRAJECTORY_VISIBILITY, blocksStacked);
    return entry.pct;
  }

  calculateTrajectory(sx, sy, vx, vy, gravity, steps) {
    const points = [];
    const dt = 1 / 60;
    let x = sx, y = sy, cvx = vx, cvy = vy;
    for (let i = 0; i < steps; i++) {
      x += cvx * dt * 16;
      cvy += gravity * dt * 16;
      y += cvy * dt * 16;
      points.push({ x, y });
    }
    return points;
  }
}

const stageManager = new StageManager();
