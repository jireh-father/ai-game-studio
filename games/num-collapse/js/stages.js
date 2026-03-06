// stages.js - Wave progression, spawn system, special cell logic

function getWaveParams(waveNum) {
  if (waveNum <= 0) waveNum = 1;
  if (waveNum <= 7) return WAVES[waveNum];
  // Waves 8+: interpolate from wave 7
  const base = WAVES[7];
  return {
    interval: Math.max(2000, base.interval),
    pool: base.pool,
    weights: base.weights,
    frozen: Math.min(25, base.frozen + (waveNum - 7) * 2),
    wild: Math.min(10, base.wild + (waveNum - 7)),
    bomb: Math.min(10, base.bomb + (waveNum - 7))
  };
}

function pickSpawnNumber(pool, weights) {
  const totalW = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalW;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function pickSpecialType(params) {
  const roll = Math.random() * 100;
  if (roll < params.bomb) return 'bomb';
  if (roll < params.bomb + params.wild) return 'wild';
  if (roll < params.bomb + params.wild + params.frozen) return 'frozen';
  return 'normal';
}

function generateInitialBoard(cells) {
  // Place 4 numbers in ring 1 with at least one matching pair
  const ring1 = cells.filter(c => Math.abs(c.q) + Math.abs(c.r) + Math.abs(c.q + c.r) === 2);
  const shuffled = Phaser.Utils.Array.Shuffle(ring1.slice());
  const picks = shuffled.slice(0, 4);
  const nums = [1, 2, 3];
  const result = [];
  // First two cells get same number (guaranteed match)
  const matchNum = Phaser.Utils.Array.GetRandom(nums);
  result.push({ q: picks[0].q, r: picks[0].r, value: matchNum, type: 'normal' });
  result.push({ q: picks[1].q, r: picks[1].r, value: matchNum, type: 'normal' });
  // Ensure first two are adjacent
  const isAdj = ADJ_OFFSETS.some(([dq, dr]) =>
    picks[0].q + dq === picks[1].q && picks[0].r + dr === picks[1].r
  );
  if (!isAdj) {
    // Force adjacency: find a neighbor of picks[0] in ring1
    for (const [dq, dr] of ADJ_OFFSETS) {
      const nq = picks[0].q + dq, nr = picks[0].r + dr;
      const found = ring1.find(c => c.q === nq && c.r === nr);
      if (found && !(found.q === picks[0].q && found.r === picks[0].r)) {
        result[1] = { q: found.q, r: found.r, value: matchNum, type: 'normal' };
        break;
      }
    }
  }
  // Other two cells get random different numbers
  for (let i = 2; i < 4; i++) {
    const v = Phaser.Utils.Array.GetRandom(nums);
    result.push({ q: picks[i].q, r: picks[i].r, value: v, type: 'normal' });
  }
  return result;
}

function updateWave(elapsedMs) {
  return Math.floor(elapsedMs / 30000) + 1;
}

function getBombCountdown(wave) {
  return Math.max(6000, 10000 - (wave - 7) * 500);
}
