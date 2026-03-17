// Echo Strike - Stage Generation & Halton Sequence
function haltonSequence(index, base) {
  let result = 0;
  let f = 1 / base;
  let i = index;
  while (i > 0) {
    result += f * (i % base);
    i = Math.floor(i / base);
    f /= base;
  }
  return result;
}

function getStageParams(stageN) {
  const isRest = isRestStage(stageN);
  const restMult = isRest ? (1 + STAGE_CONFIG.REST_DIFFICULTY_REDUCTION) : 1;
  const restWindowBonus = isRest ? 50 : 0;

  const targetCount = Math.min(3 + Math.floor(stageN / 5), 6);
  const pulseCycle = Math.max(2200 - stageN * 20, 900) * restMult;
  const hitWindow = Math.min(Math.max(500 - stageN * 5, 250) + restWindowBonus, 550);
  const fastPulserChance = stageN >= 11 ? Math.min(0.1 + (stageN - 11) * 0.02, 0.4) : 0;
  const decoyChance = stageN >= 16 ? Math.min(0.05 + (stageN - 16) * 0.02, 0.3) : 0;
  const missPenalty = Math.min(WALL_CONFIG.MISS_PENALTY_BASE + Math.floor(stageN / 3) * 3, 50);
  const targetRadius = Math.max(44 - Math.floor(stageN / 5) * 2, 30);
  const hitsRequired = getHitsRequired(stageN);

  let fastPulserCount = 0;
  let decoyCount = 0;
  if (fastPulserChance > 0) {
    fastPulserCount = isRest ? Math.max(shouldIntroduceFastPulser(stageN) - 1, 0) : shouldIntroduceFastPulser(stageN);
  }
  if (decoyChance > 0) {
    decoyCount = shouldIntroduceDecoy(stageN);
  }

  return {
    targetCount, pulseCycle, hitWindow, fastPulserChance, decoyChance,
    missPenalty, targetRadius, hitsRequired, fastPulserCount, decoyCount, isRest
  };
}

function shouldIntroduceFastPulser(stageN) {
  if (stageN < 11) return 0;
  return Math.min(1 + Math.floor((stageN - 11) / 7), 3);
}

function shouldIntroduceDecoy(stageN) {
  if (stageN < 16) return 0;
  return Math.min(1 + Math.floor((stageN - 16) / 10), 3);
}

function isRestStage(stageN) {
  return stageN > 1 && stageN % STAGE_CONFIG.REST_STAGE_INTERVAL === 0;
}

function getHitsRequired(stageN) {
  return Math.min(STAGE_CONFIG.HITS_PER_STAGE_BASE + Math.floor(stageN / 3), STAGE_CONFIG.HITS_PER_STAGE_CAP);
}

function generateTargetPositions(stageN, count, wallBounds) {
  const positions = [];
  const minDist = 100;
  const seed = stageN * 1000 + (Date.now() % 100000);
  const margin = 50;

  const minX = wallBounds.left + margin;
  const maxX = wallBounds.right - margin;
  const minY = wallBounds.top + margin;
  const maxY = wallBounds.bottom - margin;

  const areaW = maxX - minX;
  const areaH = maxY - minY;

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const hIdx = seed + i * 20 + attempt;
      const hx = haltonSequence(hIdx + 1, 2);
      const hy = haltonSequence(hIdx + 1, 3);
      const x = minX + hx * areaW;
      const y = minY + hy * areaH;

      let valid = true;
      for (const p of positions) {
        const dx = p.x - x;
        const dy = p.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < minDist) {
          valid = false;
          break;
        }
      }
      if (valid) {
        positions.push({ x, y });
        placed = true;
        break;
      }
    }
    if (!placed) {
      // Fallback: place in least occupied quadrant
      const quadrants = [
        { x: minX + areaW * 0.25, y: minY + areaH * 0.25 },
        { x: minX + areaW * 0.75, y: minY + areaH * 0.25 },
        { x: minX + areaW * 0.25, y: minY + areaH * 0.75 },
        { x: minX + areaW * 0.75, y: minY + areaH * 0.75 }
      ];
      let bestQ = quadrants[0];
      let bestDist = 0;
      for (const q of quadrants) {
        let closest = Infinity;
        for (const p of positions) {
          const d = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
          if (d < closest) closest = d;
        }
        if (closest > bestDist) { bestDist = closest; bestQ = q; }
      }
      positions.push({ x: bestQ.x, y: bestQ.y });
    }
  }
  return positions;
}

function assignTargetTypes(stageN, count) {
  const params = getStageParams(stageN);
  const types = [];
  let fastCount = params.fastPulserCount;
  let decoyCount = params.decoyCount;

  for (let i = 0; i < count; i++) {
    if (decoyCount > 0 && i >= count - decoyCount) {
      types.push('decoy');
      decoyCount--;
    } else if (fastCount > 0 && i >= count - params.fastPulserCount - params.decoyCount) {
      types.push('fast');
      fastCount--;
    } else {
      types.push('normal');
    }
  }
  // Shuffle
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}
