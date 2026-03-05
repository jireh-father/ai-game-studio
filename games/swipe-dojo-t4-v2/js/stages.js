// Swipe Dojo - Stage Generation
'use strict';

function getAttackWindow(stageNum) {
  return Math.max(220, 800 - stageNum * 10);
}

function getSequenceLength(stageNum) {
  return Math.min(6, 1 + Math.floor(stageNum / 6));
}

function getEnemyHP(stageNum) {
  return 3 + Math.floor(stageNum / 5);
}

function getFakeoutChance(stageNum) {
  if (stageNum <= 10) return 0;
  return Math.min((stageNum - 10) * 0.02, 0.25);
}

function getEnemyVariant(stageNum) {
  return ENEMY_VARIANTS[stageNum % 5];
}

function getEnemyName(stageNum) {
  return ENEMY_NAMES[(stageNum - 1) % ENEMY_NAMES.length];
}

function isBossStage(stageNum) {
  return stageNum % 5 === 0;
}

function isRestStage(stageNum) {
  return stageNum % 10 === 0;
}

function buildSequence(length, windowMs, fakeoutChance) {
  const seq = [];
  let prevDir = null;
  for (let i = 0; i < length; i++) {
    let dir;
    do {
      dir = DIRECTIONS[Math.floor(Math.random() * 4)];
    } while (dir === prevDir && length > 1);
    prevDir = dir;

    const hasFakeout = i > 0 && Math.random() < fakeoutChance;
    seq.push({
      direction: dir,
      windowMs: windowMs,
      fakeout: hasFakeout
    });
  }
  return seq;
}

function generateStage(stageNum) {
  let attackWindow = getAttackWindow(stageNum);
  let enemyHP = getEnemyHP(stageNum);
  const seqLen = getSequenceLength(stageNum);
  const fakeout = getFakeoutChance(stageNum);
  const variant = getEnemyVariant(stageNum);
  const name = getEnemyName(stageNum);
  const boss = isBossStage(stageNum);
  const rest = isRestStage(stageNum);

  if (rest) {
    enemyHP = Math.max(3, enemyHP - 2);
    attackWindow = Math.min(800, attackWindow + 100);
  }

  if (boss) {
    enemyHP += 2;
    attackWindow = Math.max(220, Math.floor(attackWindow * 0.9));
  }

  const sequence = buildSequence(seqLen, attackWindow, fakeout);

  return {
    stageNum,
    enemyHP,
    attackWindow,
    sequence,
    variant,
    name,
    isBoss: boss,
    isRest: rest,
    fillColor: VARIANT_COLORS[variant] || PALETTE.enemyFill,
    outlineColor: VARIANT_OUTLINES[variant] || PALETTE.enemyOutlineFill
  };
}
