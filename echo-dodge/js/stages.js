// Echo Dodge - Stage Generation & Difficulty
function getDifficultyParams(stageNum) {
  const S = stageNum;
  const isRest = isRestStage(S);
  let enemyCount = Math.min(3, 1 + Math.floor(S / 4));
  if (S >= 41) enemyCount = 3 + Math.floor(Math.random() * 2); // 3-4
  if (isRest) enemyCount = Math.max(1, enemyCount - 1);

  const enemySpeedBase = ENEMY.BASE_SPEED + S * ENEMY.SPEED_SCALE;
  const enemySpeed = Math.min(ENEMY.MAX_SPEED, enemySpeedBase);
  const trailLifetime = TRAIL.LIFETIME_BASE_MS + Math.min(1000, S * 25);
  let stageDuration = Math.min(STAGE.DURATION_MAX, STAGE.DURATION_BASE + Math.floor(S / 2));
  if (isRest) stageDuration = Math.max(5, stageDuration - STAGE.REST_DURATION_REDUCTION);

  const nearMissPx = Math.max(12, TRAIL.NEAR_MISS_PX - Math.floor(S / 5));
  const isPulseEnabled = S >= 26;

  return { enemyCount, enemySpeed, trailLifetime, stageDuration, nearMissPx, isPulseEnabled, isRest };
}

function isRestStage(stageNum) {
  return stageNum > 1 && stageNum % STAGE.REST_INTERVAL === 0;
}

function getEnemySpawnPositions(count, gameW, gameH, playerX, playerY) {
  const positions = [];
  const pad = ENEMY.SPAWN_PADDING;
  const edges = [
    (t) => ({ x: pad + t * (gameW - 2 * pad), y: pad }),
    (t) => ({ x: gameW - pad, y: pad + t * (gameH - 2 * pad) }),
    (t) => ({ x: pad + t * (gameW - 2 * pad), y: gameH - pad }),
    (t) => ({ x: pad, y: pad + t * (gameH - 2 * pad) })
  ];

  const angleStep = (2 * Math.PI) / count;
  const baseAngle = Math.random() * Math.PI * 2;
  const seed = Date.now() % 100000;

  for (let i = 0; i < count; i++) {
    const angle = baseAngle + i * angleStep;
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    let x, y;
    if (Math.abs(nx) > Math.abs(ny)) {
      x = nx > 0 ? gameW - pad : pad;
      y = gameH / 2 + ny * (gameH / 2 - pad);
    } else {
      y = ny > 0 ? gameH - pad : pad;
      x = gameW / 2 + nx * (gameW / 2 - pad);
    }
    const dx = x - playerX, dy = y - playerY;
    if (Math.sqrt(dx * dx + dy * dy) < ENEMY.SPAWN_MIN_DIST) {
      x = gameW - x;
      y = gameH - y;
    }
    x = Phaser.Math.Clamp(x, pad, gameW - pad);
    y = Phaser.Math.Clamp(y, pad, gameH - pad);
    positions.push({ x, y });
  }
  return positions;
}
