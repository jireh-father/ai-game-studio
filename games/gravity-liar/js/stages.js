// Gravity Liar - Stage Configuration & Lie Pattern System

function getStageConfig(n) {
  const isRest = isRestStage(n);
  let gravityMag = Math.min(120 + n * 8, MAX_GRAVITY);
  let ballInitSpeed = Math.min(40 + n * 3, MAX_BALL_SPEED);
  let duration, deathZoneH, arrowCount, lieSwitchInterval;

  if (n <= 3) duration = 12000;
  else if (n <= 6) duration = 15000;
  else if (n <= 15) duration = 20000;
  else duration = 25000;

  if (n <= 10) deathZoneH = 28;
  else if (n <= 20) deathZoneH = 32;
  else deathZoneH = 36;

  arrowCount = n >= 12 ? 2 : 1;
  lieSwitchInterval = getLieSwitchInterval(n);

  // Rest stage adjustments
  if (isRest) {
    gravityMag *= 0.9;
    ballInitSpeed *= 0.9;
    lieSwitchInterval = null;
  }

  const lieOffset = resolveLieOffset(n, 0);
  const seed = n * 7919 + (Date.now() % 100000);

  return {
    stage: n, duration, gravityMag, ballInitSpeed,
    lieOffset, lieSwitchInterval, arrowCount, deathZoneH,
    isRest, seed
  };
}

function getLieSwitchInterval(n) {
  if (n < 7) return null;
  if (n <= 9) return 15000;
  if (n <= 11) return 10000;
  if (n <= 14) return 10000;
  return 8000;
}

function resolveLieOffset(n, switchCount) {
  if (n <= 1) return 0; // Stage 1: always truth
  if (n === 2) return Math.random() < 0.1 ? 90 : 0; // 10% lie chance

  const idx = ((n - 1) + switchCount) % LIE_TABLE.length;
  return LIE_TABLE[idx];
}

function getNextLieOffset(current) {
  const options = [0, 90, 180, 270].filter(a => a !== current);
  return options[Math.floor(Math.random() * options.length)];
}

function getLieChance(n) {
  if (n <= 1) return 0;
  if (n === 2) return 0.1;
  if (n <= 4) return 0.3;
  if (n <= 6) return 0.5;
  return 1.0; // stages 7+: lie is fixed per interval, switches on timer
}

function isRestStage(n) {
  return n > 1 && n % 5 === 0;
}

function isMilestoneStage(n) {
  return n % 5 === 0 && n > 0;
}

function getMilestoneText(n) {
  if (n === 5) return 'REST STAGE';
  if (n === 7) return 'NEW: Arrow switches mid-stage!';
  if (n === 10) return 'REST STAGE - Breathe!';
  if (n === 12) return 'NEW: Two arrows! One lies!';
  if (n === 15) return 'REST STAGE';
  if (n === 20) return 'EXPERT MODE!';
  if (n % 5 === 0) return 'REST STAGE';
  return null;
}

// Second arrow lie offset (always different from first)
function getSecondArrowOffset(firstOffset) {
  return getNextLieOffset(firstOffset);
}

// For two-arrow stages: one tells truth (offset=0), one lies
function getTwoArrowConfig(n, switchCount) {
  const truthArrowOffset = 0;
  const lieArrowOffset = resolveLieOffset(n, switchCount);
  // Ensure lie arrow actually lies
  const finalLie = lieArrowOffset === 0 ? 180 : lieArrowOffset;
  // Randomize which is left/right
  const seed = n * 31 + switchCount;
  const swap = seed % 2 === 0;
  return {
    arrow1Offset: swap ? truthArrowOffset : finalLie,
    arrow2Offset: swap ? finalLie : truthArrowOffset
  };
}
