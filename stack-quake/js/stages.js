// Stack Quake - Stage Generation & Quake Math

function getFloorParams(floorNumber) {
  const amplitude = Math.min(QUAKE_BASE_AMPLITUDE + (floorNumber * QUAKE_AMPLITUDE_PER_FLOOR), QUAKE_MAX_AMPLITUDE);
  const baseFreq = Math.min(QUAKE_BASE_FREQ + (floorNumber * QUAKE_FREQ_INCREMENT), QUAKE_MAX_FREQ);
  const blockSpeed = Math.min(BASE_BLOCK_SPEED + (floorNumber * SPEED_INCREMENT), MAX_BLOCK_SPEED);
  const patternIndex = Math.floor((floorNumber - 1) / 5) % 3;
  let pattern = patternIndex;
  let jitter = 0;
  let patternLabel = '';

  if (floorNumber <= 5) {
    pattern = QUAKE_PATTERNS.SINE;
    jitter = 0;
    patternLabel = 'SINE WAVE';
  } else if (floorNumber <= 10) {
    pattern = QUAKE_PATTERNS.SINE;
    jitter = 0;
    patternLabel = 'SINE WAVE';
  } else if (floorNumber <= 15) {
    pattern = QUAKE_PATTERNS.SINE;
    jitter = 4;
    patternLabel = 'SINE + JITTER';
  } else if (floorNumber <= 20) {
    pattern = QUAKE_PATTERNS.DOUBLE;
    jitter = 4;
    patternLabel = 'DOUBLE FREQUENCY';
  } else if (floorNumber <= 30) {
    pattern = QUAKE_PATTERNS.DOUBLE;
    jitter = 8;
    patternLabel = 'COMPOUND SHAKE';
  } else if (floorNumber <= 50) {
    pattern = floorNumber % 2 === 0 ? QUAKE_PATTERNS.DOUBLE : QUAKE_PATTERNS.RANDOM;
    jitter = 10;
    patternLabel = 'MAX AMPLITUDE';
  } else {
    pattern = [QUAKE_PATTERNS.SINE, QUAKE_PATTERNS.RANDOM, QUAKE_PATTERNS.DOUBLE][floorNumber % 3];
    jitter = 12;
    patternLabel = 'FULL CHAOS';
  }

  return { amplitude, baseFreq, blockSpeed, pattern, jitter, patternLabel };
}

function computeQuakeOffset(t, params) {
  let offset = 0;
  const { amplitude, baseFreq, pattern, jitter } = params;

  if (pattern === QUAKE_PATTERNS.SINE) {
    offset = Math.sin(t * baseFreq) * amplitude;
  } else if (pattern === QUAKE_PATTERNS.RANDOM) {
    // Seeded pseudo-random noise
    const seed = Math.sin(t * 0.01) * 10000;
    offset = ((seed - Math.floor(seed)) * 2 - 1) * amplitude;
  } else if (pattern === QUAKE_PATTERNS.DOUBLE) {
    offset = Math.sin(t * baseFreq * 2) * amplitude * 0.7 +
             Math.sin(t * baseFreq * 3) * amplitude * 0.3;
  }

  // Add jitter
  if (jitter > 0) {
    const j = Math.sin(t * 0.037) * Math.cos(t * 0.053);
    offset += j * jitter;
  }

  return offset;
}

function isPatternChange(floorNumber) {
  if (floorNumber > 1 && floorNumber % 5 === 1) {
    const params = getFloorParams(floorNumber);
    return { changed: true, label: params.patternLabel };
  }
  return { changed: false, label: '' };
}

function isQuakeEvent(floorNumber) {
  return floorNumber > 0 && floorNumber % 10 === 0;
}
