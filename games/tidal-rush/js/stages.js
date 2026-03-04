// Stage generation and difficulty scaling

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function isBossStage(n) { return n > 0 && n % 15 === 0; }
function isRestStage(n) { return n > 0 && n % 10 === 0 && !isBossStage(n); }

function generateStage(stageNum) {
  const rng = seededRandom(stageNum * 7919 + 42);
  const diff = getDifficultyForStage(stageNum);
  const rest = isRestStage(stageNum);
  const platformCount = Math.min(15 + Math.floor(stageNum / 3), 30);

  const platforms = [];
  let curX = 0;
  const baseY = CONFIG.HEIGHT - 180;

  for (let i = 0; i < platformCount; i++) {
    const isEasy = i < 3;
    const w = isEasy
      ? diff.platformMaxW
      : Math.floor(diff.platformMinW + rng() * (diff.platformMaxW - diff.platformMinW));
    const gap = isEasy
      ? diff.gapMin
      : Math.floor(diff.gapMin + rng() * (diff.gapMax - diff.gapMin));

    const yOff = isEasy ? 0 : Math.floor((rng() - 0.5) * 120);
    const y = Phaser.Math.Clamp(baseY + yOff, 200, CONFIG.HEIGHT - 120);

    let type = 'normal';
    if (!isEasy && !rest) {
      const roll = rng();
      if (roll < diff.crumbleChance) {
        type = 'crumble';
      } else if (roll < diff.crumbleChance + diff.movingChance) {
        type = 'moving';
      }
    }

    // No consecutive crumble + moving
    if (i > 0) {
      const prev = platforms[i - 1].type;
      if ((prev === 'crumble' && type === 'moving') || (prev === 'moving' && type === 'crumble')) {
        type = 'normal';
      }
    }

    const sinkMs = rest ? diff.sinkMs * 1.2 : diff.sinkMs;
    const moveSpeed = type === 'moving' ? (30 + rng() * 20) : 0;
    const moveRange = type === 'moving' ? (30 + rng() * 30) : 0;

    platforms.push({
      x: curX + gap + w / 2,
      y: y,
      width: w,
      type: type,
      sinkMs: sinkMs,
      moveSpeed: moveSpeed,
      moveRange: moveRange,
      index: i
    });

    curX = curX + gap + w;
  }

  return {
    platforms: platforms,
    isBoss: isBossStage(stageNum),
    isRest: rest,
    difficulty: diff,
    totalWidth: curX
  };
}

function getStageDifficulty(stageNum) {
  const diff = getDifficultyForStage(stageNum);
  const rest = isRestStage(stageNum);
  return {
    runSpeed: rest ? diff.runSpeed * 0.8 : diff.runSpeed,
    waterRise: rest ? diff.waterRise * 0.8 : diff.waterRise,
    sinkMs: rest ? diff.sinkMs * 1.2 : diff.sinkMs,
    isBoss: isBossStage(stageNum),
    isRest: rest
  };
}
