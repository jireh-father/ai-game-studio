// Lag Shot - Wave Generation & Stage System

function getWaveParams(waveNumber) {
  const enemyCount = Math.min(1 + Math.floor(waveNumber / 3), MAX_ENEMIES_ON_SCREEN);
  const arcSpeedMult = Math.min(1.0 + waveNumber * 0.04, 2.5);
  const arcPredictability = Math.max(0.3, 1.0 - waveNumber * 0.015);
  const arcDurationMs = Math.max(1600, 4000 - waveNumber * 50);

  // Rest wave every 10th
  if (waveNumber > 0 && waveNumber % 10 === 0) {
    return { enemyCount: 1, enemyTypes: ['basic'], arcDurationMs: 4000, arcSpeedMult: 1.0, arcPredictability: 1.0 };
  }

  const enemyTypes = getEnemyTypesForWave(waveNumber);
  return { enemyCount, enemyTypes, arcDurationMs, arcSpeedMult, arcPredictability };
}

function getEnemyTypesForWave(wave) {
  const pool = ['basic'];
  if (wave >= 8) pool.push('fast');
  if (wave >= 13) pool.push('splitter');
  if (wave >= 21) pool.push('shield');
  if (wave >= 36) pool.push('zigzag');
  return pool;
}

function selectEnemyType(typesPool, waveNumber) {
  // Higher waves bias toward harder types
  const seed = waveNumber * 7919 + Date.now() % 100000;
  const idx = Math.floor(pseudoRandom(seed) * typesPool.length);
  return typesPool[idx];
}

function pseudoRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getSpawnPosition(edge, playerX, playerY) {
  const margin = 10;
  let x, y;
  switch (edge) {
    case 'top':
      x = margin + Math.random() * (GAME_WIDTH - margin * 2);
      y = -10;
      break;
    case 'bottom':
      x = margin + Math.random() * (GAME_WIDTH - margin * 2);
      y = GAME_HEIGHT + 10;
      break;
    case 'left':
      x = -10;
      y = HUD_HEIGHT + Math.random() * (GAME_HEIGHT - HUD_HEIGHT - margin);
      break;
    case 'right':
      x = GAME_WIDTH + 10;
      y = HUD_HEIGHT + Math.random() * (GAME_HEIGHT - HUD_HEIGHT - margin);
      break;
  }
  // Ensure >= 100px from player
  const dx = x - playerX, dy = y - playerY;
  if (Math.sqrt(dx * dx + dy * dy) < 100) {
    // Shift along edge
    if (edge === 'top' || edge === 'bottom') {
      x = (x + 150) % GAME_WIDTH;
    } else {
      y = HUD_HEIGHT + ((y - HUD_HEIGHT + 150) % (GAME_HEIGHT - HUD_HEIGHT));
    }
  }
  return { x, y };
}

function computeArc(spawnX, spawnY, targetX, targetY, predictability) {
  const midX = (spawnX + targetX) / 2;
  const midY = (spawnY + targetY) / 2;
  const offset = predictability * 120;
  const angle1 = Math.random() * Math.PI * 2;
  const angle2 = Math.random() * Math.PI * 2;
  return {
    cp1x: midX + Math.cos(angle1) * offset * (0.5 + Math.random() * 0.5),
    cp1y: midY + Math.sin(angle1) * offset * (0.5 + Math.random() * 0.5),
    cp2x: midX + Math.cos(angle2) * offset * (0.3 + Math.random() * 0.3),
    cp2y: midY + Math.sin(angle2) * offset * (0.3 + Math.random() * 0.3)
  };
}

function getRandomEdge() {
  const edges = ['top', 'right', 'bottom', 'left'];
  return edges[Math.floor(Math.random() * edges.length)];
}

function cubicBezier(t, p0, p1, p2, p3) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}
