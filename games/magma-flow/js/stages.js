// stages.js — Stage generation for Magma Flow

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateObstacles(rng, stageNum) {
  const count = Math.min(4, Math.floor((stageNum - 10) / 3) + 1);
  const obstacles = [];
  for (let i = 0; i < count; i++) {
    const cx = 60 + rng() * 240;
    const cy = 250 + rng() * 300;
    const hw = 15 + rng() * 20;
    const hh = 10 + rng() * 15;
    // irregular polygon vertices
    const verts = [];
    const sides = 6 + Math.floor(rng() * 3);
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const rx = hw + (rng() - 0.5) * 10;
      const ry = hh + (rng() - 0.5) * 8;
      verts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
    }
    obstacles.push({ cx, cy, verts });
  }
  return obstacles;
}

function generateStage(stageNum) {
  const rng = seededRandom(stageNum * 7919);
  const W = 360;

  const sourceCount = CONFIG.getSourceCount(stageNum);
  const sources = [];
  for (let i = 0; i < sourceCount; i++) {
    const spacing = W / (sourceCount + 1);
    sources.push({
      x: spacing * (i + 1) + (rng() - 0.5) * 60,
      y: 100,
      flowRate: CONFIG.getFlowRate(stageNum)
    });
  }

  const targetCount = CONFIG.getTargetCount(stageNum);
  const targets = [];
  for (let i = 0; i < targetCount; i++) {
    const spacing = W / (targetCount + 1);
    const tw = CONFIG.getTargetWidth(stageNum);
    targets.push({
      x: spacing * (i + 1) + (rng() - 0.5) * 40,
      y: 670,
      width: tw,
      height: 50,
      moving: CONFIG.hasMovingTargets(stageNum) && (i === 0 || rng() > 0.5),
      moveSpeed: 0.5 + rng() * 0.5,
      moveRange: 30 + rng() * 20
    });
  }

  const obstacles = CONFIG.hasObstacles(stageNum) ? generateObstacles(rng, stageNum) : [];

  return {
    sources,
    targets,
    obstacles,
    timeLimit: CONFIG.getTimeLimit(stageNum),
    maxWalls: CONFIG.getMaxWalls(stageNum),
    wallTTL: CONFIG.getWallTTL(stageNum)
  };
}
