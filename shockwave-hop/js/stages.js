// Shockwave Hop - Stage Generation

function generateStage(stageNumber) {
  const s = stageNumber;
  const isRest = s % 5 === 0;
  const isBoss = s % 10 === 0;

  const ringsToCreate = Math.min(3 + Math.floor(s * 0.5), 8);
  const ringSpeed = Math.min(RING.baseSpeed + s * RING.speedPerStage, RING.maxSpeed);
  let spawnDelay = Math.max(RING.baseSpawnDelay - s * RING.delayReductionPerStage, RING.minSpawnDelay);
  if (isRest) spawnDelay += 200;

  let simultaneousRings = 1;
  if (s >= 16) simultaneousRings = 3;
  else if (s >= 8) simultaneousRings = 2;

  const orbCount = Math.min(Math.max(0, s - 3), 6);
  const spikeCount = Math.min(Math.max(0, Math.floor((s - 7) / 2)), 3);

  const spikePositions = generateSpikePositions(spikeCount);
  const orbPositions = generateOrbPositions(orbCount);

  return {
    stageNumber: s,
    ringsToCreate,
    ringSpeed,
    spawnDelay,
    simultaneousRings,
    orbCount,
    spikeCount,
    spikePositions,
    orbPositions,
    isRest,
    isBoss,
    hasMegaRing: isBoss
  };
}

function generateSpikePositions(count) {
  const positions = [];
  const minX = 40;
  const maxX = GAME.width - 40;
  const playerSafeZone = 60;

  for (let i = 0; i < count; i++) {
    let x, valid;
    let attempts = 0;
    do {
      valid = true;
      x = minX + Math.random() * (maxX - minX);
      if (Math.abs(x - GAME.playerStartX) < playerSafeZone) valid = false;
      for (const pos of positions) {
        if (Math.abs(x - pos) < 60) { valid = false; break; }
      }
      attempts++;
    } while (!valid && attempts < 50);
    positions.push(x);
  }
  return positions;
}

function generateOrbPositions(count) {
  const positions = [];
  const margin = 30;
  const minY = 120;
  const maxY = GAME.platformY - 80;

  for (let i = 0; i < count; i++) {
    let x, y, valid;
    let attempts = 0;
    do {
      valid = true;
      x = margin + Math.random() * (GAME.width - margin * 2);
      y = minY + Math.random() * (maxY - minY);
      for (const pos of positions) {
        const dist = Math.hypot(x - pos.x, y - pos.y);
        if (dist < 40) { valid = false; break; }
      }
      attempts++;
    } while (!valid && attempts < 50);
    positions.push({ x, y });
  }
  return positions;
}

function generateRingSpawnPoint(stageData) {
  const margin = 50;
  const x = margin + Math.random() * (GAME.width - margin * 2);
  const y = 80 + Math.random() * (GAME.platformY - 200);
  return { x, y };
}
