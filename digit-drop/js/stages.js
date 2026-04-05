function getStageParams(stageNumber) {
  let slotCount, dropTimerMs;
  if (stageNumber <= 3) { slotCount = 3; dropTimerMs = 3000; }
  else if (stageNumber <= 6) { slotCount = 4; dropTimerMs = 2800; }
  else if (stageNumber <= 10) { slotCount = 5; dropTimerMs = 2600; }
  else if (stageNumber <= 15) { slotCount = 5; dropTimerMs = 2400; }
  else if (stageNumber <= 20) { slotCount = 6; dropTimerMs = 2200; }
  else if (stageNumber <= 30) { slotCount = 7; dropTimerMs = 2000; }
  else { slotCount = 7; dropTimerMs = Math.max(TIMING.DROP_TIMER_MIN_MS, 2000 - (stageNumber - 30) * 25); }

  const targetPercentile = Math.max(0.15, 0.60 - (stageNumber * 0.007));
  const poisonRate = stageNumber >= 5 ? Math.min((stageNumber - 5) * 0.015, 0.20) : 0;
  const lockedSlots = stageNumber >= 35 ? Math.min(Math.floor((stageNumber - 35) / 10) + 1, 2) : 0;
  return { slotCount, dropTimerMs, targetPercentile, poisonRate, lockedSlots };
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDigitSequence(slotCount, poisonRate, seed) {
  const rng = seededRandom(seed);
  const digits = [];
  let hasHigh = false;
  for (let i = 0; i < slotCount; i++) {
    const value = Math.floor(rng() * 10);
    const isPoison = poisonRate > 0 && rng() < poisonRate;
    if (value >= 7) hasHigh = true;
    digits.push({ value, isPoison });
  }
  if (!hasHigh) {
    const idx = Math.floor(rng() * slotCount);
    digits[idx].value = 7 + Math.floor(rng() * 3);
  }
  return digits;
}

function calculateTarget(slotCount, targetPercentile) {
  const maxNum = Math.pow(10, slotCount) - 1;
  const minNum = Math.pow(10, slotCount - 1);
  const target = Math.floor(minNum + (maxNum - minNum) * (1 - targetPercentile));
  return target;
}

function formatTarget(targetInt, slotCount) {
  const str = String(targetInt).padStart(slotCount, '0');
  return str.split('');
}

function isRestStage(stageNumber) {
  return stageNumber > 1 && stageNumber % 10 === 0;
}

function getFormedNumber(slotValues) {
  return parseInt(slotValues.map(v => v === null ? '0' : String(v.effectiveValue !== undefined ? v.effectiveValue : v.value)).join(''), 10);
}

function calculateRoundScore(formedNumber, target, autoFillCount, streak, slotValues) {
  if (isNaN(formedNumber) || formedNumber < target) return 0;
  const margin = (formedNumber - target) / target;
  let base;
  if (margin >= 0.50) base = SCORING.BEAT_50_PLUS;
  else if (margin >= 0.25) base = SCORING.BEAT_25_49;
  else if (margin >= 0.10) base = SCORING.BEAT_10_24;
  else base = SCORING.BEAT_0_9;

  const highPositions = slotValues.slice(0, 2).every(v => v && v.value >= 8);
  if (highPositions) base += SCORING.CLEAN_SWEEP_BONUS;
  if (autoFillCount === 0) base += SCORING.FULL_CONTROL_BONUS;

  const streakIdx = Math.min(streak, SCORING.STREAK_LEVELS.length - 1);
  const multiplier = SCORING.STREAK_LEVELS[streakIdx];
  return Math.floor(base * multiplier);
}
