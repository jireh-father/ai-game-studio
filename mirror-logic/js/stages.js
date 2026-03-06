// Mirror Logic - Stage Generation

class SeededRandom {
  constructor(seed) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  nextInt(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }
}

function generateStage(stageNum) {
  const rng = new SeededRandom(stageNum * 7919);
  const p = DIFFICULTY.getParams(stageNum);
  const isRest = DIFFICULTY.isRestStage(stageNum);
  const isBoss = DIFFICULTY.isBossStage(stageNum);

  let targetCount = p.targets;
  let timer = p.timer;
  if (isRest) { targetCount = Math.max(2, targetCount - 1); timer += 5; }
  if (isBoss) { targetCount = Math.min(targetCount + 1, 7); timer = Math.max(15, timer - 2); }

  const cols = p.cols, rows = p.rows;
  const occupied = new Set();
  const key = (c, r) => `${c},${r}`;

  // Place emitter on edge based on stage rotation
  const edgeIdx = (stageNum - 1) % 4;
  let emitter;
  if (edgeIdx === 0) { const r = rng.nextInt(1, rows - 2); emitter = { col: 0, row: r, dir: 'RIGHT' }; }
  else if (edgeIdx === 1) { const c = rng.nextInt(1, cols - 2); emitter = { col: c, row: 0, dir: 'DOWN' }; }
  else if (edgeIdx === 2) { const r = rng.nextInt(1, rows - 2); emitter = { col: cols - 1, row: r, dir: 'LEFT' }; }
  else { const c = rng.nextInt(1, cols - 2); emitter = { col: c, row: rows - 1, dir: 'UP' }; }
  occupied.add(key(emitter.col, emitter.row));

  function placeRandom() {
    for (let a = 0; a < 100; a++) {
      const c = rng.nextInt(0, cols - 1), r = rng.nextInt(0, rows - 1);
      if (!occupied.has(key(c, r))) { occupied.add(key(c, r)); return { col: c, row: r }; }
    }
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      if (!occupied.has(key(c, r))) { occupied.add(key(c, r)); return { col: c, row: r }; }
    }
    return null;
  }

  // Place targets
  const targets = [];
  for (let i = 1; i <= targetCount; i++) {
    const pos = placeRandom();
    if (pos) targets.push({ col: pos.col, row: pos.row, num: i });
  }

  // Place walls
  const walls = [];
  for (let i = 0; i < p.walls; i++) {
    const pos = placeRandom();
    if (pos) walls.push({ col: pos.col, row: pos.row, type: 'wall' });
  }

  // Place wall bombs
  for (let i = 0; i < p.wallBombs; i++) {
    const pos = placeRandom();
    if (pos) walls.push({ col: pos.col, row: pos.row, type: 'wallBomb' });
  }

  const mirrorBudget = Math.max(p.mirrors, targetCount + 1);
  const borderColor = isRest ? COLORS.SUCCESS : (isBoss ? COLORS.TARGET_HIT : null);

  return { cols, rows, emitter, targets, walls, mirrorBudget, timer, stageNum, isRest, isBoss, borderColor };
}

// Reflect direction when hitting a mirror
function reflectDir(dir, mirrorType) {
  // mirrorType: 45 means "/" (bottom-left to top-right)
  // mirrorType: 135 means "\" (top-left to bottom-right)
  if (mirrorType === 45) {
    // "/" mirror: swap and negate both components
    // RIGHT(1,0) -> UP(0,-1), LEFT(-1,0) -> DOWN(0,1), UP(0,-1) -> RIGHT(1,0), DOWN(0,1) -> LEFT(-1,0)
    return { dx: -dir.dy, dy: -dir.dx };
  } else {
    // "\" mirror: swap components
    // RIGHT(1,0) -> DOWN(0,1), LEFT(-1,0) -> UP(0,-1), UP(0,-1) -> LEFT(-1,0), DOWN(0,1) -> RIGHT(1,0)
    return { dx: dir.dy, dy: dir.dx };
  }
}

function traceLaser(emitter, mirrors, targets, walls, cols, rows) {
  let dir = { ...DIRECTIONS[emitter.dir] };
  let col = emitter.col + dir.dx;
  let row = emitter.row + dir.dy;
  const path = [{ col: emitter.col, row: emitter.row }];
  const hitTargets = [];
  const hitTargetSet = new Set();
  const bouncePoints = [];
  let hitWallBomb = false;
  const maxBounces = 20;
  let bounces = 0;
  let steps = 0;
  const maxSteps = (cols + rows) * 3;

  while (bounces < maxBounces && steps < maxSteps) {
    steps++;
    if (col < 0 || col >= cols || row < 0 || row >= rows) {
      path.push({ col: col, row: row });
      break;
    }
    const k = `${col},${row}`;

    // Check target (beam passes through)
    const target = targets.find(t => t.col === col && t.row === row);
    if (target) {
      if (!hitTargetSet.has(target.num)) {
        hitTargets.push(target.num);
        hitTargetSet.add(target.num);
        path.push({ col, row });
      }
      col += dir.dx; row += dir.dy;
      continue;
    }

    // Check wall
    const wall = walls.find(w => w.col === col && w.row === row);
    if (wall) {
      path.push({ col, row });
      if (wall.type === 'wallBomb') hitWallBomb = true;
      break;
    }

    // Check mirror
    const mirror = mirrors.find(m => m.col === col && m.row === row);
    if (mirror) {
      path.push({ col, row });
      bouncePoints.push({ col, row });
      dir = reflectDir(dir, mirror.angle);
      bounces++;
      col += dir.dx; row += dir.dy;
      continue;
    }

    // Empty cell - continue
    col += dir.dx; row += dir.dy;
  }

  if (path.length <= 1 || (path[path.length - 1].col === emitter.col && path[path.length - 1].row === emitter.row)) {
    const lastDir = { ...DIRECTIONS[emitter.dir] };
    path.push({ col: emitter.col + lastDir.dx * (cols + 1), row: emitter.row + lastDir.dy * (rows + 1) });
  }

  return { path, hitTargets, bouncePoints, hitWallBomb };
}
